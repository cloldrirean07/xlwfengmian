# AI Cover Creative Assistant Web App

This is the first runnable scaffold for the `AI封面创意助手`.

Current goals:

- Keep the codebase modular enough for future model integration.
- Support the product's first-round `3 direction cards` flow.
- Support the product's second-round `selected card + one sentence feedback` flow.
- Support a more realistic first-round input structure:
  `content + asset description + desired cover feel`.
- Stay dependency-light so the MVP can run locally without extra setup.

## Run

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm start
```

Open [http://localhost:3080](http://localhost:3080).

If your local environment restricts broad port binding, the server defaults to `127.0.0.1:3080`.

## Position In Repository

This app now lives inside the unified project root:

- project root: `ai-cover-creative-assistant/`
- runnable app: `ai-cover-creative-assistant/apps/web/`

## Architecture

- `public/`
  Simple browser UI for input, first-round results, and second-round refinement.
- `src/application/`
  Product-level orchestration services.
- `src/domain/`
  Rule system, effect ranking, card generation, and feedback refinement.
- `src/server/`
  Lightweight HTTP server and API routes.
- `src/shared/`
  Shared helpers.
- `tests/`
  Node-based tests for the first-round and second-round flow.

### Key Domain Modules

- `src/domain/effects/coverEffectCatalog.js`
  The current code-side source of truth for the `5 类封面效果方向`.
- `src/domain/analysis/extractInputFields.js`
  Maps raw user input into structured fields and inferred signals.
- `src/domain/analysis/rankDirectionCandidates.js`
  Scores directions by content fit, asset fit, and platform fit.
- `src/domain/cards/buildFirstRoundCards.js`
  Converts ranked directions into user-facing cards with explanation fields.
- `src/domain/cards/buildImageDirectionCandidates.js`
  Produces structured candidate image directions for each first-round card.
- `src/domain/cards/buildRankedImageStrategies.js`
  Adds a lightweight priority layer so candidate image paths can be ordered and explained.
- `src/domain/refinement/feedbackMappings.js`
  Stores second-round feedback language mappings close to the refinement flow.

## Current API

- `GET /api/health`
- `GET /api/sample-cases`
- `GET /api/cases`
- `POST /api/analyze`
- `POST /api/refine`
- `POST /api/prompt-preview`
- `POST /api/llm-draft`
- `POST /api/sample-run`
- `POST /api/case-run`
- `GET /api/platform-review?platformCaseId=P-01`
- `GET /api/platform-batch-review`
- `GET /api/platform-sync-preview?caseId=real-001`

## Data Validation

All sample and real cases now pass through a shared validation layer before entering the app flow.

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run validate:cases
```

This is the guardrail for future real-case ingestion.

## Current First-Round Input Contract

The app now treats the first round as:

- `contentTopic`
- `contentGoal`
- `userAssetType`
- `assetDescription`
- `referencePreference`
- `assetNotes`

This keeps the MVP aligned with the real product assumption that users may not know the final cover they want, but they can usually describe:

- what the content is about
- what assets they currently have
- what kind of click feeling they want

## Current Real-Case Bridge

The first real-case bridge is now active:

- `data/real-cases/items/real-001.json`
- mapped to Obsidian placeholder `P-01`

This verifies the codebase can now carry:

- planned platform-case mapping
- code-side real-case draft
- runnable case flow
- Obsidian export record

## Real-Case Scaffold

