import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Film, RefreshCw } from "lucide-react";
import { Card } from "../ui/Card";
import type { MediaAudio, MediaPhoto, Phase } from "../../types/caply";

type PreviewStageProps = {
  photos: MediaPhoto[];
  audio: MediaAudio | null;
  outputUrl: string | null;
  phase: Phase;
  progress: number;
  step: string;
  errorMsg: string;
  durationLabel: string;
  quality: string;
  aspect: string;
  onResetError: () => void;
};

export function PreviewStage({
  photos,
  audio,
  outputUrl,
  phase,
  progress,
  step,
  errorMsg,
  durationLabel,
  quality,
  aspect,
  onResetError,
}: PreviewStageProps) {
  const generated = phase === "generated";

  return (
    <Card className="overflow-hidden p-3 sm:p-4">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black sm:aspect-video sm:max-h-[520px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_70%_75%,rgba(168,85,247,0.20),transparent_36%)]" />

        {outputUrl ? (
          <video src={outputUrl} className="h-full w-full object-contain" controls playsInline />
        ) : photos[0] ? (
          <motion.img
            key={photos[0].id}
            src={photos[0].url}
            alt="Preview"
            className="h-full w-full object-cover opacity-80"
            initial={{ scale: 1.08 }}
            animate={{ scale: [1.08, 1.16, 1.1] }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.08]">
                <Film className="h-8 w-8 text-cyan-300" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Ready when you are</h2>
              <p className="mt-2 text-sm text-slate-400">Add your photos and Caply will create the story automatically.</p>
            </motion.div>
          </div>
        )}

        {phase === "rendering" && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 backdrop-blur-md">
            <div className="w-full max-w-sm text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-300" />
              <p className="text-sm font-semibold">{step}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-cyan-300" animate={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">{progress}%</p>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 backdrop-blur-md">
            <div className="w-full max-w-sm text-center">
              <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-400" />
              <p className="text-sm font-semibold text-red-200">{errorMsg}</p>
              <button type="button" onClick={onResetError} className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                Try again
              </button>
            </div>
          </div>
        )}

        {generated && (
          <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Story exported
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {durationLabel} · {quality} · {aspect} · {audio ? audio.name : "Music: Auto"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
