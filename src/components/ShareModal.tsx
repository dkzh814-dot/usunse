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

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Capture the visible card element using dom-to-image-more (handles CSS gradients correctly)
async function captureCard(el: HTMLElement): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const domtoimage = (await import("dom-to-image-more")) as any;
  const scale = 2;
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  // Temporarily remove any backdrop-filter from the element tree to avoid capture artifacts
  const blurEls: Array<{ el: HTMLElement; val: string }> = [];
  el.querySelectorAll<HTMLElement>("*").forEach((child) => {
    const bf = getComputedStyle(child).backdropFilter;
    if (bf && bf !== "none") {
      blurEls.push({ el: child, val: child.style.backdropFilter });
      child.style.backdropFilter = "none";
    }
  });

  try {
    const dataUrl: string = await domtoimage.default.toPng(el, {
      width: w * scale,
      height: h * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      },
      bgcolor: "#0a0a0f",
      cacheBust: true,
    });
    return dataUrl;
  } finally {
    // Restore backdrop-filter
    blurEls.forEach(({ el: child, val }) => { child.style.backdropFilter = val; });
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
    const el = cardRef.current;
    if (!el) return;
    setCapturing(true);
    try {
      const dataUrl = await captureCard(el);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
      a.click();
      showToast("Photo saved!");
    } catch (err) {
      console.error("Capture failed:", err);
      showToast("Capture failed — try again");
    } finally {
      setCapturing(false);
    }
  }

  // SNS share (Instagram / TikTok) — Web Share on mobile, clipboard on desktop
  async function handleSNSShare(platform: "instagram" | "tiktok") {
    const el = cardRef.current;
    if (!el) return;
    setCapturing(true);
    try {
      const dataUrl = await captureCard(el);
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], "usunse.png", { type: "image/png" });
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const label = platform === "instagram" ? "Instagram" : "TikTok";

      if (isMobile && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: shareText });
        } catch { /* user cancelled */ }
      } else {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast(`Image copied — paste into ${label}!`);
        } catch {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = "usunse.png";
          a.click();
          showToast(`Image saved — share it on ${label}!`);
        }
      }
    } catch (err) {
      console.error("Share failed:", err);
      showToast("Capture failed — try again");
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

  // Solid color for card text — gradient text breaks canvas capture
  const cardAccent = "#c084fc";

  const previewR = 38;
  const previewCirc = 2 * Math.PI * previewR;
  const previewOffset = previewCirc * (1 - match.score / 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm">
          ×
        </button>

        {/* Share card — this exact element is captured by dom-to-image-more */}
        <div
          ref={cardRef}
          style={{
            width: "100%",
            aspectRatio: "9/16",
            background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)",
            position: "relative",
            overflow: "hidden",
            fontFamily: "system-ui,-apple-system,sans-serif",
          }}
        >
          {/* Glows — no backdrop-filter, just regular filter:blur */}
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.2)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "12%", right: "15%", width: "45%", height: "20%", background: "rgba(244,114,182,0.12)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "15% 8%" }}>
            {/* US/NE logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: cardAccent }}>US</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: cardAccent }}>NE</span>
            </div>

            {/* Pairing */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{name}</span>
              <span style={{ fontSize: 13, color: "rgba(192,132,252,0.6)", lineHeight: 1 }}>✦</span>
              <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.05, color: cardAccent }}>{match.idol.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{match.idol.group}</span>

              {/* Score ring — solid stroke, no linearGradient (broken in canvas capture) */}
              <div style={{ position: "relative", width: 84, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
                  <circle cx="42" cy="42" r={previewR} fill="none" stroke="#1e1e2e" strokeWidth="7" />
                  <circle cx="42" cy="42" r={previewR} fill="none" stroke={cardAccent} strokeWidth="7"
                    strokeLinecap="round" strokeDasharray={previewCirc} strokeDashoffset={previewOffset} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: cardAccent }}>{match.score}%</span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>match</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", maxWidth: "78%", lineHeight: 1.55 }}>{getShortDesc(match.score)}</p>
            </div>

            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>usunse.com</p>
          </div>
        </div>

        {/* Action buttons */}
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

          {pending === "pending" && (
            <button onClick={issueCoupon}
              className="w-full py-3 rounded-xl border border-accent/40 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors">
              I shared it! →
            </button>
          )}

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
