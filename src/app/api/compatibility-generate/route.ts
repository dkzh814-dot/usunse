import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getCompatibilityResult, compatDocId } from "@/lib/compatibility";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { name1, dob1, name2, dob2, email } = await req.json();

    if (!dob1 || !dob2) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // TODO: re-enable Stripe verification before launch
    // const session = await stripe.checkout.sessions.retrieve(sessionId);
    // if (session.payment_status !== "paid") {
    //   return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
    // }

    const { rawScore, percentage, type, hook } = getCompatibilityResult(dob1, dob2);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: "You write short, precise compatibility readings for a modern astrology product. Your tone is like a wise friend — warm, direct, a little literary. You never use generic romance advice.",
      messages: [{
        role: "user",
        content: `${name1} and ${name2} received a compatibility reading: ${percentage}% — ${type}.
Hook shown to them: "${hook}"

Write exactly 4 short paragraphs expanding on this reading.
Total 100–140 words across all 4 paragraphs.
Each paragraph is 1–2 sentences.
Use their names naturally.
Do not mention elements (Wood, Fire, Earth, Metal, Water), saju, pillars, or astrology terms.
Do not repeat the hook word for word.
Make both people feel specifically seen — not generic.
No clichés. No "journey" or "balance" or "energy".`,
      }],
    });

    const claudeBody =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Save to Firestore (best-effort)
    if (email) {
      try {
        const docId = compatDocId(email, dob1, dob2);
        await setDoc(doc(db, "compatibility_results", docId), {
          email,
          name1: name1 || "", dob1,
          name2: name2 || "", dob2,
          rawScore, percentage, type, hook,
          claudeBody,
          createdAt: serverTimestamp(),
        });
      } catch { /* don't block */ }
    }

    return NextResponse.json({ percentage, type, hook, claudeBody });
  } catch (err) {
    console.error("Compatibility generate error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
