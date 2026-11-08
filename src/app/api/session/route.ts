import { NextResponse } from "next/server";
import { z } from "zod";
import { codeMatches, signSession, sameOrigin } from "@/lib/auth";
const attempts = new Map<string, { count: number; at: number }>();
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "בקשה לא מורשית" }, { status: 403 });
  const key = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const item = attempts.get(key);
  if (item && now - item.at < 60000 && item.count >= 10)
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסו שוב בעוד דקה." },
      { status: 429 },
    );
  attempts.set(key, {
    at: item && now - item.at < 60000 ? item.at : now,
    count: item && now - item.at < 60000 ? item.count + 1 : 1,
  });
  try {
    const { code } = z
      .object({ code: z.string().max(200) })
      .parse(await request.json());
    if (!codeMatches(code))
      return NextResponse.json(
        { error: "קוד הגישה אינו נכון" },
        { status: 401 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set("pilot_session", signSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 86400,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "לא ניתן לפתוח את סביבת הניסוי. בדקו את הגדרות הגישה." },
      { status: 400 },
    );
  }
}
