// Repel type calculation — 3 pillars (Year, Month, Day) only.
// Counts stem + branch element for each pillar = 6 characters total.

import { getYearPillar, getMonthPillar, getDayPillar, lichunSajuYear, lichunSajuMonth, Element } from "./saju";

const BRANCH_ELEMENTS: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

// Opposite element for tie-breaking (earth has no single opposite → use wood)
const OPPOSITE: Record<Element, Element> = {
  wood: "metal", metal: "wood",
  fire: "water", water: "fire",
  earth: "wood",
};

export interface RepelType {
  name: string;
  tagline: string;
}

export const REPEL_TYPES: Record<string, RepelType> = {
  "fire-wood":   { name: "The Hollow Flame",    tagline: "Burning bright with nothing left to feed on." },
  "water-fire":  { name: "The Cold Mirror",      tagline: "Reflects everything. Feels nothing." },
  "metal-earth": { name: "The Floating Blade",   tagline: "Sharp without roots. Dangerous without knowing it." },
  "wood-metal":  { name: "The Restless Vine",    tagline: "Grows toward everything. Can't be pruned." },
  "earth-water": { name: "The Dry Shore",        tagline: "Solid ground that never lets anything sink in." },
  "fire-water":  { name: "The Spark",            tagline: "Lights up rooms. Burns through people." },
  "water-earth": { name: "The Deep Current",     tagline: "Moves without a bottom. Pulls without warning." },
  "metal-wood":  { name: "The Edge",             tagline: "Precision that doesn't know when to stop cutting." },
  "wood-fire":   { name: "The Unlit Match",      tagline: "Full of potential that never quite ignites." },
  "earth-metal": { name: "The Soft Wall",        tagline: "Immovable. Absorbs everything. Gives nothing back." },
  "fire-earth":  { name: "The Wildfire",         tagline: "Transforms everything it touches. Leaves ash." },
  "water-metal": { name: "The Undertow",         tagline: "Gentle on the surface. Pulls you under." },
  "metal-fire":  { name: "The Cold Front",       tagline: "Arrives and the temperature drops." },
  "wood-water":  { name: "The Canopy",           tagline: "Shelters everyone. Asks for nothing. Resents it quietly." },
  "earth-fire":  { name: "The Slow Burn",        tagline: "Takes forever to heat up. Never fully cools down." },
  "earth-wood":  { name: "The Plateau",          tagline: "Stable, wide, and going nowhere." },
  "wood-earth":  { name: "The Overcrowded Root", tagline: "Needs more space than it will ever ask for." },
  "fire-metal":  { name: "The Flare",            tagline: "Intense, brief, leaves a mark." },
  "water-wood":  { name: "The Fog",              tagline: "Everywhere, quietly, until suddenly it isn't." },
  "metal-water": { name: "The Current Breaker",  tagline: "Stands firm while everything flows around it." },
};

