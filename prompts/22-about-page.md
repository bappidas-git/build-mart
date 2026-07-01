# 22 — About Page

## 1. Objective
Rebuild `src/pages/AboutUs/AboutUs.js` (+ `AboutUs.module.css`) as the **North East Build Mart (NEBM)** About page: real business identity, tagline, address, both phone numbers, a category overview, a premium minimal design, and a contact CTA — with **no purchase/shipping/returns claims** and no invented vanity metrics.

## 2. Context / background
NEBM is a building-materials **enquiry** platform serving Nagaon, Assam and the North East. The About page tells visitors who NEBM is and what it stocks, then routes them to browse or make contact. It must not claim e-commerce features NEBM does not offer (no "buy online", "fast shipping", "easy returns", "50K+ happy customers").

Brand facts to embed **verbatim**:
- **Business name:** North East Build Mart
- **Tagline / type:** Deals in all kinds of building materials for interior and exterior use.
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`
- **Logo:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` (works on light + dark)

Category overview to list (top-level tree; see `prompts/00-analysis-and-requirement-map.md` §4): WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products · Tiles · Doors · Hardware · Plumbing · Bath Fittings · Cement · Steel Rods · plus a badged **Special Products** collection. This page pairs with the Contact page (prompt 23) and the redesigned Footer (prompt 24).

The current `AboutUs.js` imports `APP_NAME`, `APP_TAGLINE`, `WHY_CHOOSE_US` from `src/utils/constants.js` (generic "My Store" copy) and renders fake stats ("50K+ Happy Customers", "99.9% Uptime") and shopping-centric prose. Replace all of it with NEBM content.

## 3. Files & folders to inspect
- `src/pages/AboutUs/AboutUs.js` — the page to rebuild.
- `src/pages/AboutUs/AboutUs.module.css` — reuse hero/section/grid styles; re-token to Blue/Gold.
- `src/utils/constants.js` — `APP_NAME` (currently "My Store"), `APP_TAGLINE`, `WHY_CHOOSE_US`, `SUPPORT_*`. Prefer hardcoding NEBM facts on this page (self-contained) rather than depending on constants that other prompts will change; if constants are already updated to NEBM, use them.
- `src/utils/categories.js` — if you want to render the live category list instead of a static one (`getMainMenuCategories`).
- `src/context/ThemeContext.js` — `isDarkMode` for the dark variant.
- `@iconify/react` — category/section icons (`mdi:*`).

## 4. Step-by-step implementation instructions
1. **Hero.** Replace the eyebrow/title/subtitle: eyebrow = the tagline "Deals in all kinds of building materials for interior and exterior use.", `<h1>` = "About North East Build Mart", subtitle = a factual one-liner, e.g. "Your trusted building-materials partner in Nagaon, Assam — supplying quality interior and exterior materials across the North East." Optionally show the NEBM logo in the hero (light/dark safe).
2. **Remove the fake stats section** (`stats` array with "50K+ / 99.9% Uptime"). If you keep a stats strip, use only truthful, non-numeric-vanity items (e.g. "11+ material categories", "Interior & Exterior", "Based in Nagaon, Assam") — or drop it entirely. Do not fabricate customer/brand counts.
3. **Our Story / Who We Are.** Replace the shopping prose with NEBM-appropriate copy: NEBM deals in all kinds of building materials for interior and exterior use, serving builders, contractors, and homeowners; customers browse the catalogue and **send an enquiry** for pricing/availability (no online checkout). Keep it honest and enquiry-oriented.
4. **What We Stock (category overview).** Add a section listing the top-level categories as a clean icon grid: WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing Products, Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods, and the badged Special Products collection. Each tile links to the relevant `/products?category=<slug>` (or `/products`) so the About page drives browsing. You may render this statically or pull from `getMainMenuCategories()`.
5. **Why NEBM.** Replace `WHY_CHOOSE_US` items with truthful value props: wide range of interior/exterior materials, trusted local supplier in Nagaon, quality brands, responsive enquiry-based service, expert guidance. Use `@iconify/react` icons; no shipping/returns/uptime claims.
6. **Contact CTA.** Replace the "Ready to start shopping?" banner with a contact-oriented CTA: heading "Have a project in mind?", copy "Send us an enquiry or reach us directly.", and two actions — a primary "Browse Products" (→ `/products`) and a secondary "Contact Us" (→ `/support`, the Contact page from prompt 23). Include the address and both phone numbers (as `tel:` links) somewhere on the page (e.g. a small contact strip or the CTA), verbatim: Lawkhuwa Road, Nagaon, Assam – 782002 · +91 86385 43526 · +91 88762 89972.
7. **Re-token the stylesheet** to Blue `#1885d8` / Gold `#fa9c4c` and confirm the dark variant (`styles.dark`) reads well.

