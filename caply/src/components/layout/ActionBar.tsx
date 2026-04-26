import { Download, Settings2, Wand2 } from "lucide-react";

type ActionBarProps = {
  generated: boolean;
  canCreate: boolean;
  isRendering: boolean;
  onCreate: () => void;
  onExport: () => void;
  onToggleSettings: () => void;
};

export function ActionBar({ generated, canCreate, isRendering, onCreate, onExport, onToggleSettings }: ActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/90 p-4 backdrop-blur-2xl lg:static lg:mt-6 lg:border-none lg:bg-transparent lg:p-0">
      <div className="mx-auto flex max-w-6xl gap-3">
        {generated ? (
          <button
            type="button"
            onClick={onExport}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white font-black text-slate-950 shadow-xl transition active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            Download MP4
          </button>
        ) : (
          <button
            type="button"
            disabled={!canCreate || isRendering}
            onClick={onCreate}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Wand2 className="h-5 w-5" />
            Create Story
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSettings}
          className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] lg:hidden"
          aria-label="Open settings"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
