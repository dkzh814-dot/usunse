"use client";

import { useEffect, useRef, useState } from "react";
import { IdolMatch } from "@/lib/idols";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ShareModalProps {
  name: string;
  match: IdolMatch;
  userEmail: string;
  resultUrl: string;
  shareText: string;
  onClose: () => void;
}

function getShortDesc(score: number): string {
  if (score >= 85) return "A rare celestial alignment — once in a generation.";
  if (score >= 75) return "Harmony and magnetic pull — written in the stars.";
  if (score >= 65) return "A genuine cosmic thread — your charts agree.";
  return "Contrast that sparks growth — an invitation, not a warning.";
}

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "USNE-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Static score ring (no animation) so html2canvas captures it correctly
function ScoreRingCard({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const grad = { background: "linear-gradient(135deg,#c084fc,#f472b6)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const };
  return (
    <div style={{ position: "relative", width: 84, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="rcg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx="42" cy="42" r={r} fill="none" stroke="#1e1e2e" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none" stroke="url(#rcg)" strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, ...grad }}>{score}%</span>
        <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>match</span>
      </div>
    </div>
  );
}

async function captureCard(el: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(el, { scale: 2, backgroundColor: "#0a0a0f", useCORS: true, logging: false });
}

type PendingState = "idle" | "pending" | "done";

export default function ShareModal({ name, match, userEmail, resultUrl, shareText, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponCopied, setCouponCopied] = useState(false);
  const [pending, setPending] = useState<PendingState>("idle");
  const [countdown, setCountdown] = useState(30);
  const [toast, setToast] = useState("");

  // Countdown timer — cosmetic only
  useEffect(() => {
    if (pending !== "pending" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [pending, countdown]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function issueCoupon() {
    if (pending === "done") return;
    const code = generateCouponCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setCouponCode(code);
    setPending("done");
    try {
      await addDoc(collection(db, "coupons"), {
        email: userEmail, code, createdAt: serverTimestamp(), expiresAt, used: false,
      });
    } catch { /* don't block */ }
    try {
      fetch("/api/send-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code, expiresAt: expiresAt.toISOString() }),
      });
    } catch { /* don't block */ }
  }

  // Save as Photo — download only, no coupon
  async function handleSavePhoto() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
    a.click();
    showToast("Photo saved!");
  }

  // Instagram — share or copy → countdown + "I shared it!"
  async function handleInstagram() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

    await new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(); return; }
        const file = new File([blob], "usunse.png", { type: "image/png" });
        if (isMobile && navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], text: shareText }); } catch { /* cancelled */ }
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("Image copied — paste into Instagram!");
          } catch {
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
            a.click();
            showToast("Image saved — share it on Instagram!");
          }
        }
        resolve();
      }, "image/png");
    });

    setPending("pending");
    setCountdown(30);
  }

  // TikTok — share or copy → countdown + "I shared it!"
  async function handleTikTok() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

    await new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(); return; }
        const file = new File([blob], "usunse.png", { type: "image/png" });
        if (isMobile && navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], text: shareText }); } catch { /* cancelled */ }
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("Image copied — paste into TikTok!");
          } catch {
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
            a.click();
            showToast("Image saved — share it on TikTok!");
          }
        }
        resolve();
      }, "image/png");
    });

    setPending("pending");
    setCountdown(30);
  }

  // X/Twitter — open tab → show "I shared it!" immediately
  function handleTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setPending("pending");
    setCountdown(30);
  }

  // Copy Link — no coupon
  async function handleCopyLink() {
    await navigator.clipboard.writeText(resultUrl);
    showToast("Link copied!");
  }

  async function copyCoupon() {
    await navigator.clipboard.writeText(couponCode);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  }

  const grad: React.CSSProperties = {
    background: "linear-gradient(135deg,#c084fc,#f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm">
          ×
        </button>

        {/* 9:16 share card */}
        <div ref={cardRef} style={{ width: "100%", aspectRatio: "9/16", background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)", position: "relative", overflow: "hidden" }}>
          {/* Glows */}
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.15)", borderRadius: "50%", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "12%", right: "15%", width: "45%", height: "20%", background: "rgba(244,114,182,0.1)", borderRadius: "50%", filter: "blur(30px)" }} />

          {/* Content — 15% padding top+bottom = safe for 4:5 crop */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "15% 8%" }}>
            {/* US/NE logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, ...grad }}>US</span>
              <span style={{ fontSize: 12, fontWeight: 900, ...grad }}>NE</span>
            </div>

            {/* Center — pairing layout matching result page */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>{name}</span>
              <span style={{ fontSize: 13, color: "rgba(192,132,252,0.6)", lineHeight: 1 }}>✦</span>
              <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.05, ...grad }}>{match.idol.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{match.idol.group}</span>
              <ScoreRingCard score={match.score} />
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", maxWidth: "78%", lineHeight: 1.55 }}>
                {getShortDesc(match.score)}
              </p>
            </div>

            {/* usunse.com */}
            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              usunse.com
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 p-4">
          <button onClick={handleSavePhoto} className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Save as Photo
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleInstagram} disabled={pending !== "idle"} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 transition-colors disabled:opacity-50">
              Share to Instagram
            </button>
            <button onClick={handleTikTok} disabled={pending !== "idle"} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 transition-colors disabled:opacity-50">
              Share to TikTok
            </button>
            <button onClick={handleCopyLink} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">
              Copy Link
            </button>
            <button onClick={handleTwitter} disabled={pending !== "idle"} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors disabled:opacity-50">
              Share on 𝕏
            </button>
          </div>

          {/* "I shared it!" flow — shown after Instagram/TikTok/X */}
          {pending === "pending" && (
            <div className="mt-1 rounded-xl border border-white/10 bg-white/3 p-4 flex flex-col items-center gap-3 text-center">
              <p className="text-xs text-muted/70">Did you share it?</p>
              {countdown > 0 && (
                <span className="text-3xl font-black gradient-text tabular-nums">{countdown}</span>
              )}
              <button
                onClick={issueCoupon}
                className="w-full py-3 rounded-xl border border-accent/40 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
              >
                I shared it! →
              </button>
            </div>
          )}

          {/* Coupon — only after "I shared it!" */}
          {pending === "done" && couponCode && (
            <div className="mt-1 rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col items-center gap-2 text-center">
              <p className="text-[10px] text-muted/70 uppercase tracking-widest">Your 30% off code</p>
              <span className="text-xl font-black tracking-[0.15em] gradient-text">{couponCode}</span>
              <p className="text-[10px] text-muted/50">Valid for any $10 reading · 7 days</p>
              <button onClick={copyCoupon} className="px-4 py-1.5 rounded-lg border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors">
                {couponCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] border border-white/10 text-sm text-text px-4 py-2 rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
