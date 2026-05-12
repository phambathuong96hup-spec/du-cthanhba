/**
 * Script tối ưu ảnh PNG → WebP.
 *
 * Chuyển đổi các ảnh PNG lớn trong public/images/ sang WebP,
 * giảm dung lượng ~60-80% mà vẫn giữ chất lượng.
 *
 * Cách dùng:
 *   npm install sharp --save-dev   (chỉ cần 1 lần)
 *   node scripts/optimize-images.mjs
 *
 * Sau khi chạy:
 *   - File WebP mới nằm cạnh file PNG gốc
 *   - Cập nhật đường dẫn trong code từ .png → .webp
 *   - Xóa file PNG gốc khi đã kiểm tra xong
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, '../public/images');

// Chỉ tối ưu file PNG > 200KB
const MIN_SIZE = 200 * 1024;
const MAX_WIDTH = 1920;
const QUALITY = 82;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('❌ Cần cài sharp trước: npm install sharp --save-dev');
    process.exit(1);
  }

  function getPngFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getPngFiles(filePath));
      } else if (file.endsWith('.png')) {
        results.push(filePath);
      }
    }
    return results;
  }

  const files = getPngFiles(imagesDir);
  let totalSaved = 0;

  for (const filePath of files) {
    const file = path.relative(imagesDir, filePath);
    const stat = fs.statSync(filePath);

    if (stat.size < MIN_SIZE) {
      console.log(`⏭  ${file} (${(stat.size / 1024).toFixed(0)}KB) — bỏ qua, nhỏ hơn ${MIN_SIZE / 1024}KB`);
      continue;
    }

    const webpName = file.replace(/\.png$/, '.webp');
    const webpPath = path.join(imagesDir, webpName);

    // Nếu file webp đã tồn tại, bỏ qua
    if (fs.existsSync(webpPath)) {
      console.log(`⏭  ${file} → ${webpName} đã tồn tại, bỏ qua`);
      continue;
    }

    try {
      const img = sharp(filePath);
      const metadata = await img.metadata();

      let pipeline = img;
      if (metadata.width && metadata.width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH);
      }

      await pipeline
        .webp({ quality: QUALITY })
        .toFile(webpPath);

      const webpStat = fs.statSync(webpPath);
      const saved = stat.size - webpStat.size;
      totalSaved += saved;

      const pct = ((saved / stat.size) * 100).toFixed(0);
      console.log(
        `✅ ${file} (${(stat.size / 1024).toFixed(0)}KB) → ${webpName} (${(webpStat.size / 1024).toFixed(0)}KB) — giảm ${pct}%`
      );
    } catch (err) {
      console.error(`❌ Lỗi xử lý ${file}:`, err.message);
    }
  }

  console.log(`\n📊 Tổng dung lượng tiết kiệm: ${(totalSaved / 1024 / 1024).toFixed(1)}MB`);
  console.log('\n📝 Nhớ cập nhật đường dẫn trong code từ .png → .webp');
}

main();
