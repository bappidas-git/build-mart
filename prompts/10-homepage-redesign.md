# 10 — Homepage Redesign

## 1. Objective

Redesign the NEBM homepage (`src/pages/Home/Home.js` + `Home.module.css`) and its section components (`HeroSection`, `FeaturedProducts`, `CTASection`) into a premium, Apple-minimal landing page: a brand **hero** with the NEBM logo and tagline, a **"Shop by Category"** grid, a **Featured Products** section, a **Special Products** highlight band, a **CTA section**, and a **contact CTA**. Data is fetched dual-mode via `apiService` through `extractData()`. Remove all purchase/deal-timer merchandising (flash-deals countdown, "% OFF" urgency, "Buy Now") — **Special Products** replaces the deals surface.

## 2. Context / background

**Brand:** North East Build Mart — tagline **"Deals in all kinds of building materials for interior and exterior use."** Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phone: +91 86385 43526 · +91 88762 89972. Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c` (sparingly). Aesthetic: premium, minimal, soft shadows, rounded cards, generous white space, subtle animation. Main logo `…/logo_fnscna.png` (light/dark safe); icon `…/icon_bvsukn.png`.

**Enquiry model (restate):** NEBM is an e-commerce-*style* **enquiry** platform — no Buy Now / checkout / payment. The current homepage is full of ecommerce merchandising to remove: a **Flash Deals** section with a live **CountdownTimer**, a "Up to 50% Off" promo banner, "% off" discount badges, "Add to Cart" buttons, and "See what everyone is buying" copy. NEBM instead highlights **Special Products** (the badged/curated collection — see prompts 06 & 11) and drives users to browse and **add to Enquiry List** (icon-button, tooltip "Add to Enquiry List"). No deal timers, no urgency, no fabricated social proof.

**Current `Home.js`** fetches `apiService.categories.getAll()`, `products.getFeatured(8)`, `products.getTrending(8)` (each `.catch(()=>[])`), derives "flashDeals" from discounted products, and renders: Hero → Flash Deals(+countdown) → Shop by Category → Featured Products → Promo Banner(50% off) → Trending → Why Choose Us → Recently Viewed. It uses `categoryParam(cat)` for category links and a local `ProductCard`. `HeroSection.js` is a generic carousel of gradient banners + a category quick-bar (hardcoded generic slugs/colors). `FeaturedProducts.js` and `CTASection.js` are reusable section components with "Add to Cart" buttons and discount badges.

**Dual-mode rule (restate):** all homepage data comes from `apiService` methods that branch on `IS_MOCK_API` and normalise via `extractData()` — `products.getFeatured()`, `products.getAll()` (filter `special`), `categories.getAll()`. The same page must render against JSON Server (`:3001`) and Laravel. Keep the `Array.isArray(...)` guards; no `db.json` shape changes here (prompt 06 seeds data, prompt 11 owns the `special` badge logic).

## 3. Files & folders to inspect

- `src/pages/Home/Home.js` + `Home.module.css` — the page to redesign.
- `src/components/HeroSection/HeroSection.js` + `.module.css` — hero to rebrand.
- `src/components/FeaturedProducts/FeaturedProducts.js` + `.module.css` — featured section (also used for Special Products band).
- `src/components/CTASection/CTASection.js` + `.module.css` — CTA band.
- `src/components/storefront/ProductCard.js` — the canonical card (prompt 11 adds the "Special" badge); prefer reusing it over the page-local card.
- `src/services/api.js` — `products.getFeatured`, `products.getAll`, `products.getTrending`, `categories.getAll`, `banners.getAll`, `extractData()`.
- `src/utils/categories.js` — `categoryParam`, `getMainMenuCategories`, `orderCategoriesHierarchically`.
- `src/utils/helpers.js` — `getProductMinPrice`, `buildCartItem`, `productPath`, `PLACEHOLDER_IMG`, `onImageError`.
- `src/utils/constants.js` — `APP_NAME`, `WHY_CHOOSE_US`, phone constants (reword to NEBM).

## 4. Step-by-step implementation instructions

1. **Hero (`HeroSection.js`):** replace the generic gradient carousel + hardcoded category quick-bar with an NEBM brand hero: the **main logo**, the business name, the tagline **"Deals in all kinds of building materials for interior and exterior use."**, and a primary CTA ("Explore Products" → `/products`) plus a secondary contact CTA (call NEBM / "Enquire Now"). Keep it clean and minimal — a single strong hero, not a busy multi-banner carousel (you may keep `banners.getAll()` support for an admin-managed hero image if data exists, but drop the "Limited Time Offer" / gradient-promo styling). No deal-timer, no "50% off". Blue `#1885d8` with a subtle gradient/tint; gold `#fa9c4c` accent on the CTA.
2. **Shop by Category grid:** keep/redesign the "Shop by Category" section fed by `categories.getAll()`. Show the **top-level** NEBM categories (filter `!parentId && isActive`, or use `getMainMenuCategories`), each as a rounded card with the category `image` and name, linking to `/products?category=${categoryParam(cat)}`. Premium grid, soft shadow, hover lift.
3. **Featured Products:** render a Featured section from `products.getFeatured(8)` (dual-mode). Use the shared `ProductCard` (`src/components/storefront/ProductCard.js`) with an **"Add to Enquiry List"** icon-button (tooltip) instead of a text "Add to Cart" button — coordinate with the enquiry-list/ProductCard prompts. "View All" → `/products?sort=featured` or `/products`.
4. **Special Products highlight band:** add a dedicated band that surfaces products flagged `special: true` (from `db.json`, seeded in prompt 06). Fetch via `products.getAll()` and filter `p.special === true` (or a dedicated helper/endpoint if prompt 11 defines one), slice to ~8. Reuse `FeaturedProducts` (pass `title="Special Products"`, `viewAllLink="/special-offers"`) or a similar band. Badge cards with the gold **"Special"** badge (the badge rendering itself is prompt 11 on `ProductCard`). This **replaces** the removed Flash Deals section. Clarify in copy that these are curated/special picks — NOT a limited-time countdown.
5. **Remove deal/urgency merchandising:** delete the `CountdownTimer`, the Flash Deals section, the "Up to 50% Off"/"Limited Time Offer" promo banner, the promo circle, and "% off"/discount-urgency styling from the homepage. Remove or rework "Trending Now — see what everyone is buying" (either drop it, or keep a neutral "Popular Products" band from `getTrending` without urgency copy). No fabricated social proof.
6. **CTA section (`CTASection.js`):** repurpose to an NEBM CTA band — e.g. "Building something? Get material deals & bulk pricing." with a button to `/products` and/or an enquiry/contact action. Blue background with gold accent; clean and minimal.
7. **Contact CTA:** add a compact contact call-to-action near the page end with NEBM address (Lawkhuwa Road, Nagaon, Assam – 782002) and phone numbers as `tel:` links (+91 86385 43526 · +91 88762 89972), inviting users to enquire. (Footer likely also carries this; keep the homepage CTA concise.)
8. **Why Choose NEBM (optional):** keep a trust/value band if desired, reworded for a building-materials supplier (wide catalogue, bulk/tiered pricing, quality brands, local delivery) — no fake stats.
9. **Recently Viewed:** keep if present (localStorage-driven), rendered with the shared card; harmless and useful.
10. **Motion & polish:** keep subtle framer-motion reveals (`whileInView`, gentle `y`/opacity), soft shadows, rounded cards, consistent section rhythm from the layout foundation (prompt 07). Keep skeleton loaders. Ensure all fetches keep their `.catch`/`Array.isArray` guards so a failed call renders an empty section, not a crash.

