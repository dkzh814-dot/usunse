"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface EmailGateProps {
  onUnlock: (email: string) => void;
  idolName: string;
  name?: string;
  dob?: string;
  hour?: string;
}

export default function EmailGate({ onUnlock, idolName, name, dob, hour }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "users"), {
        email: email.toLowerCase().trim(),
        name: name || null,
        dob: dob || null,
        hour: hour || null,
        idolName,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Don't block user if Firebase fails
    } finally {
      setLoading(false);
      onUnlock(email.toLowerCase().trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 space-y-5 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="text-3xl">✨</div>
          <h2 className="text-xl font-display font-semibold text-text">
            Your match is ready
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Enter your email to reveal which idol shares your destiny —
            and get your free result.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all
              bg-gradient-to-r from-accent to-accent-2 text-white
              hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Checking the stars…" : `Show My Match →`}
          </button>
        </form>

        <p className="text-center text-xs text-muted/60">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </div>
  );
}
