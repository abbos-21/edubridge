# EduBridge v2 — Progress

## Phase 0 — Audit and design (status: delivered, awaiting approval)

### Audit: what was actually provided
The original source repo was NOT available. The only artefact is
`data/recovered/EduBridge.bundle.html` — the minified production build
(`npm run build:single`, 2.28 MB, 1008 lines, no source map). Consequences:

| Item | Docs claim | Verified in bundle |
|---|---|---|
| 5 countries x 10 universities | yes | **yes** — MY/HU/DE/TR/KR = 10 each, ids unique |
| Tier split 3/4/3 per country | yes | **yes** — selective 3 / middle 4 / accessible 3 in all 5 |
| 5 missing QS 2027 values | yes | **yes** — semmelweis-university-hu, corvinus-university-of-budapest-hu, tu-darmstadt-de, fau-de, pusan-national-university-kr |
| localStorage key `edubridge:v1` | yes | yes |
| Hash routing, PDF/DOCX loaders, `/api/ai`, `claude.use` | yes | yes (strings present) |
| Russian dictionary embedded | yes | yes |
| Bundle ~2.1 MB | yes | 2.28 MB (over the 2 MB target) |
| 7 national grants | yes | **yes** — `grants_research.recovered.json` has exactly mtcp, mis, turkiye-burslari, stipendium-hungaricum, daad-epos, gks-u, gks-g. The bundle also holds 13 older/legacy scholarship records (`grants.recovered.json`: Chevening, MEXT, El-Yurt Umidi, Erasmus Mundus, TUM waiver, HWUM award and two `demo-*` samples) and 8 older imports (`scholarships_imported.recovered.json`) — the legacy data layer to retire in Phase 5. |
| Unit tests (49) | yes | **not recoverable** — tests are not in the bundle |
| TypeScript source (components, store, ai.ts, prompts, validators) | yes | **not recoverable** (minified, mangled names) |

### Recovered
- `data/recovered/universities.recovered.json` — 50 university records
  (id, country, order, tier, name, short, city, campus, type, website,
  subjects, languages, admissions, apply, applyLinks, scholarships, uniNote,
  ranking, lastChecked, levels{bachelor,master}, fee). Extracted by
  `data/recovered/extract_from_bundle.mjs` (brace-matched, evaluated; no manual edits).
- `data/recovered/grants_research.recovered.json` — the 7 national grants (current catalogue).
- `data/recovered/grants.recovered.json` (13) and `scholarships_imported.recovered.json` (8) — legacy records; the two `demo-*` ones are fake samples and must not be imported as real data.
- Russian strings exist in the bundle (the ru.json lookup map); to be extracted in Phase 1.

### Decision taken (by owner)
Rebuild the frontend as a new React 18 + TS + Vite app (reference = the bundle's
behaviour and the docs), build the full backend per TZ v2, import the recovered
data. Original 49 tests are replaced by new ones that enforce the same rules (Part C).
Mock providers (Telegram, Google, Anthropic) + `.env.example`.
Location: `C:\Users\user\Desktop\elmurod stuff\edubridge`.

### Environment
Node 22.20, npm 11.10, Docker 29.2, Postgres client 18.0, Python 3.13, Git 2.51.

## Owner decisions (Phase 0 answers)
- Real non-national scholarships (Chevening, MEXT, El-Yurt Umidi, Erasmus Mundus, TUM waiver, Heriot-Watt award) kept as secondary "other" grants; `demo-*` dropped.
- Google email is discarded after sign-in (match by Google user id only).
- AI defaults: USD 50/month global, 20 requests/user/day.
- Phase 1 reported in two checkpoints: 1a (backend foundation) then 1b (web).

## Phase 1a — Backend foundation + data import + catalogue API (status: done, awaiting approval)
Built:
- npm-workspaces monorepo, strict TS, Prettier config, `.env.example`, Docker Compose Postgres 16 (:5433, plus `edubridge_test`), GitHub Actions CI, API Dockerfile.
- `packages/shared`: Lang/`pick`/`say`, Zod catalogue schemas, Part C rule checker (`checkCatalogue`), shared search/filter (Turkish-letter normalisation, confirmed-IELTS-only comparison) — reusable by the web snapshot fallback.
- `apps/api`: Fastify 5 (helmet, CORS locked to APP_ORIGIN, rate limit, request ids, uniform error shape, redacted logs), full Prisma schema for ToR Part E (identity, private student data, catalogue + revisions, sources, ops tables) with an applied `init` migration, `/health`, `/ready`, and the public catalogue API: `/catalog/{version,countries,countries/:code,universities,universities/:id,compare,grants,grants/:id}` with ETag/304.
- Idempotent importer (`npm run db:import`): 50 universities, 100 levels, 7 national + 6 other grants, 443 source links (QS pages flagged `blocksAutomation`), audit entry, catalogue version bump.