Bootstrap the Obsidian platform-case file and the code-side real-case draft together:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run bootstrap:platform-case -- --id real-001 --platform-case-id P-01 --title "待补真实案例" --platform 抖音 --dry-run
```

Remove `--dry-run` when you are ready to write both files.

## Code-Only Real-Case Scaffold

Real platform cases now support a scalable structure:

- `data/real-cases/index.json`
- `data/real-cases/items/*.json`

Create a new real-case draft with:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run scaffold:real-case -- --id real-001 --platform-case-id P-01 --title "待补真实案例" --platform 抖音
```

Preview the scaffold without writing files:

```bash
npm run scaffold:real-case -- --id real-001 --platform-case-id P-01 --title "待补真实案例" --platform 抖音 --dry-run
```

Then:

1. complete the generated file
2. run `npm run validate:cases`
3. run the real case flow

## Case Run Export

Export a full case run to JSON and Markdown:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run run:case -- --case-id sample-001
```

Outputs are written to:

- `outputs/case-runs/<case-id>/result.json`
- `outputs/case-runs/<case-id>/summary.md`

## Obsidian Export

Export a generated case run into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-case -- --case-id sample-001
```

Optional environment variable:

```bash
AI_COVER_OBSIDIAN_ROOT=/your/obsidian/project/root
```

## Case Progress Report

Generate a cross-layer progress report for placeholders, real-case files, run exports, and Obsidian drafts:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run report:case-progress
```

Outputs are written to:

- `outputs/reports/case-progress/case-progress.json`
- `outputs/reports/case-progress/case-progress.md`

Export the report into the Obsidian progress folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-progress
```

## Real-Case Readiness Report

Check whether each real-case is still placeholder-heavy, partially filled, or ready for manual validation:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run report:real-case-readiness
```

Outputs are written to:

- `outputs/reports/real-case-readiness/real-case-readiness.json`
- `outputs/reports/real-case-readiness/real-case-readiness.md`

Export the readiness report into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-readiness
```

## Real-Case Fill Sheet

Generate an actionable fill sheet from the current missing fields of one real-case:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run generate:real-case-fill-sheet -- --case-id real-001
```

Outputs are written to:

- `outputs/fill-sheets/<case-id>/fill-sheet.json`
- `outputs/fill-sheets/<case-id>/fill-sheet.md`

Export the fill sheet into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-fill-sheet -- --case-id real-001
```

The generated fill sheet now also surfaces:

- the top 3 missing items to fill first
- priority levels for every missing field
- a short reason for why each item should be filled now

## Platform Case Completeness

Check whether an upstream Obsidian platform-case note is still placeholder-heavy before syncing it into a real-case:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run report:platform-case-completeness -- --platform-case-id P-01
```

## Platform Case Review

Generate a single-case review that combines completeness, field quality, linked real-cases, and sync preview:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run report:platform-case-review -- --platform-case-id P-01
```

Outputs are written to:

- `outputs/reports/platform-case-review/P-01.json`
- `outputs/reports/platform-case-review/P-01.md`

Export the review summary into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-platform-review -- --platform-case-id P-01
```

## Platform Case Fill Draft

Generate an editable fill draft from the current single-case review result:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run generate:platform-case-fill-draft -- --platform-case-id P-01
```

Outputs are written to:

- `outputs/fill-drafts/platform-cases/P-01.md`
- `outputs/fill-drafts/platform-cases/P-01.json`

Export the fill draft into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-platform-fill-draft -- --platform-case-id P-01
```

## Platform Case Priority Draft Cards

Generate top-3 editable draft cards for the highest-priority platform-case fields:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run generate:platform-case-priority-drafts -- --platform-case-id P-01
```

Outputs are written to:

- `outputs/draft-cards/platform-cases/P-01.md`
- `outputs/draft-cards/platform-cases/P-01.json`

Export the draft cards into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-platform-priority-drafts -- --platform-case-id P-01
```

## Platform Case Batch Review

Generate a batch review board across all real-cases that already map to upstream platform-case notes:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run report:platform-case-batch-review
```

Outputs are written to:

- `outputs/reports/platform-case-batch-review/platform-case-batch-review.json`
- `outputs/reports/platform-case-batch-review/platform-case-batch-review.md`

Export the review board into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/codex1/ai-cover-creative-assistant/apps/web
npm run export:obsidian-platform-batch-review
```

Outputs are written to:

- `outputs/reports/platform-case-completeness/<platform-case-id>.json`
- `outputs/reports/platform-case-completeness/<platform-case-id>.md`

Export the completeness report into the Obsidian validation folder:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run export:obsidian-platform-completeness -- --platform-case-id P-01
```

The current checks focus on whether the platform note already contains enough stable observations to be worth syncing:

- case identity and source platform
- topic, goal, and source link or asset path
- subject description and visual focus
- click mechanism, cover direction, and feedback words
- a short one-line conclusion

## Platform Note Sync

Preview a sync from the Obsidian platform-case note into one real-case JSON:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run sync:platform-note -- --case-id real-001
```

This defaults to `dry-run` and prints:

- the extracted fields from the Obsidian note
- the merged real-case preview after sync
- the changed fields summary
- the readiness before/after summary

Write the synced result back to the real-case JSON:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run sync:platform-note -- --case-id real-001 --write
```

Write the result and immediately refresh readiness + fill-sheet artifacts:

```bash
cd /Users/xlw/Documents/shige/ai-cover-creative-assistant/apps/web
npm run sync:platform-note -- --case-id real-001 --write --refresh-artifacts --export-obsidian
```

Each sync run now also writes a local sync log to:

- `outputs/sync-logs/<case-id>/`

## Sample Data Layer

The app now includes a structured sample-fixture flow:

- `data/sample-cases.json`
- `src/infrastructure/sample-cases/`
- `src/application/runSampleCaseFlow.js`

This is a bridge between product docs, future real cases, and code-level end-to-end verification.

## Real-Case Ready Data Contract

The project now separates:

- `data/sample-cases.json`
- `data/real-cases/index.json`
- `data/real-cases/real-case.template.json`

This lets the current fixture flow keep running while preparing the codebase for real platform-case ingestion.

## Current LLM Adapter

The first adapter layer is now provider-based.

- Default provider: `mock`
- Config entrypoint: `src/infrastructure/llm/`
- Optional real provider skeleton: `openai`

This keeps the domain logic separate from later real model integration.

## Environment

If you later want to wire a real OpenAI provider, set:

```bash
AI_COVER_LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
AI_COVER_OPENAI_MODEL=your_model
```

Current implementation keeps `mock` as the default safe provider.
