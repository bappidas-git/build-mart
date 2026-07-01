# 12 — Product Listing Redesign

## 1. Objective

Redesign the storefront product listing (`src/pages/Products/Products.js` + its `Products.module.css`) and the reusable `src/components/storefront/ProductCard.js` for **North East Build Mart (NEBM)**. The listing becomes a premium, Apple‑minimal, responsive product grid with a redesigned `ProductCard` that surfaces image, name, brand, price (via `PriceBlock`), and merchandising badges (featured / special / trending). The card's only action is an **"Add to Enquiry List" icon‑button with a tooltip** — there is **no** "Buy Now" and **no** "Add to Cart" text anywhere. Keep the powerful filtering/sorting engine that already exists (search, category scoping, pagination, results count, breadcrumb) fully working; this prompt is a redesign + terminology + card‑action pivot, **not** a rewrite of the data logic.

## 2. Context / background

NEBM is an e‑commerce‑*style* **enquiry** platform (React CRA + JSON Server in dev, Laravel in prod) — customers browse and **enquire**, they never buy, pay, or check out. Brand facts you need here:

- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Primary Blue:** `#1885d8` (+ tints/shades/subtle gradients). **Accent Gold/Orange:** `#fa9c4c` (badges, hover accents, icons — used sparingly).
- **Aesthetic:** premium, minimal, Apple‑style — generous white space, clean typography, soft shadows, rounded cards, professional product grids, minimal elegant animation, mobile‑first.
- **Placeholder image:** `https://placehold.co/600x400/1a1a2e/FFFFFF?text=Product+Name` (URL‑encode the name).

**Terminology rule (storefront UI):** "Cart" → **Enquiry List**; "Add to Cart" → **Add to Enquiry List** rendered as an **icon button with a tooltip**; "Buy Now" → **removed entirely**. See `prompts/00-analysis-and-requirement-map.md` §5 and the terminology map in the grounding brief.

This prompt is the sibling of prompt 13 (search/filter/sort) and prompt 15 (pricing display). `ProductCard` is shared by related‑product carousels, recently‑viewed, and bundles, so any change here must remain domain‑agnostic and prop‑compatible.

## 3. Files & folders to inspect

- `src/pages/Products/Products.js` — the listing page (grid, filters, sort, pagination, breadcrumb, results count).
- `src/pages/Products/Products.module.css` — its styles (redesign here).
- `src/components/storefront/ProductCard.js` + `ProductCard.module.css` — the reusable card.
- `src/components/storefront/PriceBlock.js` — price rendering (extended in prompt 15).
- `src/utils/categories.js` — `categoryParam`, `resolveCategory`, `getCategoryScopeIds`, `orderCategoriesHierarchically`.
- `src/utils/helpers.js` — `getProductMinPrice`, `buildCartItem`, `productPath`, `truncateText`, `PLACEHOLDER_IMG`, `onImageError`, `formatCurrency`.
- `src/hooks/useCart.js` → re‑exports `useCart` from `src/context/CartContext.js` (`addToCart`).
- `src/services/api.js` — `products` namespace (`getAll`, `getByCategory`) around line 872; `extractData()` helper.
- `src/theme/storefront-tokens.css` — `--sf-*` custom properties (brand palette lands here).

## 4. Step-by-step implementation instructions

1. **Keep the data layer intact.** `Products.js` already loads via `apiService.products.getAll()` and `apiService.categories.getAll()` inside `fetchCatalog()`, coercing to arrays. Do **not** change how data is fetched or the client‑side filter/sort/paginate memoization. Where a category deep‑link is present you may additionally support `apiService.products.getByCategory()`, but the existing `getAll()` + client scoping path must keep working (it is the source of truth for the count badges).
2. **Category scoping stays parent‑includes‑children.** The listing already expands each selected category to its scope via `getCategoryScopeIds(cat.id, categories)` and filters `wantedIds.has(String(p.categoryId))`. Preserve this exactly. Selecting a parent (e.g. **Tiles**) must return its children's products (Floor/Wall/Vitrified/Bathroom & Kitchen/Outdoor Tiles) too.
3. **Keep slug URLs.** Cards link via `productPath(product)` → `/products/:slug` (legacy numeric id still resolves + canonical‑redirects on the PDP). Do not link by raw id.
4. **Redesign the grid** in `Products.module.css`: a responsive CSS‑grid of soft, rounded cards. Target column counts: 1 (≤480px), 2 (≤768px), 3 (≤1100px), 4 (desktop). Use `--sf-*` tokens for color; soft shadow, `~16px` radius, subtle hover lift (`translateY(-4px)` + shadow), respecting `prefers-reduced-motion`.
5. **Redesign `ProductCard.js`:**
   - Render: image (lazy, `onError={onImageError}`, `PLACEHOLDER_IMG` fallback), **brand** (small, muted, above name), **name** (`truncateText(product.name, 48)`, links to `productPath`), rating stars + count **only when `product.totalReviews > 0`** (never a hollow "(0)"), and price via `<PriceBlock … />` (see prompt 15 for card mode).
   - **Badges (top‑left/right of the media):** show **Featured** when `product.featured`, **Special** when `product.special`, **Trending** when `product.trending`. Blue chip for Featured/Trending, gold (`#fa9c4c`) chip for **Special**. Keep the existing honest **discount** badge (`{discount}% OFF`) only when a real discount exists.
   - **Wishlist heart** stays (unchanged prop contract: `onToggleWishlist`, `isWishlisted`).