Verified: `npm run typecheck` clean; 29 tests pass (9 shared, 20 API incl. data-rule tests run against API output, import idempotency, CORS/security headers, 304 handling); live server smoke test on :8787.

Known deviations / notes
- Russian: records stay `{en, uz}` with optional `ru`; Russian is resolved from the dictionary (as in the original design). The ToR's "block publish without ru" check is moved to the admin publish step (Phase 3). The dictionary will be extracted from the bundle in 1b.
- Country records only have names so far; the country guidance text ("how chosen", notes) still has to be mined from the bundle (1b).
- Recovered data has 0 violations of the implemented rules, but "0" only covers the rules coded so far; the owner still has to confirm facts against official pages in the CMS.
- `npm audit --omit=dev` reports 4 high advisories, unresolved on purpose: (a) `zod` 3.x memory-exhaustion on oversized constrained collections — fixed only in zod 4 (major). Mitigation today: request bodies capped at 1 MB and Phase 1a validates only short query strings; the zod 4 upgrade is scheduled at the START of Phase 2, before body validation is added. (b) `deepmerge-ts` stack exhaustion inside the Prisma CLI config loader (build-time tool, not reachable from requests); fix needs a Prisma major, revisit with the zod upgrade. CI therefore does not yet pass `npm audit` at high level — expect the CI audit step to fail until then.
- Docker Desktop was started on this machine to host the dev database.

## Phase 1b — Web app, i18n, catalogue pages (status: done, awaiting approval)
Mined from the old bundle (scripts in `data/recovered/`, nothing edited by hand):
- `ru.dictionary.recovered.json` — 3,332 Russian entries (339 minified variable references resolved), 186 are `{0}` templates.
- `ui.dictionary.recovered.json` (127 shared labels, en/uz), `countries.recovered.json` (names + taglines), `tiers.recovered.json`, `country-guidance.recovered.json` (per-country bachelor/master advice, notes, sources), `selection.recovered.json` ("how these 10 were chosen"), `university-guidance.recovered.json` (document checklists and 5–7 application steps per country and level, produced by running the old pure functions).
- The importer now stores all of this in the `Country` records, so the API serves it.

Built (`apps/web`, React 18 + TS + Vite 5 + Tailwind with RGB-token light/dark themes):
- Hash router with the original URL scheme; `AppStore` (`edubridge:v1`, merged with defaults, survives corrupt storage); i18n with on-demand Russian (lookup by English text, templates), Uzbek default.
- `CatalogProvider`: API first, labelled dated snapshot fallback (and snapshot-only for the single-file build).
- Pages: Home (counters computed from data), Countries, Country (how chosen, three groups, advice labelled "not an official minimum", grants), Universities (search with Turkish-letter normalisation; filters: country, group, level, subject, language, funding, confirmed deadline, confirmed fee, optional IELTS that only annotates), University page (bachelor/master tabs, the 13 items), Compare (table on desktop, cards on mobile, max 3, blanks never zero/free), Grants (national + other, detail page for both record shapes), Info.
- Accessibility: skip link, roles/labels, ≥40 px tap targets, focus styles, reduced motion.
- Sizes: initial JS 278 KB (82 KB gzip); snapshot and Russian dictionary load on demand; single-file build 1.0 MB (old build: 2.28 MB).

Verified: typecheck clean; **51 unit/integration tests** (shared 9, API 21, web 21) and **43 Playwright tests** pass: every route at 390 px and 1280 px (no horizontal scroll, no console errors), search/filter/compare/tabs/language/theme/keyboard flows, offline snapshot banner, "no secrets in the web bundle" build scan. Screenshots were read by eye; two defects found that way and fixed (Uzbek dates printed "M10", logo wrapped on phones). The E2E suite also caught a real bug (compare limit never reported "full") — fixed.

New text written for v2 (not recovered): 64 English/Uzbek UI strings and their Russian in `ru.extra.json`, plus all `tx()` Uzbek texts in `apps/web/src`. **Owner review needed**, especially Uzbek and Russian wording.

Known gaps / notes
- Whether a university takes part in a national grant is shown as "not confirmed — check the official list" everywhere; the researched participating-lists are free text in the grant records and are not matched per university yet (FR-05 "confirmed only where an official list was read" is only partly met).
- The grant detail page renders both record shapes generically; the "other scholarships" (older import) show fewer fields.
- Not built in 1b (later phases): sign-in, profile/onboarding, dashboard, plans, calendar, budget, documents, writing tutor, AI advisor, profile builder, data review, glossary, roadmap, demo personas.
- The old UI had many more inline texts than the 127 shared labels; those were not recoverable as source, so this UI's wording is new except where the recovered Russian dictionary already had the English sentence.

## Phase 2a — Security upgrade, accounts, sync (status: done, awaiting approval)
Phase 2 is split: **2a** accounts + sync (this), **2b** AI proxy + AI advisor pages, **2c** onboarding/profile builder/document readers/more synced data.

