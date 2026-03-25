"use client";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { us: "text-2xl", ne: "text-lg", gap: "gap-0.5" },
    md: { us: "text-4xl", ne: "text-2xl", gap: "gap-1" },
    lg: { us: "text-6xl", ne: "text-4xl", gap: "gap-1" },
  };
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center ${s.gap} leading-none`}>
      <span
        className={`${s.us} font-display font-bold tracking-tight gradient-text`}
      >
        US
      </span>
      <span
        className={`${s.ne} font-display font-bold tracking-tight gradient-text`}
      >
        NE
      </span>
    </div>
  );
}
