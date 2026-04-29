import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Upload, RefreshCw, Wand2, Download, X, Music2, Settings } from "lucide-react";
import { Background } from "./layout/Background";
import { Footer } from "./layout/Footer";
import { MediaInput } from "./MediaInput";
import { Timeline } from "./timeline/Timeline";
import { Card } from "./ui/Card";
import { useCaply, STYLE_OPTIONS } from "../hooks/useCaply";
import { useEffect, useMemo, useRef, useState } from "react";

export default function CaplyApp() {
  const caply = useCaply();
  const [theme, setTheme] = useState<"light" | "dark" | "purple">("dark");
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
  const [exportMode, setExportMode] = useState<"preview" | "final">("final");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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
  const isCustomDurationValid = customDurationSeconds >= 3;
  const isLongDuration = customDurationSeconds > 7200;
  const isVeryHeavyDuration = customDurationSeconds > 7200 && (qualityPreset === "4k" || qualityPreset === "8k");

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

  const renderWeight = (() => {
    if (!isCustomDuration) return "medium";
    if (customDurationSeconds >= 7200 || qualityPreset === "8k") return "heavy";
    if (customDurationSeconds >= 1800 || qualityPreset === "4k" || qualityPreset === "2k") return "medium";
    return "small";
  })();

  const mapQualityToEngine = (q: "auto" | "720p" | "1080p" | "2k" | "4k" | "8k") => {
    if (q === "auto") return { quality: "1080p", bitrate: "10M", fps: 30 };
    if (q === "720p") return { quality: "720p", bitrate: "6M", fps: 30 };
    if (q === "1080p") return { quality: "1080p", bitrate: "12M", fps: 30 };
    if (q === "2k") return { quality: "2K", bitrate: "18M", fps: 30 };
    if (q === "4k") return { quality: "4K", bitrate: "28M", fps: 30 };
    return { quality: "4K", bitrate: "40M", fps: 60 };
  };

  const mapPlatformToMode = (p: "tiktok" | "youtube" | "instagram_1_1" | "instagram_9_16" | "custom"): "tiktok" | "youtube" | "instagram" => {
    if (p === "youtube") return "youtube";
    if (p === "instagram_1_1" || p === "instagram_9_16") return "instagram";
    return "tiktok";
  };

  const mapPlatformToAspect = (p: "tiktok" | "youtube" | "instagram_1_1" | "instagram_9_16" | "custom") => {
    if (p === "youtube") return "16:9";
    if (p === "instagram_1_1") return "1:1";
    return "9:16";
  };

  const resolvedDurationLabel = isCustomDuration ? `${Math.max(3, Math.floor(customDurationSeconds))}${customDurationUnit === "hours" ? "h" : customDurationUnit === "minutes" ? "m" : "s"}` : durationPreset === "Auto" ? caply.durationLabel : durationPreset.replace("min", "m");

  const runAutoCreateWithSelections = () => {
    const engine = exportMode === "preview"
      ? { quality: "720p", bitrate: "4M", fps: 24 }
      : mapQualityToEngine(qualityPreset);
    caply.setQuality(engine.quality);
    caply.setBitrate(engine.bitrate);
    caply.setFps(engine.fps);
    caply.setAspect(mapPlatformToAspect(platformPreset));
    caply.setDuration(resolvedDurationLabel);
    caply.autoCreate(mapPlatformToMode(platformPreset), caply.style);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("caply_user_prefs");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ videoGoal: "sleep" | "relax" | "short" | "story"; durationPreset: string; platformPreset: "tiktok" | "youtube" | "instagram_1_1" | "instagram_9_16" | "custom"; qualityPreset: "auto" | "720p" | "1080p" | "2k" | "4k" | "8k"; }>;
      if (parsed.videoGoal) setVideoGoal(parsed.videoGoal);
      if (parsed.durationPreset) setDurationPreset(parsed.durationPreset);
      if (parsed.platformPreset) setPlatformPreset(parsed.platformPreset);
      if (parsed.qualityPreset) setQualityPreset(parsed.qualityPreset);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("caply_user_prefs", JSON.stringify({ videoGoal, durationPreset, platformPreset, qualityPreset }));
  }, [videoGoal, durationPreset, platformPreset, qualityPreset]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("caply_theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("caply_theme");
    if (saved === "light" || saved === "dark" || saved === "purple") setTheme(saved);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
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
        <section className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/caply-logo.svg" alt="Caply logo" className="h-8 w-8 rounded-lg shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/favicon.svg"; }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">Caply</p>
              <p className="truncate text-[11px] text-slate-400">Smart story creator</p>
            </div>
          </div>
          <div className="flex items-center gap-2" ref={settingsRef}>
            <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] uppercase text-slate-300">{mode}</span>
            <button type="button" onClick={() => setSettingsOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
              <Settings className="h-4 w-4" />
            </button>
            {settingsOpen && (
              <div className="absolute right-3 top-12 z-[90] w-[min(92vw,320px)] rounded-2xl border border-white/10 p-3 shadow-2xl" style={{ backgroundColor: "var(--panel)" }}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Theme</p>
                <div className="mb-3 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  <button onClick={() => { setTheme("light"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${theme === "light" ? "bg-white/20" : "text-slate-300"}`}>Light</button>
                  <button onClick={() => { setTheme("dark"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${theme === "dark" ? "bg-white/20" : "text-slate-300"}`}>Dark</button>
                  <button onClick={() => { setTheme("purple"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${theme === "purple" ? "bg-white/20" : "text-slate-300"}`}>Purple</button>
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Platform mode</p>
                <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  <button onClick={() => { setMode("tiktok"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${mode === "tiktok" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}>TikTok/Reels</button>
                  <button onClick={() => { setMode("youtube"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${mode === "youtube" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}>YouTube</button>
                  <button onClick={() => { setMode("instagram"); setSettingsOpen(false); }} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${mode === "instagram" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}>Instagram</button>
                </div>
              </div>
            )}
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
              mismatchIds={caply.mismatchIds || []}
            />
            {!!caply.mismatchIds?.length && (
              <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-xs text-orange-100">
                This image looks visually different from the rest of the pack. Consider removing it for smoother transitions.
              </div>
            )}
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
                      {!isCustomDurationValid && <p className="text-[10px] text-amber-300">Minimum duration is 3 seconds.</p>}
                      {isLongDuration && <p className="text-[10px] text-amber-300">Long video, rendering may be slow.</p>}
                      {isVeryHeavyDuration && <p className="text-[10px] text-orange-300">High quality + long duration may take time.</p>}
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
                  <p className="text-[10px] text-slate-400">Estimated render weight: <span className="uppercase text-slate-200">{renderWeight}</span></p>
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
                <label className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!caply.smartOrderByColor}
                    onChange={(e) => caply.setSmartOrderByColor?.(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Smart order by color
                </label>
                {!!caply.mismatchIds?.length && (
                  <div className="mt-2 space-y-1 rounded-xl border border-orange-400/30 bg-orange-400/10 p-2">
                    <p className="text-[11px] font-semibold text-orange-100">Possible mismatches</p>
                    <div className="flex gap-3">
                      <button onClick={() => caply.autoCleanMismatches?.()} className="text-[10px] font-bold text-orange-200">Auto-clean pack</button>
                      {!!caply.lastCleanSnapshot?.length && <button onClick={() => caply.undoAutoClean?.()} className="text-[10px] font-bold text-cyan-200">Undo clean</button>}
                    </div>
                    {caply.photos.filter((p) => caply.mismatchIds?.includes(p.id)).slice(0, 6).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-orange-300/30 bg-black/20 px-2 py-1">
                        <span className="truncate text-[10px] text-orange-100">{p.name}</span>
                        <button onClick={() => caply.removePhoto(p.id)} className="text-[10px] font-bold text-orange-200">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <div className="mt-2 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                      <button
                        type="button"
                        onClick={() => setExportMode("preview")}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase ${exportMode === "preview" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportMode("final")}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase ${exportMode === "final" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300"}`}
                      >
                        Final
                      </button>
                    </div>
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[10px] text-slate-300">
                      Quality check: {renderWeight.toUpperCase()} load. Mode: {exportMode.toUpperCase()}. {isLongDuration ? "Long duration selected. " : ""}{isVeryHeavyDuration ? "High quality + long duration can be slow." : "Ready to render."}
                    </div>
                    <button
                      type="button"
                      onClick={runAutoCreateWithSelections}
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
              onClick={runAutoCreateWithSelections}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {caply.phase === "rendering" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {caply.phase === "rendering" ? "Creating Story..." : `Create Story (${exportMode === "preview" ? "Preview" : "Final"})`}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!!caply.lastRemovedPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="fixed bottom-40 left-3 right-3 z-[70] mx-auto max-w-md rounded-xl border border-cyan-300/30 bg-[#071423] p-3 text-xs text-cyan-100"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">Image removed.</span>
                <button className="font-bold text-cyan-200" onClick={() => caply.undoRemovePhoto?.()}>Undo</button>
              </div>
            </motion.div>
          )}
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
