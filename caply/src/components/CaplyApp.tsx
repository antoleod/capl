import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, Settings2 } from "lucide-react";
import { Background } from "./layout/Background";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { ActionBar } from "./layout/ActionBar";
import { PreviewStage } from "./preview/PreviewStage";
import { UploadBlock } from "./upload/UploadBlock";
import { AISummary } from "./summary/AISummary";
import { ControlPanel } from "./controls/ControlPanel";
import { Card } from "./ui/Card";
import { useCaply } from "../hooks/useCaply";
import { cn } from "../utils/cn";

export default function CaplyApp() {
  const caply = useCaply();

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
    <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <Background />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
        <Header />

        <section className="grid flex-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
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

            <Card className="lg:hidden">
              <UploadBlock
                photoInputRef={caply.photoInputRef}
                handlePhotos={caply.handlePhotos}
                photos={caply.photos}
                removePhoto={caply.removePhoto}
              />
            </Card>

            {caply.photos.length > 0 && (
              <Card className="lg:hidden">
                <AISummary audio={caply.audio} durationLabel={caply.durationLabel} quality={caply.quality} />
              </Card>
            )}

            {caply.photos.length > 0 && (
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
              {caply.showMobileSettings && caply.photos.length > 0 && (
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
            <Card>
              <UploadBlock
                photoInputRef={caply.photoInputRef}
                handlePhotos={caply.handlePhotos}
                photos={caply.photos}
                removePhoto={caply.removePhoto}
              />
            </Card>

            {caply.photos.length > 0 && (
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

        <ActionBar
          generated={caply.generated}
          canCreate={caply.photos.length > 0}
          isRendering={caply.phase === "rendering"}
          onCreate={caply.generate}
          onExport={caply.handleExport}
          onToggleSettings={() => caply.setShowMobileSettings((value) => !value)}
        />

        <Footer />
      </div>

      <input
        ref={caply.photoInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => caply.handlePhotos(event.target.files)}
      />

      <input
        ref={caply.audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => caply.handleAudio(event.target.files)}
      />
    </main>
  );
}
