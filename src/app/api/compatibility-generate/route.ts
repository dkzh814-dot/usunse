import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Anthropic from "@anthropic-ai/sdk";
import { getCompatibility } from "@/lib/compatibility";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name1, dob1, name2, dob2 } = await req.json();

    if (!sessionId || !dob1 || !dob2) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
    }

    const { score, hook } = getCompatibility(dob1, dob2);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: "You are continuing a compatibility reading that has already started.",
      messages: [{
        role: "user",
        content: `Hook line shown to user: "${hook}"
Compatibility score: ${score}%
Person 1: ${name1 || "Person 1"}, Person 2: ${name2 || "Person 2"}

Write 3-4 sentences expanding on this hook.
Magazine column tone. Warm, specific, human. No jargon.
Never mention elements (Wood, Fire, Earth, Metal, Water). No Saju terminology.
Make them feel seen.`,
      }],
    });

    const claudeBody =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ score, hook, claudeBody });
  } catch (err) {
    console.error("Compatibility generate error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
