import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'Quản lý trang thiết bị', 'dist');
const targetDir = path.join(repoRoot, 'public', 'webapp', 'quan-ly-thiet-bi');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function deploy() {
  if (!(await exists(sourceDir))) {
    throw new Error(`Missing build output: ${sourceDir}. Run npm run build:thiet-bi first.`);
  }

  await mkdir(targetDir, { recursive: true });

  const sourceEntries = await readdir(sourceDir);
  for (const entry of sourceEntries) {
    await rm(path.join(targetDir, entry), { recursive: true, force: true });
    await cp(path.join(sourceDir, entry), path.join(targetDir, entry), { recursive: true });
  }

  console.log(`Deployed thiet-bi build from ${sourceDir} to ${targetDir}`);
  console.log('Preserved non-build files in target, such as gas/.');
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
