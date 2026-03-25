import Logo from "@/components/Logo";
import BirthForm from "@/components/BirthForm";

const freeCards = [
  {
    emoji: "⭐",
    title: "Which K-pop idol is your destiny?",
    featured: true,
  },
  {
    emoji: "🔥",
    title: "What type do you repel?",
    featured: false,
  },
  {
    emoji: "✨",
    title: "This month's energy keyword",
    featured: false,
  },
  {
    emoji: "🌊",
    title: "Your energy type",
    featured: false,
  },
];

const paidCards = [
  {
    title: "Are we compatible?",
    price: "$1",
    badge: null,
  },
  {
    title: "My Five Elements",
    price: "$1",
    badge: null,
  },
  {
    title: "Full Destiny Reading",
    price: "$10",
    badge: "Share to unlock 30% off",
  },
  {
    title: "This year's fortune",
    price: "$10",
    badge: "Share to unlock 30% off",
  },
  {
    title: "Monthly Energy Report",
    price: "$5/mo",
    badge: null,
    sub: "mailing subscription",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent-2/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center gap-12">
        {/* Logo */}
        <Logo size="lg" />

        {/* Featured hero card */}
        <div className="w-full rounded-2xl border border-accent/20 bg-surface/60 backdrop-blur-sm p-8 flex flex-col gap-6">
          <div className="text-center space-y-3">
            <span className="text-3xl">⭐</span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-text leading-tight">
              Which K-pop idol<br />is your destiny?
            </h1>
            <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
              Ancient Korean Saju astrology reveals the person you were born to meet.
              Millions of fans. One match.
            </p>
          </div>
          <BirthForm />
        </div>

        {/* More tests grid */}
        <section className="w-full flex flex-col gap-4">
          <h2 className="text-xs font-medium tracking-widest text-muted/50 uppercase">More Tests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {freeCards.slice(1).map((card) => (
              <div
                key={card.title}
                className="relative rounded-xl border border-white/5 bg-surface/40 backdrop-blur-sm p-4 flex flex-col gap-2 cursor-pointer hover:border-accent/20 transition-colors"
              >
                <span className="absolute top-3 right-3 text-[10px] font-medium tracking-wide text-muted/50 bg-white/5 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <span className="text-xl">{card.emoji}</span>
                <p className="text-sm font-medium text-text/80 leading-snug pr-16">{card.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Paid products */}
        <section className="w-full flex flex-col gap-4">
          <h2 className="text-xs font-medium tracking-widest text-muted/50 uppercase">Go Deeper</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paidCards.map((card) => (
              <div
                key={card.title}
                className="relative rounded-xl border border-white/5 bg-surface/40 backdrop-blur-sm p-4 flex flex-col gap-1 cursor-pointer hover:border-accent/20 transition-colors"
              >
                {card.badge && (
                  <span className="self-start text-[10px] font-medium tracking-wide text-accent/70 bg-accent/10 px-2 py-0.5 rounded-full mb-1">
                    {card.badge}
                  </span>
                )}
                <p className="text-sm font-medium text-text/90">{card.title}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold gradient-text">{card.price}</span>
                  {card.sub && (
                    <span className="text-xs text-muted/50">{card.sub}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof — privacy only */}
        <div className="flex items-center gap-2 text-xs text-muted/60">
          <span>🔒 Private</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 w-full flex justify-center gap-6 text-xs text-muted/40">
        <span>© 2026 UsUnse</span>
        <a href="/privacy" className="hover:text-muted transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-muted transition-colors">Terms</a>
      </footer>
    </main>
  );
}
