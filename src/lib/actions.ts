import { randomUUID as uuid } from "node:crypto";
import {
  type State,
  type Action,
  type Draft,
  validateFormat,
} from "./contracts";
import { createPlan, createDraft, createAlternative } from "./ai";
export function preference(reason: string) {
  if (reason.includes("כמוני") || reason.includes("סגנון"))
    return "להיצמד לדוגמאות הכתיבה שאהבתי; להימנע מניסוחים כלליים ומכירתיים.";
  if (reason.includes("מכירתי"))
    return "להפחית שפה מכירתית ולהעדיף ערך מעשי ללא הבטחות.";
  if (reason.includes("קצר")) return "להעדיף ניסוח קצר וממוקד.";
  if (reason.includes("אישי"))
    return "להעדיף קול אישי בלי להמציא סיפורים או עובדות.";
  return `להתחשב במשוב: ${reason}`;
}
export function review(
  s: State,
  d: Draft,
  action: State["reviews"][number]["action"],
  reason = "",
) {
  s.reviews.push({
    id: uuid(),
    draftId: d.id,
    action,
    reason,
    at: new Date().toISOString(),
    versionId: d.versions.at(-1)!.id,
    edited: d.versions.some((v) => v.kind === "edit" || v.kind === "revision"),
  });
}
export async function applyAction(
  s: State,
  a: Action,
  onRevisionSaved?: (s: State) => Promise<void>,
) {
  const getIdea = (id: string) => {
    const i = s.ideas.find((i) => i.id === id);
    if (!i) throw new Error("הרעיון לא נמצא");
    return i;
  };
  const getDraft = (id: string) => {
    const d = s.drafts.find((d) => d.id === id);
    if (!d) throw new Error("הטיוטה לא נמצאה");
    return d;
  };
  switch (a.action) {
    case "profile":
      s.profile = a.profile;
      break;
    case "plan": {
      if (!s.profile.business || !s.profile.audience)
        throw new Error("לפני יצירת תוכנית יש לשמור שם עסק וקהל יעד.");
      const p = await createPlan(s, a.month, a.goal, a.frequency);
      const planId = uuid();
      s.plans.push({
        id: planId,
        month: a.month,
        goal: a.goal,
        strategy: p.strategy,
        source: p.source,
      });
      s.ideas.push(
        ...p.ideas.map((i) => ({
          ...i,
          id: uuid(),
          planId,
          status: "proposed" as const,
          source: p.source,
        })),
      );
      break;
    }
    case "idea": {
      const idea = getIdea(a.id);
      const drafted = s.drafts.some((d) => d.ideaId === a.id);
      if (drafted && a.idea.format !== idea.format)
        throw new Error(
          "לרעיון כבר יש טיוטה. יש ליצור רעיון חלופי כדי לשנות פורמט.",
        );
      Object.assign(idea, a.idea, { status: a.status });
      break;
    }
    case "removeIdea":
      getIdea(a.id);
      if (s.drafts.some((d) => d.ideaId === a.id))
        throw new Error("לא ניתן להסיר רעיון עם טיוטה והיסטוריה.");
      s.ideas = s.ideas.filter((i) => i.id !== a.id);
      break;
    case "alternative": {
      const old = getIdea(a.id);
      const p = await createAlternative(s, old);
      s.ideas.push({
        ...p.idea,
        id: uuid(),
        planId: old.planId,
        status: "proposed",
        source: p.source,
      });
      break;
    }
    case "draft": {
      const idea = getIdea(a.id);
      if (idea.status !== "accepted")
        throw new Error("יש לאשר את הרעיון לפני יצירת טיוטה.");
      if (s.drafts.some((d) => d.ideaId === a.id))
        throw new Error("לרעיון כבר יש טיוטה. אפשר לפתוח ולבקש תיקון.");
      const generated = await createDraft(s, idea);
      s.drafts.push({
        id: uuid(),
        ideaId: a.id,
        status: "draft",
        versions: [
          {
            id: uuid(),
            at: new Date().toISOString(),
            kind: "original",
            ...generated,
          },
        ],
      });
      break;
    }
    case "edit": {
      const d = getDraft(a.id);
      validateFormat(a.content, getIdea(d.ideaId).format);
      d.versions.push({
        id: uuid(),
        at: new Date().toISOString(),
        kind: "edit",
        content: a.content,
        source: "manual",
      });
      d.status = "draft";
      review(s, d, "edit");
      break;
    }
    case "revision": {
      const d = getDraft(a.id);
      review(s, d, "revision", a.reason);
      s.rules.push({
        id: uuid(),
        text: preference(a.reason),
        evidence: a.reason,
      });
      await onRevisionSaved?.(s);
      const generated = await createDraft(
        s,
        getIdea(d.ideaId),
        d.versions.at(-1)!.content,
        a.reason,
      );
      d.versions.push({
        id: uuid(),
        at: new Date().toISOString(),
        kind: "revision",
        ...generated,
      });
      d.status = "draft";
      break;
    }
    case "approve": {
      const d = getDraft(a.id);
      if (d.status !== "draft")
        throw new Error("אפשר לאשר רק טיוטה שממתינה לבדיקה.");
      d.status = "approved";
      review(s, d, "approve");
      break;
    }
    case "reject": {
      if (!a.reason.trim()) throw new Error("כדי לדחות יש לציין סיבה קצרה.");
      const d = getDraft(a.id);
      d.status = "rejected";
      review(s, d, "reject", a.reason);
      s.rules.push({
        id: uuid(),
        text: preference(a.reason),
        evidence: a.reason,
      });
      break;
    }
    case "ready": {
      const d = getDraft(a.id);
      if (d.status !== "approved")
        throw new Error("יש לאשר טיוטה לפני סימון כמוכנה לפרסום.");
      d.status = "ready";
      review(s, d, "ready");
      break;
    }
    case "rule":
      s.rules.push({
        id: uuid(),
        text: a.rule,
        evidence: "העדפה שהוזנה ידנית",
      });
      break;
    case "removeRule":
      if (!s.rules.some((r) => r.id === a.id)) throw new Error("הכלל לא נמצא");
      s.rules = s.rules.filter((r) => r.id !== a.id);
      break;
    case "feedback":
      if (a.draftId) getDraft(a.draftId);
      s.feedback.push({
        ...a.feedback,
        id: uuid(),
        draftId: a.draftId,
        at: new Date().toISOString(),
      });
      break;
    case "event":
      s.events.push({ id: uuid(), date: a.date, details: a.details });
      break;
  }
  return s;
}
