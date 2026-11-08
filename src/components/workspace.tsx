"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Home,
  CalendarDays,
  CheckCircle2,
  BriefcaseBusiness,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { type State, formats, hebrewDate } from "@/lib/contracts";
import { ProfileScreen } from "./profile";
import { Planner } from "./planner";
import { Studio } from "./studio";
import { FeedbackScreen, type Send, Empty } from "./ui";
const nav = [
  { label: "היום", icon: Home },
  { label: "תוכנית התוכן", icon: CalendarDays },
  { label: "טיוטות ואישורים", icon: CheckCircle2 },
  { label: "העסק שלי", icon: BriefcaseBusiness },
  { label: "משוב על הניסוי", icon: MessageCircle },
];
export function Workspace() {
  const [workspace, setWorkspace] = useState<"demo" | "own" | null>(null);
  const [data, setData] = useState<{
    state: State;
    revision: number;
    ai: boolean;
  } | null>(null);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async (key: "demo" | "own") => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/workspace?workspace=" + key, {
        cache: "no-store",
      });
      if (!r.ok)
        throw new Error("לא ניתן לטעון את העסק. בדקו חיבור או קוד גישה.");
      setData(await r.json());
      setWorkspace(key);
      localStorage.setItem("bottomline-workspace", key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאת טעינה");
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const key = localStorage.getItem("bottomline-workspace");
    if (key === "demo" || key === "own") {
      const task = setTimeout(() => void load(key), 0);
      return () => clearTimeout(task);
    }
  }, [load]);
  const send: Send = async (action) => {
    if (!data || !workspace || busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, workspace, revision: data.revision }),
      });
      const result = await r.json();
      if (!r.ok) {
        if (result.state) setData(result);
        throw new Error(result.error);
      }
      setData(result);
      setNotice(
        ["plan", "draft", "revision", "alternative"].includes(
          String(action.action),
        )
          ? "התוכן נוצר ונשמר. כדאי לבדוק שהוא מתאים לך."
          : "השינויים נשמרו",
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "לא ניתן להשלים את הפעולה");
      return false;
    } finally {
      setBusy(false);
    }
  };
  function openDraft(id: string) {
    setSelected(id);
    setTab(2);
    window.scrollTo(0, 0);
  }
  function go(n: number) {
    setTab(n);
    if (n === 2) setSelected(null);
    setNotice("");
    window.scrollTo(0, 0);
  }
  if (!workspace || !data)
    return (
      <main className="entry">
        <div className="wordmark" dir="ltr">
          bottomline<span>.</span>
          <small>Content Lab · Pilot</small>
        </div>
        <h1>
          תוכן שמתחיל
          <br />
          בעסק שלך.
        </h1>
        <p className="intro">
          מכירים את הקול שלך, בונים כיוון, וכותבים יחד.
          <br />
          את בוחרת מה ראוי לצאת החוצה.
        </p>
        <div className="entry-actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => void load("demo")}
          >
            נסה עם עסק לדוגמה <ArrowLeft size={18} />
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setTab(3);
              void load("own");
            }}
          >
            הגדר את העסק שלי
          </button>
        </div>
        <div className="pilot-note">
          <b>סביבת ניסוי — אין פרסום אוטומטי</b>
          <p>העסק לדוגמה בדיוני לחלוטין. מידע אמיתי יש להזין בהסכמה בלבד.</p>
        </div>
        <p role="alert">{error}</p>
        {busy && <p role="status">טוענים את סביבת העבודה…</p>}
      </main>
    );
  const s = data.state;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="wordmark" dir="ltr" href="/">
          bottomline<span>.</span>
          <small>Content Lab · Pilot</small>
        </Link>
        <nav aria-label="ניווט ראשי">
          {nav.map((item, i) => (
            <button
              className={tab === i ? "selected" : ""}
              key={item.label}
              onClick={() => go(i)}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            {workspace === "demo"
              ? "עסק לדוגמה · בדיוני"
              : "העסק שלך · סביבת ניסוי"}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("bottomline-workspace");
              setWorkspace(null);
              setData(null);
            }}
          >
            החלפת סביבת עבודה
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>{s.profile.business || "מכירים את העסק שלך"}</span>
          <span className="mode">
            {data.ai ? "יצירה באמצעות AI זמינה" : "מצב הדגמה · ללא AI"}
          </span>
        </header>
        <div className="pilot-banner">
          סביבת ניסוי — אין פרסום אוטומטי
          {workspace === "demo" ? " · כל פרטי העסק והדוגמאות בדיוניים" : ""}
        </div>
        {error && (
          <div className="error" role="alert">
            {error}{" "}
            <button onClick={() => void load(workspace)}>
              רענון נתונים מהשרת
            </button>
          </div>
        )}
        <div className="notice" aria-live="polite">
          {busy ? "הפעולה מתבצעת… ביצירת תוכן זה עשוי לקחת עד דקה." : notice}
        </div>
        <fieldset className="workspace-fieldset" disabled={busy}>
          <div className="content">
            {tab === 0 ? (
              <>
                <h1>מה כדאי לעשות השבוע?</h1>
                <p className="intro">
                  פחות להתחיל מדף ריק. יותר תוכן שיש לו סיבה להיות כאן.
                </p>
                <div className="home-grid">
                  <div>
                    <section className="hero-panel">
                      <div>
                        <h2>תוכן טוב מתחיל בעסק שלך</h2>
                        <p>
                          רעיונות עם כיוון, טיוטות בקול שלך, ומילה אחרונה שתמיד
                          נשארת אצלך.
                        </p>
                      </div>
                      <button onClick={() => go(s.plans.length ? 2 : 1)}>
                        {s.plans.length
                          ? "תוכן שממתין לאישור"
                          : "בנה לי תוכנית תוכן"}
                        <ArrowLeft size={18} />
                      </button>
                    </section>
                    <div className="section-title">
                      <h2>מכאן אפשר להתקדם</h2>
                      <button className="text-button" onClick={() => go(1)}>
                        לכל התוכנית ←
                      </button>
                    </div>
                    <div className="attention">
                      <button onClick={() => go(1)}>
                        <b>
                          {
                            s.ideas.filter((i) => i.status === "proposed")
                              .length
                          }
                        </b>{" "}
                        רעיונות לבדיקה
                      </button>
                      <button onClick={() => go(2)}>
                        <b>
                          {s.drafts.filter((d) => d.status === "draft").length}
                        </b>{" "}
                        טיוטות לאישור
                      </button>
                      <button onClick={() => go(2)}>
                        <b>
                          {
                            s.drafts.filter((d) =>
                              ["approved", "ready"].includes(d.status),
                            ).length
                          }
                        </b>{" "}
                        מאושרים לפרסום ידני
                      </button>
                    </div>
                    <h2 className="section-heading">
                      טיוטות קרובות לעריכה ואישור
                    </h2>
                    {s.drafts.length ? (
                      <div className="stack">
                        {s.drafts
                          .filter((d) => d.status === "draft")
                          .slice(0, 3)
                          .map((d) => {
                            const idea = s.ideas.find(
                              (i) => i.id === d.ideaId,
                            )!;
                            return (
                              <article className="home-row" key={d.id}>
                                <div>
                                  <span className="badge">
                                    {formats[idea.format]}
                                  </span>
                                  <h3>{idea.title}</h3>
                                  <p>{idea.rationale}</p>
                                  <small>
                                    {hebrewDate(idea.date)} · {idea.channel}
                                  </small>
                                </div>
                                <button onClick={() => openDraft(d.id)}>
                                  לעריכה ואישור ←
                                </button>
                              </article>
                            );
                          })}
                      </div>
                    ) : (
                      <Empty>נתחיל מהעסק שלך, ואז נבנה תוכנית ממוקדת.</Empty>
                    )}
                  </div>
                  <aside className="memory-column">
                    <section className="panel memory">
                      <BriefcaseBusiness size={26} />
                      <h2>העסק שלי</h2>
                      <p>
                        {s.profile.bio ||
                          "ספרי לנו על המומחיות שלך כדי שנוכל להציע תוכן מתאים."}
                      </p>
                      <hr />
                      <b>מה חשוב לזכור?</b>
                      <p>{s.profile.tone || "הקול שלך עדיין לא הוגדר"}</p>
                      <p>{s.profile.needs || "כדאי להגדיר למי התוכן מיועד"}</p>
                      <button onClick={() => go(3)}>עדכון פרטי העסק</button>
                    </section>
                    <section className="pilot-note">
                      <b>התוכן הוא התחלה לשיחה.</b>
                      <p>
                        בודקים עובדות, מתקנים ניסוחים, ומחליטים מה באמת מתאים
                        לך. אין כאן הבטחה לתוצאות.
                      </p>
                    </section>
                  </aside>
                </div>
              </>
            ) : tab === 1 ? (
              <Planner s={s} send={send} openDraft={openDraft} ai={data.ai} />
            ) : tab === 2 ? (
              <Studio
                s={s}
                send={send}
                selected={selected}
                select={setSelected}
              />
            ) : tab === 3 ? (
              <ProfileScreen s={s} send={send} />
            ) : (
              <FeedbackScreen s={s} send={send} />
            )}
          </div>
        </fieldset>
        <footer>Bottomline Content Lab · פיילוט אישי · פרסום ידני בלבד</footer>
      </main>
    </div>
  );
}
