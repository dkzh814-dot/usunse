import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { calculateFourPillars, countElements } from "@/lib/saju";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { name, dob, hour, tier, targetDob } = await req.json();

    if (!dob) {
      return new Response(JSON.stringify({ error: "Missing birth date" }), { status: 400 });
    }

    const [y, m, d] = dob.split("-").map(Number);
    const hourNum = hour ? parseInt(hour) : undefined;
    const pillars = calculateFourPillars(y, m, d, hourNum);
    const elements = countElements(pillars);

    let systemPrompt = "";
    let userPrompt = "";

    if (tier === "fiveElements") {
      systemPrompt = `You are a master Korean Saju astrologer writing in an elegant magazine tone — short punchy hook first, then 2-3 sentences of insight. Never use the words Wood, Fire, Earth, Metal, or Water. Never mention 10-year luck cycles or monthly forecasts. Write in second person. Be poetic but grounded.`;
      userPrompt = `Analyze this person's elemental chart. Their name is ${name}.
Four Pillars:
- Year: ${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}
- Month: ${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}
- Day: ${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}
${pillars.hour ? `- Hour: ${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}` : ""}

Element distribution (internal use, do NOT name them): ${JSON.stringify(elements)}

Write a 3-paragraph analysis. First paragraph: a single punchy hook sentence about who they are. Second: their core energy and how they move through the world. Third: their relationship with others and what makes them magnetic.`;
    } else if (tier === "compatibility" && targetDob) {
      const [ty, tm, td] = targetDob.split("-").map(Number);
      const targetPillars = calculateFourPillars(ty, tm, td);

      systemPrompt = `You are a master Korean Saju astrologer. Magazine tone — hook first, then depth. Never use the words Wood, Fire, Earth, Metal, or Water. Never mention 10-year luck cycles. Write directly to the user.`;
      userPrompt = `Analyze compatibility between two people.

Person 1 (${name}): ${pillars.year.heavenlyStem}${pillars.year.earthlyBranch} ${pillars.month.heavenlyStem}${pillars.month.earthlyBranch} ${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}
Person 2: ${targetPillars.year.heavenlyStem}${targetPillars.year.earthlyBranch} ${targetPillars.month.heavenlyStem}${targetPillars.month.earthlyBranch} ${targetPillars.day.heavenlyStem}${targetPillars.day.earthlyBranch}

Write 3 short paragraphs: (1) The overall energy between them in one punchy sentence, (2) where they naturally align, (3) where the tension lives and what it creates.`;
    } else if (tier === "fullReading") {
      systemPrompt = `You are a master Korean Saju astrologer writing a full life reading. Magazine tone. Never use the words Wood, Fire, Earth, Metal, or Water. Never mention monthly breakdowns. Write in second person, directly to ${name}.`;
      userPrompt = `Full Saju life reading for ${name}.
Four Pillars:
- Year: ${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}
- Month: ${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}
- Day: ${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}
${pillars.hour ? `- Hour: ${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}` : ""}

Write 5 sections with short headers:
1. Who You Are (core identity, 2-3 sentences)
2. How You Love (relationship patterns, 2-3 sentences)
3. Your Work Energy (career strengths, 2-3 sentences)
4. Where You Struggle (honest, compassionate, 2-3 sentences)
5. Your Path Forward (empowering close, 2-3 sentences)

Keep each section tight and magazine-worthy.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid tier" }), { status: 400 });
    }

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
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
    console.error("Analyze error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
    });
  }
}
