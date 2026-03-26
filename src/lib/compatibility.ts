import { getYearPillar, getMonthPillar, getDayPillar, lichunSajuYear, lichunSajuMonth, Element } from "./saju";

const BRANCH_ELEMENTS: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

export function getDominantElement(year: number, month: number, day: number): Element {
  const sajuYear = lichunSajuYear(year, month, day);
  const sajuMonth = lichunSajuMonth(month, day);
  const yearPillar  = getYearPillar(sajuYear);
  const monthPillar = getMonthPillar(sajuYear, sajuMonth);
  const dayPillar   = getDayPillar(year, month, day);

  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of [yearPillar, monthPillar, dayPillar]) {
    counts[p.element]++;
    const branchEl = BRANCH_ELEMENTS[p.earthlyBranch];
    if (branchEl) counts[branchEl]++;
  }

  const elements: Element[] = ["wood", "fire", "earth", "metal", "water"];
  return elements.reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

interface CompatEntry { score: number; hook: string; }

const COMPAT_TABLE: Record<string, CompatEntry> = {
  "water-wood":  { score: 90, hook: "There are people who make you feel like you've finally exhaled." },
  "metal-water": { score: 85, hook: "You understand each other in the spaces between words." },
  "wood-fire":   { score: 88, hook: "You make each other bigger." },
  "fire-earth":  { score: 82, hook: "This is the kind of relationship that gets better the longer it runs." },
  "earth-metal": { score: 79, hook: "You steady them. They sharpen you." },
  "water-water": { score: 76, hook: "You see each other completely. That's the gift — and the risk." },
  "earth-earth": { score: 74, hook: "You build something real. Don't forget to also build something fun." },
  "wood-wood":   { score: 71, hook: "You recognize each other immediately. That's not always a good thing." },
  "earth-wood":  { score: 60, hook: "This one asks something of you." },
  "water-earth": { score: 57, hook: "You might feel like you're talking to a wall. You're not." },
  "metal-fire":  { score: 58, hook: "You reshape each other. Not gently." },
  "metal-metal": { score: 66, hook: "Two sharp people in a small room. It gets interesting." },
  "fire-fire":   { score: 68, hook: "Incredible energy. Genuinely unsustainable." },
  "fire-water":  { score: 52, hook: "Opposites attract until they don't." },
  "wood-metal":  { score: 55, hook: "The tension is the point." },
};

const DEFAULT_ENTRY: CompatEntry = {
  score: 65,
  hook: "Something real is here. It just takes longer to name.",
};

export interface CompatibilityResult {
  score: number;
  hook: string;
}

export function getCompatibility(dob1: string, dob2: string): CompatibilityResult {
  const [y1, m1, d1] = dob1.split("-").map(Number);
  const [y2, m2, d2] = dob2.split("-").map(Number);
  const el1 = getDominantElement(y1, m1, d1);
  const el2 = getDominantElement(y2, m2, d2);
  const key = `${el1}-${el2}`;
  const revKey = `${el2}-${el1}`;
  return COMPAT_TABLE[key] ?? COMPAT_TABLE[revKey] ?? DEFAULT_ENTRY;
}

export function compatDocId(email: string, dob1: string, dob2: string): string {
  const [a, b] = [dob1, dob2].sort();
  return `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${a}_${b}_compat`;
}
