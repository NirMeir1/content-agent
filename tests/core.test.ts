import { describe, it, expect, vi, afterEach } from "vitest";
import { randomUUID as uuid } from "node:crypto";
import { zodTextFormat } from "openai/helpers/zod";
import {
  actionSchema,
  profileSchema,
  planOutputSchema,
  draftContentSchema,
  validateFormat,
  localDate,
} from "../src/lib/contracts";
import {
  seededState,
  emptyState,
  demoDraft,
  demoPlan,
  blankProfile,
} from "../src/lib/demo";
import { applyAction } from "../src/lib/actions";
import { context, createPlan, createDraft, instructions } from "../src/lib/ai";
import { loadWorkspace, saveWorkspace, reserveGeneration } from "../src/lib/db";
import { signSession, verifySession, codeMatches } from "../src/lib/auth";
afterEach(() => vi.unstubAllEnvs());
describe("contracts and grounded generation", () => {
  it.each([
    {
      business: "מאפיית בדיקה",
      field: "מאפייה",
      services: "עוגות חתונה",
      audience: "זוגות לפני חתונה",
      needs: "בחירת עיצוב לעוגה",
      goal: "הזמנות לעוגות חתונה",
    },
    {
      business: "פרחים לבדיקה",
      field: "חנות פרחים",
      services: "זרי פרחים במשלוח",
      audience: "אנשים שמחפשים מתנה",
      needs: "בחירת זר למתנה",
      goal: "פניות לגבי משלוחי פרחים",
    },
  ])(
    "grounds no-key topics and all draft formats in $business rather than coaching",
    async (business) => {
      vi.stubEnv("OPENAI_API_KEY", "");
      const s = seededState();
      s.profile = { ...structuredClone(blankProfile), ...business };
      const originalPlan = structuredClone(s.plans[0]);
      const originalIdeas = structuredClone(s.ideas);
      await applyAction(s, {
        action: "plan",
        workspace: "demo",
        revision: 0,
        month: "2027-05",
        goal: business.goal,
        frequency: 2,
      });
      expect(s.plans[0]).toEqual(originalPlan);
      expect(s.ideas.slice(0, originalIdeas.length)).toEqual(originalIdeas);
      const generated = s.ideas.filter((i) => i.planId === s.plans.at(-1)!.id);
      expect(generated).toHaveLength(8);
      const planText = JSON.stringify(generated);
      expect(planText).toContain(business.services);
      expect(planText).not.toMatch(
        /תכנון שבוע|משימה אחת|עצמאיות|סדרי עדיפויות/,
      );
      for (const idea of generated.slice(0, 4)) {
        idea.status = "accepted";
        const draft = await createDraft(s, idea);
        validateFormat(draft.content, idea.format);
        expect(draft.content.caption).toContain(business.services);
        expect(JSON.stringify(draft.content)).not.toMatch(
          /תכנון שבוע|משימה אחת|עצמאיות|סימון משבצת/,
        );
      }
      expect(
        planOutputSchema.safeParse(demoPlan(s.profile, "2027-05")).success,
      ).toBe(true);
    },
  );
  it("does not invent a coaching business when optional details are missing", () => {
    const p = {
      ...structuredClone(blankProfile),
      business: "עסק חדש",
      audience: "קהל חדש",
    };
    const result = demoPlan(p, "2027-05");
    expect(result.ideas.every((i) => i.missing.length > 0)).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/עצמאיות|תכנון שבוע|משימה אחת/);
  });
  it("builds strict Responses JSON schemas for plan, draft and revision", () => {
    for (const [name, schema] of [
      ["plan", planOutputSchema],
      ["draft", draftContentSchema],
      ["revision", draftContentSchema],
    ] as const) {
      const result = zodTextFormat(schema, name);
      expect(result.type).toBe("json_schema");
      expect(result.strict).toBe(true);
      expect(result.schema.additionalProperties).toBe(false);
      expect(result.schema.required).toBeDefined();
    }
  });
  it("validates fictional profile and four complete format outputs", () => {
    const s = seededState();
    expect(profileSchema.safeParse(s.profile).success).toBe(true);
    for (const d of s.drafts) {
      const idea = s.ideas.find((i) => i.id === d.ideaId)!;
      expect(draftContentSchema.safeParse(d.versions[0].content).success).toBe(
        true,
      );
      expect(() =>
        validateFormat(d.versions[0].content, idea.format),
      ).not.toThrow();
    }
    expect(s.profile.samples.length).toBe(4);
  });
  it("rejects invalid IDs, dates, formats and missing rejection payload", () => {
    expect(
      actionSchema.safeParse({
        action: "draft",
        workspace: "demo",
        revision: 0,
        id: "abc",
      }).success,
    ).toBe(false);
    const s = seededState();
    expect(
      actionSchema.safeParse({
        action: "idea",
        workspace: "demo",
        revision: 0,
        id: uuid(),
        idea: { ...s.ideas[0], date: "2026-02-31" },
        status: "accepted",
      }).success,
    ).toBe(false);
    expect(() =>
      validateFormat(
        { ...s.drafts[0].versions[0].content, slides: [] },
        "carousel",
      ),
    ).toThrow();
    expect(() =>
      validateFormat(
        { ...s.drafts[0].versions[0].content, scenes: [] },
        "reel",
      ),
    ).toThrow();
  });
  it("uses Jerusalem date at UTC day boundary", () => {
    expect(localDate(new Date("2026-11-08T23:30:00Z"))).toBe("2026-11-09");
  });
  it("uses CURRENT profile, feedback, examples, corrections and approved text in context", async () => {
    const s = seededState();
    s.profile.audience = "קהל ששונה כרגע";
    const d = s.drafts[0];
    await applyAction(s, {
      action: "edit",
      workspace: "demo",
      revision: 0,
      id: d.id,
      content: { ...d.versions[0].content, caption: "תיקון של בעלת העסק" },
    });
    await applyAction(s, {
      action: "approve",
      workspace: "demo",
      revision: 0,
      id: d.id,
      reason: "",
    });
    await applyAction(s, {
      action: "reject",
      workspace: "demo",
      revision: 0,
      id: s.drafts[3].id,
      reason: "לא נשמע כמוני",
    });
    const c = context(s);
    expect(c.profile.audience).toBe("קהל ששונה כרגע");
    expect(c.approvedText[0]?.caption).toBe("תיקון של בעלת העסק");
    expect(c.corrections[0].original.caption).not.toBe(
      c.corrections[0].corrected?.caption,
    );
    expect(c.reviewReasons[0].reason).toBe("לא נשמע כמוני");
    expect(c.explicitPreferences.length).toBe(1);
    expect(c.writingExamples.some((x) => !x.liked)).toBe(true);
    expect(instructions).toContain("אין להמציא");
  });
  it("creates labeled no-key plan and draft without any external call", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const s = seededState();
    s.profile.goal = "המטרה ששונתה";
    const p = await createPlan(s, "2027-02", s.profile.goal, 3);
    expect(planOutputSchema.safeParse(p).success).toBe(true);
    expect(p.source).toBe("demo");
    expect(p.ideas.length).toBe(10);
    expect(p.strategy).toContain("המטרה ששונתה");
    expect(p.ideas.every((i) => i.date.startsWith("2027-02"))).toBe(true);
    const d = await createDraft(s, s.ideas[0]);
    expect(d.source).toBe("demo");
  });
  it("demo obeys concrete shortness preference and never claims model learning", () => {
    const s = seededState();
    const normal = demoDraft(s.profile, s.ideas[0]);
    const shorter = demoDraft(s.profile, s.ideas[0], [
      { id: uuid(), text: "להעדיף קצר", evidence: "קצר יותר" },
    ]);
    expect(shorter.caption.length).toBeLessThan(normal.caption.length);
    expect(shorter.caption).not.toContain("הצלחה מובטחת");
  });
});
describe("review transitions and persistence", () => {
  it("checkpoints a revision reason before a failed generation and preserves the draft", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const s = seededState();
    const d = s.drafts[0];
    const original = structuredClone(d.versions);
    s.profile.banned = "איזו שאלה";
    let saved: typeof s | undefined;
    await expect(
      applyAction(
        s,
        {
          action: "revision",
          workspace: "demo",
          revision: 0,
          id: d.id,
          reason: "פחות מכירתי",
        },
        async (state) => {
          saved = structuredClone(state);
        },
      ),
    ).rejects.toThrow("ביטוי אסור");
    expect(saved?.reviews.at(-1)?.reason).toBe("פחות מכירתי");
    expect(saved?.rules.at(-1)?.evidence).toBe("פחות מכירתי");
    expect(d.versions).toEqual(original);
  });
  it("requires idea acceptance before draft creation and preserves all versions", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const s = seededState();
    await expect(
      applyAction(s, {
        action: "draft",
        workspace: "demo",
        revision: 0,
        id: s.ideas[5].id,
      }),
    ).rejects.toThrow("לאשר");
    const d = s.drafts[0];
    const original = structuredClone(d.versions[0]);
    await applyAction(s, {
      action: "edit",
      workspace: "demo",
      revision: 0,
      id: d.id,
      content: { ...original.content, caption: "עריכה" },
    });
    expect(d.versions[0]).toEqual(original);
    expect(d.versions).toHaveLength(2);
    await applyAction(s, {
      action: "approve",
      workspace: "demo",
      revision: 0,
      id: d.id,
      reason: "",
    });
    expect(s.reviews.at(-1)?.edited).toBe(true);
    await applyAction(s, {
      action: "ready",
      workspace: "demo",
      revision: 0,
      id: d.id,
      reason: "",
    });
    expect(d.status).toBe("ready");
  });
  it("reject reason is mandatory and preferences are deletable", async () => {
    const s = seededState();
    await expect(
      applyAction(s, {
        action: "reject",
        workspace: "demo",
        revision: 0,
        id: s.drafts[3].id,
        reason: " ",
      }),
    ).rejects.toThrow();
    await applyAction(s, {
      action: "reject",
      workspace: "demo",
      revision: 0,
      id: s.drafts[3].id,
      reason: "לא נשמע כמוני",
    });
    expect(s.rules[0].evidence).toBe("לא נשמע כמוני");
    await applyAction(s, {
      action: "removeRule",
      workspace: "demo",
      revision: 0,
      id: s.rules[0].id,
    });
    expect(s.rules.length).toBe(0);
    expect(s.reviews.at(-1)?.reason).toBe("לא נשמע כמוני");
  });
  it("revisions retain request and previous content; approvals return to review after edits", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const s = seededState();
    const d = s.drafts[0];
    await applyAction(s, {
      action: "revision",
      workspace: "demo",
      revision: 0,
      id: d.id,
      reason: "קצר יותר",
    });
    expect(d.versions).toHaveLength(2);
    expect(s.rules[0].text).toContain("קצר");
    expect(d.versions[1].content.caption.length).toBeLessThan(
      d.versions[0].content.caption.length,
    );
    await applyAction(s, {
      action: "approve",
      workspace: "demo",
      revision: 0,
      id: d.id,
      reason: "",
    });
    await applyAction(s, {
      action: "edit",
      workspace: "demo",
      revision: 0,
      id: d.id,
      content: d.versions.at(-1)!.content,
    });
    expect(d.status).toBe("draft");
  });
  it("persists profiles, rescheduling, reviews and feedback with stale write protection", async () => {
    const current = await loadWorkspace("own");
    const state = emptyState();
    state.profile.business = "עסק בדיקה";
    const revision = await saveWorkspace("own", current.revision, state);
    const loaded = await loadWorkspace("own");
    expect(loaded.state.profile.business).toBe("עסק בדיקה");
    expect(loaded.revision).toBe(revision);
    await expect(saveWorkspace("own", current.revision, state)).rejects.toThrow(
      "המידע השתנה",
    );
  });
  it("limits generation atomically and persists limit across calls", async () => {
    vi.stubEnv("DAILY_GENERATION_LIMIT", "2");
    const day = uuid();
    await Promise.all([reserveGeneration(day), reserveGeneration(day)]);
    await expect(reserveGeneration(day)).rejects.toThrow("מכסת");
  });
});
describe("pilot access", () => {
  it("signs sessions, detects tampering and requires correct code", () => {
    vi.stubEnv("PILOT_ACCESS_CODE", "test-code");
    vi.stubEnv("PILOT_COOKIE_SECRET", "a".repeat(40));
    const token = signSession();
    expect(verifySession(token)).toBe(true);
    expect(verifySession(token + "bad")).toBe(false);
    expect(verifySession("1.abc")).toBe(false);
    expect(codeMatches("test-code")).toBe(true);
    expect(codeMatches("wrong")).toBe(false);
  });
});
