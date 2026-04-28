import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}