## 5. UI/UX requirements

- **Hero:** NEBM logo + name + tagline + primary "Explore Products" CTA + contact CTA; single clean hero (no gradient-carousel clutter, no timer). Blue `#1885d8`, gold `#fa9c4c` accent.
- **Sections (in order):** Hero → Shop by Category → Featured Products → **Special Products band** → CTA section → Contact CTA (+ optional Popular/Why-Choose/Recently-Viewed).
- **Cards:** shared `ProductCard`, rounded, soft shadow, hover lift; "Add to Enquiry List" icon-button (tooltip), gold "Special" badge where `special`.
- **Colors:** primary blue, gold sparingly; neutral airy surfaces; consistent white space.
- **Copy:** enquiry-correct — no "Buy Now", "Flash Deals", "Limited Time", "% off" urgency, "Deal of the Day" timer, or "everyone is buying". Special Products = curated collection, not a countdown.
- **Motion:** subtle, premium; skeletons while loading.
- **Responsive:** mobile-first grids that scale to desktop.

## 6. Data & API requirements

- **Categories:** `apiService.categories.getAll()` → top-level (`!parentId && isActive`) or `getMainMenuCategories`. Links via `categoryParam`.
- **Featured:** `apiService.products.getFeatured(8)` (mock filters `?featured=true`, sliced; Laravel `/products/featured`). Guard with `Array.isArray`.
- **Special Products:** `apiService.products.getAll()` filtered `p.special === true` (mock `/products`; Laravel `/products`), or a dedicated method if prompt 11 adds one. Slice ~8.
- **Popular (optional):** `apiService.products.getTrending(8)` (neutral framing, no urgency).
- **Banners (optional hero image):** `apiService.banners.getAll()` if used, with a safe default.
- **`extractData()` / dual-mode (restate):** every call flows through `apiService` methods that branch on `IS_MOCK_API` and normalise via `extractData()`; the page renders identically against JSON Server and Laravel. Keep `.catch(()=>[])` + `Array.isArray` guards. No `db.json` writes.

