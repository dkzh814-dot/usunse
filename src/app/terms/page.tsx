import Logo from "@/components/Logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <a href="/" className="text-muted hover:text-text text-sm transition-colors">← Home</a>
        <Logo size="sm" />
      </div>
      <div className="space-y-4 text-sm text-muted leading-relaxed">
        <h1 className="text-xl font-display font-bold text-text">Terms of Service</h1>
        <p>UsUnse provides entertainment and cultural content based on Korean Saju astrology. Results are not professional advice of any kind.</p>
        <p>Paid readings are non-refundable once delivered. Subscriptions can be cancelled at any time — access continues until the end of the billing period.</p>
        <p>By using UsUnse, you agree to use it for personal, non-commercial purposes only.</p>
        <p>UsUnse is not affiliated with any K-pop artist, group, or agency.</p>
      </div>
    </main>
  );
}
