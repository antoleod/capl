import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { MediaAudio, MediaPhoto } from "../../types/caply";

type Clip = {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  durationSec: number;
  startSec: number;
};

type TimelineProps = {
  photos: MediaPhoto[];
  videos: MediaPhoto[];
  audio: MediaAudio | null;
  durationLabel: string;
  onPhotoRemove?: (id: string) => void;
  onVideoRemove?: (id: string) => void;
  onAudioRemove?: () => void;
  mismatchIds?: string[];
};

const formatTime = (sec: number) => {
  const safe = Math.max(0, sec);
  if (safe < 60) return `${Math.round(safe)}s`;
  const s = Math.floor(safe);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${String(rs).padStart(2, "0")}`;
};

export function Timeline({ photos, videos, audio, durationLabel, onPhotoRemove, onVideoRemove, onAudioRemove, mismatchIds = [] }: TimelineProps) {
  const [pxPerSec, setPxPerSec] = useState(28);
  const [audioDurationSec, setAudioDurationSec] = useState<number | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  useEffect(() => {
    if (!audio?.url) {
      setAudioDurationSec(null);
      return;
    }

    const media = new Audio();
    media.preload = "metadata";
    media.src = audio.url;

    const onLoaded = () => {
      const d = Number(media.duration);
      setAudioDurationSec(Number.isFinite(d) && d > 0 ? d : null);
    };
    const onError = () => setAudioDurationSec(null);

    media.addEventListener("loadedmetadata", onLoaded);
    media.addEventListener("error", onError);

    return () => {
      media.removeEventListener("loadedmetadata", onLoaded);
      media.removeEventListener("error", onError);
      media.src = "";
    };
  }, [audio?.url]);

  const clips = useMemo<Clip[]>(() => {
    const base = [
      ...photos.map((p) => ({ id: p.id, name: p.name, type: "image" as const, url: p.url })),
      ...videos.map((v) => ({ id: v.id, name: v.name, type: "video" as const, url: v.url })),
    ];

    const hasAudioDuration = !!audioDurationSec && audioDurationSec > 0;
    const perClipDuration = hasAudioDuration && base.length > 0 ? audioDurationSec / base.length : null;

    let startSec = 0;
    return base.map((clip) => {
      const durationSec = perClipDuration ?? (clip.type === "image" ? 5 : 8);
      const next = { ...clip, durationSec, startSec };
      startSec += durationSec;
      return next;
    });
  }, [photos, videos, audioDurationSec]);

  const totalDuration = useMemo(() => {
    const clipsSec = clips.reduce((sum, clip) => sum + clip.durationSec, 0);
    if (audioDurationSec && audioDurationSec > 0) return Math.max(audioDurationSec, clipsSec, 10);
    return Math.max(clipsSec, 10);
  }, [clips, audioDurationSec, durationLabel]);

  const timelineWidth = Math.max(720, Math.round(totalDuration * pxPerSec));
  const tickStepSec = pxPerSec >= 52 ? 1 : pxPerSec >= 28 ? 2 : 4;
  const ticks = Math.ceil(totalDuration / tickStepSec) + 1;

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#090f1d]/90 p-3 shadow-[0_14px_50px_rgba(0,0,0,0.45)] sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/90">Timeline</p>
          <p className="text-[10px] text-slate-400">Mini timeline</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button type="button" onClick={() => setPxPerSec((v) => Math.max(14, v - 6))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10" aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[72px] text-center text-[11px] font-semibold text-slate-300">{pxPerSec}px/s</span>
          <button type="button" onClick={() => setPxPerSec((v) => Math.min(72, v + 6))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10" aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden pb-0.5">
        <div className="min-w-full" style={{ width: timelineWidth }}>
          <div className="relative mb-1.5 h-8 rounded-xl border border-white/10 bg-[#0b1220]">
            {Array.from({ length: ticks }).map((_, idx) => {
              const sec = idx * tickStepSec;
              if (sec > totalDuration) return null;
              const x = Math.round(sec * pxPerSec);
              return (
                <div key={sec} className="absolute bottom-0 top-0" style={{ left: x }}>
                  <div className="h-3 w-px bg-slate-500/70" />
                  <span className="absolute top-3 -translate-x-1/2 text-[10px] text-slate-400">{formatTime(sec)}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <div className="rounded-xl border border-white/10 bg-[#0c1324] p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Visual track</div>
              <div className="flex min-h-[72px] items-stretch gap-2">
                {clips.length === 0 ? <div className="flex items-center text-xs text-slate-500">Add photos/videos to build your sequence.</div> : null}
                {clips.map((clip) => {
                  const width = Math.max(96, Math.round(clip.durationSec * pxPerSec));
                  const isImage = clip.type === "image";
                  const badgeClass = isImage ? "bg-emerald-400/15 text-emerald-200" : "bg-violet-400/15 text-violet-200";
                  const onRemove = isImage ? () => onPhotoRemove?.(clip.id) : () => onVideoRemove?.(clip.id);

                  return (
                    <article
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`group relative overflow-hidden rounded-xl border bg-slate-900 transition ${
                        selectedClipId === clip.id ? "border-cyan-300/70 ring-1 ring-cyan-300/60" : mismatchIds.includes(clip.id) ? "border-orange-400/70 ring-1 ring-orange-300/50" : "border-white/15"
                      }`}
                      style={{ width }}
                    >
                      <img src={clip.url} alt={clip.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
                      <div className="relative flex h-full flex-col justify-between gap-2 bg-gradient-to-b from-black/50 to-black/80 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeClass}`}>{clip.type}</span>
                          <button
                            type="button"
                            onClick={onRemove}
                            className="grid h-5 w-5 place-items-center rounded-md bg-black/55 text-white/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
                            aria-label={`Remove ${clip.type}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div>
                          <p className="truncate text-[11px] font-semibold text-slate-100">{clip.name}</p>
                          <p className="text-[10px] text-slate-300">{formatTime(clip.durationSec)}</p>
                          {mismatchIds.includes(clip.id) && <p className="text-[10px] font-semibold text-orange-300">May not match</p>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0c1324] p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Audio track</div>
              <div className="min-h-[48px]">
                {!audio ? (
                  <div className="flex h-[44px] items-center rounded-lg border border-dashed border-white/15 px-3 text-xs text-slate-500">No audio selected.</div>
                ) : (
                  <div className="relative h-[44px] overflow-hidden rounded-lg border border-cyan-300/20 bg-cyan-400/10" style={{ width: Math.max(140, Math.round((audioDurationSec || totalDuration) * pxPerSec)) }}>
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,211,238,0.18)_0px,rgba(34,211,238,0.18)_3px,transparent_3px,transparent_12px)]" />
                    <div className="relative flex h-full items-center justify-between px-3">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-cyan-100">{audio.name}</p>
                        <p className="text-[10px] text-cyan-200/80">{audioDurationSec ? formatTime(audioDurationSec) : "Full mix"}</p>
                      </div>
                      <button type="button" onClick={() => onAudioRemove?.()} className="grid h-6 w-6 place-items-center rounded-md bg-black/40 text-cyan-50" aria-label="Remove audio">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0c1324] p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Effects / Text</div>
              <div className="relative h-[44px] overflow-hidden rounded-lg border border-dashed border-white/15 bg-[#0a111f]">
                {clips.length === 0 ? (
                  <div className="flex h-full items-center px-3 text-xs text-slate-500">Placeholder track. Text titles and transitions can be added here later.</div>
                ) : (
                  clips.map((clip, idx) => {
                    const left = Math.round(clip.startSec * pxPerSec);
                    const width = Math.max(92, Math.round(clip.durationSec * pxPerSec));
                    return (
                      <div key={`${clip.id}-fx`} className="absolute top-1 h-[34px] rounded-md border border-fuchsia-300/20 bg-fuchsia-400/10 px-2 py-1" style={{ left, width }}>
                        <p className="truncate text-[9px] font-semibold uppercase text-fuchsia-200">
                          {idx === 0 ? "Smooth intro • " : ""}
                          Gentle motion
                          {idx < clips.length - 1 ? " • Soft transition" : ""}
                          {idx === clips.length - 1 ? " • Calm ending" : ""}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
