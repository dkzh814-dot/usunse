// Saju (Four Pillars of Destiny) calculation engine
// Based on traditional Korean/Chinese astrology

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type Polarity = "yang" | "yin";

export interface Pillar {
  heavenlyStem: string; // 天干 Heavenly Stem (Chinese character)
  earthlyBranch: string; // 地支 Earthly Branch (Chinese character)
  element: Element;
  polarity: Polarity;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface ElementCount {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

// Heavenly Stems 天干
const HEAVENLY_STEMS = [
  { char: "甲", element: "wood" as Element, polarity: "yang" as Polarity },
  { char: "乙", element: "wood" as Element, polarity: "yin" as Polarity },
  { char: "丙", element: "fire" as Element, polarity: "yang" as Polarity },
  { char: "丁", element: "fire" as Element, polarity: "yin" as Polarity },
  { char: "戊", element: "earth" as Element, polarity: "yang" as Polarity },
  { char: "己", element: "earth" as Element, polarity: "yin" as Polarity },
  { char: "庚", element: "metal" as Element, polarity: "yang" as Polarity },
  { char: "辛", element: "metal" as Element, polarity: "yin" as Polarity },
  { char: "壬", element: "water" as Element, polarity: "yang" as Polarity },
  { char: "癸", element: "water" as Element, polarity: "yin" as Polarity },
];

// Earthly Branches 地支
const EARTHLY_BRANCHES = [
  { char: "子", element: "water" as Element, polarity: "yang" as Polarity }, // Rat
  { char: "丑", element: "earth" as Element, polarity: "yin" as Polarity },  // Ox
  { char: "寅", element: "wood" as Element, polarity: "yang" as Polarity },  // Tiger
  { char: "卯", element: "wood" as Element, polarity: "yin" as Polarity },   // Rabbit
  { char: "辰", element: "earth" as Element, polarity: "yang" as Polarity }, // Dragon
  { char: "巳", element: "fire" as Element, polarity: "yin" as Polarity },   // Snake
  { char: "午", element: "fire" as Element, polarity: "yang" as Polarity },  // Horse
  { char: "未", element: "earth" as Element, polarity: "yin" as Polarity },  // Goat
  { char: "申", element: "metal" as Element, polarity: "yang" as Polarity }, // Monkey
  { char: "酉", element: "metal" as Element, polarity: "yin" as Polarity },  // Rooster
  { char: "戌", element: "earth" as Element, polarity: "yang" as Polarity }, // Dog
  { char: "亥", element: "water" as Element, polarity: "yin" as Polarity },  // Pig
];

// Month branch starts from Tiger (寅) at index 2
const MONTH_BRANCH_OFFSET = 2;

// Reference epoch: Jan 1, 1900 was Gengzi year (庚子), stem index 6, branch index 0
const EPOCH_YEAR = 1900;
const EPOCH_STEM = 6; // 庚
const EPOCH_BRANCH = 0; // 子 - actually 庚子 = stem 6 (庚), branch 0 (子)

export function getYearPillar(year: number): Pillar {
  const offset = year - EPOCH_YEAR;
  const stemIdx = (EPOCH_STEM + offset) % 10;
  const branchIdx = (EPOCH_BRANCH + offset) % 12;
  const stem = HEAVENLY_STEMS[(stemIdx + 10) % 10];
  const branch = EARTHLY_BRANCHES[(branchIdx + 12) % 12];
  return {
    heavenlyStem: stem.char,
    earthlyBranch: branch.char,
    element: stem.element,
    polarity: stem.polarity,
  };
}

export function getMonthPillar(year: number, month: number): Pillar {
  // Month pillar stem depends on year stem (grouped in 5: 甲/己, 乙/庚, 丙/辛, 丁/壬, 戊/癸)
  const yearStemIdx = (EPOCH_STEM + (year - EPOCH_YEAR)) % 10;
  const monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10;
  // Saju month index: 寅月 (Feb) = 0, 卯月 (Mar) = 1, ... 丑月 (Jan) = 11
  const sajaMonthIdx = (month - 2 + 12) % 12;
  const monthStemIdx = (monthStemBase + sajaMonthIdx) % 10;
  const monthBranchIdx = (MONTH_BRANCH_OFFSET + sajaMonthIdx) % 12;
  const stem = HEAVENLY_STEMS[monthStemIdx];
  const branch = EARTHLY_BRANCHES[monthBranchIdx];
  return {
    heavenlyStem: stem.char,
    earthlyBranch: branch.char,
    element: stem.element,
    polarity: stem.polarity,
  };
}

// Day pillar calculation using modified Julian Day Number
export function getDayPillar(year: number, month: number, day: number): Pillar {
  // Calculate Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Reference: JDN 2415021 = Jan 1, 1900 = 甲戌 (stem 0, branch 10)
  const REF_JDN = 2415021;
  const REF_STEM = 0;  // 甲
  const REF_BRANCH = 10; // 戌

  const diff = jdn - REF_JDN;
  const stemIdx = ((REF_STEM + diff) % 10 + 10) % 10;
  const branchIdx = ((REF_BRANCH + diff) % 12 + 12) % 12;

  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[branchIdx];
  return {
    heavenlyStem: stem.char,
    earthlyBranch: branch.char,
    element: stem.element,
    polarity: stem.polarity,
  };
}

// Hour pillar: each 2-hour block = one branch
export function getHourPillar(
  year: number,
  month: number,
  day: number,
  hour: number
): Pillar {
  // Korean standard 30-min offset: 자시 = 23:30–01:29
  // Hours 0 and 1 (00:00–01:29) still belong to 자시, so normalize them to 23
  const h = hour < 2 ? 23 : hour;
  const hourBranchIdx = Math.floor((h + 1) / 2) % 12;
  const dayPillar = getDayPillar(year, month, day);
  const dayStemIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.char === dayPillar.heavenlyStem
  );
  // Hour stem base depends on day stem (grouped in 5: 甲/己→甲, 乙/庚→丙, 丙/辛→戊, 丁/壬→庚, 戊/癸→壬)
  const hourStemBase = (dayStemIdx % 5) * 2;
  const hourStemIdx = (hourStemBase + hourBranchIdx) % 10;

  const stem = HEAVENLY_STEMS[hourStemIdx];
  const branch = EARTHLY_BRANCHES[hourBranchIdx];
  return {
    heavenlyStem: stem.char,
    earthlyBranch: branch.char,
    element: stem.element,
    polarity: stem.polarity,
  };
}

export function calculateFourPillars(
  year: number,
  month: number,
  day: number,
  hour?: number
): FourPillars {
  return {
    year: getYearPillar(year),
    month: getMonthPillar(year, month),
    day: getDayPillar(year, month, day),
    hour: hour !== undefined ? getHourPillar(year, month, day, hour) : null,
  };
}

export function countElements(pillars: FourPillars): ElementCount {
  const counts: ElementCount = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const activePillars = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) activePillars.push(pillars.hour);

