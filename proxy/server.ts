// Operator-hosted service. This file is NEVER distributed with the desktop runtime.
import { createServer, type IncomingMessage } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { planOutputSchema, draftContentSchema, ideaContentSchema } from '../src/lib/contracts';
import { instructions } from '../src/lib/ai-instructions';

const clientSchema = z.object({
  id: z.string().min(1).max(80), tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  dailyGenerations: z.number().int().positive().max(1000),
  monthlyBudgetCents: z.number().int().positive(), expiresAt: z.iso.datetime(), enabled: z.boolean(),
});
const clients = z.array(clientSchema).min(1).parse(JSON.parse(readFileSync(process.env.PROXY_CLIENTS_FILE || 'proxy/clients.private.json', 'utf8')));
if (new Set(clients.map(c => c.tokenHash)).size !== clients.length || new Set(clients.map(c => c.id)).size !== clients.length) throw new Error('Duplicate clients');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY must be supplied by the hosting secret store');
// Fixed model, bounded input/output. Reserve $0.10 per attempt, including failures.
// This conservative envelope covers <= 64 KiB UTF-8 input and 6500 output tokens
// at the documented gpt-4.1-mini rates. Re-evaluate before changing model/rates.
const COST_CENTS = 10;
const globalBudget = Number(process.env.PROXY_GLOBAL_MONTHLY_BUDGET_CENTS || 1000);
if (!Number.isSafeInteger(globalBudget) || globalBudget < COST_CENTS) throw new Error('Invalid global budget');
const dbPath = process.env.PROXY_DATABASE || './data/proxy-usage.db';
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS usage (client TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL, cents INTEGER NOT NULL, PRIMARY KEY(client,day))');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60000, maxRetries: 0 });
const requestSchema = z.object({ name: z.enum(['content_plan', 'alternative_idea', 'draft', 'revision']), task: z.string().min(1).max(3000), data: z.record(z.string(), z.unknown()) }).strict();
function reserve(client: z.infer<typeof clientSchema>) {
  const day = new Date().toISOString().slice(0, 10), month = day.slice(0, 7) + '%';
  db.exec('BEGIN IMMEDIATE');
  try {
    const daily = db.prepare('SELECT count FROM usage WHERE client=? AND day=?').get(client.id, day) as { count: number } | undefined;
    const own = db.prepare('SELECT coalesce(sum(cents),0) AS cents FROM usage WHERE client=? AND day LIKE ?').get(client.id, month) as { cents: number };
    const all = db.prepare('SELECT coalesce(sum(cents),0) AS cents FROM usage WHERE day LIKE ?').get(month) as { cents: number };
    if ((daily?.count || 0) >= client.dailyGenerations || own.cents + COST_CENTS > client.monthlyBudgetCents || all.cents + COST_CENTS > globalBudget) { db.exec('ROLLBACK'); return false; }
    db.prepare('INSERT INTO usage VALUES (?,?,1,?) ON CONFLICT(client,day) DO UPDATE SET count=count+1,cents=cents+excluded.cents').run(client.id, day, COST_CENTS);
    db.exec('COMMIT'); return true;
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 64000) throw new Error('Payload too large'); chunks.push(chunk); }
  return requestSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
}
let inFlight = 0;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status: number, error: string) => { res.writeHead(status); res.end(JSON.stringify({ error })); };
  if (req.method === 'GET' && req.url === '/health') { res.end('{"ok":true}'); return; }
  if (req.method !== 'POST' || req.url !== '/generate') { reply(404, 'Not found'); return; }
  const authorization = req.headers.authorization || '';
  if (!/^Bearer [a-zA-Z0-9_-]{32,200}$/.test(authorization)) { reply(401, 'Unauthorized'); return; }
  const hash = createHash('sha256').update(authorization.slice(7)).digest('hex');
  const client = clients.find(c => c.tokenHash === hash && c.enabled && Date.parse(c.expiresAt) > Date.now());
  if (!client) { reply(403, 'Client access inactive'); return; }
  if (inFlight >= 4) { reply(429, 'Service busy'); return; }
  if (!req.headers['content-type']?.startsWith('application/json')) { reply(415, 'JSON required'); return; }
  inFlight++;
  try {
    let input;
    try { input = await body(req); } catch { reply(400, 'Invalid or oversized request'); return; }
    // Enforce byte bound including the trusted instructions as well as the user input.
    if (Buffer.byteLength(instructions + input.task + JSON.stringify(input.data), 'utf8') > 64000) { reply(413, 'Context too large'); return; }
    if (!reserve(client)) { res.setHeader('Retry-After', '3600'); reply(429, 'Generation or spending limit reached'); return; }
    const schema = input.name === 'content_plan' ? planOutputSchema : input.name === 'alternative_idea' ? z.object({ idea: ideaContentSchema }) : draftContentSchema;
    const format = zodTextFormat(schema, input.name);
    const result = await openai.responses.create({ model: 'gpt-4.1-mini', store: false, instructions: instructions + '\n' + input.task,
      input: JSON.stringify(input.data), text: { format }, max_output_tokens: 6500 });
    if (result.status !== 'completed') { reply(502, 'Generation incomplete'); return; }
    const value = schema.parse(JSON.parse(result.output_text));
    res.end(JSON.stringify(value));
  } catch { reply(502, 'Generation unavailable'); }
  finally { inFlight--; }
});
server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxRequestsPerSocket = 100;
server.listen(Number(process.env.PORT || 8080), process.env.PROXY_HOST || '127.0.0.1', () => console.log('Bottomline AI proxy ready'));
process.on('SIGTERM', () => { server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(1), 65000).unref(); });