Done:
- **zod 4** everywhere; Prisma CLI advisory fixed with a dependency override (`deepmerge-ts` 8). `npm audit --omit=dev`: **0 vulnerabilities**; the CI audit step is strict again. (The lockfile was regenerated; Playwright is pinned to an exact version.)
- **Sessions**: opaque 32-byte token, only its SHA-256 stored; cookie `eb_session` httpOnly + SameSite=Lax (+ Secure in production), 30-day sliding expiry; revocable; list/revoke devices. **CSRF**: double-submit token (`eb_csrf` cookie + `x-csrf-token` header) and an Origin check on every cookie-authenticated write.
- **Telegram Login**: HMAC-SHA256 verification, 10-minute freshness, replay guard (in memory — fine for one API instance; move to the DB when scaling out), 503 when the bot is not configured. **Google**: OIDC authorization code + PKCE (S256) + state + nonce in a signed short-lived cookie, ID token verified against Google's keys; scope is `openid` only — **no email is requested or stored** (your decision). Provider clients are injectable, so everything is tested with mocks.
- Only the provider's stable id is stored (no name, username or email). Account linking (a method belonging to another account → 409) and removal (the last method cannot be removed).
- **Dev login** (`ALLOW_DEV_LOGIN`) exists only for local work; the server refuses to start in production with it on, or without a 32+ character `SESSION_SECRET`.
- **Private data API** (`/me/profile|growth|settings` singletons; `/me/applications|events|budgets|chats|interviews|documents` collections; `/me/saved`): every query scoped by the session user, foreign ids → 404, optimistic concurrency (`version`, 409 + server copy; concurrent writers: exactly one wins), per-user caps, strict Zod bodies (no client-set owner/id/version), documents are text-only (2 MB per text).
- `POST /me/import-local` (idempotent via a new `localId` column, never overwrites, skips malformed items, respects caps), `GET /me/export`, `DELETE /me` (typed confirmation, hard delete by cascade, audit entries kept but anonymised).
- `GET /auth/session` for the web start-up check (200 with `user:null` for guests; a 401 would be a console error).
- **Web**: API client (cookies, CSRF header, typed errors), `AuthProvider`, `CloudSyncProvider` (language, theme, compare list and saved items sync; server copy wins on 409; "Syncing…" is shown as soon as a change is pending), Sign-in page (Telegram widget when configured, Google button, dev form), Settings page (account, devices, export, delete account, upload-device-data prompt, delete local data).

Verified: typecheck clean; **138 unit/integration tests** (API 104, web 25, shared 9) and **59 Playwright tests** pass. Highlights: the isolation matrix (A vs B vs anonymous on every private resource: list, get, put, delete, export, sessions, malformed ids), account deletion leaves the other user's rows untouched, forged/expired/replayed Telegram payloads, tampered OAuth state, logout really invalidates the old cookie, CSRF and cross-origin writes refused, two browser contexts prove cross-device sync.

Bugs found by the tests and fixed this phase: documents were not idempotent on import (added `localId`); guests got a console error on every page (`/auth/session`); "synced" shown while a change was pending; merely choosing a language counted as "data to upload"; the API's 300/min per-IP limit tripped the parallel browser run (raised for the test server only — note for production behind shared university NATs).

Notes / decisions to confirm
- Telegram **bot name** and Google OAuth credentials are not set; real sign-in cannot be tried until you create them (see `.env.example`). Everything is tested with mocks.
- Sync currently covers settings + saved only, because profile, plans, documents etc. do not exist in the new web app yet; the API for them is ready and tested.
- Admin roles exist in the schema but there is no way to become admin yet (Phase 3).

## Phase 2b — AI proxy and the AI advisor pages (status: done, awaiting approval)

**Prompts are the original ones.** The advisor identity, chat instructions, score anchors, critical-reading method and every task prompt (CV, letters, second reader, improve, interview questions/feedback, CV-letter consistency, scan transcription, profile coach, activity review) were found in the old bundle and ported **verbatim** by `data/recovered/extract_prompts.mjs` (only minified identifiers renamed) into `apps/api/src/ai/prompts.ts`. The validators and the grounding / minimal-profile logic were re-implemented in readable TypeScript following the same fields, limits and rules.

