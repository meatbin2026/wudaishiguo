# Design: Five Dynasties Immersive RPG (Static Web)

Date: 2026-03-11

## Summary
Build a standalone, static, single-page web game inspired by the provided reference but with a more refined UI. The game is set in the Five Dynasties and Ten Kingdoms era, supports 18 playable roles, 10 chapters, and genuine branching each chapter. Choices and a numeric system influence routes and endings. The project must run by opening `index.html` locally with all data embedded in JS.

## Goals
- Provide an immersive, scroll-based narrative with 10 chapters and real branching each chapter.
- Support 18 distinct roles with unique opening, traits, and starting stats.
- Maintain 8 core resources: reputation, silver, military, public support, strategy, prestige, loyalty, power.
- Use a water-ink / scroll-paper / war-tent-armor aesthetic, more polished than the reference.
- Run fully offline: no CDN, no backend, no build step required to play.

## Non-Goals
- No backend, accounts, or multiplayer.
- No procedural generation (no event pool). The story is authored.
- No external asset fetching at runtime.

## Constraints & Assumptions
- The game must run by double-clicking `index.html`.
- All content and data are shipped in local JS files.
- Branching is managed by 4 main routes with conditional chapter variants to avoid explosion.
- Content may be more dramatized while keeping historical bones.

## Chosen Approach (B)
Use a route-based narrative graph with chapter variants:
- 4 primary routes (military, court, fiscal, scholar).
- Each chapter has distinct nodes per route and per key flags.
- Choices can change flags, affect stats, and switch routes mid-campaign.
This satisfies “real branching every chapter” while keeping scope achievable.

## Information Architecture
Single-page app with screen states:
- Start screen
- Role selection
- Story scene (main narrative)
- Ending screen

## Data Model
- `roles[]`: 18 items with id, name, short bio, route, and starting stats.
- `chapters[]`: 10 chapters, each with multiple nodes keyed by route + flag conditions.
- `node`: { id, chapter, route, title, speaker, location, text[], options[] }
- `option`: { text, effects, flags, routeShift, nextId, requires }
- `effects`: { reputation, silver, military, public, strategy, prestige, loyalty, power }
- `flags`: boolean story markers.

## State & Data Flow
- `gameState`: current role, chapter, route, stats, flags, log, lastNodeId.
- Rendering flow: state -> select node -> render narrative -> render options.
- On option select: apply effects -> update flags/route -> advance node/ chapter.
- Save/load: serialize `gameState` to `localStorage` on every decision.

## UI/UX Design
- Color palette: old paper yellow, ink black, rust red, dark teal, muted gold.
- Layout:
  - Top status bar with role name, chapter, and 8 stat meters (collapsible).
  - Main scroll card for narrative text, with secondary “war tent” note card for quotes.
  - Bottom choice cards (2-3), each with small consequence tags.
  - Side panel “chronicle” log of recent decisions (moves to bottom on mobile).
- Motion:
  - Chapter transitions: fade + slight paper float.
  - Hover: ink spread and warm glow.
  - Stat change: brief pulse with +/- tooltip.
- Accessibility:
  - Large readable fonts, high contrast against paper background.
  - Keyboard shortcuts 1/2/3 for options.

## Error Handling
- Missing/corrupted save -> prompt to start a new game.
- Invalid node lookup -> fall back to chapter start node and log error in console.
- Asset load failure -> fallback to pure CSS textures and system fonts.

## Testing Plan (Manual)
- Start -> role select -> chapter 1 loads for each route.
- Ensure each chapter has >= 2 distinct nodes per route.
- Validate stat changes and flag conditions.
- Check route switching works.
- Verify save/resume and reset.
- Test desktop and mobile layouts.

## Deliverables
- `index.html`, `styles.css`, `game.js`, `data.js`, `assets/` (optional textures, local fonts).
- Fully authored 10 chapters with route-based branching and endings.

## Open Questions
- None. All requirements confirmed.
