/**
 * Bộ tải bài viết chuyên môn.
 *
 * - `loadArticlesMeta()` — trả về metadata từ manifest (nhanh, không fetch Markdown).
 *   Dùng cho trang danh sách CapNhatChuyenMon.
 *
 * - `loadArticleBySlug(slug)` — tải đầy đủ nội dung 1 bài viết (lazy, chỉ 1 file).
 *   Dùng cho trang chi tiết CapNhatChuyenMonDetail.
 *
 * - `loadAllArticles()` — giữ lại tương thích ngược, nhưng KHÔNG NÊN DÙNG cho danh sách.
 */

import manifestData from './articleManifest.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleMeta {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  date: string;
  author: string;
  reporter?: string;
  summary: string;
  sourceType?: string;
  image?: string;
}

export interface Article extends ArticleMeta {
  content: string;
}

// ─── Danh mục ─────────────────────────────────────────────────────────────────

export const CHUYEN_MON_CATEGORIES = [
  { id: 'canh-giac-duoc', name: 'Cảnh giác dược', color: 'blue' },
  { id: 'phac-do-dieu-tri', name: 'Phác đồ điều trị update', color: 'green' },
  { id: 'phac-do-noi-vien', name: 'Phác đồ điều trị nội bộ', color: 'teal' },
  { id: 'cong-van', name: 'Công văn thu hồi thuốc', color: 'red' },
  { id: 'tap-huan', name: 'Tập huấn kỹ năng', color: 'amber' },
];

// ─── Xử lý đường dẫn ảnh ─────────────────────────────────────────────────────

function fixImagePath(img?: string): string | undefined {
  if (!img) return undefined;
  if (img.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${img.slice(1)}`;
  }
  return img;
}

// ─── Nhanh: trả metadata từ manifest (cho trang danh sách) ───────────────────

export function loadArticlesMeta(): ArticleMeta[] {
  return (manifestData as ArticleMeta[]).map(a => ({
    ...a,
    image: fixImagePath(a.image),
  }));
}

// ─── Parse frontmatter từ nội dung Markdown ──────────────────────────────────

export function parseFrontmatter(mdContent: string): Article {
  const match = mdContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const article: Partial<Article> = {
    id: '', slug: '', title: 'Bài viết không tiêu đề', categoryId: 'other',
    categoryName: 'Chuyên mục khác', date: new Date().toISOString(),
    author: 'Khuyết danh', summary: '', content: mdContent,
    sourceType: '',
  };

  if (match) {
    const metaStr = match[1];
    article.content = match[2].trim();

    metaStr.split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && val) {
          (article as Partial<Article> & Record<string, string>)[key] = val;
        }
      }
    });
  }

  // Fallback nếu thiếu ID
  if (!article.id) {
    article.id = article.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || Math.random().toString(36).substring(7);
  }

  // Prefix đường dẫn ảnh cục bộ
  article.image = fixImagePath(article.image);

  return article as Article;
}

// ─── Lazy import từng file Markdown ──────────────────────────────────────────

const articleModules = import.meta.glob('./articles/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

// ─── Tải đầy đủ 1 bài viết theo slug (cho trang chi tiết) ──────────────────

export async function loadArticleBySlug(slug: string): Promise<Article | null> {
  // Thử khớp tên file trực tiếp
  const directModule = articleModules[`./articles/${slug}.md`];
  if (directModule) {
    return parseFrontmatter(await directModule());
  }

  // Fallback: tìm slug trong manifest rồi tải theo tên file
  const meta = (manifestData as ArticleMeta[]).find(a => a.id === slug);
  if (meta?.slug) {
    const fallbackModule = articleModules[`./articles/${meta.slug}.md`];
    if (fallbackModule) {
      return parseFrontmatter(await fallbackModule());
    }
  }

  return null;
}

// ─── Tải tất cả bài viết (giữ tương thích ngược — KHÔNG DÙNG cho danh sách) ─

export async function loadAllArticles(): Promise<Article[]> {
  const loadedArticles = await Promise.all(
    Object.values(articleModules).map(async loadArticle => parseFrontmatter(await loadArticle()))
  );
  return loadedArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
