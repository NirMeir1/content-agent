# Verification — 2026-11-08

Follow-up fix: the no-key generator incorrectly reused business-coaching topics after a different business profile was saved. Fixed by isolating fictional coaching fixtures and generating no-key topic/draft templates from current services, field, audience, needs and questions. The calendar now defaults to the latest plan, with explicit history selection, and prominently explains the limitations of no-AI generation. No customer data was reset. Regression run: 17 unit tests, all 6 production desktop/mobile journeys, TypeScript, ESLint and production build passed. Bakery and florist cases assert topic relevance and absence of coaching-template leakage; browser tests also verify two plans in one month display 8 current ideas rather than 16 mixed ideas. Live AI remains unverified.

Environment: Windows PowerShell, Node 24.16.0, npm 11.13.0, Next.js 16.4.5, Chromium 158 through Playwright. No OPENAI_API_KEY was present. No external account was provisioned and no deployment was performed.

| Check | Actual result |
| --- | --- |
| Dependency install | Passed; package-lock.json included |
| SQLite initialization / fictional seed / reset | Passed; own workspace preserved by demo reset |
| TypeScript | Passed, no errors |
| ESLint | Passed, no errors or warnings |
| Unit tests | 14 passed: output/schema contracts, format structures, Jerusalem date, current context, corrections/rejections, state transitions, version retention, failed-generation checkpoint, optimistic concurrency, atomic limits and signed sessions |
| Production build | Passed |
| Browser acceptance | 6 passed: three journeys each at desktop 1440×1000 and mobile 390×844 |
| Protected access HTTP test | Passed: page redirect, unauthenticated API rejection, valid/invalid code, signed HttpOnly SameSite Secure cookie, tampered cookie, cross-origin mutation rejection, invalid payload, stale write rejection and database persistence after process restart |
| Dependency audit | 0 known vulnerabilities after updating the development-only minimatch dependency |
| Live AI / remote database / hosted HTTPS preview | Not verified: credentials unavailable |

Browser journeys exercised real UI and persistence: profile edits and refresh; date/title/format changes and refresh; all four draft formats; structured slide/frame/spoken-script edits; previous versions; rejection with “לא נשמע כמוני” and saved preference; approval and ready-for-manual-publication status; real clipboard readback; text and JSON downloads with content assertions; feedback ratings, minutes and baseline; fresh onboarding; no-key plan/draft/revision generation with explicit demo labels. The complete acceptance journeys asserted no page/console errors, RTL and no horizontal overflow. No test claims a real social post was published.

Unit tests and Playwright use separate test databases. The access test uses a third test database. Browser fixtures are not customer data. The final local fictional demo was restored with `demo:reset`.

## Visual comparison

The Browser plugin/skill was not available. The Playwright MCP navigation attempt timed out; repository Playwright Chromium successfully performed all browser QA. Screenshots were captured by real Playwright pages in `output/qa` (ignored). Both the generated concept and rendered screenshots were opened with `view_image`.

Concept: `C:/Users/meirn/.codex/generated_images/01a1bb36-2c66-7821-9419-256ca074d2a1/exec-a2ba2669-3e46-4132-8083-d06c41665b48.png`. Built-in Image Gen was used with a brief for a warm ivory/forest/lime Hebrew RTL content workspace, five navigation links, primary review action, editorial draft list, profile memory column, pilot notice, mobile view and studio. This image is a design reference, not an asset needed by the application. Its canvas contains several concept states; individual browser views were checked at 1440×1000 and 390×844 rather than treating the whole composite as a literal viewport.

| Comparison point | Evidence / resolution |
| --- | --- |
| Palette | Warm ivory #f7f6f2, forest #183e35 and lime #d8edaa preserved in background, navigation, action panel and selected states |
| Layout | Right desktop navigation, main editorial workspace, left memory column and left studio phone preview preserved |
| Typography | Bundled Hebrew Heebo replaces unreliable platform-only font rendering; headings, controls and body checked for hierarchy and legibility |
| Core copy | Required Hebrew navigation and primary CTAs present; actual seeded ideas replace the concept's illustrative business claims |
| Mobile | Navigation wraps visibly, lists stack, forms use one column, calendar becomes a dated agenda; no clipped controls or horizontal overflow in the tested flows |
| Studio | Editable caption/CTA/visual brief, phone preview, accessible labels and real version history; template/AI source and factual checks visible |
| Asset treatment | No remote font/image dependencies; preview is a labeled deterministic brand-color text card |

Intentional differences from the concept: complete field editing/history requires more vertical space; mobile navigation stays visible instead of a decorative hamburger; a compact actual attention-count row and explicit fictional/no-AI notices satisfy the specification; default image references are stored but not rendered. Above-fold copy was checked against the specification: pilot/no-AI disclosure is intentional, no fabricated outcome/engagement metric was added. The implementation was visually verified against the concept's design direction; it is not a claim of pixel-identical reproduction of the composite image. No observed clipping or broken controls remain in the tested viewports.

## Limits before a real AI client pilot

Configure a valid server-side OpenAI key and accessible model, restart, and perform acceptance steps 9–10 from the specification. Structured schemas and context construction pass tests, but actual Hebrew quality, factual grounding and responsiveness from the external model remain unverified. The human reviewer must assess those. For a remote pilot, also complete the hosted libSQL/HTTPS instructions in README and verify persistence and access on that actual host. macOS/Linux commands are supplied but were not executed here.
