import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type PillProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

export function Pill({ active, children, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-3 py-2 text-sm transition active:scale-95",
        active
          ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25"
          : "border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"
      )}
    >
      {children}
    </button>
  );
}
