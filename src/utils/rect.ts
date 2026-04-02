import type { Rect } from "../core/types";

export function isPointInsideRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function isPointInsideRects(x: number, y: number, rects: Rect[]): boolean {
  return rects.some((rect) => isPointInsideRect(x, y, rect));
}