export const REPEL_COPY: Record<string, string> = {
  "fire-wood":   "You give everything in the early stages — your time, your attention, your best ideas of who you could be together — and somehow it still feels like it's never quite enough. The person you keep choosing is brilliant and consuming, but they don't actually replenish you; they just make you feel like needing replenishment is the problem. What you actually want is someone who brings their own fuel instead of borrowing yours.",
  "water-fire":  "You find yourself drawn to people who seem to understand you completely, until you realize they've just been reflecting your own energy back at you the whole time. The intimacy felt real because you were so present — but presence was only ever coming from one direction. What you're actually looking for is someone who shows up with their own warmth instead of borrowing yours.",
  "metal-earth": "You're attracted to people who seem precise and certain in a way you find grounding — they always know what they think, what they want, what's wrong with everyone else. The problem is that certainty without stability is just confidence with nowhere to land, and eventually it lands on you. What you need isn't someone who has all the answers, but someone who's willing to stay in the question with you.",
  "wood-metal":  "You keep ending up with people who are always becoming something — new project, new phase, new version of themselves — and for a while that energy feels like possibility. But possibility without direction eventually just becomes noise, and you're the one left holding the structure while they keep reaching for the next thing. You don't need someone with fewer ambitions; you need someone who can also be still.",
  "earth-water": "You're drawn to people who feel steady and reliable, which makes complete sense until you realize that what you mistook for depth was just density — they're not grounded, they're sealed. Every conversation eventually hits the same wall, the same practiced response, the same careful distance dressed up as calm. What you're actually craving is someone whose stillness comes from security, not from keeping everything out.",
  "fire-water":  "You're the one who mistakes intensity for intimacy — they arrive like a power surge, everything feels electric and inevitable, and you reorganize your whole life around that feeling before you've even noticed. The problem isn't that you fall for them; it's that part of you already knows they're going to leave, and somewhere underneath the panic, you find that exciting. What you actually want is someone who chooses you slowly and keeps choosing you, which is terrifying because you've never quite believed that's available to you.",
  "water-earth": "You keep choosing people who seem calm on the surface but turn out to have no real floor — every time you think you've understood them, there's another layer, another undercurrent, another thing they forgot to mention. It's not that you mind depth; it's that depth without stability means you're always the one doing the anchoring. You need someone whose complexity has a shape you can actually hold.",
  "metal-wood":  "You're drawn to people who are direct and clear in a way that feels like honesty, until you realize that what they're being honest about is mostly everyone's failures, including yours. The sharpness felt like clarity at first — finally someone who just says the thing — but clarity without warmth is just criticism with good posture. What you need is someone who sees you accurately and still decides you're worth staying for.",
  "wood-fire":   "You keep falling for people who are full of what's about to happen — the project they're starting, the person they're becoming, the life that's just around the corner — and you invest in that future version of them before the present one has shown up. The potential is real, which is what makes it so hard to leave; you're not wrong that there's something there, you're just the only one doing anything about it. What you're looking for is someone whose potential is already in motion, not still waiting for the right conditions.",
  "earth-metal": "You're attracted to people who seem accepting and easy to be around, which they are — until you need something back and realize that their openness was never actually about you. They absorb whatever you bring without resistance and without response, which feels like safety until it starts to feel like talking into a room with no echo. What you actually need is someone whose steadiness is active, not just the absence of conflict.",
  "fire-earth":  "You're drawn to people who make everything feel urgent and alive — every conversation is significant, every moment has weight, and for a while you feel more real around them than you do anywhere else. The transformation is genuine; you do change, you do grow, you do become someone slightly different. What nobody tells you is that wildfires don't stay — they move to the next thing that needs burning, and you're left figuring out what to do with all that changed terrain.",
  "water-metal": "You keep meeting people who seem easygoing and fluid, low-maintenance, the kind of person who says they're fine with everything — until suddenly you're three months in and you've quietly reshaped your entire life around their needs without a single explicit conversation about it. It happens so gradually that by the time you notice, it feels rude to name it. What you need is someone whose gentleness is transparent, not a current you only feel once you're already moving with it.",
  "metal-fire":  "You're attracted to people who have an atmosphere — you can feel them coming before they walk in, and when they do, something in the room rearranges itself. That kind of presence feels like power, and for a while being close to it feels like power too. But a cold front doesn't warm up for anyone; it just keeps moving, and eventually you realize you've been bracing instead of breathing. What you're actually drawn to is intensity — you just need it to run warm, not cold.",
  "wood-water":  "You keep falling for people who are generous and capable and always fine, the ones who hold space for everyone around them without ever seeming to need anything back — which feels like strength until you realize it's a very organized way of never being vulnerable. You can feel the resentment underneath, quiet and old, but they'll never name it and neither will you because the whole dynamic runs on not naming things. What you need is someone who can actually ask.",
  "earth-fire":  "You're drawn to people who take a long time to open up, which you interpret as depth, and you're patient because the eventual warmth feels earned and therefore real. The problem is that what takes forever to arrive also takes forever to leave — their feelings don't resolve, they just go underground, and you spend years managing an emotional climate that was never quite yours to manage. What you're looking for is someone whose warmth is available, not rationed.",
  "earth-wood":  "You keep choosing people who feel like solid ground — dependable, consistent, no surprises — and for a while that reliability feels like exactly what you needed after whatever came before. But reliability without direction is just inertia with good manners, and eventually you realize you've both stopped moving and neither of you quite knows how to say it. What you need isn't less stability; you need stability that's still choosing to go somewhere.",
  "wood-earth":  "You're attracted to people who seem self-contained and low-maintenance, which they almost are — except that their need for space is so constant and so large that it quietly becomes the organizing principle of the whole relationship. They never ask directly, which means you spend a lot of energy trying to intuit the right distance, getting it wrong, and adjusting. What you need is someone whose independence doesn't require you to disappear.",
  "fire-metal":  "You fall for people who arrive with complete conviction — they know what they want, they want you, and for a specific window of time that certainty feels like the most real thing that's ever happened. Then the window closes, not dramatically, just conclusively, and you're left holding something that felt permanent three weeks ago. The mark is real; the problem is you keep mistaking the intensity of the impression for the depth of the connection.",
  "water-wood":  "You keep ending up with people who are present in a diffuse, atmospheric way — always around, always warm, never quite fully there — and the relationship accumulates meaning the way fog accumulates, which is to say gradually and then all at once. When it lifts, and it always lifts, you're surprised by how much you'd organized around something you could never quite hold. What you're actually looking for is someone whose presence has edges.",
  "metal-water": "You're drawn to people who don't move — who hold their position while everything shifts around them, and whose consistency feels like a kind of loyalty. But something that never moves also never comes toward you, and eventually you realize you've done all the flowing while they've just stood there being consistent. What you need isn't someone who stays; you need someone who stays and also reaches.",
};

