import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UPLOAD_DIR, OUTPUT_DIR } from './constants.js';
import { parseDurationToSeconds, getResolution, getFps, getBitrate } from './utils.js';

export const activeJobs = new Map();

export async function runFFmpeg(args, jobId, onProgress) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-y', ...args]);
    let stderr = '';
    let lastPct = 0;

    proc.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      const m = s.match(/time=\s*(\d+):(\d+):(\d+\.\d+)/);
      if (m && onProgress) {
        const sec = parseFloat(m[1]) * 3600 + parseFloat(m[2]) * 60 + parseFloat(m[3]);
        const pct = Math.min(95, Math.round((sec / onProgress.totalDuration) * 100));
        if (pct > lastPct) { lastPct = pct; onProgress(pct); }
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

  // Write concat demuxer file for image sequence
  const concatFile = join(UPLOAD_DIR, id, 'concat.txt');
  const lines = imagePaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'\nduration ${perImage.toFixed(3)}`).join('\n');
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
    let aFilter = '';
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
    if (af.length) aFilter = af.join(',');

    if (aFilter) args.push('-af', aFilter);
    args.push('-shortest');
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-ar', '48000');
  }

  args.push(output);

  const onProgress = { totalDuration };
  await runFFmpeg(args, id, onProgress);

  return output;
}
