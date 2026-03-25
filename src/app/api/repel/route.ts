import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { typeName } = await req.json();

    if (!typeName) {
      return new Response(JSON.stringify({ error: "Missing typeName" }), { status: 400 });
    }

    const systemPrompt = `You are writing short result copy for UsUnse, a Saju-based fortune app for global K-pop fans.
Voice: magazine column. Warm, a little unsettling, perceptive.
HARD RULE: never use the words Wood, Fire, Earth, Metal, Water, ohaeng, saju,
element, pillar, stem, branch, or any fortune-telling terminology whatsoever.`;

    const userPrompt = `Write 2-3 sentences for someone whose repel type is ${typeName}.
This copy explains why they magnetically attract this type of person into their life,
even when it drains them.
Be specific and psychological — not vague or generic.
No bullet points. No headers. Speak directly to the reader as "you".
Do not mention the type name itself in the copy.`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
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
