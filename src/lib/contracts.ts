import { z } from "zod";
export const text = z.string().max(12000);
export const id = z.string().uuid();
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "תאריך לא תקין",
  );
export const formatSchema = z.enum(["post", "carousel", "story", "reel"]);
export const profileSchema = z.object({
  owner: text,
  business: text,
  field: text,
  bio: text,
  services: text,
  difference: text,
  audience: text,
  needs: text,
  goal: text,
  channels: z.array(z.enum(["Instagram", "Facebook"])).min(1),
  frequency: z.number().int().min(2).max(3),
  tone: text,
  phrases: text,
  banned: text,
  restrictions: text,
  questions: text,
  offers: text,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  imageUrl: z.union([
    z.literal(""),
    z.url().refine((v) => v.startsWith("https://")),
  ]),
  samples: z.array(z.object({ text, liked: z.boolean() })).max(10),
  step: z.number().int().min(0).max(3),
});
export const ideaContentSchema = z.object({
  date: dateSchema,
  format: formatSchema,
  channel: z.enum(["Instagram", "Facebook"]),
  pillar: z.enum(["educational", "personal", "proof", "promotional"]),
  title: z.string().min(1).max(200),
  angle: text,
  need: text,
  cta: text,
  rationale: text,
  missing: z.array(text),
});
export const planOutputSchema = z.object({
  strategy: text,
  ideas: z.array(ideaContentSchema).min(6).max(10),
});
export const draftContentSchema = z.object({
  hook: text,
  caption: text,
  cta: text,
  hashtags: z.array(text).max(8),
  visual: text,
  slides: z.array(z.object({ text, visual: text })).max(6),
  frames: z.array(z.object({ text, visual: text, interaction: text })).max(5),
  scenes: z
    .array(
      z.object({
        seconds: z.number().int().min(1).max(45),
        shot: text,
        spoken: text,
      }),
    )
    .max(8),
  factsUsed: z.array(text),
  checks: z.array(text),
});
export const feedbackSchema = z.object({
  baseline: z.number().min(0).max(10000).nullable(),
  minutes: z.number().min(0).max(10000),
  rating: z.number().int().min(1).max(5),
  publish: z.enum(["yes", "no", "maybe"]),
  notes: text,
});
export type Profile = z.infer<typeof profileSchema>;
export type IdeaContent = z.infer<typeof ideaContentSchema>;
export type DraftContent = z.infer<typeof draftContentSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type Idea = IdeaContent & {
  id: string;
  planId: string;
  status: "proposed" | "accepted";
  source: "demo" | "ai";
};
export type Version = {
  id: string;
  at: string;
  kind: "original" | "edit" | "revision";
  content: DraftContent;
  source: "demo" | "ai" | "manual";
};
export type Draft = {
  id: string;
  ideaId: string;
  status: "draft" | "approved" | "rejected" | "ready";
  versions: Version[];
};
export type Review = {
  id: string;
  draftId: string;
  action: "edit" | "revision" | "approve" | "reject" | "ready";
  reason: string;
  at: string;
  versionId: string;
  edited: boolean;
};
export type State = {
  profile: Profile;
  plans: {
    id: string;
    month: string;
    goal: string;
    strategy: string;
    source: "demo" | "ai";
  }[];
  ideas: Idea[];
  drafts: Draft[];
  rules: { id: string; text: string; evidence: string }[];
  reviews: Review[];
  feedback: (Feedback & { id: string; draftId: string | null; at: string })[];
  events: { id: string; date: string; details: string }[];
};
export const workspaceSchema = z.enum(["demo", "own"]);
const base = { workspace: workspaceSchema, revision: z.number().int().min(0) };
export const actionSchema = z.discriminatedUnion("action", [
  z.object({ ...base, action: z.literal("profile"), profile: profileSchema }),
  z.object({
    ...base,
    action: z.literal("plan"),
    month: monthSchema,
    goal: text,
    frequency: z.number().int().min(2).max(3),
  }),
  z.object({
    ...base,
    action: z.literal("idea"),
    id,
    idea: ideaContentSchema,
    status: z.enum(["proposed", "accepted"]),
  }),
  z.object({ ...base, action: z.literal("removeIdea"), id }),
  z.object({ ...base, action: z.literal("alternative"), id }),
  z.object({ ...base, action: z.literal("draft"), id }),
  z.object({
    ...base,
    action: z.literal("edit"),
    id,
    content: draftContentSchema,
  }),
  z.object({
    ...base,
    action: z.literal("revision"),
    id,
    reason: z.string().min(1).max(2000),
  }),
  z.object({
    ...base,
    action: z.enum(["approve", "reject", "ready"]),
    id,
    reason: text,
  }),
  z.object({
    ...base,
    action: z.literal("rule"),
    rule: z.string().min(1).max(1000),
  }),
  z.object({ ...base, action: z.literal("removeRule"), id }),
  z.object({
    ...base,
    action: z.literal("feedback"),
    feedback: feedbackSchema,
    draftId: id.nullable(),
  }),
  z.object({
    ...base,
    action: z.literal("event"),
    date: dateSchema,
    details: z.string().min(1).max(2000),
  }),
]);
export type Action = z.infer<typeof actionSchema>;
export const formats = {
  post: "פוסט",
  carousel: "קרוסלה",
  story: "סטורי",
  reel: "ריל — תסריט",
};
export const statuses = {
  draft: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
  ready: "מוכן לפרסום ידני",
};
export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function hebrewDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
  }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value));
}
export function validateFormat(content: DraftContent, format: Idea["format"]) {
  if (
    (format !== "carousel" && content.slides.length) ||
    (format !== "story" && content.frames.length) ||
    (format !== "reel" && content.scenes.length)
  )
    throw new Error("מבנה התוכן אינו מתאים לפורמט שנבחר");
  if (
    format === "carousel" &&
    (content.slides.length < 4 || content.slides.length > 6)
  )
    throw new Error("קרוסלה דורשת 4–6 שקופיות");
  if (
    format === "story" &&
    (content.frames.length < 3 || content.frames.length > 5)
  )
    throw new Error("סטורי דורש 3–5 מסגרות");
  if (format === "reel") {
    if (content.scenes[0]?.seconds !== 3)
      throw new Error("פתיח הריל צריך להיות באורך 3 שניות");
    const duration = content.scenes.reduce((n, s) => n + s.seconds, 0);
    if (duration < 20 || duration > 45)
      throw new Error("ריל דורש תסריט באורך 20–45 שניות");
  }
  return content;
}
