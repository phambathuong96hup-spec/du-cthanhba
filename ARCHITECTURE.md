# Architecture — Khoa Dược, TTYT Khu vực Thanh Ba

Tài liệu này mô tả **tại sao** hệ thống được xây dựng theo cách hiện tại. Dành cho developer và maintainer.

## Tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pages                             │
│                  phambathuong96hup-spec.github.io                │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐    │
│  │   React/Vite SPA    │    │   Static HTML Web Apps       │    │
│  │   (Marketing Site)  │    │                              │    │
│  │                     │    │  ┌─────────────────────────┐  │    │
│  │  /                  │    │  │ Quản lý Công việc       │  │    │
│  │  /gioi-thieu        │    │  │ /webapp/quan-ly-cong-.. │  │    │
│  │  /duoc-lam-sang     │    │  └─────────────────────────┘  │    │
│  │  /tra-cuu-nhanh     │    │                              │    │
│  │  /deepmed-ai        │    │  ┌─────────────────────────┐  │    │
│  │  /webapp-duoc-khoa  │───▶│  │ Quản lý Trang thiết bị │  │    │
│  │  ...                │    │  │ /webapp/quan-ly-thiet-bi │  │    │
│  │                     │    │  └─────────────────────────┘  │    │
│  └─────────────────────┘    └──────────────────────────────┘    │
│           │                              │                      │
│      Vite build                    Served as-is                 │
│      → dist/                       from public/webapp/          │
└─────────────────────────────────────────────────────────────────┘
                    │                      │
                    ▼                      ▼
          ┌────────────────────────────────────────┐
          │         Google Sheets API               │
          │   (Backend as a Service)                │
          │                                        │
          │   Sheet: Danh sách công việc            │
          │   Sheet: Ghi nhận tuân thủ              │
          │   Sheet: Quản lý trang thiết bị         │
          └────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────────┐
          │         DeepMed-AI (HuggingFace)       │
          │   FastAPI + HybridRAG + Gemini 2.5     │
          │   → Chatbot Lily (embedded iframe)      │
          └────────────────────────────────────────┘
