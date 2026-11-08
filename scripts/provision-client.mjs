import { randomBytes, createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
const [id, endpoint] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]{1,60}$/.test(id) || !endpoint) throw new Error('Usage: node scripts/provision-client.mjs client-id https://proxy.example/generate');
const url = new URL(endpoint);
if (url.protocol !== 'https:' || url.pathname !== '/generate' || url.username || url.password || url.search || url.hash) throw new Error('Expected HTTPS /generate endpoint');
const token = randomBytes(32).toString('base64url');
const clientsFile = 'proxy/clients.private.json';
const clients = fs.existsSync(clientsFile) ? JSON.parse(fs.readFileSync(clientsFile, 'utf8')) : [];
if (clients.some(c => c.id === id)) throw new Error('Client already exists; revoke it explicitly before provisioning replacement access');
clients.push({ id, tokenHash: createHash('sha256').update(token).digest('hex'), dailyGenerations: 30, monthlyBudgetCents: 500,
  expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(), enabled: true });
fs.writeFileSync(clientsFile, JSON.stringify(clients, null, 2));
fs.writeFileSync('desktop/client.private.json', JSON.stringify({ proxyUrl: url.href, clientToken: token, credentialId: randomUUID() }));
console.log('Scoped client provisioned. No token printed. Rebuild the desktop package for this client.');
