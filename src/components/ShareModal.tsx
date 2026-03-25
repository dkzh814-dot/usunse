"use client";

import { useRef, useState } from "react";
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

// Build the share card DOM element off-screen at a fixed 540×960px for consistent capture quality
function buildOffscreenCard(name: string, match: IdolMatch): HTMLElement {
  const W = 540;
  const H = 960;
  const padV = Math.round(H * 0.15);
  const padH = Math.round(W * 0.1);

  const score = match.score;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  const wrap = document.createElement("div");
  wrap.style.cssText = `
    position:fixed; left:-9999px; top:0; z-index:-1;
    width:${W}px; height:${H}px; overflow:hidden;
    background:linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%);
    font-family:system-ui,-apple-system,sans-serif;
  `;

  wrap.innerHTML = `
    <!-- glow top -->
    <div style="position:absolute;top:8%;left:50%;transform:translateX(-50%);
      width:70%;height:30%;background:rgba(192,132,252,0.18);
      border-radius:50%;filter:blur(60px);"></div>
    <!-- glow bottom -->
    <div style="position:absolute;bottom:12%;right:15%;
      width:45%;height:20%;background:rgba(244,114,182,0.12);
      border-radius:50%;filter:blur(50px);"></div>

    <!-- content layer -->
    <div style="position:absolute;inset:0;
      display:flex;flex-direction:column;align-items:center;justify-content:space-between;
      padding:${padV}px ${padH}px;">

      <!-- logo -->
      <div style="display:flex;flex-direction:column;align-items:center;line-height:1;gap:2px;">
        <span style="font-size:18px;font-weight:900;
          background:linear-gradient(135deg,#c084fc,#f472b6);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;">US</span>
        <span style="font-size:18px;font-weight:900;
          background:linear-gradient(135deg,#c084fc,#f472b6);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;">NE</span>
      </div>

      <!-- center: pairing + ring -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;">
        <span style="font-size:26px;font-weight:600;color:rgba(255,255,255,0.5);">${name}</span>
        <span style="font-size:20px;color:rgba(192,132,252,0.65);line-height:1;">✦</span>
        <span style="font-size:46px;font-weight:900;line-height:1.05;
          background:linear-gradient(135deg,#c084fc,#f472b6);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;">${match.idol.name}</span>
        <span style="font-size:16px;color:rgba(255,255,255,0.35);margin-bottom:4px;">${match.idol.group}</span>

        <!-- score ring -->
        <div style="position:relative;width:128px;height:128px;display:flex;align-items:center;justify-content:center;">
          <svg width="128" height="128" viewBox="0 0 128 128"
            style="transform:rotate(-90deg);position:absolute;inset:0;">
            <defs>
              <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#c084fc"/>
                <stop offset="100%" stop-color="#f472b6"/>
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r="${r}" fill="none" stroke="#1e1e2e" stroke-width="10"/>
            <circle cx="64" cy="64" r="${r}" fill="none" stroke="url(#sg)" stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="${circ.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <span style="font-size:26px;font-weight:900;line-height:1;
              background:linear-gradient(135deg,#c084fc,#f472b6);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent;">${score}%</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">match</span>
          </div>
        </div>

        <p style="font-size:14px;color:rgba(255,255,255,0.4);max-width:75%;line-height:1.6;margin:0;">
          ${getShortDesc(score)}
        </p>
      </div>

      <!-- url -->
      <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);margin:0;">
        usunse.com
      </p>
    </div>
  `;

  return wrap;
}

