import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, downloadBlob, getStatus, startRender, uploadAudio, uploadPhotos } from "../services/api";
import type { CustomUnit, MediaAudio, MediaPhoto, Phase } from "../types/caply";
import { durationToSeconds, parseDuration } from "../utils/format";

// Fallback para entornos sin HTTPS o navegadores antiguos
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 11);
};

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
  const [step, setStep] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const durationLabel = useMemo(
    () => parseDuration(duration, customDuration, customUnit),
    [duration, customDuration, customUnit]
  );

  const totalSeconds = useMemo(() => durationToSeconds(durationLabel), [durationLabel]);
  const hasLongVideo = totalSeconds >= 600;
  const generated = phase === "generated";

  const onFilesAdd = useCallback((files: FileList | null) => {
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
      }));

    // Procesar Audio (solo el primero encontrado)
    const audioFile = filesArray.find((item) => item.type.startsWith("audio/"));

    if (newPhotos.length) setPhotos((prev) => [...prev, ...newPhotos]);
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
  }, [photos.length, videos.length]);

  const handlePhotos = useCallback((files: FileList | null) => {
    const items = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
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
      const next = previous.filter((photo) => photo.id !== id);

      if (!next.length) {
        setPhase("empty");
        setOutputUrl(null);
        setJobId(null);
        setProgress(0);
      }

      return next;
    });
  }, []);

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
    } catch (error: any) {
      setUploadProgress(null); // Detenemos la animación si la subida falla (ej. 404)
      setPhase("error");
      setUploadProgress(null);
      setErrorMsg(error?.response?.data?.error || error?.message || "Export failed. Try lower quality or shorter duration.");
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
    setShowMobileSettings,
    durationLabel,
    hasLongVideo,
    generated,
    handlePhotos,
    onFilesAdd,
    handleAudio,
    removePhoto,
    removeVideo,
    removeAudio,
    cancelUpload,
    generate,
    handleExport,
    resetError,
  };
}
