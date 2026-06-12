#!/usr/bin/env node
/**
 * Write dist/migrations-manifest.json for runtime migration compatibility checks
 * (Lambda bundle has no migrations/ directory).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(backendDir, 'migrations');
const outPath = path.join(backendDir, 'dist/migrations-manifest.json');

function migrationSortKey(name) {
  const prefix = name.split('_')[0];
  const numeric = Number(prefix);
  return Number.isFinite(numeric) ? numeric : prefix;
}

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => file.replace(/\.js$/, ''))
  .sort((a, b) => {
    const ka = migrationSortKey(a);
    const kb = migrationSortKey(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.localeCompare(b);
  });

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify({ migrations, generated_at: new Date().toISOString() }, null, 2)}\n`
);
console.log(`Wrote ${outPath} (${migrations.length} migrations)`);
