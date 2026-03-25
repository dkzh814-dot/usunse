"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { drawFiveElementsCard } from "@/lib/shareCanvas";
import { ELEMENT_META, ELEMENTS, FiveElementsResult } from "@/lib/fiveElements";

interface FiveElementsShareModalProps {
  name: string;
  result: FiveElementsResult;
  userEmail: string;
  resultUrl: string;
  shareText: string;
  onClose: () => void;
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

type PendingState = "idle" | "pending" | "done";

export default function FiveElementsShareModal({
  name, result, userEmail, resultUrl, shareText, onClose,
}: FiveElementsShareModalProps) {
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
    setCouponCode(code);
    setPending("done");
    try {
      await addDoc(collection(db, "coupons"), {
        email: userEmail, code, createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), used: false,
      });
    } catch { /* don't block */ }
  }

  function buildCanvas() {
    const canvas = document.createElement("canvas");
    drawFiveElementsCard(canvas, {
      name,
      counts: result.counts as Record<string, number>,
      dominant: result.dominant,
      missing: result.missing,
    });
    return canvas;
  }

  async function handleSavePhoto() {
    setCapturing(true);
    try {
      const a = document.createElement("a");
      a.href = buildCanvas().toDataURL("image/png");
      a.download = "usunse-five-elements.png";
      a.click();
      showToast("Photo saved!");
    } catch { showToast("Failed — try again"); }
    finally { setCapturing(false); }
  }

  async function handleSNSShare(platform: "instagram" | "tiktok") {
    setCapturing(true);
    try {
      const dataUrl = buildCanvas().toDataURL("image/png");
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], "usunse.png", { type: "image/png" });
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const label = platform === "instagram" ? "Instagram" : "TikTok";
      if (isMobile && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text: shareText }); } catch { /* cancelled */ }
      } else {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast(`Image copied — paste into ${label}!`);
        } catch {
          const a = document.createElement("a");
          a.href = dataUrl; a.download = "usunse.png"; a.click();
          showToast(`Image saved — share it on ${label}!`);
        }
      }
    } catch { showToast("Failed — try again"); }
    finally { setCapturing(false); }
    setPending("pending");
  }

  function handleTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setPending("pending");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(resultUrl);
    showToast("Link copied!");
  }

  async function copyCoupon() {
    await navigator.clipboard.writeText(couponCode);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  }

  const maxCount = Math.max(...ELEMENTS.map(e => result.counts[e]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm">×</button>

        {/* Preview card */}
        <div style={{ width: "100%", aspectRatio: "9/16", background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)", position: "relative", overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif" }}>
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.12)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "14% 8%" }}>
            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>US</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>NE</span>
            </div>
            {/* Chart */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, textAlign: "center", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>My Five Elements</p>
              <p style={{ margin: "0 0 6px", textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{name}</p>
              {ELEMENTS.map(el => {
                const count = result.counts[el];
                const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const { korean, english, color } = ELEMENT_META[el];
                return (
                  <div key={el} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 14, textAlign: "center", fontSize: 10, fontWeight: 700, color }}>{korean}</span>
                    <span style={{ width: 32, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{english}</span>
                    <div style={{ flex: 1, height: 7, background: "#1e1e2e", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${barPct}%`, height: "100%", background: color + "bb", borderRadius: 3 }} />
                    </div>
                    <span style={{ width: 10, textAlign: "right", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{count}</span>
                    {result.dominant.includes(el) && <span style={{ fontSize: 9, color: "#EAB308" }}>★</span>}
                    {result.missing.includes(el)  && <span style={{ fontSize: 9, color: "#EF4444" }}>✕</span>}
                  </div>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>usunse.com</p>
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
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">Share to Instagram</button>
            <button onClick={() => handleSNSShare("tiktok")} disabled={capturing || pending !== "idle"}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">Share to TikTok</button>
            <button onClick={handleCopyLink}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">Copy Link</button>
            <button onClick={handleTwitter} disabled={pending !== "idle"}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text disabled:opacity-50 transition-colors">Share on 𝕏</button>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] border border-white/10 text-sm text-text px-4 py-2 rounded-full shadow-lg pointer-events-none">{toast}</div>
      )}
    </div>
  );
}
