const { spawn } = require('child_process');
const path = require('path');

const proc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'caply'),
  stdio: 'inherit',
  shell: true
});

proc.on('exit', (code) => process.exit(code ?? 0));
