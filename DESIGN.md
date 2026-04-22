# Design System — Khoa Dược, TTYT Khu vực Thanh Ba

## Product Context
- **What this is:** Website giới thiệu và hệ thống web app nội bộ cho Khoa Dược
- **Who it's for:** Cán bộ y tế, Dược sĩ, bệnh nhân, ban lãnh đạo bệnh viện
- **Space/industry:** Y tế công lập (peers: bệnh viện lớn, hệ thống EHR)
- **Project type:** Marketing site + Internal web applications (task management, equipment management)

## Architecture Layers

| Layer | Tech Stack | CSS System |
|-------|-----------|------------|
| **Marketing site** (React/Vite) | Tailwind CSS v4 + shadcn/ui | Utility-first, oklch tokens |
| **Web App: Quản lý Công việc** (Static HTML) | Vanilla CSS + Bootstrap 5 | CSS custom properties (`:root`) |
| **Web App: Quản lý Trang thiết bị** (Static HTML) | Vanilla CSS + Bootstrap 5 | CSS custom properties (`:root`) |

## Aesthetic Direction
- **Direction:** Professional Healthcare — clean, trustworthy, data-focused
- **Decoration level:** Moderate — glassmorphism on hero, clean surfaces on data views
- **Mood:** Chuyên nghiệp nhưng thân thiện. Y tế hiện đại, không lạnh lẽo
- **Reference:** Linear (dark mode cho webapp), Apple Health (clean data), Google Sheets (task management)

## Typography

### Marketing Site (React)
- **Display/Hero:** Cormorant Garamond (Serif) — elegant, trustworthy for medical context
- **Body:** Inter (Sans-serif) — clean, highly readable
- **Mono:** JetBrains Mono — for data, code blocks
- **Loading:** Google Fonts with `display=swap`

### Web App Modules (Static HTML)
- **Primary:** Manrope — geometric, modern, excellent for dashboards
- **Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Scale:**
  - H1: 1.5rem (24px)
  - H2: 1.1rem (17.6px)
  - Body: 0.85rem (13.6px)
  - Small/Labels: 0.78rem (12.5px)
  - Micro: 0.68rem (10.9px)

## Color Palette

### Shared Brand Colors (across all modules)
```
emerald-600:  #059669   — Primary brand (Khoa Dược green)
emerald-500:  #10b981   — Primary light
emerald-700:  #047857   — Primary dark
emerald-50:   #ecfdf5   — Primary background tint
```

### Marketing Site (Tailwind)
```
Neutrals:     slate-50 → slate-950 (Tailwind defaults)
Accent Blue:  #1d4ed8 → #0284c7 (gradient partner)
Accent Violet: #7c3aed (DeepMed AI)
Accent Amber: #d97706 (Tra cứu nhanh)
```

### Web App Light Mode (CSS Variables)
```css
:root {
  /* ── Brand ── */
  --primary:          #059669;
  --primary-light:    #10b981;
  --primary-dark:     #047857;
  --primary-bg:       #ecfdf5;
  --primary-glow:     rgba(16, 185, 129, 0.2);

  /* ── Accent ── */
  --secondary:        #64748b;
  --accent:           #6366f1;
  --accent-bg:        #eef2ff;

  /* ── Surfaces ── */
  --bg-body:          #f8fafc;
  --surface:          #ffffff;
  --surface-raised:   #ffffff;

  /* ── Text ── */
  --text-main:        #0f172a;
  --text-secondary:   #475569;
  --text-light:       #94a3b8;

  /* ── Borders ── */
  --border-color:     #e2e8f0;
  --border-light:     #f1f5f9;

  /* ── Shadows ── */
  --card-shadow:      0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.03);
  --card-shadow-hover: 0 12px 40px rgba(0,0,0,0.08);

  /* ── Layout ── */
  --sidebar-width:    264px;
  --header-height:    64px;
  --card-radius:      16px;

  /* ── Motion ── */
  --transition:       all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast:  all 0.15s ease;

  /* ── Gradients ── */
  --gradient-primary: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  --gradient-surface: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.6) 100%);

  /* ── Semantic Status ── */
  --success:          #16a34a;
  --success-bg:       #dcfce7;
  --warning:          #d97706;
  --warning-bg:       #fef9c3;
  --danger:           #dc2626;
  --danger-bg:        #fee2e2;
  --info:             #2563eb;
  --info-bg:          #dbeafe;
}
```

