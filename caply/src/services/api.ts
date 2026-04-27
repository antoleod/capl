export const API_BASE = ""; // Se deja vacío para que use la ruta relativa que maneja el proxy de Vite

export interface RenderStatus {
  status: "processing" | "done" | "error";
  progress: number;
  url?: string;
  error?: string; // Aseguramos que sea opcional pero existente en el tipo
}

export const uploadPhotos = async (
  files: File[],
  sessionId: string,
  onProgress: (pct: number) => void
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // IMPORTANTE: El nombre del campo debe ser 'files' para coincidir con server.js
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
        const resp = JSON.parse(xhr.responseText);
        // Retornamos los paths que devuelve tu backend
        resolve(resp.files.map((f: any) => f.path));
      } else {
        reject(new Error(`Error en la subida: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Error de red")));
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

    // IMPORTANTE: El nombre del campo debe ser 'audio' para coincidir con server.js
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
        const resp = JSON.parse(xhr.responseText);
        // Tomamos el path del archivo de audio
        resolve(resp.files[0].path);
      } else {
        reject(new Error(`Error en la subida de audio: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Error de red")));
    xhr.open("POST", `${API_BASE}/upload/photos`);
    xhr.send(formData);
  });
};

export const startRender = async (config: any) => {
  const resp = await fetch(`${API_BASE}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!resp.ok) throw new Error("Failed to start render");
  const data = await resp.json();
  return data.jobId;
};

export const getStatus = async (id: string): Promise<RenderStatus> => {
  const resp = await fetch(`${API_BASE}/status/${id}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    return { status: "error", progress: 0, error: errorData.error || "Server error" };
  }
  return await resp.json();
};

export const downloadBlob = async (url: string) => {
  const resp = await fetch(url);
  return await resp.blob();
};