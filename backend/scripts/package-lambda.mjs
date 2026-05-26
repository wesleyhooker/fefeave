#!/usr/bin/env node
/**
 * Stage lambda.zip (dist + production node_modules). No AWS deploy.
 * Uses archiver (devDependency) — no system `zip` required.
 */
import archiver from 'archiver';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
const stageDir = path.join(backendDir, '.lambda-package');
const outZip = path.join(backendDir, 'lambda.zip');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function zipDirectory(sourceDir, zipPath) {
  await fs.promises.mkdir(path.dirname(zipPath), { recursive: true });
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const done = pipeline(archive, output);
  archive.directory(sourceDir, false);
  archive.finalize();
  await done;
}

async function main() {
  process.chdir(backendDir);

  await run('npm', ['run', 'build']);
  await run('bash', ['scripts/verify-lambda-build.sh']);

  if (fs.existsSync(stageDir)) {
    await fs.promises.rm(stageDir, { recursive: true, force: true });
  }
  if (fs.existsSync(outZip)) {
    await fs.promises.unlink(outZip);
  }
  await fs.promises.mkdir(stageDir, { recursive: true });

  await fs.promises.cp(path.join(backendDir, 'dist'), path.join(stageDir, 'dist'), {
    recursive: true,
  });
  await fs.promises.copyFile(
    path.join(backendDir, 'package.json'),
    path.join(stageDir, 'package.json')
  );
  await fs.promises.copyFile(
    path.join(backendDir, 'package-lock.json'),
    path.join(stageDir, 'package-lock.json')
  );

  await run('npm', ['ci', '--omit=dev'], { cwd: stageDir });

  await zipDirectory(stageDir, outZip);

  const stat = await fs.promises.stat(outZip);
  const mib = (stat.size / (1024 * 1024)).toFixed(1);
  console.log(`Created ${outZip} (${mib} MiB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
