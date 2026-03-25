"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { drawEnergyColorCard } from "@/lib/shareCanvas";
import { firstSentence } from "@/lib/energyColor";

interface EnergyColorShareModalProps {
  colorHex: string;
  colorName: string;
  desc: string;
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

export default function EnergyColorShareModal({
  colorHex, colorName, desc, userEmail, resultUrl, shareText, onClose,
}: EnergyColorShareModalProps) {
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

  function buildCanvas() {
    const canvas = document.createElement("canvas");
    drawEnergyColorCard(canvas, { color: colorHex, name: colorName, firstSentence: firstSentence(desc) });
    return canvas;
  }

  async function handleSavePhoto() {
    setCapturing(true);
    try {
      const canvas = buildCanvas();
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `usunse-${colorName.replace(/\s/g, "-").toLowerCase()}.png`;
      a.click();
      showToast("Photo saved!");
    } catch (err) {
      console.error("Save failed:", err);
      showToast("Failed — try again");
    } finally {
      setCapturing(false);
    }
  }

  async function handleSNSShare(platform: "instagram" | "tiktok") {
    setCapturing(true);
    try {
      const canvas = buildCanvas();
      const dataUrl = canvas.toDataURL("image/png");
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
    } catch (err) {
      console.error("Share failed:", err);
      showToast("Failed — try again");
    } finally {
      setCapturing(false);
    }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm">×</button>

        {/* Preview card */}
        <div style={{
          width: "100%", aspectRatio: "9/16",
          background: colorHex, position: "relative", overflow: "hidden",
          fontFamily: "system-ui,-apple-system,sans-serif",
        }}>
          {/* Dark overlay */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)" }} />
          {/* Color glow */}
          <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "45%", background: colorHex, opacity: 0.3, borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "15% 8%" }}>
            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>US</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>NE</span>
            </div>

            {/* Color circle + name + sentence */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: colorHex, border: "2px solid rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Your energy color</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>{colorName}</span>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.2)" }} />
              <p style={{ margin: 0, fontSize: 10, fontStyle: "italic", color: "rgba(255,255,255,0.6)", maxWidth: "82%", lineHeight: 1.55 }}>{firstSentence(desc)}</p>
            </div>

            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>usunse.com</p>
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
