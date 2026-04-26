import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Upload, Music, Sparkles, Smartphone, Monitor, Wand2, Download, Settings2, Clock, Film, AlertCircle, X, ChevronDown, RefreshCw, CheckCircle2, Volume2, Scissors, Repeat } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const api = axios.create({ baseURL: API_BASE, timeout: 120000 });
const styles = ["Auto", "Smooth", "Dynamic", "Emotional", "Cinematic", "Minimal"];
const aspects = ["9:16", "16:9", "1:1", "4:5"];
const qualities = ["720p", "1080p", "2K", "4K"];
const transitions = ["fade", "none"];

function formatBytes(bytes?: number) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes, i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function parseDuration(value: string, customValue: string | number, customUnit: string) {
  if (value !== "Custom") return value;
  const n = Number(customValue || 0);
  if (!n || n <= 0) return "30s";
  if (customUnit === "hours") return `${n}h`;
  if (customUnit === "minutes") return `${n}m`;
  return `${n}s`;
}

function durationToSeconds(label: string) {
  const m = String(label).match(/^(\d+(?:\.\d+)?)\s*(s|m|h)?$/i);
  if (!m) return 30;
  const v = parseFloat(m[1]);
  const u = (m[2] || "s").toLowerCase();
  return u === "h" ? v * 3600 : u === "m" ? v * 60 : v;
}

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl", className)}>{children}</div>;
}

function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cx("rounded-2xl px-3 py-2 text-sm transition active:scale-95",
        active ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25" : "border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]")}>
      {children}
    </button>
  );
}

