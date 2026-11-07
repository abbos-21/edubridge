# EduBridge v2 — Threat model (Phase 0, one page)

Assets: student private data (profile, documents text, chats), account identities, AI budget (API key), catalogue integrity (trust in sourced facts), admin powers, Telegram bot token.
Actors: anonymous visitor, malicious student, other-user attacker, compromised admin session, hostile source website, automated abuser/botnet.

| # | Threat | Where | Mitigation (ToR ref) | Test |
|---|---|---|---|---|
| T1 | Read/modify another user's data (IDOR) | all `/me/*` | Every query scoped by `session.userId`; central policy fns; deny by default (H4, F2) | K2 matrix: A vs B on every resource |
| T2 | Forged Telegram login | `/auth/telegram` | HMAC-SHA256 with bot-token-derived key, `auth_date` <= 10 min, replay guard (H5, F1) | K1 forged/expired/replayed |
| T3 | OAuth CSRF / code injection | Google flow | `state` + PKCE, exact redirect URI, nonce | K1 |
| T4 | Session theft / fixation | cookies | Opaque token, hash stored, httpOnly+Secure+SameSite=Lax, rotate on login, revoke on logout/delete | K1 |
| T5 | CSRF on state-changing calls | API | Double-submit CSRF token + origin check; CORS locked to app origin (H2) | K1 |
| T6 | Admin privilege escalation / unauthenticated admin | `/admin/*` | Server-side role check per route; recent-auth requirement; all actions audited (F8, H12) | K2 403 for every non-admin role/route |
| T7 | Unsourced or fake fact published | CMS | API refuses official value without source URL+date; publish needs Admin approval; audit diff (C1/C2, F8) | K5 |
| T8 | AI cost abuse / key drain | `/ai/*` | Auth required, per-user rate + daily/monthly quota, global USD cap, size/time limits, 1 in-flight per action (F3) | K4 |
| T9 | Prompt injection via uploaded document / chat | AI | Documents treated as data; fixed IDENTITY; facts only from grounded records; Zod-validated output; link + quote checks; no tools/browsing; output never executed (C9-C14) | K4 |
| T10 | PII leaking to AI or logs | AI, logs | `minimalProfile`; documents shared only with consent; logs carry sizes/ids only (C13, H7) | K4 + log grep test |
| T11 | SSRF via recheck fetcher | worker | http/https only, resolve-then-block private/loopback/link-local/metadata IPs, redirect cap, size/time caps, host allowlist from `sources` (H11) | K7 |
| T12 | Hostile source content (XSS in diffs) | admin UI | Render diffs as text; strict CSP; no HTML from sources injected | K7 + CSP check |
| T13 | Scraping against robots/terms | worker | robots.txt honoured, per-host rate limit, identifying UA, blocked pages recorded not bypassed (C18) | K7 |
| T14 | Telegram bot abuse / spam | bot | Opt-in via one-time code (10 min), `/stop` immediate, quiet hours, idempotent sends, never requests passwords/docs (F6) | K6 |
| T15 | Secrets in frontend or repo | build | Only server holds keys; `.env.example` only; CI test greps web bundle for key patterns (H6, M) | CI grep |
| T16 | Dependency compromise | supply chain | Lockfile, `npm audit` in CI, Renovate (H8) | CI |
| T17 | Data loss | infra | Nightly encrypted pg_dump off-server, 14-day retention, restore drill (H9) | Phase 5 drill |
| T18 | Account deletion incomplete | privacy | Hard delete with cascade; export first; test asserts zero rows (F2, H10) | K3 |
| T19 | Brute force / enumeration | auth | Strict auth rate limits, uniform errors, backoff (H5) | K1 |
| T20 | Clickjacking / XSS | web | CSP, `frame-ancestors 'none'`, React escaping, no `dangerouslySetInnerHTML` except sanitised markdown renderer | CSP check |

Residual risks accepted: single VPS (no HA); Telegram/Google outages block sign-in (guests still work); AI quality depends on the provider; sources that block automation need manual checks.

Out of scope here: payments, application submission, university portal credentials (never stored, C15).

## Admin area (Phase 3a)
| Threat | Control |
|---|---|
| A student or guest calls an admin route | Role read from the database per request; deny by default; a test walks every registered admin route as guest, student, editor, admin. |
| Stolen long-lived session used for admin changes | Changes need a sign-in younger than `ADMIN_REAUTH_MINUTES`; CSRF header and Origin check apply. |
| An editor publishes their own bad data | Only admins approve; rules re-run at approval; a stale base version is refused. |
| Unsourced or mistranslated facts reach students | Source, date, link, IELTS-scope and language rules block save and publish. |
| Someone quietly edits data | Every admin write is audited in the same transaction, with the diff. |
| Silent role escalation | Roles change only by an admin (not self) or the CLI; both audited. No path from sign-up to admin. |
| Spreadsheet formula injection in CSV export | Cells starting with = + - @ are prefixed. |
| A mock AI result presented as real | Snapshots saved in mock mode are flagged `mock` by the server, not by the client. |

## Reminders, calendar, bot (Phase 4)
| Threat | Control |
|---|---|
| Anyone posts fake updates to the bot webhook | Secret-token header compared in constant time; webhook off without a secret; production requires the secret. |
| Someone links their chat to another person's account | The code comes only from the signed-in owner, is random, hashed at rest, one-use, 10 minutes; a chat belongs to one account at a time. |
| A calendar feed URL leaks | 32-byte random token, only its hash stored, shown once, revocable, replaced on rotation, rate limited; the feed holds only that student's dates. |
| Wrong or unsourced dates in someone's calendar | Only dated, sourced, open, future deadlines are included; closed deadlines never. |
| Spam / unwanted messages | Opt-in by linking; `/stop` is immediate; quiet hours; a blocked bot switches reminders off; at most the two scheduled reminders per item. |
| Duplicate sends | Unique reminder key, lease before sending, status checked after. |
| Bot used to phish students | It only sends reminders and never asks for passwords, documents or payments (stated in its texts). |
| Personal data in the summary leaving the device | Built in the browser; a test asserts no non-GET request is made; name is off by default. |

## Link recheck and production (Phase 5)
| Threat | Control |
|---|---|
| The fetcher is pointed at internal services (SSRF), via a link, a redirect or DNS | Address check at connect time, every redirect re-checked, only http(s) on 80/443, no credentials in URLs, body and time caps. |
| The recheck damages or edits published data | It writes only findings; accepting one creates a draft that still needs an editor and an admin. |
| The recheck harms a university's site or breaks its terms | Identified user agent, robots.txt, one request per host per 2 s, no login or CAPTCHA bypass; refusing sites go to a manual list. |
| Metrics reveal internals | Off without a token, constant-time token check, blocked at the proxy. |
| Backups leak data | AES-256 with a key kept off the server, checksum, wrong key and damaged file refused (drill). |
| A re-import wipes admin edits | The import script refuses on a non-empty database. |
| Visitors tracked by third parties | No external requests (fonts bundled); CSP allows scripts only from this site and Telegram's widget. |
