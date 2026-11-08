import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
export function accessRequired() {
  return (
    !!process.env.PILOT_ACCESS_CODE ||
    !!process.env.APP_ORIGIN ||
    process.env.VERCEL === "1"
  );
}
function secret() {
  const value = process.env.PILOT_COOKIE_SECRET;
  if (!value || value.length < 32 || !process.env.PILOT_ACCESS_CODE)
    throw new Error(
      "Hosted pilot requires PILOT_ACCESS_CODE and PILOT_COOKIE_SECRET (32+ characters).",
    );
  return value;
}
export function codeMatches(code: string) {
  const expected = process.env.PILOT_ACCESS_CODE || "";
  const a = Buffer.from(code),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function signSession() {
  const expires = String(Date.now() + 7 * 86400000);
  return (
    expires + "." + createHmac("sha256", secret()).update(expires).digest("hex")
  );
}
export function verifySession(value: string) {
  try {
    const [expires, signature] = value.split(".");
    if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
    const expected = createHmac("sha256", secret())
      .update(expires)
      .digest("hex");
    return (
      signature?.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    );
  } catch {
    return false;
  }
}
export async function authorized() {
  if (process.env.BOTTOMLINE_DESKTOP_SECRET) {
    const actual = (await headers()).get("x-bottomline-desktop") || "";
    const expected = process.env.BOTTOMLINE_DESKTOP_SECRET;
    const supplied = Buffer.from(actual), wanted = Buffer.from(expected);
    return supplied.length === wanted.length && timingSafeEqual(supplied, wanted);
  }
  return (
    !accessRequired() ||
    verifySession((await cookies()).get("pilot_session")?.value || "")
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const allowed =
    process.env.APP_ORIGIN ||
    `${url.protocol}//${request.headers.get("host") || url.host}`;
  return origin === allowed;
}
