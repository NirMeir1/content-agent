import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parse as parseEnv } from 'dotenv';
const root = process.cwd();
const embedKey = process.argv.includes('--with-openai-key');
// A moderate compression level avoids very slow LZMA ultra builds of Chromium.
process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL ||= '5';
function configureLocalTools() { for (const [variable, relative] of [
  ['ELECTRON_BUILDER_7ZIP_PATH', '.desktop-cache/7zip/7zip/bin/7za.exe'],
  ['ELECTRON_BUILDER_NSIS_DIR', '.desktop-cache/nsis/nsis-bundle'],
  ['ELECTRON_BUILDER_NSIS_RESOURCES_DIR', '.desktop-cache/nsis/nsis-bundle'],
]) {
  if (fs.existsSync(relative)) process.env[variable] = path.resolve(relative);
} }
function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: root, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  if (result.status !== 0) process.exit(result.status || 1);
}
run('scripts/prepare-desktop-runtime.mjs', []);
configureLocalTools();
run('node_modules/next/dist/bin/next', ['build']);
const stage = path.join(root, '.desktop-build');
// This is a fixed generated workspace directory, never a user data directory.
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(path.join(stage, 'app'), { recursive: true });
fs.cpSync('.next/standalone', path.join(stage, 'server'), { recursive: true, dereference: true,
  filter: source => !path.basename(source).startsWith('.env') && !source.endsWith('.map') });
fs.cpSync('.next/static', path.join(stage, 'server/.next/static'), { recursive: true });
// Next traces the sharp native addon but omits its linked libvips DLLs on Windows.
fs.cpSync('node_modules/@img/sharp-win32-x64/lib', path.join(stage, 'server/node_modules/@img/sharp-win32-x64/lib'), { recursive: true });
if (fs.existsSync('public')) fs.cpSync('public', path.join(stage, 'server/public'), { recursive: true });
fs.copyFileSync('desktop/server.cjs', path.join(stage, 'server/desktop-server.cjs'));
fs.copyFileSync('desktop/main.cjs', path.join(stage, 'app/main.cjs'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
fs.writeFileSync(path.join(stage, 'app/package.json'), JSON.stringify({ name: 'bottomline-content-agent', version: pkg.version,
  description: 'Local Bottomline content planning and creation', author: 'Bottomline', main: 'main.cjs', private: true }));
let client = fs.existsSync('desktop/client.private.json') ? JSON.parse(fs.readFileSync('desktop/client.private.json', 'utf8')) : { proxyUrl: '', clientToken: '', credentialId: 'unprovisioned' };
if (client.openaiApiKey) throw new Error('Embedded credentials must come from the explicit --with-openai-key build option');
if (embedKey) {
  const values = {};
  for (const file of ['.env', '.env.local']) if (fs.existsSync(file)) Object.assign(values, parseEnv(fs.readFileSync(file)));
  const key = process.env.OPENAI_API_KEY || values.OPENAI_API_KEY;
  if (!key || !key.startsWith('sk-')) throw new Error('No existing OpenAI key is available for the explicitly requested embedded-key release');
  client = { proxyUrl: '', clientToken: '', credentialId: 'embedded-key', openaiApiKey: key, openaiModel: process.env.OPENAI_MODEL || values.OPENAI_MODEL || 'gpt-4.1-mini' };
}
if (client.proxyUrl && (!client.proxyUrl.startsWith('https://') || !client.clientToken || !client.credentialId)) throw new Error('Invalid client provisioning');
fs.writeFileSync(path.join(stage, 'client.json'), JSON.stringify(client));
// Fail closed if tracing ever copies developer credentials or local databases.
const secretValues = [];
for (const file of ['.env', '.env.local']) {
  if (!fs.existsSync(file)) continue;
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/^(?:OPENAI_API_KEY|DATABASE_AUTH_TOKEN|PILOT_COOKIE_SECRET)\s*=\s*["']?([^\r\n"']+)/gm)) {
    if (match[1].length > 15) secretValues.push(Buffer.from(match[1]));
  }
}
if (process.env.OPENAI_API_KEY) secretValues.push(Buffer.from(process.env.OPENAI_API_KEY));
let files = 0;
function inspect(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error('Nonportable symlink in staged app');
    if (item.isDirectory()) { inspect(filename); continue; }
    if (/^\.env|\.(db|sqlite)(-|$)|private\.json$/.test(item.name)) throw new Error('Private file in staged application');
    const content = fs.readFileSync(filename);
    // Only the explicitly authorized key may occur, and only in this one ignored resource.
    // All environment files, databases and other credentials remain forbidden.
    const authorizedCredentialFile = embedKey && filename === path.join(stage, 'client.json');
    const inspected = authorizedCredentialFile ? Buffer.from(content.toString('utf8').replaceAll(client.openaiApiKey, '[authorized embedded key]')) : content;
    if (secretValues.some(value => inspected.includes(value)) || /sk-proj-[a-zA-Z0-9_-]{20,}/.test(inspected.toString('utf8'))) throw new Error('Unexpected credential detected in staged application');
    files++;
  }
}
inspect(stage);
console.log(`Inspected ${files} staged files: ${embedKey ? 'only the explicitly authorized embedded key is included' : 'no developer secrets included'}; no databases or symlinks.`);
run('node_modules/electron-builder/out/cli/cli.js', ['--config', 'electron-builder.cjs', '--win', 'portable', '--x64', '--publish', 'never']);
fs.copyFileSync('desktop/README.txt', 'release/README.txt');
if (embedKey) {
  fs.writeFileSync('release/README.txt', fs.readFileSync('release/README.txt', 'utf8').replace(
    /Planning, editing, approvals,[\s\S]*?No content is automatically published to social media\./,
    'Editing, approvals, saved plans and exports work offline.\nReal AI generation calls OpenAI directly and requires internet.\nThe API key is bundled at the owner\'s explicit request; no backend deployment\nor client key entry is required. OpenAI usage is billed to the key owner.\nKeep this ZIP private: the key can be extracted from the executable. The local\ndaily generation limit is not a secure spending cap.\nThe example business and its preloaded content remain fictional and labelled.\nNo content is automatically published to social media.'
  ));
}
fs.writeFileSync('release/build-info.json', JSON.stringify({ version: pkg.version, builtAt: new Date().toISOString(), aiProvisioned: !!client.proxyUrl || embedKey, aiMode: embedKey ? 'direct-embedded' : client.proxyUrl ? 'proxy' : 'demo', containsApiKey: embedKey, stagedFilesScanned: files,
  sha256: createHash('sha256').update(fs.readFileSync('release/Bottomline-Content-Agent.exe')).digest('hex') }, null, 2));
console.log('Executable ready in release/. Run the packaged verification before creating the client ZIP.');
