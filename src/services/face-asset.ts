const FACE_ASSET_PATH = "/art/player-face.svg";

let cachedImage: HTMLImageElement | null = null;
let loadingPromise: Promise<HTMLImageElement | null> | null = null;

export function getFaceAssetPath(): string {
  return FACE_ASSET_PATH;
}

export function getFaceAssetSync(): HTMLImageElement | null {
  return cachedImage;
}

export async function ensureFaceAssetLoaded(): Promise<HTMLImageElement | null> {
  if (cachedImage) {
    return cachedImage;
  }
  if (!loadingPromise) {
    loadingPromise = loadImage(FACE_ASSET_PATH);
  }
  cachedImage = await loadingPromise;
  return cachedImage;
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
