const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { timingSafeEqual } = require('node:crypto');
const root = __dirname;
const secret = process.env.BOTTOMLINE_DESKTOP_SECRET;
if (!secret) throw new Error('Desktop session missing');
let active = 0, closing = false;
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function (event, ...args) {
  if (event === 'request') {
    const [req, res] = args;
    const supplied = String(req.headers['x-bottomline-desktop'] || '');
    const expectedHost = '127.0.0.1:' + process.env.PORT;
    if (closing || req.headers.host !== expectedHost || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    active++;
    res.once('close', () => active--);
  }
  return emit.call(this, event, ...args);
};
process.parentPort.on('message', event => {
  if (event.data.type !== 'shutdown') return;
  closing = true;
  const deadline = Date.now() + 4500;
  const timer = setInterval(() => {
    if (active === 0 || Date.now() > deadline) { clearInterval(timer); process.exit(0); }
  }, 100);
});
(async () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, '.next', 'required-server-files.json'), 'utf8')).config;
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);
  require('next');
  const { startServer } = require('next/dist/server/lib/start-server');
  await startServer({ dir: root, isDev: false, hostname: '127.0.0.1', port: 0, allowRetry: false });
  process.parentPort.postMessage({ type: 'ready', port: Number(process.env.PORT) });
})().catch(error => {
  const diagnostic = String(error.code || error.name) + ': ' + String(error.message);
  try { fs.writeFileSync(path.join(path.dirname(require('node:url').fileURLToPath(process.env.DATABASE_URL)), 'startup-error.log'), diagnostic); } catch {}
  process.parentPort.postMessage({ type: 'error', diagnostic }); process.exit(1);
});
