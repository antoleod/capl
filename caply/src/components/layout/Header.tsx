import { Monitor, Smartphone, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-white/10 bg-[#030712]/75 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white sm:text-2xl">Caply</h1>
            <p className="text-xs text-slate-400 sm:text-sm">Turn moments into stories</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-400 sm:flex">
          <Smartphone className="h-4 w-4" />
          Mobile-first
          <span className="text-slate-600">/</span>
          <Monitor className="h-4 w-4" />
          Desktop-ready
        </div>
      </div>
    </header>
  );
}
