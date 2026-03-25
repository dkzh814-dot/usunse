import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { typeName, tagline } = await req.json();

    if (!typeName) {
      return new Response(JSON.stringify({ error: "Missing typeName" }), { status: 400 });
    }

    const systemPrompt = `You are writing result copy for UsUnse, a Saju-based fortune app for global K-pop fans.
Voice: magazine column meets therapist who's slightly too perceptive.
Warm but unsettling. The reader should feel seen in a way that's almost uncomfortable.
HARD RULE: never use the words Wood, Fire, Earth, Metal, Water, ohaeng, saju,
element, pillar, stem, branch, or any fortune-telling terminology whatsoever.`;

    const userPrompt = `Write exactly 3 sentences for someone whose repel type is ${typeName} — '${tagline ?? ""}'.

Sentence 1: Describe a specific behavior or pattern this person does —
something concrete and recognizable, not abstract.
Use 'you' directly. Make it feel like you've been watching them.

Sentence 2: Explain the psychological reason this keeps happening —
why they keep attracting this dynamic even when they know better.
Honest, not harsh. Specific, not generic.

Sentence 3: Name what they actually want underneath it —
reframe the pattern as something that reveals a real need.
End on something that feels like insight, not damage.

Rules:
- No fortune-telling words (Wood, Fire, Earth, Metal, Water, ohaeng, element, etc.)
- No bullet points, no headers, no labels like "Sentence 1:"
- Do not mention the type name ${typeName} anywhere in the copy
- Each sentence must be at least 20 words — do not write short sentences
- Total output should be 3 full, rich sentences. Do not cut it short.
- The reader must finish and think 'how did it know that'`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Repel API error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
