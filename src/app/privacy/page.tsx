import Logo from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <a href="/" className="text-muted hover:text-text text-sm transition-colors">← Home</a>
        <Logo size="sm" />
      </div>
      <div className="space-y-4 text-sm text-muted leading-relaxed">
        <h1 className="text-xl font-display font-bold text-text">Privacy Policy</h1>
        <p>UsUnse collects your email address solely to deliver your compatibility result. We do not sell or share your data with third parties.</p>
        <p>Birth date data is used only to calculate your Saju chart and is not stored beyond the session unless you make a purchase.</p>
        <p>Payments are processed by Stripe. We do not store card details.</p>
        <p>To request deletion of your data, email: privacy@usunse.com</p>
      </div>
    </main>
  );
}
