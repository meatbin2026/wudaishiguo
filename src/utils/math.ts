import type { Vector2 } from "../core/types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

export function length(vector: Vector2): number {
  return Math.hypot(vector.x, vector.y);
}

export function normalize(vector: Vector2): Vector2 {
  const size = length(vector);
  if (size <= 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / size, y: vector.y / size };
}

export function scale(vector: Vector2, amount: number): Vector2 {
  return { x: vector.x * amount, y: vector.y * amount };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rotate(vector: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos
  };
}