export function getRepelCopy(key: string): string {
  return REPEL_COPY[key] ?? REPEL_COPY[Object.keys(REPEL_COPY).find(k => k.startsWith(key.split("-")[0] + "-"))!] ?? "";
}

export interface RepelResult {
  repelType: RepelType;
  dominantElement: Element;
  missingElement: Element;
  key: string;
}

export function getRepelResult(year: number, month: number, day: number): RepelResult {
  const sajuYear = lichunSajuYear(year, month, day);
  const sajuMonth = lichunSajuMonth(month, day);
  const yearPillar  = getYearPillar(sajuYear);
  const monthPillar = getMonthPillar(sajuYear, sajuMonth);
  const dayPillar   = getDayPillar(year, month, day);

  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const p of [yearPillar, monthPillar, dayPillar]) {
    counts[p.element]++;
    const branchEl = BRANCH_ELEMENTS[p.earthlyBranch];
    if (branchEl) counts[branchEl]++;
  }

  const elements: Element[] = ["wood", "fire", "earth", "metal", "water"];
  const dominant = elements.reduce((a, b) => counts[a] >= counts[b] ? a : b);

  const zeros = elements.filter(e => counts[e] === 0);
  let missing: Element;
  if (zeros.length === 1) {
    missing = zeros[0];
  } else if (zeros.length > 1) {
    const opp = OPPOSITE[dominant];
    missing = zeros.includes(opp) ? opp : zeros[0];
  } else {
    const sorted = [...elements].sort((a, b) => counts[a] - counts[b]);
    missing = sorted[0] === dominant ? sorted[1] : sorted[0];
  }

  const key = `${dominant}-${missing}`;
  const repelType =
    REPEL_TYPES[key] ??
    REPEL_TYPES[Object.keys(REPEL_TYPES).find(k => k.startsWith(dominant + "-"))!];

  return { repelType, dominantElement: dominant, missingElement: missing, key };
}
