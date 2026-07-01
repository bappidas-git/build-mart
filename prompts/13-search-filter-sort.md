# 13 — Search, Filter & Sort

## 1. Objective

Adapt the storefront's search, filter, and sort experience for **North East Build Mart (NEBM)** across the product listing (`src/pages/Products/Products.js`) and the global `src/components/SearchModal/SearchModal.js`, using the NEBM category tree and the enquiry pricing model. Keep the canonical `?category=<slug>` URL scheme (with legacy numeric‑id resolution), keep parent‑includes‑children scoping, and make the **price filter** tolerant of the new pricing model — including products priced **onEnquiry** (which have no numeric price to range‑filter on). This is a data + terminology adaptation of an already‑strong engine, **not** a rewrite.

## 2. Context / background

NEBM is an enquiry platform selling building materials. Customers search/filter/sort to find products, then **enquire** — never buy. Relevant facts:

- **Primary Blue:** `#1885d8`; **Accent Gold/Orange:** `#fa9c4c`. Apple‑minimal, mobile‑first.
- **NEBM category tree (top‑level):** WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products · **Tiles** (Floor/Wall/Vitrified/Bathroom & Kitchen/Outdoor) · **Doors** (Steel/PVC/WPC/Designer/Bathroom) · **Hardware** (Door Locks/Handles & Hinges/Fasteners/Cabinet Fittings/Construction Hardware) · **Plumbing** (PVC/CPVC/SWR Pipes/Water Tanks/Pipe Fittings & Accessories) · **Bath Fittings** (Showers/Faucets & Taps/Wash Basins/Sanitary Ware/Bathroom Accessories) · **Cement** (OPC/PPC/Premium Construction) · **Steel Rods** (TMT Bars/Construction Steel/High‑Strength Reinforcement Bars) · **Special Products** (badged curated collection via a `special` flag — not an exclusive category).
- **Pricing model:** each product has `priceType: "exact" | "tiered" | "onEnquiry"`, plus `unitType`, `minQty`, `priceTiers[{minQty,price}]`, and display flags `showExactPrice`, `showTieredPricing`, `cardPriceMode`. **onEnquiry** products show "Price on Enquiry" and have no fixed number to range‑filter (see prompt 15).

**URL scheme (must preserve):** canonical category deep‑link is `/products?category=<slug>` (comma‑separated for multiple), legacy numeric id still resolves and is rewritten to slug in place. Search deep‑link is `/products?search=<term>`; sort is `?sort=<value>`.

Related prompts: 12 (listing/card redesign), 15 (pricing display). See `prompts/00-analysis-and-requirement-map.md` §4 (tree) and §5 (mapping).

## 3. Files & folders to inspect

- `src/pages/Products/Products.js` — search input handling, filter sidebar/sheet, sort, URL sync (`syncUrlParams`, `resolveCategory`, `getCategoryScopeIds`, `orderCategoriesHierarchically`). The `categoryParam` / `resolveCategory` calls and `urlCategory`/`urlSearch`/`urlSort` reads live here.
- `src/components/SearchModal/SearchModal.js` — global search (Header + BottomNav), category chips from the live tree (`buildCategoryNav`), relevance scoring, recent/trending searches.
- `src/components/SearchModal/SearchModal.module.css` — modal styles.
- `src/utils/categories.js` — `categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories` (do not change behaviour).
- `src/utils/helpers.js` — `getProductMinPrice`, `formatCurrency`, `productPath`.
- `src/services/api.js` — `products.search` (line ~931), `products.getAll` (line ~873), `products.getByCategory` (line ~920), `extractData()`.

## 4. Step-by-step implementation instructions

