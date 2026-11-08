# CODEX BUILD TASK — Bottomline Content Agent (Client Pilot MVP)

You are a senior full-stack product engineer, UX designer, and practical AI systems engineer. Your assignment is to **implement, run, and verify** a complete, working, Hebrew-first web-app MVP for a real prospective Israeli client to evaluate. This is an experimental pilot, **not a production SaaS**.

**Do the implementation, not just a plan, mockup, design, or PRD.** Work autonomously. Inspect the current repository and tools first, preserve existing unrelated work, make reasonable decisions, and execute end to end. Only report blockers that genuinely require account credentials, permission, or a secret you cannot access. Never invent successful tests or deployments.

## 1. User, problem, and success definition

Project/working name: **Bottomline Content Lab — Pilot** (the name should be easy to change).

Initial user: a **business coach / consultant in Israel**, experienced enough with marketing to recognize generic, inaccurate, salesy content. She works with other self-employed professionals and may refer pilot customers. Her actual identity, services, achievements, voice, and clients are **not provided**. **Do not invent personal details or treat fictional seed data as her actual background.**

Problem: self-employed professionals struggle to consistently think of, plan, write, adapt, and approve high-quality social content. They have little time, and do not want to learn prompting, APIs, or agent configuration.

Hypothesis to test: after a one-time assisted setup, a tailored agent can propose a useful monthly content direction, generate credible Hebrew content in the business owner's style, and require minimal editing and involvement. We want observable, critical client feedback, not a polished but empty demo.

**The product is primarily a PERSONALIZED AI CONTENT STRATEGIST AND CREATOR, not a social scheduler.** The visible calendar/management layer supports the content journey; it is not a generic Buffer clone.

Pilot success questions:
- Does the client recognize *her own voice and expertise* in the output?
- Are ideas relevant to her specific audience, offers, and goals?
- Does the app avoid unsupported business claims and invented facts?
- How many drafts are approved as-is, edited, or rejected?
- How many minutes would the client spend compared with her current process?
- Is the experience simple enough for a nontechnical business owner?

Do not assert actual improvement, increased engagement, revenue, or time saved without measured evidence.

## 2. Market context — reference, not a blueprint to copy

Israeli competitors and their **advertised** features, checked November 2026:
- Trendz — https://trendzsocial.co.il/ — branding questionnaire, suggested daily content, WhatsApp approval, automated publishing; advertises pricing from ₪499/mo.
- Rescale — https://www.rescale-ai.com/ — business questionnaire/site-based onboarding, marketing plan, claimed competitor/trend monitoring, autopublishing; advertises ₪399/mo.
- MIA — https://miaben.co.il/ai-mia/ — AI-written content, graphics, planning/scheduling, manual or automatic approvals, Canva/CapCut-imported videos; advertises ₪390/mo plus VAT.
- Neword — https://he.neword.ai/ and https://en.neword.ai/ — brand-aware writing, calendar, approvals, draft management, scheduling, analytics; Hebrew page advertises plans from ₪59/mo before VAT. Some of its web pricing/claims are inconsistent across pages.

**Important epistemic note:** these are mostly vendor-website claims. Independent product reviews are scarce. We have not verified real-world content quality, user retention, or revenue for these four products. Do not claim these products have deficiencies we have not demonstrated. Do not scrape, copy UI/code, or imitate their branding. Borrow only generic UX patterns: easy onboarding, approval-first review, visible content plan, brand memory, edit feedback.

There is also a cheap DIY alternative: ChatGPT + Canva + Meta Business Suite. The pilot must make the *workflow and personalization* demonstrably easier, not merely generate one caption.

## 3. Scope discipline — PRIORITY

Implement one beautiful, functioning **single-business, single-user pilot**. The first user is one Israeli business owner. Founder-assisted onboarding is acceptable.

