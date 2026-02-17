/**
 * Run backend's ESLint --fix on staged backend files.
 * Receives file paths from lint-staged (relative to repo root); runs eslint from backend/ with paths relative to backend.
 */
const { execSync } = require('child_process');
const path = require('path');

const files = process.argv.slice(2).filter((f) => f.startsWith('backend/') && /\.(ts|js)$/.test(f));
if (files.length === 0) process.exit(0);

const relativeToBackend = files.map((f) => path.relative('backend', f));
execSync(`npx eslint --fix ${relativeToBackend.map((f) => JSON.stringify(f)).join(' ')}`, {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
});