1. **Preserve the URL contract.** In `Products.js`, `?category=<slug>` (canonical), `?search=`, `?sort=`, `?page=`, `?per_page=`, `?min_price=`, `?max_price=` all stay. The effect that normalizes each category token to its canonical slug via `resolveCategory(token, categories)` and rewrites a legacy `?category=3` to its slug form must remain. Do not change `categoryParam`/`resolveCategory` semantics.
2. **Category filter → NEBM tree.** The filter list is built from `orderCategoriesHierarchically(categories)` (parents then indented children) with per‑category counts computed via `getCategoryScopeIds`. This already yields the NEBM tree once the categories collection is reseeded; keep it. Selecting a **parent** (e.g. **Plumbing**) must include its children (PVC/CPVC/SWR Pipes, Water Tanks, Pipe Fittings). Selecting **Special Products** is handled as a `special`‑flag facet, **not** as a category scope (add a "Special Products" toggle/facet that filters `product.special === true`).
3. **Search bar + `SearchModal`.** Keep the global modal (Header + `BottomNav`). Update `TRENDING_SEARCHES` away from the old generic terms (Laptop/Saree/…) to NEBM‑relevant seeds, e.g. `["WPC Louvers", "Polycarbonate Sheet", "FRP Sheet", "TMT Bars", "CPVC Pipe", "Door Lock", "Vitrified Tiles", "Waterproofing"]`. The category chips already derive at runtime from the live tree via `buildCategoryNav` (one chip per active top‑level category, matching that category's slug + all descendant slugs) — leave that mechanism intact so it auto‑reflects the reseeded tree.
4. **Search still funnels to the listing.** `SearchModal` navigates to `/products?search=<term>` on submit, and `Products.js` filters client‑side on `name / shortDescription / brand / category / tags`. Keep both. The mock `apiService.products.search(query)` (line ~931) uses `params: { q }`; the listing's own client filter is the primary path and must keep working.
5. **Price filter — adapt to the pricing model.** Today the price filter uses `getProductMinPrice(p).sellingPrice`. Update the price predicate so:
   - **exact** and **tiered** products are ranged on a representative numeric price: exact → `price`; tiered → the lowest tier price (`Math.min(...priceTiers.map(t => t.price))`, falling back to `getProductMinPrice`). 
   - **onEnquiry** products have **no** price → they must be **excluded when a min/max price bound is active**, and **included** when no price bound is set. Never coerce an onEnquiry product to `0` (that would wrongly match "Under ₹500").
   - Reword the quick price ranges to sensible building‑material bands (they can stay generic ₹ ranges; the key requirement is honest handling of onEnquiry). Keep the min/max inputs + "Go" apply + swap‑if‑inverted sanitization.
   - Add an **"Include Price‑on‑Enquiry items"** consideration: when a price range is applied, optionally surface a subtle note that onEnquiry items are hidden by the price filter (Apple‑minimal, one line).
6. **Attribute / brand filters.** Keep the brand facet (derived from `product.brand` across the loaded set). If products carry structured attributes/tags relevant to building materials (e.g. `unitType`, size, finish via `tags[]`), expose a lightweight tag/attribute facet that filters `product.tags` — reuse the existing brand‑style checkbox group. Do not invent attributes not present in the data.
7. **Sort — price where applicable.** Keep `SORT_OPTIONS` (Relevance, Price low→high, Price high→low, Newest, Rating, Popularity) and the `SORT_ALIASES` deep‑link map. For **price sorts**, sort onEnquiry products to the **end** in both directions (they have no comparable price), so a price sort never claims a fake ordering for them. Newest sorts on `createdAt`.
8. **Terminology.** Ensure no cart/buy/checkout wording leaks into search/filter copy. "Add to Enquiry List" is the only product action (handled by the card, prompt 12). Empty/no‑results copy stays enquiry‑neutral ("No products found…").
9. **Re‑skin** filter chips, sort select, active‑filter pills, and the mobile filter sheet to the Blue/Gold tokens via `--sf-*` (active chip = blue, selected/highlight accents = gold). Keep the mobile bottom‑sheet, focus management, and Escape handling.

## 5. UI/UX requirements

- **Brand tokens:** `#1885d8` (active chips, selected filters, focus ring), `#fa9c4c` (accent highlights, applied‑filter emphasis). Apple‑minimal, mobile‑first.
- Category filter renders the NEBM tree with indented sub‑categories (`orderCategoriesHierarchically`) and per‑category counts.
- Price filter clearly communicates that **Price‑on‑Enquiry** items are excluded when a price bound is active (one subtle line, no nagging).
- Sort control and the mobile filter sheet keep their current accessible behaviour (focus trap, Escape to close, body‑scroll lock).
- `SearchModal` keeps recent/trending chips, debounced search (`DEBOUNCE_MS = 300`), relevance scoring, and the results grid; only the seed terms and palette change.

## 6. Data & API requirements

- **Dual‑mode rule (restate):** all data flows through `IS_MOCK_API` branching + `extractData()` with JSON‑shape fidelity, so the same UI works against JSON Server (`:3001`) and Laravel. Do not hardcode a mock‑only shape.
- **APIs:** `apiService.products.getAll()` (line ~873) for the catalogue; `apiService.products.search(query)` (line ~931) for the search namespace; `apiService.categories.getAll()` for the tree; `getByCategory` (line ~920) available for category deep‑links. `SearchModal` uses a module‑level cache (`loadSearchData`) that fetches products + categories once.
- **Fields:** `name, shortDescription, brand, tags[], categoryId, createdAt, rating, totalReviews` for search/sort; `priceType, price, priceTiers[], unitType, special` for the price/special facets.
- **Category resolution:** `resolveCategory(token, categories)` maps a slug or legacy id to a category; `getCategoryScopeIds(id, categories)` yields the parent‑includes‑children id set. Keep both.

## 7. Admin panel requirements

N/A. Categories, `special`, and pricing fields are authored in the admin (separate prompts); this prompt only reads them.

## 8. Storefront requirements

- Canonical `?category=<slug>` deep‑links, legacy numeric ids resolve and rewrite to slug.
- Parent‑includes‑children scoping for every category selection.
- Price filter honestly excludes onEnquiry items when a bound is active; includes them otherwise.
- Price sorts push onEnquiry items to the end.
- Search modal chips/trending reflect the NEBM tree/domain.
- No cart/buy/checkout wording anywhere in search/filter/sort.

## 9. Acceptance criteria

- [ ] `/products?category=<slug>` filters correctly; a parent slug (e.g. `tiles`) returns children's products; a legacy `?category=<id>` resolves and is rewritten to the slug form in the URL.
- [ ] The category filter list shows the NEBM tree with indented sub‑categories and correct counts.
- [ ] A **Special Products** facet filters `product.special === true` (not treated as a category scope).
- [ ] Price filter: exact/tiered products range on a representative numeric price; **onEnquiry** products are excluded when a min/max bound is active and included when none is set — never matched as `₹0`.
- [ ] Price sorts (low→high / high→low) order exact/tiered products correctly and place onEnquiry products at the end.
- [ ] `SearchModal` trending seeds and chips are NEBM‑relevant and derive from the live category tree; searching navigates to `/products?search=<term>` and returns matching products.
- [ ] Brand (and any real tag/attribute) facet works; clearing filters resets state + URL.
- [ ] No cart/buy/checkout terminology appears in any search/filter/sort copy.
- [ ] All data flows through `IS_MOCK_API` + `extractData()`; toggling mock does not break search/filter/sort.

## 10. Testing / verification steps

1. `npm run dev`.
2. Open the search modal (Header search / BottomNav). Confirm NEBM trending seeds and category chips; type "WPC" → WPC Louvers products appear; submit → lands on `/products?search=WPC`.
3. On `/products`, select **Doors** (parent) → Steel/PVC/WPC/Designer/Bathroom Doors products appear; check the count. Deep‑link `/products?category=doors` reproduces it.
4. Visit `/products?category=<numeric-id-of-Doors>` → resolves and the URL rewrites to `?category=doors`.
5. Apply a price range (e.g. Under ₹500) → confirm an **onEnquiry** product is hidden while a bounded range is active, and reappears when the range is cleared. Confirm the subtle "onEnquiry hidden" note shows only while bounded.
6. Sort by Price: low→high and high→low → exact/tiered ordered correctly; onEnquiry items sit at the end.
7. Toggle the **Special Products** facet → only `special` products remain.
8. JSON Server checks: `http://localhost:3001/products?categoryId=<id>` and `http://localhost:3001/categories` reflect the tree; confirm `priceType`/`special` fields exist.
9. Clear all filters → state and URL reset.

## 11. Notes on preserving existing functionality

- **Do not change** `src/utils/categories.js` behaviour: `categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories` must keep working; only the seed data changes elsewhere.
- **URL scheme:** canonical `?category=<slug>` + legacy numeric resolve/rewrite; `?search=`, `?sort=` (+ aliases), `?page=`, `?per_page=`, `?min_price=`, `?max_price=` all preserved. The URL stays the source of truth for URL‑backed filters.
- **Dual‑mode API:** keep `IS_MOCK_API` + `extractData()`; `products.search` uses `q` in mock, `search` in prod — leave both.
- **`SearchModal`** module‑level cache, debounce, relevance scoring, recent/trending, focus/scroll‑lock, and the runtime‑derived category chips (`buildCategoryNav`) stay intact — only seeds + palette change.
- **Parent‑includes‑children** scoping and per‑category counts must not regress.
- **No** payment/coupon/shipping/wallet UI or wording; no "Buy Now"/"Add to Cart" text.
- CSS Modules per component; storefront vs admin palette separation; reuse/refactor rather than rewrite.
