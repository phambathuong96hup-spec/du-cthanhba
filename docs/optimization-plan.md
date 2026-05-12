# Kế hoạch tối ưu dự án

Ngày cập nhật: 2026-05-12

## Phạm vi đã rà soát

- Frontend root React/Vite: site Khoa Dược, tra cứu, bài chuyên môn Markdown.
- App `Quản lý trang thiết bị`: React/Vite build tĩnh trong `public/webapp/quan-ly-thiet-bi`.
- Backend/Data: Google Apps Script + Google Sheets trong `public/webapp/quan-ly-thiet-bi/gas/Code.gs`.
- Retrieval/content: Markdown chuyên môn trong `src/data/articles`, các API tra cứu qua Google Apps Script.
- Quy trình: build root, build/deploy app thiết bị, audit dependency, lint/typecheck.

## Việc đã tối ưu

- Root dependency: loại bỏ dependency backend/AI không dùng, cập nhật Vite/PostCSS và audit về 0 lỗ hổng.
- Root routing: lazy-load các route lớn, không còn kéo toàn bộ trang tra cứu/bài viết vào bundle đầu.
- Markdown: đổi `articleLoader` sang dynamic import theo file, thêm `rehype-sanitize` khi render Markdown có HTML.
- HTML từ Sheets/API: bỏ `dangerouslySetInnerHTML` ở các trang tra cứu, render text an toàn.
- Navigation: sửa mapping active menu bị lệch giữa dược lâm sàng/tra cứu/webapp.
- Asset: thay `hero_pharmacy.png` và `about_team.png` 6720px bằng WebP 1920px, giảm khoảng 36MB public asset xuống dưới 1MB.
- App thiết bị: tách auth/session/context/provider, bỏ localStorage role forgeable, dùng sessionStorage và token phiên.
- App thiết bị API: bỏ login GET lộ PIN trên URL; mọi action ghi dữ liệu đi qua POST có `sessionToken`.
- App thiết bị quyền: route guard theo role, admin-only cho duyệt sửa chữa/thêm-sửa thiết bị/cập nhật hồ sơ.
- App thiết bị export: bỏ `xlsx` có lỗ hổng không có bản vá, thay bằng CSV nội bộ.
- App thiết bị bundle: lazy-load theo route, chunk chính giảm từ khoảng 1.35MB còn khoảng 234KB, không còn cảnh báo chunk >500KB.
- Apps Script: thêm session token HMAC, chặn login GET, xác thực server-side cho action private/admin, không tin `actorUsername`/`approver`/`recorder` từ frontend.
- Tài liệu GAS: bổ sung yêu cầu `SESSION_SECRET`, API private/admin và quy trình deploy.
- **Manifest bài viết build-time** (12/5/2026):
  - Tạo Vite plugin `articleManifestPlugin` tự động sinh `articleManifest.json` từ frontmatter của 152 file .md.
  - Plugin chạy tự động khi `npm run dev` hoặc `npm run build`, theo dõi thay đổi file .md khi dev.
  - Trang danh sách `CapNhatChuyenMon` đọc metadata đồng bộ từ manifest JSON — không còn fetch 152 file .md.
  - Trang chi tiết `CapNhatChuyenMonDetail` vẫn lazy-load 1 file .md duy nhất khi cần.
  - Thêm script `npm run manifest` để chạy sinh manifest thủ công.
  - Tách `articleLoader.ts` thành 2 luồng: `loadArticlesMeta()` (nhanh) và `loadArticleBySlug()` (lazy).

## Quy trình vận hành chuẩn

1. Root site:
   - `npm run lint`
   - `npm run build`
   - `npm audit --audit-level=moderate`

2. App thiết bị:
   - `npm --prefix "Quản lý trang thiết bị" run lint`
   - `npm --prefix "Quản lý trang thiết bị" run build`
   - `npm --prefix "Quản lý trang thiết bị" audit --audit-level=moderate`
   - `npm run deploy:thiet-bi`

3. Backend Apps Script:
   - Dán nội dung `public/webapp/quan-ly-thiet-bi/gas/Code.gs` lên Apps Script.
   - Set Script Property `SESSION_SECRET` tối thiểu 32 ký tự.
   - Deploy lại Web App và giữ URL `/exec`.
   - Nếu đổi URL, cấu hình `VITE_THIET_BI_API_URL`.

## Việc cần làm tiếp

- ~~Tách metadata bài viết ra manifest build-time.~~ ✅ Đã xong (12/5/2026)
- ~~Tối ưu tiếp nhóm ảnh còn 700KB-1.1MB trong `public/images` sang WebP/AVIF theo breakpoint.~~ ✅ Đã chuẩn bị script và cập nhật source (12/5/2026)
- Bổ sung kiểm thử E2E cho login, role admin/user, báo hỏng, luân chuyển, GSP.
- Bổ sung CI chạy lint/build/audit cho cả root và app thiết bị trước khi deploy.
- Nếu dùng production thật, cân nhắc chuyển PIN plaintext trong Sheet sang hash có salt trong Apps Script.
