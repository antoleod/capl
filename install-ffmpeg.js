const { spawn } = require('child_process');
const path = require('path');

const proc = spawn('npm', ['install', 'ffmpeg-static'], {
  cwd: path.join(__dirname, 'caply-server'),
  stdio: 'inherit',
  shell: true
});

proc.on('exit', (code) => process.exit(code ?? 0));
