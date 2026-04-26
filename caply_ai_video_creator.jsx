import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Music,
  Sparkles,
  Smartphone,
  Monitor,
  Wand2,
  Play,
  Download,
  Settings2,
  Image as ImageIcon,
  Clock,
  Film,
  AlertCircle,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const styles = ["Auto", "Smooth", "Dynamic", "Emotional", "Cinematic", "Minimal"];
const aspects = ["9:16", "16:9", "1:1", "4:5"];
const qualities = ["720p", "1080p", "2K", "4K", "Custom"];
const durations = ["15s", "30s", "60s", "5m", "10m", "30m", "1h", "Custom"];

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function parseDuration(value, customValue, customUnit) {
  if (value !== "Custom") return value;
  const n = Number(customValue || 0);
  if (!n || n <= 0) return "Custom";
  if (customUnit === "hours") return `${n}h`;
  if (customUnit === "minutes") return `${n}m`;
  return `${n}s`;
}

function estimateExport({ imageCount, quality, durationLabel }) {
  const qualityFactor = { "720p": 1, "1080p": 1.8, "2K": 3, "4K": 6, Custom: 4 }[quality] || 1.8;
  const longFactor = durationLabel.includes("h") ? 8 : durationLabel.includes("30m") ? 5 : durationLabel.includes("10m") ? 3 : 1;
  const fileSize = Math.max(8, imageCount * 2.8 * qualityFactor * longFactor) * 1024 * 1024;
  const renderMinutes = Math.max(1, Math.ceil(imageCount * 0.25 * qualityFactor * longFactor));
  return { fileSize, renderMinutes };
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return (
    <div className={cx("rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
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

function Section({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-cyan-300" /> {title}
        </span>
        <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 p-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function CaplyApp() {
  const photoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [audio, setAudio] = useState(null);
  const [duration, setDuration] = useState("30s");
  const [customDuration, setCustomDuration] = useState(1);
  const [customUnit, setCustomUnit] = useState("minutes");
  const [style, setStyle] = useState("Auto");
  const [aspect, setAspect] = useState("9:16");
  const [quality, setQuality] = useState("1080p");
  const [phase, setPhase] = useState("empty");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [generated, setGenerated] = useState(false);

  const durationLabel = parseDuration(duration, customDuration, customUnit);
  const estimate = useMemo(
    () => estimateExport({ imageCount: photos.length, quality, durationLabel }),
    [photos.length, quality, durationLabel]
  );

  const hasLongVideo = durationLabel.includes("h") || durationLabel.includes("30m") || durationLabel.includes("10m");

  const handlePhotos = (files) => {
    const items = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
    setPhotos((prev) => [...prev, ...items]);
    if (items.length) setPhase("ready");
  };

  const handleAudio = (files) => {
    const file = Array.from(files || []).find((item) => item.type.startsWith("audio/"));
    if (file) setAudio({ file, name: file.name, url: URL.createObjectURL(file) });
  };

  const generate = async () => {
    if (!photos.length) return;
    setGenerated(false);
    setPhase("rendering");
    const steps = [
      "Reading media…",
      "Analyzing photos…",
      "Building story…",
      "Syncing audio…",
      "Rendering preview…",
      "Preparing export…",
    ];

    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 420));
    }

    setGenerated(true);
    setPhase("generated");
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (photos.length <= 1) {
      setPhase("empty");
      setGenerated(false);
    }
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

        <section className="grid flex-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-5">
            <Card className="overflow-hidden p-3 sm:p-4">
              <div className="relative aspect-[9/16] max-h-[62vh] w-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-black sm:aspect-video sm:max-h-[520px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_70%_75%,rgba(168,85,247,0.20),transparent_36%)]" />
                {photos[0] ? (
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
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-sm"
                    >
                      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.08]">
                        <Film className="h-8 w-8 text-cyan-300" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight sm:text-4xl">Ready when you are</h2>
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

                {generated && (
                  <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-cyan-300" /> Story preview generated
                    </p>
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
          </div>

          <aside className="hidden space-y-4 lg:block">
            <Card>
              <UploadBlock photoInputRef={photoInputRef} handlePhotos={handlePhotos} photos={photos} removePhoto={removePhoto} />
            </Card>

            {photos.length > 0 && <AISummary audio={audio} durationLabel={durationLabel} quality={quality} />}

            <Controls
              audioInputRef={audioInputRef}
              handleAudio={handleAudio}
              audio={audio}
              duration={duration}
              setDuration={setDuration}
              customDuration={customDuration}
              setCustomDuration={setCustomDuration}
              customUnit={customUnit}
              setCustomUnit={setCustomUnit}
              style={style}
              setStyle={setStyle}
              aspect={aspect}
              setAspect={setAspect}
              quality={quality}
              setQuality={setQuality}
              estimate={estimate}
              hasLongVideo={hasLongVideo}
            />
          </aside>
        </section>

        <div className="mt-5 hidden lg:block">
          <Controls
            compact
            audioInputRef={audioInputRef}
            handleAudio={handleAudio}
            audio={audio}
            duration={duration}
            setDuration={setDuration}
            customDuration={customDuration}
            setCustomDuration={setCustomDuration}
            customUnit={customUnit}
            setCustomUnit={setCustomUnit}
            style={style}
            setStyle={setStyle}
            aspect={aspect}
            setAspect={setAspect}
            quality={quality}
            setQuality={setQuality}
            estimate={estimate}
            hasLongVideo={hasLongVideo}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/85 p-4 backdrop-blur-xl lg:static lg:mt-6 lg:border-none lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-6xl gap-3">
            {generated ? (
              <button className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 font-black shadow-xl transition active:scale-[0.98]">
                <Download className="h-5 w-5" /> Export Video
              </button>
            ) : (
              <button
                disabled={!photos.length || phase === "rendering"}
                onClick={generate}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Wand2 className="h-5 w-5" /> Create Story
              </button>
            )}
            <button className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] lg:hidden">
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3 lg:hidden">
          {photos.length > 0 && (
            <Controls
              audioInputRef={audioInputRef}
              handleAudio={handleAudio}
              audio={audio}
              duration={duration}
              setDuration={setDuration}
              customDuration={customDuration}
              setCustomDuration={setCustomDuration}
              customUnit={customUnit}
              setCustomUnit={setCustomUnit}
              style={style}
              setStyle={setStyle}
              aspect={aspect}
              setAspect={setAspect}
              quality={quality}
              setQuality={setQuality}
              estimate={estimate}
              hasLongVideo={hasLongVideo}
            />
          )}
        </div>

        <footer className="relative mt-10 hidden items-center justify-between border-t border-white/10 py-5 text-xs text-slate-500 lg:flex">
          <p>Made with Caply AI · v0.1</p>
          <div className="flex gap-5">
            <span>About</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </footer>
      </div>

      <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudio(e.target.files)} />
    </main>
  );
}

function UploadBlock({ photoInputRef, handlePhotos, photos, removePhoto }) {
  return (
    <div>
      <button
        onClick={() => photoInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handlePhotos(e.dataTransfer.files);
        }}
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
            {photos.slice(0, 10).map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                <button onClick={() => removePhoto(photo.id)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100">
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

function AISummary({ audio, durationLabel, quality }) {
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

function Controls(props) {
  const {
    audioInputRef,
    handleAudio,
    audio,
    duration,
    setDuration,
    customDuration,
    setCustomDuration,
    customUnit,
    setCustomUnit,
    style,
    setStyle,
    aspect,
    setAspect,
    quality,
    setQuality,
    estimate,
    hasLongVideo,
    compact,
  } = props;

  const body = (
    <div className={cx("grid gap-3", compact && "lg:grid-cols-4")}> 
      <Section icon={Music} title="Music" defaultOpen={!compact}>
        <button onClick={() => audioInputRef.current?.click()} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left text-sm transition hover:bg-white/[0.08]">
          <span>{audio ? audio.name : "Auto music"}</span>
          <span className="text-cyan-300">Change</span>
        </button>
      </Section>

      <Section icon={Clock} title="Duration" defaultOpen={!compact}>
        <div className="flex flex-wrap gap-2">
          {durations.map((item) => (
            <Pill key={item} active={duration === item} onClick={() => setDuration(item)}>{item}</Pill>
          ))}
        </div>
        {duration === "Custom" && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} type="number" min="1" className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-cyan-300" />
            <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none">
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        )}
      </Section>

      <Section icon={Sparkles} title="Style" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {styles.map((item) => <Pill key={item} active={style === item} onClick={() => setStyle(item)}>{item}</Pill>)}
        </div>
      </Section>

      <Section icon={Settings2} title="Export" defaultOpen={false}>
        <div className="mb-3">
          <p className="mb-2 text-xs text-slate-400">Quality</p>
          <div className="flex flex-wrap gap-2">
            {qualities.map((item) => <Pill key={item} active={quality === item} onClick={() => setQuality(item)}>{item}</Pill>)}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-slate-400">Format</p>
          <div className="flex flex-wrap gap-2">
            {aspects.map((item) => <Pill key={item} active={aspect === item} onClick={() => setAspect(item)}>{item}</Pill>)}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-slate-300">
          <p>Estimated size: {formatBytes(estimate.fileSize)}</p>
          <p>Estimated render: ~{estimate.renderMinutes} min</p>
        </div>
        {hasLongVideo && (
          <div className="mt-3 flex gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0" /> Long videos may take more time and device resources.
          </div>
        )}
      </Section>
    </div>
  );

  return compact ? body : <div className="space-y-3">{body}</div>;
}