### Required (P0) — complete these fully
1. Hebrew-first responsive RTL interface, excellent desktop and mobile usability.
2. An easy, editable business/owner profile (“העסק שלי” / “DNA של העסק”) with persistent data.
3. Ability to provide examples of prior posts and explicitly mark liked/disliked writing styles and forbidden claims.
4. AI-generated monthly or 4-week *strategy and idea plan*, with rationale tied to profile, objectives, and audience.
5. AI-generated usable drafts for: Facebook/Instagram post, carousel outline, Story sequence, and Reel script/production brief. All generation must be grounded in the saved profile; do not require the user to enter prompts.
6. One-click approve / edit / request revision / reject workflow. Capture reasons and keep history. Revisions can be requested in everyday Hebrew.
7. Simple visual monthly/weekly content board with date, network, format, title, and meaningful statuses. Rescheduling must save persistently.
8. Clear readable post editor with a mobile social-feed preview, caption, CTA, brief for the image/visual, and relevant structure for carousel/story/reel. Provide copy-to-clipboard and useful text export for manual publication.
9. Honest feedback/learning loop: later generations *actually use* stored approved text, corrections, banned phrases, and rejection reasons. This is prompt-context personalization, **not model retraining**.
10. Pilot feedback capture and export: ratings, written feedback, time estimate, approval/edit/reject counts, revision reasons, and simple CSV or JSON export for the founder.
11. Seeded **fictional** business-coach demo with realistic, clearly labeled example data. Fresh onboarding must also work without seed content.
12. Everything persists after refresh/restart. All visible controls required for the core journey work; there must be no misleading placeholder buttons.

### Valuable only if P0 is solid (P1)
- A small manual “marketing opportunities” input: owner/founder can enter an event, holiday, promotion, or milestone with date and details; AI can propose content for it. **Do not pretend to monitor trends in real time.**
- An optional user-uploaded image or a link to an existing brand photo, with reasonable limits and simple preview. If uploads require disproportionate effort, prefer existing image URLs plus a beautifully rendered text/brand-color visual card and document the gap.
- Simple manual performance notes per published post (e.g. reach/saves/comments) with source labeled “entered by user”; only use actual entered metrics in later recommendations.
- A clean branded, exportable static visual (SVG/PNG) created from title + brand palette; explicitly not labeled as AI image generation.

### Explicitly OUT OF SCOPE (do not spend time here)
- Real publishing to Meta/Facebook/Instagram/TikTok/LinkedIn, OAuth, account connection, social-media scraping, competitor monitoring, real-time trends, automatic web research.
- WhatsApp integration, email dispatch, push notifications, cron, autonomous scheduling.
- AI video generation, audio generation, fully designed image carousels, native mobile apps.
- Billing/subscriptions, pricing plans, teams/roles/agencies, multi-tenancy, complex permissions, elaborate CMS, RAG/vector DB, fine-tuning, analytics integrations, dashboards with fabricated metrics.
- A polished public marketing/landing website, SEO work, enterprise compliance, and unnecessary microservices.

A working end-to-end journey is worth more than lots of shallow features.

## 4. Product UX: key paths and screens

### A. First visit / demo entry
- Clean brand-neutral opening (Bottomline as provider) with two deliberate paths: **“נסה עם עסק לדוגמה”** and **“הגדר את העסק שלי”**.
- Display a noticeable **“סביבת ניסוי — אין פרסום אוטומטי”** explanation. Clearly label any demo/fixture/sample.
- If the pilot starts with fictional data, the customer can still edit all its fields or reset to blank. Do not force her to read documentation.

### B. Guided profile onboarding (3–4 short steps, save progress)
Ask for:
- Owner name, business name, field, short bio/real expertise, services/offers, differentiators.
- Ideal audience, their needs, marketing goal, preferred channels and desired weekly content frequency.
- Preferred tone, typical words/phrases, words to avoid, relevant restrictions, 3–5 real example posts (paste text), common questions, offers/promotions (only if provided).
- Optional brand colors/logo or existing image references.
Use plain conversational Hebrew. A founder can fill the questionnaire with the client; do not require external integrations or advanced AI configuration. Make fields optional where safe, with helpful examples. Never fabricate missing biography/qualifications/services. Show a compact **“מה הסוכן יודע על העסק”** summary that is editable.

### C. Home dashboard (“מה כדאי לעשות השבוע?”)
- Primary CTA: **“בנה לי תוכנית תוכן”**; if a plan already exists: **“תוכן שממתין לאישור”**.
- Highlight exactly what needs user attention: unapproved ideas, draft reviews, approved posts ready for manual publishing.
- Surface “why this idea suits your business”, not anonymous trend buzzwords.
- The app should not overwhelm the owner with settings, charts, and menu options.

