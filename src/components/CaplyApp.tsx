import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Upload, RefreshCw, Wand2, Download, X, Music2 } from "lucide-react";
import { Background } from "./layout/Background";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { MediaInput } from "./MediaInput";
import { Timeline } from "./timeline/Timeline";
import { Card } from "./ui/Card";
import { useCaply, STYLE_OPTIONS } from "../hooks/useCaply";
import { useEffect, useMemo, useState } from "react";

export default function CaplyApp() {
  const caply = useCaply();
  const [isDragging, setIsDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [mode, setMode] = useState<"tiktok" | "youtube" | "instagram">("tiktok");
  const [openControl, setOpenControl] = useState<"music" | "style" | "export">("music");
  const [videoGoal, setVideoGoal] = useState<"sleep" | "relax" | "short" | "story">("sleep");
  const [durationPreset, setDurationPreset] = useState("1h");
  const [customDurationValue, setCustomDurationValue] = useState("30");
  const [customDurationUnit, setCustomDurationUnit] = useState<"seconds" | "minutes" | "hours">("minutes");
  const [platformPreset, setPlatformPreset] = useState<"tiktok" | "youtube" | "instagram_1_1" | "instagram_9_16" | "custom">("tiktok");
  const [qualityPreset, setQualityPreset] = useState<"auto" | "720p" | "1080p" | "2k" | "4k" | "8k">("1080p");

  const durationByGoal: Record<"sleep" | "relax" | "short" | "story", string[]> = {
    sleep: ["30min", "1h", "2h", "Custom"],
    relax: ["15min", "30min", "1h", "Custom"],
    short: ["15s", "30s", "60s", "Custom"],
    story: ["Auto", "30s", "60s", "Custom"],
  };

  const toSeconds = (value: number, unit: "seconds" | "minutes" | "hours") => {
    if (unit === "hours") return value * 3600;
    if (unit === "minutes") return value * 60;
    return value;
  };

  const customDurationSeconds = Math.max(0, toSeconds(Number(customDurationValue || 0), customDurationUnit));
  const isCustomDuration = durationPreset === "Custom";
  const isCustomDurationValid = customDurationSeconds >= 5 && customDurationSeconds <= 7200;

  const finalDurationLabel = (() => {
    if (!isCustomDuration) return durationPreset === "Auto" ? "Auto" : durationPreset;
    const total = Math.floor(customDurationSeconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  })();

  const visualMedia = useMemo(() => [...caply.photos, ...(caply.videos || [])], [caply.photos, caply.videos]);
  const activeVisual = visualMedia[previewIndex % Math.max(visualMedia.length, 1)];

  useEffect(() => {
    if (visualMedia.length <= 1) return;
    const id = window.setInterval(() => {
      setPreviewIndex((v) => (v + 1) % visualMedia.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [visualMedia.length]);

  const handleGlobalDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragover" || e.type === "dragenter") {
      setIsDragging(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setIsDragging(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      caply.onFilesAdd?.(files);
    }
  };

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#030712] text-white"
      onDragOver={handleGlobalDrag}
      onDragEnter={handleGlobalDrag}
      onDragLeave={handleGlobalDrag}
      onDrop={handleGlobalDrop}
    >
      <Background />

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cyan-500/20 backdrop-blur-md border-4 border-dashed border-cyan-400 m-4 rounded-[3rem] pointer-events-none"
          >
            <div className="bg-cyan-400 text-slate-950 p-6 rounded-full shadow-2xl mb-4">
              <Upload className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-white drop-shadow-lg">Drop media anywhere</h2>
            <p className="text-cyan-100 font-medium">Photos, Videos or Music</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col overflow-x-hidden px-3 pb-24 pt-3 sm:px-5 lg:px-8 lg:pb-8">
        <Header />

        <section className="mb-3">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setMode("tiktok")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase ${mode === "tiktok" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}
            >
              TikTok/Reels
            </button>
            <button type="button" onClick={() => setMode("youtube")} className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase ${mode === "youtube" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}>
              YouTube
            </button>
            <button type="button" onClick={() => setMode("instagram")} className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase ${mode === "instagram" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}>
              Instagram
            </button>
          </div>
        </section>

        <section className="grid flex-1 min-w-0 gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1.55fr)_320px] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-[#070d1b] p-3 shadow-[0_16px_60px_rgba(0,0,0,0.45)] sm:p-4">
              <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/10 bg-black">
                <div className={`${mode === "tiktok" ? "aspect-[9/16] min-h-[68vh]" : mode === "instagram" ? "aspect-square min-h-[60vh]" : "aspect-video min-h-[52vh]"} w-full`}>
                  {activeVisual ? (
                    <img
                      key={activeVisual.id}
                      src={activeVisual.url}
                      alt={activeVisual.name}
                      className="h-full w-full object-cover animate-[previewZoom_8s_ease-in-out_infinite]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Add media to preview your story</div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {activeVisual && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-semibold text-white/90">{activeVisual.name}</p>
                    <span className="rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase text-slate-200">
                      {caply.phase === "rendering" ? `Rendering ${Math.round(caply.progress)}%` : "Live preview"}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <Timeline
              photos={caply.photos}
              videos={caply.videos || []}
              audio={caply.audio}
              durationLabel={caply.durationLabel}
              onPhotoRemove={caply.removePhoto}
              onVideoRemove={caply.removeVideo}
              onAudioRemove={caply.removeAudio}
            />
          </div>

          <aside className="space-y-3">
            <Card className="p-0 overflow-hidden">
              <MediaInput
                photos={caply.photos}
                videos={caply.videos || []}
                audio={caply.audio}
                onFilesAdd={caply.onFilesAdd}
                uploadProgress={caply.uploadProgress}
                isUploadSuccess={caply.isUploadSuccess}
                onCancelUpload={caply.cancelUpload}
                onPhotoRemove={caply.removePhoto}
                onAudioRemove={caply.removeAudio}
                onVideoRemove={caply.removeVideo}
              />
            </Card>

            <Card className="space-y-2 p-3">
              <div>
                <button type="button" className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Create Type</p>
                  <span className="text-[10px] text-cyan-200">Final video: {finalDurationLabel}</span>
                </button>
                <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setVideoGoal("sleep"); setDurationPreset("1h"); }} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${videoGoal === "sleep" ? "bg-cyan-300/20 text-cyan-100" : "bg-white/[0.04] text-slate-300"}`}>Sleep video</button>
                    <button onClick={() => { setVideoGoal("relax"); setDurationPreset("30min"); }} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${videoGoal === "relax" ? "bg-cyan-300/20 text-cyan-100" : "bg-white/[0.04] text-slate-300"}`}>Relax loop</button>
                    <button onClick={() => { setVideoGoal("short"); setDurationPreset("30s"); }} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${videoGoal === "short" ? "bg-cyan-300/20 text-cyan-100" : "bg-white/[0.04] text-slate-300"}`}>Short video</button>
                    <button onClick={() => { setVideoGoal("story"); setDurationPreset("Auto"); }} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${videoGoal === "story" ? "bg-cyan-300/20 text-cyan-100" : "bg-white/[0.04] text-slate-300"}`}>Story video</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {durationByGoal[videoGoal].map((preset) => (
                      <button key={preset} onClick={() => setDurationPreset(preset)} className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${durationPreset === preset ? "border-cyan-300/60 text-cyan-100" : "border-white/15 text-slate-300"}`}>
                        {preset}
                      </button>
                    ))}
                  </div>
                  {isCustomDuration && (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={customDurationValue}
                          onChange={(e) => setCustomDurationValue(e.target.value)}
                          className="w-24 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs"
                        />
                        <select value={customDurationUnit} onChange={(e) => setCustomDurationUnit(e.target.value as "seconds" | "minutes" | "hours")} className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs">
                          <option value="seconds">seconds</option>
                          <option value="minutes">minutes</option>
                          <option value="hours">hours</option>
                        </select>
                      </div>
                      {!isCustomDurationValid && <p className="text-[10px] text-amber-300">Custom duration must be between 5s and 2h.</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <select value={platformPreset} onChange={(e) => setPlatformPreset(e.target.value as "tiktok" | "youtube" | "instagram_1_1" | "instagram_9_16" | "custom")} className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs">
                      <option value="tiktok">TikTok/Reels (9:16)</option>
                      <option value="youtube">YouTube (16:9)</option>
                      <option value="instagram_1_1">Instagram (1:1)</option>
                      <option value="instagram_9_16">Instagram (9:16)</option>
                      <option value="custom">Custom</option>
                    </select>
                    <select value={qualityPreset} onChange={(e) => setQualityPreset(e.target.value as "auto" | "720p" | "1080p" | "2k" | "4k" | "8k")} className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs">
                      <option value="auto">Auto recommended</option>
                      <option value="720p">HD 720p</option>
                      <option value="1080p">Full HD 1080p</option>
                      <option value="2k">2K</option>
                      <option value="4k">4K</option>
                      <option value="8k">8K</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <button type="button" onClick={() => setOpenControl((v) => (v === "music" ? "export" : "music"))} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Music</p>
                  <span className="text-xs text-slate-400">{openControl === "music" ? "−" : "+"}</span>
                </button>
                {openControl === "music" && (caply.audio ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-cyan-100">{caply.audio.name}</p>
                    </div>
                    <button onClick={caply.removeAudio} className="text-cyan-100 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2 text-xs text-slate-500">
                    <Music2 className="h-4 w-4" /> No soundtrack
                  </div>
                ))}
              </div>

              <div>
                <button type="button" onClick={() => setOpenControl((v) => (v === "style" ? "export" : "style"))} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Style</p>
                  <span className="text-xs text-slate-400">{openControl === "style" ? "−" : "+"}</span>
                </button>
                {openControl === "style" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => caply.setStyle(opt)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase transition ${
                          caply.style === opt ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100" : "border-white/15 bg-white/[0.02] text-slate-300 hover:border-white/35"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button type="button" onClick={() => setOpenControl((v) => (v === "export" ? "style" : "export"))} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Export</p>
                  <span className="text-xs text-slate-400">{openControl === "export" ? "−" : "+"}</span>
                </button>
                {openControl === "export" && (
                  <>
                    <button
                      type="button"
                      onClick={() => caply.autoCreate(mode, caply.style)}
                      disabled={(!caply.photos.length && !caply.videos?.length) || caply.phase === "rendering"}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-300/15 py-2 text-xs font-black text-cyan-100 disabled:opacity-40"
                    >
                      <Wand2 className="h-4 w-4" />
                      Auto Create
                    </button>
                    <button
                      type="button"
                      onClick={caply.generated ? caply.handleExport : caply.generate}
                      disabled={(!caply.photos.length && !caply.videos?.length) || caply.phase === "rendering"}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-black text-slate-950 disabled:opacity-40"
                    >
                      {caply.generated ? <Download className="h-4 w-4" /> : caply.phase === "rendering" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      {caply.generated ? "Export Video" : caply.phase === "rendering" ? "Creating Story..." : "Create Story"}
                    </button>
                  </>
                )}
              </div>
            </Card>

            {caply.errorMsg && (
              <div className="rounded-2xl border border-red-500/30 bg-[#0f0505] p-3 text-xs text-red-100">
                {caply.errorMsg}
              </div>
            )}
          </aside>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/90 p-3 backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-7xl gap-3">
            <button
              type="button"
              disabled={(!caply.photos.length && !caply.videos?.length) || caply.phase === "rendering"}
              onClick={() => caply.autoCreate(mode, caply.style)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {caply.phase === "rendering" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {caply.phase === "rendering" ? "Creating Story..." : "Create Story"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {caply.errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bottom-24 left-3 right-3 z-[60] mx-auto max-w-sm rounded-2xl border border-red-500/30 bg-[#0f0505] p-4 shadow-2xl backdrop-blur-xl lg:bottom-6"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-500/20 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">{caply.errorMsg}</h4>
                  <p className="mt-0.5 text-xs text-red-200/60 line-clamp-1">Please review server logs and try again.</p>
                </div>
                <button onClick={caply.resetError} className="text-white/20 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>

      <style>{`@keyframes previewZoom { 0% { transform: scale(1); } 50% { transform: scale(1.045); } 100% { transform: scale(1); } }`}</style>
    </main>
  );
}
