#!/usr/bin/env node
/**
 * Automated test for scripts/project-head.sh.
 * Uses Node built-ins only. No dependencies.
 * Run from repo root: node scripts/test-project-head.mjs
 */
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';

const REPO_ROOT = process.cwd();
const TEMP_BASE = path.join(os.tmpdir(), `fefeave-ph-test-${Date.now()}`);

function run(cmd, opts = {}) {
  const result = spawnSync('bash', ['-c', cmd], {
    encoding: 'utf8',
    cwd: opts.cwd || REPO_ROOT,
    ...opts,
  });
  return result;
}

function cleanup() {
  try {
    run(`git worktree remove --force "${TEMP_BASE}"`, { cwd: REPO_ROOT });
  } catch (_) {}
  try {
    fs.rmSync(TEMP_BASE, { recursive: true, force: true });
  } catch (_) {}
}

let worktreeCreated = false;
process.on('exit', (code) => {
  if (worktreeCreated) cleanup();
});

try {
  // Create worktree
  execSync(`git worktree add "${TEMP_BASE}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
  worktreeCreated = true;

  // Create and checkout test branch
  let branchName = 'feature/v1-2.1-s3-uploads';
  const branchResult = run(`git checkout -b ${branchName}`, { cwd: TEMP_BASE });
  if (branchResult.status !== 0) {
    branchName = `feature/v1-2.1-s3-uploads-${Date.now()}`;
    const retry = run(`git checkout -b ${branchName}`, { cwd: TEMP_BASE });
    assert.strictEqual(retry.status, 0, `Failed to create branch: ${retry.stderr}`);
  }

  // Topic: s3-uploads (without suffix) or s3-uploads-<ts> (with suffix)
  const topic = branchName === 'feature/v1-2.1-s3-uploads' ? 's3-uploads' : branchName.replace('feature/v1-2.1-', '');
  const objective = `v1 / 2.1 / ${topic}`;

  // Run project-head.sh
  const result = run('./scripts/project-head.sh origin/main', { cwd: TEMP_BASE });
  assert.strictEqual(result.status, 0, `project-head.sh failed: ${result.stderr}`);
  const output = result.stdout + result.stderr;

  // Assertions
  assert.ok(output.includes(`Branch: ${branchName}`), `Expected "Branch: ${branchName}" in output`);
  assert.ok(output.includes('Version: v1'), 'Expected "Version: v1"');
  assert.ok(output.includes('Phase: 2'), 'Expected "Phase: 2"');
  assert.ok(output.includes('Epic: 1'), 'Expected "Epic: 1"');
  assert.ok(output.includes(`Topic: ${topic}`), `Expected "Topic: ${topic}"`);
  assert.ok(output.includes('## Roadmap'), 'Expected "## Roadmap" section');
  const roadmapIdx = output.indexOf('## Roadmap');
  const fefeaveIdx = output.indexOf('# FefeAve Roadmap', roadmapIdx);
  assert.ok(fefeaveIdx > roadmapIdx, 'Expected "# FefeAve Roadmap" below ## Roadmap section');
  assert.ok(output.includes(`Objective: ${objective}`), `Expected "Objective: ${objective}"`);

  console.log('test-project-head: all assertions passed');
} finally {
  if (worktreeCreated) cleanup();
}
