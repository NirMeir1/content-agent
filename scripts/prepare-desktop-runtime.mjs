import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Build the Windows x64 release on Windows x64');
const cache = path.resolve('.desktop-cache'); fs.mkdirSync(cache, { recursive: true });
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) throw new Error('Runtime preparation failed: ' + command);
}
function download(url, filename) {
  if (!fs.existsSync(filename)) run('curl.exe', ['--fail', '--location', '--silent', '--show-error', '--max-time', '180', '--output', filename, url]);
}
function verify(filename, expected) {
  if (createHash('sha256').update(fs.readFileSync(filename)).digest('hex') !== expected) throw new Error('Runtime download checksum mismatch: ' + path.basename(filename));
}
const electron = JSON.parse(fs.readFileSync('node_modules/electron/package.json', 'utf8')).version;
const electronZip = path.join(cache, 'electron.zip');
download(`https://github.com/electron/electron/releases/download/v${electron}/electron-v${electron}-win32-x64.zip`, electronZip);
verify(electronZip, JSON.parse(fs.readFileSync('node_modules/electron/checksums.json', 'utf8'))[`electron-v${electron}-win32-x64.zip`]);
if (!fs.existsSync(path.join(cache, 'electron/electron.exe'))) run('tar.exe', ['-xf', electronZip, '-C', (fs.mkdirSync(path.join(cache, 'electron'), { recursive: true }), path.join(cache, 'electron'))]);
if (fs.readFileSync(path.join(cache, 'electron/version'), 'utf8').trim().replace(/^v/, '') !== electron) throw new Error('Cached Electron version differs; remove .desktop-cache and rebuild');
for (const [name, release, filename, checksum] of [
  ['7zip', '7zip%401.0.0', '7zip-win-x64.tar.gz', 'be071f15bd6da2f78fe81c6ddef2009b0c4d8a51f36b780cb806c7e6df95e1b3'],
  ['nsis', 'nsis%401.2.1', 'nsis-bundle-3.12.tar.gz', '56997fdefe25e7928a1a68b4583d08b240b66cf660234053b20131a74cc082f4'],
]) {
  const archive = path.join(cache, name + '.tar.gz');
  download(`https://github.com/electron-userland/electron-builder-binaries/releases/download/${release}/${filename}`, archive);
  verify(archive, checksum);
  fs.mkdirSync(path.join(cache, name), { recursive: true });
  run('tar.exe', ['-xzf', archive, '-C', path.join(cache, name)]);
}
const vc = path.join(cache, 'vc_redist.x64.exe');
download('https://aka.ms/vs/17/release/vc_redist.x64.exe', vc);
// Fixed workspace-relative filename: no secrets and no shell interpolation.
run('powershell.exe', ['-NoProfile', '-Command', "$signature = Get-AuthenticodeSignature -LiteralPath '.desktop-cache/vc_redist.x64.exe'; if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') { throw 'Microsoft redistributable signature invalid' }"]);
const data = fs.readFileSync(vc); let offset = 0, index = 0;
while ((offset = data.indexOf('MSCF', offset)) >= 0) {
  const size = data.readUInt32LE(offset + 8);
  if (size > 1000 && offset + size <= data.length) fs.writeFileSync(path.join(cache, `vc-cab-${index++}.cab`), data.subarray(offset, offset + size));
  offset += 4;
}
const zip = path.join(cache, '7zip/7zip/bin/7za.exe');
run(zip, ['x', path.join(cache, 'vc-cab-0.cab'), '-o' + path.join(cache, 'vc-manifest'), '-y']);
run(zip, ['x', path.join(cache, 'vc-cab-1.cab'), '-o' + path.join(cache, 'vc-payload'), '-y']);
const manifest = fs.readFileSync(path.join(cache, 'vc-manifest/0'), 'utf8');
const payload = [...manifest.matchAll(/<Payload\s[^>]+>/g)].find(m => m[0].includes('vcRuntimeMinimum_amd64') && m[0].includes('cab1.cab'))?.[0];
const source = payload?.match(/SourcePath="(a\d+)"/)?.[1];
if (!source) throw new Error('Microsoft runtime layout changed; review extraction before shipping');
run(zip, ['x', path.join(cache, 'vc-payload', source), '-o' + path.join(cache, 'vc-runtime'), '-y']);
// Resolve the English license payload rather than assuming an installer-specific index.
const license = [...manifest.matchAll(/<Payload\s[^>]+>/g)].find(m => m[0].includes('FilePath="license.rtf"'))?.[0].match(/SourcePath="(u\d+)"/)?.[1];
if (!license) throw new Error('Microsoft redistribution license missing');
fs.copyFileSync(path.join(cache, 'vc-manifest', license), path.join(cache, 'Microsoft-Visual-C-Runtime.rtf'));
console.log('Official Electron/NSIS/7-Zip checksums and Microsoft runtime signature verified.');
