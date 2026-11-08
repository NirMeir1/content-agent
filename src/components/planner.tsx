"use client";
import { useState, useEffect, useRef } from "react";
import {
  type State,
  type Idea,
  formats,
  statuses,
  hebrewDate,
  localDate,
} from "@/lib/contracts";
import { Field, Empty, type Send } from "./ui";
export function Planner({
  s,
  send,
  openDraft,
  ai,
}: {
  s: State;
  send: Send;
  openDraft: (id: string) => void;
  ai: boolean;
}) {
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [goal, setGoal] = useState(s.profile.goal);
  const [frequency, setFrequency] = useState(s.profile.frequency);
  const [list, setList] = useState(false);
  const [planSelection, setPlanSelection] = useState("latest");
  const [edit, setEdit] = useState<Idea | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const editingId = edit?.id;
  useEffect(() => {
    if (!editingId) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const timer = setTimeout(
      () => dialog?.querySelector<HTMLInputElement>("input")?.focus(),
      0,
    );
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEdit(null);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)",
        ) || [],
      );
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [editingId]);
  const [event, setEvent] = useState({ date: localDate(), details: "" });
  const plans = s.plans.filter((p) => p.month === month);
  const activePlan =
    planSelection === "all"
      ? undefined
      : plans.find((p) => p.id === planSelection) || plans.at(-1);
  const displayedPlans = activePlan ? [activePlan] : plans;
  const ideas = s.ideas
    .filter(
      (i) =>
        i.date.startsWith(month) && (!activePlan || i.planId === activePlan.id),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)),
    0,
  ).getDate();
  const start = new Date(month + "-01T12:00:00Z").getUTCDay();
  function ideaCard(i: Idea) {
    const d = s.drafts.find((d) => d.ideaId === i.id);
    return (
      <article className="idea-card" key={i.id}>
        <span className={"badge " + (i.status === "accepted" ? "green" : "")}>
          {d
            ? statuses[d.status]
            : i.status === "accepted"
              ? "רעיון מאושר"
              : "רעיון לבדיקה"}
        </span>
        <small>
          {formats[i.format]} · {i.channel}
        </small>
        <h3>{i.title}</h3>
        <p className="rationale">{i.rationale}</p>
        {i.missing.length > 0 && <small className="warning">דורש בדיקה</small>}
        <div className="actions">
          <button onClick={() => setEdit({ ...i })}>עריכת רעיון</button>
          {i.status === "proposed" ? (
            <button
              onClick={() =>
                void send({
                  action: "idea",
                  id: i.id,
                  idea: i,
                  status: "accepted",
                })
              }
            >
              אישור רעיון
            </button>
          ) : d ? (
            <button onClick={() => openDraft(d.id)}>פתיחת טיוטה</button>
          ) : (
            <button onClick={() => void send({ action: "draft", id: i.id })}>
              יצירת טיוטה
            </button>
          )}
        </div>
      </article>
    );
  }
  return (
    <>
      <h1>תוכנית התוכן</h1>
      <p className="intro">
        קודם כיוון ורעיונות. רק אחרי שתבחרי, נכתוב את הטיוטות.
      </p>
      {!ai && (
        <p className="warning">
          מצב הדגמה ללא AI: הרעיונות נבנים בתבניות לפי פרטי העסק השמורים. זו
          אינה אסטרטגיה אישית שנוצרה ב־AI; תשובות מקצועיות דורשות השלמה שלך.
        </p>
      )}
      <form
        className="panel plan-controls"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await send({ action: "plan", month, goal, frequency }))
            setPlanSelection("latest");
        }}
      >
        <Field label="חודש התוכנית">
          <input
            type="month"
            required
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setPlanSelection("latest");
              }
            }}
          />
        </Field>
        <Field label="מה חשוב לקדם החודש?">
          <input
            value={goal}
            maxLength={12000}
            onChange={(e) => setGoal(e.target.value)}
          />
        </Field>
        <Field label="קצב התוכן">
          <select
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          >
            <option value="2">כ־2 בשבוע · 8 רעיונות</option>
            <option value="3">כ־3 בשבוע · 10 רעיונות</option>
          </select>
        </Field>
        <button className="primary">בנה לי תוכנית תוכן</button>
      </form>
      {plans.length > 0 && (
        <div className="panel">
          <Field label="תוכנית להצגה">
            <select
              value={planSelection}
              onChange={(e) => setPlanSelection(e.target.value)}
            >
              <option value="latest">התוכנית האחרונה לחודש זה</option>
              {plans.map((p, index) => (
                <option key={p.id} value={p.id}>
                  תוכנית {index + 1} · {p.goal || "ללא מטרה מוגדרת"}
                </option>
              ))}
              <option value="all">
                כל הרעיונות בחודש, כולל תוכניות קודמות
              </option>
            </select>
          </Field>
          <p className="muted">
            תוכניות קודמות נשמרות בהיסטוריה. שינוי פרטי העסק אינו משכתב תוכן
            שכבר נשמר; לבניית תוכנית מעודכנת השתמשו בכפתור למעלה.
          </p>
        </div>
      )}
      {displayedPlans.map((p) => (
        <div className="strategy" key={p.id}>
          <h2>הכיוון לחודש הזה</h2>
          <p>{p.strategy}</p>
          <small>
            {p.source === "demo"
              ? "דוגמת הדגמה — לא נוצרה באמצעות AI"
              : "נוצר באמצעות AI · נדרשת בדיקתך"}
          </small>
        </div>
      ))}
      <div className="section-title">
        <h2>
          {new Date(month + "-01T12:00:00Z").toLocaleDateString("he-IL", {
            month: "long",
            year: "numeric",
            timeZone: "Asia/Jerusalem",
          })}
        </h2>
        <button onClick={() => setList(!list)}>
          {list ? "תצוגת לוח" : "תצוגת רשימה"}
        </button>
      </div>
      {!ideas.length ? (
        <Empty>
          אין עדיין רעיונות לחודש הזה. אפשר ליצור תוכנית בעזרת הכפתור למעלה.
        </Empty>
      ) : list ? (
        <div className="stack">
          {ideas.map((i) => (
            <div key={i.id}>
              <p className="date-label">{hebrewDate(i.date)}</p>
              {ideaCard(i)}
            </div>
          ))}
        </div>
      ) : (
        <div className="calendar">
          {["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((day) => (
            <div className="day-name" key={day}>
              {day}
            </div>
          ))}
          {Array.from({ length: start }, (_, i) => (
            <div className="day blank" key={"blank" + i} />
          ))}
          {Array.from({ length: days }, (_, n) => {
            const date = month + "-" + String(n + 1).padStart(2, "0");
            return (
              <div className="day" key={date}>
                <span className="day-number">{n + 1}</span>
                {ideas.filter((i) => i.date === date).map(ideaCard)}
              </div>
            );
          })}
        </div>
      )}
      {edit && (
        <div
          className="modal"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="עריכת רעיון"
        >
          <form
            className="modal-content stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await send({
                  action: "idea",
                  id: edit.id,
                  idea: edit,
                  status: edit.status,
                })
              )
                setEdit(null);
            }}
          >
            <div className="section-title">
              <h2>מחדדים את הרעיון</h2>
              <button type="button" onClick={() => setEdit(null)}>
                סגירה
              </button>
            </div>
            <Field label="כותרת הרעיון">
              <input
                required
                maxLength={200}
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </Field>
            <div className="fields">
              <Field label="תאריך מתוכנן">
                <input
                  required
                  type="date"
                  value={edit.date}
                  onChange={(e) => setEdit({ ...edit, date: e.target.value })}
                />
              </Field>
              <Field label="פורמט">
                <select
                  value={edit.format}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      format: e.target.value as Idea["format"],
                    })
                  }
                >
                  {Object.entries(formats).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="רשת">
                <select
                  value={edit.channel}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      channel: e.target.value as Idea["channel"],
                    })
                  }
                >
                  <option>Instagram</option>
                  <option>Facebook</option>
                </select>
              </Field>
              <Field label="עמוד תוכן">
                <select
                  value={edit.pillar}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      pillar: e.target.value as Idea["pillar"],
                    })
                  }
                >
                  <option value="educational">ערך ולימוד</option>
                  <option value="personal">אישי</option>
                  <option value="proof">המחשת מומחיות</option>
                  <option value="promotional">הצעה לשירות</option>
                </select>
              </Field>
            </div>
            {(["angle", "need", "cta", "rationale"] as const).map((key, n) => (
              <Field
                key={key}
                label={
                  [
                    "זווית התוכן",
                    "צורך של הקהל",
                    "כוונת ההנעה לפעולה",
                    "למה זה מתאים לעסק",
                  ][n]
                }
              >
                <textarea
                  value={edit[key]}
                  onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="מה חסר ודורש אישור? (כל פריט בשורה)">
              <textarea
                value={edit.missing.join("\n")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    missing: e.target.value.split("\n").filter(Boolean),
                  })
                }
              />
            </Field>
            <div className="actions">
              <button className="primary">שמירת רעיון</button>
              <button
                type="button"
                onClick={async () => {
                  if (await send({ action: "alternative", id: edit.id }))
                    setEdit(null);
                }}
              >
                הצעת רעיון חלופי
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (await send({ action: "removeIdea", id: edit.id }))
                    setEdit(null);
                }}
              >
                הסרת רעיון
              </button>
            </div>
          </form>
        </div>
      )}
      <form
        className="panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await send({ action: "event", ...event }))
            setEvent({ ...event, details: "" });
        }}
      >
        <h2>משהו מיוחד קורה בעסק?</h2>
        <p className="muted">
          אפשר להוסיף אירוע או הצעה אמיתיים לתוכניות הבאות. אין ניטור אוטומטי של
          טרנדים.
        </p>
        <div className="fields">
          <Field label="תאריך האירוע">
            <input
              type="date"
              required
              value={event.date}
              onChange={(e) => setEvent({ ...event, date: e.target.value })}
            />
          </Field>
          <Field label="פרטי ההזדמנות">
            <input
              required
              value={event.details}
              maxLength={2000}
              onChange={(e) => setEvent({ ...event, details: e.target.value })}
            />
          </Field>
        </div>
        <button>שמירת הזדמנות</button>
        {s.events.map((e) => (
          <p key={e.id}>
            {hebrewDate(e.date)} · {e.details}
          </p>
        ))}
      </form>
    </>
  );
}
