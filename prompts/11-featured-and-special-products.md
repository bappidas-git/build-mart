# 11 — Featured & Special Products

## 1. Objective

Implement NEBM's **Featured** and **Special Products** surfaces:
1. A **Featured categories/products** section (homepage + reusable band).
2. The **Special Products badged collection** — products flagged `special: true` in `db.json` surface (a) in a homepage highlight band and (b) on a repurposed `/special-offers` collection page — and each is **badged** on `ProductCard` with a gold `#fa9c4c` **"Special"** badge.

Crucially: **Special Products is a badged/curated collection, NOT an exclusive category.** A special item also lives under its real top-level category (its `categoryId` points at a normal leaf) and appears in normal listings — the `special` flag is an *additional* label, not its home.

## 2. Context / background

**Brand:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c` (badges/highlights). Apple-minimal, soft shadows. This is an **enquiry** platform — no Buy Now / checkout / coupons / deal timers. **Special Products replaces the old deals/coupons merchandising.**

**Data (from prompt 06):** `db.json.products` carry `featured: boolean`, `trending: boolean`, and `special: boolean`. Special items are spread across different top-level categories; each keeps a normal `categoryId` (never the "Special Products" category node — that node exists only as a menu/collection label). See `prompts/00` §5 (Special Offers admin removed; storefront Special Products repurposed) and prompt 10 (homepage band).

**Current state to repurpose:**
- `src/pages/SpecialOffers/SpecialOffers.js` — today a **deals/coupons** page: master-toggle via `useDealsConfig`, a countdown timer, "Deal of the Day", coupon cards (`apiService.coupons.getActive()`), and a discount-sorted grid. This must become the **Special Products collection** page: products where `special === true`, no coupons, no countdown, no deal-of-the-day urgency.
- `src/components/FeaturedProducts/FeaturedProducts.js` — reusable product band (used by the homepage) with "Add to Cart" + discount badge.
- `src/components/storefront/ProductCard.js` — the canonical card; add the gold "Special" badge here.
- `src/App.js` — route `/special-offers` → `SpecialOffers` (keep the path; the page's meaning changes).

**Dual-mode rule (restate):** Special/Featured products are fetched via `apiService` methods that branch on `IS_MOCK_API` and normalise via `extractData()`. `getFeatured` filters `?featured=true` in mock; Special uses `products.getAll()` filtered `p.special === true` (or a new `getSpecial` method that mirrors the `getFeatured` dual-mode pattern). The same UI must work against JSON Server (`:3001`) and Laravel. No mock-only shapes; no `db.json` writes in this prompt (data was seeded in prompt 06).

## 3. Files & folders to inspect

- `src/components/storefront/ProductCard.js` + `ProductCard.module.css` — add the "Special" badge (reads `product.special`).
- `src/components/FeaturedProducts/FeaturedProducts.js` + `.module.css` — the reusable featured/special band.
- `src/pages/SpecialOffers/SpecialOffers.js` + `.module.css` — repurpose into the Special Products collection.
- `src/services/api.js` — `products.getFeatured`, `products.getAll`, `extractData()`, `IS_MOCK_API` (pattern for an optional `getSpecial`).
- `db.json` — `products[].special` / `featured` flags (read-only here; seeded in prompt 06).
- `src/utils/helpers.js` — `getProductMinPrice`, `buildCartItem`, `productPath`, `onImageError`.
- `src/utils/categories.js` — `categoryParam` (Special items still deep-link to their real category listings).
- `src/context/DealsConfigContext.js` — the deals master-toggle the current page depends on (decide: keep as a simple on/off for the collection, or remove the dependency).

## 4. Step-by-step implementation instructions

1. **"Special" badge on `ProductCard`:**
   - In `src/components/storefront/ProductCard.js`, when `product.special === true`, render a gold `#fa9c4c` **"Special"** badge (a small pill/ribbon, top-left or top-right of the media, distinct from the existing discount badge). Keep it accessible (`aria-label`/title). Use the brand gold hex exactly (`#fa9c4c`), white text.
   - Style in `ProductCard.module.css`; ensure it coexists with the wishlist heart and any discount badge without overlap.
   - The badge is presentation only — it never changes pricing or the card's links.
2. **Optional `getSpecial` API method (recommended, mirrors `getFeatured`):** add to `apiService.products` in `src/services/api.js`:
   ```js
   getSpecial: async (limit = 12) => {
     try {
       if (IS_MOCK_API) {
         const response = await api.get("/products", { params: { special: true } });
         return response.data.slice(0, limit);
       }
       const response = await api.get("/products/special", { params: { limit } });
       return extractData(response);
     } catch (error) { console.error("Get special products error:", error); throw error; }
   }
   ```
   If you prefer not to add a method, filter client-side: `products.getAll()` then `.filter(p => p.special === true)`. Either way, keep the dual-mode/`extractData()` fidelity.