function Section({ icon: Icon, title, children, defaultOpen = false }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="h-4 w-4 text-cyan-300" /> {title}</span>
        <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-white/10 p-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function CaplyApp() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ id: string; file: File; name: string; size: number; url: string }[]>([]);
  const [audio, setAudio] = useState<{ file: File; name: string; size: number; url: string } | null>(null);
  const [duration, setDuration] = useState("30s");
  const [customDuration, setCustomDuration] = useState<number | string>(1);
  const [customUnit, setCustomUnit] = useState("minutes");
  const [style, setStyle] = useState("Auto");
  const [aspect, setAspect] = useState("9:16");
  const [quality, setQuality] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [bitrate, setBitrate] = useState("8M");
  const [transition, setTransition] = useState("fade");
  const [phase, setPhase] = useState<"empty" | "ready" | "uploading" | "rendering" | "done" | "error">("empty");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [audioTrimStart, setAudioTrimStart] = useState(0);
  const [audioTrimEnd, setAudioTrimEnd] = useState<number | undefined>(undefined);
  const [audioLoop, setAudioLoop] = useState(false);
  const [audioFadeIn, setAudioFadeIn] = useState(1);
  const [audioFadeOut, setAudioFadeOut] = useState(1);
  const [audioVolume, setAudioVolume] = useState(1);

  const durationLabel = parseDuration(duration, customDuration, customUnit);
  const totalSeconds = durationToSeconds(durationLabel);
  const hasLongVideo = totalSeconds >= 600;

  const handlePhotos = (files: FileList | null) => {
    const items = Array.from(files || []).filter(f => f.type.startsWith("image/")).map(f => ({
      id: crypto.randomUUID(), file: f, name: f.name, size: f.size, url: URL.createObjectURL(f),
    }));
    setPhotos(p => [...p, ...items]);
    if (items.length) setPhase("ready");
  };

  const handleAudio = (files: FileList | null) => {
    const f = Array.from(files || []).find(i => i.type.startsWith("audio/"));
    if (f) { setAudio({ file: f, name: f.name, size: f.size, url: URL.createObjectURL(f) }); setAudioTrimEnd(undefined); }
  };

  const removePhoto = (id: string) => {
    setPhotos(p => {
      const n = p.filter(x => x.id !== id);
      if (!n.length) { setPhase("empty"); setOutputUrl(null); setJobId(null); }
      return n;
    });
  };

  const removeAudio = () => setAudio(null);

  const pollStatus = useCallback(async (jid: string) => {
    try {
      const { data } = await api.get(`/status/${jid}`);
      if (data.status === "done") { setPhase("done"); setProgress(100); setStep("Export ready"); setOutputUrl(`${API_BASE}${data.url}`); return true; }
      if (data.status === "processing") setProgress(p => Math.max(p, data.progress || p + 2));
    } catch { /* ignore */ }
    return false;
  }, []);

  useEffect(() => {
    if (!jobId || phase !== "rendering") return;
    const iv = setInterval(async () => { const done = await pollStatus(jobId); if (done) clearInterval(iv); }, 2000);
    return () => clearInterval(iv);
  }, [jobId, phase, pollStatus]);

  const generate = async () => {
    if (!photos.length) return;
    setErrorMsg(""); setOutputUrl(null); setJobId(null);
    try {
      setPhase("uploading"); setStep("Uploading photos…"); setProgress(5);
      const photoForm = new FormData();
      photos.forEach(p => photoForm.append("photos", p.file));
      const photoRes = await api.post("/upload/photos", photoForm, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: e => { const pct = e.total ? Math.round((e.loaded / e.total) * 30) : 10; setProgress(pct); },
      });
      const imagePaths = photoRes.data.files;

      let audioPath = null;
      if (audio) {
        setStep("Uploading audio…");
        const audioForm = new FormData();
        audioForm.append("audio", audio.file);
        const audioRes = await api.post("/upload/audio", audioForm, { headers: { "Content-Type": "multipart/form-data" } });
        audioPath = audioRes.data.file;
      }

      setPhase("rendering"); setStep("Rendering video…"); setProgress(40);
      const audioSettings = audio ? {
        trimStart: audioTrimStart > 0 ? audioTrimStart : undefined,
        trimEnd: audioTrimEnd && audioTrimEnd > audioTrimStart ? audioTrimEnd : undefined,
        loop: audioLoop,
        fadeIn: audioFadeIn > 0 ? audioFadeIn : undefined,
        fadeOut: audioFadeOut > 0 ? audioFadeOut : undefined,
        volume: audioVolume,
      } : undefined;

      const renderRes = await api.post("/render", { imagePaths, audioPath, durationLabel, style, quality, aspect, audioSettings, fps, bitrate, transition });
      if (renderRes.data.ok) {
        setJobId(renderRes.data.jobId);
        setStep("Processing on server…"); setProgress(50);
      } else throw new Error(renderRes.data.error || "Render request failed");
    } catch (e: any) {
      console.error(e);
      setPhase("error");
      setErrorMsg(e?.response?.data?.error || e?.message || "Export failed. Try lower quality or shorter duration.");
      setProgress(0);
    }
  };

  const handleExport = async () => {
    if (!outputUrl) return;
    try {
      setStep("Downloading…");
      const res = await api.get(outputUrl.replace(API_BASE, ""), { responseType: "blob" });
      const blob = new Blob([res.data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `caply-${Date.now()}.mp4`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { setErrorMsg("Download failed. Please try again."); }
  };

  const generated = phase === "done";
  const controlsProps = {
    audioInputRef, handleAudio, audio, removeAudio,
    duration, setDuration, customDuration, setCustomDuration, customUnit, setCustomUnit,
    style, setStyle, aspect, setAspect, quality, setQuality,
    fps, setFps, bitrate, setBitrate, transition, setTransition,
    hasLongVideo,
    audioTrimStart, setAudioTrimStart, audioTrimEnd, setAudioTrimEnd,
    audioLoop, setAudioLoop, audioFadeIn, setAudioFadeIn, audioFadeOut, setAudioFadeOut, audioVolume, setAudioVolume,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_32%),linear-gradient(180deg,#030712_0%,#07111f_55%,#030712_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
        <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-white/10 bg-[#030712]/75 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight sm:text-2xl">Caply</h1>
                <p className="text-xs text-slate-400 sm:text-sm">Turn moments into stories</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-300 sm:flex">
              <Smartphone className="h-4 w-4" /> Mobile-first
              <span className="text-slate-600">/</span>
              <Monitor className="h-4 w-4" /> Desktop-ready
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-5">
            <Card className="overflow-hidden p-3 sm:p-4">
              <div className="relative aspect-[9/16] max-h-[62vh] w-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-black sm:aspect-video sm:max-h-[520px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_70%_75%,rgba(168,85,247,0.20),transparent_36%)]" />
                {outputUrl ? (
                  <video src={outputUrl} className="h-full w-full object-contain" controls playsInline />
                ) : photos[0] ? (
                  <motion.img key={photos[0].id} src={photos[0].url} alt="Preview" className="h-full w-full object-cover opacity-80"
                    initial={{ scale: 1.08 }} animate={{ scale: [1.08, 1.16, 1.1] }} transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center p-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm">
                      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.08]">
                        <Film className="h-8 w-8 text-cyan-300" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight sm:text-4xl">Ready when you are</h2>
                      <p className="mt-2 text-sm text-slate-400">Add your photos and Caply will create the story automatically.</p>
                    </motion.div>
                  </div>
                )}
                {(phase === "uploading" || phase === "rendering") && (
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
                      <button onClick={() => { setPhase("ready"); setErrorMsg(""); }}
                        className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Try again</button>
                    </div>
                  </div>
                )}
                {generated && (
                  <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl">
                    <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> Story exported</p>
                    <p className="mt-1 text-xs text-slate-300">{durationLabel} · {quality} · {aspect} · {audio ? audio.name : "Music: Auto"}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="lg:hidden">
              <UploadBlock photoInputRef={photoInputRef} handlePhotos={handlePhotos} photos={photos} removePhoto={removePhoto} />
            </Card>

            {photos.length > 0 && (
              <Card className="lg:hidden">
                <AISummary audio={audio} durationLabel={durationLabel} quality={quality} />
              </Card>
            )}

            {photos.length > 0 && (
              <button onClick={() => setShowMobileSettings(s => !s)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm lg:hidden">
                <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-cyan-300" /> Settings & Audio</span>
                <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", showMobileSettings && "rotate-180")} />
              </button>
            )}

            <AnimatePresence>
              {showMobileSettings && photos.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden lg:hidden">
                  <Controls {...controlsProps} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <Card><UploadBlock photoInputRef={photoInputRef} handlePhotos={handlePhotos} photos={photos} removePhoto={removePhoto} /></Card>
            {photos.length > 0 && <AISummary audio={audio} durationLabel={durationLabel} quality={quality} />}
            <Controls {...controlsProps} />
          </aside>
        </section>

        <div className="mt-5 hidden lg:block">
          <div className="flex items-center gap-3">
            {generated ? (
              <button onClick={handleExport}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 font-black shadow-xl transition active:scale-[0.98]">
                <Download className="h-5 w-5" /> Download MP4
              </button>
            ) : (
              <button disabled={!photos.length || phase === "uploading" || phase === "rendering"} onClick={generate}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                <Wand2 className="h-5 w-5" /> Create Story
              </button>
            )}
            {hasLongVideo && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> Long video — may take time
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/85 p-4 backdrop-blur-xl lg:static lg:mt-6 lg:border-none lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-6xl gap-3">
            {generated ? (
              <button onClick={handleExport}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 font-black shadow-xl transition active:scale-[0.98]">
                <Download className="h-5 w-5" /> Download MP4
              </button>
            ) : (
              <button disabled={!photos.length || phase === "uploading" || phase === "rendering"} onClick={generate}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                <Wand2 className="h-5 w-5" /> Create Story
              </button>
            )}
            <button onClick={() => setShowMobileSettings(s => !s)}
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] lg:hidden">
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <footer className="relative mt-10 hidden items-center justify-between border-t border-white/10 py-5 text-xs text-slate-500 lg:flex">
          <p>Made with Caply AI · v0.1</p>
          <div className="flex gap-5"><span>About</span><span>Privacy</span><span>Terms</span></div>
        </footer>
      </div>

      <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotos(e.target.files)} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={e => handleAudio(e.target.files)} />
    </main>
  );
}

function UploadBlock({ photoInputRef, handlePhotos, photos, removePhoto }: {
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotos: (files: FileList | null) => void;
  photos: { id: string; url: string; name: string; size: number }[];
  removePhoto: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={() => photoInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handlePhotos(e.dataTransfer.files); }}
        className="group flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-6 text-center transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.08] active:scale-[0.99]"
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25">
          <Upload className="h-5 w-5" />
        </div>
        <p className="font-black">Add Photos</p>
        <p className="mt-1 text-xs text-slate-400">Drop images or tap to browse</p>
      </button>
      {photos.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
            <span>{formatBytes(photos.reduce((a, p) => a + p.size, 0))}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {photos.slice(0, 10).map(photo => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                <button onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AISummary({ audio, durationLabel, quality }: { audio: { name: string } | null; durationLabel: string; quality: string }) {
  return (
    <Card className="border-cyan-300/15 bg-cyan-300/[0.05]">
      <p className="mb-3 flex items-center gap-2 text-sm font-black">
        <Sparkles className="h-4 w-4 text-cyan-300" /> Caply will create
      </p>
      <div className="space-y-2 text-sm text-slate-300">
        <p>• Smooth transitions and motion</p>
        <p>• {audio ? `Audio: ${audio.name}` : "Music: Auto"}</p>
        <p>• {durationLabel} · {quality} · balanced timing</p>
      </div>
    </Card>
  );
}

function Controls(props: any) {
  const {
    audioInputRef, handleAudio, audio, removeAudio,
    duration, setDuration, customDuration, setCustomDuration, customUnit, setCustomUnit,
    style, setStyle, aspect, setAspect, quality, setQuality,
    fps, setFps, bitrate, setBitrate, transition, setTransition,
    hasLongVideo,
    audioTrimStart, setAudioTrimStart, audioTrimEnd, setAudioTrimEnd,
    audioLoop, setAudioLoop, audioFadeIn, setAudioFadeIn, audioFadeOut, setAudioFadeOut, audioVolume, setAudioVolume,
  } = props;

  return (
    <div className="space-y-3">
      <Section icon={Music} title="Music" defaultOpen={true}>
        <button onClick={() => audioInputRef.current?.click()}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left text-sm transition hover:bg-white/[0.08]">
          <span className="flex items-center gap-2 truncate">
            {audio ? <><Music className="h-4 w-4 text-cyan-300" /> {audio.name}</> : "Auto music"}
          </span>
          <span className="text-cyan-300">{audio ? "Change" : "Add"}</span>
        </button>
        {audio && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{audio.name}</span>
              <button onClick={removeAudio} className="text-xs text-red-300 hover:text-red-200">Remove</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Scissors className="h-3 w-3" /> Trim start (s)
              </div>
              <input type="range" min={0} max={60} step={1} value={audioTrimStart} onChange={e => setAudioTrimStart(Number(e.target.value))}
                className="w-full accent-cyan-400" />
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Scissors className="h-3 w-3" /> Trim end (s) {audioTrimEnd === undefined ? "(full)" : ""}
              </div>
              <input type="range" min={0} max={300} step={1} value={audioTrimEnd ?? 0}
                onChange={e => setAudioTrimEnd(Number(e.target.value) || undefined)}
                className="w-full accent-cyan-400" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <Repeat className="h-3 w-3" />
                  <input type="checkbox" checked={audioLoop} onChange={e => setAudioLoop(e.target.checked)} className="accent-cyan-400" /> Loop
                </label>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-300">Fade in (s)</div>
                <input type="range" min={0} max={5} step={0.5} value={audioFadeIn} onChange={e => setAudioFadeIn(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-300">Fade out (s)</div>
                <input type="range" min={0} max={5} step={0.5} value={audioFadeOut} onChange={e => setAudioFadeOut(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-300 flex items-center gap-1"><Volume2 className="h-3 w-3" /> Volume</div>
                <input type="range" min={0} max={2} step={0.1} value={audioVolume} onChange={e => setAudioVolume(Number(e.target.value))} className="w-full accent-cyan-400" />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section icon={Clock} title="Duration" defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {["15s", "30s", "60s", "5m", "10m", "30m", "1h", "Custom"].map(item => (
            <Pill key={item} active={duration === item} onClick={() => setDuration(item)}>{item}</Pill>
          ))}
        </div>
        {duration === "Custom" && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input value={customDuration} onChange={e => setCustomDuration(e.target.value)} type="number" min={1}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300" />
            <select value={customUnit} onChange={e => setCustomUnit(e.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none">
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        )}
        {hasLongVideo && (
          <div className="mt-3 flex gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0" /> Long video — may take time and resources.
          </div>
        )}
      </Section>

      <Section icon={Sparkles} title="Style" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {styles.map(item => <Pill key={item} active={style === item} onClick={() => setStyle(item)}>{item}</Pill>)}
        </div>
      </Section>

      <Section icon={Settings2} title="Export" defaultOpen={true}>
        <div className="mb-3">
          <p className="mb-2 text-xs text-slate-400">Quality</p>
          <div className="flex flex-wrap gap-2">
            {qualities.map(item => <Pill key={item} active={quality === item} onClick={() => setQuality(item)}>{item}</Pill>)}
          </div>
        </div>
        <div className="mb-3">
          <p className="mb-2 text-xs text-slate-400">Format</p>
          <div className="flex flex-wrap gap-2">
            {aspects.map(item => <Pill key={item} active={aspect === item} onClick={() => setAspect(item)}>{item}</Pill>)}
          </div>
        </div>
        <div className="mb-3">
          <p className="mb-2 text-xs text-slate-400">Transition</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map(item => <Pill key={item} active={transition === item} onClick={() => setTransition(item)}>{item === "fade" ? "Crossfade" : "None"}</Pill>)}
          </div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs text-slate-400">FPS</p>
            <input type="number" value={fps} min={15} max={60} onChange={e => setFps(Number(e.target.value))}
              className="h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300" />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">Bitrate</p>
            <input type="text" value={bitrate} onChange={e => setBitrate(e.target.value)}
              className="h-10 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300" />
          </div>
        </div>
      </Section>
    </div>
  );
}
