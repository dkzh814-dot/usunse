"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

// ── constants ─────────────────────────────────────────────────────────────────

const STEM_COLOR: Record<string, string> = {
  "甲": "#4CAF50", "乙": "#4CAF50",
  "丙": "#D85A30", "丁": "#D85A30",
  "戊": "#BA7517", "己": "#BA7517",
  "庚": "#888780", "辛": "#888780",
  "壬": "#378ADD", "癸": "#378ADD",
};

const BRANCH_COLOR: Record<string, string> = {
  "子": "#378ADD", "亥": "#378ADD",
  "寅": "#4CAF50", "卯": "#4CAF50",
  "巳": "#D85A30", "午": "#D85A30",
  "丑": "#BA7517", "辰": "#BA7517", "未": "#BA7517", "戌": "#BA7517",
  "申": "#888780", "酉": "#888780",
};

const POLARITY_MAP: Record<string, string> = {
  "甲": "yang", "乙": "yin", "丙": "yang", "丁": "yin", "戊": "yang",
  "己": "yin", "庚": "yang", "辛": "yin", "壬": "yang", "癸": "yin",
  "子": "yang", "丑": "yin", "寅": "yang", "卯": "yin", "辰": "yang",
  "巳": "yin", "午": "yang", "未": "yin", "申": "yang", "酉": "yin",
  "戌": "yang", "亥": "yin",
};

const EL_META: Record<string, { kr: string; en: string; color: string }> = {
  wood:  { kr: "나무", en: "Wood",  color: "#4CAF50" },
  fire:  { kr: "불",  en: "Fire",  color: "#D85A30" },
  earth: { kr: "흙",  en: "Earth", color: "#BA7517" },
  metal: { kr: "금",  en: "Metal", color: "#888780" },
  water: { kr: "물",  en: "Water", color: "#378ADD" },
};

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

const CARD_META = [
  { title: "사주원국 Your Chart",     subtitle: "",                  bg: "bg-transparent" },
  { title: "Who You Are",             subtitle: "나는 어떤 사람인가",  bg: "bg-purple-950/20" },
  { title: "Love",                    subtitle: "사랑과 관계",        bg: "bg-pink-950/20" },
  { title: "Work & Talent",           subtitle: "일과 재능",          bg: "bg-blue-950/20" },
  { title: "Money",                   subtitle: "돈과 재물",          bg: "bg-emerald-950/20" },
  { title: "How You Thrive",          subtitle: "내가 빛나는 조건",    bg: "bg-amber-950/20" },
];

// ── types ─────────────────────────────────────────────────────────────────────

interface PillarData {
  stem: string;
  branch: string;
  element: string;
  polarity: string;
}

interface Pillars {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData | null;
}

interface Reading {
  name: string;
  email: string;
  gender: "male" | "female";
  dob: string;
  pillars: Pillars;
  sajuJson: string;
}

type CardStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; text: string }
  | { state: "error" };

// ── google places types ────────────────────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (el: HTMLInputElement, opts: object) => {
            addListener: (event: string, cb: () => void) => void;
            getPlace: () => {
              geometry?: { location?: { lat: () => number; lng: () => number } };
              formatted_address?: string;
            };
          };
        };
      };
    };
    mapsReady?: boolean;
    onMapsLoad?: () => void;
  }
}

// ── dob helpers ───────────────────────────────────────────────────────────────

function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

function dobToIso(dob: string): { year: number; month: number; day: number } | null {
  const parts = dob.split(" / ");
  if (parts.length !== 3 || parts.some(p => p === "")) return null;
  const [m, d, y] = parts.map(Number);
  if (!y || y < 1920 || y > new Date().getFullYear() - 5) return null;
  if (!m || m < 1 || m > 12) return null;
  if (!d || d < 1 || d > 31) return null;
  return { year: y, month: m, day: d };
}

