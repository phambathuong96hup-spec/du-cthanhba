export interface Article {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  date: string;
  author: string;
  reporter?: string;
  summary: string;
  content: string;
  sourceType?: string;
  image?: string;
}

export const CHUYEN_MON_CATEGORIES = [
  { id: 'canh-giac-duoc', name: 'Cảnh giác dược', color: 'blue' },
  { id: 'phac-do-dieu-tri', name: 'Phác đồ điều trị update', color: 'green' },
  { id: 'phac-do-noi-vien', name: 'Phác đồ điều trị nội bộ', color: 'teal' },
  { id: 'cong-van', name: 'Công văn thu hồi thuốc', color: 'red' },
  { id: 'tap-huan', name: 'Tập huấn kỹ năng', color: 'amber' }
];

export function parseFrontmatter(mdContent: string): Article {
  const match = mdContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const article: Partial<Article> = {
    id: '', title: 'Bài viết không tiêu đề', categoryId: 'other', 
    categoryName: 'Chuyên mục khác', date: new Date().toISOString(), 
    author: 'Khuyết danh', summary: '', content: mdContent,
    sourceType: ''
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
          (article as any)[key] = val;
        }
      }
    });
  }

  // Fallback if ID is missing
  if (!article.id) {
    article.id = article.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || Math.random().toString(36).substring(7);
  }

  // Prefix local image paths with BASE_URL for subdirectory deployment
  if (article.image && article.image.startsWith('/')) {
    article.image = `${import.meta.env.BASE_URL}${article.image.slice(1)}`;
  }

  return article as Article;
}

// Vite feature: Import all markdown files in the articles folder
export function loadAllArticles(): Article[] {
  // Use as any to prevent TS complaints if vite/client is not fully configured
  const modules = (import.meta as any).glob('./articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  
  const loadedArticles: Article[] = [];
  
  Object.keys(modules).forEach(path => {
    const content = modules[path];
    if (typeof content === 'string') {
      const parsed = parseFrontmatter(content);
      loadedArticles.push(parsed);
    }
  });

  // Sort by date descending
  return loadedArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
