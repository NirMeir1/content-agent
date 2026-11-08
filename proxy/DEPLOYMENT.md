# Operator deployment

This service is separate from the desktop application. No hosting credentials or
public proxy endpoint were supplied with the packaging task. The desktop build
therefore starts in explicitly labelled demo mode until the operator provisions it.

1. Run `node scripts/provision-client.mjs CLIENT-ID https://YOUR-HOST/generate`.
   This creates ignored files containing a scoped client token for the desktop and
   its SHA-256 hash for the server. Never commit these files. Rebuild separately for
   each client. The client never enters an API key or any configuration.
2. Build `docker build -f proxy/Dockerfile -t bottomline-ai-proxy .`.
3. Deploy one instance behind HTTPS. Supply `OPENAI_API_KEY` from the host secret
   manager, mount `proxy/clients.private.json` read-only at
   `/run/secrets/bottomline-clients.json`, and mount durable storage writable by UID
   1000 at `/data`. Never deploy this SQLite ledger on ephemeral storage or use
   independently replicated copies. A missing/reset ledger resets budget counters.
4. Set `PROXY_GLOBAL_MONTHLY_BUDGET_CENTS` (default 1000). Each client has a daily
   generation limit, monthly budget, expiry and enabled flag. Budgets are conservative
   reservations: each attempt costs 10 budget cents even on upstream failure; they
   are not measured invoices. Transactions reserve before making a paid request.
   The fixed gpt-4.1-mini model accepts <=64 KB combined context and <=6500 output
   tokens. Review the reservation against provider pricing before changing anything.
   Configure an additional provider project budget/alerts as an operational backstop.
5. Disable clients or rotate hashes in the private server file, then restart the
   service. Keep this file operator-only. A distributed client token is recoverable
   by the recipient; it is revocable and budget-limited, never an OpenAI secret.
   The desktop caches it using Electron safeStorage / Windows DPAPI. Business data
   stays local, except the profile/context explicitly sent for a generation request.
6. Verify `/health`, unauthorized requests, quotas, revocation, valid plan/draft/
   revision output, then run `npm run desktop:package`. Deliver the rebuilt ZIP only
   after verifying real generation from the packaged executable against HTTPS.

No request content or authorization values are logged. The endpoint has no CORS
allow-list because browsers do not need access; only the local Node server calls it.
Put normal TLS, connection/body rate limits and restricted operator access on the
reverse proxy. Do not expose the operator secret files or usage database over HTTP.

Source references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security),
[OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs),
[GPT-4.1-mini pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
