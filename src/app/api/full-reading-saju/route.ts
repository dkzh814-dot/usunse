import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { calculateFourPillars, countElements, lichunSajuYear, lichunSajuMonth } from "@/lib/saju";

// Build a rich saju data object from local calculation for Claude
function buildLocalSajuData(
  year: number, month: number, day: number, correctedHour: number | null
) {
  const pillars = calculateFourPillars(year, month, day, correctedHour ?? undefined);
  const counts = countElements(pillars);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const elements = ["wood", "fire", "earth", "metal", "water"] as const;
  const missing = elements.filter(e => counts[e] === 0);
  const dominant = elements.filter(e => counts[e] === Math.max(...elements.map(e2 => counts[e2])));

  const POLARITY: Record<string, string> = {
    "甲": "yang", "乙": "yin", "丙": "yang", "丁": "yin", "戊": "yang",
    "己": "yin", "庚": "yang", "辛": "yin", "壬": "yang", "癸": "yin",
    "子": "yang", "丑": "yin", "寅": "yang", "卯": "yin", "辰": "yang",
    "巳": "yin", "午": "yang", "未": "yin", "申": "yang", "酉": "yin",
    "戌": "yang", "亥": "yin",
  };

  const allChars = [
    pillars.year.heavenlyStem, pillars.year.earthlyBranch,
    pillars.month.heavenlyStem, pillars.month.earthlyBranch,
    pillars.day.heavenlyStem, pillars.day.earthlyBranch,
    ...(pillars.hour ? [pillars.hour.heavenlyStem, pillars.hour.earthlyBranch] : []),
  ];
  const yang = allChars.filter(c => POLARITY[c] === "yang").length;
  const yin = allChars.filter(c => POLARITY[c] === "yin").length;

  const sajuYear = lichunSajuYear(year, month, day);
  const sajuMonth = lichunSajuMonth(month, day);

  return {
    pillars: {
      year:  { stem: pillars.year.heavenlyStem,  branch: pillars.year.earthlyBranch,  element: pillars.year.element,  polarity: pillars.year.polarity },
      month: { stem: pillars.month.heavenlyStem, branch: pillars.month.earthlyBranch, element: pillars.month.element, polarity: pillars.month.polarity },
      day:   { stem: pillars.day.heavenlyStem,   branch: pillars.day.earthlyBranch,   element: pillars.day.element,   polarity: pillars.day.polarity },
      hour:  pillars.hour ? { stem: pillars.hour.heavenlyStem, branch: pillars.hour.earthlyBranch, element: pillars.hour.element, polarity: pillars.hour.polarity } : null,
    },
    sajuYear, sajuMonth,
    elements: { ...counts, total },
    polarity: { yang, yin },
    dayMaster: `${pillars.day.heavenlyStem} ${pillars.day.element} ${pillars.day.polarity}`,
    missing,
    dominant,
    birthData: { year, month, day, hour: correctedHour },
    source: "local",
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      email, name,
      birthYear, birthMonth, birthDay,
      birthHour, birthMinute,
      latitude, longitude,
    } = await req.json();

    if (!email || !birthYear || !birthMonth || !birthDay) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const dob = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

    // Check Firestore cache
    try {
      const cacheRef = doc(db, "users", email, "saju_cache", dob);
      const cached = await getDoc(cacheRef);
      if (cached.exists()) {
        const d = cached.data();
        return NextResponse.json({ cached: true, pillars: d.pillars, sajuData: d.sajuData, correctedHour: d.correctedHour });
      }
    } catch { /* proceed */ }

    // Solar time correction
    let correctedHour: number | null = (birthHour !== null && birthHour !== undefined) ? birthHour : null;

    if (correctedHour !== null && latitude !== undefined && longitude !== undefined) {
      try {
        // Get historical UTC offset via Google Timezone API
        const birthTimestamp = Math.floor(
          new Date(birthYear, birthMonth - 1, birthDay, birthHour, birthMinute ?? 0).getTime() / 1000
        );
        const tzUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${birthTimestamp}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const tzRes = await fetch(tzUrl);
        const tzData = await tzRes.json();

        if (tzData.status === "OK") {
          const utcOffsetMinutes = (tzData.rawOffset + tzData.dstOffset) / 60;
          // Convert local time → UTC → solar time
          const localMinutes = birthHour * 60 + (birthMinute ?? 0);
          const utcMinutes = localMinutes - utcOffsetMinutes;
          const solarMinutes = utcMinutes + longitude * 4;
          const normalized = ((solarMinutes % 1440) + 1440) % 1440;
          correctedHour = Math.floor(normalized / 60);
        }
      } catch { /* keep original hour */ }
    }

    // Call Woonsewiki API if configured
    let sajuData: Record<string, unknown> = {};
    const woonsewikiUrl = process.env.WOONSEWIKI_API_URL;
    if (woonsewikiUrl) {
      try {
        const res = await fetch(woonsewikiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WOONSEWIKI_API_KEY ?? ""}`,
          },
          body: JSON.stringify({ year: birthYear, month: birthMonth, day: birthDay, hour: correctedHour }),
        });
        if (res.ok) {
          const external = await res.json();
          const local = buildLocalSajuData(birthYear, birthMonth, birthDay, correctedHour);
          sajuData = { ...local, ...external, pillars: local.pillars, source: "woonsewiki" };
        }
      } catch { /* fall through to local */ }
    }

    if (Object.keys(sajuData).length === 0) {
      sajuData = buildLocalSajuData(birthYear, birthMonth, birthDay, correctedHour);
    }

    const pillars = (sajuData as { pillars: unknown }).pillars;

    // Save to Firestore cache
    try {
      const cacheRef = doc(db, "users", email, "saju_cache", dob);
      await setDoc(cacheRef, {
        email, name, dob, correctedHour,
        pillars, sajuData,
        createdAt: serverTimestamp(),
      });
    } catch { /* don't block */ }

    return NextResponse.json({ cached: false, pillars, sajuData, correctedHour });
  } catch (err) {
    console.error("Full reading saju error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
