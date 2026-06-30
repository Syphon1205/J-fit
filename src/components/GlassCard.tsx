import type { PropsWithChildren } from "react";
import React from "react";

export type GlassCardProps = PropsWithChildren<{
  className?: string;
  onClick?: () => void;
  role?: string;
}>;

export function GlassCard({ children, className = "", onClick, role }: GlassCardProps) {
  return (
    <div
      className={`relative transform-gpu rounded-2xl bg-white/10 backdrop-blur-md shadow-[0_0_24px_rgba(0,0,0,0.6)] ${className}`}
      onClick={onClick}
      role={role}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/15" />
      <div className="relative">{children}</div>
    </div>
  );
}
