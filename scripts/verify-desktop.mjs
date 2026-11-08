import { chromium, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const executable = path.resolve(process.argv[2] || 'release/Bottomline-Content-Agent.exe');
const build = JSON.parse(fs.readFileSync('release/build-info.json', 'utf8'));
const live = build.aiMode === 'direct-embedded';
const qa = path.resolve('output/desktop-' + Date.now());
fs.mkdirSync(qa, { recursive: true });
const userData = path.join(qa, 'user-data');
const downloads = path.join(qa, 'downloads');
fs.mkdirSync(downloads, { recursive: true });
let browser, child, page, origin, launchEnv;
const errors = [];
const results = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function pass(message) { results.push(message); console.log('PASS: ' + message); }
async function launch(filename = executable) {
  const listener = net.createServer(); await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
  const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  Object.assign(env, { PATH: path.join(process.env.SystemRoot, 'System32'), BOTTOMLINE_DATA_DIR: userData,
    OPENAI_API_KEY: 'must-not-be-used-by-desktop', NODE_OPTIONS: '--invalid-developer-option' });
  launchEnv = env;
  child = spawn(filename, ['--remote-debugging-port=' + port, '--remote-debugging-address=127.0.0.1'], { env, stdio: 'ignore', windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 180; attempt++) {
    try { endpoint = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); break; } catch { await pause(500); }
  }
  if (!endpoint) throw new Error('Packaged executable did not expose the requested QA connection. Check ' + userData);
  browser = await chromium.connectOverCDP(endpoint.webSocketDebuggerUrl);
  const context = browser.contexts()[0];
  context.setDefaultTimeout(75000);
  for (let attempt = 0; attempt < 120; attempt++) {
    page = context.pages().find(p => p.url().startsWith('http://127.0.0.1:'));
    if (page) break;
    await pause(500);
  }
  if (!page) throw new Error('No packaged application window');
  page.on('pageerror', e => errors.push(e.message));
  origin = new URL(page.url()).origin;
  await expect(page).toHaveTitle(/Bottomline/);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
  return context;
}
async function close() {
  if (!browser) return;
  const disconnected = new Promise(resolve => browser.once('disconnected', resolve));
  await Promise.race([page.evaluate(() => window.close()).catch(() => {}), pause(1000)]);
  await Promise.race([disconnected, pause(10000)]);
  browser = null;
  await pause(1500);
  assert.equal(await fetch(origin).then(() => true, () => false), false, 'local server must stop with window');
}
async function click(name) { await page.getByRole('button', { name, exact: true }).click(); }
async function downloaded(filename) {
  const file = path.join(downloads, filename);
  for (let i = 0; i < 60; i++) { if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8'); await pause(200); }
  throw new Error('Download missing: ' + filename);
}
try {
  await launch();
  await expect(page.getByRole('heading', { name: 'תוכן שמתחיל בעסק שלך.' })).toBeVisible();
  assert.equal((await fetch(origin + '/api/workspace?workspace=own')).status, 403);
  pass('Portable EXE starts with system-only PATH, ignores inherited Node options/API key, and rejects unauthenticated local requests');
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  assert.equal(await page.evaluate(() => typeof window.process), 'undefined');
  assert.equal(await page.evaluate(async () => { try { await fetch('https://example.com'); return true; } catch { return false; } }), false);
  pass('Renderer has no Node access; external network requests blocked');
  const second = spawn(executable, [], { env: launchEnv, stdio: 'ignore', windowsHide: true });
  await Promise.race([new Promise(resolve => second.once('exit', resolve)), pause(120000)]);
  assert.ok(second.exitCode !== null, 'second launch should exit and focus the first instance');
  await expect(page).toHaveTitle(/Bottomline/);
  pass('Double-clicking again exits the second copy and preserves the first window');
  await click('הגדר את העסק שלי');
  await click('1. מכירים את העסק');
  await page.getByLabel('שם העסק', { exact: true }).fill('בדיקת יישום Windows');
  await page.getByLabel('תחום העיסוק', { exact: true }).fill('מאפייה');
  await page.getByLabel('שירותים והצעות', { exact: true }).fill('עוגות חתונה בהתאמה אישית');
  await click('שמירה והמשך ←');
  await page.getByLabel('למי התוכן מיועד?', { exact: true }).fill('זוגות לפני חתונה');
  await page.getByLabel('מה מעסיק את הקהל?', { exact: true }).fill('בחירת עיצוב לעוגה');
  await click('שמירת פרטים');
  await expect(page.getByText('השינויים נשמרו', { exact: true })).toBeVisible();
  pass('Blank onboarding and profile save');
  await click('תוכנית התוכן');
  await page.getByLabel('חודש התוכנית').fill('2027-03');
  await click('בנה לי תוכנית תוכן');
  await expect(page.locator('.idea-card')).toHaveCount(8, { timeout: 75000 });
  if (live) {
    await expect(page.getByText('יצירה באמצעות AI זמינה', { exact: true })).toBeVisible();
    const status = await page.evaluate(async () => (await fetch('/api/workspace?workspace=own')).json());
    assert.equal(status.ai, true);
    assert.equal(status.state.plans.at(-1).source, 'ai');
    assert.ok(status.state.ideas.slice(-8).every(i => i.source === 'ai'));
  } else await expect(page.getByText('דוגמת הדגמה — לא נוצרה באמצעות AI', { exact: true })).toBeVisible();
  const card = page.locator('.idea-card').first();
  await card.getByRole('button', { name: 'אישור רעיון', exact: true }).click();
  await card.getByRole('button', { name: 'יצירת טיוטה', exact: true }).click();
  await card.getByRole('button', { name: 'פתיחת טיוטה', exact: true }).click();
  await click('קצר יותר');
  await expect(page.getByLabel('צפייה בגרסה קודמת').locator('option')).toHaveCount(3, { timeout: 75000 });
  if (live) {
    const status = await page.evaluate(async () => (await fetch('/api/workspace?workspace=own')).json());
    assert.ok(status.state.drafts[0].versions.filter(v => ['original', 'revision'].includes(v.kind)).every(v => v.source === 'ai'));
    assert.ok(!JSON.stringify(status).includes('sk-proj-'), 'provider key must not be returned to renderer');
  }
  pass(live ? 'Real OpenAI plan, explicit draft and revision generated from the packaged embedded-key EXE; all saved with AI provenance' : 'Offline demo planning, idea acceptance, explicit drafting, revisions and truthful template labels');
  const caption = 'עריכת Windows נשמרת גם אחרי סגירה';
  await page.getByLabel('כיתוב הפוסט', { exact: true }).fill(caption);
  await click('שמירת עריכה כגרסה חדשה');
  await expect(page.getByLabel('צפייה בגרסה קודמת').locator('option')).toHaveCount(4);
  await click('אישור טיוטה');
  await expect(page.getByRole('heading', { name: 'איך הייתה התוצאה?' })).toBeVisible();
  await click('העתקת כיתוב');
  await expect(page.getByText('הכיתוב הועתק', { exact: true })).toBeVisible();
  assert.ok(execFileSync('powershell.exe', ['-NoProfile', '-Command', '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Get-Clipboard -Raw'], { encoding: 'utf8', windowsHide: true }).includes(caption));
  pass('Copy caption writes the actual text to the Windows clipboard');
  await click('ייצוא טקסט');
  assert.ok((await downloaded('bottomline-draft.txt')).includes(caption));
  await click('מוכן לפרסום');
  pass('Draft editing, version history, approval, ready status and text export');
  await click('משוב על הניסוי');
  await page.getByLabel('דקות בדיקה ועריכה כאן (הערכה שלך)').fill('7');
  await page.getByLabel('מה עבד ומה כדאי לשנות?').fill('בדיקת אריזה');
  await click('שמירת משוב');
  await expect(page.getByText('בדיקת אריזה', { exact: true })).toBeVisible();
  await click('ייצוא נתוני הניסוי JSON');
  const exported = JSON.parse((await downloaded('bottomline-pilot.json')).replace(/^\uFEFF/, ''));
  assert.equal(exported.profile.business, 'בדיקת יישום Windows');
  assert.ok(exported.feedback.some(f => f.minutes === 7));
  assert.ok(exported.drafts.some(d => d.status === 'ready'));
  pass('Feedback save and JSON export contain profile, drafts, reviews and feedback');
  await page.screenshot({ path: path.join(qa, 'feedback.png') });
  await close();
  pass('Closing packaged app stops the local server');
  const replacement = path.join(qa, 'replacement', 'Bottomline-Content-Agent.exe');
  fs.mkdirSync(path.dirname(replacement), { recursive: true });
  fs.copyFileSync(executable, replacement);
  await launch(replacement);
  // Random local port can change between launches; workspace data must still load.
  if (await page.getByRole('button', { name: 'הגדר את העסק שלי', exact: true }).isVisible()) await click('הגדר את העסק שלי');
  await click('העסק שלי');
  await click('1. מכירים את העסק');
  await expect(page.getByLabel('שם העסק', { exact: true })).toHaveValue('בדיקת יישום Windows');
  await click('טיוטות ואישורים');
  await page.locator('.draft-row').first().click();
  await expect(page.getByLabel('כיתוב הפוסט', { exact: true })).toHaveValue(caption);
  await page.screenshot({ path: path.join(qa, 'studio-after-restart.png') });
  pass('SQLite profile and edited/approved content persist after restart from a replacement EXE in another folder');
  assert.ok(fs.statSync(path.join(userData, 'bottomline.db')).size > 0);
  await click('החלפת סביבת עבודה'); await click('נסה עם עסק לדוגמה'); await click('טיוטות ואישורים');
  for (const [index, label] of [[1, 'טקסט שקופית 1'], [2, 'טקסט על המסך 1'], [3, 'טקסט מדובר 1']]) {
    await page.locator('.draft-row').nth(index).click();
    await page.getByLabel(label, { exact: true }).fill('בדיקת פורמט ' + index);
    await click('שמירת עריכה כגרסה חדשה');
    await expect(page.getByRole('button', { name: 'שמירת עריכה כגרסה חדשה' })).toBeDisabled();
    await click('חזרה לטיוטות');
  }
  pass('Fictional demo plus carousel, story and reel editors save in packaged app');
  await page.locator('.draft-row').nth(3).click();
  await page.getByLabel('בקשת תיקון או סיבת דחייה').fill('לא נשמע כמוני');
  await click('דחיית טיוטה');
  await click('העסק שלי');
  await expect(page.getByText('מקור: לא נשמע כמוני', { exact: true }).first()).toBeVisible();
  pass('Rejection reason persists and becomes a visible personalization rule');
  assert.deepEqual(errors, []);
  await close();
  const report = { executable, aiMode: build.aiMode || 'demo', sha256: createHash('sha256').update(fs.readFileSync(executable)).digest('hex'), testedAt: new Date().toISOString(), results, errors, limitations: ['No clean Windows VM available', ...(live ? ['Embedded API key is extractable; local generation limits are not a secure spending cap'] : ['Public HTTPS proxy not deployed; packaged live AI unverified']), 'Replacement test uses identical binary, not a later schema version'] };
  fs.writeFileSync(path.join(qa, 'results.json'), JSON.stringify(report, null, 2));
  if (executable === path.resolve('release/Bottomline-Content-Agent.exe')) fs.writeFileSync('release/desktop-verification.json', JSON.stringify(report, null, 2));
  console.log('Packaged verification evidence: ' + qa);
} catch (error) {
  if (page) await page.screenshot({ path: path.join(qa, 'failure.png') }).catch(() => {});
  fs.writeFileSync(path.join(qa, 'failure.txt'), String(error.stack || error));
  console.error(error);
  await close().catch(() => {});
  if (child && child.exitCode === null) child.kill();
  process.exitCode = 1;
}
