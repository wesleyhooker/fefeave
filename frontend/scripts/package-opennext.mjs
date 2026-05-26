#!/usr/bin/env node
/**
 * Zip OpenNext Lambda bundles for Terraform / GitHub deploy.
 * Requires: npm run build:opennext first.
 */
import archiver from "archiver";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "..");
const serverBundleDir = path.join(
  frontendDir,
  ".open-next/server-functions/default",
);
const imageBundleDir = path.join(
  frontendDir,
  ".open-next/image-optimization-function",
);
const serverZip = path.join(frontendDir, "opennext-server.zip");
const imageZip = path.join(frontendDir, "opennext-image.zip");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", cwd: frontendDir });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function zipDirectory(sourceDir, zipPath) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(
      `Missing bundle directory: ${sourceDir}. Run npm run build:opennext first.`,
    );
  }
  if (fs.existsSync(zipPath)) {
    await fs.promises.unlink(zipPath);
  }
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const done = pipeline(archive, output);
  archive.directory(sourceDir, false);
  archive.finalize();
  await done;
  const stat = await fs.promises.stat(zipPath);
  console.log(
    `Created ${zipPath} (${(stat.size / (1024 * 1024)).toFixed(1)} MiB)`,
  );
}

async function main() {
  if (
    !fs.existsSync(path.join(frontendDir, ".open-next/open-next.output.json"))
  ) {
    await run("npm", ["run", "build:opennext"]);
  }
  await zipDirectory(serverBundleDir, serverZip);
  await zipDirectory(imageBundleDir, imageZip);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
