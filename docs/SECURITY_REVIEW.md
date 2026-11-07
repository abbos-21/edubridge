# Security review (end of Phase 5)

Method: each ToR rule in Part H and the release gate (Part M) was checked against the code and, where possible, against the running
production containers. "Evidence" names the test or the observed result. This is a self-review, not a penetration test.

## Fixed during this review
| Finding | Fix |
|---|---|
| `/api/v1/metrics` was reachable through the proxy (token still required) | Caddy answers 404 for it; the API only serves it with `METRICS_TOKEN`. Found by the smoke test. |
| The web app fetched its fonts from Google (visitor IPs leaked to a third party; contradicts the privacy page; blocks a strict CSP) | Fonts are bundled (`@fontsource`); no request leaves the site except Telegram's login widget. |
| The catalogue import script could silently overwrite admin edits | Refuses to run on a database that already has universities unless `--force`. |
| Catalogue reads hit the database for the version number on every request and rebuilt/compressed 134 KB per request | Version cached for 3 s (invalidated at once on changes made here); each distinct answer is built, hashed and gzipped once per catalogue version. 262 -> ~790 req/s on the list endpoint. |
| `undici` 7.2 had advisories | Upgraded; `npm audit --omit=dev`: 0 vulnerabilities. |

## Part H
| Rule | Status | Evidence |
|---|---|---|
| H1 HTTPS, HSTS, secure headers, CSP, frame-ancestors none | Done, with one exception | Caddy sends HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy, COOP; API sends helmet defaults. **Exception: `style-src` has `'unsafe-inline'`** (React style attributes and the summary's print CSS). Scripts are `'self'` + Telegram only. |
| H2 CORS only the app origin; cookies httpOnly/Secure/SameSite; CSRF | Done | auth tests (CSRF header + Origin check, cookie flags). |
| H3 Zod on every route, unknown fields rejected, size limits, no raw SQL | Done | Prisma only; the only raw SQL is a parameterised report query in the admin AI usage view. Body limit 1 MB (12 MB for documents, 13 MB at the proxy). |
| H4 central authorisation, every query scoped by user id, deny by default | Done | isolation tests (all private resources), admin tests walk every admin route as guest/student/editor/admin. |
| H5 rate limiting, auth stricter | Done, see risk 2 | 300/min/IP general, 20/min/IP on auth, AI per-user daily + burst limits. |
| H6 secrets in env, fail fast, never logged | Done | config tests; bundle test greps the build for key patterns; logger redacts cookies/auth. |
| H7 logs without document text, prompts, tokens | Done | request logging has no bodies; `ai_usage` stores sizes and cost only. |
| H8 lockfile, audit in CI, Dependabot | Done | `npm audit` 0; `.github/dependabot.yml`; CI `infra` job validates compose/Caddy/images. |
| H9 nightly encrypted off-server backup, 14 days, restore tested once | Done locally, off-server copy untested | `drill.sh` passed on the production containers (wrong passphrase refused, damaged file refused, counts and fingerprint match). |
| H10 privacy page, export, deletion | Done, contact line missing | `#info--privacy`; export/delete tests (transfer). The operator's contact details are not in the app: **add them before launch.** |
| H11 SSRF protection for the fetcher | Done | Private, loopback, link-local, metadata, CGNAT, reserved and IPv4-mapped addresses refused when connecting (so DNS tricks fail); every redirect re-checked; http(s) and ports 80/443 only; tests include `localhost` and `169.254.169.254`. |
| H12 admin actions need a recent sign-in and are audited | Done | admin tests (`reauth_required`, audit entries for every write). |

## Part M release gate
| Item | Status |
|---|---|
| No secret in the web bundle | Passed (automated). |
| Part C rules tested against DB + API | Passed. |
| User isolation for every private resource | Passed. |
| Admin routes 403 for every non-admin role | Passed. |
| AI only through the proxy; quotas, limits, budget cap | Passed against a mock and a local fake provider. **Never against the real Anthropic API.** |
| Export and account deletion | Passed. |
| Snapshot fallback labelled | Passed. |
| Reminders opt-in, /stop, no password requests | Passed against a mocked Telegram API. |
| Recheck never changes published data without approval | Passed (test compares the catalogue before and after a run). |
| 390 px / 1280 px pass, no console errors, three languages complete | Automated sweeps at phone and desktop widths and a Russian-coverage test pass. **No human manual pass was done, and the Uzbek/Russian wording written by the assistant has not been reviewed by a native speaker.** |
| Backup + restore drill documented and done once | Done on a local copy of the production stack; repeat on the real server. |
| README, API docs, PROGRESS, privacy page | Done (see contact line above). |

## Remaining risks (decide, do not assume)
1. **Real third-party services untested:** Anthropic, Telegram, Google, S3 backup upload, public certificates.
2. **Shared IPs:** a campus or mobile network behind one address shares the 300 requests/minute general limit. Catalogue answers are cacheable (ETag, 60 s), so normal use is far below it; raise `RATE_LIMIT_PER_MIN` if students report errors.
3. **`style-src 'unsafe-inline'`** (see H1). Moving all inline styles to classes would remove it.
4. **API image is ~1 GB** (it runs TypeScript directly with `tsx` and includes dev dependencies). Works; a compiled, production-only image would be smaller and start faster.
5. **Recheck noise:** pages with changing content (dates, banners) will appear as *changed* on every run. Expect to dismiss many on the first runs.
6. **Single server, single database:** no failover. Recovery relies on the backups and the drill.
7. **Admin sign-in age** (default 2 hours) is the only step-up check; there is no second factor beyond Telegram/Google themselves.
