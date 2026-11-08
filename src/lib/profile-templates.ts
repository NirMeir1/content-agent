import type { Profile, Idea, DraftContent, State } from "./contracts";

// No profession-specific default facts. Only supplied profile text is inserted.
function first(value: string, fallback: string) {
  return (
    value
      .split(/[\n;]/)
      .map((x) => x.trim())
      .find(Boolean) || fallback
  );
}
export function demoPlan(p: Profile, month: string, count = 8, offset = 0) {
  const subject = first(p.services, first(p.field, "השירות של העסק"));
  const field = p.field.trim() || subject;
  const need = first(p.needs, "מה שחשוב לקהל בבחירת שירות");
  const question = first(p.questions, `מה כדאי לדעת לפני שבוחרים ${subject}?`);
  const audience = p.audience.trim() || "הקהל שטרם הוגדר";
  const topics = [
    {
      title: `מה כדאי לדעת על ${subject}?`,
      angle: `היכרות עם ${subject} עבור ${audience}.`,
      pillar: "educational" as const,
    },
    {
      title: `${question}`,
      angle: `מענה לשאלה שהקהל שואל בתחום ${field}.`,
      pillar: "educational" as const,
    },
    {
      title: `${need}: מה לשאול לפני שמחליטים?`,
      angle: `שאלות לבירור הצורך ״${need}״ לפני בחירת ${subject}.`,
      pillar: "educational" as const,
    },
    {
      title: `איך מתחילים עם ${subject}?`,
      angle: `הצגת הצעד הראשון בתהליך של ${p.business}.`,
      pillar: "promotional" as const,
      missing: ["מהו הצעד הראשון בפועל ואיך פונים לעסק?"],
    },
    {
      title: `מאחורי הקלעים של ${p.business}`,
      angle: `הצגת תהליך אמיתי בתחום ${field}, בלי להמציא סיפור או ניסיון אישי.`,
      pillar: "personal" as const,
      missing: ["תיאור אמיתי של תהליך העבודה או רגע מאחורי הקלעים"],
    },
    {
      title: `איך בוחרים ${subject} שמתאים לצורך?`,
      angle: `הצעת שאלות לבחירה בהתאם לצורך: ${need}.`,
      pillar: "educational" as const,
    },
    {
      title: p.difference ? `הגישה שלנו ל${field}` : `דוגמה מתוך ${subject}`,
      angle: p.difference
        ? `המחשת הבידול שנמסר: ${p.difference}`
        : `דוגמה אמיתית שממחישה את ${subject}.`,
      pillar: "proof" as const,
      missing: ["דוגמה אמיתית שהעסק מאשר לשימוש; אין להמציא תוצאות או לקוחות"],
    },
    {
      title: `מה הייתם רוצים לשאול על ${field}?`,
      angle: `פתיחת שיחה עם ${audience} על ${need}.`,
      pillar: "educational" as const,
    },
    {
      title: `מה כולל ${subject}?`,
      angle: `הצגת השירות כפי שהעסק הגדיר אותו, ללא השלמת פרטים חסרים.`,
      pillar: "promotional" as const,
      missing: ["פרטים מאושרים על מה שהשירות כולל"],
    },
    {
      title: `לפני שבוחרים ${subject}: השאלה שלכם`,
      angle: `איסוף שאלות של ${audience} לגבי ${field}.`,
      pillar: "educational" as const,
    },
  ];
  return {
    strategy: `תוכנית הדגמה לעסק ״${p.business}״ בתחום ${field}, עבור ${audience}. הנושאים מבוססים על השירות שנשמר: ${subject}, והצורך: ${need}. המטרה: ${p.goal || "טרם הוגדרה"}. זו תבנית המבוססת על הפרטים שהוזנו, ולא אסטרטגיה שנוצרה באמצעות AI. תשובות מקצועיות ופרטים חסרים דורשים השלמה שלך.`,
    ideas: Array.from({ length: count }, (_, i) => {
      const topic = topics[(i + offset) % topics.length];
      return {
        date: `${month}-${String(2 + Math.floor((i * 26) / count)).padStart(2, "0")}`,
        format: (["post", "carousel", "story", "reel"] as const)[i % 4],
        channel: p.channels[i % p.channels.length],
        pillar: topic.pillar,
        title: topic.title.slice(0, 200),
        angle: topic.angle,
        need,
        cta: `הזמנה לשאלה על ${field}`,
        rationale: `הנושא עוסק ב${subject}, מתייחס לצורך ״${need}״ של ${audience}, ותומך במטרה ״${p.goal || "טרם הוגדרה"}״.`,
        missing: [
          ...(topic.missing || []),
          ...(!p.field && !p.services
            ? ["יש להשלים תחום עיסוק או שירות לפני שימוש בתוכן"]
            : []),
        ],
      };
    }),
  };
}

