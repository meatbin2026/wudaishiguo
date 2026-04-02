import type { RunSummary } from "../core/types";

const STORAGE_KEY = "campus-survivor-save";

export interface SaveData {
  bestDuration: number;
  bestDefeats: number;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { bestDuration: 0, bestDefeats: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      bestDuration: parsed.bestDuration ?? 0,
      bestDefeats: parsed.bestDefeats ?? 0
    };
  } catch {
    return { bestDuration: 0, bestDefeats: 0 };
  }
}

export function saveBestRun(summary: RunSummary): SaveData {
  const current = loadSave();
  const next: SaveData = {
    bestDuration: Math.max(current.bestDuration, summary.duration),
    bestDefeats: Math.max(current.bestDefeats, summary.defeats)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