## 5. UI/UX requirements
- Premium, minimal, Apple-style: big calm hero, generous white space, rounded cards, soft shadows, restrained color. Primary Blue `#1885d8` for headings/CTAs; Gold `#fa9c4c` for accents (eyebrow underline, icon tint, badge) used sparingly.
- Category grid: consistent icon style (`@iconify/react` `mdi:*`), even spacing, hover lift, mobile-first responsive columns.
- Logo must render cleanly on both light and dark backgrounds (the provided Cloudinary logo supports this).
- Keep the existing framer-motion entrance animations; keep them subtle.
- No emojis.

## 6. Data & API requirements
- Mostly static content — **N/A** for the dual-mode API on this page. If you render the live category list via `getMainMenuCategories()` (which reads `apiService.categories.getAll` upstream), keep any such call dual-mode (`IS_MOCK_API` + `extractData()`); otherwise no API changes.
- Do not depend on wallet/coupon/shipping data. No money is shown.

## 7. Admin panel requirements
N/A.

## 8. Storefront requirements
- Route `/about` renders the NEBM About page.
- All category tiles and CTAs resolve to real routes (`/products`, `/products?category=<slug>`, `/support`); no dead links.
- Address and both phones are present and correct; phones are `tel:` links.

## 9. Acceptance criteria
- [ ] Page shows business name "North East Build Mart" and the tagline "Deals in all kinds of building materials for interior and exterior use." verbatim.
- [ ] Address "Lawkhuwa Road, Nagaon, Assam – 782002" and both phones "+91 86385 43526" and "+91 88762 89972" appear (phones as `tel:` links).
- [ ] A category-overview section lists the NEBM categories and links to browse.
- [ ] No fabricated metrics (no "50K+ / 99.9% Uptime") and no purchase/shipping/returns claims.
- [ ] Blue `#1885d8` / Gold `#fa9c4c` palette applied; logo renders on light and dark.
- [ ] Contact CTA routes to `/products` and `/support`.

## 10. Testing / verification steps
1. `npm run dev`; open `/about`.
2. Confirm the name, tagline, address, and both phone numbers are present and correct; click a phone link (opens the dialer).
3. Click each category tile → lands on the right `/products?category=<slug>` (or `/products`).
4. Click "Browse Products" and "Contact Us" CTAs → `/products` and `/support`.
5. Toggle dark mode → logo and text remain legible; no fake stats visible.
6. Grep the page for any leftover "My Store" / "shopping" / "shipping" / "returns" copy and confirm none remain.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Routing** — `/about` keeps resolving; every link targets a real route (no catch-all redirect to `/`).
- **Dual-mode API** — if you pull live categories, keep `IS_MOCK_API` + `extractData()`; otherwise leave the API layer untouched.
- **Theme** — keep `isDarkMode` handling and the `styles.dark` variant; keep storefront/admin palette separation.
- **CSS Modules** — reuse/refactor `AboutUs.module.css`; don't introduce global styles.
- **framer-motion** — keep entrance animations subtle and non-blocking.
- **Constants coupling** — if this page hardcodes NEBM facts, ensure it doesn't reintroduce the generic `APP_NAME`/`WHY_CHOOSE_US` "My Store" content that other prompts are removing.
