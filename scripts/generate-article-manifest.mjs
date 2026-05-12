/**
 * Script sinh manifest metadata bài viết.
 *
 * Đọc tất cả file .md trong src/data/articles/, trích xuất frontmatter
 * và ghi ra src/data/articleManifest.json.
 * Trang danh sách chỉ cần import file JSON nhỏ này thay vì tải cả 152 file Markdown.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.resolve(__dirname, '../src/data/articles');
const manifestPath = path.resolve(__dirname, '../src/data/articleManifest.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && val) meta[key] = val;
    }
  });
  return meta;
}

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

const manifest = files
  .map(filename => {
    const content = fs.readFileSync(path.join(articlesDir, filename), 'utf-8');
    const meta = parseFrontmatter(content);
    const slug = filename.replace(/\.md$/, '');
    const id =
      meta.id ||
      (meta.title
        ? meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : slug);

    return {
      id,
      slug,
      title: meta.title || 'Bài viết không tiêu đề',
      categoryId: meta.categoryId || 'other',
      categoryName: meta.categoryName || 'Chuyên mục khác',
      date: meta.date || new Date().toISOString(),
      author: meta.author || 'Khuyết danh',
      ...(meta.reporter ? { reporter: meta.reporter } : {}),
      summary: meta.summary || '',
      ...(meta.sourceType ? { sourceType: meta.sourceType } : {}),
      ...(meta.image ? { image: meta.image } : {}),
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`✅ Đã tạo manifest: ${manifest.length} bài viết → ${manifestPath}`);