Server (`apps/api/src/ai`, `routes/ai.ts`):
- `POST /ai/json` (9 tasks), `POST /ai/chat` (server-sent events), `POST /ai/ocr`, `GET /ai/health`. All need a signed-in user and the CSRF token. Request bodies are strict Zod schemas (no unknown fields, size limits).
- **Guardrails enforced server-side**: the profile is reduced to `minimalProfile` (no name, birth year, school); documents reach the chat only with `shareDocs` + an explicit list; official facts come only from at most 20 catalogue records chosen by `ground()`; links not in those records are flagged `unverified`; every quote is checked against the student's text and flagged if not found; scores are clamped 1–10 and a missing one stays `null`; a malformed reply is a 502 `ai_bad_reply`, never a fake analysis; a model refusal is a plain 422.
- **Cost control**: global kill switch, per-user suspension, **global monthly USD cap** (default 50), **daily quota per user** (default 20, resets at Tashkent midnight, counts failures too), **burst limit** (6/min), **one in-flight request per user per action**, timeout, abort when the browser disconnects (the model call is cancelled). Every call writes `ai_usage` (task, tier, model, tokens, estimated cost, status) — **never prompts, documents or answers**. Pricing is a built-in estimate table (Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50, Opus 5.5 $4/$20 per million tokens, unknown models priced high) overridable with `AI_PRICES_JSON`.
- **Models**: default `claude-sonnet-5-5`, quick `claude-haiku-5-5`, `ANTHROPIC_MODEL_COMPLEX` optional (defaults to the default model). Heavy analyses use the complex tier at effort `high`; short tasks the default tier at `medium`. No `temperature`/`top_p`/`top_k` are sent (current models reject them).
- `AI_MOCK=true` (development/test only; the server refuses to start in production with it) answers with deterministic, validator-passing replies so the whole flow can be exercised without a key.

Web (`#assistant`, `--docs`, `--interview`, `--report`):
- **Ask**: streaming answers in sections, "explain in more depth", follow-up chips, saved chats (account), optional context target, opt-in document sharing, links flagged unverified; guests and "AI off" get a clearly labelled **rule-based lookup** that only repeats catalogue facts.
- **Documents**: add by pasting or opening a .txt, or try a fictional sample; working copy vs original (never overwritten); critical review for CV and 6 letter types against a target (university, national grant, or unverified custom); scorecards, quotes with a warning when the exact wording is not in the text; optional second reader; "your text changed after this analysis" notice; **Improve a passage** with 8 actions, side-by-side + word diff, accept / reject / undo; download the working copy.
- **Interview**: one question at a time, feedback with 6 scores, follow-up, summary, saved in the account. **Report**: readiness per document, weakest document, first fix per document, CV-vs-letter consistency check with both quotes verified.
- Plain-language, translated error messages (quota, rate limit, busy, bad reply, refusal, timeout, offline).

Verified:
- typecheck clean; **233 unit/integration tests** pass (API 183, web 41, shared 9) and the browser suite (result in the hand-over message).
- The **real Anthropic client was tested against a local fake of the streaming API**: request shape (model per tier, max_tokens, effort, system prompt, images, key only in a header, no sampling params), streaming, refusal and truncation, mapping of 429/401/500 to plain errors without leaking keys, abort, disabled-without-key. **It has not been run against the real API (no key).**
- API tests cover: honesty rules present in every prompt, every validator rejecting bad replies, quote and link checks, minimal-profile privacy (prompts contain no name or birth year), documents only when sharing is on, per-user daily quota with Retry-After, burst limit, monthly budget pause, suspended user / kill switch / no key refused before any model call, one-at-a-time (409), abort cancels the model and records `aborted`, SSE streaming with follow-ups and link flags, OCR input validation.

Bugs found by the tests and fixed this phase: two test-harness races (sign-in redirect), the mock ignoring the requested question count (the server now also trims to it), the audit step needing the first reviewer's raw JSON (the API now returns `raw` for CV/letter analyses only; the UI never displays it).

Known gaps / decisions to confirm
- **Not in 2b (planned 2c):** PDF/DOCX/photo upload and the OCR screen (the `/ai/ocr` endpoint is built and tested; the file readers, bundled instead of loaded from a CDN, come in 2c), onboarding/profile, profile builder (36 ideas + coach), plans/calendar/budget. Until then the AI uses no student profile (it works from what the student writes).
- No live-API run: please set `ANTHROPIC_API_KEY` and run one analysis of each kind on a real document before relying on quality. If answers are over-long or over-hedged, tune effort per task first (`apps/api/src/ai/tasks.ts`).
- The provider's server-side **refusal fallback** (`fallbacks`) is not enabled: it is a beta parameter I could not test without a key. A refusal is shown as a plain message. Say if you want it added.
- Prices are estimates used for the budget cap, not billing — check them against your Anthropic invoice.
- Analysing a document necessarily sends that document's text to the model (the student presses Analyse); the chat sees documents only when sharing is switched on.

## Phase 2c — Profile, profile builder, document readers (status: done, awaiting approval)

**Recovered from the old build (not rewritten):** the 36 activity ideas (English + Uzbek, with steps, CV line, essay angle, pitfall, evidence and a 3-level ladder), the 13 categories and 7 signals, the rule-based profile check and the idea ranking (as code), the three demo students, the field-of-study options, and every wizard label and validation rule — via `data/recovered/extract_growth.mjs`.

