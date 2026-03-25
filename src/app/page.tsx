"use client";

const freeCards = [
  {
    title: "Which K-pop idol is your destiny?",
    desc: "Find the idol your energy was born to meet",
    featured: true,
  },
  {
    title: "What type do you repel?",
    desc: "Discover the energy pattern behind your toxic relationships",
    featured: false,
  },
  {
    title: "This month's energy keyword",
    desc: "One word that defines your energy this month",
    featured: false,
  },
  {
    title: "Your energy type",
    desc: "See the elemental combination that makes you, you",
    featured: false,
  },
];

const paidCards = [
  { title: "Are we compatible?", desc: "Enter any birth date — idol, crush, or partner", price: "$1", full: false },
  { title: "My Five Elements", desc: "See what your chart is made of and what's missing", price: "$1", full: false },
  { title: "Full Destiny Reading", desc: "Your personality, career, love, and life cycles in full", price: "$10", full: false },
  { title: "This year's fortune", desc: "What 2026 and 2027 hold for your energy", price: "$10", full: false },
  { title: "Monthly Energy Report", desc: "Your monthly forecast delivered to your inbox", price: "$5/mo", sub: "mailing subscription", full: true },
];

const marqueeText = "Share your result → Unlock 30% off any $10 reading";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent-2/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2.5">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-display font-bold gradient-text tracking-tight">US</span>
            <span className="text-xs font-display font-bold gradient-text tracking-tight">NE</span>
          </div>
          <span className="text-sm font-display font-semibold text-text/70 tracking-wide">UsUnse</span>
        </div>
      </nav>

      {/* Marquee banner */}
      <div className="w-full overflow-hidden border-b border-white/5 bg-[#12121a]/60 py-2.5">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-10 text-xs tracking-wide text-accent/70">
              ✦ {marqueeText}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-10">

          {/* Free test cards — 2×2 grid */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium tracking-widest text-muted/50 uppercase">Free Tests</h2>
            <div className="grid grid-cols-2 gap-3">
              {freeCards.map((card) => (
                <div
                  key={card.title}
                  onClick={card.featured ? () => { window.location.href = "/kpop-test"; } : undefined}
                  className={`rounded-xl border p-4 flex flex-col gap-2 min-h-[130px] transition-colors
                    ${card.featured
                      ? "border-accent/30 bg-[#12121a]/80 cursor-pointer hover:border-accent/50"
                      : "border-white/5 bg-[#12121a]/40 cursor-default"
                    }`}
                >
                  {card.featured ? (
                    <span className="self-start text-[9px] font-semibold tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">
                      Featured
                    </span>
                  ) : (
                    <span className="self-start text-[9px] font-medium tracking-wide text-muted/50 bg-white/5 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-text/80 leading-snug">{card.title}</p>
                    <p className="text-xs text-muted/50 leading-snug">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </section>

          {/* Paid products */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium tracking-widest text-muted/50 uppercase">Go Deeper</h2>
            <div className="grid grid-cols-2 gap-3">
              {paidCards.map((card) => (
                <div
                  key={card.title}
                  className={`relative rounded-xl border border-white/5 bg-[#12121a]/40 backdrop-blur-sm p-4 flex flex-col min-h-[100px] cursor-pointer hover:border-accent/20 transition-colors
                    ${card.full ? "col-span-2" : ""}`}
                >
                  <p className="text-sm font-medium text-text/90">{card.title}</p>
                  <p className="text-xs text-muted/50 leading-snug mt-0.5">{card.desc}</p>
                  <div className="flex items-baseline gap-1.5 mt-auto pt-2">
                    <span className="text-base font-bold gradient-text">{card.price}</span>
                    {card.sub && (
                      <span className="text-xs text-muted/50">{card.sub}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex justify-center gap-6 text-xs text-muted/40 py-8">
        <span>© 2026 UsUnse</span>
        <a href="/privacy" className="hover:text-muted transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-muted transition-colors">Terms</a>
      </footer>
    </div>
  );
}
