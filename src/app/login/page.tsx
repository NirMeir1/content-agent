"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="entry">
      <div className="wordmark" dir="ltr">
        bottomline<span>.</span>
      </div>
      <h1>ברוכה הבאה למעבדת התוכן</h1>
      <p>סביבת ניסוי פרטית — אין פרסום אוטומטי</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const code = new FormData(e.currentTarget).get("code");
            const r = await fetch("/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            router.push("/");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "שגיאת חיבור");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          קוד הגישה לניסוי
          <input
            name="code"
            type="password"
            required
            autoComplete="current-password"
            maxLength={200}
          />
        </label>
        <button className="primary" disabled={busy}>
          כניסה לניסוי
        </button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
