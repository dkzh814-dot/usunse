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

// ── Energy color card ─────────────────────────────────────────────────────────

interface EnergyColorDrawOptions {
  color: string;
  name: string;
  firstSentence: string;
}

export function drawEnergyColorCard(canvas: HTMLCanvasElement, opts: EnergyColorDrawOptions): void {
  const W = 540;
  const H = 960;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;
  const cx = W / 2;

  // Background: flat color
  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, W, H);

  // Dark overlay for text legibility
  ctx.fillStyle = "rgba(0,0,0,0.50)";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow using the color itself
  const glow = ctx.createRadialGradient(cx, H * 0.42, 0, cx, H * 0.42, 300);
  glow.addColorStop(0, `${opts.color}55`);
  glow.addColorStop(1, `${opts.color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Logo
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "900 18px system-ui,-apple-system,sans-serif";
  ctx.fillText("US", cx, 170);
  ctx.fillText("NE", cx, 196);

  // Color circle
  ctx.beginPath();
  ctx.arc(cx, 390, 88, 0, 2 * Math.PI);
  ctx.fillStyle = opts.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // "Your energy color" label
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "400 13px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.13em";
  ctx.fillText("YOUR ENERGY COLOR", cx, 530);
  ctx.letterSpacing = "0";

  // Color name
  ctx.fillStyle = "#ffffff";
  const nameSize = opts.name.length > 12 ? 42 : 50;
  ctx.font = `900 ${nameSize}px system-ui,-apple-system,sans-serif`;
  ctx.fillText(opts.name, cx, 590);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 50, 630);
  ctx.lineTo(cx + 50, 630);
  ctx.stroke();

  // First sentence
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "italic 400 16px Georgia,serif";
  const lines = wrapText(ctx, opts.firstSentence, W * 0.72);
  const lineH = 25;
  const textY = 668;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, textY + i * lineH);
  });

  // usunse.com
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "400 12px system-ui,-apple-system,sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("USUNSE.COM", cx, 828);
  ctx.letterSpacing = "0";
}

// ── Five Elements card ────────────────────────────────────────────────────────

interface FiveElementsDrawOptions {
  name: string;
  counts: Record<string, number>;
  dominant: string[];
  missing: string[];
}

export function drawFiveElementsCard(canvas: HTMLCanvasElement, opts: FiveElementsDrawOptions): void {
  const W = 540;
  const H = 960;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;
  const cx = W / 2;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0a0a0f");
  bgGrad.addColorStop(0.5, "#12121a");
  bgGrad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Glow
  const glow = ctx.createRadialGradient(cx, 220, 0, cx, 220, 280);
  glow.addColorStop(0, "rgba(192,132,252,0.16)");
  glow.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H / 2);

  ctx.textBaseline = "middle";

  // Logo
  ctx.textAlign = "center";
  ctx.fillStyle = "#c084fc";
  ctx.font = "900 18px system-ui,-apple-system,sans-serif";
  ctx.fillText("US", cx, 170);
  ctx.fillText("NE", cx, 196);

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "700 22px system-ui,-apple-system,sans-serif";
  ctx.fillText("My Five Elements", cx, 285);

  // Name
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = "400 15px system-ui,-apple-system,sans-serif";
  ctx.fillText(opts.name, cx, 316);

  // Bar chart
  const ROWS = [
    { key: "wood",  korean: "목", english: "Wood",  color: "#6BCB77" },
    { key: "fire",  korean: "화", english: "Fire",  color: "#FF6B6B" },
    { key: "earth", korean: "토", english: "Earth", color: "#D4A96A" },
    { key: "metal", korean: "금", english: "Metal", color: "#C0C0C0" },
    { key: "water", korean: "수", english: "Water", color: "#4A90D9" },
  ];

  const allCounts = ROWS.map(r => opts.counts[r.key] ?? 0);
  const maxCount = Math.max(...allCounts, 1);
  const BAR_LEFT = 188;
  const BAR_MAX  = 210;
  const BAR_H    = 13;
  const FIRST_Y  = 425;
  const ROW_H    = 72;

  for (let i = 0; i < ROWS.length; i++) {
    const row   = ROWS[i];
    const count = opts.counts[row.key] ?? 0;
    const barW  = (count / maxCount) * BAR_MAX;
    const y     = FIRST_Y + i * ROW_H;

    // Korean char
    ctx.textAlign = "center";
    ctx.fillStyle = row.color;
    ctx.font = "bold 17px system-ui,-apple-system,sans-serif";
    ctx.fillText(row.korean, 44, y);

    // English name
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.font = "400 13px system-ui,-apple-system,sans-serif";
    ctx.fillText(row.english, 68, y);

    // Track
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(BAR_LEFT, y - BAR_H / 2, BAR_MAX, BAR_H);

    // Fill
    if (barW > 0) {
      ctx.fillStyle = row.color + "bb";
      ctx.fillRect(BAR_LEFT, y - BAR_H / 2, barW, BAR_H);
    }

    // Count
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "bold 15px system-ui,-apple-system,sans-serif";
    ctx.fillText(String(count), BAR_LEFT + BAR_MAX + 28, y);

    // Badge
    ctx.textAlign = "left";
    if (opts.dominant.includes(row.key)) {
      ctx.fillStyle = "#EAB308";
      ctx.font = "bold 13px system-ui,-apple-system,sans-serif";
      ctx.fillText("★", BAR_LEFT + BAR_MAX + 38, y);
    } else if (opts.missing.includes(row.key)) {
      ctx.fillStyle = "#EF4444";
      ctx.font = "bold 13px system-ui,-apple-system,sans-serif";
      ctx.fillText("✕", BAR_LEFT + BAR_MAX + 38, y);
    }
  }

  // usunse.com
  ctx.textAlign = "center";
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
