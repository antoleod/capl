import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import ffmpegStatic from 'ffmpeg-static';
import { UPLOAD_DIR, OUTPUT_DIR } from './constants.js';
import { parseDurationToSeconds, getResolution, getFps, getBitrate } from './utils.js';

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
  calm_sleep: {
    tone: 'eq=brightness=0.02:contrast=1.02:saturation=0.92',
    blur: 'gblur=sigma=0.8',
    warmth: 'colorbalance=rs=0.03:gs=0.02:bs=-0.02',
    vignette: 'vignette=PI/7',
    zoom: "zoompan=z='if(lte(on,1),1.0,min(1.04,zoom+0.0004))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps}",
  },
};

export const activeJobs = new Map();
export const jobStatus = new Map(); // jobId -> { status: 'processing'|'done'|'error', progress?: number, error?: string }

export async function runFFmpeg(args, jobId, totalDuration, onProgressCallback) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, ['-y', ...args]);
    let stderr = '';
    let lastPct = 0;

    proc.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      const m = s.match(/time=\s*(\d+):(\d+):(\d+\.\d+)/);
      if (m && onProgressCallback && totalDuration > 0) {
        const sec = parseFloat(m[1]) * 3600 + parseFloat(m[2]) * 60 + parseFloat(m[3]);
        const pct = Math.min(95, Math.round((sec / totalDuration) * 100));
        if (pct > lastPct) { lastPct = pct; onProgressCallback(pct); }
      }
    });

    proc.on('close', (code) => {
      activeJobs.delete(jobId);
      if (code === 0) resolve(stderr);
      else reject(new Error(`FFmpeg exited ${code}. ${stderr.slice(-400)}`));
    });

    proc.on('error', (e) => { activeJobs.delete(jobId); reject(e); });
    activeJobs.set(jobId, proc);
  });
}

async function probeAudioDurationSeconds(audioPath) {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ['-i', audioPath, '-f', 'null', '-']);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!m) return resolve(null);
      const sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      resolve(Number.isFinite(sec) && sec > 0 ? sec : null);
    });
    proc.on('error', () => resolve(null));
  });
}

