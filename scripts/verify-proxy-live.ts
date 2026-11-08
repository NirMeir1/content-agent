import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createServer } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { seededState } from '../src/lib/demo';
import { context } from '../src/lib/ai';
import { planOutputSchema, draftContentSchema, validateFormat } from '../src/lib/contracts';
// Explicit operator-only verification. Never package this script or its output.
config({ path: '.env.local', quiet: true });
if (!process.env.OPENAI_API_KEY) throw new Error('No operator API key available');
const folder = path.resolve('output/proxy-live-' + Date.now()); fs.mkdirSync(folder, { recursive: true });
const token = randomBytes(32).toString('base64url');
const clients = path.join(folder, 'clients.json');
fs.writeFileSync(clients, JSON.stringify([{ id: 'verification', tokenHash: createHash('sha256').update(token).digest('hex'), dailyGenerations: 3, monthlyBudgetCents: 30, expiresAt: '2099-01-01T00:00:00.000Z', enabled: true }]));
const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = (probe.address() as { port: number }).port; await new Promise<void>(resolve => probe.close(() => resolve()));
const child = spawn(process.execPath, ['.proxy-build/server.cjs'], { stdio: 'ignore', env: { ...process.env, PORT: String(port), PROXY_CLIENTS_FILE: clients,
  PROXY_DATABASE: path.join(folder, 'usage.db'), PROXY_GLOBAL_MONTHLY_BUDGET_CENTS: '30', PROXY_HOST: '127.0.0.1', OPENAI_BASE_URL: 'https://api.openai.com/v1' } });
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:' + port + '/health')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  const state = seededState();
  async function generate(name: string, task: string, data: unknown) {
    const response = await fetch('http://127.0.0.1:' + port + '/generate', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, task, data }), signal: AbortSignal.timeout(70000) });
    assert.equal(response.status, 200, 'Live proxy returned status ' + response.status);
    return response.json();
  }
  const plan = planOutputSchema.parse(await generate('content_plan', 'בני תוכנית לחודש 2027-03 עם 8 רעיונות שונים, בכל 4 הפורמטים. התאריכים בחודש המבוקש בלבד.', { ...context(state), month: '2027-03', frequency: 2 }));
  assert.ok(plan.ideas.every(i => i.date.startsWith('2027-03')));
  console.log('PASS: live OpenAI plan through local proxy (structured schema and dates)');
  const idea = plan.ideas.find(i => i.format === 'post')!; assert.ok(idea);
  const draft = draftContentSchema.parse(await generate('draft', 'כתבי פוסט בעברית. ללא סיפורים אישיים מומצאים. slides, frames, scenes ריקים. כל מילה אסורה תישאר מחוץ לטקסט.', { ...context(state), idea }));
  validateFormat(draft, 'post');
  console.log('PASS: live OpenAI post draft through local proxy');
  const revision = draftContentSchema.parse(await generate('revision', 'קצרי את הטיוטה ושמרי על העובדות. פורמט post. slides, frames, scenes ריקים.', { ...context(state), idea, existing: draft, revisionRequest: 'קצר יותר' }));
  validateFormat(revision, 'post');
  fs.writeFileSync(path.join(folder, 'results.json'), JSON.stringify({ liveProvider: 'OpenAI', model: 'gpt-4.1-mini', passed: ['plan schema/dates', 'post draft schema/format', 'revision schema/format'], limitations: ['Local proxy only; no public deployment or packaged real-AI end-to-end verification', 'Content quality not assessed'] }, null, 2));
  console.log('PASS: live OpenAI revision through local proxy. Evidence: ' + folder);
} finally { child.kill(); }