async function captureOffscreen(name: string, match: IdolMatch): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  const el = buildOffscreenCard(name, match);
  document.body.appendChild(el);
  try {
    const canvas = await html2canvas(el, {
      scale: 1,
      width: 540,
      height: 960,
      backgroundColor: "#0a0a0f",
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    return canvas;
  } finally {
    document.body.removeChild(el);
  }
}

type PendingState = "idle" | "pending" | "done";

export default function ShareModal({ name, match, userEmail, resultUrl, shareText, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponCopied, setCouponCopied] = useState(false);
  const [pending, setPending] = useState<PendingState>("idle");
  const [toast, setToast] = useState("");
  const [capturing, setCapturing] = useState(false);

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
  }

  // Save as Photo — download only, no coupon
  async function handleSavePhoto() {
    setCapturing(true);
    try {
      const canvas = await captureOffscreen(name, match);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
      a.click();
      showToast("Photo saved!");
    } finally {
      setCapturing(false);
    }
  }

  // Capture + share via Web Share API (mobile) or clipboard (desktop), then show "I shared it!"
  async function handleSNSShare(platform: "instagram" | "tiktok") {
    setCapturing(true);
    try {
      const canvas = await captureOffscreen(name, match);
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

      if (isMobile) {
        await new Promise<void>((resolve) => {
          canvas.toBlob(async (blob) => {
            if (!blob) { resolve(); return; }
            const file = new File([blob], "usunse.png", { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              try { await navigator.share({ files: [file], text: shareText }); } catch { /* cancelled */ }
            } else {
              // fallback: download
              const url = canvas.toDataURL("image/png");
              const a = document.createElement("a");
              a.href = url; a.download = "usunse.png"; a.click();
              showToast(`Image saved — open ${platform === "instagram" ? "Instagram" : "TikTok"}!`);
            }
            resolve();
          }, "image/png");
        });
      } else {
        // Desktop: try clipboard, fallback to download
        await new Promise<void>((resolve) => {
          canvas.toBlob(async (blob) => {
            if (!blob) { resolve(); return; }
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              showToast(`Image copied — paste into ${platform === "instagram" ? "Instagram" : "TikTok"}!`);
            } catch {
              const url = canvas.toDataURL("image/png");
              const a = document.createElement("a");
              a.href = url; a.download = "usunse.png"; a.click();
              showToast(`Image saved — share it on ${platform === "instagram" ? "Instagram" : "TikTok"}!`);
            }
            resolve();
          }, "image/png");
        });
      }
    } finally {
      setCapturing(false);
    }
    setPending("pending");
  }

  // X/Twitter — open tab, show "I shared it!" immediately
  function handleTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setPending("pending");
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

  // Score ring for preview card (not used in capture — capture uses off-screen element)
  const previewR = 38;
  const previewCirc = 2 * Math.PI * previewR;
  const previewOffset = previewCirc * (1 - match.score / 100);

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

        {/* 9:16 preview card (display only — capture uses off-screen element) */}
        <div
          ref={cardRef}
          style={{ width: "100%", aspectRatio: "9/16", background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)", position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.15)", borderRadius: "50%", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "12%", right: "15%", width: "45%", height: "20%", background: "rgba(244,114,182,0.1)", borderRadius: "50%", filter: "blur(30px)" }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "15% 8%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, ...grad }}>US</span>
              <span style={{ fontSize: 12, fontWeight: 900, ...grad }}>NE</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{name}</span>
              <span style={{ fontSize: 13, color: "rgba(192,132,252,0.6)", lineHeight: 1 }}>✦</span>
              <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.05, ...grad }}>{match.idol.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{match.idol.group}</span>

              {/* Preview ring */}
              <div style={{ position: "relative", width: 84, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
                  <defs>
                    <linearGradient id="prev-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  <circle cx="42" cy="42" r={previewR} fill="none" stroke="#1e1e2e" strokeWidth="7" />
                  <circle cx="42" cy="42" r={previewR} fill="none" stroke="url(#prev-ring)" strokeWidth="7"
                    strokeLinecap="round" strokeDasharray={previewCirc} strokeDashoffset={previewOffset} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, ...grad }}>{match.score}%</span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>match</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", maxWidth: "78%", lineHeight: 1.55 }}>{getShortDesc(match.score)}</p>
            </div>

            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>usunse.com</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 p-4">
          <button onClick={handleSavePhoto} disabled={capturing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {capturing ? "Processing…" : "Save as Photo"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleSNSShare("instagram")} disabled={capturing || pending !== "idle"}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">
              Share to Instagram
            </button>
            <button onClick={() => handleSNSShare("tiktok")} disabled={capturing || pending !== "idle"}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">
              Share to TikTok
            </button>
            <button onClick={handleCopyLink}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">
              Copy Link
            </button>
            <button onClick={handleTwitter} disabled={pending !== "idle"}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text disabled:opacity-50 transition-colors">
              Share on 𝕏
            </button>
          </div>

          {/* "I shared it!" — no countdown */}
          {pending === "pending" && (
            <button onClick={issueCoupon}
              className="w-full py-3 rounded-xl border border-accent/40 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors">
              I shared it! →
            </button>
          )}

          {/* Coupon */}
          {pending === "done" && couponCode && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col items-center gap-2 text-center">
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] border border-white/10 text-sm text-text px-4 py-2 rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