### D. Plan generation and approval
- Owner chooses a target month (default current in Asia/Jerusalem), goal, and approx. 2–3 posts/week, yielding ~6–10 high-quality distinct ideas rather than 30 repetitive posts.
- First generate a compact editorial plan, **not all full drafts immediately**. Each idea: date, format, channel, content pillar (educational/personal/proof/promotional), specific angle, target-audience need, CTA intent, why it is relevant, and any missing fact requiring owner input.
- Display in a simple calendar with an optional list view. User can accept ideas, edit, reschedule, remove, or request alternatives.
- Generating one or multiple drafts from selected ideas is explicit. Don't incur unnecessary LLM cost by regenerating everything on each click.

### E. Draft studio and approval
- For a selected idea, generate Hebrew copy with personality and format-specific output.
- For regular post: hook, body/caption, CTA, relevant hashtags only, optional visual brief, brief factual checks.
- For carousel: 4–6 slides as structured copy plus main caption and design guidance.
- For story: 3–5 frames with short on-screen text, suggested visuals, optional interaction.
- For Reel: first 3-sec hook, 20–45-sec scene/shot outline, spoken script, caption, visual brief. **This is a script/brief, not an AI-generated video.**
- Show mobile-format preview and editable fields, copy caption, approve/reject/revise, manual “מוכן לפרסום” status. Never indicate actual posting happened.
- Revision affordances: “פחות מכירתי”, “יותר אישי”, “קצר יותר”, “קרוב יותר לסגנון שלי”, and free-text revision. Record each selection.
- Rejection requires brief reason or category: generic/incorrect/not my voice/not relevant/too promotional/other. Store before subsequent generation.
- Preserve original AI draft, edited version, and approval history; at least one previous version accessible.

### F. Pilot feedback and metrics
- Include **“איך הייתה התוצאה?”** rating after approval/rejection, and an easy end-of-session summary.
- Capture baseline minutes per typical post (manual self-report), minutes of review/editing in this app (manual estimate and/or transparent duration calculation), and whether the owner would actually publish this draft.
- Summarize total ideas, drafted, approved as-is, approved with edits, rejected, review minutes, and quality ratings. Do not claim a percentage of time saved without an actual provided baseline and valid comparison.
- Export the underlying data (UTF-8 CSV with Hebrew-friendly encoding, or JSON) so founder can analyze feedback after pilot.

### G. Suggested information architecture
Keep navigation minimal (4–5 items max): **היום | תוכנית התוכן | טיוטות ואישורים | העסק שלי | משוב על הניסוי**. The “marketing opportunities” input can live inside the plan screen.

## 5. AI behavior: grounded, user-controlled, high-quality Hebrew

Use real server-side LLM calls **only when `OPENAI_API_KEY` is configured**. Use the current supported OpenAI Node SDK and Responses API. Prefer structured outputs validated with Zod or strict JSON schema so UI and persistence are reliable. Keep the model configurable via `OPENAI_MODEL` and select/document an actually supported, economical text model; do not hardcode a model without verifying it is available. Useful reference: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses .

Implement **three prompt templates/services** with tested schemas:
1. Plan creator: business profile + goal + existing approved/rejected content + month/locale + owner-provided events -> dated, varied topic ideas.
2. Draft creator: profile + a selected approved idea + 2–5 representative owned writing examples + explicit do/don't rules + recent approvals/rejections -> platform/format-specific structured content.
3. Revision creator: existing draft + edit request + business facts + explicit constraints -> revised version without silently changing known facts.

Guidelines for all content:
- Natural, idiomatic **Israeli Hebrew**, professional and human; no generic marketing clichés, excessive emojis, hollow promises, or identical opening hooks.
- Stay faithful to supplied facts. **Never invent credentials, testimonials, prices, promotions, results, research studies, clients, or personal stories.** When a story or factual detail is missing, output a clear “requires client confirmation” item or a placeholder for manual input, not a fabricated claim.
- Respect forbidden topics/phrases and tone constraints. Regulated professional claims must be cautious and marked for review.
- Avoid repeated ideas, favor substantive usefulness and owner expertise, balance educational/personal/promotional content.
- Do not claim to have monitored real-time news, social trends, analytics, or competitors. Use only user-provided events. Date calculation must be local to **Asia/Jerusalem** and avoid invented awareness-day dates.
- Include an internal list of supplied facts used and unanswered questions; show a helpful light-touch **“דורש בדיקה”** warning in the draft UI when appropriate. Do not show fake quantitative confidence scores.
- Persist concise explicit preference rules learned from corrections and rejections (e.g. “avoid exclamation marks”, “prefer first-person reflection”) rather than claiming that the base model learned automatically. Let the owner remove these rules.
- Fail gracefully: loading/progress, network/timeouts, structured-output validation, missing key, model errors; keep user data intact on failure.