**The ports are proven identical to the originals.** The original check and ranking functions are kept as a generated test fixture (`apps/web/tests/fixtures/original-growth.cjs`); a differential test runs them against the readable TypeScript ports (`src/lib/growth/check.ts`, `rank.ts`) on **700 random profiles/cases** and requires identical statuses, wording, scores, order and reasons. The 36 ideas are asserted equal to the original array.

Built (web):
- **Onboarding wizard** (`#onboarding`, `--edit`): 7 steps (Basics, Academics, Language, Finances, Destinations, Experience, Review) with the original validation (IELTS in 0.5 steps, scale-aware score limit, total budget ≥ tuition, …), an autosaved draft (kept in this browser; the wizard restarts at step 1 after a reload, as the original did, with every answer kept) and an edit mode. Grades are never converted between scales.
- **Profile in the account**: stored under `/me/profile`, synced with the same version/409 rules as settings; a guest's profile is **offered** for upload at first sign-in (never silently); the server copy wins on a conflict. The profile builder plan syncs under `/me/growth`.
- **Demo students** (`#demo`): three fictional students ("(demo)"), kept only in the browser and **never uploaded** (tested); a banner says so, hidden with `?present=1` (presentation mode).
- **Profile builder** (`#adviser`): *Profile check* per target group and level (now / typical target / why; missing values are "not enough information", never a pass), *Ideas* (ranked, filterable by activity type and "fits my time and budget", details, add/remove), *My plan* (month-by-month schedule with weekly-hours overload warning and "does not fit" warnings, start month per idea, persisted), *AI coach* (growth plan + activity review through the AI proxy; signed-in only).
- **The profile now reaches every AI feature** (chat, analyses, rewrites, interview); the server reduces it to the minimal form.
- **Document readers, self-hosted** (no CDN): `.txt`, `.docx` (mammoth) and text PDFs (pdf.js) are read **in the browser**; files are never uploaded or stored. A PDF without a text layer or a photo is read by the AI **only when the student presses the button** (shrunk to 1600 px JPEG; ≤ 6 pages; 10 MB limit), and the student **checks and edits the transcription** before it is used. Lazy-loaded chunks; the single-file claude.ai build leaves the readers out.
- The advisor, wizard and builder pages load on demand: main bundle 345 KB (105 KB gzip).

Verified: typecheck clean; **247 unit/integration tests** (API 183, web 55, shared 9) and **104 Playwright tests**. New browser tests cover the full wizard (validation, draft, save), editing, demo mode and presentation mode, the demo never reaching the server, the builder's check/ideas/plan (including overload and persistence), guest → account profile upload with a second device seeing it, plan sync across devices, the AI coach and profile hand-over to the advisor, and the file readers with real `.docx`, text-PDF, scanned-PDF and photo fixtures (`apps/web/e2e/fixtures`, regenerated by `make_fixtures.py`).

Dependencies: `pdfjs-dist` 4.10.38, `mammoth` upgraded to 1.13.0 (1.8.0 had a directory-traversal advisory); `npm audit --omit=dev`: **0 vulnerabilities**.

Notes / decisions to confirm
- **Run test suites one at a time.** Running the API tests and the browser suite simultaneously made both fail (Prisma/Postgres contention on one machine); each passes alone. CI already runs them as separate jobs.
- The original wizard offered a "demo transcript extraction"; it is not rebuilt (the real document readers replace the idea, but the wizard does not read files).
- Eligibility checks against published minimums on the university pages ("appear satisfied") and the Dashboard, Plans, Calendar, Budget, Glossary and Roadmap pages of the old app are not rebuilt; they were not in the ToR v2 phases built so far.
- Profile text in the 36 ideas is the original English/Uzbek; Russian comes from the recovered dictionary (the translation test confirms every idea string has Russian).
- Reading scanned pages with the AI sends the page images to the AI service for that one request (they are not stored); the UI says so before the student agrees.

## Phase 3a — Admin backend (status: done, awaiting approval)
Roles, the review workflow, the audit log, data-quality tools and saved demo analyses, all enforced on the server. The admin screens are Phase 3b.

