import type { CustomUnit } from "../types/caply";

export function formatBytes(bytes?: number) {
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

export function parseDuration(value: string, customValue: string | number, customUnit: CustomUnit) {
  if (value !== "Custom") return value;

  const n = Number(customValue || 0);
  if (!n || n <= 0) return "30s";

  if (customUnit === "hours") return `${n}h`;
  if (customUnit === "minutes") return `${n}m`;
  return `${n}s`;
}

export function durationToSeconds(label: string) {
  const match = String(label).match(/^(\d+(?:\.\d+)?)\s*(s|m|h)?$/i);
  if (!match) return 30;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "s").toLowerCase();

  if (unit === "h") return value * 3600;
  if (unit === "m") return value * 60;
  return value;
}
