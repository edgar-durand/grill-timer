import type { FoodKey, ThicknessKey } from './types';
import { BASE } from './foods';

export function computeSeconds(food: FoodKey, thickness: ThicknessKey, doneMult: number): number {
  const base = BASE[food][thickness];
  return Math.round(base * 2 * doneMult * 60);
}

export function fmt(s: number): string {
  const v = Math.max(0, Math.round(s));
  const m = Math.floor(v / 60);
  const sec = v % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function halfPoint(total: number): number {
  return Math.floor(total / 2);
}
