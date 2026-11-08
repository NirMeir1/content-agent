# Desktop verification — 2026-11-08

## Current embedded-key release

At the owner's explicit request, the new ZIP includes the existing OpenAI key
inside its executable and calls OpenAI directly. No proxy deployment or client
key configuration is required. The key remains extractable from the artifact;
keep the ZIP private. Local quotas are not a secure spending cap.

The actual portable EXE passed real OpenAI plan, draft and revision generation,
onboarding, editing, approvals, clipboard, exports, second launch, rejection rules,
and persistence after restart from a replacement EXE. The API key was not returned
in the workspace API response. TypeScript, ESLint and all 22 unit tests passed.
Evidence: `output/desktop-1794156580358`; tested at 2026-11-08 16:52:42 UTC.
EXE SHA-256: `f3b9bf71d44f50733be41fc638e57ef44988c70a4fd04d01f204324d67e84687`.
The build still has no signing certificate or clean-Windows-VM validation.

## Historical initial proxy/demo release

Historical report for the first ZIP. The owner subsequently requested embedding
the existing OpenAI key. The current build mode and exact executable verification
are recorded in `release/build-info.json`, `release/desktop-verification.json`
and `release/VERIFICATION.txt`. The embedded-key variant calls OpenAI directly
and does not require deploying the proxy.

The portable executable in `release/Bottomline-Content-Agent.exe` passed the
packaged workflow test. Its SHA-256 is
`9adca07c411eea5702db1c1acb392bd76fce7d6ae1215f4e324a0bf9ea074498`.
The test evidence is under `output/desktop-1794155048638`; the release contains a
short `VERIFICATION.txt`. The ZIP finalizer rejects a different executable hash.

Verified on this Windows 11 x64 host:

- Launched the actual portable EXE with a system-only PATH and invalid inherited
  Node options/dummy API key; it uses the bundled runtime and ignores those values.
- First-run blank onboarding and SQLite initialization; profile saves.
- Explicit demo labels, eight-idea plan, idea acceptance, draft generation and
  revisions. These outputs are templates, not live AI.
- Editing and version history, approval, readiness for manual publication,
  rejection with a saved personalization rule, and all four content editors.
- Real Windows clipboard readback, text export and JSON feedback export with
  assertions on the downloaded data.
- Closing the window stops the local server. Saved profile and edited/approved
  content survive launching a copied replacement EXE from another folder.
- A second portable launch preserves the first instance and exits. The builder's
  default shared extraction directory caused resource deletion; configuring
  `portable.unpackDirName: true` fixed this and the regression test now passes.
- No Node globals in the renderer, denied external renderer fetch, and rejected
  unauthenticated local API requests. Security fuses were read back from the EXE.
- All 1,717 staged files passed the secret/database/symlink scan. Packaged server
  resources were compared to staging by SHA-256. Native dependency inspection
  identified and resolved the SQLite Visual C runtime and sharp/libvips DLL gaps.

Additional verification:

- Production build, TypeScript, ESLint and 22 unit tests passed.
- All six original desktop/mobile web journeys passed. The existing protected
  access test also passed, including signed cookies, origin checks, stale writes
  and persistence across server restart.
- Proxy tests with a mock upstream passed authorization, expiry, revocation,
  oversized input, upstream failure, daily limits, persistent accounting and
  concurrent client/global budget enforcement.
- Three real OpenAI requests through the local proxy passed: a monthly plan, a
  post draft and a revision, with schema/date/format checks. Evidence:
  `output/proxy-live-1794153565120`. This does not establish output quality or a
  packaged-to-public-service AI flow.

The full client definition of done is **not complete**: no public HTTPS proxy or
hosting target/credentials was supplied, so the ZIP is unprovisioned and uses
clearly labelled demo generation. The implemented service must be deployed with
durable quota storage and its API key in the host secret manager; then provision
client access, rebuild and verify real generation in that packaged release.

A clean Windows VM/standard-user machine was not available. The system-only PATH
test and dependency inspection do not substitute for that test. Windows 10 was
not tested. No code-signing certificate was supplied; this release is unsigned,
and client SmartScreen behavior is unverified. The Docker image was provided but
not built or deployed. The replacement EXE test uses identical bytes and does not
verify an unknown future schema migration.
