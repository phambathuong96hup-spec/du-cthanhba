# Design System: Khoa Dược - TTYT Thanh Ba

## 1. Visual Theme & Atmosphere
A clinical, trusting, and hyper-clean interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is professional yet reassuring — like a modern, well-lit medical facility. Creativity is restrained, opting for clarity and data density but without feeling cramped.

## 2. Color Palette & Roles
- **Canvas White** (#F8FAFC) — Primary background surface
- **Pure Surface** (#FFFFFF) — Card and container fill
- **Medical Charcoal** (#0F172A) — Primary text, deep depth
- **Muted Steel** (#64748B) — Secondary text, metadata, descriptions
- **Whisper Border** (rgba(226,232,240,0.7)) — Clean structural dividers
- **Azure Trust** (#0E7490) — Single accent for CTAs, active states, focus rings. Represents healthcare reliability.

## 3. Typography Rules
- **Display:** Plus Jakarta Sans — Track-tight, controlled scale, weight-driven hierarchy. Clean geometric feel.
- **Body:** Plus Jakarta Sans — Relaxed leading, 65ch max-width, neutral secondary color.
- **Mono:** JetBrains Mono — For medical codes, stock numbers, high-density metric tables.
- **Banned:** Inter, generic system fonts, serif fonts in dashboards.

## 4. Component Stylings
* **Buttons:** Flat, no outer glow. Tactile -1px translate on active. Azure fill for primary, ghost/outline for secondary.
* **Cards:** Generously rounded corners (1.25rem). Diffused whisper shadow. High-density pages replace internal cards with border-top dividers.
* **Inputs:** Label above, error below. Focus ring in Azure. No floating labels. Medical forms must look highly structured.
* **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
* **Empty States:** Composed compositions (e.g. "Không tìm thấy thuốc khớp với từ khóa") — not just generic text.

## 5. Layout Principles
Grid-first responsive architecture. Split screens for search panels. Strict single-column collapse below 768px. Contain layouts using 1280px max-width container. Generous internal padding. No overlapping text.

## 6. Motion & Interaction
Spring physics for interactive elements (CTAs, tabs). Staggered cascade reveals for list of medicines. Hardware-accelerated transforms only. No disruptive pop-ins.

## 7. Anti-Patterns (Banned)
- No emojis anywhere.
- No `Inter`. No pure black (`#000000`).
- No neon glows or oversaturated accents.
- No 3-column equal grids for feature rows if variance > 4. Focus on clean data grids.
- No fake system/stats sections inventing uptime or AI clichés ("Next-Gen Medical").
- No generic placeholders ("John Doe", "Medicine X"). Use realistic Vietnamese medical terms if placeholders are needed ("Paracetamol 500mg", "BS. Nguyễn Văn A").
