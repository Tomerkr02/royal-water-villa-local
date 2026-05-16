import { spawn } from 'node:child_process';

const commands = [
  ['api', 'node', ['server/local-api.mjs']],
  ['vite', 'npx', ['vite', '--host', '0.0.0.0']]
];

const children = commands.map(([label, command, args]) => {
  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  child.stdout.on('data', (data) => process.stdout.write(`[${label}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${label}] ${data}`));
  return child;
});

function shutdown() {
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
