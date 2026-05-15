export function parseDurationToSeconds(label) {
  const m = String(label).match(/^(\d+(?:\.\d+)?)\s*(s|m|h)?$/i);
  if (!m) return 30;
  const v = parseFloat(m[1]);
  const u = (m[2] || 's').toLowerCase();
  return u === 'h' ? v * 3600 : u === 'm' ? v * 60 : v;
}

export function getResolution(quality, aspect) {
  const arMap = { '9:16': 9/16, '16:9': 16/9, '1:1': 1, '4:5': 4/5 };
  const ar = arMap[aspect] || 9/16;
  const h = { '720p': 720, '1080p': 1080, '2K': 1440, '4K': 2160, 'Custom': 1080 }[quality] || 1080;
  return { width: Math.round(h * ar), height: h };
}

export function getFps(quality) {
  return { '720p': 30, '1080p': 30, '2K': 30, '4K': 30, 'Custom': 30 }[quality] || 30;
}

export function getBitrate(quality) {
  return { '720p': '4M', '1080p': '8M', '2K': '12M', '4K': '24M', 'Custom': '8M' }[quality] || '8M';
}
