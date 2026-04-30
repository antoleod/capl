import { spawn } from 'child_process';
import { join } from 'path';
import ffmpegStatic from 'ffmpeg-static';
import { OUTPUT_DIR } from './constants.js';

const FFMPEG_PATH = ffmpegStatic || 'ffmpeg';
const DEFAULT_EFFECT_PRESET = 'baby_soft';

const EFFECT_PRESETS = {
  baby_soft: {
    tone: 'eq=brightness=0.03:contrast=1.06:saturation=1.08',
    blur: 'gblur=sigma=0.5',
    warmth: 'colorbalance=rs=0.04:gs=0.01:bs=-0.03',
    vignette: 'vignette=PI/6',
    zoom: "zoompan=z='if(lte(on,1),1.0,min(1.08,zoom+0.0007))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps}",
  },
  cinematic: {
    tone: 'eq=brightness=-0.01:contrast=1.14:saturation=1.05',
    blur: 'gblur=sigma=0.25',
    warmth: 'colorbalance=rs=0.02:gs=0.00:bs=-0.02',
    vignette: 'vignette=PI/5',
    zoom: "zoompan=z='if(lte(on,1),1.0,min(1.06,zoom+0.0005))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps}",
  },
  modern: {
    tone: 'eq=brightness=0.01:contrast=1.1:saturation=1.02',
    blur: 'gblur=sigma=0.15',
    warmth: 'colorbalance=rs=0.01:gs=0.00:bs=-0.01',
    vignette: 'vignette=PI/5.5',
    zoom: "zoompan=z='if(lte(on,1),1.0,min(1.05,zoom+0.0005))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps}",
  },
};

const QUALITY_MAP = {
  '720p': { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
  '2K': { w: 2560, h: 1440 },
  '4K': { w: 3840, h: 2160 },
  '8K': { w: 7680, h: 4320 },
};

const ENCODE_PROFILE_MAP = {
  '720p': { preset: 'veryfast', crf: 23 },
  '1080p': { preset: 'veryfast', crf: 22 },
  '2K': { preset: 'veryfast', crf: 23 },
  '4K': { preset: 'veryfast', crf: 23 },
  '8K': { preset: 'veryfast', crf: 23 },
};

export const activeJobs = new Map();
export const jobStatus = new Map();

function getResolution(quality, aspect, platform) {
  const qKey = QUALITY_MAP[quality] ? quality : '1080p';
  let base = QUALITY_MAP[qKey];
  const vertical = aspect === '9:16' || platform === 'tiktok';
  if (vertical) base = { w: base.h, h: base.w };
  return { width: base.w, height: base.h };
}

function parseDurationLabelSeconds(label) {
  const text = String(label || '').trim().toLowerCase();
  const m = text.match(/^(\d+(?:\.\d+)?)\s*([smh])$/);
  if (!m) return 30;
  const v = Number(m[1]);
  const u = m[2];
  if (!Number.isFinite(v) || v <= 0) return 30;
  if (u === 'h') return v * 3600;
  if (u === 'm') return v * 60;
  return v;
}

function runFFmpeg(args, jobId, totalDuration, onProgressCallback) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, ['-y', ...args]);
    let stderr = '';
    let lastPct = 0;

    proc.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      const m = s.match(/time=\s*(\d+):(\d+):(\d+\.\d+)/);
      if (m && totalDuration > 0 && onProgressCallback) {
        const sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
        const pct = Math.max(0, Math.min(99, Math.round((sec / totalDuration) * 100)));
        if (pct >= lastPct) {
          lastPct = pct;
          onProgressCallback(pct);
        }
      }
    });

    proc.on('close', (code) => {
      activeJobs.delete(jobId);
      if (code === 0) resolve(stderr);
      else reject(new Error(`FFmpeg exited ${code}. ${stderr.slice(-800)}`));
    });

    proc.on('error', (e) => {
      activeJobs.delete(jobId);
      reject(e);
    });

    activeJobs.set(jobId, proc);
  });
}

