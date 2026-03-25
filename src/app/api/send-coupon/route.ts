import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, code, expiresAt } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Email service not configured — skip silently
    return NextResponse.json({ ok: true });
  }

  const expiry = new Date(expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = `
    <div style="background:#0a0a0f;color:#e2e8f0;font-family:system-ui,sans-serif;padding:40px;max-width:480px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:24px;font-weight:900;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">US<br/>NE</span>
      </div>
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Your 30% off code</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Thanks for sharing your UsUnse result. Here's your discount:</p>
      <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;letter-spacing:4px;background:linear-gradient(135deg,#c084fc,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${code}</span>
        <p style="color:#6b7280;font-size:12px;margin-top:8px;">Expires ${expiry}</p>
      </div>
      <p style="color:#6b7280;font-size:12px;">Apply this code at checkout for any $10 reading. One use only.</p>
      <p style="color:#3d3d4d;font-size:11px;margin-top:32px;">UsUnse · <a href="https://usunse.com" style="color:#3d3d4d;">usunse.com</a></p>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UsUnse <noreply@usunse.com>",
        to: [email],
        subject: "Your UsUnse discount code",
        html,
      }),
    });
  } catch {
    // Don't fail the request if email fails
  }

  return NextResponse.json({ ok: true });
}
