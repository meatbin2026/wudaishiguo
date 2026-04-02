# Campus Survivor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first playable campus-themed survivor H5 game that runs in mobile and desktop browsers with dynamic touch movement, auto-attacks, level-up choices, one boss, and a clean expansion path.

**Architecture:** Use a Vite-powered TypeScript app with a Canvas-driven game loop and a small DOM UI layer. Keep combat systems generic and move all weapons, enemies, maps, and future leaderboard hooks into configuration or registry modules so the first playable build stays small while preserving expansion paths.

**Tech Stack:** Vite, TypeScript, HTML5 Canvas, vanilla DOM/CSS, npm scripts

---

## File Structure

- `package.json`
  Responsibility: project metadata, scripts, dependency declarations
- `tsconfig.json`
  Responsibility: TypeScript compiler settings
- `vite.config.ts`
  Responsibility: Vite dev/build defaults
- `index.html`
  Responsibility: app shell and mount point
- `src/main.ts`
  Responsibility: bootstraps app, scene manager, resize handling
- `src/styles.css`
  Responsibility: shell layout, HUD, overlays, mobile-safe UI styling
- `src/core/game.ts`
  Responsibility: main loop, pause/resume, update/render orchestration
- `src/core/scene-manager.ts`
  Responsibility: scene transitions for title, battle, level-up, result
- `src/core/types.ts`
  Responsibility: shared scalar/entity/config types
- `src/core/random.ts`
  Responsibility: deterministic helpers for spawn selection and upgrade rolls
- `src/input/keyboard-input.ts`
  Responsibility: desktop movement input
- `src/input/touch-stick.ts`
  Responsibility: dynamic-anywhere mobile joystick excluding UI zones
- `src/content/weapons.ts`
  Responsibility: starter weapon configs and level curves
- `src/content/enemies.ts`
  Responsibility: normal enemy, elite, boss configs
- `src/content/map.ts`
  Responsibility: first campus map config and theme metadata
- `src/content/upgrades.ts`
  Responsibility: level-up option pool and passive upgrades
- `src/content/characters.ts`
  Responsibility: default student avatar config and future photo-face slots
- `src/game/state.ts`
  Responsibility: battle state shape and helpers
- `src/game/player.ts`
  Responsibility: player movement, collision body, health, XP pickup behavior
- `src/game/enemy.ts`
  Responsibility: enemy motion, damage, status effects, boss phase hooks
- `src/game/projectile.ts`
  Responsibility: projectile or area attack simulation
- `src/game/spawner.ts`
  Responsibility: timed wave script, elite timing, boss spawn transition
- `src/game/upgrades.ts`
  Responsibility: roll and apply level-up selections
- `src/game/effects.ts`
  Responsibility: hit flashes, trails, level-up burst, pooled ephemeral effects
- `src/game/battle-scene.ts`
  Responsibility: battle scene glue, HUD updates, progression, pause flow
- `src/scenes/title-scene.ts`
  Responsibility: start screen and placeholder buttons for roles/maps/leaderboard
- `src/scenes/result-scene.ts`
  Responsibility: game over / clear summary and replay flow
- `src/ui/dom.ts`
  Responsibility: cache DOM nodes and typed query helpers
- `src/ui/hud.ts`
  Responsibility: battle HUD rendering
- `src/ui/upgrade-modal.ts`
  Responsibility: level-up choice overlay and click/touch handling
- `src/ui/debug-panel.ts`
  Responsibility: hidden balance/debug controls for battle iteration
- `src/ui/orientation-overlay.ts`
  Responsibility: soft prompt for portrait-to-landscape guidance
- `src/services/save-service.ts`
  Responsibility: localStorage persistence for best runs/settings
- `src/services/leaderboard-adapter.ts`
  Responsibility: no-op interfaces reserved for future backend integration
- `src/utils/math.ts`
  Responsibility: vector math and collision helpers
- `src/utils/rect.ts`
  Responsibility: UI exclusion hit-testing for touch input
