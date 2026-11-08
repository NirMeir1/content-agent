# Implementation notes

The specification is the single source of truth. Repository initially contains only that file; no Git metadata or existing application. Node 24 is installed; use npm.cmd in Windows PowerShell where npm.ps1 is blocked.

Architecture: Next.js App Router, TypeScript, Tailwind, Zod, Drizzle + libSQL. One persistent workspace aggregate per demo/real profile, normalized workspace identity and atomic revision-controlled writes. Version history, reviews, preferences and feedback live in the aggregate; database handles atomic concurrency. Two deliberate workspaces preserve fictional demo when starting blank. No multi-tenancy.

Build order: contracts and persistence; fictional fixtures; profile and planner; draft studio and review history; server-only structured Responses generation; feedback export; access-code gate; tests and responsive browser QA; handoff.

Design: warm ivory #f7f6f2, forest #183e35, lime #d8edaa, restrained editorial lists, right navigation and spacious primary action. Mobile navigation wraps without horizontal overflow. All generated demo material explicitly labeled. No external image/font dependency.

No OPENAI_API_KEY was present. User explicitly authorizes completing no-key implementation and reporting live AI unverified, overriding the setup skill's optional credential provisioning stop.

Implemented and verified: five RTL screens, four-step onboarding, fictional/blank workspaces, monthly/list planner, all four structured draft formats, edits/revisions/approval/rejection, immutable previous versions, manual-ready status, clipboard/text/JSON export, preferences, feedback summaries, user-entered events and signed pilot access. Schema initialization is idempotent and the same Drizzle/libSQL model supports file or remote URLs.

Final verification: 14 unit tests and 6 production Playwright journeys pass; typecheck/lint/build pass; protected HTTP routes and persistence after server process restart pass. Details, environment, screenshots and honest limitations are in VERIFICATION.md. Live AI and remote deployment remain unverified without credentials. Default local fictional demo was restored; production server was started at http://127.0.0.1:3000.

Resolved observed issues: Windows npm wrapper policy (use npm.cmd); sandbox Node user-info restriction (run authorized project commands outside it); CLI top-level-await module mismatch; local request-origin mismatch; explicit label associations; platform Hebrew font fallback (bundled Heebo); minimatch development advisory. A mobile generation test initially expected another shortening despite the saved shortness preference already affecting the new draft; expectation now correctly accepts that persistent personalization.
