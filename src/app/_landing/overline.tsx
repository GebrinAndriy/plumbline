import type { ReactNode } from "react";

export function Overline({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "ink" | "on-dark" }) {
  const color = { accent: "text-accent", ink: "text-ink", "on-dark": "text-[#f0b48f]" }[tone];
  return <p className={`text-xs font-semibold tracking-[0.13em] uppercase ${color}`}>{children}</p>;
}
