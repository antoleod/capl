import { Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import type { MediaAudio } from "../../types/caply";

type AISummaryProps = {
  audio: MediaAudio | null;
  durationLabel: string;
  quality: string;
};

export function AISummary({ audio, durationLabel, quality }: AISummaryProps) {
  return (
    <Card className="border-cyan-300/15 bg-cyan-300/[0.05]">
      <p className="mb-3 flex items-center gap-2 text-sm font-black">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        Caply will create
      </p>
      <div className="space-y-2 text-sm text-slate-300">
        <p>• Smooth transitions and motion</p>
        <p>• {audio ? `Audio: ${audio.name}` : "Music: Auto"}</p>
        <p>• {durationLabel} · {quality} · balanced timing</p>
      </div>
    </Card>
  );
}
