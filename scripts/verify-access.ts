import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
const origin = "http://127.0.0.1:3201";
let server: ChildProcess | undefined;
async function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3201",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: "file:./data/access-test.db",
        OPENAI_API_KEY: "",
        PILOT_ACCESS_CODE: "test-only-access-code",
        PILOT_COOKIE_SECRET: "test-only-cookie-secret-at-least-32-characters",
        APP_ORIGIN: origin,
      },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(origin + "/login");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("Server did not start");
}
async function stop() {
  if (server && server.exitCode === null) {
    const ended = once(server, "exit");
    server.kill();
    await ended;
  }
}
async function main() {
  await start();
  assert.equal((await fetch(origin, { redirect: "manual" })).status, 307);
  assert.equal(
    (await fetch(origin + "/api/workspace?workspace=own")).status,
    401,
  );
  assert.equal(
    (
      await fetch(origin + "/api/workspace", {
        method: "POST",
        headers: { origin },
        body: "{}",
      })
    ).status,
    401,
  );
  const login = (code: string) =>
    fetch(origin + "/api/session", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  assert.equal((await login("wrong")).status, 401);
  const signed = await login("test-only-access-code");
  assert.equal(signed.status, 200);
  const header = signed.headers.get("set-cookie")!;
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=lax/i);
  assert.match(header, /Secure/i);
  const cookie = header.split(";")[0];
  assert.equal((await fetch(origin, { headers: { cookie } })).status, 200);
  assert.equal(
    (
      await fetch(origin + "/api/workspace?workspace=own", {
        headers: { cookie: cookie + "bad" },
      })
    ).status,
    401,
  );
  const load = () =>
    fetch(origin + "/api/workspace?workspace=own", {
      headers: { cookie },
    }).then((r) => r.json());
  const current = await load();
  const marker = "בדיקת אתחול " + randomUUID();
  const action = {
    workspace: "own",
    revision: current.revision,
    action: "profile",
    profile: { ...current.state.profile, business: marker },
  };
  const post = (value: unknown, source = origin) =>
    fetch(origin + "/api/workspace", {
      method: "POST",
      headers: { cookie, origin: source, "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  assert.equal((await post(action, "https://unrelated.invalid")).status, 403);
  assert.equal((await post({ ...action, profile: {} })).status, 400);
  assert.equal((await post(action)).status, 200);
  assert.equal((await post(action)).status, 409);
  await stop();
  await start();
  assert.equal((await load()).state.profile.business, marker);
  console.log(
    "PASS: protected pages/API, signed HttpOnly SameSite Secure cookie, invalid code/tampering, cross-origin rejection, payload validation, stale writes, persistence after process restart.",
  );
}
try {
  await main();
} finally {
  await stop();
}
