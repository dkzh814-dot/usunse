"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getCompatibility, compatDocId } from "@/lib/compatibility";
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

// ── types ─────────────────────────────────────────────────────────────────────

interface ResultData {
  name1: string;
  name2: string;
  dob1: string;
  dob2: string;
  email: string;
  score: number;
  hook: string;
}

// ── main content ─────────────────────────────────────────────────────────────

function CompatibilityContent() {
  const sp = useSearchParams();

  // form state
  const [name1, setName1] = useState("");
  const [dob1, setDob1] = useState("");
  const [name2, setName2] = useState("");
  const [dob2, setDob2] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // result state
  const [result, setResult] = useState<ResultData | null>(null);
  const [claudeBody, setClaudeBody] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const claudeCalled = useRef(false);

  // auto-fill from localStorage
  useEffect(() => {
    const savedName  = localStorage.getItem("usunse_name")  || "";
    const savedDob   = localStorage.getItem("usunse_dob")   || "";
    const savedEmail = localStorage.getItem("usunse_email") || "";
    if (savedName)  setName1(savedName);
    if (savedDob)   setDob1(savedDob);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // fetch Claude body whenever result is set (if not already loaded)
  useEffect(() => {
    if (!result || claudeCalled.current) return;
    claudeCalled.current = true;
    setClaudeLoading(true);

    fetch("/api/compatibility-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "bypass",
        name1: result.name1, dob1: result.dob1,
        name2: result.name2, dob2: result.dob2,
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setClaudeBody(data.claudeBody || null);
        // Save to Firestore (best-effort)
        if (result.email) {
          const docId = compatDocId(result.email, result.dob1, result.dob2);
          setDoc(doc(db, "compatibility_results", docId), {
            email: result.email,
            name1: result.name1, dob1: result.dob1,
            name2: result.name2, dob2: result.dob2,
            score: result.score, hook: result.hook,
            claudeBody: data.claudeBody || "",
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }
      })
      .catch(() => setClaudeBody(null))
      .finally(() => setClaudeLoading(false));
  }, [result]);

  // ── form submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name1.trim())  { setError("Enter your name.");          return; }
    if (!dob1)          { setError("Enter your date of birth."); return; }
    if (!name2.trim())  { setError("Enter their name.");         return; }
    if (!dob2)          { setError("Enter their date of birth."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email."); return; }

    const isoDob1 = dobToIso(dob1);
    const isoDob2 = dobToIso(dob2);
    if (!isoDob1) { setError("Check your date of birth format."); return; }
    if (!isoDob2) { setError("Check their date of birth format."); return; }

    setLoading(true);
    localStorage.setItem("usunse_name",  name1.trim());
    localStorage.setItem("usunse_dob",   dob1);
    localStorage.setItem("usunse_email", email.trim());

    // Check Firestore cache first
    try {
      const docId = compatDocId(email.trim(), isoDob1, isoDob2);
      const snap = await getDoc(doc(db, "compatibility_results", docId));
      if (snap.exists()) {
        const d = snap.data();
        setResult({
          name1: name1.trim(), name2: name2.trim(),
          dob1: isoDob1, dob2: isoDob2, email: email.trim(),
          score: d.score, hook: d.hook,
        });
        setClaudeBody(d.claudeBody || null);
        claudeCalled.current = true; // skip re-fetching
        setLoading(false);
        window.scrollTo(0, 0);
        return;
      }
    } catch { /* proceed */ }

    // Calculate score+hook client-side and show result immediately
    const { score, hook } = getCompatibility(isoDob1, isoDob2);
    setResult({
      name1: name1.trim(), name2: name2.trim(),
      dob1: isoDob1, dob2: isoDob2, email: email.trim(),
      score, hook,
    });
    setLoading(false);
    window.scrollTo(0, 0);
    // Claude body will be fetched by the useEffect above
  }

  // ── result screen ────────────────────────────────────────────────────────

  if (result) {
    const resultUrl = typeof window !== "undefined"
      ? `${window.location.origin}/compatibility?${new URLSearchParams({
          name: result.name1, dob: result.dob1,
          name2: result.name2, dob2: result.dob2,
        }).toString()}`
      : "";
    const shareText = `${result.name1} & ${result.name2} — ${result.score}% compatible\n"${result.hook}"\nusunse.com/compatibility`;

    return (
      <main className="min-h-screen px-4 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

        {shareOpen && (
          <CompatibilityShareModal
            name1={result.name1} name2={result.name2}
            score={result.score} hook={result.hook}
            resultUrl={resultUrl} shareText={shareText}
            onClose={() => setShareOpen(false)}
          />
        )}

        <div className="relative z-10 max-w-sm mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <button onClick={() => { setResult(null); setClaudeBody(null); claudeCalled.current = false; }} className="text-muted hover:text-text transition-colors text-sm">← Back</button>
            <div className="flex flex-col items-center leading-none gap-0">
              <span className="text-sm font-bold gradient-text">US</span>
              <span className="text-xs font-bold gradient-text">NE</span>
            </div>
          </div>

          {/* Names */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-lg font-semibold text-text/50 tracking-wide">{result.name1}</span>
            <span className="text-base text-accent/60 leading-none">✦</span>
            <h1 className="text-4xl font-display font-black gradient-text leading-tight">{result.name2}</h1>
          </div>

          {/* Score ring */}
          <div className="flex justify-center">
            <ScoreRing score={result.score} size={160} />
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
            </div>
          )}
          {!claudeLoading && claudeBody && (
            <p className="text-sm text-text/75 leading-relaxed text-center">{claudeBody}</p>
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

  // ── form screen ──────────────────────────────────────────────────────────

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
          <h1 className="text-2xl font-display font-bold text-text leading-tight">Are we compatible?</h1>
          <p className="text-sm text-muted leading-relaxed">
            Enter both birth dates and find out what your charts say about each other.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Person 1 */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-accent/70">You</p>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Name</label>
              <input type="text" value={name1}
                onChange={e => { setName1(e.target.value); localStorage.setItem("usunse_name", e.target.value); }}
                placeholder="Enter your name" autoComplete="off"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Date of Birth</label>
              <input type="text" inputMode="numeric" value={dob1}
                onChange={e => { const v = formatDob(e.target.value); setDob1(v); localStorage.setItem("usunse_dob", v); }}
                placeholder="MM / DD / YYYY" maxLength={14}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
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
              <input type="text" value={name2}
                onChange={e => setName2(e.target.value)}
                placeholder="Enter their name" autoComplete="off"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Their Date of Birth</label>
              <input type="text" inputMode="numeric" value={dob2}
                onChange={e => setDob2(formatDob(e.target.value))}
                placeholder="MM / DD / YYYY" maxLength={14}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Your Email</label>
            <input type="email" value={email}
              onChange={e => { setEmail(e.target.value); localStorage.setItem("usunse_email", e.target.value); }}
              placeholder="you@example.com" autoComplete="email"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors" />
            <p className="text-xs text-muted/50 mt-1.5">Used to retrieve your result if you come back.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-accent/20">
            {loading ? "Checking…" : "See Our Compatibility →"}
          </button>

          <p className="text-center text-xs text-muted">Free · No sign-up required</p>
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
