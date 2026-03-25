import BirthForm from "@/components/BirthForm";

export default function RepelTestPage() {
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
            What type do<br />you repel?
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Your chart reveals the energy pattern behind the people who keep draining you.
          </p>
        </div>

        {/* Form — no hour pillar, navigates to /repel-result */}
        <BirthForm destination="/repel-result" showHour={false} />
      </div>
    </main>
  );
}
