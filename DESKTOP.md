# Windows desktop release

The owner subsequently explicitly requested a release with the existing OpenAI
API key included. That variant is built with
`npm.cmd run desktop:package -- --with-openai-key`, followed by `desktop:test`
and `desktop:zip`. It calls OpenAI directly with internet access; no hosted proxy
or client key entry is needed. The generated EXE and ZIP contain an extractable
credential and must be kept private. Local quotas cannot prevent use of an
extracted key outside the app. The default build still excludes the key.

The desktop app bundles Electron, the production Next.js standalone server, local
SQLite dependencies and the required Microsoft Visual C runtime. The existing
web application and its commands remain available.

The client extracts `release/Bottomline-Content-Agent-Windows-x64.zip` and opens
`Bottomline-Content-Agent.exe`. Node, npm, Python, a database installer and
administrator elevation are not required by the application. Read
`release/VERIFICATION.txt` for actual tested coverage and remaining limitations.

## Operator build

Build on Windows x64 with development dependencies installed:

```powershell
npm.cmd ci
npm.cmd run desktop:package
npm.cmd run desktop:test
node scripts/finalize-desktop.mjs
```

`desktop:package` downloads official runtime/tool archives with checksum checks,
verifies Microsoft's redistributable signature, extracts the required DLL without
installing it, builds Next.js, stages only traced runtime dependencies, scans for
developer secrets/databases/symlinks, and runs electron-builder's portable x64
target. Client configuration is an explicitly scoped ignored file; environment
files and local business data are excluded. The operator API key is excluded
unless `--with-openai-key` is explicitly supplied; in that case only the selected
key in the dedicated ignored client resource is permitted by the credential scan.

`desktop:test` launches the portable EXE with a system-only PATH, an intentionally
invalid inherited Node option and a dummy inherited API key. It uses a separate
test data directory and a loopback Chrome DevTools connection requested only for
the test. The client does not need Playwright, development tools or debugging.
The release finalizer checks that the tested executable hash still matches, then
creates the ZIP with the EXE, README.txt and VERIFICATION.txt. QA data stays under
ignored `output/`; none is included in the client ZIP.

## Local runtime and data

Each launch uses a temporary extracted application directory. SQLite data and
the Electron profile live at `%APPDATA%\Bottomline Content Agent`, independent of
the EXE's folder/version. Initialization is idempotent and begins with a blank
own-business workspace; fictional demo data is loaded only when chosen. Closing
the app lets local requests finish briefly, then terminates the bundled server.
Back up the data directory while the app is closed. New application versions that
change the database schema will need explicit migration/backup work; this release
does not claim to test an unknown future schema. `BOTTOMLINE_DATA_DIR` overrides
the data location for isolated operator tests.

The internal server chooses an available IPv4 loopback port. A random per-launch
header authenticates every request, including static resources; unauthenticated
requests and unexpected Host headers are rejected. The renderer has no Node API,
preload bridge or webview; sandboxing, context isolation and web security are
enabled. Remote navigation, new windows and renderer network access are blocked.
The CSP permits Next's inline hydration scripts and style attributes; external
scripts, frames and objects are blocked. Electron fuses disable RunAsNode,
NODE_OPTIONS and Node CLI inspection, require app.asar, and verify its integrity.

The database uses Windows account directory permissions and is not encrypted.
Client access is cached using Windows DPAPI through Electron safeStorage. Any
credential shipped to a client can be recovered by that recipient; the scoped
proxy token is revocable and limited, and is never the OpenAI API key.

## Hosted AI service

See [proxy/DEPLOYMENT.md](proxy/DEPLOYMENT.md). The service source, container build,
client provisioning utility and quota ledger are implemented. Mock upstream tests
exercise access control and limits; real OpenAI plan, post and revision requests
were also verified through a local proxy using the existing operator key.

No public HTTPS proxy or hosting credentials were supplied for the initial release.
That initial ZIP had no active real-AI service and retained explicit demo labels.
Deploy the service with its API key in a host secret manager and durable quota
storage, provision a client, rebuild, and verify real generation in that packaged
build to use proxy mode. No client key entry is needed in a provisioned release.
The owner's later embedded-key variant bypasses the proxy; its actual verification
coverage is recorded in `release/VERIFICATION.txt` and `release/build-info.json`.

The EXE is unsigned because no signing certificate was supplied. Windows publisher
and SmartScreen prompts are not bypassed. A clean Windows VM was not available;
the system-only PATH test and dependency inspection do not replace that test.
