import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, downloadBlob, getStatus, startRender, uploadAudio, uploadPhotos } from "../services/api";
import type { CustomUnit, MediaAudio, MediaPhoto, Phase } from "../types/caply";
import { durationToSeconds, parseDuration } from "../utils/format";

// Fallback para entornos sin HTTPS o navegadores antiguos
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 11);
};

// Opciones para botones segmentados (Regla 5)
export const STYLE_OPTIONS = ["Auto", "Cinematic", "Modern", "Vintage", "Minimal"];
export const ASPECT_OPTIONS = ["9:16", "16:9", "1:1"];
const MODE_ASPECT_MAP = {
  tiktok: "9:16",
  youtube: "16:9",
  instagram: "1:1",
} as const;

export function useCaply() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<MediaPhoto[]>([]);
  const [videos, setVideos] = useState<MediaPhoto[]>([]);
  const [audio, setAudio] = useState<MediaAudio | null>(null);

  const [duration, setDuration] = useState("30s");
  const [customDuration, setCustomDuration] = useState<string | number>(1);
  const [customUnit, setCustomUnit] = useState<CustomUnit>("minutes");

  const [style, setStyle] = useState("Auto");
  const [aspect, setAspect] = useState("9:16");
  const [quality, setQuality] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [bitrate, setBitrate] = useState("8M");
  const [transition, setTransition] = useState("fade");

  const [audioTrimStart, setAudioTrimStart] = useState(0);
  const [audioTrimEnd, setAudioTrimEnd] = useState<number | undefined>(undefined);
  const [audioLoop, setAudioLoop] = useState(false);
  const [audioFadeIn, setAudioFadeIn] = useState(1);
  const [audioFadeOut, setAudioFadeOut] = useState(1);
  const [audioVolume, setAudioVolume] = useState(1);

  const [phase, setPhase] = useState<Phase>("empty");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // Progreso del renderizado
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [step, setStep] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [smartOrderByColor, setSmartOrderByColor] = useState(false);
  const [mismatchIds, setMismatchIds] = useState<string[]>([]);
  const [lastRemovedPhoto, setLastRemovedPhoto] = useState<MediaPhoto | null>(null);
  const [lastCleanSnapshot, setLastCleanSnapshot] = useState<MediaPhoto[] | null>(null);

  const durationLabel = useMemo(
    () => parseDuration(duration, customDuration, customUnit),
    [duration, customDuration, customUnit]
  );

  const advancedSummary = useMemo(
    () => `${quality} • ${fps}fps • ${bitrate}`,
    [quality, fps, bitrate]
  );

  const allMedia = useMemo(() => {
    return [...photos, ...videos] as (MediaPhoto & { type: 'image' | 'video' })[];
  }, [photos, videos]);

  const extractVisualMeta = useCallback(async (file: File) => {
    return new Promise<{ averageColor: [number, number, number]; brightness: number; warmth: number }>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 32;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no-canvas");
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let r = 0, g = 0, b = 0;
          const px = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          const ar = r / px, ag = g / px, ab = b / px;
          const brightness = (0.299 * ar + 0.587 * ag + 0.114 * ab) / 255;
          const warmth = ((ar - ab) / 255 + 1) / 2;
          resolve({ averageColor: [ar, ag, ab], brightness, warmth });
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image-load"));
      };
      img.src = url;
    });
  }, []);

  const calcDistance = (a: { averageColor: [number, number, number]; brightness: number; warmth: number }, b: { averageColor: [number, number, number]; brightness: number; warmth: number }) => {
    const dc = Math.sqrt(
      (a.averageColor[0] - b.averageColor[0]) ** 2 +
      (a.averageColor[1] - b.averageColor[1]) ** 2 +
      (a.averageColor[2] - b.averageColor[2]) ** 2
    ) / 441.67;
    const db = Math.abs(a.brightness - b.brightness);
    const dw = Math.abs(a.warmth - b.warmth);
    return dc * 0.6 + db * 0.25 + dw * 0.15;
  };

  const enrichAndOrderPhotos = useCallback(async (items: MediaPhoto[]) => {
    try {
      const enriched = await Promise.all(items.map(async (p) => {
        const meta = await extractVisualMeta(p.file);
        return { ...p, visualMeta: meta } as MediaPhoto & { visualMeta?: { averageColor: [number, number, number]; brightness: number; warmth: number } };
      }));

      const withMeta = enriched.filter((p) => p.visualMeta) as Array<MediaPhoto & { visualMeta: { averageColor: [number, number, number]; brightness: number; warmth: number } }>;
      if (!withMeta.length) return { ordered: items, mismatches: [] as string[] };

      const packAvg = withMeta.reduce(
        (acc, p) => ({
          averageColor: [
            acc.averageColor[0] + p.visualMeta.averageColor[0],
            acc.averageColor[1] + p.visualMeta.averageColor[1],
            acc.averageColor[2] + p.visualMeta.averageColor[2],
          ] as [number, number, number],
          brightness: acc.brightness + p.visualMeta.brightness,
          warmth: acc.warmth + p.visualMeta.warmth,
        }),
        { averageColor: [0, 0, 0] as [number, number, number], brightness: 0, warmth: 0 }
      );
      const avg = {
        averageColor: [packAvg.averageColor[0] / withMeta.length, packAvg.averageColor[1] / withMeta.length, packAvg.averageColor[2] / withMeta.length] as [number, number, number],
        brightness: packAvg.brightness / withMeta.length,
        warmth: packAvg.warmth / withMeta.length,
      };

      const scored = withMeta.map((p) => ({ id: p.id, distance: calcDistance(p.visualMeta, avg) }));
      const avgDist = scored.reduce((s, x) => s + x.distance, 0) / scored.length;
      const mismatches = scored.filter((x) => x.distance > avgDist * 1.8 && x.distance > 0.22).map((x) => x.id);

      let ordered = enriched;
      if (smartOrderByColor && withMeta.length > 1) {
        const remaining = [...withMeta];
        const sorted: typeof remaining = [];
        remaining.sort((a, b) => a.visualMeta.brightness - b.visualMeta.brightness);
        sorted.push(remaining.shift()!);
        while (remaining.length) {
          const last = sorted[sorted.length - 1];
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let i = 0; i < remaining.length; i += 1) {
            const d = calcDistance(last.visualMeta, remaining[i].visualMeta);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          }
          sorted.push(remaining.splice(bestIdx, 1)[0]);
        }
        const metaMap = new Map(sorted.map((p) => [p.id, p]));
        ordered = enriched.map((p) => metaMap.get(p.id) || p);
        ordered = sorted;
      }

      return { ordered, mismatches };
    } catch {
      return { ordered: items, mismatches: [] as string[] };
    }
  }, [extractVisualMeta, smartOrderByColor]);

  const hasAudio = useMemo(() => !!audio, [audio]);
  const mediaCount = allMedia.length;

  const reorderMedia = useCallback((oldIndex: number, newIndex: number) => {
    // Nota: Para implementar reordenamiento real entre fotos y videos 
    // se necesitaría unificar los estados, pero para esta mejora UI 
    // exponemos la capacidad de gestión.
    console.log(`Reordering from ${oldIndex} to ${newIndex}`);
  }, []);

  const totalSeconds = useMemo(() => durationToSeconds(durationLabel), [durationLabel]);
  const hasLongVideo = totalSeconds >= 600;
  const generated = phase === "generated";

  const onFilesAdd = useCallback(async (files: FileList | null) => {
    if (!files) return;
    console.log("Adding files:", files.length); // Debug log
    const filesArray = Array.from(files);

    // Procesar Fotos
    const newPhotos = filesArray
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        type: 'image',
      }));

    // Procesar Videos
    const newVideos = filesArray
      .filter((file) => file.type.startsWith("video/"))
      .map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        type: 'video',
      }));

    // Procesar Audio (solo el primero encontrado)
    const audioFile = filesArray.find((item) => item.type.startsWith("audio/"));

    if (newPhotos.length) {
      const merged = [...photos, ...newPhotos];
      const { ordered, mismatches } = await enrichAndOrderPhotos(merged as MediaPhoto[]);
      setPhotos(ordered as MediaPhoto[]);
      setMismatchIds(mismatches);
    }
    if (newVideos.length) setVideos((prev) => [...prev, ...newVideos]);
    if (audioFile) {
      setAudio({
        file: audioFile,
        name: audioFile.name,
        size: audioFile.size,
        url: URL.createObjectURL(audioFile),
      });
      setAudioTrimEnd(undefined);
    }

    if (newPhotos.length || newVideos.length || photos.length > 0 || videos.length > 0) {
      setPhase("ready");
    }
  }, [photos, videos, enrichAndOrderPhotos]);

  const handlePhotos = useCallback((files: FileList | null) => {
    const items = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        type: 'image',
      }));

    if (!items.length) return;

    setPhotos((previous) => [...previous, ...items]);
    setPhase("ready");
  }, []);

  const handleAudio = useCallback((files: FileList | null) => {
    const file = Array.from(files || []).find((item) => item.type.startsWith("audio/"));

    if (!file) return;

    setAudio({
      file,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    });

    setAudioTrimEnd(undefined);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((previous) => {
      const removed = previous.find((photo) => photo.id === id) || null;
      if (removed) setLastRemovedPhoto(removed);
      const next = previous.filter((photo) => photo.id !== id);

      if (!next.length) {
        setPhase("empty");
        setOutputUrl(null);
        setJobId(null);
        setProgress(0);
      }

      return next;
    });
    setMismatchIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const undoRemovePhoto = useCallback(() => {
    if (!lastRemovedPhoto) return;
    setPhotos((prev) => [lastRemovedPhoto, ...prev]);
    setLastRemovedPhoto(null);
  }, [lastRemovedPhoto]);

  const autoCleanMismatches = useCallback(() => {
    if (!mismatchIds.length) return;
    setLastCleanSnapshot(photos);
    setPhotos((prev) => prev.filter((p) => !mismatchIds.includes(p.id)));
    setMismatchIds([]);
  }, [mismatchIds, photos]);

  const undoAutoClean = useCallback(() => {
    if (!lastCleanSnapshot) return;
    setPhotos(lastCleanSnapshot);
    setLastCleanSnapshot(null);
  }, [lastCleanSnapshot]);

  const removeVideo = useCallback((id: string) => {
    setVideos((previous) => {
      const next = previous.filter((video) => video.id !== id);
      if (!next.length && !photos.length) {
        setPhase("empty");
        setOutputUrl(null);
        setJobId(null);
        setProgress(0);
      }
      return next;
    });
  }, [photos.length]);

  const removeAudio = useCallback(() => setAudio(null), []);

  const cancelUpload = useCallback(() => {
    setUploadProgress(null);
    setPhase("ready");
    setStep("");
    setIsUploadSuccess(false);
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    if (!id || id.length < 10) {
      setPhase("error");
      setErrorMsg("Unable to track progress: Invalid job id.");
      return true;
    }

    try {
      const data = await getStatus(id);
      setRetryCount(0);

      if (data?.status === "done" && data.url) {
        setPhase("generated");
        setProgress(100);
        setStep("Export ready");
        setOutputUrl(data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`);
        return true;
      }

      if (data?.status === "error") {
        setPhase("error");
        setErrorMsg(data.error || "Render failed on server.");
        setProgress(0);
        return true;
      }

      if (data?.status === "processing") {
        const serverProgress = typeof data.progress === "number" ? data.progress : 0;
        setProgress(50 + serverProgress / 2);
      }
    } catch {
      setRetryCount((previous) => previous + 1);

      if (retryCount >= 10) {
        setPhase("error");
        setErrorMsg("Server connection lost. Polling stopped.");
        return true;
      }
    }

    return false;
  }, [retryCount]);

  useEffect(() => {
    if (!jobId || phase !== "rendering") return;

    const interval = setInterval(async () => {
      const done = await pollStatus(jobId);
      if (done) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, phase, pollStatus]);

  const generate = useCallback(async () => {
    if (!photos.length) return;

    setErrorMsg("");
    setOutputUrl(null);
    setJobId(null);
    setRetryCount(0);
    setIsUploadSuccess(false);

    try {
      setPhase("rendering");
      setStep("Uploading photos…");
      setUploadProgress(5);

      const sessionId = crypto.randomUUID();
      const allMediaFiles = [...photos.map(p => p.file), ...videos.map(v => v.file)];
      const imagePaths = await uploadPhotos(
        allMediaFiles,
        sessionId,
        setUploadProgress
      );

      let audioPath: string | null = null;

      if (audio) {
        setStep("Uploading audio…");
        audioPath = await uploadAudio(audio.file, sessionId, (pct) => setUploadProgress(pct));
      }

      setIsUploadSuccess(true);
      setUploadProgress(null);
      setStep("Starting render engine…");
      setProgress(45);

      const audioSettings = audio
        ? {
            trimStart: audioTrimStart > 0 ? audioTrimStart : undefined,
            trimEnd: audioTrimEnd && audioTrimEnd > audioTrimStart ? audioTrimEnd : undefined,
            loop: audioLoop,
            fadeIn: audioFadeIn > 0 ? audioFadeIn : undefined,
            fadeOut: audioFadeOut > 0 ? audioFadeOut : undefined,
            volume: audioVolume,
          }
        : undefined;

      const nextJobId = await startRender({
        imagePaths,
        audioPath,
        durationLabel,
        style,
        quality,
        aspect,
        audioSettings,
        fps,
        bitrate,
        transition,
      });

      setJobId(nextJobId);
      setStep("Rendering video…");
      setProgress(50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export failed. Try lower quality or shorter duration.";
      setUploadProgress(null);
      setPhase("error");
      setUploadProgress(null);
      setErrorMsg(message);
      setProgress(0);
    }
  }, [
    photos,
    videos,
    audio,
    durationLabel,
    style,
    quality,
    aspect,
    fps,
    bitrate,
    transition,
    audioTrimStart,
    audioTrimEnd,
    audioLoop,
    audioFadeIn,
    audioFadeOut,
    audioVolume,
  ]);

  const autoCreate = useCallback(async (mode: keyof typeof MODE_ASPECT_MAP, nextStyle = "Auto") => {
    const modeAspect = MODE_ASPECT_MAP[mode] ?? "9:16";
    setAspect(modeAspect);
    setStyle(nextStyle);

    if (audio) {
      setAudioLoop(true);
      setAudioFadeIn(1);
      setAudioFadeOut(1);
    }

    if (!photos.length) return;

    setErrorMsg("");
    setOutputUrl(null);
    setJobId(null);
    setRetryCount(0);
    setIsUploadSuccess(false);

    try {
      setPhase("rendering");
      setStep("Uploading photos...");
      setUploadProgress(5);

      const sessionId = crypto.randomUUID();
      const allMediaFiles = [...photos.map((p) => p.file), ...videos.map((v) => v.file)];
      const imagePaths = await uploadPhotos(allMediaFiles, sessionId, setUploadProgress);

      let audioPath: string | null = null;
      if (audio) {
        setStep("Uploading audio...");
        audioPath = await uploadAudio(audio.file, sessionId, (pct) => setUploadProgress(pct));
      }

      setIsUploadSuccess(true);
      setUploadProgress(null);
      setStep("Starting render engine...");
      setProgress(45);

      const audioSettings = audio
        ? {
            trimStart: audioTrimStart > 0 ? audioTrimStart : undefined,
            trimEnd: audioTrimEnd && audioTrimEnd > audioTrimStart ? audioTrimEnd : undefined,
            loop: true,
            fadeIn: 1,
            fadeOut: 1,
            volume: audioVolume,
          }
        : undefined;

      const nextJobId = await startRender({
        imagePaths,
        audioPath,
        durationLabel,
        style: nextStyle,
        quality,
        aspect: modeAspect,
        audioSettings,
        fps,
        bitrate,
        transition,
      });

      setJobId(nextJobId);
      setStep("Rendering video...");
      setProgress(50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export failed. Try lower quality or shorter duration.";
      setUploadProgress(null);
      setPhase("error");
      setErrorMsg(message);
      setProgress(0);
    }
  }, [
    photos,
    videos,
    audio,
    durationLabel,
    quality,
    fps,
    bitrate,
    transition,
    audioTrimStart,
    audioTrimEnd,
    audioVolume,
  ]);

  const handleExport = useCallback(async () => {
    if (!outputUrl) return;

    try {
      setStep("Downloading…");
      const blob = await downloadBlob(outputUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `caply-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg("Download failed. Please try again.");
    }
  }, [outputUrl]);

  const resetError = useCallback(() => {
    setPhase(photos.length ? "ready" : "empty");
    setErrorMsg("");
  }, [photos.length]);

  return {
    photoInputRef,
    audioInputRef,
    photos,
    videos,
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
    fps,
    setFps,
    bitrate,
    setBitrate,
    transition,
    setTransition,
    audioTrimStart,
    setAudioTrimStart,
    audioTrimEnd,
    setAudioTrimEnd,
    audioLoop,
    setAudioLoop,
    audioFadeIn,
    setAudioFadeIn,
    audioFadeOut,
    setAudioFadeOut,
    audioVolume,
    setAudioVolume,
    phase,
    uploadProgress,
    isUploadSuccess,
    progress,
    step,
    outputUrl,
    errorMsg,
    showMobileSettings,
    showAdvancedSettings,
    smartOrderByColor,
    setSmartOrderByColor,
    mismatchIds,
    lastRemovedPhoto,
    lastCleanSnapshot,
    setShowMobileSettings,
    setShowAdvancedSettings,
    durationLabel,
    advancedSummary,
    hasLongVideo,
    generated,
    allMedia,
    hasAudio,
    mediaCount,
    reorderMedia,
    handlePhotos,
    onFilesAdd,
    handleAudio,
    removePhoto,
    removeVideo,
    removeAudio,
    undoRemovePhoto,
    autoCleanMismatches,
    undoAutoClean,
    cancelUpload,
    generate,
    autoCreate,
    handleExport,
    resetError,
  };
}