3. **Featured section:** ensure the reusable **Featured Products** band (`FeaturedProducts.js`, used on the homepage) renders from `products.getFeatured()` and uses the shared card behaviour. Replace its "Add to Cart" text button with the enquiry action ("Add to Enquiry List" icon-button w/ tooltip) and drop the "% OFF" discount-urgency badge in favour of the neutral card styling (coordinate with the enquiry-list/ProductCard prompts). A **Featured categories** variant (top-level category cards) may reuse the "Shop by Category" grid from prompt 10 — don't duplicate logic.
4. **Repurpose `/special-offers` into the Special Products collection (`SpecialOffers.js`):**
   - **Remove** the coupons section (`coupons.getActive()`, coupon cards, copy-code), the countdown timer/hook (`useDealsCountdown`, `resolveCountdownTarget`), "Deal of the Day", and discount-sort urgency.
   - **Fetch** special products via `products.getSpecial()` (or `getAll()` + filter `special`), plus `categories.getAll()` for optional category tabs. Render a clean collection grid using the shared `ProductCard` (which now shows the gold "Special" badge).
   - Keep the responsive category **tabs** if useful (filter the special set by `categoryId`), but framed as "Special Products by category", not "deals". Reuse the existing `CategoryTabs` component if it stays clean.
   - **Hero/heading:** rebrand to "Special Products — curated picks across our catalogue" (NEBM blue/gold), with a short line clarifying these are hand-picked/special items available across categories — **not** limited-time deals. No timer.
   - **Master toggle:** either keep a lightweight enabled/disabled via `DealsConfigContext` (repurposed as "show Special Products page") or remove the dependency entirely and always show the collection. If the deals admin is being removed elsewhere, prefer removing the `useDealsConfig` gate here and simply render the collection; keep a graceful empty state when no products are special.
   - **Empty state:** "No special products right now — browse our full catalogue" → `/products`.
5. **Clarify collection semantics in code/comments:** Special Products page lists `special === true` products; each links to its normal product detail (`productPath`) and its category deep-links still work (`categoryParam` of its real `categoryId`). Do not build a "special" pseudo-category or filter it out of normal listings — special items appear both here (badged) and in their category listings.
6. **Homepage band (from prompt 10):** the homepage Special Products band and this `/special-offers` page share the same data source (`special === true`) and the same badged `ProductCard`. The band's "View All" links to `/special-offers`. Keep them consistent.
7. **Enquiry-correct actions:** all cards use "Add to Enquiry List" (icon-button, tooltip) via the `useCart` add path (`buildCartItem`), never "Add to Cart"/"Buy Now". No prices-as-deals; respect the per-product `priceType` display (exact/tiered/onEnquiry) from the pricing model where the card summarises price.

## 5. UI/UX requirements

- **"Special" badge:** gold `#fa9c4c` pill/ribbon with white text, top corner of the card media; clearly distinct from any discount/stock badge; doesn't overlap the wishlist heart.
- **Featured band:** clean product grid, shared `ProductCard`, "Add to Enquiry List" icon-button; no urgency/% -off badge.
- **Special Products page:** premium collection grid, optional category tabs framed as curation (not deals); NEBM blue/gold hero; no countdown/coupons/deal-of-the-day.
- **Colors:** blue `#1885d8` primary, gold `#fa9c4c` for the Special badge/accents (sparingly).
- **Copy:** "Special Products", "curated/hand-picked", "Add to Enquiry List". No "deal", "coupon", "limited time", "% off", "Buy Now".
- **Motion:** subtle framer-motion reveals; soft shadows; skeletons while loading; graceful empty state.

## 6. Data & API requirements

