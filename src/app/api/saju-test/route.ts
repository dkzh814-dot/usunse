import { NextResponse } from "next/server";

const ENDPOINT = "https://luckyloveme.com/api/saju-full-analysis";
const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "SajuBookClient/1.0",
  "X-SAJU-BOOK-API-KEY": "sb_test_sw88Dqo9FW0mT91hp9JSZ8-hwTh4YkSC",
};
const BASE_BODY = {
  birthYear: "1991",
  birthMonth: "8",
  birthDay: "14",
  birthHour: "10",
  birthMinute: "40",
  calendarType: "양력",
};

export async function GET() {
  const [maleRes, femaleRes] = await Promise.all([
    fetch(ENDPOINT, { method: "POST", headers: HEADERS, body: JSON.stringify({ ...BASE_BODY, gender: "male" }) }),
    fetch(ENDPOINT, { method: "POST", headers: HEADERS, body: JSON.stringify({ ...BASE_BODY, gender: "female" }) }),
  ]);

  const [male, female] = await Promise.all([
    maleRes.json().catch(() => ({ error: `HTTP ${maleRes.status}` })),
    femaleRes.json().catch(() => ({ error: `HTTP ${femaleRes.status}` })),
  ]);

  return NextResponse.json({ male, female, statusMale: maleRes.status, statusFemale: femaleRes.status });
}
