const ART_ASSET_PATHS = {
  "player-body": "/art/characters/player-body.svg",
  worksheet: "/art/enemies/worksheet.svg",
  "paper-ball": "/art/enemies/paper-ball.svg",
  "alarm-clock": "/art/enemies/alarm-clock.svg",
  "eraser-monster": "/art/enemies/eraser-monster.svg",
  "pencil-elite": "/art/enemies/pencil-elite.svg",
  "blackboard-boss": "/art/enemies/blackboard-boss.svg",
  "paper-plane": "/art/weapons/paper-plane.svg",
  pencil: "/art/weapons/pencil.svg",
  chalk: "/art/weapons/chalk.svg",
  textbook: "/art/weapons/textbook.svg",
  eraser: "/art/weapons/eraser.svg",
  ruler: "/art/weapons/ruler.svg",
  "xp-orb": "/art/pickups/xp-orb.svg",
  "xp-orb-rare": "/art/pickups/xp-orb-rare.svg",
  "campus-backdrop": "/art/maps/campus-backdrop.svg",
  "campus-board": "/art/maps/campus-board.svg",
  "school-crest": "/art/ui/school-crest.svg",
  "hud-note": "/art/ui/hud-note.svg",
  "boss-alert": "/art/ui/boss-alert.svg",
  "effect-hit": "/art/effects/effect-hit.svg",
  "effect-level-up": "/art/effects/effect-level-up.svg",
  "effect-pickup": "/art/effects/effect-pickup.svg",
  "effect-boss-warning": "/art/effects/effect-boss-warning.svg"
} as const;

type ArtAssetId = keyof typeof ART_ASSET_PATHS;

const cache = new Map<ArtAssetId, HTMLImageElement | null>();
const pending = new Map<ArtAssetId, Promise<HTMLImageElement | null>>();

export function getArtAssetPath(id: ArtAssetId): string {
  return ART_ASSET_PATHS[id];
}

export function getArtAssetSync(id: ArtAssetId): HTMLImageElement | null {
  return cache.get(id) ?? null;
}

export async function ensureArtAssetLoaded(id: ArtAssetId): Promise<HTMLImageElement | null> {
  if (cache.has(id)) {
    return cache.get(id) ?? null;
  }
  const inFlight = pending.get(id);
  if (inFlight) {
    return inFlight;
  }
  const promise = loadImage(ART_ASSET_PATHS[id]).then((image) => {
    cache.set(id, image);
    pending.delete(id);
    return image;
  });
  pending.set(id, promise);
  return promise;
}

export function preloadBattleArtAssets(): Promise<Array<HTMLImageElement | null>> {
  return Promise.all(Object.keys(ART_ASSET_PATHS).map((id) => ensureArtAssetLoaded(id as ArtAssetId)));
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