- **Roles** `student | editor | admin`, read from the database on every request. Guests get 401, students 403, editors 403 on admin-only routes. Every admin route is registered through one guarded helper that records its allowed roles; a test walks the whole route list as guest, student, editor and admin.
- **First admin:** `npm run role -w @edubridge/api -- telegram:<id> admin` (the person signs in once first). Written to the audit log. There is no sign-up path to admin.
- **Recent sign-in (H12):** every change needs a sign-in at most `ADMIN_REAUTH_MINUTES` (default 120) old, else 403 `reauth_required`. Reading is unaffected. CSRF applies as everywhere.
- **Draft → in review → published:** an editor starts a draft from the published record (one open draft per record, enforced by a database index), edits it, sends it for review. Only an admin approves or rejects (a rejection needs a comment and returns the draft to the editor). Approving writes the record in one transaction, bumps the record and catalogue versions and refreshes the `sources` table. A draft whose base version is no longer current is `stale` and cannot be approved. Nothing students see changes before approval.
- **Rules that block saving and publishing:** an official value with no source; no or future check date; links that are not http(s); IELTS without scope; fixed fields (`id`, `country`, `order`, `tier`) changed; any new or changed text missing English, Uzbek or Russian. Grants need an official link and a check date.
- **Hide / Reviewed:** hide is admin-only, needs a reason, sets the record hidden for everyone and bumps the catalogue version. Reviewed is a mark stored once for everyone (replaces the browser-only override).
- **Audit log:** every admin write (revision create/save/submit/reject/publish/discard, hide, reviewed, role change, AI suspend, demo save/delete) is written in the same transaction as the change, with the field-level diff and a hashed IP. Viewer API with filters and paging.
- **Users and AI:** user list (no contact details), role change (not your own), AI suspend/restore, AI cost and usage per day, task and user against the monthly budget. Costs are estimates.
- **Data gaps:** levels that hold only links, the 5 missing QS positions, records older than N days, and how many catalogue texts still have no Russian in the record. **Batch check** and **JSON/CSV export** run on the server; CSV cells that look like formulas are neutralised.
- **Saved demo analyses:** an admin saves a result; anyone can read it, labelled as saved with its date. A result saved while the AI was in mock mode is flagged `mock` on the server.
- Tests: 30 new API tests (213 total) and 8 new shared tests (17).

**Decisions taken here, please confirm**
1. *Language rule:* none of the 229 localized texts in the imported records has Russian inside the record (Russian is looked up in the interface dictionary). Requiring Russian everywhere would block every edit, so the rule applies to **new or changed** texts only. The gaps view shows how many legacy texts lack Russian.
2. *Scope of editing:* existing universities and grants can be edited, hidden and reviewed. **Adding a new university or removing one** and **changing tier or order** are not offered: they would break the 5 × 10 and 3/4/3 structure and need a deliberate decision.
3. An admin can approve their own draft (the owner is the reviewer). Say if you want a second person required.

## Phase 3b — Admin screens, presentation, saved examples (status: done, awaiting approval)
- **`#admin`** (lazy-loaded, English only: it is a staff tool). Tabs: *Catalogue* (list, filter, search, export CSV/JSON; per record: start a draft, form for the main fields plus an "Advanced: JSON" editor for every field, side-by-side changes table, server rule problems listed, save / send for review / discard, Reviewed mark, admin-only hide with a reason), *Review queue*, *Data gaps* (batch check, links-only levels, missing QS, stale records), *Audit log* (filters, paging, diffs), *Users* (roles, AI suspend) and *AI cost* (admin only). The "Admin" link appears for editors and admins only. Hiding a tab is a convenience; the server still checks every call.
- **Saved examples:** an admin sees "Save as demo analysis" under a document analysis, interview feedback and coach plan. Guests see them on `#demo` under "Saved examples of AI results" with "saved on <date>"; one saved while the AI was in mock mode says "Sample result". Document analyses use the real analysis view; the other two kinds use a plain read-only view.
- **Presentation mode** (`?present=1`) already hid the demo banner; unchanged and still tested.
- Tests: 5 new browser tests (109 total; all pass). Unit tests 55 web / 17 shared / 213 API. Typecheck clean. 11 new Russian strings added; the admin area has no translations by design.

**Please note**
1. The browser test edits one real university in the development database and then restores it through the same approval workflow, so the catalogue version number and audit log grow.
2. Not covered by a browser test: hiding a record from the screen (covered by API tests), role change and AI suspend from the Users tab (API tests).
3. The editor form covers the commonly edited fields; everything else is editable via the JSON box. A full form for every field (applyLinks, scholarships, uniNote) was not built.