- `README.md`
  Responsibility: run/build notes and feature summary

## Task 1: Scaffold the app shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`

- [ ] **Step 1: Create package metadata and scripts**

```json
{
  "name": "campus-survivor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Add TypeScript and Vite config**

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 4173
  }
});
```

- [ ] **Step 3: Build the HTML shell with canvas and overlays**

```html
<div id="app">
  <canvas id="game"></canvas>
  <div id="hud"></div>
  <div id="overlay-root"></div>
</div>
```

- [ ] **Step 4: Add base CSS for full-screen landscape play**

```css
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 5: Boot the app**

```ts
import "./styles.css";
import { createGameApp } from "./core/game";

createGameApp();
```

- [ ] **Step 6: Run the dev server**

Run: `npm install`
Expected: installs Vite and TypeScript successfully

Run: `npm run build`
Expected: build succeeds with an empty app shell

## Task 2: Build core loop and scene infrastructure

**Files:**
- Create: `src/core/game.ts`
- Create: `src/core/scene-manager.ts`
- Create: `src/core/types.ts`
- Create: `src/core/random.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Define shared core types**

```ts
export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

- [ ] **Step 2: Implement scene manager**

```ts
export class SceneManager {
  private current: Scene | null = null;
  set(scene: Scene) { /* exit old, enter new */ }
  update(dt: number) { this.current?.update(dt); }
  render(ctx: CanvasRenderingContext2D) { this.current?.render(ctx); }
}
```

- [ ] **Step 3: Implement the requestAnimationFrame loop**

```ts
let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  manager.update(dt);
  manager.render(ctx);
  requestAnimationFrame(frame);
}
```

- [ ] **Step 4: Add resize handling and device-pixel-ratio scaling**

```ts
canvas.width = Math.floor(innerWidth * devicePixelRatio);
canvas.height = Math.floor(innerHeight * devicePixelRatio);
ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
```

- [ ] **Step 5: Verify shell still builds**

Run: `npm run build`
Expected: PASS with no TypeScript errors

## Task 3: Add title scene, result scene, and DOM UI helpers

**Files:**
- Create: `src/scenes/title-scene.ts`
- Create: `src/scenes/result-scene.ts`
- Create: `src/ui/dom.ts`
- Create: `src/ui/orientation-overlay.ts`
- Modify: `src/styles.css`
- Modify: `src/core/game.ts`

- [ ] **Step 1: Create typed DOM lookup helpers**

```ts
export function requireElement<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}
```

- [ ] **Step 2: Implement the title screen DOM**

```ts
title.innerHTML = `
  <button data-action="start">开始游戏</button>
  <button disabled>角色</button>
  <button disabled>地图</button>
  <button disabled>榜单</button>
`;
```

- [ ] **Step 3: Implement the result scene summary UI**

```ts
result.innerHTML = `
  <h2>本局总结</h2>
  <button data-action="restart">再来一局</button>
`;
```

- [ ] **Step 4: Add orientation hint overlay**

```ts
const showLandscapeHint = window.innerHeight > window.innerWidth;
```

- [ ] **Step 5: Verify screen flow**

Run: `npm run dev`
Expected: title screen shows, start button can later be wired into battle scene

## Task 4: Implement input systems for desktop and mobile

**Files:**
- Create: `src/input/keyboard-input.ts`
- Create: `src/input/touch-stick.ts`
- Create: `src/utils/rect.ts`
- Modify: `src/core/types.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create a normalized movement vector contract**

```ts
export interface MoveInput {
  getVector(): { x: number; y: number };
  destroy(): void;
}
```

- [ ] **Step 2: Implement keyboard movement**

```ts
const x = (right ? 1 : 0) - (left ? 1 : 0);
const y = (down ? 1 : 0) - (up ? 1 : 0);
```

- [ ] **Step 3: Implement dynamic-anywhere touch stick**

```ts
if (!isPointInsideUi(clientX, clientY)) {
  stickOrigin = { x: clientX, y: clientY };
}
```

