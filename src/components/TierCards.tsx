"use client";

import { useState } from "react";

const TIERS = [
  {
    id: "fiveElements",
    emoji: "🔮",
    title: "Five Elements Analysis",
    price: "$1",
    hook: "Your elemental blueprint, decoded.",
    features: [
      "Full elemental breakdown",
      "Claude AI streaming narrative",
      "What your chart reveals about you",
    ],
    cta: "Unlock for $1",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    id: "compatibility",
    emoji: "💞",
    title: "Detailed Compatibility",
    price: "$1",
    hook: "Check anyone — a crush, a friend, a rival.",
    features: [
      "Input any person's birth date",
      "Full compatibility breakdown",
      "No idol list — your real people",
    ],
    cta: "Unlock for $1",
    gradient: "from-pink-600 to-rose-600",
  },
  {
    id: "fullReading",
    emoji: "📖",
    title: "Full Saju Life Reading",
    price: "$9",
    hook: "Your complete destiny map.",
    features: [
      "Full birth chart analysis",
      "Life path + personality",
      "Career, love, purpose",
    ],
    cta: "Get Full Reading",
    gradient: "from-amber-600 to-orange-600",
    highlight: true,
  },
  {
    id: "monthly",
    emoji: "🌙",
    title: "Monthly Fortune",
    price: "$5/mo",
    hook: "What's ahead — every month.",
    features: [
      "Monthly energy forecast",
      "Auspicious dates",
      "Cancel any time",
    ],
    cta: "Subscribe",
    gradient: "from-sky-600 to-blue-600",
  },
];

interface TierCardsProps {
  searchParams: { name?: string; dob?: string; hour?: string };
}

export default function TierCards({ searchParams }: TierCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePurchase(tierId: string) {
    setLoading(tierId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierId,
          ...searchParams,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <p className="text-center text-xs uppercase tracking-widest text-muted mb-4">
        Go deeper
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-surface border rounded-2xl p-5 space-y-4 transition-all
              ${tier.highlight ? "border-accent/40 glow-purple" : "border-border"}
            `}
          >
            {tier.highlight && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                Most popular
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl mb-1">{tier.emoji}</div>
                <h3 className="font-semibold text-sm text-text">{tier.title}</h3>
                <p className="text-xs text-muted mt-0.5">{tier.hook}</p>
              </div>
              <span className="text-lg font-bold gradient-text whitespace-nowrap ml-2">
                {tier.price}
              </span>
            </div>

            <ul className="space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted">
                  <span className="text-accent/70">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(tier.id)}
              disabled={loading === tier.id}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all
                bg-gradient-to-r ${tier.gradient}
                hover:opacity-90 active:scale-[0.98] disabled:opacity-50`}
            >
              {loading === tier.id ? "…" : tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
