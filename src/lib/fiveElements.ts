import { getYearPillar, getMonthPillar, getDayPillar, getHourPillar, Element } from "./saju";

export interface FiveElementsResult {
  counts: Record<Element, number>;
  dominant: Element[];
  missing: Element[];
  usedPillars: 3 | 4;
}

export const ELEMENT_META: Record<Element, { korean: string; english: string; color: string }> = {
  wood:  { korean: "목", english: "Wood",  color: "#6BCB77" },
  fire:  { korean: "화", english: "Fire",  color: "#FF6B6B" },
  earth: { korean: "토", english: "Earth", color: "#D4A96A" },
  metal: { korean: "금", english: "Metal", color: "#C0C0C0" },
  water: { korean: "수", english: "Water", color: "#4A90D9" },
};

export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export function getFiveElementsResult(
  year: number, month: number, day: number, hour?: number
): FiveElementsResult {
  const yearPillar  = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar   = getDayPillar(year, month, day);

  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  counts[yearPillar.element]++;
  counts[monthPillar.element]++;
  counts[dayPillar.element]++;

  let usedPillars: 3 | 4 = 3;
  if (hour !== undefined) {
    counts[getHourPillar(year, month, day, hour).element]++;
    usedPillars = 4;
  }

  const maxCount = Math.max(...ELEMENTS.map(e => counts[e]));
  const dominant = ELEMENTS.filter(e => counts[e] === maxCount);
  const missing  = ELEMENTS.filter(e => counts[e] === 0);

  return { counts, dominant, missing, usedPillars };
}