- [ ] **Step 4: Clamp drag radius and normalize the output vector**

```ts
const len = Math.hypot(dx, dy);
const scale = Math.min(len, maxRadius) / Math.max(len, 1);
```

- [ ] **Step 5: Add a minimal touch indicator**

```css
.touch-stick {
  position: fixed;
  border-radius: 999px;
  pointer-events: none;
}
```

- [ ] **Step 6: Manually verify both input modes**

Run: `npm run dev`
Expected: desktop movement responds to keys, touch movement responds anywhere outside UI

## Task 5: Build the battle state, player, projectiles, and enemy simulation

**Files:**
- Create: `src/game/state.ts`
- Create: `src/game/player.ts`
- Create: `src/game/enemy.ts`
- Create: `src/game/projectile.ts`
- Create: `src/utils/math.ts`
- Modify: `src/core/types.ts`

- [ ] **Step 1: Define battle state types**

```ts
export interface BattleState {
  time: number;
  level: number;
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
}
```

- [ ] **Step 2: Implement player movement, damage, XP, and pickup radius**

```ts
player.x += move.x * player.speed * dt;
player.y += move.y * player.speed * dt;
```

- [ ] **Step 3: Implement enemy movement roles**

```ts
switch (enemy.ai) {
  case "chase": /* move toward player */ break;
  case "dash": /* burst on cooldown */ break;
}
```

- [ ] **Step 4: Implement projectile and area-hit simulation**

```ts
projectile.life -= dt;
projectile.x += projectile.vx * dt;
```

- [ ] **Step 5: Wire collision, damage, and defeat cleanup**

```ts
if (distance(projectile, enemy) <= projectile.radius + enemy.radius) {
  enemy.hp -= projectile.damage;
}
```

- [ ] **Step 6: Verify a sandbox combat slice**

Run: `npm run dev`
Expected: player can move in a blank arena while enemies chase and can be damaged

## Task 6: Add content registries for characters, weapons, enemies, map, and upgrades

**Files:**
- Create: `src/content/characters.ts`
- Create: `src/content/weapons.ts`
- Create: `src/content/enemies.ts`
- Create: `src/content/map.ts`
- Create: `src/content/upgrades.ts`
- Modify: `src/game/state.ts`

- [ ] **Step 1: Define starter character config with photo-face slots**

```ts
export const defaultCharacter = {
  id: "student-default",
  faceFrame: { shape: "circle", outline: "#fff3c4" }
};
```

- [ ] **Step 2: Add 4-6 starter weapons**

```ts
{
  id: "paper-plane",
  attackKind: "projectile",
  levels: [{ cooldown: 1.2, count: 1 }, { cooldown: 0.9, count: 2 }]
}
```

- [ ] **Step 3: Add enemy and boss definitions**

```ts
{
  id: "blackboard-boss",
  kind: "boss",
  phases: [{ hpRatio: 0.7, action: "spawnAdds" }]
}
```

- [ ] **Step 4: Add upgrade pool entries**

```ts
{ id: "move-speed-up", kind: "passive", label: "跑得更快" }
```

- [ ] **Step 5: Add map metadata**

```ts
export const campusMap = { id: "playground", name: "校园操场" };
```

- [ ] **Step 6: Verify the content registry compiles**

Run: `npm run build`
Expected: PASS with content imported into the battle scene

## Task 7: Implement spawns, wave pacing, auto-attacks, level-up choices, and battle scene glue

