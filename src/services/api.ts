export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface RenderStatus {
  status: "processing" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
}

type UploadResponse = {
  files: Array<{ path: string }>;
};

export type RenderRequest = {
  imagePaths: string[];
  audioPath: string | null;
  durationLabel: string;
  style: string;
  quality: string;
  aspect: string;
  audioSettings?: {
    trimStart?: number;
    trimEnd?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    volume?: number;
  };
  fps: number;
  bitrate: string;
  transition: string;
};

export const uploadPhotos = async (
  files: File[],
  sessionId: string,
  onProgress: (pct: number) => void
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));
    formData.append("sessionId", sessionId);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const resp = JSON.parse(xhr.responseText) as UploadResponse;
        resolve(resp.files.map((f) => f.path));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", `${API_BASE}/upload/photos`);
    xhr.send(formData);
  });
};

export const uploadAudio = async (
  file: File,
  sessionId: string,
  onProgress: (pct: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("audio", file);
    formData.append("sessionId", sessionId);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const resp = JSON.parse(xhr.responseText) as UploadResponse;
        resolve(resp.files[0].path);
      } else {
        reject(new Error(`Audio upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", `${API_BASE}/upload/photos`);
    xhr.send(formData);
  });
};

export const startRender = async (config: RenderRequest) => {
  const resp = await fetch(`${API_BASE}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!resp.ok) throw new Error("Failed to start render");

  const data = (await resp.json()) as { jobId: string };
  return data.jobId;
};

export const getStatus = async (id: string): Promise<RenderStatus> => {
  const resp = await fetch(`${API_BASE}/status/${id}`);
  if (!resp.ok) {
    const errorData = (await resp.json().catch(() => ({}))) as { error?: string };
    return { status: "error", progress: 0, error: errorData.error || "Server error" };
  }
  return (await resp.json()) as RenderStatus;
};

export const downloadBlob = async (url: string) => {
  const resp = await fetch(url);
  return await resp.blob();
};
