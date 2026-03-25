// Draw share cards directly onto a canvas using Canvas 2D API.
// No DOM capture — renders perfectly on mobile with no library artifacts.

interface DrawOptions {
  name: string;
  idolName: string;
  group: string;
  score: number;
  desc: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawShareCard(canvas: HTMLCanvasElement, opts: DrawOptions): void {
  const W = 540;
  const H = 960;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0a0a0f");
  bgGrad.addColorStop(0.5, "#12121a");
  bgGrad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Glow top (purple) ────────────────────────────────────────
  const glowTop = ctx.createRadialGradient(W / 2, 130, 0, W / 2, 130, 220);
  glowTop.addColorStop(0, "rgba(192,132,252,0.22)");
  glowTop.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, W, H / 2);

  // ── Glow bottom (pink) ───────────────────────────────────────
  const glowBot = ctx.createRadialGradient(W * 0.75, H * 0.85, 0, W * 0.75, H * 0.85, 160);
  glowBot.addColorStop(0, "rgba(244,114,182,0.14)");
  glowBot.addColorStop(1, "rgba(244,114,182,0)");
  ctx.fillStyle = glowBot;
  ctx.fillRect(0, H / 2, W, H / 2);

  const cx = W / 2;
  const PURPLE = "#c084fc";
  const MUTED = "rgba(255,255,255,0.35)";

  // ── Logo: US / NE ─────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = PURPLE;
  ctx.font = "900 18px system-ui,-apple-system,sans-serif";
  ctx.fillText("US", cx, 170);
  ctx.fillText("NE", cx, 196);

  // ── User name ─────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 28px system-ui,-apple-system,sans-serif";
  ctx.fillText(opts.name, cx, 380);

  // ── Connector ✦ ───────────────────────────────────────────────
  ctx.fillStyle = "rgba(192,132,252,0.65)";
  ctx.font = "400 22px system-ui,-apple-system,sans-serif";
  ctx.fillText("✦", cx, 424);

  // ── Idol name (largest text) ──────────────────────────────────
  ctx.fillStyle = PURPLE;
  ctx.font = "900 52px system-ui,-apple-system,sans-serif";
  ctx.fillText(opts.idolName, cx, 492);

  // ── Group ─────────────────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = "400 16px system-ui,-apple-system,sans-serif";
  ctx.fillText(opts.group, cx, 530);

  // ── Score ring ────────────────────────────────────────────────
  const ringCx = cx;
  const ringCy = 650;
  const ringR = 64;
  const ringW = 10;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * opts.score) / 100;

  // Track
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, 2 * Math.PI);
  ctx.strokeStyle = "#1e1e2e";
  ctx.lineWidth = ringW;
  ctx.stroke();

  // Fill arc
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startAngle, endAngle);
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = ringW;
  ctx.lineCap = "round";
  ctx.stroke();

  // Score %
  ctx.fillStyle = PURPLE;
  ctx.font = "900 28px system-ui,-apple-system,sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`${opts.score}%`, ringCx, ringCy - 6);

  ctx.fillStyle = MUTED;
  ctx.font = "400 11px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.1em";
  ctx.fillText("MATCH", ringCx, ringCy + 20);
  ctx.letterSpacing = "0";

  // ── Description ───────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 15px system-ui,-apple-system,sans-serif";
  const descLines = wrapText(ctx, opts.desc, W * 0.72);
  const lineH = 22;
  const descStartY = 756;
  descLines.forEach((line, i) => {
    ctx.fillText(line, cx, descStartY + i * lineH);
  });

  // ── usunse.com ────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "400 12px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("USUNSE.COM", cx, 828);
  ctx.letterSpacing = "0";
}

// ── Repel card ───────────────────────────────────────────────────────────────

interface RepelDrawOptions {
  typeName: string;
  tagline: string;
}

export function drawRepelCard(canvas: HTMLCanvasElement, opts: RepelDrawOptions): void {
  const W = 540;
  const H = 960;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;
  const cx = W / 2;
  const PURPLE = "#c084fc";
  const MUTED = "rgba(255,255,255,0.35)";

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0a0a0f");
  bgGrad.addColorStop(0.5, "#12121a");
  bgGrad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Glow top (purple)
  const glowTop = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, 260);
  glowTop.addColorStop(0, "rgba(192,132,252,0.25)");
  glowTop.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, W, H / 2);

  // Glow bottom (pink)
  const glowBot = ctx.createRadialGradient(W * 0.3, H * 0.82, 0, W * 0.3, H * 0.82, 180);
  glowBot.addColorStop(0, "rgba(244,114,182,0.14)");
  glowBot.addColorStop(1, "rgba(244,114,182,0)");
  ctx.fillStyle = glowBot;
  ctx.fillRect(0, H / 2, W, H / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Logo
  ctx.fillStyle = PURPLE;
  ctx.font = "900 18px system-ui,-apple-system,sans-serif";
  ctx.fillText("US", cx, 170);
  ctx.fillText("NE", cx, 196);

  // "You attract" label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 15px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.12em";
  ctx.fillText("YOU ATTRACT", cx, 430);
  ctx.letterSpacing = "0";

  // Type name
  ctx.fillStyle = PURPLE;
  const nameSize = opts.typeName.length > 14 ? 42 : 52;
  ctx.font = `900 ${nameSize}px system-ui,-apple-system,sans-serif`;
  ctx.fillText(opts.typeName, cx, 510);

  // Divider line
  ctx.strokeStyle = "rgba(192,132,252,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 60, 570);
  ctx.lineTo(cx + 60, 570);
  ctx.stroke();

  // Tagline
  ctx.fillStyle = MUTED;
  ctx.font = "italic 400 17px Georgia,serif";
  const lines = wrapText(ctx, opts.tagline, W * 0.72);
  const lineH = 26;
  const tagY = 610;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, tagY + i * lineH);
  });

  // usunse.com
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "400 12px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("USUNSE.COM", cx, 828);
  ctx.letterSpacing = "0";
}
