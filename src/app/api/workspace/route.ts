import { NextResponse } from "next/server";
import { actionSchema, workspaceSchema } from "@/lib/contracts";
import type { State } from "@/lib/contracts";
import { authorized, sameOrigin } from "@/lib/auth";
import { loadWorkspace, saveWorkspace } from "@/lib/db";
import { applyAction } from "@/lib/actions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await authorized()))
    return NextResponse.json({ error: "נדרש קוד גישה" }, { status: 401 });
  const key = workspaceSchema.safeParse(
    new URL(request.url).searchParams.get("workspace"),
  );
  if (!key.success)
    return NextResponse.json({ error: "סביבה לא תקינה" }, { status: 400 });
  return NextResponse.json(
    { ...(await loadWorkspace(key.data)), ai: !!process.env.OPENAI_API_KEY },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!(await authorized()))
    return NextResponse.json({ error: "נדרש קוד גישה" }, { status: 401 });
  if (!sameOrigin(request))
    return NextResponse.json({ error: "בקשה לא מורשית" }, { status: 403 });
  let checkpoint: { state: State; revision: number } | undefined;
  try {
    const raw = await request.text();
    if (raw.length > 300000)
      return NextResponse.json({ error: "הבקשה גדולה מדי" }, { status: 413 });
    const a = actionSchema.parse(JSON.parse(raw));
    const current = await loadWorkspace(a.workspace);
    if (current.revision !== a.revision)
      return NextResponse.json(
        { error: "המידע השתנה. יש לרענן לפני שמירה." },
        { status: 409 },
      );
    let revision = a.revision;
    const state = await applyAction(current.state, a, async (state) => {
      revision = await saveWorkspace(a.workspace, revision, state);
      checkpoint = { state: structuredClone(state), revision };
    });
    revision = await saveWorkspace(a.workspace, revision, state);
    return NextResponse.json({
      state,
      revision,
      ai: !!process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...checkpoint,
        ai: !!process.env.OPENAI_API_KEY,
        error:
          error instanceof Error
            ? error.name === "ZodError"
              ? "חלק מהשדות אינם תקינים. בדקו תאריכים, אורכי טקסט ושדות חובה."
              : error.message
            : "לא ניתן לשמור כרגע",
      },
      { status: 400 },
    );
  }
}