6. **Replace the card action.** Remove the text button `{outOfStock ? "Out of Stock" : "Add to Cart"}`. Add an **icon button** (a plus / list‑add glyph) with:
   - `aria-label="Add to Enquiry List"` and a visible **tooltip** "Add to Enquiry List" (CSS tooltip or `title` — prefer a styled CSS tooltip for the premium feel).
   - On click: `e.preventDefault(); onAddToEnquiry(buildCartItem(product))` (rename the prop; see §11 for API stability). It calls the same `addToCart` under the hood.
   - When `product.stock === 0`, disable it and show a tooltip "Out of Stock".
   - **No** "Buy Now", **no** visible "Add to Cart"/"Add to Enquiry List" text on the button face.
7. **Update `Products.js` card rendering** (`renderProductCard`) to match the new `ProductCard` visuals, OR delegate the grid card to `<ProductCard>` directly for a single source of truth. If you keep the inline renderer, mirror the same badges + icon‑button and change its handler name from `handleAddToCart` to `handleAddToEnquiry` (still calling `addToCart(buildCartItem(product))`). Drop the old `<CartIcon/> <span>Add to Cart</span>` markup.
8. **Results count + breadcrumb** already exist — keep them, reword only if they mention cart/buy (they don't). The breadcrumb is `Home › Products › <Category>` built from `selectedCategories`.
9. **Pagination / load‑more** already exists (numbered pager + per‑page select + post‑commit scroll‑to‑top). Keep it. If you prefer a "Load more" affordance on mobile, add it *in addition to* the pager, reusing `handlePageChange`; do not remove the numbered pager.
10. **Re‑skin, don't recolor by hand.** Point card/grid/pager styles at the `--sf-*` tokens so the Blue `#1885d8` / Gold `#fa9c4c` palette flows in from `storefront-tokens.css`. Do not hardcode the old `#667eea`.

## 5. UI/UX requirements

- **Brand tokens:** primary `#1885d8`, accent `#fa9c4c`. Featured/Trending badges = blue; **Special** badge = gold. CTA icon‑button uses blue with a gold hover accent.
- **Apple‑minimal:** generous white space, one clear price, restrained type scale, soft shadows, ~16px card radius, subtle 150–250ms transitions, reduced‑motion friendly.
- **Icons:** the card action is an **icon button + tooltip** only. Prefer `@iconify/react` (e.g. an `mdi:playlist-plus` / `mdi:clipboard-plus-outline` style glyph) for consistency with the rest of the app, or a crisp inline SVG. Keep the wishlist heart.
- **Dark mode:** honour the existing `isDarkMode` / `body.dark` path; badges and text must stay legible on dark.
- **Empty / error / skeleton states** already exist in `Products.js` — keep the skeleton grid, the retryable "Couldn't load products" error panel, and the "No products found" empty state (distinct from a load failure).

## 6. Data & API requirements

- **Dual‑mode rule (restate):** every data path keeps `IS_MOCK_API` branching and flows responses through `extractData()`, preserving JSON‑shape fidelity so the same UI works against JSON Server (`:3001`) and the Laravel API. Do not hardcode a shape that only works in mock.
- **Products source:** `apiService.products.getAll()` (line ~873) → array via `extractData`. Category deep‑links may use `apiService.products.getByCategory(categoryId)` (line ~920), but keep the `getAll()` + client‑side `getCategoryScopeIds` scoping as the canonical path.
- **Fields used by the card:** `id, name, slug, brand, images[], price, comparePrice, stock, rating, totalReviews, featured, trending, special` (+ pricing fields consumed by `PriceBlock` — see prompt 15: `priceType, unitType, minQty, priceTiers[], showExactPrice, showTieredPricing, cardPriceMode`).
- **Price:** compute display price with `getProductMinPrice(product)` and render through `PriceBlock`. Never fabricate a discount — it is derived from `comparePrice − price`.
- **Add‑to‑Enquiry:** funnels through `buildCartItem(product)` → `addToCart(...)` (from `useCart`). The underlying `cart` API namespace and localStorage key stay `"cart"` for sync fidelity (see prompt 16).

## 7. Admin panel requirements

N/A (storefront‑only). The `featured`, `trending`, and `special` flags are set on products by the admin product form (separate prompt); this prompt only reads them.

## 8. Storefront requirements

- Responsive grid (1/2/3/4 columns by breakpoint), soft rounded cards, brand palette.
- Card content order: media (with badges + wishlist) → brand → name → rating (conditional) → `PriceBlock` → **Add to Enquiry List** icon‑button + tooltip.
- No "Buy Now", no visible "Add to Cart"/"Add to Enquiry List" button text.
- Results count, breadcrumb, pagination, sort, filters all preserved.
- Slug‑based product links via `productPath`.

## 9. Acceptance criteria

- [ ] Product grid is responsive (1/2/3/4 columns) with soft, rounded, Apple‑minimal cards in the Blue `#1885d8` / Gold `#fa9c4c` palette; no `#667eea` remnants on the listing.
- [ ] Each card shows image, brand, name, conditional rating, and price via `PriceBlock`.
- [ ] **Featured / Special / Trending** badges render from `product.featured` / `product.special` / `product.trending`; Special is gold, the others blue; honest discount badge still works.
- [ ] The card's only action is an **Add to Enquiry List** icon‑button with a tooltip (`aria-label="Add to Enquiry List"`); clicking it adds the product to the Enquiry List via `buildCartItem` + `addToCart`.
- [ ] There is **no** "Buy Now" and **no** visible "Add to Cart"/"Add to Enquiry List" text on any card.
- [ ] Out‑of‑stock cards disable the icon‑button and its tooltip reads "Out of Stock".
- [ ] Selecting a **parent** category still returns its children's products (`getCategoryScopeIds`); results count reflects the scoped set.
- [ ] Product links go to `/products/:slug`; a legacy numeric id still resolves.
- [ ] Breadcrumb, results count, sort, filters, and pagination all still work.
- [ ] Data loads via `apiService.products.getAll()` / `getByCategory()` through `extractData()`; toggling `IS_MOCK_API` does not break the grid.

## 10. Testing / verification steps

1. `npm run dev` (CRA on :3000, JSON Server on :3001).
2. Open `http://localhost:3000/products`. Confirm the responsive grid, card layout, badges, and the icon‑only Add‑to‑Enquiry button with tooltip. Resize to verify 1/2/3/4 columns.
3. Hover the Add‑to‑Enquiry icon → tooltip "Add to Enquiry List". Click it → item lands in the Enquiry List (drawer/toast per prompt 16). Confirm **no** Buy Now / no button text.
4. Click a parent category (e.g. **Tiles**) in the filter → children's products appear; the results count matches; breadcrumb shows `Home › Products › Tiles`.
5. Click a card → navigates to `/products/<slug>`. Manually visit `/products/<numeric-id>` → resolves and canonical‑redirects.
6. Page through results; confirm per‑page select and scroll‑to‑top still work.
7. JSON Server check: `http://localhost:3001/products` returns the catalogue; confirm `featured/trending/special` fields drive the badges.
8. Toggle dark mode; confirm cards and badges stay legible.

## 11. Notes on preserving existing functionality

- **Dual‑mode API:** keep `IS_MOCK_API` branching + `extractData()`; never hardcode a mock‑only response shape.
- **Slug + category rules:** product URLs resolve by slug with legacy numeric fallback/redirect; category filtering keeps `getCategoryScopeIds` (parent‑includes‑children) and `orderCategoriesHierarchically`. Do not touch `src/utils/categories.js` behaviour.
- **`ProductCard` is shared** (related/recently‑viewed/bundles). Keep it domain‑agnostic and prop‑compatible; if you rename the add prop to `onAddToEnquiry`, update every caller (`RelatedProducts`, `FrequentlyBoughtTogether`, listing) or keep an `onAddToCart` alias so nothing breaks.
- **API/storage stability:** the enquiry add still calls `addToCart`; the underlying `cart` API namespace and the `"cart"` localStorage key are intentionally unchanged for server‑sync fidelity (see prompt 16).
- **CSS Modules per component** — keep the `*.module.css` convention; storefront and admin palettes stay separate.
- **Keep** the skeleton, retryable error panel, empty state, wishlist heart, results count, breadcrumb, sort, and pagination. This is a redesign + terminology pivot — reuse and refactor, do not rewrite the filter engine.
- Do not introduce any payment/coupon/shipping/wallet UI or side effects.
