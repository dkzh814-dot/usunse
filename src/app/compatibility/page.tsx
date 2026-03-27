"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { getCompatibilityResult, CompatResult } from "@/lib/compatibility";
import ScoreRing from "@/components/ScoreRing";
import CompatibilityShareModal from "@/components/CompatibilityShareModal";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

function dobToIso(dob: string): string | null {
  const parts = dob.split(" / ");
  if (parts.length !== 3 || parts.some(p => p === "")) return null;
  const [m, d, y] = parts;
  const year = parseInt(y);
  if (isNaN(year) || year < 1920 || year > new Date().getFullYear() - 5) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function formatDobDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

type Step = "form" | "modal" | "loading" | "result";

interface ResultData {
  name1: string; dob1: string;
  name2: string; dob2: string;
  email: string;
  percentage: number; type: string; hook: string;
  claudeBody: string | null;
}

// ── confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  name1, dob1, name2, dob2,
  onConfirm, onBack, loading,
}: {
  name1: string; dob1: string; name2: string; dob2: string;
  onConfirm: () => void; onBack: () => void; loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div className="w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted/60">Are we compatible?</p>
          <h2 className="text-lg font-display font-bold text-text">Confirm your reading</h2>
        </div>

        <div className="rounded-xl border border-border bg-surface/50 p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text">{name1}</p>
              <p className="text-xs text-muted/60">{formatDobDisplay(dob1)}</p>
            </div>
            <span className="text-accent/50 text-sm">✦</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-text">{name2}</p>
              <p className="text-xs text-muted/60">{formatDobDisplay(dob2)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted/50">One-time reading</p>
          <span className="text-lg font-black gradient-text">$1</span>
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
            bg-gradient-to-r from-accent to-accent-2 text-white
            hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {loading ? "Checking…" : "$1 — See Our Compatibility"}
        </button>

        <button onClick={onBack} className="text-center text-xs text-muted/50 hover:text-muted transition-colors">
          ← Go back
        </button>
      </div>
    </div>
  );
}

// ── main content ──────────────────────────────────────────────────────────────

