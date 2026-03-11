# Design: Intro Water-Ink SVG Background

Date: 2026-03-11

## Summary
Add a locally generated SVG texture to the intro screen as a full-bleed background layer. The image will evoke water-ink, scroll paper, and war-tent silhouettes while keeping low contrast so the title card remains readable.

## Goals
- Add a distinct, immersive visual layer on the intro screen only.
- Keep it fully offline with a local SVG asset.
- Maintain readability of the intro card and buttons.

## Non-Goals
- No runtime image downloads or external fonts.
- No animations in the SVG (static texture only).

## Approach
- Create `assets/ink-scroll-bg.svg` with layered paths: paper grain, mist, distant ridge lines, tent/flag silhouettes, and faint ink splatter.
- Apply it via CSS on `#screen-intro::before` (or equivalent) with `opacity: 0.25-0.35` and `mix-blend-mode: multiply`.
- Keep the intro card above the background via z-index.
- Mobile: reduce opacity and scale to avoid visual clutter.

## Implementation Notes
- SVG uses only vector shapes and gradients (no filters that blow up size).
- Size target ~30-50 KB.
- CSS background layering order: gradient base -> SVG -> subtle noise overlay.

## Validation
- Visual check on desktop and mobile.
- Ensure text contrast remains strong; reduce opacity if needed.