## 7. Admin panel requirements

N/A. The homepage is driven by category data and product flags (`featured`, `special`) the admin manages — no hardcoded product/category lists. Do not touch admin screens.

## 8. Storefront requirements

- Homepage presents NEBM branding, the category grid, featured products, a Special Products band, a CTA, and a contact CTA — all enquiry-correct.
- Product cards offer "Add to Enquiry List" (icon + tooltip), never "Buy Now" or a plain "Add to Cart".
- Category cards deep-link to slug listings; Special Products band links to `/special-offers` (the repurposed collection, prompt 11).
- No deal timers, urgency, or fabricated social proof anywhere on the page.

## 9. Acceptance criteria

- [ ] Hero shows the NEBM logo, business name, the exact tagline, an "Explore Products" CTA, and a contact CTA; no gradient-carousel deal clutter or countdown.
- [ ] "Shop by Category" renders top-level NEBM categories from `categories.getAll()`, each linking to `/products?category=<slug>`.
- [ ] Featured Products renders from `products.getFeatured()` using the shared `ProductCard` with an "Add to Enquiry List" icon-button.
- [ ] A **Special Products** band renders products with `special: true`, links to `/special-offers`, and shows the gold "Special" badge (rendering owned by prompt 11).
- [ ] The Flash Deals section, `CountdownTimer`, "Up to 50% Off"/"Limited Time Offer" promo banner, promo circle, and discount-urgency copy are removed.
- [ ] No "Buy Now"/"Add to Cart" text or deal-timer/urgency/fake-social-proof copy remains on the homepage.
- [ ] All fetches keep `.catch`/`Array.isArray` guards; a failed call yields an empty section, not a crash; skeletons show while loading.
- [ ] Brand blue `#1885d8` primary, gold `#fa9c4c` accents only; premium, minimal, soft-shadow styling; subtle motion.
- [ ] Page renders identically in mock mode (JSON Server) — data flows via `apiService` + `extractData()`.

## 10. Testing / verification steps

1. `npm run dev`; open `http://localhost:3000`.
2. **Hero:** NEBM logo + tagline present; CTAs work ("Explore Products" → `/products`; contact CTA calls/links the NEBM phone).
3. **Categories:** grid shows NEBM top-level categories; a card click → `/products?category=<slug>` listing.
4. **Featured:** cards render from `http://localhost:3001/products?featured=true`; each has an "Add to Enquiry List" icon-button (tooltip); adding increments the header Enquiry List count.
5. **Special Products band:** products with `special:true` appear (`http://localhost:3001/products?special=true`), show the gold "Special" badge, and "View All" → `/special-offers`.
6. **Removed merchandising:** confirm no countdown, no "50% off" banner, no "Flash Deals", no "% off" urgency, no "Buy Now"/"Add to Cart" text (search the DOM).
7. **Resilience:** stop JSON Server briefly / force a failed fetch → sections render empty (no crash), skeletons then empty states.
8. **Responsive + motion:** check mobile→desktop layout and subtle reveals; dark mode legible.

## 11. Notes on preserving existing functionality

Do **not** break:
- **Dual-mode API + `extractData()`** — keep all data via `apiService.*` methods (never call JSON Server URLs directly in the page); keep `IS_MOCK_API` branching intact; renders identically on Laravel. No `db.json` writes here.
- **Fetch guards** — preserve `.catch(()=>[])` + `Array.isArray(...)` so a failed/empty response degrades gracefully.
- **Slug/category rules** — category links stay `/products?category=${categoryParam(cat)}`; parent-includes-children resolution is downstream.
- **Enquiry-list wiring** — quick-add uses `buildCartItem(product)` (variant-aware id) so homepage adds merge with PDP adds; the "Add to Enquiry List" action calls the same `useCart` add path; localStorage key `"cart"` unchanged.
- **Shared components** — reuse `ProductCard`, `FeaturedProducts`, `CTASection`, `HeroSection`; don't fork a parallel card. Keep them working where imported elsewhere (Featured/CTA are reused).
- **Enquiry-correct language** — no "Buy Now/Add to Cart/Checkout/Flash Deals/Deal of the Day timer/% off urgency"; Special Products is a curated collection, not a countdown.
- **Recently Viewed** localStorage key (`recentlyViewed`) — keep compatible if retained.
- **Per-component CSS Modules** + storefront/admin palette separation; subtle motion via framer-motion already imported.
- **Routing/providers** — no route or provider changes; `/special-offers` stays the collection route (prompt 11).
