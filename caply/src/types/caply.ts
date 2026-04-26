export type Phase = "empty" | "ready" | "rendering" | "generated" | "error";

export type MediaPhoto = {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string;
};

export type MediaAudio = {
  file: File;
  name: string;
  size: number;
  url: string;
};

export type CustomUnit = "seconds" | "minutes" | "hours";

export type AudioSettings = {
  trimStart?: number;
  trimEnd?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  volume?: number;
};