function CompatibilityContent() {
  // form fields
  const [name1, setName1] = useState("");
  const [dob1,  setDob1]  = useState("");
  const [name2, setName2] = useState("");
  const [dob2,  setDob2]  = useState("");
  const [email, setEmail] = useState("");

  // validated ISO dates (set when moving to modal)
  const [isoDob1, setIsoDob1] = useState("");
  const [isoDob2, setIsoDob2] = useState("");

  const [step,  setStep]  = useState<Step>("form");
  const [error, setError] = useState("");

  const [result, setResult] = useState<ResultData | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeError, setClaudeError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const claudeCalled = useRef(false);

  // auto-fill from localStorage
  useEffect(() => {
    const n = localStorage.getItem("usunse_name")  || "";
    const d = localStorage.getItem("usunse_dob")   || "";
    const e = localStorage.getItem("usunse_email") || "";
    if (n) setName1(n);
    if (d) setDob1(d);
    if (e) setEmail(e);
  }, []);

  // fetch Claude body after result is set
  useEffect(() => {
    if (!result || claudeCalled.current || result.claudeBody !== null) return;
    claudeCalled.current = true;
    setClaudeLoading(true);
    setClaudeError(false);

    fetch("/api/compatibility-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name1: result.name1, dob1: result.dob1,
        name2: result.name2, dob2: result.dob2,
        email: result.email,
      }),
    })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          console.error("Compatibility API error:", r.status, err);
          throw new Error(String(r.status));
        }
        return r.json();
      })
      .then(data => {
        const body = typeof data.claudeBody === "string" && data.claudeBody.trim()
          ? data.claudeBody.trim()
          : null;
        setResult(prev => prev ? { ...prev, claudeBody: body } : prev);
        if (!body) setClaudeError(true);
      })
      .catch(() => setClaudeError(true))
      .finally(() => setClaudeLoading(false));
  }, [result]);

  // ── validate form and open modal ────────────────────────────────────────────

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name1.trim())  { setError("Enter your name.");            return; }
    if (!dob1)          { setError("Enter your date of birth.");   return; }
    if (!name2.trim())  { setError("Enter their name.");           return; }
    if (!dob2)          { setError("Enter their date of birth.");  return; }
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email."); return; }

    const iso1 = dobToIso(dob1);
    const iso2 = dobToIso(dob2);
    if (!iso1) { setError("Check your date of birth format.");    return; }
    if (!iso2) { setError("Check their date of birth format.");  return; }

    localStorage.setItem("usunse_name",  name1.trim());
    localStorage.setItem("usunse_dob",   dob1);
    localStorage.setItem("usunse_email", email.trim());

    setIsoDob1(iso1);
    setIsoDob2(iso2);
    setStep("modal");
  }

  // ── confirm: compute score and show result ───────────────────────────────────

  function handleConfirm() {
    // Compute score client-side and show result immediately
    const compat: CompatResult = getCompatibilityResult(isoDob1, isoDob2);
    setResult({
      name1: name1.trim(), dob1: isoDob1,
      name2: name2.trim(), dob2: isoDob2,
      email: email.trim(),
      percentage: compat.percentage, type: compat.type, hook: compat.hook,
      claudeBody: null,
    });
    setStep("result");
    window.scrollTo(0, 0);
    // Claude body will load via useEffect
  }

  // ── result screen ─────────────────────────────────────────────────────────

  if (step === "result" && result) {
    const resultUrl = typeof window !== "undefined"
      ? `${window.location.origin}/compatibility`
      : "";
    const shareText = `${result.name1} & ${result.name2} — ${result.percentage}% compatible\n"${result.hook}"\nusunse.com/compatibility`;

    return (
      <main className="min-h-screen px-4 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

        {shareOpen && (
          <CompatibilityShareModal
            name1={result.name1} name2={result.name2}
            percentage={result.percentage} type={result.type} hook={result.hook}
            resultUrl={resultUrl} shareText={shareText}
            onClose={() => setShareOpen(false)}
          />
        )}

        <div className="relative z-10 max-w-sm mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => { setResult(null); setStep("form"); claudeCalled.current = false; }}
              className="text-muted hover:text-text transition-colors text-sm"
            >← Back</button>
            <div className="flex flex-col items-center leading-none gap-0">
              <span className="text-sm font-bold gradient-text">US</span>
              <span className="text-xs font-bold gradient-text">NE</span>
            </div>
          </div>

          {/* Names */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-base font-semibold text-text/60">{result.name1}</span>
            <span className="text-sm text-accent/50 leading-none">✦</span>
            <span className="text-3xl font-display font-black gradient-text leading-tight">{result.name2}</span>
          </div>

          {/* Score ring */}
          <div className="flex justify-center">
            <ScoreRing score={result.percentage} size={160} />
          </div>

          {/* Type label */}
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full border border-accent/30 text-xs font-semibold tracking-widest uppercase gradient-text">
              {result.type}
            </span>
          </div>

          {/* Hook */}
          <p className="text-lg font-display font-semibold text-text/90 leading-snug text-center italic">
            &ldquo;{result.hook}&rdquo;
          </p>

          {/* Claude body */}
          {claudeLoading && (
            <div className="space-y-2">
              <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-white/5 rounded-full animate-pulse w-5/6" />
              <div className="h-3 bg-white/5 rounded-full animate-pulse w-4/5" />
              <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-white/5 rounded-full animate-pulse w-3/4" />
            </div>
          )}
          {!claudeLoading && result.claudeBody && (
            <div className="space-y-3">
              {result.claudeBody.split(/\n\n+/).filter(Boolean).map((para, i) => (
                <p key={i} className="text-sm text-text/75 leading-relaxed">{para}</p>
              ))}
            </div>
          )}
          {!claudeLoading && claudeError && (
            <p className="text-xs text-red-400/70 text-center">Reading failed to load. Check back soon.</p>
          )}

          {/* Share */}
          <button
            onClick={() => setShareOpen(true)}
            disabled={claudeLoading}
            className="w-full py-4 rounded-xl font-semibold text-sm tracking-wide
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            Share My Result
          </button>

          <div className="h-8" />
        </div>
      </main>
    );
  }

  // ── form screen ───────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {(step === "modal" || step === "loading") && (
        <ConfirmModal
          name1={name1.trim()} dob1={isoDob1}
          name2={name2.trim()} dob2={isoDob2}
          onConfirm={handleConfirm}
          onBack={() => setStep("form")}
          loading={step === "loading"}
        />
      )}

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-8">
        <a href="/" className="text-muted hover:text-text transition-colors text-sm self-start">← Back</a>

        <div className="text-center space-y-2">
          <div className="flex flex-col items-center leading-none gap-0.5 mb-4">
            <span className="text-lg font-bold gradient-text">US</span>
            <span className="text-base font-bold gradient-text">NE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text leading-tight">Are we compatible?</h1>
          <p className="text-sm text-muted leading-relaxed">
            Enter both birth dates. Your charts will tell the truth.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="w-full space-y-5">
          {/* Person 1 */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-accent/70">You</p>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Name</label>
              <input
                type="text" value={name1}
                onChange={e => setName1(e.target.value)}
                placeholder="Enter your name" autoComplete="off"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Date of Birth</label>
              <input
                type="text" inputMode="numeric" value={dob1}
                onChange={e => setDob1(formatDob(e.target.value))}
                placeholder="MM / DD / YYYY" maxLength={14}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-accent/50 text-sm">✦</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Person 2 */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-accent/70">Them</p>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Their Name</label>
              <input
                type="text" value={name2}
                onChange={e => setName2(e.target.value)}
                placeholder="Enter their name" autoComplete="off"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Their Date of Birth</label>
              <input
                type="text" inputMode="numeric" value={dob2}
                onChange={e => setDob2(formatDob(e.target.value))}
                placeholder="MM / DD / YYYY" maxLength={14}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-muted/50 mt-1.5">Used to retrieve your result if you come back.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            See Our Compatibility →
          </button>

          <p className="text-center text-xs text-muted">$1 · One-time · No subscription</p>
        </form>
      </div>
    </main>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm animate-pulse">Loading…</div>
      </div>
    }>
      <CompatibilityContent />
    </Suspense>
  );
}
