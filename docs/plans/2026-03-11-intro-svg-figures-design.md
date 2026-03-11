# Design: Intro SVG Adds Silhouette Figures & War Elements

Date: 2026-03-11

## Summary
Enhance the intro SVG background by adding low-contrast silhouette figures and battlefield elements (riders, foot soldiers with spears, banners, carts, smoke). These elements should remain subtle and integrated with the ink-wash style.

## Goals
- Add character and war context without distracting from the intro card.
- Keep a single SVG asset and the existing CSS reference.
- Maintain offline, lightweight delivery (SVG < 80 KB).

## Non-Goals
- No animated elements.
- No new JS behavior.

## Approach
- Update `assets/ink-scroll-bg.svg` with an additional midground layer:
  - Riders (2–3), foot soldiers (3–5), banners (2), a wagon silhouette.
  - Smoke and dust as faint gradient shapes.
- Use opacity between 0.25–0.4 and dark ink tones.
- Position elements in lower third to avoid the intro title area.

## Validation
- Verify readability of the intro text remains high.
- Confirm asset size remains under 80 KB.

