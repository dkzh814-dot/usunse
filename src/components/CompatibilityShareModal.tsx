"use client";

import { useState } from "react";

interface CompatibilityShareModalProps {
  name1: string;
  name2: string;
  percentage: number;
  type: string;
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

function buildCanvas(name1: string, name2: string, percentage: number, type: string, hook: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const W = 540, H = 960;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0a0f");
  bg.addColorStop(0.5, "#12121a");
  bg.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Glow blob
  const glow = ctx.createRadialGradient(W / 2, 240, 0, W / 2, 240, 280);
  glow.addColorStop(0, "rgba(192,132,252,0.15)");
  glow.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.55);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Logo
  ctx.fillStyle = "#c084fc";
  ctx.font = "900 18px system-ui,-apple-system,sans-serif";
  ctx.fillText("US", W / 2, 108);
  ctx.fillText("NE", W / 2, 134);

  // Name 1
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 20px system-ui,-apple-system,sans-serif";
  ctx.fillText(name1, W / 2, 210);

  // Divider spark
  ctx.fillStyle = "rgba(192,132,252,0.65)";
  ctx.font = "14px system-ui,-apple-system,sans-serif";
  ctx.fillText("✦", W / 2, 240);

  // Name 2
  ctx.fillStyle = "#c084fc";
  ctx.font = "900 28px system-ui,-apple-system,sans-serif";
  ctx.fillText(name2, W / 2, 275);

  // Score ring (canvas arc)
  const cx = W / 2, cy = 420, radius = 90;
  const circumference = 2 * Math.PI * radius;
  const filled = (percentage / 100) * circumference;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#1e1e2e";
  ctx.lineWidth = 14;
  ctx.stroke();

  // Fill arc (gradient approximated as solid purple)
  const ringGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  ringGrad.addColorStop(0, "#c084fc");
  ringGrad.addColorStop(1, "#f472b6");
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (filled / radius), false);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  // Percentage text
  ctx.fillStyle = "#c084fc";
  ctx.font = "900 42px system-ui,-apple-system,sans-serif";
  ctx.fillText(`${percentage}%`, cx, cy - 8);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "400 11px system-ui,-apple-system,sans-serif";
  ctx.fillText("match", cx, cy + 26);

  // Type label
  ctx.fillStyle = "rgba(192,132,252,0.8)";
  ctx.font = "700 13px system-ui,-apple-system,sans-serif";
  ctx.fillText(type.toUpperCase(), W / 2, 548);

  // Hook
  const hookWords = hook.split(" ");
  const hookLines: string[] = [];
  let line = "";
  ctx.font = "italic 500 18px system-ui,-apple-system,sans-serif";
  for (const word of hookWords) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(`"${test}"`).width > W - 100) {
      hookLines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) hookLines.push(line);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "italic 500 18px system-ui,-apple-system,sans-serif";
  const hookStartY = 600;
  hookLines.forEach((l, i) => {
    const text = i === 0 ? `"${l}` : i === hookLines.length - 1 ? `${l}"` : l;
    ctx.fillText(text, W / 2, hookStartY + i * 26);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "400 11px system-ui,-apple-system,sans-serif";
  ctx.fillText("usunse.com", W / 2, H - 68);

  return canvas;
}

export default function CompatibilityShareModal({
  name1, name2, percentage, type, hook, resultUrl, shareText, onClose,
}: CompatibilityShareModalProps) {
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleSavePhoto() {
    setCapturing(true);
    try {
      const canvas = buildCanvas(name1, name2, percentage, type, hook);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "usunse-compatibility.png";
      a.click();
      showToast("Photo saved!");
    } catch { showToast("Failed — try again"); }
    finally { setCapturing(false); }
  }

  async function handleSNSShare(platform: "instagram" | "tiktok") {
    setCapturing(true);
    try {
      const dataUrl = buildCanvas(name1, name2, percentage, type, hook).toDataURL("image/png");
      const blob = dataUrlToBlob(dataUrl);
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
          a.href = dataUrl; a.download = "usunse.png"; a.click();
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
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm">×</button>

        {/* Preview card */}
        <div style={{
          width: "100%", aspectRatio: "9/16",
          background: "linear-gradient(160deg,#0a0a0f 0%,#12121a 50%,#0a0a0f 100%)",
          position: "relative", overflow: "hidden",
          fontFamily: "system-ui,-apple-system,sans-serif",
        }}>
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.12)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "10% 8% 6%" }}>
            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1, marginBottom: "6%" }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>US</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#c084fc" }}>NE</span>
            </div>

            {/* Names */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginBottom: "4%" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>{name1}</span>
              <span style={{ fontSize: 9, color: "rgba(192,132,252,0.65)" }}>✦</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#c084fc" }}>{name2}</span>
            </div>

            {/* Score ring preview (simple number) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "3% 0" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#c084fc", lineHeight: 1 }}>{percentage}%</span>
              <span style={{ fontSize: 7, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginTop: 3 }}>match</span>
            </div>

            {/* Type */}
            <p style={{ margin: "3% 0 0", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(192,132,252,0.8)" }}>{type}</p>

            {/* Hook */}
            <p style={{ margin: "4% 0 0", textAlign: "center", fontSize: 9, fontStyle: "italic", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
              &ldquo;{hook}&rdquo;
            </p>

            <div style={{ flex: 1 }} />
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] border border-white/10 text-sm text-text px-4 py-2 rounded-full shadow-lg pointer-events-none">{toast}</div>
      )}
    </div>
  );
}