## Phase 4 — Reminders, calendar, summary (status: done, awaiting approval)
**Server**
- **What goes into a calendar or reminder** (`calendar/items.ts`): confirmed, still-open deadlines of the universities the student saved (a real ISO date **and** a source link, level not closed, not in the past), plan tasks (`application.data.tasks[] = {id?, title, due: YYYY-MM-DD, done?}`, not done) and the student's own dates (`customEvent.data = {title, date}`). Closed, past, undated or unsourced items are left out. Scholarship deadlines are free text in the data, so they are not in the calendar.
- **`.ics`**: `GET /me/calendar.ics` and a secret feed `GET /calendar/<token>.ics`. All-day events (no time zone is invented), stable UIDs, CRLF, text escaping, 75-octet folding that never splits a character, titles in the student's language. Read back by a strict parser (`ical.js`) in tests. The feed token is shown once; only its hash is stored; replacing or turning it off kills the old URL at once.
- **Telegram bot** (webhook, no library: it only sends text): `/start CODE` links (one-time code, 10 minutes, hashed), `/start` again re-opts-in, `/stop` stops at once and cancels what was scheduled, `/status`, `/language uz|ru|en`. Replies in the account's language. Private chats only. It never asks for passwords, documents or payment details. The webhook needs `X-Telegram-Bot-Api-Secret-Token` = `TELEGRAM_WEBHOOK_SECRET`; with no secret it is off (503). Production refuses to start with a bot token but no secret.
- **Reminder engine** (`reminders/engine.ts`, run by `npm run worker -w @edubridge/api` every minute): plans a reminder 7 days and 1 day before each item at 09:00 Tashkent (never a stale "in 7 days"), idempotent; cancels reminders whose item vanished, whose date passed, or whose owner opted out; no sending 22:00-08:00 Tashkent (`REMINDER_QUIET_START/END`); a lease so two workers never send one reminder twice; retries with backoff (5, 10, 20 minutes ... up to 6 h), gives up after 5 attempts (`failed`); if Telegram says the student blocked the bot, reminders are switched off for them. Without `TELEGRAM_BOT_TOKEN` it plans but sends nothing, and says so.
- Tests: 23 new API tests (236 total) with a mocked Telegram API.

**Web**
- **Settings → Reminders and calendar** (signed in): *My dates* (add/delete), *Calendar* (upcoming, download `.ics`, create/replace/turn off the private link with iPhone and Google instructions), *Telegram reminders* (connect with code and deep link, on/off, disconnect, scheduled list). If the bot is not configured the page says "not available yet".
- **`#summary`**: a one-page A4 summary built in the browser (nothing is uploaded). The student picks what goes on it (name is off by default): saved universities by group, profile gaps for a chosen group, plan steps, next confirmed deadlines. **PDF** via Print → Save as PDF (print CSS), **PNG** via html-to-image. **Decision:** client rendering handled Uzbek and Russian text correctly, so the optional `POST /me/summary/render` server endpoint was **not** built.
- Tests: 5 new browser tests (114 total, all pass): the `.ics` download and private feed (including revoke), and the summary with 15 saved universities and 12 plan items printed to a PDF that is exactly **1 page** in RU, UZ and EN, PNG download, "name off by default", nothing sent to the server. One real bug found by this test and fixed: the page footer and compare tray printed on a second page.

**Please note**
1. **No real Telegram yet.** You need to create the bot with BotFather and give me/the server `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, then register the webhook (`setWebhook` with `secret_token`). Everything is tested only against a mock. The worker must run as its own process (Docker service comes in Phase 5).
2. **.ics** is verified with a strict parser, not by importing into Google or iPhone Calendar. Please try the file and the feed link on a real phone.
3. **Nothing creates plan tasks yet** (the Plans page of the old app is not rebuilt). Reminders today come from saved universities and *My dates*.
4. About 60 new Uzbek/Russian strings need native review.
5. Guests cannot get a calendar file or reminders (they need an account); the summary works for everyone.

## Phase 5 — Link recheck, production, final review (status: done, awaiting approval)
**Recheck (F9/F10)**
- `PoliteFetcher`: identifies itself (`EduBridgeBot/1.0`), obeys robots.txt (our group, then `*`; 5xx on robots means "do not fetch"), at most one request per host every 2 s, 15 s timeout, 2 retries with backoff, 5 redirects max (each re-checked), 1.5 MB body cap, never logs in or solves a CAPTCHA. **SSRF guard (H11):** private/loopback/link-local/metadata/CGNAT/reserved/IPv4-mapped addresses refused at connect time, http(s) on ports 80/443 only.
- A run reads each distinct source URL once and records one review item per link: **changed** (text hash differs, with a short before/after snippet and the previous check date), **broken**, **moved**, **blocked** (robots, 403, rate limit, CAPTCHA; remembered so the next run does not knock again; QS links are never fetched). First sight of a link only sets a baseline.
- **It never edits the catalogue** (a test compares the catalogue before and after). Admin tab *Link recheck*: run now (admin), findings list showing every record that uses the link, *Accept* (opens a draft for the editor; no value changes), *Dismiss*, and a *Needs a manual check* list with "I checked it". The worker queues a run monthly and runs it beside the reminder loop.
- The F10 data-gap tooling (links-only levels, missing QS, stale records, batch check, export) is the *Data gaps* tab from Phase 3. The content itself still needs a person with the official documents.

**Production**
- `docker-compose.prod.yml`: postgres, migrate, api, worker, caddy (HTTPS, headers, CSP, web app, `/api` proxy with streaming), backup. `docs/PRODUCTION.md` is the runbook. Built and run for real locally: all images build, stack healthy, smoke test through Caddy (headers, caching, SPA fallback, dev login absent, metrics blocked).
- **Backups:** nightly encrypted `pg_dump`, 14-day retention, optional S3 copy. `drill.sh` restore drill **passed** on the production containers.
- **Monitoring:** `/api/v1/metrics` (request counts and latency, AI spend vs budget, reminders, recheck age, users), token-protected and blocked at the proxy.
- **Load test** (`scripts/loadtest.mjs`, local Docker on a laptop, load generator on the same machine, so conservative): 50 concurrent connections: every endpoint 0 errors, p99 under 115 ms (catalogue list ~790 req/s, others 1,400-4,700). 200 concurrent connections hammering non-stop (far harsher than 200 real users): 99.9% success, p50 <= 300 ms, a few timeouts at the tail.
- **Privacy page** (`#info--privacy`, linked in the footer) in three languages. Google Fonts removed (bundled). Dependabot and a CI infra job added.
- Tests: 254 API (16 recheck, 2 metrics new), 55 web, 17 shared, 118 browser.
- `docs/SECURITY_REVIEW.md`: review against ToR Part H and the release gate, what was fixed (5 items), and the remaining risks.

