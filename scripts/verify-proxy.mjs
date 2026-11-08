import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const folder = path.resolve('output/proxy-' + Date.now());
fs.mkdirSync(folder, { recursive: true });
const file = path.join(folder, 'clients.json');
const tokens = Object.fromEntries(['daily', 'budget', 'disabled', 'expired', 'global'].map(id => [id, randomBytes(32).toString('base64url')]));
const clients = Object.entries(tokens).map(([id, token]) => ({ id, tokenHash: createHash('sha256').update(token).digest('hex'), dailyGenerations: id === 'daily' ? 2 : 20,
  monthlyBudgetCents: id === 'budget' ? 10 : 100, expiresAt: id === 'expired' ? '2020-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z', enabled: id !== 'disabled' }));
fs.writeFileSync(file, JSON.stringify(clients));
const draft = { hook: 'בדיקת פרוקסי', caption: 'תוכן בדיקה בלבד', cta: '', hashtags: [], visual: '', slides: [], frames: [], scenes: [], factsUsed: [], checks: [] };
let upstreamCalls = 0, fail = false;
const upstream = createServer(async (req, res) => {
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  assert.equal(input.model, 'gpt-4.1-mini'); assert.equal(input.store, false); assert.equal(input.max_output_tokens, 6500);
  assert.equal(input.text.format.type, 'json_schema');
  upstreamCalls++;
  if (fail) { res.writeHead(503); res.end('{"error":{"message":"mock outage"}}'); return; }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ id: 'resp_mock', object: 'response', status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(draft), annotations: [] }] }] }));
});
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
const upstreamPort = upstream.address().port;
let child, port;
async function start() {
  const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve)); port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  child = spawn(process.execPath, ['.proxy-build/server.cjs'], { stdio: 'ignore', env: { ...process.env, OPENAI_API_KEY: 'mock-provider-key', OPENAI_BASE_URL: 'http://127.0.0.1:' + upstreamPort + '/v1', PORT: String(port),
    PROXY_CLIENTS_FILE: file, PROXY_DATABASE: path.join(folder, 'usage.db'), PROXY_GLOBAL_MONTHLY_BUDGET_CENTS: '30', PROXY_HOST: '127.0.0.1' } });
  for (let i = 0; i < 80; i++) { try { if ((await fetch('http://127.0.0.1:' + port + '/health')).ok) return; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error('Proxy did not start');
}
async function stop() { if (!child || child.exitCode !== null) return; const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited; }
function request(id, payload = { name: 'draft', task: 'כתוב טיוטת בדיקה', data: { profile: { business: 'בדיקה' } } }) {
  return fetch('http://127.0.0.1:' + port + '/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(id ? { Authorization: 'Bearer ' + tokens[id] } : {}) }, body: JSON.stringify(payload) });
}
try {
  await start();
  assert.equal((await request()).status, 401);
  assert.equal((await request('disabled')).status, 403);
  assert.equal((await request('expired')).status, 403);
  assert.equal((await request('daily', { name: 'unknown' })).status, 400);
  assert.equal((await request('daily', { name: 'draft', task: 'test', data: { huge: 'a'.repeat(65000) } })).status, 400);
  assert.equal(upstreamCalls, 0);
  assert.deepEqual(await (await request('daily')).json(), draft);
  fail = true; assert.equal((await request('daily')).status, 502); fail = false;
  assert.equal((await request('daily')).status, 429);
  assert.equal(upstreamCalls, 2);
  await stop(); await start();
  assert.equal((await request('daily')).status, 429);
  const raced = await Promise.all([request('budget'), request('budget')]);
  assert.deepEqual(raced.map(r => r.status).sort(), [200, 429]);
  assert.equal((await request('global')).status, 429);
  assert.equal(upstreamCalls, 3);
  clients.find(c => c.id === 'daily').enabled = false; fs.writeFileSync(file, JSON.stringify(clients));
  await stop(); await start(); assert.equal((await request('daily')).status, 403);
  fs.writeFileSync(path.join(folder, 'results.json'), JSON.stringify({ mockUpstream: true, passed: ['authorization', 'expiry', 'revocation', 'input/schema bounds', 'structured output forwarding', 'upstream failure', 'daily limits', 'persistent ledger', 'concurrent monthly client/global spending limits'], upstreamCalls }, null, 2));
  console.log('PASS: proxy authorization, revocation, failure handling and persistent/concurrent quota enforcement (mock OpenAI upstream). Evidence: ' + folder);
} finally { await stop(); upstream.close(); }
