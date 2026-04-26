import axios from "axios";
import type { AudioSettings } from "../types/caply";

export const API_BASE = "";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function uploadPhotos(files: File[], sessionId: string, onProgress?: (pct: number) => void) {
  const form = new FormData();
  files.forEach((file) => form.append("photos", file));

  const { data } = await api.post("/upload/photos", form, {
    headers: { "x-session-id": sessionId },
    onUploadProgress: (event) => {
      const pct = event.total ? Math.round((event.loaded / event.total) * 30) : 10;
      onProgress?.(pct);
    },
  });

  if (!data?.ok) throw new Error(data?.error || "Photo upload failed");
  return data.files as string[];
}

export async function uploadAudio(file: File, sessionId: string, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append("audio", file);

  const { data } = await api.post("/upload/audio", form, {
    headers: { "x-session-id": sessionId },
    onUploadProgress: (event) => {
      const pct = event.total ? Math.round((event.loaded / event.total) * 10) : 5;
      onProgress?.(pct);
    },
  });

  if (!data?.ok) throw new Error(data?.error || "Audio upload failed");
  return data.file as string;
}

export type RenderPayload = {
  imagePaths: string[];
  audioPath: string | null;
  durationLabel: string;
  style: string;
  quality: string;
  aspect: string;
  audioSettings?: AudioSettings;
  fps: number;
  bitrate: string;
  transition: string;
};

export async function startRender(payload: RenderPayload) {
  const { data } = await api.post("/render", payload);
  if (!data?.ok || !data?.jobId) throw new Error(data?.error || "Server failed to initiate render job");
  return data.jobId as string;
}

export async function getStatus(jobId: string) {
  const { data } = await api.get(`/status/${jobId}`);
  return data;
}

export async function downloadBlob(outputUrl: string) {
  const url = outputUrl.startsWith("http") ? new URL(outputUrl).pathname : outputUrl;
  const response = await api.get(url, { responseType: "blob" });
  return new Blob([response.data], { type: "video/mp4" });
}