**Not done, needs you**
1. Legacy data layer retirement: not touched, as agreed ("with my OK only").
2. Real Telegram, Google, Anthropic, S3 backup and public HTTPS were not exercised (see PRODUCTION.md).
3. Operator contact details are missing from the privacy page.
4. Human manual pass at 390/1280 px and native review of the Uzbek/Russian wording.

## Next
**Phase 6 (programme-level data, F13)**, only if you want it: model and admin editing first, UI and matching after. And the pending decision on retiring the legacy layer.

## Signed-in layout and dashboard (from the original app)
- Once a student has a profile (or a demo student), every page except home, sign-in, info, demo, the wizard and admin uses the sidebar layout: top bar (language, theme, notification bell, account menu), a banner for guests ("local profile, not a protected account"), and a sidebar in three groups (Plan, Discover, Prepare). Code: `components/AppShell.tsx`, `components/Notices.tsx`.
- `#dashboard`: greeting, profile completion, tiles (recommended universities, scholarship matches, deadlines within 30 days, saved, my dates), deadline list, quick actions, reminders note, recommendations. Code: `pages/Dashboard.tsx`, `lib/match.ts`, `lib/deadlines.ts`.
- `#calendar`: confirmed deadlines of saved universities plus the student's own dates; signed-in students also get the calendar file, private link and Telegram settings there.
- Matching uses only published numbers (level offered, subject, destination, IELTS when both exist). A missing value is "check", never a pass or a fail, and there is no admission probability.
- The wizard and the demo now land on the dashboard.
- Application plans (`#plans`, `#plan--id`, `pages/Plans.tsx`, `lib/plans.ts`): a checklist per university or grant with stages, priority, notes, own dates, requirements table, timeline and final review. Task dates are suggested only from a confirmed, sourced, still-open deadline. The checklist is general guidance (the catalogue has no per-record document lists), and required/"check if required" is marked honestly. Plans are stored in this browser, not in the account.
- Budget planner (`#budget`): one currency per scenario, no exchange rates, missing is never zero, totals only when every line has a value; tuition is prefilled only from a sourced per-year or per-semester amount.
- Preparation roadmap (`#roadmap`), glossary (`#glossary`) and writing tutor (`#writing`, rule-based and offline, never rewrites): ported from the original with the same wording.
- Save and Add-to-plan buttons on university and scholarship pages (before this there was no way to save an item).
- Account sync: plans and budgets (`/me/plans`), and drafts, CV text, roadmap and document ticks, saved comparisons, the bell window and the guide choice (`/me/writing`). Same rules as the profile: versioned, the server copy wins on a conflict, a guest's data is offered for upload at sign-in, a demo student's papers are never uploaded, included in the export and removed with the account. Migration `20261112120000_plans_writing`.
- Documents page (`#documents`): eight document guides from the original with a remembered checklist and the plans that have a task for the document.
- Calendar: month view, type filter, tasks due soon, tasks by application, editable own dates with a related opportunity, and how far ahead the bell looks.
- Messages after actions (save, task done, stage) and plan milestone messages (halfway, all required tasks done, submitted).
- Universities: match label for a student with a profile, sort by relevance or soonest confirmed deadline, hide those that may not fit. Compare: rows that differ are tinted; named comparisons can be saved.
- Guide picker (boy, girl, both) in Settings, using the three images from the original.
- Russian for the long texts (task checklist, roadmap, glossary, tutor feedback, documents), checked by `tests/ru-long.test.ts`.
- Deliberately not ported: the original's "demo extraction" of a transcript (it showed made-up grades), exchange-rate conversion (no real rates), and its limit of four items in a comparison (the approved ToR says three).
- Not ported: the 3-step "finder" wizard and a max-tuition filter (needs exchange rates); comparing scholarships side by side.