```

## Hai kiến trúc, một repo

### Tại sao lại hybrid?

1. **Marketing site** cần SEO, animations, component reuse → React/Vite + Tailwind
2. **Web app modules** cần tương tác trực tiếp với Google Sheets API, Bootstrap modals, real-time data → Static HTML + vanilla JS

Cả hai sống trong cùng một repo và deploy cùng lúc. Vite build React SPA vào `dist/`, đồng thời copy `public/` as-is vào `dist/`. Kết quả: một thư mục `dist/` duy nhất deploy lên GitHub Pages.

### Data flow

```
React SPA (client-side routing)
  │
  ├── HashRouter (#/gioi-thieu, #/duoc-lam-sang, ...)
  │     → Single index.html, JS handles routing
  │
  └── Link to /webapp/quan-ly-cong-viec/index.html
        → target="_self" (same tab, NO new tab)
        → Full page reload, exits React SPA
        → Static HTML takes over

Static Web App
  │
  ├── Google Apps Script (fetch/post data)
  │     → CORS-enabled endpoint
  │     → JSON response
  │
  ├── auth.js (role management)
  │     → body.is-admin class toggle
  │     → .admin-only elements visibility
  │
  └── chat.js (Lily chatbot)
        → Fixed position UI
        → Links to DeepMed-AI HuggingFace Space
```

## Cấu trúc thư mục

```
khoa-dược---ttyt-khu-vực-thanh-ba/
├── src/                          # React source code
│   ├── App.tsx                   # Main app + router (553 lines)
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Tailwind + shadcn tokens
│   ├── components/
│   │   ├── SharedLayout.tsx      # Header + Footer (reused across pages)
│   │   └── ScrollToHash.tsx      # Hash-based scroll navigation
│   ├── pages/
│   │   ├── GioiThieu.tsx         # Giới thiệu Khoa Dược
│   │   ├── DuocLamSang.tsx       # Dược lâm sàng
│   │   ├── TraCuuNhanh.tsx       # Tra cứu nhanh
│   │   ├── TraCuuThuoc.tsx       # Tra cứu thuốc
│   │   ├── TraCuuTiemTruyen.tsx  # Tra cứu tiêm truyền
│   │   ├── TraCuuTuongHop.tsx    # Tra cứu tương hợp
│   │   ├── TuongTacThuoc.tsx     # Tương tác thuốc
│   │   ├── CapNhatChuyenMon.tsx  # Cập nhật chuyên môn (list)
│   │   ├── CapNhatChuyenMonDetail.tsx  # Cập nhật chuyên môn (detail)
│   │   ├── DeepMedAI.tsx         # DeepMed-AI chatbot page
│   │   ├── WebAppDuocKhoa.tsx    # WebApp launcher
│   │   └── LienHe.tsx            # Liên hệ
│   ├── data/                     # Static data files
│   └── lib/                      # Utility functions
│
├── public/                       # Served as-is by Vite
│   ├── images/                   # Hero, about, banner images
│   └── webapp/
│       ├── quan-ly-cong-viec/    # Task Management Module
│       │   ├── index.html        # Entry (Bootstrap 5 + custom CSS)
│       │   ├── css/styles.css    # 1500+ lines, CSS variables
│       │   └── js/
│       │       ├── app.js        # Main app logic
│       │       ├── auth.js       # Authentication & roles
│       │       ├── compliance.js # Compliance tracking
│       │       └── chat.js       # Lily chatbot widget
│       └── quan-ly-thiet-bi/     # Equipment Management Module
│
├── dist/                         # Build output (DO NOT edit directly)
├── DESIGN.md                     # Design system tokens
├── ARCHITECTURE.md               # This file
├── vite.config.ts                # Build configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## Quy trình deploy

```
1. Edit source files (src/ or public/)
2. npm run build                    ← REQUIRED before push
3. git add -A
4. git commit -m "description"
5. git push
6. GitHub Pages serves from dist/
7. Wait 1-2 min → Ctrl+Shift+R to verify
```

> ⚠️ **CRITICAL:** Phải chạy `npm run build` trước khi push. Nếu quên, GitHub Pages sẽ serve phiên bản cũ trong `dist/`.

> ⚠️ **PowerShell:** Không dùng `&&` để chain commands. Chạy từng lệnh riêng biệt.

## Hệ thống xác thực (Auth)

```
auth.js
  │
  ├── checkAdminPassword()
  │     → Prompt input password
  │     → Compare with hardcoded hash
  │     → Set body.classList.add('is-admin')
  │
  └── CSS Rule:
        body:not(.is-admin) .admin-only { display: none !important; }
        body.is-admin .admin-only { display: ... }
```

**Quy tắc:** Mọi phần tử chỉ dành cho admin phải có class `admin-only`. CSS tự động ẩn/hiện dựa trên `body.is-admin`.

## Chatbot Lily

```
chat.js
  │
  ├── .chat-btn (fixed, bottom-right, z-index: 1000)
  │     → Click → toggle .chat-box
  │
  └── .chat-box (360px width, fixed position)
        → iframe to DeepMed-AI HuggingFace Space
        → OR standalone chat interface
```

> ⚠️ **NEVER** add `display: none` to `.chat-btn` or `.chat-box` in CSS. This was the root cause of chatbot disappearing in April 2026.

## Thiết kế lý do (Design Decisions)

| Decision | Why |
|----------|-----|
| **Hybrid React + Static HTML** | Marketing site cần animations/SEO; web apps cần direct DOM manipulation + Google Sheets API |
| **HashRouter** | GitHub Pages không hỗ trợ server-side routing → hash-based routing (#/path) |
| **Google Sheets as backend** | Zero infrastructure cost, familiar for hospital staff, real-time collaboration |
| **CSS Variables over Tailwind for webapp** | Static HTML modules không có build step, cần runtime theming (light/dark) |
| **Bootstrap 5 for webapp** | Modals, grid, responsive utilities — proven, stable, no build required |
| **target="_self" for webapp links** | Giữ user trong cùng tab, tránh confusion khi navigate giữa React SPA và static HTML |

## Những gì KHÔNG có ở đây

- **Không có backend server** — tất cả data qua Google Sheets API
- **Không có database** — Google Sheets là single source of truth
- **Không có CI/CD** — build manually, push manually
- **Không có testing** — manual QA only (future improvement opportunity)
- **Không có i18n** — Vietnamese only, single locale