**Files:**
- Create: `src/game/spawner.ts`
- Create: `src/game/upgrades.ts`
- Create: `src/game/battle-scene.ts`
- Create: `src/ui/hud.ts`
- Create: `src/ui/upgrade-modal.ts`
- Modify: `src/core/game.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement timed wave progression**

```ts
if (state.time > 120) density = 1.6;
if (state.time > 480) spawnBoss();
```

- [ ] **Step 2: Implement auto-attack selection**

```ts
const target = findNearestEnemy(player, state.enemies);
spawnWeaponAttack(player, target, activeWeapon);
```

- [ ] **Step 3: Implement experience, level-up pause, and three-choice rolls**

```ts
const choices = rollUpgradeChoices(state, 3);
upgradeModal.open(choices, (choice) => applyUpgrade(state, choice));
```

- [ ] **Step 4: Implement HUD updates**

```ts
hud.render({
  hp: player.hp,
  xp: player.xp,
  time: state.time
});
```

- [ ] **Step 5: Implement battle result transitions**

```ts
if (player.hp <= 0 || bossDefeated) {
  sceneManager.set(new ResultScene(summary));
}
```

- [ ] **Step 6: Verify a full 2-3 minute loop**

Run: `npm run dev`
Expected: play session reaches at least one level-up and one elite/boss transition without crashing

## Task 8: Add rendering style, campus theming, and readable combat effects

**Files:**
- Modify: `src/game/battle-scene.ts`
- Create: `src/game/effects.ts`
- Modify: `src/styles.css`
- Modify: `src/content/characters.ts`
- Modify: `src/content/enemies.ts`

- [ ] **Step 1: Draw the campus arena and background accents**

```ts
ctx.fillStyle = "#8ecf78";
ctx.fillRect(0, 0, width, height);
```

- [ ] **Step 2: Draw the student avatar in photo-face-ready layers**

```ts
drawBody(ctx, player);
drawFaceFrame(ctx, player);
drawHair(ctx, player);
```

- [ ] **Step 3: Add enemy silhouettes with unique shapes**

```ts
if (enemy.id === "paper-plane") drawTriangleEnemy(ctx, enemy);
```

- [ ] **Step 4: Add pooled hit flashes, trails, and level-up bursts**

```ts
effects.spawn("hit-flash", enemy.x, enemy.y);
```

- [ ] **Step 5: Verify readability on desktop and mobile viewports**

Run: `npm run dev`
Expected: player, enemies, pickups, and hazards remain readable at common mobile and desktop sizes

## Task 9: Add local save hooks, future leaderboard adapter, and a hidden debug panel

**Files:**
- Create: `src/services/save-service.ts`
- Create: `src/services/leaderboard-adapter.ts`
- Create: `src/ui/debug-panel.ts`
- Modify: `src/game/battle-scene.ts`
- Modify: `src/scenes/result-scene.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Add local best-run persistence**

```ts
saveBestRun({ duration, defeats, level });
```

- [ ] **Step 2: Add a no-op leaderboard interface**

```ts
export async function submitScore() {
  return { ok: false, reason: "not-configured" };
}
```

- [ ] **Step 3: Add a hidden debug panel toggle**

```ts
if (event.key.toLowerCase() === "`") debugVisible = !debugVisible;
```

- [ ] **Step 4: Implement debug actions for balance testing**

```ts
actions = ["level-up", "spawn-boss", "toggle-invincible"];
```

- [ ] **Step 5: Verify persistence and debug workflow**

Run: `npm run dev`
Expected: best run survives refresh and debug actions affect the active battle safely

## Task 10: Final verification, polish, and docs

**Files:**
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-04-02-campus-survivor-design.md`
- Modify: `docs/superpowers/plans/2026-04-02-campus-survivor.md`

- [ ] **Step 1: Add README run/build instructions**

```md
## Development

`npm install`
`npm run dev`
```

- [ ] **Step 2: Cross-check implementation against the spec**

Run: compare delivered features against:
`docs/superpowers/specs/2026-04-02-campus-survivor-design.md`

Expected: first playable scope matches the approved design without silent omissions

- [ ] **Step 3: Run final production build**

Run: `npm run build`
Expected: PASS and output generated in `dist/`

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Expected:
- title screen loads
- desktop keyboard movement works
- mobile dynamic-anywhere joystick works
- auto-attacks fire
- level-up choices appear
- result screen completes a run

- [ ] **Step 5: Update plan checkboxes and summarize follow-up work**

```md
- Future phase: real leaderboard backend
- Future phase: role select and map select screens
```
