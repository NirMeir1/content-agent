"use client";
import type { ReactNode, ReactElement } from "react";
import type { State, Action, Feedback } from "@/lib/contracts";
import { useState, useId, isValidElement, cloneElement } from "react";
export type Send = (
  action: Omit<Action, "workspace" | "revision"> | Record<string, unknown>,
) => Promise<boolean>;
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, {
            id: fieldId,
          })
        : children}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function download(
  name: string,
  value: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function FeedbackForm({
  send,
  draftId = null,
  onSaved,
}: {
  send: Send;
  draftId?: string | null;
  onSaved?: () => void;
}) {
  const [f, setF] = useState<Feedback>({
    baseline: null,
    minutes: 0,
    rating: 3,
    publish: "maybe",
    notes: "",
  });
  return (
    <form
      className="panel stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await send({ action: "feedback", feedback: f, draftId }))
          onSaved?.();
      }}
    >
      <h3>איך הייתה התוצאה?</h3>
      <div className="fields">
        <Field label="איכות התוצאה (1–5)">
          <select
            value={f.rating}
            onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="היית מפרסמת את התוכן?">
          <select
            value={f.publish}
            onChange={(e) =>
              setF({ ...f, publish: e.target.value as Feedback["publish"] })
            }
          >
            <option value="maybe">אולי, עם שינויים</option>
            <option value="yes">כן</option>
            <option value="no">לא</option>
          </select>
        </Field>
        <Field label="דקות לפוסט בדרך הרגילה (רשות)">
          <input
            type="number"
            min="0"
            max="10000"
            value={f.baseline ?? ""}
            onChange={(e) =>
              setF({
                ...f,
                baseline: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label="דקות בדיקה ועריכה כאן (הערכה שלך)">
          <input
            type="number"
            min="0"
            max="10000"
            value={f.minutes}
            onChange={(e) => setF({ ...f, minutes: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="מה עבד ומה כדאי לשנות?">
        <textarea
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          maxLength={12000}
        />
      </Field>
      <button className="primary">שמירת משוב</button>
    </form>
  );
}
export function FeedbackScreen({ s, send }: { s: State; send: Send }) {
  const approved = s.drafts.filter((d) =>
    s.reviews.some((r) => r.draftId === d.id && r.action === "approve"),
  );
  const edited = approved.filter((d) =>
    s.reviews.some(
      (r) => r.draftId === d.id && r.action === "approve" && r.edited,
    ),
  );
  return (
    <>
      <h1>משוב על הניסוי</h1>
      <p className="intro">
        בודקים יחד אם התוכן מתאים לך. המספרים מבוססים על הפעולות והדיווחים שלך
        בלבד.
      </p>
      <div className="metrics">
        {[
          ["רעיונות", s.ideas.length],
          ["טיוטות", s.drafts.length],
          ["אושרו כפי שנוצרו", approved.length - edited.length],
          ["אושרו אחרי שינוי", edited.length],
          [
            "נדחו לפחות פעם אחת",
            new Set(
              s.reviews
                .filter((r) => r.action === "reject")
                .map((r) => r.draftId),
            ).size,
          ],
          ["דקות בדיקה שדווחו", s.feedback.reduce((n, f) => n + f.minutes, 0)],
          [
            "איכות ממוצעת (דירוג שלך, מתוך 5)",
            s.feedback.length
              ? (
                  s.feedback.reduce((n, f) => n + f.rating, 0) /
                  s.feedback.length
                ).toFixed(1)
              : "טרם דורג",
          ],
        ].map(([l, n]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <p className="muted">
        אישור אחרי עריכה או שכתוב נספר כאישור אחרי שינוי. היסטוריית הפעולות
        כלולה בייצוא. לא מחושב חיסכון בזמן.
      </p>
      <FeedbackForm send={send} />
      <div className="section-title">
        <h2>הנתונים שלך, פתוחים לבדיקה</h2>
        <button
          onClick={() =>
            download(
              "bottomline-pilot.json",
              JSON.stringify(s, null, 2),
              "application/json;charset=utf-8",
            )
          }
        >
          ייצוא נתוני הניסוי JSON
        </button>
      </div>
      <div className="panel stack">
        {s.feedback.length ? (
          s.feedback.map((f) => (
            <div className="history" key={f.id}>
              <b>
                {f.rating}/5 · {f.minutes} דקות ·{" "}
                {f.draftId ? "משוב לטיוטה" : "סיכום מפגש"}
              </b>
              <p>{f.notes || "ללא הערה כתובה"}</p>
              <small>
                {new Date(f.at).toLocaleString("he-IL", {
                  timeZone: "Asia/Jerusalem",
                })}{" "}
                · זמן רגיל לפוסט: {f.baseline ?? "לא דווח"}
              </small>
            </div>
          ))
        ) : (
          <p>עדיין לא נשמר משוב.</p>
        )}
      </div>
    </>
  );
}