**No-key/demo mode:** The app must still boot and permit an informative full UI walkthrough with seeded plan/draft examples and all approval, editing, feedback, and planning interactions. If generation without a key uses a small deterministic template engine, label generated output **“דוגמת הדגמה — לא נוצרה באמצעות AI”**; never disguise fixture text as live AI. With a valid API key, real generation must work.

## 6. Technical implementation: simple, local-first, preview-ready

Before changing anything, inspect the repository, package manager, git status, existing application/framework, and available environment. Reuse an established stack if present without breaking unrelated files. If the repo is empty, use the following preferred stack:
- Next.js App Router + TypeScript + Tailwind CSS (current stable compatible versions).
- Clean reusable React UI components with accessible form controls; a lightweight component library is acceptable but not mandatory.
- Zod validation for API boundaries, output contracts, and form inputs.
- Drizzle ORM + SQLite/libSQL using `@libsql/client`, configured so the *same data model* works with local `file:` storage and optionally remote libSQL/Turso via environment variables. Do not introduce parallel databases or an elaborate repository abstraction. See https://orm.drizzle.team/docs/get-started/sqlite-new .
- OpenAI's supported official JavaScript SDK server-side only, no keys in browser. https://help.openai.com/en/articles/5112595-best-practices-for-%20API%20-key-safety
- Playwright for a small real end-to-end smoke test if available; basic unit tests for AI context assembly, validation, feedback loop, and state transitions.

Architecture: one monolithic full-stack web app, simple server endpoints/server actions, persistent tables; avoid Redis, queues, Docker as a dependency, vector search, or external SaaS services in the default local demo.

Suggested minimal persistent data model (adapt to actual implementation):
- `business_profiles`: core business/owner context, persona, tone, prohibited claims, audience, goals, brand kit.
- `writing_samples` or examples attached to profile, with positive/negative classification.
- `preference_rules`: explicit feedback-derived style instructions with evidence and edit/remove controls.
- `content_plans` + `content_ideas`: proposed date, channel, goal, type, rationale, status.
- `drafts` + `draft_versions`: structured caption/slides/frames/script/visual brief, source idea, status, revision history.
- `review_events`: approve/reject/edit/request revision, reason, timestamp, optional rating/duration.
- `pilot_feedback`: explicit self-reported baseline and session feedback.
- Optional `marketing_events` and manual `post_metrics` only if time permits.

Store timestamps in UTC and display in Asia/Jerusalem; render all dates in natural Hebrew. All API routes must validate IDs and payloads. No fabricated statistics or silent failures.

### Safe demo access / sharing
- **Local demo:** should start with minimal dependencies and without creating external accounts. Default local app uses synthetic data only.
- **Hosted preview:** design app to be deployable with a hosted libSQL database and a Node-compatible host / Vercel; include specific instructions but do **not** claim it is deployed if you lack credentials. Protect hosted preview with a *single shared pilot access code*, a server-issued signed HttpOnly SameSite cookie, and server-side checks for both pages and mutations. This is **temporary demo access**, not production authentication.
- Real customer information should only be entered with consent. Do not place real customer personal details or secrets into public fixtures, logs, source control, or client-visible keys. `.env` and DB files must be gitignored. Include minimal reset/cleanup instructions.
- Prevent accidental API spend in a hosted pilot: simple per-day generation limit configurable by env, with helpful UI feedback. Never expose service keys. Keep this small; no enterprise security project.

### Visual design
Create a *high-quality actual product*, not a generic admin dashboard or white-label template. Calm, trustworthy, warm SaaS design with excellent Hebrew typography, substantial whitespace, clear hierarchy, polished cards, meaningful status badges, restrained colors, and purposeful icons. RTL must be correct in navigation, calendars, dropdowns, text fields, modals, and mobile previews. Treat email/URLs and code-like strings in LTR where needed.

Mobile width (~390px) and desktop (~1440px) must be usable. No excessive onboarding friction. Inline microcopy should sound like a helpful human, not technical AI jargon. Accessible labels, keyboard navigation, visible errors, and sensible empty/loading states are required. Give the user a credible demo even before configuring a key.

