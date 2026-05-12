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
  let replaced = 0;
  for (const entry of sourceEntries) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.resolve(targetDir, entry);
    if (!targetPath.startsWith(targetDir + path.sep)) {
      throw new Error(`Refusing to write outside deploy target: ${targetPath}`);
    }
    await rm(targetPath, { recursive: true, force: true });
    await cp(sourcePath, targetPath, { recursive: true });
    replaced += 1;
  }

  console.log(`Deployed thiet-bi build from ${sourceDir} to ${targetDir}`);
  console.log(`Replaced ${replaced} build entries and preserved non-build files in target, such as gas/.`);
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