function to24h(hour: string, minute: string, ampm: "AM" | "PM"): { h: number; m: number } | null {
  const h = parseInt(hour);
  const m = parseInt(minute || "0");
  if (isNaN(h) || h < 1 || h > 12) return null;
  if (isNaN(m) || m < 0 || m > 59) return null;
  let h24 = h;
  if (ampm === "AM" && h === 12) h24 = 0;
  if (ampm === "PM" && h !== 12) h24 = h + 12;
  return { h: h24, m };
}

// ── form screen ───────────────────────────────────────────────────────────────

function FormScreen({ onSubmit }: { onSubmit: (data: {
  name: string; email: string; gender: "male" | "female";
  birthYear: number; birthMonth: number; birthDay: number;
  birthHour: number | null; birthMinute: number | null;
  birthCity: string; latitude: number | null; longitude: number | null;
}) => void }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [dob, setDob]         = useState("");
  const [gender, setGender]   = useState<"male" | "female" | "">("");
  const [timeHour, setTimeHour]     = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [timeAmPm, setTimeAmPm]     = useState<"AM" | "PM" | "">("");
  const [city, setCity]       = useState("");
  const [lat, setLat]         = useState<number | null>(null);
  const [lng, setLng]         = useState<number | null>(null);
  const [error, setError]     = useState("");
  const [confirming, setConfirming] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acRef = useRef<any>(null);

  // only auto-fill name
  useEffect(() => {
    const n = localStorage.getItem("usunse_name") || "";
    if (n) setName(n);
  }, []);

  const initAutocomplete = useCallback(() => {
    if (!cityRef.current || !window.google) return;
    const ac = new window.google.maps.places.Autocomplete(cityRef.current, { types: ["(cities)"] });
    acRef.current = ac;
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        setLat(place.geometry.location.lat());
        setLng(place.geometry.location.lng());
        setCity(place.formatted_address || cityRef.current?.value || "");
      }
    });
  }, []);

  useEffect(() => {
    if (window.mapsReady) initAutocomplete();
    window.onMapsLoad = initAutocomplete;
    return () => { window.onMapsLoad = undefined; };
  }, [initAutocomplete]);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Enter your name."); return; }
    const parsed = dobToIso(dob);
    if (!parsed) { setError("Enter a valid date of birth (MM / DD / YYYY)."); return; }
    if (!gender)  { setError("Please select male or female."); return; }
    if (!city.trim() || !lat || !lng) { setError("Please select a birth city from the dropdown."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email."); return; }
    if (timeHour || timeAmPm) {
      if (!timeAmPm) { setError("Select AM or PM for your birth time."); return; }
      const t = to24h(timeHour, timeMinute, timeAmPm as "AM" | "PM");
      if (!t) { setError("Enter a valid birth time (hour 1–12, minute 00–59)."); return; }
    }
    setConfirming(true);
  }

  function handleConfirm() {
    const parsed = dobToIso(dob)!;
    let birthHour: number | null = null;
    let birthMinute: number | null = null;
    if (timeHour && timeAmPm) {
      const t = to24h(timeHour, timeMinute, timeAmPm as "AM" | "PM");
      if (t) { birthHour = t.h; birthMinute = t.m; }
    }
    localStorage.setItem("usunse_name", name.trim());
    onSubmit({
      name: name.trim(), email: email.trim(),
      gender: gender as "male" | "female",
      birthYear: parsed.year, birthMonth: parsed.month, birthDay: parsed.day,
      birthHour, birthMinute,
      birthCity: city, latitude: lat, longitude: lng,
    });
  }

  // ── confirmation screen ────────────────────────────────────────────────────

  if (confirming) {
    const parsed = dobToIso(dob)!;
    const dobDisplay = `${String(parsed.month).padStart(2, "0")}/${String(parsed.day).padStart(2, "0")}/${parsed.year}`;
    let timeDisplay = "Not entered";
    if (timeHour && timeAmPm) {
      const min = timeMinute ? timeMinute.padStart(2, "0") : "00";
      timeDisplay = `${timeHour}:${min} ${timeAmPm}`;
    }
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-8">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted/60">Full Destiny Reading</p>
            <h2 className="text-xl font-display font-bold text-text">Does this look right?</h2>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-5 flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted/60">Name</span>
              <span className="text-text font-medium">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted/60">Date of Birth</span>
              <span className="text-text font-medium">{dobDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted/60">Gender</span>
              <span className="text-text font-medium capitalize">{gender}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted/60">Birth Time</span>
              <span className={`font-medium ${timeDisplay === "Not entered" ? "text-muted/40" : "text-text"}`}>{timeDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted/60">Birth City</span>
              <span className="text-text font-medium text-right max-w-[180px] leading-snug">{city}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
                bg-gradient-to-r from-accent to-accent-2 text-white
                hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20">
              Yes, this is correct →
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="w-full py-3 rounded-xl text-sm text-muted hover:text-text border border-border hover:border-white/20 transition-all">
              ← Edit
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── form ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=onMapsLoad`}
        strategy="afterInteractive"
        onLoad={() => { window.mapsReady = true; initAutocomplete(); }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-8">
        <a href="/" className="text-muted hover:text-text transition-colors text-sm self-start">← Back</a>

        <div className="text-center space-y-2">
          <div className="flex flex-col items-center leading-none gap-0.5 mb-4">
            <span className="text-lg font-bold gradient-text">US</span>
            <span className="text-base font-bold gradient-text">NE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text leading-tight">Full Destiny Reading</h1>
          <p className="text-sm text-muted leading-relaxed">
            Your complete chart — who you are, love, career, money, and what makes you thrive.
          </p>
        </div>

        <form onSubmit={handleNext} className="w-full space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name" autoComplete="off"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Date of Birth</label>
            <input
              type="text" inputMode="numeric" value={dob} maxLength={14}
              onChange={e => setDob(formatDob(e.target.value))}
              placeholder="MM / DD / YYYY"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Which best describes you?</label>
            <div className="flex gap-3">
              {(["male", "female"] as const).map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    gender === g
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-muted hover:border-white/20"
                  }`}>
                  {g === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Birth Time */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">
              Birth Time <span className="text-muted/60 normal-case">(optional)</span>
            </label>
            <p className="text-xs text-muted/50 mb-2">Adding your birth time gives you a more accurate reading.</p>
            <div className="flex gap-2">
              <div className="flex gap-1 flex-1">
                <input
                  type="text" inputMode="numeric" value={timeHour} maxLength={2}
                  onChange={e => setTimeHour(e.target.value.replace(/\D/g, ""))}
                  placeholder="HH"
                  className="w-14 bg-surface border border-border rounded-xl px-3 py-3 text-text text-center placeholder-muted focus:outline-none focus:border-accent transition-colors" />
                <span className="text-muted self-center">:</span>
                <input
                  type="text" inputMode="numeric" value={timeMinute} maxLength={2}
                  onChange={e => setTimeMinute(e.target.value.replace(/\D/g, ""))}
                  placeholder="MM"
                  className="w-14 bg-surface border border-border rounded-xl px-3 py-3 text-text text-center placeholder-muted focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex gap-1">
                {(["AM", "PM"] as const).map(ap => (
                  <button key={ap} type="button" onClick={() => setTimeAmPm(ap)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      timeAmPm === ap
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted hover:border-white/20"
                    }`}>
                    {ap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Birth City */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Birth City</label>
            <input
              ref={cityRef} type="text" value={city}
              onChange={e => { setCity(e.target.value); setLat(null); setLng(null); }}
              placeholder="Search city…" autoComplete="off"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            <p className="text-xs text-muted/50 mt-1.5">Used for solar time correction based on longitude.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            <p className="text-xs text-muted/50 mt-1.5">Your reading will be saved to this email.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit"
            className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20">
            Next →
          </button>

          <p className="text-center text-xs text-muted">$10 · One-time · Full 6-card reading</p>
        </form>
      </div>
    </main>
  );
}

// ── loading screen ─────────────────────────────────────────────────────────────

function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="flex flex-col items-center leading-none gap-0">
        <span className="text-sm font-bold gradient-text animate-pulse">US</span>
        <span className="text-xs font-bold gradient-text animate-pulse">NE</span>
      </div>
      <p className="text-sm text-muted animate-pulse">{message ?? "Reading your chart…"}</p>
    </div>
  );
}

// ── card 1: your chart ─────────────────────────────────────────────────────────

function computeChartStats(pillars: Pillars) {
  const cols = [pillars.year, pillars.month, pillars.day, ...(pillars.hour ? [pillars.hour] : [])];
  const chars = cols.flatMap(p => [p.stem, p.branch]);
  const yang = chars.filter(c => POLARITY_MAP[c] === "yang").length;
  const yin  = chars.filter(c => POLARITY_MAP[c] === "yin").length;

  const BRANCH_ELEMENT: Record<string, string> = {
    "子": "water", "亥": "water", "寅": "wood", "卯": "wood",
    "巳": "fire",  "午": "fire",  "丑": "earth","辰": "earth", "未": "earth", "戌": "earth",
    "申": "metal", "酉": "metal",
  };
  const STEM_ELEMENT: Record<string, string> = {
    "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth",
    "己": "earth","庚": "metal","辛": "metal","壬": "water","癸": "water",
  };

  const counts: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of cols) {
    counts[STEM_ELEMENT[p.stem]]++;
    const be = BRANCH_ELEMENT[p.branch];
    if (be) counts[be]++;
  }
  return { yang, yin, counts };
}

function ChartCard({ pillars, name }: { pillars: Pillars; name: string }) {
  const { yang, yin, counts } = computeChartStats(pillars);
  const total = yang + yin;
  const elTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const cols = [
    { label: "시 Hour",  pillar: pillars.hour,  isMe: false },
    { label: "일 Day",   pillar: pillars.day,   isMe: true  },
    { label: "월 Month", pillar: pillars.month, isMe: false },
    { label: "년 Year",  pillar: pillars.year,  isMe: false },
  ];

  return (
    <div className="px-4 py-8 space-y-8">
      <div className="text-center">
        <h2 className="text-sm font-semibold gradient-text uppercase tracking-widest">사주원국 Your Chart</h2>
        <p className="text-xs text-muted/60 mt-1">{name}</p>
      </div>

      {/* Four pillars grid */}
      <div className="flex gap-2 justify-center">
        {cols.map(({ label, pillar, isMe }) => (
          <div key={label} className="relative flex flex-col items-center bg-surface border border-border rounded-xl px-3 py-4 min-w-[70px] flex-1 max-w-[80px]">
            {isMe && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                나 Me
              </span>
            )}
            <span className="text-[10px] text-muted/60 mb-3 leading-none">{label}</span>
            {pillar ? (
              <>
                <span className="text-3xl font-bold leading-none" style={{ color: STEM_COLOR[pillar.stem] ?? "#e2e8f0" }}>
                  {pillar.stem}
                </span>
                <span className="text-3xl font-bold leading-none mt-2" style={{ color: BRANCH_COLOR[pillar.branch] ?? "#e2e8f0" }}>
                  {pillar.branch}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold leading-none text-white/10">—</span>
                <span className="text-3xl font-bold leading-none mt-2 text-white/10">—</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Yin-Yang bar */}
      <div className="space-y-3">
        <p className="text-xs text-muted/60 uppercase tracking-widest text-center">음양 Yin &amp; Yang</p>
        <div className="h-5 rounded-full overflow-hidden flex">
          <div
            className="flex items-center justify-end pr-2 transition-all duration-700"
            style={{ width: `${(yang / total) * 100}%`, background: "#D85A30" }}
          >
            {yang > 0 && <span className="text-[10px] text-white font-bold">陽</span>}
          </div>
          <div
            className="flex items-center pl-2 transition-all duration-700"
            style={{ width: `${(yin / total) * 100}%`, background: "#3D4F60" }}
          >
            {yin > 0 && <span className="text-[10px] text-white font-bold">陰</span>}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted/60">
          <span>양 Yang · {yang} · {Math.round((yang / total) * 100)}%</span>
          <span>{Math.round((yin / total) * 100)}% · {yin} · 음 Yin</span>
        </div>
      </div>

      {/* Five elements */}
      <div className="space-y-3">
        <p className="text-xs text-muted/60 uppercase tracking-widest text-center">오행 분포 Five Elements</p>
        <div className="space-y-2">
          {ELEMENTS.map(el => {
            const meta  = EL_META[el];
            const count = counts[el] ?? 0;
            const pct   = elTotal > 0 ? (count / elTotal) * 100 : 0;
            return (
              <div key={el} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                <span className="text-xs text-muted/80 w-14 flex-shrink-0">{meta.kr} {meta.en}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
                </div>
                <span className="text-xs text-muted/60 w-4 text-right flex-shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── claude card ────────────────────────────────────────────────────────────────

function ClaudeCard({ cardIndex, status }: { cardIndex: number; status: CardStatus }) {
  const meta = CARD_META[cardIndex];

  return (
    <div className={`px-4 py-8 space-y-6 ${meta.bg}`}>
      <div className="text-center">
        <h2 className="text-lg font-display font-bold text-text">{meta.title}</h2>
        {meta.subtitle && <p className="text-xs text-muted/60 mt-1">{meta.subtitle}</p>}
      </div>

      {status.state === "loading" && (
        <div className="space-y-3 mt-4">
          {[1, 0.9, 0.8, 1, 0.85, 0.7, 0.95, 0.75].map((w, i) => (
            <div key={i} className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      )}

      {status.state === "idle" && (
        <p className="text-xs text-muted/50 text-center animate-pulse">Preparing your reading…</p>
      )}

      {status.state === "error" && (
        <p className="text-xs text-red-400/70 text-center">Reading failed to load. Check back soon.</p>
      )}

      {status.state === "done" && (
        <div className="space-y-4">
          {status.text.split(/\n\n+/).filter(Boolean).map((para, i) => (
            <p key={i} className="text-sm text-text/80 leading-relaxed">{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── card deck ──────────────────────────────────────────────────────────────────

function CardDeck({ reading, onEmailSave }: {
  reading: Reading;
  onEmailSave: () => void;
}) {
  const [activeCard, setActiveCard]   = useState(0);
  const [statuses, setStatuses]       = useState<CardStatus[]>(
    Array.from({ length: 6 }, () => ({ state: "idle" as const }))
  );
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone]       = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<Set<number>>(new Set());

  const loadCard = useCallback(async (index: number) => {
    if (index < 1 || index > 5) return;
    if (loadedRef.current.has(index)) return;
    loadedRef.current.add(index);

    setStatuses(prev => {
      const next = [...prev];
      next[index] = { state: "loading" };
      return next;
    });
    try {
      const res = await fetch("/api/full-reading-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIndex: index, name: reading.name, sajuJson: reading.sajuJson }),
      });
      if (!res.ok) throw new Error("Failed");
      const { text } = await res.json();
      setStatuses(prev => {
        const next = [...prev];
        next[index] = { state: "done", text };
        return next;
      });
    } catch {
      setStatuses(prev => {
        const next = [...prev];
        next[index] = { state: "error" };
        return next;
      });
    }
  }, [reading.name, reading.sajuJson]);

  // Cards 2–6 will be wired in the next phase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void loadCard;

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const newCard = Math.round(el.scrollLeft / el.clientWidth);
    if (newCard !== activeCard) setActiveCard(newCard);
  }

  function scrollTo(index: number) {
    deckRef.current?.scrollTo({ left: index * (deckRef.current.clientWidth), behavior: "smooth" });
  }

  async function handleEmailSave() {
    setEmailSending(true);
    const cards = statuses.map(s => (s.state === "done" ? s.text : null));
    try {
      await fetch("/api/full-reading-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reading.email, name: reading.name, cards }),
      });
    } catch { /* best-effort */ }
    setEmailSending(false);
    setEmailDone(true);
    onEmailSave();
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-6 pb-2 relative z-10 flex-shrink-0">
        <div className="flex flex-col items-center leading-none gap-0">
          <span className="text-sm font-bold gradient-text">US</span>
          <span className="text-xs font-bold gradient-text">NE</span>
        </div>
        <p className="text-xs text-muted/60">{reading.name} · {reading.dob}</p>
        <span className="text-xs text-muted/40">{activeCard + 1} / 6</span>
      </div>

      {/* Swipeable deck */}
      <div
        ref={deckRef}
        className="flex-1 flex overflow-x-auto relative z-10"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
        onScroll={handleScroll}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{ scrollSnapAlign: "start", flexShrink: 0, width: "100%", overflowY: "auto" }}
          >
            {i === 0
              ? <ChartCard pillars={reading.pillars} name={reading.name} />
              : <ClaudeCard cardIndex={i} status={statuses[i]} />
            }

            {/* Email save button on last card */}
            {i === 5 && (
              <div className="px-4 pb-8 mt-4">
                <button
                  onClick={handleEmailSave}
                  disabled={emailSending || emailDone}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold border border-white/10 text-muted/80 hover:border-white/20 hover:text-text transition-all disabled:opacity-50"
                >
                  {emailDone ? "✓ Saved to your email" : emailSending ? "Sending…" : "📩 내 이메일로 저장하기  Save to my email"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 py-4 flex-shrink-0 relative z-10">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeCard
                ? "w-6 h-2 bg-accent"
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── main content ───────────────────────────────────────────────────────────────

function FullReadingContent() {
  const [step, setStep]       = useState<"form" | "loading" | "reading">("form");
  const [reading, setReading] = useState<Reading | null>(null);
  const [loadMsg, setLoadMsg] = useState("Reading your chart…");

  async function handleFormSubmit(data: {
    name: string; email: string; gender: "male" | "female";
    birthYear: number; birthMonth: number; birthDay: number;
    birthHour: number | null; birthMinute: number | null;
    birthCity: string; latitude: number | null; longitude: number | null;
  }) {
    setStep("loading");
    setLoadMsg("Calculating your chart…");

    try {
      const res = await fetch("/api/full-reading-saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:      data.email,
          name:       data.name,
          gender:     data.gender,
          birthYear:  data.birthYear,
          birthMonth: data.birthMonth,
          birthDay:   data.birthDay,
          birthHour:  data.birthHour,
          birthMinute: data.birthMinute,
          latitude:   data.latitude,
          longitude:  data.longitude,
        }),
      });

      if (!res.ok) throw new Error("Saju API failed");
      const { pillars, sajuData } = await res.json();

      const dob = `${data.birthYear}-${String(data.birthMonth).padStart(2, "0")}-${String(data.birthDay).padStart(2, "0")}`;

      setReading({
        name:     data.name,
        email:    data.email,
        gender:   data.gender,
        dob,
        pillars,
        sajuJson: JSON.stringify(sajuData),
      });
      setStep("reading");
      window.scrollTo(0, 0);
    } catch {
      setLoadMsg("Something went wrong. Please try again.");
      setTimeout(() => setStep("form"), 2000);
    }
  }

  if (step === "form")    return <FormScreen onSubmit={handleFormSubmit} />;
  if (step === "loading") return <LoadingScreen message={loadMsg} />;
  if (step === "reading" && reading) return <CardDeck reading={reading} onEmailSave={() => {}} />;
  return <LoadingScreen />;
}

export default function FullReadingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FullReadingContent />
    </Suspense>
  );
}
