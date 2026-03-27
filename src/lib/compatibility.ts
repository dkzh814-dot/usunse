import {
  getYearPillar, getMonthPillar, getDayPillar,
  lichunSajuYear, lichunSajuMonth, Element,
} from "./saju";

const BRANCH_ELEMENT: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

// ── relationship tables ───────────────────────────────────────────────────────

// 삼합 (three-harmony) groups
const SAMHAP: string[][] = [
  ["寅", "午", "戌"], // fire direction
  ["申", "子", "辰"], // water direction
  ["巳", "酉", "丑"], // metal direction
  ["亥", "卯", "未"], // wood direction
];

// 육합 (six-harmony) pairs
const YUKHAP: [string, string][] = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"],
  ["辰", "酉"], ["巳", "申"], ["午", "未"],
];

// 충 (clash) pairs
const CHUNG: [string, string][] = [
  ["子", "午"], ["丑", "未"], ["寅", "申"],
  ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];

// 천간합 (stem harmony) pairs
const CHUNGAN_HAP: [string, string][] = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
];

// Season by branch (0=Spring, 1=Summer, 2=Autumn, 3=Winter)
const SEASON: Record<string, number> = {
  "寅": 0, "卯": 0, "辰": 0,
  "巳": 1, "午": 1, "未": 1,
  "申": 2, "酉": 2, "戌": 2,
  "亥": 3, "子": 3, "丑": 3,
};

// Destructive cycle
const DESTROYS: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function getPillars(year: number, month: number, day: number) {
  const sy = lichunSajuYear(year, month, day);
  const sm = lichunSajuMonth(month, day);
  return {
    year:  getYearPillar(sy),
    month: getMonthPillar(sy, sm),
    day:   getDayPillar(year, month, day),
  };
}

function getElementCounts(year: number, month: number, day: number): Record<Element, number> {
  const p = getPillars(year, month, day);
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of [p.year, p.month, p.day]) {
    counts[pillar.element]++;
    const be = BRANCH_ELEMENT[pillar.earthlyBranch];
    if (be) counts[be]++;
  }
  return counts;
}

function getMissing(year: number, month: number, day: number): Element[] {
  const counts = getElementCounts(year, month, day);
  return (Object.keys(counts) as Element[]).filter(e => counts[e] === 0);
}

function getDominant(year: number, month: number, day: number): Element {
  const counts = getElementCounts(year, month, day);
  const elements: Element[] = ["wood", "fire", "earth", "metal", "water"];
  return elements.reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

function pairMatch(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// ── score bands ───────────────────────────────────────────────────────────────

const BANDS = [
  { min: 75,   percentage: 100, type: "Perfect Union", hook: "Rare. The charts rarely agree like this." },
  { min: 60,   percentage: 95,  type: "Soul Match",    hook: "You already knew, didn't you." },
  { min: 35,   percentage: 80,  type: "Deep Bond",     hook: "This kind of connection doesn't happen often." },
  { min: 10,   percentage: 60,  type: "Solid Pair",    hook: "You make each other better without trying." },
  { min: -15,  percentage: 40,  type: "Growth Pair",   hook: "Something is being built here. You just can't see it yet." },
  { min: -999, percentage: 20,  type: "Tension Pair",  hook: "You challenge each other in ways that feel personal." },
];

// ── public API ────────────────────────────────────────────────────────────────

export interface CompatResult {
  rawScore: number;
  percentage: number;
  type: string;
  hook: string;
}

export function getCompatibilityResult(dob1: string, dob2: string): CompatResult {
  const [y1, m1, d1] = dob1.split("-").map(Number);
  const [y2, m2, d2] = dob2.split("-").map(Number);

  const p1 = getPillars(y1, m1, d1);
  const p2 = getPillars(y2, m2, d2);

  let raw = 0;

  // Layer 1 — Day branch: 삼합 / 육합 / 충
  const db1 = p1.day.earthlyBranch;
  const db2 = p2.day.earthlyBranch;

  if (SAMHAP.some(g => g.includes(db1) && g.includes(db2))) raw += 30;
  if (pairMatch(YUKHAP, db1, db2)) raw += 20;
  if (pairMatch(CHUNG,  db1, db2)) raw -= 20;

  // Layer 2 — Missing elements
  const miss1 = getMissing(y1, m1, d1);
  const miss2 = getMissing(y2, m2, d2);
  const dom1  = getDominant(y1, m1, d1);
  const dom2  = getDominant(y2, m2, d2);

  const sharedMissing = miss1.filter(e => miss2.includes(e));
  const perfectComplement =
    miss1.length > 0 && miss2.length > 0 &&
    miss1.every(e => !miss2.includes(e)) &&
    miss2.every(e => !miss1.includes(e));
  const partialCover =
    (miss1.some(e => !miss2.includes(e))) ||
    (miss2.some(e => !miss1.includes(e)));

  if (sharedMissing.length > 0) {
    raw += 20;
  } else if (perfectComplement) {
    raw += 15;
  } else if (partialCover) {
    raw += 8;
  } else if (miss2.includes(DESTROYS[dom1]) || miss1.includes(DESTROYS[dom2])) {
    raw -= 10;
  }

  // Layer 3 — Month branch season
  const s1 = SEASON[p1.month.earthlyBranch];
  const s2 = SEASON[p2.month.earthlyBranch];
  if (s1 !== undefined && s2 !== undefined) {
    if (s1 === s2) {
      raw += 15;
    } else {
      const diff = Math.abs(s1 - s2);
      const circ = Math.min(diff, 4 - diff); // circular distance
      if (circ === 1) raw += 5;
      else if (circ === 2) raw -= 5;
    }
  }

  // Layer 4 — Day stem: 천간합
  if (pairMatch(CHUNGAN_HAP, p1.day.heavenlyStem, p2.day.heavenlyStem)) raw += 10;

  const band = BANDS.find(b => raw >= b.min)!;
  return { rawScore: raw, percentage: band.percentage, type: band.type, hook: band.hook };
}

export function compatDocId(email: string, dob1: string, dob2: string): string {
  const [a, b] = [dob1, dob2].sort();
  return `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${a}_${b}_compat`;
}
