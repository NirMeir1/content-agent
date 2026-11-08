"use client";
import { useState } from "react";
import {
  type State,
  type Draft,
  type DraftContent,
  formats,
  statuses,
  hebrewDate,
} from "@/lib/contracts";
import { Field, Empty, FeedbackForm, download, type Send } from "./ui";
export function draftText(c: DraftContent) {
  return [
    c.hook,
    c.caption,
    c.cta,
    c.hashtags.join(" "),
    "הנחיה חזותית: " + c.visual,
    ...c.slides.map((s, i) => `שקופית ${i + 1}: ${s.text}\n${s.visual}`),
    ...c.frames.map(
      (f, i) => `פריים ${i + 1}: ${f.text}\n${f.visual}\n${f.interaction}`,
    ),
    ...c.scenes.map(
      (s, i) => `סצנה ${i + 1} (${s.seconds} שניות): ${s.shot}\n${s.spoken}`,
    ),
    "דורש בדיקה: " + c.checks.join("; "),
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function Studio({
  s,
  send,
  selected,
  select,
}: {
  s: State;
  send: Send;
  selected: string | null;
  select: (id: string | null) => void;
}) {
  const d = s.drafts.find((d) => d.id === selected);
  return (
    <>
      <div className="section-title">
        <h1>{d ? "סטודיו לטיוטה" : "טיוטות ואישורים"}</h1>
        {d && <button onClick={() => select(null)}>חזרה לטיוטות</button>}
      </div>
      <p className="intro">
        הקול שלך, המילה האחרונה שלך. שום תוכן לא מתפרסם מכאן.
      </p>
      {d ? (
        <DraftEditor
          key={d.id + ":" + d.versions.length + ":" + d.status}
          s={s}
          d={d}
          send={send}
        />
      ) : s.drafts.length ? (
        <div className="draft-list">
          {s.drafts.map((d) => {
            const i = s.ideas.find((i) => i.id === d.ideaId)!;
            return (
              <button
                className="draft-row"
                key={d.id}
                onClick={() => select(d.id)}
              >
                <div className="format-tile">{formats[i.format]}</div>
                <div>
                  <span
                    className={
                      "badge " +
                      (d.status === "approved" || d.status === "ready"
                        ? "green"
                        : "")
                    }
                  >
                    {statuses[d.status]}
                  </span>
                  <h3>{i.title}</h3>
                  <p>{i.rationale}</p>
                  <small>
                    {hebrewDate(i.date)} · {i.channel} · {d.versions.length}{" "}
                    גרסאות
                  </small>
                </div>
                <span>לעריכה ואישור ←</span>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty>
          אין טיוטות עדיין. אשרי רעיון בתוכנית התוכן ובחרי ״יצירת טיוטה״.
        </Empty>
      )}
    </>
  );
}
function DraftEditor({ s, d, send }: { s: State; d: Draft; send: Send }) {
  const idea = s.ideas.find((i) => i.id === d.ideaId)!;
  const version = d.versions.at(-1)!;
  const [c, setC] = useState<DraftContent>(structuredClone(version.content));
  const [reason, setReason] = useState("");
  const [versionId, setVersionId] = useState("");
  const [copied, setCopied] = useState("");
  const [feedback, setFeedback] = useState(
    ["approved", "rejected"].includes(d.status),
  );
  const dirty = JSON.stringify(c) !== JSON.stringify(version.content);
  const previous = d.versions.find((v) => v.id === versionId);
  async function act(action: "approve" | "reject" | "ready") {
    if (await send({ action, id: d.id, reason })) setFeedback(true);
  }
  return (
    <>
      <div className="studio-grid">
        <div className="stack">
          <section className="panel stack">
            <div className="actions">
              <span className="badge">{formats[idea.format]}</span>
              <span className="badge green">{statuses[d.status]}</span>
              <small>
                {idea.channel} · {hebrewDate(idea.date)}
              </small>
            </div>
            <h2>{idea.title}</h2>
            <p className="rationale">{idea.rationale}</p>
            <p className="source">
              {version.source === "demo"
                ? "דוגמת הדגמה — לא נוצרה באמצעות AI"
                : version.source === "manual"
                  ? "גרסה בעריכה ידנית"
                  : "נוצר באמצעות AI · יש לבדוק עובדות לפני פרסום"}
            </p>
            {c.checks.length > 0 && (
              <div className="warning">
                <b>דורש בדיקה</b>
                <ul>
                  {c.checks.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {(["hook", "caption", "cta", "visual"] as const).map((key, i) => (
              <Field
                key={key}
                label={
                  ["פתיח", "כיתוב הפוסט", "הנעה לפעולה", "בריף לתמונה / עיצוב"][
                    i
                  ]
                }
              >
                <textarea
                  rows={key === "caption" ? 9 : 2}
                  maxLength={12000}
                  value={c[key]}
                  onChange={(e) => setC({ ...c, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="האשטגים (מופרדים ברווח)">
              <input
                value={c.hashtags.join(" ")}
                onChange={(e) =>
                  setC({
                    ...c,
                    hashtags: e.target.value.split(/\s+/).filter(Boolean),
                  })
                }
              />
            </Field>
            {c.slides.map((slide, i) => (
              <div className="structured" key={"slide" + i}>
                <h3>שקופית {i + 1}</h3>
                <Field label={`טקסט שקופית ${i + 1}`}>
                  <textarea
                    value={slide.text}
                    onChange={(e) =>
                      setC({
                        ...c,
                        slides: c.slides.map((x, n) =>
                          n === i ? { ...x, text: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label={`עיצוב שקופית ${i + 1}`}>
                  <input
                    value={slide.visual}
                    onChange={(e) =>
                      setC({
                        ...c,
                        slides: c.slides.map((x, n) =>
                          n === i ? { ...x, visual: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            ))}
            {c.frames.map((frame, i) => (
              <div className="structured" key={"frame" + i}>
                <h3>פריים {i + 1}</h3>
                {(["text", "visual", "interaction"] as const).map((key, n) => (
                  <Field
                    key={key}
                    label={
                      ["טקסט על המסך", "ויזואל מוצע", "אינטראקציה"][n] +
                      ` ${i + 1}`
                    }
                  >
                    <textarea
                      value={frame[key]}
                      onChange={(e) =>
                        setC({
                          ...c,
                          frames: c.frames.map((x, j) =>
                            j === i ? { ...x, [key]: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            ))}
            {c.scenes.length > 0 && (
              <p className="warning">
                תסריט ובריף בלבד — לא נוצר כאן וידאו.{" "}
                {c.scenes.reduce((n, x) => n + x.seconds, 0)} שניות.
              </p>
            )}
            {c.scenes.map((scene, i) => (
              <div className="structured" key={"scene" + i}>
                <h3>
                  סצנה {i + 1}
                  {i === 0 ? " · פתיח 3 שניות" : ""}
                </h3>
                <Field label={`משך סצנה ${i + 1} בשניות`}>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={scene.seconds}
                    onChange={(e) =>
                      setC({
                        ...c,
                        scenes: c.scenes.map((x, n) =>
                          n === i
                            ? { ...x, seconds: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                </Field>
                {(["shot", "spoken"] as const).map((key, n) => (
                  <Field
                    key={key}
                    label={["צילום / פעולה", "טקסט מדובר"][n] + ` ${i + 1}`}
                  >
                    <textarea
                      value={scene[key]}
                      onChange={(e) =>
                        setC({
                          ...c,
                          scenes: c.scenes.map((x, j) =>
                            j === i ? { ...x, [key]: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            ))}
            <button
              className="primary"
              disabled={!dirty}
              onClick={() =>
                void send({ action: "edit", id: d.id, content: c })
              }
            >
              שמירת עריכה כגרסה חדשה
            </button>
            <p className="muted">
              שמירת עריכה מחזירה את התוכן לבדיקה. המקור והגרסאות הקודמות נשמרים.
            </p>
          </section>
          <section className="panel stack">
            <h2>מתקרב, אבל עוד לא בדיוק?</h2>
            <div className="actions">
              {[
                "פחות מכירתי",
                "יותר אישי",
                "קצר יותר",
                "קרוב יותר לסגנון שלי",
              ].map((r) => (
                <button
                  key={r}
                  disabled={dirty}
                  onClick={() =>
                    void send({ action: "revision", id: d.id, reason: r })
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            <Field label="בקשת תיקון או סיבת דחייה">
              <textarea
                placeholder="למשל: לא נשמע כמוני. אני מעדיפה שפה פשוטה בלי סימני קריאה."
                value={reason}
                maxLength={2000}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="actions">
              <button
                disabled={dirty || !reason.trim()}
                onClick={() =>
                  void send({ action: "revision", id: d.id, reason })
                }
              >
                בקשת שכתוב
              </button>
              <button
                className="danger"
                disabled={dirty || !reason.trim()}
                onClick={() => void act("reject")}
              >
                דחיית טיוטה
              </button>
              <button
                className="primary"
                disabled={dirty || d.status !== "draft"}
                onClick={() => void act("approve")}
              >
                אישור טיוטה
              </button>
              {d.status === "approved" && (
                <button onClick={() => void act("ready")}>מוכן לפרסום</button>
              )}
            </div>
            {dirty && (
              <p className="warning">
                שמרי קודם את העריכה כדי לבדוק את הגרסה הנכונה.
              </p>
            )}
          </section>
          <section className="panel stack">
            <h2>גרסאות והיסטוריה</h2>
            <Field label="צפייה בגרסה קודמת">
              <select
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
              >
                <option value="">בחירת גרסה</option>
                {d.versions.map((v, i) => (
                  <option key={v.id} value={v.id}>
                    גרסה {i + 1} ·{" "}
                    {v.kind === "original"
                      ? "מקור"
                      : v.kind === "edit"
                        ? "עריכה"
                        : "שכתוב"}{" "}
                    ·{" "}
                    {new Date(v.at).toLocaleString("he-IL", {
                      timeZone: "Asia/Jerusalem",
                    })}
                  </option>
                ))}
              </select>
            </Field>
            {previous && (
              <pre className="text-preview">{draftText(previous.content)}</pre>
            )}
            {s.reviews
              .filter((r) => r.draftId === d.id)
              .map((r) => (
                <div className="history" key={r.id}>
                  <b>
                    {
                      {
                        edit: "עריכה",
                        revision: "בקשת שכתוב",
                        approve: "אישור",
                        reject: "דחייה",
                        ready: "מוכן לפרסום ידני",
                      }[r.action]
                    }
                  </b>{" "}
                  · {r.reason}
                  <small>
                    {new Date(r.at).toLocaleString("he-IL", {
                      timeZone: "Asia/Jerusalem",
                    })}
                  </small>
                </div>
              ))}
            <details>
              <summary>עובדות שנעשה בהן שימוש</summary>
              <ul>
                {c.factsUsed.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
          </section>
        </div>
        <aside className="preview-column">
          <h3>כך זה עשוי להיראות בפיד</h3>
          <div className="phone">
            <div className="phone-top">
              <b>{s.profile.business}</b>
              <span>•••</span>
            </div>
            <div
              className="brand-visual"
              style={{ background: s.profile.color }}
            >
              <span>{s.profile.field}</span>
              <h2>{c.hook}</h2>
              <small>{s.profile.business}</small>
            </div>
            <div className="phone-body">
              <span aria-hidden="true">♡　♧　↗</span>
              <p>{c.caption}</p>
              <b>{c.cta}</b>
              <p>{c.hashtags.join(" ")}</p>
            </div>
          </div>
          {c.slides.length > 0 && (
            <div className="preview-frames">
              {c.slides.map((x, i) => (
                <div key={i}>
                  <small>שקופית {i + 1}</small>
                  <p>{x.text}</p>
                </div>
              ))}
            </div>
          )}
          {c.frames.length > 0 && (
            <div className="preview-frames">
              {c.frames.map((x, i) => (
                <div key={i}>
                  <small>סטורי {i + 1}</small>
                  <p>{x.text}</p>
                  <small>{x.interaction}</small>
                </div>
              ))}
            </div>
          )}
          <p className="muted">
            המחשה בלבד. כרטיס צבע וטקסט, לא תמונה שנוצרה ב־AI. הפרסום ידני בלבד.
          </p>
          <div className="actions">
            <button
              disabled={dirty}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    [c.hook, c.caption, c.cta, c.hashtags.join(" ")].join(
                      "\n\n",
                    ),
                  );
                  setCopied("הכיתוב הועתק");
                } catch {
                  setCopied("ההעתקה חסומה בדפדפן. אפשר להוריד קובץ טקסט.");
                }
              }}
            >
              העתקת כיתוב
            </button>
            <button
              disabled={dirty}
              onClick={() => download("bottomline-draft.txt", draftText(c))}
            >
              ייצוא טקסט
            </button>
          </div>
          <p role="status">{copied}</p>
        </aside>
      </div>
      {feedback && (
        <FeedbackForm
          send={send}
          draftId={d.id}
          onSaved={() => setFeedback(false)}
        />
      )}
    </>
  );
}
