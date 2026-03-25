"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BIRTH_HOURS = [
  { value: "", label: "Unknown (optional)" },
  { value: "0", label: "子 00:00–01:00" },
  { value: "1", label: "子 01:00–03:00" },
  { value: "3", label: "丑 03:00–05:00" },
  { value: "5", label: "寅 05:00–07:00" },
  { value: "7", label: "卯 07:00–09:00" },
  { value: "9", label: "辰 09:00–11:00" },
  { value: "11", label: "巳 11:00–13:00" },
  { value: "13", label: "午 13:00–15:00" },
  { value: "15", label: "未 15:00–17:00" },
  { value: "17", label: "申 17:00–19:00" },
  { value: "19", label: "酉 19:00–21:00" },
  { value: "21", label: "戌 21:00–23:00" },
  { value: "23", label: "亥 23:00–00:00" },
];

function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

interface BirthFormProps {
  destination?: string;
  showHour?: boolean;
}

export default function BirthForm({ destination = "/result", showHour = true }: BirthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [hour, setHour] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!dob) {
      setError("Enter your date of birth.");
      return;
    }

    const parts = dob.split(" / ");
    if (parts.length !== 3 || parts.some((p) => p === "")) {
      setError("Enter date as MM / DD / YYYY.");
      return;
    }
    const [m, d, y] = parts;
    const year = parseInt(y);
    const now = new Date().getFullYear();
    if (isNaN(year) || year < 1920 || year > now - 5) {
      setError("Please enter a valid birth year.");
      return;
    }
    const isoDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

    setLoading(true);

    const params = new URLSearchParams({
      name: name.trim(),
      dob: isoDate,
      ...(showHour && hour !== "" ? { hour } : {}),
    });

    router.push(`${destination}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-2">
          Date of Birth
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={dob}
          onChange={(e) => setDob(formatDob(e.target.value))}
          placeholder="MM / DD / YYYY"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
          maxLength={14}
        />
      </div>

      {showHour && (
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Birth Hour <span className="text-muted/60 normal-case">(optional — for accuracy)</span>
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
          >
            {BIRTH_HOURS.map((h) => (
              <option key={h.value} value={h.value} className="bg-surface">
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
          bg-gradient-to-r from-accent to-accent-2 text-white
          hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg shadow-accent/20"
      >
        {loading ? "Reading your stars…" : "Reveal My Destiny →"}
      </button>

      <p className="text-center text-xs text-muted">
        Free · No sign-up required
      </p>
    </form>
  );
}
