import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, Settings2, Upload, RefreshCw, Wand2, Download, X } from "lucide-react";
import { Background } from "./layout/Background";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { PreviewStage } from "./preview/PreviewStage";
import { MediaInput } from "./MediaInput";
import { AISummary } from "./summary/AISummary";
import { ControlPanel } from "./controls/ControlPanel";
import { Card } from "./ui/Card";
import { useCaply } from "../hooks/useCaply";
import { cn } from "../utils/cn";
import { useState } from "react";

export default function CaplyApp() {
  const caply = useCaply();
  const [isDragging, setIsDragging] = useState(false);

  // Manejador Global de Drag and Drop
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
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    // Centralizamos la lógica de archivos
    // El hook useCaply debería tener una función única o filtrar aquí
    caply.onFilesAdd?.(files); 
  };

  const controlsProps = {
    audioInputRef: caply.audioInputRef,
    audio: caply.audio,
    removeAudio: caply.removeAudio,
    duration: caply.duration,
    setDuration: caply.setDuration,
    customDuration: caply.customDuration,
    setCustomDuration: caply.setCustomDuration,
    customUnit: caply.customUnit,
    setCustomUnit: caply.setCustomUnit,
    style: caply.style,
    setStyle: caply.setStyle,
    aspect: caply.aspect,
    setAspect: caply.setAspect,
    quality: caply.quality,
    setQuality: caply.setQuality,
    fps: caply.fps,
    setFps: caply.setFps,
    bitrate: caply.bitrate,
    setBitrate: caply.setBitrate,
    transition: caply.transition,
    setTransition: caply.setTransition,
    hasLongVideo: caply.hasLongVideo,
    audioTrimStart: caply.audioTrimStart,
    setAudioTrimStart: caply.setAudioTrimStart,
    audioTrimEnd: caply.audioTrimEnd,
    setAudioTrimEnd: caply.setAudioTrimEnd,
    audioLoop: caply.audioLoop,
    setAudioLoop: caply.setAudioLoop,
    audioFadeIn: caply.audioFadeIn,
    setAudioFadeIn: caply.setAudioFadeIn,
    audioFadeOut: caply.audioFadeOut,
    setAudioFadeOut: caply.setAudioFadeOut,
    audioVolume: caply.audioVolume,
    setAudioVolume: caply.setAudioVolume,
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

      {/* Overlay Global de Drag and Drop */}
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

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-3 pb-24 pt-3 sm:px-5 lg:px-8 lg:pb-8">
        <Header />

        <section className="grid flex-1 gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)] lg:items-start">
          <div className="space-y-6">
            <PreviewStage
              photos={caply.photos}
              audio={caply.audio}
              outputUrl={caply.outputUrl}
              phase={caply.phase}
              progress={caply.progress}
              step={caply.step}
              errorMsg={caply.errorMsg}
              durationLabel={caply.durationLabel}
              quality={caply.quality}
              aspect={caply.aspect}
              onResetError={caply.resetError}
            />

            <div className="lg:hidden">
              <Card className="p-0 overflow-hidden">
                <MediaInput
                  photos={caply.photos}
                  videos={caply.videos || []} 
                  audio={caply.audio}
                  onFilesAdd={handleFiles}
                  uploadProgress={caply.uploadProgress}
                  isUploadSuccess={caply.isUploadSuccess}
                  onCancelUpload={caply.cancelUpload}
                  onPhotoRemove={caply.removePhoto}
                  onAudioRemove={caply.removeAudio}
                  onVideoRemove={caply.removeVideo}
                />
              </Card>
            </div>

            {(caply.photos.length > 0 || caply.videos?.length > 0) && (
              <Card className="lg:hidden">
                <AISummary audio={caply.audio} durationLabel={caply.durationLabel} quality={caply.quality} />
              </Card>
            )}

            {(caply.photos.length > 0 || caply.videos?.length > 0) && (
              <button
                type="button"
                onClick={() => caply.setShowMobileSettings((value) => !value)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm lg:hidden"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-cyan-300" />
                  Settings & Audio
                </span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", caply.showMobileSettings && "rotate-180")} />
              </button>
            )}

            <AnimatePresence>
              {caply.showMobileSettings && (caply.photos.length > 0 || caply.videos?.length > 0) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden lg:hidden"
                >
                  <ControlPanel {...controlsProps} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <Card className="p-0 overflow-hidden">
              <MediaInput
                photos={caply.photos}
                videos={caply.videos || []} 
                audio={caply.audio}
                onFilesAdd={handleFiles}
                uploadProgress={caply.uploadProgress}
                isUploadSuccess={caply.isUploadSuccess}
                onCancelUpload={caply.cancelUpload}
                onPhotoRemove={caply.removePhoto}
                onAudioRemove={caply.removeAudio}
                onVideoRemove={caply.removeVideo}
              />
            </Card>

            {(caply.photos.length > 0 || caply.videos?.length > 0) && (
              <AISummary audio={caply.audio} durationLabel={caply.durationLabel} quality={caply.quality} />
            )}

            <ControlPanel {...controlsProps} />

            {caply.hasLongVideo && caply.phase !== "generated" && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Long video — may take time
              </div>
            )}
          </aside>
        </section>

        {/* Bottom Bar Unificada con Spinner */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/90 p-3 backdrop-blur-2xl lg:static lg:mt-6 lg:border-none lg:bg-transparent lg:p-0">
          <div className="mx-auto flex w-full max-w-7xl gap-3">
            {caply.generated ? (
              <button 
                onClick={caply.handleExport}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 font-black shadow-xl transition active:scale-[0.98]"
              >
                <Download className="h-5 w-5" /> Export Video
              </button>
            ) : (
              <button
                type="button"
                disabled={(!caply.photos.length && !caply.videos?.length) || caply.phase === "rendering"}
                onClick={caply.generate}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-slate-950 shadow-2xl shadow-cyan-400/20 transition hover:shadow-cyan-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {caply.phase === "rendering" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
                {caply.phase === "rendering" ? "Creating Story..." : "Create Story"}
              </button>
            )}
            <button 
              type="button"
              onClick={() => caply.setShowMobileSettings((v) => !v)}
              className={cn(
                "grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] lg:hidden transition-colors",
                caply.showMobileSettings && "bg-cyan-300/20 border-cyan-300/30"
              )}
              aria-label="Open settings"
            >
              <Settings2 className={cn("h-5 w-5 transition-transform", caply.showMobileSettings && "text-cyan-300 rotate-90")} />
            </button>
          </div>
        </div>

        {/* Notificación Toast Inteligente */}
        <AnimatePresence>
          {caply.errorMsg && (
            <motion.div // Use caply.errorMsg to determine visibility
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
                  <p className="mt-1 break-all font-mono text-[9px] text-red-400/50">{caply.step || "No additional details"}</p>
                </div>
                <button onClick={caply.resetError} className="text-white/20 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </main>
  );
}
