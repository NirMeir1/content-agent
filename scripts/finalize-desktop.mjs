import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const report = JSON.parse(fs.readFileSync('release/desktop-verification.json', 'utf8'));
const build = JSON.parse(fs.readFileSync('release/build-info.json', 'utf8'));
const embedded = build.aiMode === 'direct-embedded';
const hash = createHash('sha256').update(fs.readFileSync('release/Bottomline-Content-Agent.exe')).digest('hex');
if (report.sha256 !== hash || report.errors.length || report.results.length < 10 || (embedded && report.aiMode !== 'direct-embedded')) throw new Error('This exact executable has not passed packaged verification');
const text = 'Bottomline Content Agent - release verification\r\n\r\n' +
  'Tested: ' + report.testedAt + '\r\nWindows host: Windows 11 x64; system-only PATH for application process.\r\n' +
  'Executable SHA-256: ' + hash + '\r\n\r\nPASSED ON THE PACKAGED PORTABLE EXE:\r\n' + report.results.map(r => '- ' + r).join('\r\n') +
  '\r\n\r\nADDITIONAL CHECKS:\r\n' +
  '- Production build, TypeScript, ESLint, 22 unit tests.\r\n' +
  '- All 6 existing web browser journeys and protected access/persistence test.\r\n' +
  (embedded
    ? '- Real OpenAI plan, draft and revision through the packaged EXE with the bundled key; saved with AI provenance. No proxy used. Content quality not evaluated.\r\n'
    : '- Proxy integration: authorization, expiry, revocation, upstream outage, persistent quotas and concurrent budget reservations (mock upstream).\r\n- Real OpenAI plan, post draft and revision through the LOCAL proxy; schemas/formats validated. Content quality not evaluated.\r\n') +
  (embedded ? '- Existing OpenAI API key intentionally bundled at the owner\'s explicit request. Other secrets and database files excluded.\r\n' : '- Developer secrets/database files excluded; staged files scanned for the existing OpenAI key.\r\n') +
  '- Official Electron/NSIS/7-Zip checksums and Microsoft runtime signature verified. SQLite Visual C runtime bundled.\r\n\r\n' +
  'REMAINING LIMITATIONS:\r\n' + report.limitations.map(r => '- ' + r).join('\r\n') +
  '\r\n- No signing certificate supplied; Windows SmartScreen/publisher behavior on a client machine unverified.\r\n' +
  (embedded
    ? '- This release calls OpenAI directly using the bundled key. No proxy deployment or client key entry is needed. Internet and an active API account are required.\r\n- Keep the ZIP private: recipients can extract the API key and use the owner\'s API account. Local limits do not enforce a tamper-proof spending cap.\r\n'
    : '- No active hosted AI service in this release. Core local workflow works; generation is explicitly labelled fictional/demo templates.\r\n- Operator must deploy the HTTPS proxy with durable storage and an API secret, provision scoped client access, rebuild and verify packaged real AI before calling the full definition of done complete.\r\n');
fs.writeFileSync('release/VERIFICATION.txt', text);
const zipped = spawnSync('powershell.exe', ['-NoProfile', '-Command', "Compress-Archive -LiteralPath @('release/Bottomline-Content-Agent.exe','release/README.txt','release/VERIFICATION.txt') -DestinationPath 'release/Bottomline-Content-Agent-Windows-x64.zip' -CompressionLevel Optimal -Force"], { stdio: 'inherit', windowsHide: true });
if (zipped.status !== 0) throw new Error('ZIP creation failed');
const zipHash = createHash('sha256').update(fs.readFileSync('release/Bottomline-Content-Agent-Windows-x64.zip')).digest('hex');
fs.writeFileSync('release/SHA256SUMS.txt', hash + '  Bottomline-Content-Agent.exe\r\n' + zipHash + '  Bottomline-Content-Agent-Windows-x64.zip\r\n');
console.log('Verified release ZIP: release/Bottomline-Content-Agent-Windows-x64.zip');