### Web App Dark Mode
```css
[data-theme="dark"] {
  --primary:          #10b981;
  --primary-light:    #34d399;
  --primary-dark:     #059669;
  --primary-bg:       rgba(16, 185, 129, 0.1);
  --primary-glow:     rgba(16, 185, 129, 0.15);
  --secondary:        #94a3b8;
  --accent:           #818cf8;
  --accent-bg:        rgba(99, 102, 241, 0.1);
  --bg-body:          #0c1222;
  --surface:          #1a2332;
  --surface-raised:   #1e293b;
  --text-main:        #f1f5f9;
  --text-secondary:   #94a3b8;
  --text-light:       #64748b;
  --border-color:     #1e3a5f;
  --border-light:     #1e293b;
  --card-shadow:      0 1px 3px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.2);
  --card-shadow-hover: 0 12px 40px rgba(0,0,0,0.4);
  --gradient-surface: linear-gradient(180deg, rgba(26,35,50,0.95) 0%, rgba(12,18,34,0.8) 100%);
}
```

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable for marketing, Compact for data tables
- **Scale:** 2px · 4px · 8px · 12px · 16px · 20px · 24px · 32px · 48px · 64px

## Layout

### Marketing Site
- **Grid:** 12 columns (Tailwind), max-width: 80rem (1280px)
- **Responsive breakpoints:** sm(640) · md(768) · lg(1024) · xl(1280) · 2xl(1536)

### Web App Modules
- **Layout:** Sidebar (264px) + Content area
- **Border radius:** 
  - Cards/panels: 16px (`--card-radius`)
  - Buttons/inputs: 10px
  - Badges/pills: 20px–9999px
  - Modals: 20px
- **Sidebar collapse:** min-width 72px

## Motion
- **Approach:** Purposeful — animations guide attention, never distract
- **Marketing:** Framer Motion — parallax hero, staggered cards, scroll-triggered reveals
- **Web App:** CSS transitions only — fast, performant, no JS animation library
- **Duration:**
  - Micro (hover, focus): 150ms
  - Standard (expand, collapse): 300ms cubic-bezier(0.4, 0, 0.2, 1)
  - Entrance (page load): 400ms ease-out

## Component Patterns

### Buttons
| Type | Usage | Style |
|------|-------|-------|
| Primary | Main CTA | `--gradient-primary`, white text, glow shadow |
| Secondary | Supporting action | Border `--primary`, transparent bg |
| Compliance | Record action (Ghi nhận) | Amber gradient `#f59e0b → #d97706` |
| Ghost | Toolbar icons | Transparent bg, icon only |

### Cards
| Type | Usage |
|------|-------|
| `card-modern` | Data containers (task list, compliance) |
| `stat-card` | KPI metrics with icon |
| `kanban-card` | Drag-and-drop task cards |

### Status Colors
| Status | Light BG | Text |
|--------|----------|------|
| Chưa bắt đầu | `#f1f5f9` | `#64748b` |
| Đang thực hiện | `#dbeafe` | `#2563eb` |
| Hoàn thành | `#dcfce7` | `#16a34a` |
| Quá hạn | `#fee2e2` | `#dc2626` |

## Chatbot (Lily)
- **Position:** Fixed bottom-right, `z-index: 1000`
- **Button:** 56px circle, gradient primary, white icon
- **Chat box:** 360px wide, max-height 500px, border-radius 20px
- **⚠️ NEVER add `display:none` to `.chat-btn` or `.chat-box`**

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04 | Emerald green as brand | Medical/pharmaceutical industry standard — trust, health |
| 2026-04 | Manrope for webapp | Geometric, modern, excellent for data-heavy dashboards |
| 2026-04 | Dark theme for task module | Reduces eye strain for staff using app throughout the day |
| 2026-04 | CSS variables over Tailwind for webapp | Static HTML modules don't use build tooling, need runtime theming |
| 2026-04 | Cormorant Garamond for hero | Serif font adds elegance and trust for patient-facing marketing |