export function demoDraft(
  p: Profile,
  idea: Idea,
  rules: State["rules"] = [],
  reason = "",
): DraftContent {
  const subject = first(p.services, first(p.field, "השירות של העסק"));
  const field = p.field.trim() || subject;
  const supplied = [
    p.services ? `השירות שלנו: ${p.services}` : "",
    p.difference ? `הגישה שלנו: ${p.difference}` : "",
  ].filter(Boolean);
  const short =
    reason.includes("קצר") || rules.some((r) => r.text.includes("קצר"));
  let caption = [
    idea.title,
    ...supplied,
    ...(!short
      ? [
          `התוכן מיועד ל${p.audience || "הקהל שהוגדר לעסק"}, ומתמקד ב${idea.need}.`,
          "[להשלמה שלך: הסבר מקצועי או דוגמה אמיתית שמתאימים לרעיון הזה.]",
        ]
      : []),
  ].join("\n\n");
  if (reason.includes("אישי")) caption = `מחשבה מ${p.business}:\n\n${caption}`;
  const structure = [
    idea.title,
    `השירות שלנו: ${subject}`,
    p.difference
      ? `הגישה שלנו: ${p.difference}`
      : `מה חשוב לברר לגבי ${idea.need}?`,
    "[להשלמה: הסבר מקצועי מאושר של העסק]",
    `איזו שאלה יש לכם על ${field}?`,
  ];
  const content: DraftContent = {
    hook: idea.title,
    caption,
    cta: `איזו שאלה יש לכם על ${field}?`,
    hashtags: [],
    visual: `כרטיס טקסט בצבעי ${p.business}, עם הכותרת: ${idea.title}`,
    slides:
      idea.format === "carousel"
        ? structure.map((text) => ({
            text,
            visual: `טקסט ברור בצבעי העסק, בהקשר של ${field}`,
          }))
        : [],
    frames:
      idea.format === "story"
        ? [structure[0], structure[1], structure[4]].map((text, i) => ({
            text,
            visual: `רקע בצבעי העסק, בנושא ${field}`,
            interaction: i === 2 ? `תיבת שאלות על ${field}` : "",
          }))
        : [],
    scenes:
      idea.format === "reel"
        ? [
            {
              seconds: 3,
              shot: `כותרת על המסך: ${idea.title}`,
              spoken: idea.title,
            },
            {
              seconds: 12,
              shot: `הצגת השירות בתחום ${field}; צילום אמיתי דורש בחירה שלך`,
              spoken: supplied.join(". ") || `[להשלמה: הסבר על ${subject}]`,
            },
            {
              seconds: 12,
              shot: "המחשה אמיתית של השירות, באישור העסק",
              spoken: `[להשלמה: דוגמה מקצועית לגבי ${idea.need}, ללא המצאת סיפור או תוצאה]`,
            },
            { seconds: 3, shot: "סיום עם שאלה על המסך", spoken: structure[4] },
          ]
        : [],
    factsUsed: [
      p.business,
      p.field,
      p.services,
      p.difference,
      p.audience,
      p.needs,
    ].filter(Boolean),
    checks: [
      ...idea.missing,
      "תבנית הדגמה המבוססת על הפרופיל — לא נוצרה באמצעות AI. יש להשלים תשובות מקצועיות ולאשר עובדות לפני פרסום.",
    ],
  };
  for (const phrase of p.banned
    .split(/[;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    content.caption = content.caption.split(phrase).join("");
    content.hook = content.hook.split(phrase).join("");
  }
  return content;
}
