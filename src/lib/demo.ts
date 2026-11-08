import { randomUUID as uuid } from "node:crypto";
import {
  type State,
  type Profile,
  type Idea,
  type DraftContent,
  localDate,
} from "./contracts";
export const blankProfile: Profile = {
  owner: "",
  business: "",
  field: "",
  bio: "",
  services: "",
  difference: "",
  audience: "",
  needs: "",
  goal: "",
  channels: ["Instagram"],
  frequency: 2,
  tone: "",
  phrases: "",
  banned: "",
  restrictions: "",
  questions: "",
  offers: "",
  color: "#183e35",
  imageUrl: "",
  samples: [],
  step: 0,
};
export function emptyState(): State {
  return {
    profile: { ...blankProfile },
    plans: [],
    ideas: [],
    drafts: [],
    rules: [],
    reviews: [],
    feedback: [],
    events: [],
  };
}
export const demoProfile: Profile = {
  ...blankProfile,
  owner: "נועה (דמות בדיונית)",
  business: "נועה | ליווי עסקי לעצמאיות",
  field: "ליווי עסקי",
  bio: "דוגמה בדיונית: מלווה עצמאיות בבניית שגרת עבודה ובהירות עסקית.",
  services: "פגישות מיקוד אישיות ותכנון שבוע עבודה",
  difference: "צעדים קטנים ושיחה בגובה העיניים",
  audience: "עצמאיות שנותנות שירות ומרגישות שהיום מתפזר",
  needs: "בחירת סדרי עדיפויות והצבת גבולות",
  goal: "פתיחת שיחות עם עצמאיות על תכנון השבוע",
  tone: "ישיר, חם, מעשי, בלי הבטחות",
  phrases: "צעד אחד קטן; רגע לעצור",
  banned: "הצלחה מובטחת; להכפיל הכנסות",
  restrictions: "אין להמציא לקוחות, תוצאות או הכשרות",
  questions: "איך בוחרים מה לעשות קודם?",
  samples: [
    {
      text: "רשימה ארוכה לא תמיד עוזרת. לפעמים השאלה היא מה אפשר להוריד ממנה השבוע. נסי לבחור משימה אחת שתהיה מספיק חשובה כדי לומר לאחרות: אחר כך.",
      liked: true,
    },
    {
      text: "לפני שאת ממלאת עוד שעה ביומן, עצרי רגע. האם המשימה הזו משרתת את מה שחשוב לך עכשיו? אין תשובה אחת שמתאימה לכולן.",
      liked: true,
    },
    {
      text: "גבול בעסק יכול להתחיל במשפט פשוט: אחזור אלייך מחר בשעות העבודה. לא צריך להסביר את כל היום שלך.",
      liked: true,
    },
    {
      text: "זה הזמן לפרוץ בענק! אל תפספסי את ההזדמנות לשנות הכול!",
      liked: false,
    },
  ],
  step: 3,
};
const angles = [
  "לבחור משימה אחת לשבוע",
  "גבול קטן מול פניות אחרי שעות העבודה",
  "מה מורידים מרשימת המשימות",
  "שאלת מיקוד לפני פתיחת היומן",
  "איך נראה תהליך העבודה שלך",
  "מתי כדאי לעצור ולבקש עזרה",
  "מקום לנשימה בין שתי פגישות",
  "הצעד הבא לא חייב להיות גדול",
  "לבדוק מה באמת דחוף",
  "לסיים שבוע עם שאלה טובה",
];
export function demoPlan(p: Profile, month: string, count = 8, offset = 0) {
  return {
    strategy: `תוכנית הדגמה: תוכן שימושי עבור ${p.audience || "הקהל שטרם הוגדר"}, בשפה ${p.tone || "בהירה"}. המטרה: ${p.goal || "דורשת הגדרה"}. מתחילים בצורך, עוברים לשאלה אישית ומסיימים בהזמנה לשיחה. יש להתאים את הדוגמאות לעסק לפני שימוש.`,
    ideas: Array.from({ length: count }, (_, i) => ({
      date: `${month}-${String(2 + Math.floor((i * 26) / count)).padStart(2, "0")}`,
      format: (["post", "carousel", "story", "reel"] as const)[i % 4],
      channel: p.channels[i % p.channels.length],
      pillar: (
        ["educational", "educational", "personal", "promotional"] as const
      )[i % 4],
      title: angles[(i + offset) % angles.length],
      angle: `${angles[(i + offset) % angles.length]} — נקודת פתיחה לשיחה על ${p.field || "תחום העסק"}`,
      need: p.needs || "נדרש להגדיר את צורכי הקהל",
      cta: "הזמנה לשיתוף בצעד קטן",
      rationale: `מתייחס לצורך: ${p.needs || "טרם הוגדר"}, ותומך במטרה: ${p.goal || "טרם הוגדרה"}.`,
      missing: i === 4 ? ["נדרש אישור לקוחה: תיאור אמיתי של תהליך העבודה"] : [],
    })),
  };
}
export function demoDraft(
  p: Profile,
  idea: Idea,
  rules: State["rules"] = [],
  reason = "",
): DraftContent {
  let caption = `${idea.title}\n\nכשיש הרבה דברים על הפרק, אפשר להתחיל בשאלה אחת: מה חשוב לי לקדם השבוע?\n\nכתבי את המשימות, סמני אחת שמתייחסת ל${p.needs || "צורך שהגדרת"}, ובחרי פעולה קטנה שאפשר להכניס ליומן. אחר כך בדקי מה יכול לחכות.\n\nזו נקודת פתיחה למחשבה, ולא פתרון שמתאים לכל מצב.`;
  if (reason.includes("קצר") || rules.some((r) => r.text.includes("קצר")))
    caption = `${idea.title}\n\nמה הדבר האחד שחשוב לקדם השבוע? בחרי פעולה קטנה ובדקי מה יכול לחכות.`;
  if (reason.includes("אישי")) caption = `שאלה למחשבה: ${caption}`;
  const c: DraftContent = {
    hook: idea.title,
    caption,
    cta: "איזו משימה אחת תבחרי השבוע?",
    hashtags: [],
    visual: `כרטיס טקסט נקי בצבעי העסק, עם הכותרת: ${idea.title}`,
    slides:
      idea.format === "carousel"
        ? [
            "מה חשוב השבוע?",
            "כותבים את מה שעל הפרק",
            "בוחרים משימה אחת",
            "מפנים לה מקום ביומן",
            "מה יכול לחכות?",
          ].map((text) => ({
            text,
            visual: "טיפוגרפיה ברורה, רעיון אחד בשקופית",
          }))
        : [],
    frames:
      idea.format === "story"
        ? [
            "מה ממלא לך את השבוע?",
            "בחרי משימה אחת שחשוב לקדם",
            "איזה צעד קטן אפשר לעשות היום?",
          ].map((text, i) => ({
            text,
            visual: "רקע בצבע המותג וטקסט קצר",
            interaction: i === 2 ? "תיבת שאלה: מה הצעד שלך?" : "",
          }))
        : [],
    scenes:
      idea.format === "reel"
        ? [
            {
              seconds: 3,
              shot: "מבט למצלמה, כותרת על המסך",
              spoken: "הרשימה גדלה, אבל מה באמת חשוב?",
            },
            {
              seconds: 12,
              shot: "צילום יד כותבת שלוש משימות",
              spoken:
                "כתבי את מה שעל הפרק. עכשיו בחרי משימה אחת שחשוב לך לקדם השבוע.",
            },
            {
              seconds: 12,
              shot: "סימון משבצת ביומן",
              spoken:
                "פני לה זמן, ובדקי מה יכול לחכות. זה רק צעד קטן שאפשר לנסות.",
            },
            { seconds: 3, shot: "חזרה למצלמה", spoken: "מה תבחרי לקדם השבוע?" },
          ]
        : [],
    factsUsed: [p.business, p.needs].filter(Boolean),
    checks: [
      ...idea.missing,
      "דוגמת הדגמה כללית: יש לבדוק התאמה למומחיות ולקהל לפני פרסום.",
    ],
  };
  for (const phrase of p.banned
    .split(/[;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    c.caption = c.caption.split(phrase).join("");
    c.hook = c.hook.split(phrase).join("");
  }
  return c;
}
export function seededState(): State {
  const s = emptyState();
  s.profile = structuredClone(demoProfile);
  const plan = demoPlan(s.profile, localDate().slice(0, 7));
  const planId = uuid();
  s.plans.push({
    id: planId,
    month: localDate().slice(0, 7),
    goal: s.profile.goal,
    strategy: plan.strategy,
    source: "demo",
  });
  s.ideas = plan.ideas.map((i, n) => ({
    ...i,
    id: uuid(),
    planId,
    status: n < 4 ? "accepted" : "proposed",
    source: "demo",
  }));
  s.drafts = s.ideas.slice(0, 4).map((idea) => ({
    id: uuid(),
    ideaId: idea.id,
    status: "draft",
    versions: [
      {
        id: uuid(),
        at: new Date().toISOString(),
        kind: "original",
        source: "demo",
        content: demoDraft(s.profile, idea),
      },
    ],
  }));
  s.drafts[3].versions[0].content.caption =
    "זה הזמן לפרוץ בענק! אל תפספסי את ההזדמנות לשנות הכול!\n\nדוגמה מכירתית במכוון לתרגול דחייה.";
  return s;
}
