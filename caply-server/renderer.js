import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import ffmpegStatic from 'ffmpeg-static';
import { UPLOAD_DIR, OUTPUT_DIR } from './constants.js';
import { parseDurationToSeconds, getResolution, getFps, getBitrate } from './utils.js';

const FFMPEG_PATH = ffmpegStatic || 'ffmpeg';

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

export async function renderVideo(job) {
  const { id, imagePaths, audioPath, durationLabel, quality, aspect, audioSettings, targetFps, targetBitrate, transition } = job;
  const totalDuration = parseDurationToSeconds(durationLabel);
  const resolution = getResolution(quality, aspect);
  const fps = targetFps || getFps(quality);
  const bitrate = targetBitrate || getBitrate(quality);
  const perImage = imagePaths.length > 0 ? totalDuration / imagePaths.length : totalDuration;
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

  // Build video filter
  let vFilter = `fps=${fps},scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p`;

  if (imagePaths.length > 1 && transition !== 'none') {
    const fade = Math.min(0.6, perImage * 0.25);
    vFilter += `,fade=t=in:st=0:d=${fade},fade=t=out:st=${perImage - fade}:d=${fade}`;
  }

  args.push('-vf', vFilter);
  args.push('-r', String(fps));
  args.push('-c:v', 'libx264');
  args.push('-b:v', bitrate);
  args.push('-preset', 'fast');
  args.push('-pix_fmt', 'yuv420p');
  args.push('-movflags', '+faststart');
  args.push('-t', String(totalDuration));

  if (audioPath) {
    args.push('-i', audioPath);
    const af = [];
    if (audioSettings?.trimStart !== undefined) af.push(`atrim=start=${audioSettings.trimStart}`);
    if (audioSettings?.trimEnd !== undefined) af.push(`atrim=end=${audioSettings.trimEnd}`);
    if (audioSettings?.loop) af.push('aloop=loop=-1:size=2e+09');
    if (audioSettings?.fadeIn) af.push(`afade=t=in:st=0:d=${audioSettings.fadeIn}`);
    if (audioSettings?.fadeOut) {
      const foStart = Math.max(0, totalDuration - audioSettings.fadeOut);
      af.push(`afade=t=out:st=${foStart}:d=${audioSettings.fadeOut}`);
    }
    if (audioSettings?.volume !== undefined) af.push(`volume=${audioSettings.volume}`);
    if (af.length) args.push('-af', af.join(','));
    args.push('-shortest');
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-ar', '48000');
  }

  args.push(output);

  const onProgressCallback = (pct) => {
    jobStatus.set(id, { status: 'processing', progress: pct });
  };
  await runFFmpeg(args, id, totalDuration, onProgressCallback);

  return output;
}
