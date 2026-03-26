"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HOUR_OPTIONS = [
  { value: "",   label: "Don't know / Skip" },
  { value: "23", label: "자  11:30pm – 1:29am" },
  { value: "2",  label: "축  1:30am – 3:29am" },
  { value: "3",  label: "인  3:30am – 5:29am" },
  { value: "5",  label: "묘  5:30am – 7:29am" },
  { value: "7",  label: "진  7:30am – 9:29am" },
  { value: "9",  label: "사  9:30am – 11:29am" },
  { value: "11", label: "오  11:30am – 1:29pm" },
  { value: "13", label: "미  1:30pm – 3:29pm" },
  { value: "15", label: "신  3:30pm – 5:29pm" },
  { value: "17", label: "유  5:30pm – 7:29pm" },
  { value: "19", label: "술  7:30pm – 9:29pm" },
  { value: "21", label: "해  9:30pm – 11:29pm" },
];

function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

export default function MyFiveElementsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [hour, setHour] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("usunse_name");
    const savedDob  = localStorage.getItem("usunse_dob");
    if (savedName) setName(savedName);
    if (savedDob)  setDob(savedDob);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!dob) { setError("Enter your date of birth."); return; }

    const parts = dob.split(" / ");
    if (parts.length !== 3 || parts.some(p => p === "")) {
      setError("Enter date as MM / DD / YYYY.");
      return;
    }
    const [m, d, y] = parts;
    const year = parseInt(y);
    if (isNaN(year) || year < 1920 || year > new Date().getFullYear() - 5) {
      setError("Please enter a valid birth year.");
      return;
    }
    const isoDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

    setLoading(true);
    localStorage.setItem("usunse_name", name.trim());
    localStorage.setItem("usunse_dob", dob);

    const params = new URLSearchParams({ name: name.trim(), dob: isoDate, ...(hour !== "" ? { hour } : {}) });
    router.push(`/my-five-elements-result?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-8">
        <a href="/" className="text-muted hover:text-text transition-colors text-sm self-start">← Back</a>

        <div className="text-center space-y-2">
          <div className="flex flex-col items-center leading-none gap-0.5 mb-4">
            <span className="text-lg font-bold gradient-text">US</span>
            <span className="text-base font-bold gradient-text">NE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text leading-tight">My Five Elements</h1>
          <p className="text-sm text-muted leading-relaxed">
            See exactly how many of each energy your chart carries — and which ones are missing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name" autoComplete="off"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Date of Birth</label>
            <input type="text" inputMode="numeric" value={dob}
              onChange={e => setDob(formatDob(e.target.value))}
              placeholder="MM / DD / YYYY" maxLength={14}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">
              Birth Hour <span className="text-muted/60 normal-case">(optional)</span>
            </label>
            <select value={hour} onChange={e => setHour(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
              {HOUR_OPTIONS.map(h => (
                <option key={h.value} value={h.value} className="bg-surface">{h.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted/50 mt-1.5">Adding your birth hour gives you a more accurate reading.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-accent/20">
            {loading ? "Calculating…" : "See My Elements →"}
          </button>

          <p className="text-center text-xs text-muted">Free · No sign-up required</p>
        </form>
      </div>
    </main>
  );
}
