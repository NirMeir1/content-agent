const { app, BrowserWindow, dialog, Menu, session, utilityProcess, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { pathToFileURL } = require('node:url');

app.setName('Bottomline Content Agent');
// A stable location independent of the portable extraction directory and version.
app.setPath('userData', process.env.BOTTOMLINE_DATA_DIR || path.join(app.getPath('appData'), 'Bottomline Content Agent'));
const dataDir = app.getPath('userData');
let worker, window, shuttingDown = false, stopping = false;
const logPath = path.join(dataDir, 'desktop.log');
function log(message) {
  fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(logPath) && fs.statSync(logPath).size > 1_000_000) fs.renameSync(logPath, logPath + '.previous');
  fs.appendFileSync(logPath, new Date().toISOString() + ' ' + message + '\n');
}
function fail(message) {
  log(message);
  dialog.showErrorBox('Bottomline Content Agent', message + '\n\nYour saved data is preserved. Close the application and try again.\nDiagnostics: ' + logPath);
  app.quit();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(start).catch(() => fail('The application could not start. Check that the ZIP was fully extracted and your user data folder is writable.'));
}
async function start() {
  fs.mkdirSync(dataDir, { recursive: true });
  Menu.setApplicationMenu(null);
  const resources = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '../.desktop-build');
  const configPath = path.join(resources, 'client.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const embeddedKey = config.openaiApiKey || '';
  if (embeddedKey && (typeof embeddedKey !== 'string' || !embeddedKey.startsWith('sk-') || config.proxyUrl)) throw new Error('Invalid embedded AI configuration');
  let token = '';
  if (config.proxyUrl) {
    const url = new URL(config.proxyUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid proxy URL');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows credential encryption is unavailable');
    // Client access can be extracted from any distributed client. It is scoped, limited,
    // revocable access, never the provider's OpenAI API key. Protect the local cached copy with DPAPI.
    const cachePath = path.join(dataDir, 'client-access.dat');
    const scopePath = path.join(dataDir, 'client-access-id.txt');
    if (fs.existsSync(cachePath) && fs.existsSync(scopePath) && fs.readFileSync(scopePath, 'utf8') === config.credentialId) {
      token = safeStorage.decryptString(fs.readFileSync(cachePath));
    } else {
      token = config.clientToken;
      if (!token || token.length < 32) throw new Error('Missing client access');
      fs.writeFileSync(cachePath, safeStorage.encryptString(token));
      fs.writeFileSync(scopePath, config.credentialId);
    }
  }
  const secret = randomBytes(32).toString('hex');
  // Deliberately exclude inherited API keys, database URLs, NODE_OPTIONS and development settings.
  const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  Object.assign(env, {
    NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
    DATABASE_URL: pathToFileURL(path.join(dataDir, 'bottomline.db')).href,
    BOTTOMLINE_DESKTOP_SECRET: secret,
    BOTTOMLINE_PROXY_URL: config.proxyUrl || '', BOTTOMLINE_CLIENT_TOKEN: token,
    // Explicit operator opt-in: this credential is recoverable from the distributed EXE.
    OPENAI_API_KEY: embeddedKey, OPENAI_MODEL: config.openaiModel || 'gpt-4.1-mini',
  });
  worker = utilityProcess.fork(path.join(resources, 'server', 'desktop-server.cjs'), [], {
    cwd: path.join(resources, 'server'), env, stdio: 'pipe', serviceName: 'Bottomline Local Server',
  });
  // Logs contain lifecycle status only; never prompts, user content, tokens or environment values.
  worker.stdout.on('data', () => {});
  worker.stderr.on('data', () => {});
  const timer = setTimeout(() => fail('The local application server did not start within 60 seconds.'), 60000);
  worker.on('exit', code => {
    clearTimeout(timer);
    if (!shuttingDown) fail('The local application server stopped unexpectedly (exit ' + code + ').');
  });
  worker.on('message', async message => {
    if (message.type === 'error') {
      clearTimeout(timer);
      log('Startup: ' + String(message.diagnostic || 'unknown').replaceAll(secret, '[redacted]').replaceAll(token || secret, '[redacted]').replaceAll(embeddedKey || secret, '[redacted]').slice(0, 4000));
      fail('The local application server could not initialize.'); return;
    }
    if (message.type !== 'ready' || window) return;
    clearTimeout(timer);
    const origin = 'http://127.0.0.1:' + message.port;
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((_contents, permission, callback) => callback(permission === 'clipboard-sanitized-write'));
    ses.setPermissionCheckHandler((_contents, permission, requestingOrigin) => requestingOrigin === origin && permission === 'clipboard-sanitized-write');
    ses.webRequest.onBeforeSendHeaders({ urls: [origin + '/*'] }, (details, callback) => {
      details.requestHeaders['x-bottomline-desktop'] = secret;
      callback({ requestHeaders: details.requestHeaders });
    });
    ses.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !details.url.startsWith(origin + '/') && !details.url.startsWith('blob:' + origin + '/') && !details.url.startsWith('data:') });
    });
    window = new BrowserWindow({
      width: 1440, height: 1000, minWidth: 900, minHeight: 650, show: false,
      title: 'Bottomline Content Agent', backgroundColor: '#f7f5ef',
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, devTools: false, spellcheck: false, webviewTag: false },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(origin + '/')) event.preventDefault(); });
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.webContents.on('render-process-gone', () => { if (!shuttingDown) fail('The application window stopped responding.'); });
    window.webContents.on('unresponsive', async () => {
      const answer = await dialog.showMessageBox(window, { type: 'warning', message: 'The application is taking longer than expected.', buttons: ['Keep waiting', 'Close application'], defaultId: 0 });
      if (answer.response === 1) app.quit();
    });
    window.once('ready-to-show', () => window.show());
    window.on('closed', () => { window = null; app.quit(); });
    try { await window.loadURL(origin); log('Application ready'); }
    catch { fail('The application window could not load the local server.'); }
  });
}
app.on('window-all-closed', () => app.quit());
app.on('before-quit', event => {
  shuttingDown = true;
  if (!worker || stopping) return;
  event.preventDefault();
  stopping = true;
  // Allow active local saves to finish, then stop the bundled server. Never leave an orphan server.
  worker.postMessage({ type: 'shutdown' });
  const timer = setTimeout(() => { worker.kill(); app.quit(); }, 6000);
  worker.once('exit', () => { clearTimeout(timer); worker = null; app.quit(); });
});
process.on('uncaughtException', () => fail('An unexpected application error occurred.'));
