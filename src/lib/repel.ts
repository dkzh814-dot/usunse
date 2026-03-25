// Repel type calculation — 3 pillars (Year, Month, Day) only.
// Counts stem + branch element for each pillar = 6 characters total.

import { getYearPillar, getMonthPillar, getDayPillar, Element } from "./saju";

const BRANCH_ELEMENTS: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

// Opposite element for tie-breaking (earth has no single opposite → use wood)
const OPPOSITE: Record<Element, Element> = {
  wood: "metal", metal: "wood",
  fire: "water", water: "fire",
  earth: "wood",
};

export interface RepelType {
  name: string;
  tagline: string;
}

export const REPEL_TYPES: Record<string, RepelType> = {
  "fire-wood":   { name: "The Hollow Flame",    tagline: "Burning bright with nothing left to feed on." },
  "water-fire":  { name: "The Cold Mirror",      tagline: "Reflects everything. Feels nothing." },
  "metal-earth": { name: "The Floating Blade",   tagline: "Sharp without roots. Dangerous without knowing it." },
  "wood-metal":  { name: "The Restless Vine",    tagline: "Grows toward everything. Can't be pruned." },
  "earth-water": { name: "The Dry Shore",        tagline: "Solid ground that never lets anything sink in." },
  "fire-water":  { name: "The Spark",            tagline: "Lights up rooms. Burns through people." },
  "water-earth": { name: "The Deep Current",     tagline: "Moves without a bottom. Pulls without warning." },
  "metal-wood":  { name: "The Edge",             tagline: "Precision that doesn't know when to stop cutting." },
  "wood-fire":   { name: "The Unlit Match",      tagline: "Full of potential that never quite ignites." },
  "earth-metal": { name: "The Soft Wall",        tagline: "Immovable. Absorbs everything. Gives nothing back." },
  "fire-earth":  { name: "The Wildfire",         tagline: "Transforms everything it touches. Leaves ash." },
  "water-metal": { name: "The Undertow",         tagline: "Gentle on the surface. Pulls you under." },
  "metal-fire":  { name: "The Cold Front",       tagline: "Arrives and the temperature drops." },
  "wood-water":  { name: "The Canopy",           tagline: "Shelters everyone. Asks for nothing. Resents it quietly." },
  "earth-fire":  { name: "The Slow Burn",        tagline: "Takes forever to heat up. Never fully cools down." },
  "earth-wood":  { name: "The Plateau",          tagline: "Stable, wide, and going nowhere." },
  "wood-earth":  { name: "The Overcrowded Root", tagline: "Needs more space than it will ever ask for." },
  "fire-metal":  { name: "The Flare",            tagline: "Intense, brief, leaves a mark." },
  "water-wood":  { name: "The Fog",              tagline: "Everywhere, quietly, until suddenly it isn't." },
  "metal-water": { name: "The Current Breaker",  tagline: "Stands firm while everything flows around it." },
};

export interface RepelResult {
  repelType: RepelType;
  dominantElement: Element;
  missingElement: Element;
  key: string;
}

export function getRepelResult(year: number, month: number, day: number): RepelResult {
  const yearPillar  = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar   = getDayPillar(year, month, day);

  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of [yearPillar, monthPillar, dayPillar]) {
    counts[p.element]++;
    const branchEl = BRANCH_ELEMENTS[p.earthlyBranch];
    if (branchEl) counts[branchEl]++;
  }

  const elements: Element[] = ["wood", "fire", "earth", "metal", "water"];
  const dominant = elements.reduce((a, b) => counts[a] >= counts[b] ? a : b);

  const zeros = elements.filter(e => counts[e] === 0);
  let missing: Element;
  if (zeros.length === 1) {
    missing = zeros[0];
  } else if (zeros.length > 1) {
    const opp = OPPOSITE[dominant];
    missing = zeros.includes(opp) ? opp : zeros[0];
  } else {
    const sorted = [...elements].sort((a, b) => counts[a] - counts[b]);
    missing = sorted[0] === dominant ? sorted[1] : sorted[0];
  }

  const key = `${dominant}-${missing}`;
  const repelType =
    REPEL_TYPES[key] ??
    REPEL_TYPES[Object.keys(REPEL_TYPES).find(k => k.startsWith(dominant + "-"))!];

  return { repelType, dominantElement: dominant, missingElement: missing, key };
}
