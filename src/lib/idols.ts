import { FourPillars, calculateFourPillars, calculateCompatibility } from "./saju";

export interface Idol {
  id: string;
  name: string;
  group: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  emoji: string;
}

export const IDOLS: Idol[] = [
  { id: "bts-rm", name: "RM", group: "BTS", birthYear: 1994, birthMonth: 9, birthDay: 12, emoji: "🐨" },
  { id: "bts-jin", name: "Jin", group: "BTS", birthYear: 1992, birthMonth: 12, birthDay: 4, emoji: "🐹" },
  { id: "bts-suga", name: "Suga", group: "BTS", birthYear: 1993, birthMonth: 3, birthDay: 9, emoji: "🐱" },
  { id: "bts-jhope", name: "J-Hope", group: "BTS", birthYear: 1994, birthMonth: 2, birthDay: 18, emoji: "🐿️" },
  { id: "bts-jimin", name: "Jimin", group: "BTS", birthYear: 1995, birthMonth: 10, birthDay: 13, emoji: "🐥" },
  { id: "bts-v", name: "V", group: "BTS", birthYear: 1995, birthMonth: 12, birthDay: 30, emoji: "🐯" },
  { id: "bts-jungkook", name: "Jungkook", group: "BTS", birthYear: 1997, birthMonth: 9, birthDay: 1, emoji: "🐰" },
  { id: "bp-jennie", name: "Jennie", group: "BLACKPINK", birthYear: 1996, birthMonth: 1, birthDay: 16, emoji: "🐈" },
  { id: "bp-jisoo", name: "Jisoo", group: "BLACKPINK", birthYear: 1995, birthMonth: 1, birthDay: 3, emoji: "🦋" },
  { id: "bp-rose", name: "Rosé", group: "BLACKPINK", birthYear: 1997, birthMonth: 2, birthDay: 11, emoji: "🌹" },
  { id: "bp-lisa", name: "Lisa", group: "BLACKPINK", birthYear: 1997, birthMonth: 3, birthDay: 27, emoji: "🐺" },
  { id: "txt-yeonjun", name: "Yeonjun", group: "TXT", birthYear: 1999, birthMonth: 9, birthDay: 13, emoji: "🌙" },
  { id: "txt-soobin", name: "Soobin", group: "TXT", birthYear: 2000, birthMonth: 12, birthDay: 5, emoji: "🐰" },
  { id: "txt-beomgyu", name: "Beomgyu", group: "TXT", birthYear: 2001, birthMonth: 3, birthDay: 13, emoji: "🎸" },
  { id: "txt-taehyun", name: "Taehyun", group: "TXT", birthYear: 2002, birthMonth: 2, birthDay: 5, emoji: "🦁" },
  { id: "txt-huningkai", name: "Huningkai", group: "TXT", birthYear: 2002, birthMonth: 8, birthDay: 14, emoji: "🌸" },
  { id: "aespa-karina", name: "Karina", group: "aespa", birthYear: 2000, birthMonth: 4, birthDay: 11, emoji: "🤍" },
  { id: "aespa-giselle", name: "Giselle", group: "aespa", birthYear: 2000, birthMonth: 10, birthDay: 30, emoji: "🖤" },
  { id: "aespa-winter", name: "Winter", group: "aespa", birthYear: 2001, birthMonth: 1, birthDay: 1, emoji: "❄️" },
  { id: "aespa-ningning", name: "Ningning", group: "aespa", birthYear: 2002, birthMonth: 10, birthDay: 23, emoji: "✨" },
  { id: "nct-taeyong", name: "Taeyong", group: "NCT", birthYear: 1995, birthMonth: 7, birthDay: 1, emoji: "🌊" },
  { id: "nct-jaehyun", name: "Jaehyun", group: "NCT", birthYear: 1997, birthMonth: 2, birthDay: 14, emoji: "💚" },
  { id: "ive-wonyoung", name: "Wonyoung", group: "IVE", birthYear: 2004, birthMonth: 8, birthDay: 31, emoji: "🌺" },
  { id: "ive-yujin", name: "Yujin", group: "IVE", birthYear: 2003, birthMonth: 9, birthDay: 1, emoji: "🎀" },
  { id: "stray-kids-bang-chan", name: "Bang Chan", group: "Stray Kids", birthYear: 1997, birthMonth: 10, birthDay: 3, emoji: "🐺" },
  { id: "stray-kids-hyunjin", name: "Hyunjin", group: "Stray Kids", birthYear: 2000, birthMonth: 3, birthDay: 20, emoji: "🎨" },
  { id: "twice-nayeon", name: "Nayeon", group: "TWICE", birthYear: 1995, birthMonth: 9, birthDay: 22, emoji: "🐰" },
  { id: "twice-tzuyu", name: "Tzuyu", group: "TWICE", birthYear: 1999, birthMonth: 6, birthDay: 14, emoji: "🌸" },
  { id: "enhypen-jay", name: "Jay", group: "ENHYPEN", birthYear: 2002, birthMonth: 4, birthDay: 20, emoji: "🌟" },
  { id: "enhypen-ni-ki", name: "Ni-ki", group: "ENHYPEN", birthYear: 2005, birthMonth: 12, birthDay: 9, emoji: "🎭" },
];

export interface IdolMatch {
  idol: Idol;
  score: number;
  userPillars: FourPillars;
  idolPillars: FourPillars;
}

export function findBestMatch(
  year: number,
  month: number,
  day: number,
  hour?: number
): IdolMatch {
  const userPillars = calculateFourPillars(year, month, day, hour);

  let best: IdolMatch | null = null;

  for (const idol of IDOLS) {
    const idolPillars = calculateFourPillars(
      idol.birthYear,
      idol.birthMonth,
      idol.birthDay,
      idol.birthHour
    );
    const score = calculateCompatibility(userPillars, idolPillars);

    if (!best || score > best.score) {
      best = { idol, score, userPillars, idolPillars };
    }
  }

  return best!;
}

// Deterministic match for a given user — always returns same idol for same birth data
export function getIdolMatch(
  year: number,
  month: number,
  day: number,
  hour?: number
): IdolMatch {
  return findBestMatch(year, month, day, hour);
}
