import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are writing a personal destiny reading for someone who has paid for a premium experience. Style: magazine column. Short punch line first, then expand. Zero saju terminology visible to the reader. No element names (Wood, Fire, Earth, Metal, Water). No Chinese characters. No bullet points. No headers. Make them feel seen. The reader should think 'this is exactly me' after every paragraph.`;

function buildUserPrompt(cardIndex: number, name: string, sajuJson: string): string {
  switch (cardIndex) {
    case 1:
      return `Here is the full saju analysis data: ${sajuJson}. The person's name is ${name}. Write 4 paragraphs about who this person fundamentally is. Paragraph 1: open with a scene or situation that captures this person's core energy — never start with 'You are a person who'. Use the day stem temperament, chart strength level, and ruling element pattern to determine the core. Paragraph 2: when this energy becomes a strength — use positive 신살 and strong 12운성 positions. Paragraph 3: when this same energy becomes too much — frame as 'when this force loses direction' not as a weakness. Paragraph 4: one sentence that cuts to the core of who this person is, based on the yongshin. This sentence must make the reader nod. Each paragraph is 2 to 3 sentences. No saju terms visible.`;

    case 2:
      return `Here is the full saju analysis data: ${sajuJson}. The person's name is ${name}. Write 4 paragraphs about this person in love and relationships. Paragraph 1: open with one precise pattern this person has in relationships — include both what draws people to them and what complicates things, so it feels accurate not flattering. Use 관성 distribution, 일지, and 도화살/홍염살 presence. Paragraph 2: the specific moment this person shines in a relationship — write in concrete scenes, not abstract traits, never use words like 'warm' or 'caring' alone. Paragraph 3: the pattern this person repeats in love — frame as habit not flaw, use 합충 results if relevant. Paragraph 4: the energy of the partner who brings out the best in this person — describe by behavior and quality only, no element names. Each paragraph 2 to 3 sentences.`;

    case 3:
      return `Here is the full saju analysis data: ${sajuJson}. The person's name is ${name}. Write 4 paragraphs about this person's talents and work life. Paragraph 1: open with the nature of their talent, then name 1 to 2 broad career directions (from: creative fields, strategy and analysis, people and communication, building and executing, research and depth) — connect the direction to the talent in one sentence so it does not feel like a list. Use 식상 distribution, 관성, and 격국. Paragraph 2: the environment where this person thrives at work — reflect 역마살 if present as need for variety and movement, reflect chart strength as need for autonomy or collaboration. Paragraph 3: the environment that quietly shrinks this person — frame as 'this environment is simply not built for how you work', never say avoid. Paragraph 4: one sentence on the success condition for this person right now, reflecting the current 대운 phase. Each paragraph 2 to 3 sentences.`;

    case 4:
      return `Here is the full saju analysis data: ${sajuJson}. The person's name is ${name}. Write 4 paragraphs about this person's relationship with money. Paragraph 1: open with how this person naturally relates to money — start positive and precise, use 재성 distribution and chart strength. Paragraph 2: how money comes to this person — what situations and what modes, reflect 식상 to 재성 flow if present as talent converting to income, use 용신 direction. Paragraph 3: how money leaves this person — describe as a behavioral pattern rooted in their nature, never use words like impulsive or wasteful, use 기신 and relevant 신살. Paragraph 4: one sentence on whether this is a time to accumulate or a time to invest and move, based on current 대운. Each paragraph 2 to 3 sentences.`;

    case 5:
      return `Here is the full saju analysis data: ${sajuJson}. The person's name is ${name}. Write 4 paragraphs about the conditions in which this person truly flourishes. This is the final card — it should feel like a conclusion that gathers everything, not a new chapter. Paragraph 1: the conditions — environment, type of people, situations — where this person fully comes alive, based on 용신 and 희신. Echo themes from who they are and how they work without repeating exact ideas. Paragraph 2: what quietly drains this person — based on 기신, frame as 'this is simply not your way' not as warning. Paragraph 3: a physical and energetic portrait of this person's constitution — based on five element distribution but with zero element terminology, describe as bodily tendencies and energy rhythms (how fast energy rises, how they recover, what they are sensitive to), reflect 12운성 병 or 쇠 if present in recovery pattern. Paragraph 4: the final sentence of the entire reading. This sentence must resonate with the opening punch line of card 2. The reader should feel 'yes, that is exactly who I am' and be ready to close. Anchor it in the current 대운 phase — where this person stands in time right now. Each paragraph 2 to 3 sentences. This is the most important paragraph in the entire reading.`;

    default:
      return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cardIndex, name, sajuJson } = await req.json();

    if (!cardIndex || cardIndex < 1 || cardIndex > 5 || !name || !sajuJson) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: buildUserPrompt(cardIndex, name, sajuJson),
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Full reading card error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