## 7. Demo data — realistic, explicitly fictional

Seed a fictional Israeli business coach (e.g. “נועה | ליווי עסקי לעצמאיות” — label **עסק לדוגמה**). Create plausible but **synthetic** business facts, service description, audience, writing preferences, 3–5 owned-style example posts, a monthly plan and 3–4 drafts across formats. Do not use real testimonials or promise actual business results. Include at least one intentionally too-salesy alternate draft to demonstrate rejection + feedback improvement, and at least one content idea needing client confirmation, so the review flow is meaningfully testable.

Allow a new empty business profile to be created without deleting seeded data inadvertently; if supporting multiple profiles complicates single-business design, provide a deliberate “switch demo / start fresh” experience. Do not implement full multi-tenancy.

## 8. Build order and quality gates — execute the work

1. Read the repo, briefly record an implementation plan in `IMPLEMENTATION_NOTES.md`, and select the smallest practical architecture.
2. Bootstrap/configure app, DB schema, migration, seed data and startup scripts. Ensure starting with no API key works.
3. Build the onboarding, home dashboard and profile editor; test persistence.
4. Build monthly planner, calendar/list, statuses and manual edits/rescheduling; test persistence.
5. Build the post studio, structured format-specific previews, approval/edit/rejection/version history, and clipboard/export.
6. Integrate real AI generation with structured validation and honest no-key demo fallback; use stored profile and feedback for subsequent calls.
7. Build a minimal pilot feedback screen and export.
8. Polish Hebrew RTL, empty states and desktop/mobile responsive layout. Remove inert controls and lorem ipsum.
9. Add tests and **actually run** install, typecheck, lint, unit tests, build, seed and startup. Where available run Playwright/browser test with screenshots at desktop and mobile sizes. Fix observable failures.
10. Write `README.md` with setup for Windows PowerShell and macOS/Linux, exact environment vars, local run steps, how to enable AI, how to reset the fictional demo, limitations and optional hosted-preview steps.

### Required commands/ergonomics
Provide useful npm scripts, such as `dev`, `build`, `lint`, `typecheck`, `test`, `db:push`/`db:migrate`, `demo:seed`, and optionally `demo:reset`, with accurate instructions. Provide `.env.example`. Keep setup a few steps. Use local SQLite in a gitignored file by default.

### Acceptance test — do not call the MVP complete unless this works
From a fresh checkout and no AI key:
1. Install dependencies, initialize DB, seed demo, start local server.
2. Open the Hebrew app, choose fictional demo, edit and save two details in “העסק שלי”; refresh and verify persistence.
3. Inspect content ideas for a selected month; manually adjust one idea, date and format; refresh and verify.
4. Open a seeded post, preview it, edit the caption and save; verify the previous version remains available.
5. Reject a deliberately generic draft with reason “לא נשמע כמוני”; verify the feedback appears in the saved preference/feedback context.
6. Approve another draft and copy/export its content without claiming it was published.
7. Enter and save pilot feedback; export data.
8. Verify all this on a mobile-size viewport, correct RTL and no critical console errors.

With a configured, accessible AI key additionally verify:
9. Generate a fresh content plan tied to the CURRENT edited profile.
10. Generate a specific draft from an idea, revise it in Hebrew, approve/reject, then generate a new draft that demonstrably incorporates recent feedback constraints. Test that unrelated personal claims are not invented.

If an external credential is missing, report the live-AI path **not verified** and still complete all no-key acceptance steps. Never fake API responses and report them as live AI.

## 9. Final handoff format

When finished, give a concise Hebrew report (English technical identifiers are fine):
- What actually works, main user journey, and what is intentionally not included.
- Repo structure and exact local commands.
- What was tested, actual results, and any test limitations.
- How to supply `OPENAI_API_KEY`/`OPENAI_MODEL` safely and verify real AI generation.
- How to provide a password-protected, persistent hosted demo to the client (or deployment URL **only if actually deployed**).
- Any remaining issues, limited to those that affect the pilot.

Also write a short `PILOT_SCRIPT_HE.md`: a 10–15-minute walkthrough the founder can do with the business coach, followed by 5–7 sharply focused questions on content relevance, personal voice, editing burden, trust, ease, and willingness to pay.

**Nonnegotiable:** Deliver actual source code and a functional demo. Keep it small and honest. Prioritize user-value validation, not technical showmanship.
