"use client";

import { useState } from "react";
import { drawCompatibilityCard } from "@/lib/shareCanvas";

interface CompatibilityShareModalProps {
  name1: string;
  name2: string;
  score: number;
  hook: string;
  resultUrl: string;
  shareText: string;
  onClose: () => void;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function CompatibilityShareModal({
  name1, name2, score, hook, resultUrl, shareText, onClose,
}: CompatibilityShareModalProps) {
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function buildCanvas() {
    const canvas = document.createElement("canvas");
    drawCompatibilityCard(canvas, { name1, name2, score, hook });
    return canvas;
  }

  async function handleSavePhoto() {
    setCapturing(true);
    try {
      const a = document.createElement("a");
      a.href = buildCanvas().toDataURL("image/png");
      a.download = "usunse-compatibility.png";
      a.click();
      showToast("Photo saved!");
    } catch { showToast("Failed — try again"); }
    finally { setCapturing(false); }
  }

  async function handleSNSShare(platform: "instagram" | "tiktok") {
    setCapturing(true);
    try {
      const blob = dataUrlToBlob(buildCanvas().toDataURL("image/png"));
      const file = new File([blob], "usunse.png", { type: "image/png" });
      const label = platform === "instagram" ? "Instagram" : "TikTok";
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text: shareText }); } catch { /* cancelled */ }
      } else {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast(`Image copied — paste into ${label}!`);
        } catch {
          const a = document.createElement("a");
          a.href = buildCanvas().toDataURL("image/png");
          a.download = "usunse.png";
          a.click();
          showToast(`Image saved — share it on ${label}!`);
        }
      }
    } catch { showToast("Failed — try again"); }
    finally { setCapturing(false); }
  }

  function handleTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank", "noopener,noreferrer"
    );
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(resultUrl);
    showToast("Link copied!");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm"
        >×</button>

        {/* Preview card */}
        <div style={{
          width: "100%", aspectRatio: "9/16",
          background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)",
          position: "relative", overflow: "hidden",
          fontFamily: "system-ui,-apple-system,sans-serif",
        }}>
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.12)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "14% 8%" }}>
            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>US</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>NE</span>
            </div>
            {/* Names + ring */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{name1}</span>
              <span style={{ fontSize: 10, color: "rgba(192,132,252,0.65)" }}>✦</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#c084fc" }}>{name2}</span>
              <div style={{ margin: "8px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#c084fc" }}>{score}%</span>
                <span style={{ fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>compatible</span>
              </div>
              <p style={{ margin: 0, textAlign: "center", fontSize: 9, fontStyle: "italic", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                &ldquo;{hook}&rdquo;
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>usunse.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 p-4">
          <button onClick={handleSavePhoto} disabled={capturing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {capturing ? "Processing…" : "Save as Photo"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleSNSShare("instagram")} disabled={capturing}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">Share to Instagram</button>
            <button onClick={() => handleSNSShare("tiktok")} disabled={capturing}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 disabled:opacity-50 transition-colors">Share to TikTok</button>
            <button onClick={handleCopyLink}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">Copy Link</button>
            <button onClick={handleTwitter}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">Share on 𝕏</button>
          </div>
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
