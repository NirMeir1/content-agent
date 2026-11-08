"use client";
import { useState } from "react";
import { type State, type Profile } from "@/lib/contracts";
import { Field, type Send } from "./ui";
const steps = ["מכירים את העסק", "הקהל והמטרה", "הקול שלך", "סיכום וזיכרון"];
const groups: { key: keyof Profile; label: string; hint: string }[][] = [
  [
    { key: "owner", label: "איך קוראים לך?", hint: "שם בעלת העסק" },
    { key: "business", label: "שם העסק", hint: "השם שיופיע בתצוגה" },
    { key: "field", label: "תחום העיסוק", hint: "למשל: ליווי עסקי" },
    {
      key: "bio",
      label: "רקע ומומחיות אמיתיים",
      hint: "רק עובדות שתרצי שהתוכן יתבסס עליהן",
    },
    { key: "services", label: "שירותים והצעות", hint: "מה אפשר לקבל ממך?" },
    {
      key: "difference",
      label: "מה מייחד את הדרך שלך?",
      hint: "גישה, תהליך או נקודת מבט",
    },
  ],
  [
    { key: "audience", label: "למי התוכן מיועד?", hint: "תארי את הקהל שלך" },
    {
      key: "needs",
      label: "מה מעסיק את הקהל?",
      hint: "צרכים ושאלות שחוזרים בשיחות",
    },
    {
      key: "goal",
      label: "מה תרצי לקדם?",
      hint: "למשל: לפתוח שיחות עם לקוחות מתאימים",
    },
    {
      key: "questions",
      label: "שאלות נפוצות",
      hint: "מה שואלים אותך שוב ושוב?",
    },
    {
      key: "offers",
      label: "הצעה או מבצע קיימים (רשות)",
      hint: "רק פרטים שסוכמו בפועל",
    },
  ],
  [
    {
      key: "tone",
      label: "איך תרצי להישמע?",
      hint: "למשל: חמה וישירה, בלי הגזמות",
    },
    {
      key: "phrases",
      label: "מילים וביטויים שאת אוהבת",
      hint: "ביטויים טבעיים שלך",
    },
    {
      key: "banned",
      label: "מילים וטענות שאסור לכתוב",
      hint: "הפרידי בשורה חדשה או בנקודה פסיק",
    },
    {
      key: "restrictions",
      label: "גבולות מקצועיים ונושאים להימנע מהם",
      hint: "מה חשוב שלא נכתוב?",
    },
  ],
];
export function ProfileScreen({ s, send }: { s: State; send: Send }) {
  const [p, setP] = useState<Profile>(structuredClone(s.profile));
  const [step, setStep] = useState(s.profile.step);
  const [rule, setRule] = useState("");
  async function save(next = step) {
    if (await send({ action: "profile", profile: { ...p, step: next } })) {
      setStep(next);
      setP({ ...p, step: next });
    }
  }
  return (
    <>
      <h1>העסק שלי</h1>
      <p className="intro">
        התוכן מתחיל במה שבאמת נכון לגבייך. אפשר לשמור ולהמשיך אחר כך.
      </p>
      <div className="steps">
        {steps.map((label, i) => (
          <button
            key={label}
            className={i === step ? "active" : ""}
            onClick={() => void save(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {step < 3 ? (
          <>
            <h2>{steps[step]}</h2>
            <div className="fields">
              {groups[step].map((f) => (
                <Field key={f.key} label={f.label}>
                  <textarea
                    rows={f.key === "business" || f.key === "owner" ? 1 : 3}
                    maxLength={12000}
                    placeholder={f.hint}
                    value={String(p[f.key])}
                    onChange={(e) => setP({ ...p, [f.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            {step === 1 && (
              <div className="fields">
                <Field label="רשתות מועדפות">
                  <div className="actions">
                    {(["Instagram", "Facebook"] as const).map((c) => (
                      <label className="check" key={c}>
                        <input
                          type="checkbox"
                          checked={p.channels.includes(c)}
                          onChange={(e) =>
                            setP({
                              ...p,
                              channels: e.target.checked
                                ? [...p.channels, c]
                                : p.channels.length > 1
                                  ? p.channels.filter((x) => x !== c)
                                  : p.channels,
                            })
                          }
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="תדירות שבועית משוערת">
                  <select
                    value={p.frequency}
                    onChange={(e) =>
                      setP({ ...p, frequency: Number(e.target.value) as 2 | 3 })
                    }
                  >
                    <option value="2">2 בשבוע · כ־8 רעיונות בחודש</option>
                    <option value="3">
                      3 בשבוע · כ־10 רעיונות ממוקדים בחודש
                    </option>
                  </select>
                </Field>
              </div>
            )}
            {step === 2 && (
              <>
                <h3>דוגמאות כתיבה שלך</h3>
                <p className="muted">
                  מומלץ להדביק 3–5 פוסטים. סמני מה מתאים לך ומה פחות.
                </p>
                {p.samples.map((sample, i) => (
                  <div className="sample" key={i}>
                    <Field label={`דוגמת כתיבה ${i + 1}`}>
                      <textarea
                        value={sample.text}
                        maxLength={12000}
                        onChange={(e) =>
                          setP({
                            ...p,
                            samples: p.samples.map((v, n) =>
                              n === i ? { ...v, text: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </Field>
                    <div className="actions">
                      <select
                        aria-label={`סגנון דוגמה ${i + 1}`}
                        value={String(sample.liked)}
                        onChange={(e) =>
                          setP({
                            ...p,
                            samples: p.samples.map((v, n) =>
                              n === i
                                ? { ...v, liked: e.target.value === "true" }
                                : v,
                            ),
                          })
                        }
                      >
                        <option value="true">אוהבת את הסגנון</option>
                        <option value="false">לא מתאים לי</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setP({
                            ...p,
                            samples: p.samples.filter((_, n) => n !== i),
                          })
                        }
                      >
                        הסרת דוגמה
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={p.samples.length >= 10}
                  onClick={() =>
                    setP({
                      ...p,
                      samples: [...p.samples, { text: "", liked: true }],
                    })
                  }
                >
                  ＋ הוספת דוגמת כתיבה
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <h2>מה הסוכן יודע על העסק</h2>
            <div className="summary">
              <strong>{p.business || "שם העסק טרם הוגדר"}</strong>
              <p>{p.bio || "הרקע שלך עדיין לא הוזן"}</p>
              <p>קהל: {p.audience || "טרם הוגדר"}</p>
              <p>מטרה: {p.goal || "טרם הוגדרה"}</p>
              <p>קול: {p.tone || "טרם הוגדר"}</p>
              <p>לא לכתוב: {p.banned || "לא הוגדרו ביטויים אסורים"}</p>
            </div>
            <div className="fields">
              <Field label="צבע המותג">
                <input
                  type="color"
                  value={p.color}
                  onChange={(e) => setP({ ...p, color: e.target.value })}
                />
              </Field>
              <Field label="קישור HTTPS לתמונת מותג (רשות)">
                <input
                  dir="ltr"
                  type="url"
                  value={p.imageUrl}
                  onChange={(e) => setP({ ...p, imageUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
            </div>
            <p className="muted">
              אין צורך להמציא פרטים חסרים. תוכן הדורש עובדה נוספת יסומן לבדיקה.
            </p>
          </>
        )}
        <div className="actions">
          <button className="primary">שמירת פרטים</button>
          {step < 3 && (
            <button type="button" onClick={() => void save(step + 1)}>
              שמירה והמשך ←
            </button>
          )}
        </div>
      </form>
      <section className="panel stack">
        <h2>העדפות שנשמרו מהמשוב שלך</h2>
        <p className="muted">
          ההעדפות והעריכות מצורפות לבקשות היצירה הבאות. זהו זיכרון בהקשר הכתיבה,
          ולא אימון של המודל.
        </p>
        {s.rules.map((r) => (
          <div className="rule" key={r.id}>
            <div>
              <b>{r.text}</b>
              <small>מקור: {r.evidence}</small>
            </div>
            <button
              aria-label={`הסרת כלל ${r.text}`}
              onClick={() => void send({ action: "removeRule", id: r.id })}
            >
              הסרה
            </button>
          </div>
        ))}
        <div className="actions">
          <input
            aria-label="העדפת כתיבה חדשה"
            placeholder="למשל: בלי סימני קריאה"
            value={rule}
            maxLength={1000}
            onChange={(e) => setRule(e.target.value)}
          />
          <button
            disabled={!rule.trim()}
            onClick={async () => {
              if (await send({ action: "rule", rule })) setRule("");
            }}
          >
            הוספת העדפה
          </button>
        </div>
      </section>
    </>
  );
}