export async function renderVideo(job) {
  const { id, imagePaths, audioPath, durationLabel, targetDurationSeconds, platform, quality, aspect, audioSettings, targetFps, targetBitrate, transition, style } = job;
  const rawDuration = parseDurationToSeconds(durationLabel);
  const audioDuration = audioPath ? await probeAudioDurationSeconds(audioPath) : null;
  const validTargetDuration = Number.isFinite(Number(targetDurationSeconds)) && Number(targetDurationSeconds) > 0
    ? Number(targetDurationSeconds)
    : null;
  const wantedDuration = validTargetDuration || audioDuration || rawDuration || 30;
  const totalDuration = Math.min(Math.max(wantedDuration, 3), 21600); // safe guardrail: 3s..6h
  const qualityMap = {
    '720p': { w: 1280, h: 720 },
    '1080p': { w: 1920, h: 1080 },
    '2K': { w: 2560, h: 1440 },
    '4K': { w: 3840, h: 2160 },
  };
  const qKey = qualityMap[quality] ? quality : '1080p';
  let baseRes = qualityMap[qKey];
  const isVertical = aspect === '9:16' || platform === 'tiktok';
  if (isVertical) baseRes = { w: baseRes.h, h: baseRes.w };
  const resolution = { width: baseRes.w, height: baseRes.h };
  const fps = targetFps || getFps(quality);
  const bitrate = targetBitrate || getBitrate(quality);
  const perImage = imagePaths.length > 0 ? totalDuration / imagePaths.length : totalDuration;
  console.log('[Renderer] duration:', { targetDurationSeconds: validTargetDuration, rawDuration, audioDuration, totalDuration });
  console.log('[Renderer] render params:', { perImageDuration: perImage, resolution, fps, quality, aspect, platform });
  const output = join(OUTPUT_DIR, `${id}.mp4`);

  // Ensure concat directory exists
  const concatDir = join(UPLOAD_DIR, id);
  if (!existsSync(concatDir)) mkdirSync(concatDir, { recursive: true });

  // Write concat demuxer file for image sequence
  const concatFile = join(concatDir, 'concat.txt');
  // FFmpeg concat demuxer: duration after each file; repeat last file+duration so FFmpeg knows total duration
  let lines = '';
  imagePaths.forEach((p) => {
    lines += `file '${p.replace(/'/g, "'\\''")}'\nduration ${perImage.toFixed(3)}\n`;
  });
  // Append last file again with duration so total is correct
  if (imagePaths.length > 0) {
    lines += `file '${imagePaths[imagePaths.length - 1].replace(/'/g, "'\\''")}'\nduration ${perImage.toFixed(3)}\n`;
  }
  await fs.writeFile(concatFile, lines);

  const args = [
    '-f', 'concat', '-safe', '0', '-i', concatFile,
  ];

  if (audioPath) {
    args.push('-stream_loop', '-1', '-i', audioPath, '-t', String(totalDuration));
  }

  const requestedPreset = (style || '').toLowerCase().replace(/\s+/g, '_');
  const styleAlias = {
    auto: 'baby_soft',
    cinematic: 'cinematic',
    modern: 'modern',
  };
  const normalizedPreset = styleAlias[requestedPreset] || requestedPreset;
  const preset = EFFECT_PRESETS[normalizedPreset] || EFFECT_PRESETS[DEFAULT_EFFECT_PRESET];
  const zoomExpr = preset.zoom.replace('{w}', String(resolution.width)).replace('{h}', String(resolution.height)).replace('{fps}', String(fps));

  let builtVideo = false;
  if (imagePaths.length > 0) {
    const fadeDur = Math.min(0.5, Math.max(0.15, perImage * 0.2));
    const canCrossfade = transition !== 'none' && imagePaths.length > 1 && perImage > fadeDur * 2;
    const filterParts = [];

    for (let i = 0; i < imagePaths.length; i += 1) {
      const start = i * perImage;
      const end = start + perImage;
      const clipFx = [
        `trim=start=${start.toFixed(3)}:end=${end.toFixed(3)}`,
        'setpts=PTS-STARTPTS',
        zoomExpr,
        preset.tone,
        preset.blur,
        preset.warmth,
        preset.vignette,
      ];
      if (i === 0) clipFx.push(`fade=t=in:st=0:d=${fadeDur.toFixed(3)}`);
      if (i === imagePaths.length - 1) clipFx.push(`fade=t=out:st=${Math.max(0.01, perImage - fadeDur).toFixed(3)}:d=${fadeDur.toFixed(3)}`);

      filterParts.push(`[0:v]${clipFx.join(',')}[v${i}]`);
    }

    if (canCrossfade) {
      let chainLabel = 'v0';
      for (let i = 1; i < imagePaths.length; i += 1) {
        const outLabel = i === imagePaths.length - 1 ? 'vout' : `vx${i}`;
        const offset = (perImage * i) - (fadeDur * i);
        filterParts.push(`[${chainLabel}][v${i}]xfade=transition=fade:duration=${fadeDur.toFixed(3)}:offset=${Math.max(0, offset).toFixed(3)}[${outLabel}]`);
        chainLabel = outLabel;
      }
    } else {
      filterParts.push(`[v${imagePaths.length - 1}]copy[vout]`);
    }

    args.push('-filter_complex', filterParts.join(';'));
    args.push('-map', '[vout]');
    builtVideo = true;
  }

  if (!builtVideo) {
    const vFilter = `fps=${fps},scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p`;
    args.push('-vf', vFilter);
  }

  args.push('-r', String(fps));
  args.push('-c:v', 'libx264');
  args.push('-b:v', bitrate);
  args.push('-preset', 'fast');
  args.push('-pix_fmt', 'yuv420p');
  args.push('-movflags', '+faststart');
  args.push('-t', String(totalDuration));

  if (audioPath) {
    const af = [];
    if (audioSettings?.trimStart !== undefined) af.push(`atrim=start=${audioSettings.trimStart}`);
    af.push(`atrim=end=${totalDuration}`);
    if (audioSettings?.fadeIn) af.push(`afade=t=in:st=0:d=${audioSettings.fadeIn}`);
    if (audioSettings?.fadeOut) {
      const foStart = Math.max(0, totalDuration - audioSettings.fadeOut);
      af.push(`afade=t=out:st=${foStart}:d=${audioSettings.fadeOut}`);
    }
    if (audioSettings?.volume !== undefined) af.push(`volume=${audioSettings.volume}`);
    if (af.length) args.push('-af', af.join(','));
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-ar', '48000');
  }

  args.push(output);
  console.log('[Renderer] ffmpeg args:', args);

  const onProgressCallback = (pct) => {
    jobStatus.set(id, { status: 'processing', progress: pct });
  };
  await runFFmpeg(args, id, totalDuration, onProgressCallback);

  return output;
}
