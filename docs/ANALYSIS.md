# How the original EduBridge works (analysis of the HTML artifact)

The source is one file, `tools/decompile/source/EduBridge.original.html` (2.1 MB). It was generated as a Claude
artifact and downloaded. This is what is inside and how it behaves.

## Anatomy of the file
| Part | Size | What it is |
|---|---|---|
| `<style>` (head) | 0.4 KB | base reset: safe-area padding, body font, `[hidden]` |
| Google Fonts link | – | Manrope (UI) and IBM Plex Mono |
| `<style>` (body) | 39.8 KB | the compiled Tailwind stylesheet. Colours are CSS variables (`--navy`, `--teal`, …) with a light and a dark theme |
| `<script type="module">` | 2.09 MB | a Vite build: React 18 + ReactDOM (~0.9 MB), ~100 `lucide` icons, then the app (~1.2 MB) |

Inside the app part (1.2 MB): 477 KB are 14 embedded WebP images (the three guide characters and eleven head
expressions), ~600 KB are catalogue data and the Russian dictionary, and ~300 KB are the application code.

## What the app is
A single-page app for students from Uzbekistan who plan to study abroad (UZ / RU / EN). Routes are hash routes
(`#home`, `#universities--advanced`, `#plan--<id>`). Two layouts: a public one (header, footer) and, once a student has
a profile (or a demo student), an app layout with a sidebar (Plan / Discover / Prepare), a notification bell and an
account menu.

Pages: home, countries, country, universities (+ advanced search, + 3-step finder), university, scholarships,
opportunity detail, compare (opportunities and universities), glossary, preparation roadmap, onboarding wizard
(7 steps), dashboard, application plans and plan detail (checklist, requirements, timeline, final review), calendar,
documents, writing tutor, profile builder (check, ideas, plan, AI coach), AI advisor (ask, documents, interview,
report), budget planner, settings, data review (staff), demo, sign in, info pages.

## The logic
* **Eligibility engine** (`lib/eligibility`): compares a profile with a programme or scholarship record, check by
  check (level, citizenship, subject, grades, language, tuition, living costs, funding, work, age). Hard checks decide
  "not eligible"; soft checks only reorder. It never produces a probability.
* **Plans** (`lib/plan-tasks`): a checklist per opportunity built from templates, with due dates counted back from a
  verified deadline; stages, priority, notes, attachments (file name only).
* **Events and notices** (`lib/derived`): deadlines of saved items, task dates and own events become a calendar and
  in-app reminders at the student's chosen days before.
* **Writing tutor / profile builder**: rule-based analysers (claims without evidence, clichés, word limits, gaps by
  group of university) that work offline, plus optional live AI.
* **AI**: through `window.claude` (the artifact feature) with streaming and JSON helpers, images for scanned PDFs.

## The state
One object, kept in `localStorage["edubridge:v1"]` and held in a React context (`store/store`). 29 fields:
`version, lang, profile, onboardingDraft, demo, saved, compare, applications, customEvents, drafts, budgets,
comparisons, reminders, readNotices, rates, chat, liveAI, aiOff, chatThreads, advisorDocs, interviews, consistency,
growth, displayCurrency, cvText, finder, mascot, dataOverrides`.

## The data
Embedded in the bundle: 7 national grants and other scholarships, programmes, a curated catalogue of 50 universities
(5 countries × 10) with sources and dates, legacy lists, country selection texts, and a Russian dictionary keyed by
the English text.

## What was missing for a real product
No accounts (everything in one browser), no shared data (staff "overrides" only changed the staff member's own
browser), AI only inside Claude, reminders only in the page, no background jobs.

# How the new project maps onto it

| Original | New project |
|---|---|
| the compiled JS bundle | `tools/decompile` rebuilt it as readable React source in `apps/web/src` (JSX, real imports, one module per area). The class names, markup and CSS are the original's, so the pages are pixel-identical (`tools/fidelity` proves it) |
| embedded catalogue data | the database (`CatalogDataset`), served by `GET /api/v1/catalog`; the app loads it before it starts and falls back to a bundled snapshot when offline |
| `localStorage` state | the same object, synced to the account as documents `core / profile / plans / writing / ai` (`/me/state/:key`), with optimistic versions; a guest keeps working locally |
| "demo student" | unchanged and local only: never uploaded |
| `dataOverrides` (hide / reviewed, local) | a shared `overrides` dataset edited by editors and admins, visible to every student |
| in-app reminders | the app sends its computed dated items (`calendar` document); the worker turns them into Telegram reminders and a `.ics` feed |
| `window.claude` AI | `POST /api/v1/ai/text` (streaming): key on the server, monthly budget, daily quota per student, burst limit, one request at a time per task, usage stored as sizes and cost only |
| staff gate via the artifact owner | roles `student / editor / admin`, recent sign-in required, audit log |
| (none) | monthly link recheck of every source URL in the catalogue, with findings for a person to review |
