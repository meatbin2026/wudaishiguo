# Design: Five Dynasties Immersive Game Expansion

Date: 2026-03-11

## Summary
Expand the existing Five Dynasties & Ten Kingdoms immersive game with deeper historical content, richer character biographies, three choices per chapter, a hidden "Qingliu Historian" route, UI polish and motion, and new gameplay systems (time rewind, codex, achievements). Add a portrait pipeline using OpenAI Images API for realistic ancient portraits.

## Goals
- Increase historical density: stronger factual anchors per chapter and richer biographies.
- Expand branching: 3 options per node + hidden historian route.
- Add gameplay features: rewind, codex (人物/事件/时间线), achievements.
- Improve UI/visuals: expand history card, persona panel, subtle motion.
- Add portrait assets via API generation; store locally in assets.

## Non-Goals
- No backend or online storage.
- No third-party runtime dependencies.
- No automatic audio generation (can be added later if needed).

## Key Requirements
- 10 chapters remain; each chapter has 4 main routes + 1 hidden route node.
- Each node has 3 options.
- Role bios ~200 Chinese characters; chapter main narrative ~400 characters.
- Hidden route triggered by stats + flags.
- All content stays offline and is editable in `data.js`.

## Data Model Changes
### Roles
Add fields:
- `bio` (~200 chars)
- `birthDeath`, `origin`, `faction`
- `keyEvents[]`, `relations[]`
- `portrait` (path)

### Chapters / Nodes
Add fields:
- `historyPrelude` (2–3 sentences)
- `historyAftermath` (2–3 sentences)
- `personIds[]`, `eventIds[]`
- Options: `historyTags[]`, `routeWeight`, `unlock` (achievements / codex)

### Codex
Add `codex` dataset:
- `persons[]`, `events[]`, `timeline[]`
- Node references auto-unlock codex entries.

### Achievements
Add `achievements[]` with rule predicates and reward text.

### Rewind
Add `history[]` snapshots to state (last 20 steps).

## Narrative Structure
- Keep 10 chapters but expand each to 3 options.
- Hidden route: Qingliu Historian line triggered by `reputation>=70`, `strategy>=70`, `public>=65` and at least one flag among `protect_scholars|found_school|relief_famine`.
- Branching remains real each chapter; hidden nodes appear in chapters 4/6/8 if triggered.

## UI/UX
- Add a collapsible “History Card” to show `historyPrelude/historyAftermath`.
- Add “Persona” sidebar chip(s) for linked figures.
- Add Codex panel with tabs: Persons / Events / Timeline.
- Add Achievements panel.
- Add Rewind timeline list with jump-back capability.
- Motion: subtle paper drift on chapter change; ink glow on option hover.

## Portrait Pipeline
- Use OpenAI Images API with GPT Image models (`gpt-image-1.5` recommended) for realistic ancient portraits.
- Use parameters for `size`, `output_format`, and background control (`opaque` or `auto`).
- Store outputs locally under `assets/portraits/<role-id>.png` and link from `data.js`.

## Testing
- Extend data validator: 3 options per node, presence of history fields, codex references integrity.
- Add tests for rewind history and achievement unlock logic.

## Risks
- Content expansion is large; validate consistency with a data validator.
- Image generation requires API access and potential org verification.

