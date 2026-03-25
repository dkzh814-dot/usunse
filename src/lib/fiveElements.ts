import { getYearPillar, getMonthPillar, getDayPillar, getHourPillar, Element, Pillar } from "./saju";

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

// Earthly Branch → Element mapping
const BRANCH_ELEMENT: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood",  "卯": "wood",
  "辰": "earth", "巳": "fire",  "午": "fire",  "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

function addPillar(counts: Record<Element, number>, pillar: Pillar) {
  counts[pillar.element]++;
  const branchEl = BRANCH_ELEMENT[pillar.earthlyBranch];
  if (branchEl) counts[branchEl]++;
}

export function getFiveElementsResult(
  year: number, month: number, day: number, hour?: number
): FiveElementsResult {
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  addPillar(counts, getYearPillar(year));
  addPillar(counts, getMonthPillar(year, month));
  addPillar(counts, getDayPillar(year, month, day));

  let usedPillars: 3 | 4 = 3;
  if (hour !== undefined) {
    addPillar(counts, getHourPillar(year, month, day, hour));
    usedPillars = 4;
  }

  const maxCount = Math.max(...ELEMENTS.map(e => counts[e]));
  const dominant = ELEMENTS.filter(e => counts[e] === maxCount);
  const missing  = ELEMENTS.filter(e => counts[e] === 0);

  return { counts, dominant, missing, usedPillars };
}
