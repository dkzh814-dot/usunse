import BirthForm from "@/components/BirthForm";

export default function KpopTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-8">
        {/* Back link */}
        <a href="/" className="text-muted hover:text-text transition-colors text-sm self-start">
          ← Back
        </a>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex flex-col items-center leading-none gap-0.5 mb-4">
            <span className="text-lg font-bold gradient-text">US</span>
            <span className="text-base font-bold gradient-text">NE</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text leading-tight">
            Which K-pop idol<br />is your destiny?
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Ancient Korean Saju astrology reveals the person you were born to meet.
          </p>
        </div>

        {/* Form */}
        <BirthForm />
      </div>
    </main>
  );
}
