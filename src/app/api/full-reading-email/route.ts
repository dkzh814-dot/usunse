import { NextRequest, NextResponse } from "next/server";

const CARD_TITLES = ["Your Chart", "Who You Are", "Love", "Work & Talent", "Money", "How You Thrive"];

export async function POST(req: NextRequest) {
  try {
    const { email, name, cards }: { email: string; name: string; cards: (string | null)[] } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ ok: true });
    }

    const cardSections = cards
      .slice(1)
      .map((text, i) => {
        if (!text) return "";
        return `<h2 style="font-size:16px;font-weight:700;color:#e2e8f0;margin:32px 0 8px;">${CARD_TITLES[i + 1]}</h2>\n${text
          .split(/\n\n+/)
          .filter(Boolean)
          .map(p => `<p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 12px;">${p}</p>`)
          .join("\n")}`;
      })
      .filter(Boolean)
      .join("\n");

    const html = `
<div style="background:#0a0a0f;color:#e2e8f0;font-family:system-ui,sans-serif;padding:40px 24px;max-width:560px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:20px;font-weight:900;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">USUNSE</span>
  </div>
  <h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">${name}'s Full Destiny Reading</h1>
  <p style="color:#6b7280;font-size:13px;margin-bottom:32px;">Your complete chart reading from UsUnse.</p>
  ${cardSections}
  <hr style="border:none;border-top:1px solid #1e1e2e;margin:40px 0 24px;" />
  <p style="color:#3d3d4d;font-size:11px;">UsUnse · <a href="https://usunse.com" style="color:#3d3d4d;">usunse.com</a></p>
</div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UsUnse <noreply@usunse.com>",
        to: [email],
        subject: `${name}'s Full Destiny Reading — UsUnse`,
        html,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Full reading email error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