  for (const pillar of activePillars) {
    counts[pillar.element]++;
    // Also count branch element
    const branch = EARTHLY_BRANCHES.find(
      (b) => b.char === pillar.earthlyBranch
    );
    if (branch) counts[branch.element]++;
  }

  return counts;
}

// Calculate compatibility score (0-100) between two sets of pillars
export function calculateCompatibility(
  a: FourPillars,
  b: FourPillars
): number {
  const aElements = countElements(a);
  const bElements = countElements(b);

  let score = 50; // baseline

  // Element harmony rules (generating cycle: wood→fire→earth→metal→water→wood)
  const GENERATES: Record<Element, Element> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };

  // Controlling cycle (wood→earth, earth→water, water→fire, fire→metal, metal→wood)
  const CONTROLS: Record<Element, Element> = {
    wood: "earth",
    earth: "water",
    water: "fire",
    fire: "metal",
    metal: "wood",
  };

  const elements: Element[] = ["wood", "fire", "earth", "metal", "water"];

  // Check if A's dominant element generates or controls B's dominant
  const aDominant = elements.reduce((a, b) =>
    aElements[a] >= aElements[b] ? a : b
  );
  const bDominant = elements.reduce((a, b) =>
    bElements[a] >= bElements[b] ? a : b
  );

  if (GENERATES[aDominant] === bDominant || GENERATES[bDominant] === aDominant) {
    score += 20;
  }
  if (CONTROLS[aDominant] === bDominant || CONTROLS[bDominant] === aDominant) {
    score -= 10;
  }

  // Day master harmony
  const aDayElement = a.day.element;
  const bDayElement = b.day.element;
  if (aDayElement === bDayElement) score += 15;
  if (GENERATES[aDayElement] === bDayElement || GENERATES[bDayElement] === aDayElement) score += 10;

  // Polarity complement (yang+yin = harmony)
  if (a.day.polarity !== b.day.polarity) score += 10;

  // Same year branch = strong bond
  if (a.year.earthlyBranch === b.year.earthlyBranch) score += 5;

  return Math.min(99, Math.max(40, score));
}