- **Special:** `apiService.products.getSpecial(limit)` (new, dual-mode as above) **or** `products.getAll()` + `.filter(p => p.special === true)`. Mock: `/products?special=true`. Laravel: `/products/special`. Normalise via `extractData()`.
- **Featured:** `apiService.products.getFeatured(limit)` (mock `?featured=true`, Laravel `/products/featured`).
- **Categories (tabs):** `apiService.categories.getAll()`; build a `categoryId → name` map; tabs filter the special set by `categoryId`.
- **Flags read (from `db.json`, seeded prompt 06):** `products[].special`, `products[].featured` (booleans). This prompt does **not** write `db.json`; it consumes the flags.
- **`ProductCard`** reads `product.special` to render the badge; it must stay domain-agnostic (renders whatever product it's given), so a missing/false `special` simply hides the badge.
- **Dual-mode (restate):** keep `IS_MOCK_API` branching + `extractData()` in any new/edited api method; the same components work against JSON Server and Laravel; no mock-only response shapes.

## 7. Admin panel requirements

N/A in this prompt (the Special Offers **admin** page and coupons/deals admin are removed/retired by a separate admin prompt). Note the linkage: the `special` (and `featured`) product flags are toggled from the **Admin Products** form (extended by the product-schema/admin prompt) — this prompt only consumes them on the storefront. Do not re-add a Special Offers admin route/nav here.

## 8. Storefront requirements

- Every `ProductCard` across the storefront shows the gold "Special" badge when `product.special === true` — homepage band, `/special-offers`, related/listing grids alike.
- `/special-offers` is the **Special Products collection**: `special === true` products, badged, with enquiry-list actions, no coupons/countdown/deal-of-the-day.
- Special items remain visible in their normal category listings (parent-includes-children unaffected); the collection is additive, not exclusive.
- The homepage Special Products band and `/special-offers` share data + card + "View All" link.

## 9. Acceptance criteria

- [ ] `ProductCard` renders a gold `#fa9c4c` "Special" badge iff `product.special === true`; it doesn't overlap the wishlist heart or break layout; false/missing hides it.
- [ ] Special products are fetched dual-mode (new `getSpecial` mirrors `getFeatured`, or `getAll()`+filter) via `extractData()`; mock hits `/products?special=true`.
- [ ] `/special-offers` lists only `special === true` products using the badged shared `ProductCard`; **no** coupons, countdown, deal-of-the-day, or "% off" urgency remain.
- [ ] The Featured band uses `products.getFeatured()` and the shared card with an "Add to Enquiry List" icon-button (no cart/urgency copy).
- [ ] A special product also appears in its normal category listing (e.g. `/products?category=<its-category-slug>`) — it is NOT removed from normal listings, confirming the badge is additive.
- [ ] Special items link to their normal product detail (`productPath`) and category (`categoryParam`) correctly.
- [ ] Copy is enquiry-correct: "Special Products"/"curated", "Add to Enquiry List"; no deal/coupon/limited-time/Buy-Now language.
- [ ] Empty state renders gracefully when no products are special.
- [ ] Brand blue `#1885d8` primary, gold `#fa9c4c` for the badge; premium/minimal styling; dual-mode renders identically in mock.

## 10. Testing / verification steps

1. Ensure prompt 06's seed is loaded (some products have `special: true`, `featured: true`). `npm run dev`.
2. **Badge:** open the homepage / `/products` — cards for special products show the gold "Special" badge; non-special cards don't. Confirm no overlap with the wishlist heart.
3. **Collection:** open `/special-offers` — only special products listed, all badged; no coupons/countdown/deal-of-the-day; "Add to Enquiry List" works and increments the header count.
4. **Additive check:** pick a special product, note its category, open `/products?category=<that-category-slug>` — the product appears there too (badged), proving it's not exclusive to the collection.
5. **Featured:** homepage Featured band renders from `http://localhost:3001/products?featured=true`; "View All" and card links work.
6. **JSON Server data checks:** `http://localhost:3001/products?special=true` and `?featured=true` return the expected sets; `getSpecial`/`getAll` results match.
7. **Empty state:** temporarily set all `special` to false (or filter) → `/special-offers` shows the graceful empty state with a browse CTA.
8. **Copy audit:** search the DOM/source for "coupon", "deal", "Buy Now", "Add to Cart", "% off" on these surfaces — none should remain.

## 11. Notes on preserving existing functionality

Do **not** break:
- **Dual-mode API + `extractData()`** — any new/edited `apiService` method keeps `IS_MOCK_API` branching and returns the normalised shape; works on JSON Server and Laravel. No `db.json` writes here.
- **Special Products is a badge, not a category** — never filter special items out of normal listings or assign them the Special Products category id; the flag is additive. Parent-includes-children (`getCategoryScopeIds`) and slug listings must still show them under their real category.
- **`ProductCard` reuse** — it stays the single canonical, domain-agnostic card used everywhere; the badge is additive and optional. Don't fork a "special" card.
- **Enquiry-list wiring** — cards add via `buildCartItem` through `useCart` (localStorage `"cart"`), never a purchase path; no payment/coupon/wallet side effects.
- **Enquiry-correct language** — remove all coupon/deal/countdown/Buy-Now copy from `/special-offers`; "Add to Enquiry List" everywhere.
- **Route stability** — keep the `/special-offers` path (in `src/App.js`); only the page's meaning/content changes. Don't add a Special Offers **admin** route back.
- **Pricing-model display** — respect per-product `priceType` (exact/tiered/onEnquiry) where the card shows price; don't render special items as discounted "deals".
- **DealsConfig dependency** — if you keep `useDealsConfig` as a page on/off, keep a graceful loading/empty state; if you remove it, ensure nothing else that imports the context breaks.
- **Per-component CSS Modules** + storefront/admin palette separation; subtle framer-motion; skeleton + empty states preserved.
