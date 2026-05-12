import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Vite plugin: tự động sinh articleManifest.json từ frontmatter các file Markdown.
 * Chạy khi khởi động dev server và khi build.
 * Khi dev, theo dõi thay đổi trong thư mục articles/ để cập nhật manifest.
 */
function articleManifestPlugin(): Plugin {
  const articlesDir = path.resolve(__dirname, 'src/data/articles');
  const manifestPath = path.resolve(__dirname, 'src/data/articleManifest.json');

  function parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const meta: Record<string, string> = {};
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

  function generate() {
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
          ...(meta.reporter ? {reporter: meta.reporter} : {}),
          summary: meta.summary || '',
          ...(meta.sourceType ? {sourceType: meta.sourceType} : {}),
          ...(meta.image ? {image: meta.image} : {}),
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    return manifest.length;
  }

  return {
    name: 'article-manifest',
    buildStart() {
      const count = generate();
      console.log(`📝 Manifest bài viết: ${count} bài`);
    },
    configureServer(server) {
      // Theo dõi thay đổi file .md để tự cập nhật manifest khi dev
      server.watcher.add(articlesDir);
      server.watcher.on('change', filePath => {
        if (filePath.endsWith('.md') && filePath.includes('articles')) {
          const count = generate();
          console.log(`🔄 Manifest cập nhật: ${count} bài`);
        }
      });
      server.watcher.on('add', filePath => {
        if (filePath.endsWith('.md') && filePath.includes('articles')) {
          const count = generate();
          console.log(`➕ Manifest thêm bài: ${count} bài`);
        }
      });
    },
  };
}

function prunePublicArtifactsPlugin(): Plugin {
  const excluded = [
    'webapp/quan-ly-thiet-bi.rar',
  ];

  return {
    name: 'prune-public-artifacts',
    apply: 'build',
    closeBundle() {
      for (const relativePath of excluded) {
        const outputPath = path.resolve(__dirname, 'dist', relativePath);
        if (fs.existsSync(outputPath)) {
          fs.rmSync(outputPath, {force: true});
          console.log(`🧹 Bỏ khỏi dist: ${relativePath}`);
        }
      }
    },
  };
}

function serveWebappIndexesPlugin(): Plugin {
  const webapps = [
    '/webapp/quan-ly-thiet-bi/',
    '/webapp/quan-ly-cong-viec/',
  ];

  function serveIndex(url: string | undefined, res: {setHeader(name: string, value: string): void; end(content: string): void}, next: () => void) {
    if (!url) {
      next();
      return;
    }

    const pathname = url.split('?')[0];
    const match = webapps.find(appPath => pathname === `/du-cthanhba${appPath}`);
    if (!match) {
      next();
      return;
    }

    const indexPath = path.resolve(__dirname, 'public', match.slice(1), 'index.html');
    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(indexPath, 'utf-8'));
  }

  return {
    name: 'serve-webapp-indexes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => serveIndex(req.url, res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => serveIndex(req.url, res, next));
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [articleManifestPlugin(), serveWebappIndexesPlugin(), react(), tailwindcss(), prunePublicArtifactsPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: '/du-cthanhba/',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