export async function renderVideo(options) {
  const {
    id,
    imagePaths = [],
    audioPath,
    durationLabel,
    targetDurationSeconds,
    platform,
    quality,
    aspect,
    audioSettings,
    targetFps,
    targetBitrate,
    style,
    renderMode,
  } = options;

  const target = Number(targetDurationSeconds);
  const parsedDuration = parseDurationLabelSeconds(durationLabel);
  const finalDurationSeconds = Number.isFinite(target) && target > 0 ? target : parsedDuration;

  const fps = Number(targetFps) > 0 ? Number(targetFps) : 30;
  const bitrate = targetBitrate || '';
  const resolution = getResolution(quality, aspect, platform);
  const qualityKey = QUALITY_MAP[quality] ? quality : '1080p';
  const baseEncode = ENCODE_PROFILE_MAP[qualityKey] || ENCODE_PROFILE_MAP['1080p'];
  const isPreview = renderMode === 'preview';
  const LONG_RENDER_FAST_MODE = finalDurationSeconds > 600;
  const encodePreset = isPreview ? 'ultrafast' : baseEncode.preset;
  const encodeCrf = isPreview ? 26 : baseEncode.crf;
  const imageCount = Math.max(1, imagePaths.length);
  const perImageDuration = finalDurationSeconds / imageCount;

  const requestedPreset = (style || '').toLowerCase().replace(/\s+/g, '_');
  const styleAlias = { auto: 'baby_soft', cinematic: 'cinematic', modern: 'modern' };
  const preset = EFFECT_PRESETS[styleAlias[requestedPreset] || requestedPreset] || EFFECT_PRESETS[DEFAULT_EFFECT_PRESET];
  const zoomExpr = preset.zoom
    .replace('{w}', String(resolution.width))
    .replace('{h}', String(resolution.height))
    .replace('{fps}', String(fps));

  const output = join(OUTPUT_DIR, `${id}.mp4`);
  const args = [];

  for (const imagePath of imagePaths) {
    args.push('-loop', '1', '-t', String(perImageDuration), '-i', imagePath);
  }

  const audioInputIndex = imagePaths.length;
  if (audioPath) {
    args.push('-stream_loop', '-1', '-i', audioPath);
  }

  const filterParts = [];
  for (let i = 0; i < imagePaths.length; i += 1) {
    const clipFx = [
      `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease:flags=lanczos`,
      `pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
      'setsar=1',
      'setpts=PTS-STARTPTS',
      `trim=duration=${perImageDuration}`,
    ];
    if (!LONG_RENDER_FAST_MODE && !isPreview) {
      clipFx.splice(3, 0, zoomExpr, preset.tone, preset.warmth);
      clipFx.push(preset.blur, preset.vignette);
    } else if (!isPreview) {
      clipFx.splice(3, 0, preset.tone);
    }
    if (i === 0) clipFx.push('fade=t=in:st=0:d=0.5');
    if (i === imagePaths.length - 1) clipFx.push(`fade=t=out:st=${Math.max(0, perImageDuration - 0.5)}:d=0.5`);
    filterParts.push(`[${i}:v]${clipFx.join(',')}[v${i}]`);
  }

  const concatInputs = Array.from({ length: imagePaths.length }, (_, i) => `[v${i}]`).join('');
  filterParts.push(`${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[vout]`);

  if (audioPath) {
    const af = [];
    if (audioSettings?.trimStart !== undefined) af.push(`atrim=start=${audioSettings.trimStart}`);
    af.push(`atrim=end=${finalDurationSeconds}`);
    if (audioSettings?.fadeIn) af.push(`afade=t=in:st=0:d=${audioSettings.fadeIn}`);
    if (audioSettings?.fadeOut) {
      const foStart = Math.max(0, finalDurationSeconds - audioSettings.fadeOut);
      af.push(`afade=t=out:st=${foStart}:d=${audioSettings.fadeOut}`);
    }
    if (audioSettings?.volume !== undefined) af.push(`volume=${audioSettings.volume}`);
    if (af.length) filterParts.push(`[${audioInputIndex}:a]${af.join(',')}[aout]`);
  }

  args.push('-filter_complex', filterParts.join(';'));
  args.push('-map', '[vout]');
  if (audioPath) args.push('-map', '[aout]');

  args.push('-r', String(fps));
  args.push('-c:v', 'libx264');
  args.push('-crf', String(encodeCrf));
  args.push('-preset', encodePreset);
  args.push('-tune', 'stillimage');
  if (bitrate) {
    args.push('-maxrate', bitrate);
    args.push('-bufsize', `${bitrate.replace(/[^0-9.]/g, '') || '8'}M`);
  }
  args.push('-pix_fmt', 'yuv420p');
  if (audioPath) {
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-ar', '48000');
  }
  args.push('-movflags', '+faststart');
  args.push('-t', String(finalDurationSeconds));
  args.push(output);

  console.log('[Renderer] image input count', imagePaths.length);
  console.log('[Renderer] perImageDuration', perImageDuration);
  console.log('[Renderer] finalDurationSeconds', finalDurationSeconds);
  console.log('[Renderer] LONG_RENDER_FAST_MODE', LONG_RENDER_FAST_MODE);
  console.log('[Renderer] renderMode', renderMode || 'final');
  console.log('[Renderer] quality profile', { quality: qualityKey, preset: encodePreset, crf: encodeCrf });
  console.log('[Renderer] active filters', LONG_RENDER_FAST_MODE || isPreview ? 'scale,pad,setsar,tone,fade' : 'scale,pad,setsar,zoom,tone,warmth,blur,vignette,fade');
  console.log('[Renderer] expected duration', finalDurationSeconds);
  console.log('[Renderer] ffmpeg args', args);

  const onProgress = (pct) => {
    jobStatus.set(id, { status: 'processing', progress: pct });
  };

  await runFFmpeg(args, id, finalDurationSeconds, onProgress);
  jobStatus.set(id, { status: 'done', progress: 100 });
  return output;
}
