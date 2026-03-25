import { getRepelResult } from "./repel";

export interface EnergyColorResult {
  key: string;
  color: string;
  name: string;
  desc: string;
}

const COLOR_TABLE: Record<string, Omit<EnergyColorResult, "key">> = {
  "fire-wood":   { color: "#FF6B6B", name: "Ember Red",      desc: "Intense and consuming. You draw people in like heat — they don't always know they're too close until they feel it." },
  "water-fire":  { color: "#4A90D9", name: "Deep Blue",       desc: "Still on the surface, everything happening underneath. People mistake your calm for distance." },
  "metal-earth": { color: "#C0C0C0", name: "Silver",          desc: "Sharp, precise, weightless. You cut through noise effortlessly — but sometimes cut too clean." },
  "wood-metal":  { color: "#6BCB77", name: "Verdant Green",   desc: "Growing in every direction at once. You fill the room without trying. Pruning is hard." },
  "earth-water": { color: "#D4A96A", name: "Desert Sand",     desc: "Warm and wide and enduring. You hold people up. You rarely let anything sink in." },
  "fire-water":  { color: "#FF4500", name: "Wildfire Orange", desc: "Brilliant and fast. You transform every space you enter. Not always gently." },
  "water-earth": { color: "#1B4F72", name: "Midnight Navy",   desc: "Deeper than anyone expects. You move in currents that surface without warning." },
  "metal-wood":  { color: "#A8A8A8", name: "Ash Gray",        desc: "Refined and exact. You see what others miss. You also see what others wish you hadn't." },
  "wood-fire":   { color: "#8BC34A", name: "Sage",            desc: "Full of quiet potential. You're the match waiting for the right spark — not just any spark." },
  "earth-metal": { color: "#C8A96E", name: "Warm Clay",       desc: "Grounding and generous. You absorb everything around you. Sometimes too much." },
  "fire-earth":  { color: "#E84393", name: "Magenta",         desc: "Transformative and vivid. You change things just by being near them. What grows back is different." },
  "water-metal": { color: "#5B8DB8", name: "Storm Blue",      desc: "Gentle pressure, immense force. You wear down what others can't break." },
  "metal-fire":  { color: "#B0BEC5", name: "Frost",           desc: "Precise and cool. You arrive and the room recalibrates. Not everyone can keep up." },
  "wood-water":  { color: "#4CAF50", name: "Forest Green",    desc: "Shelter for everyone. You give shade without asking for sun. The resentment is quiet." },
  "earth-fire":  { color: "#CD853F", name: "Amber",           desc: "Slow-building and lasting. Once you're warm, you stay warm. Once you decide, you don't undecide." },
  "earth-wood":  { color: "#A0785A", name: "Sienna",          desc: "Wide and stable and certain. You offer ground. You are also sometimes the ceiling." },
  "wood-earth":  { color: "#558B2F", name: "Moss",            desc: "Persistent and quiet. You need more room than you'll ever say out loud." },
  "fire-metal":  { color: "#FF8C00", name: "Flame",           desc: "Brief and brilliant. You leave a mark. The mark outlasts the moment." },
  "water-wood":  { color: "#7FDBFF", name: "Mist",            desc: "Everywhere and nowhere. You create atmosphere. People feel you before they see you." },
  "metal-water": { color: "#90A4AE", name: "Steel",           desc: "Firm where everything else bends. You hold the current without moving. That's rarer than it sounds." },
};

export function getEnergyColorResult(year: number, month: number, day: number): EnergyColorResult {
  const { key } = getRepelResult(year, month, day);
  const entry = COLOR_TABLE[key] ?? COLOR_TABLE[Object.keys(COLOR_TABLE).find(k => k.startsWith(key.split("-")[0] + "-"))!];
  return { key, ...entry };
}

export function firstSentence(desc: string): string {
  const dot = desc.indexOf(". ");
  return dot !== -1 ? desc.slice(0, dot + 1) : desc;
}
