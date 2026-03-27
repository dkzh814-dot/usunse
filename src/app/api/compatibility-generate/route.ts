import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCompatibilityResult } from "@/lib/compatibility";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { name1, dob1, name2, dob2 } = await req.json();

    if (!dob1 || !dob2) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // TODO: re-enable Stripe verification before launch
    // const session = await stripe.checkout.sessions.retrieve(sessionId);
    // if (session.payment_status !== "paid") {
    //   return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
    // }

    const { percentage, type, hook } = getCompatibilityResult(dob1, dob2);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: "You are writing a compatibility reading for UsUnse, a Korean astrology service. Tone: magazine column. Warm, specific, human. Short punchy sentences. Never use Saju or astrology terminology. Never mention elements (Wood, Fire, Earth, Metal, Water). Never be vague or abstract. Every sentence must describe a concrete situation or behavior. Do not write a hook line. Do not write a title. Start directly with paragraph 1.",
      messages: [{
        role: "user",
        content: `Person 1: ${name1}
Person 2: ${name2}
Compatibility: ${type} — ${percentage}%

Write exactly 4 paragraphs. Plain text only — no headers, no bullet points, no bold.

Paragraph 1 — What happens when ${name1} and ${name2} are in the same room. Describe the specific atmosphere they create together. What a third person walking in would notice. What shifts. Be concrete, not abstract.

Paragraph 2 — How ${name1} behaves around ${name2}. How ${name1} is different in ${name2}'s presence compared to everyone else. What ${name1} does without realizing it — a habit, a pattern, something unconscious.

Paragraph 3 — How ${name2} behaves around ${name1}. How ${name2} is different in ${name1}'s presence compared to everyone else. What ${name2} does without realizing it — a habit, a pattern, something unconscious.

Paragraph 4 — The nature of this relationship in one sentence. Then end with a tagline in quotation marks.

Rules:
- Each paragraph: 2–4 sentences
- Total: 120–160 words
- No sentence may start with 'They'
- Never use the words: connection, energy, vibe, compatibility, balance, journey
- Make ${name1} and ${name2} feel like real specific people, not archetypes`,
      }],
    });

    const claudeBody =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ percentage, type, hook, claudeBody });
  } catch (err) {
    console.error("Compatibility generate error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
