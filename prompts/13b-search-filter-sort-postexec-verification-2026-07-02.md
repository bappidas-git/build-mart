# 13b — Search, Filter & Sort Post-execution Verification (2026-07-02)

> **Prompt-13 execution deliverable — NEBM's search / filter / sort is now enquiry-correct and tolerant of the pricing model, as a *data + terminology adaptation* of the already-strong engine (not a rewrite).** The listing's price filter and price sorts now key off `priceType` through one representative-price helper (`exact → price`, `tiered → lowest tier price`, `onEnquiry → null`): **onEnquiry products are excluded when a price bound is active and included when none is set — never coerced to ₹0** — and both price sorts push onEnquiry to the **end** in either direction. A new additive **"Special Products"** facet filters `special === true` (a badge, not a category scope); a lightweight **"Unit Type"** attribute facet (piece/sheet/kg/bag/box) reuses the brand-style checkbox group; a subtle one-line note tells the shopper that Price-on-Enquiry items drop out while a range is applied; the quick price ranges are reworded to building-material bands; `SearchModal`'s trending seeds become NEBM terms (its category chips already derive from the live tree); and the stray legacy-orange price-input focus ring is fixed to the blue `--sf-shadow-focus` token. Bottom line: **every §9 acceptance criterion passes, verified two ways — a clean `CI=true react-scripts build` (Compiled successfully; JS +196 B → 384.24 kB, CSS −149 B → 45.48 kB gzip) and a live Chromium runtime probe** (legacy `?category=6` → rewritten `?category=doors` with the Doors parent returning all 10 children's products; a ₹2,000–₹10,000 bound → 11 products with all 4 onEnquiry "trap" items hidden + the note shown, then unbounded → 70 with onEnquiry back + note gone; price-low page-1 of 48 has **0** onEnquiry and is strictly ascending while page-2's last 10 are **all** onEnquiry; price-high page-1 has 0 onEnquiry, descending from ₹12,900; the Special facet → 10 items all `special===true` carrying 10 gold badges; the Unit-Type "Bag" facet → 7 items all `unitType==='bag'`; Clear-All → 70 with no checkbox left checked; the additive rule holds — `/products?category=wpc-louvers` still lists the special "WPC Louver Panel 3D Charcoal" with its gold badge; the search modal shows the 8 NEBM trending seeds + a live-tree chip row, and a "WPC" search → 5 results → submit → `/products?search=WPC`; **zero** cart/buy/checkout wording in any search/filter/sort surface; console error-free).**

> **Three-file, storefront-only change.** The diff touches exactly `pages/Products/Products.js` (+182/−11), `components/SearchModal/SearchModal.js` (+11/−8) and `pages/Products/Products.module.css` (+11/−1) — **net +204 / −20 across 3 files**. No routes, providers, `db.json`, `utils/*`, `services/api.js` or admin files are in the diff. Commit `8a1db60`.

> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-13 is **reuse + adapt**: the URL contract, the category engine (`categoryParam`/`resolveCategory`/`getCategoryScopeIds`/`orderCategoriesHierarchically`), the parent-includes-children scoping, the dual-mode `getAll`/`search` + `extractData`, and `SearchModal`'s cache/debounce/relevance/recent/trending/`buildCategoryNav` are all **kept** — only the price predicate, the price comparators, two new facets, one note, the seed terms and the palette-token fix change. `utils/categories.js` is left byte-identical.

---

## 1. Method — adapt the price/sort/facets, keep the engine, verify two ways

Prompt-13 has four moving parts, all layered onto an existing, working engine: (a) make the **price filter** honest under the new pricing model (represent exact/tiered numerically, exclude onEnquiry when bounded); (b) make **price sorts** never claim a fake ordering for onEnquiry; (c) add the **Special** and **Unit-Type** facets; (d) re-seed **SearchModal** trending terms + fix a stray non-brand colour. Everything else is preserved. Verification is two independent passes over the **written** files: (a) `CI=true react-scripts build` → *Compiled successfully* (warnings-as-errors, so it also proves no orphaned imports/vars survived the edits); (b) a live runtime probe in the preview Chromium reading the DOM + cross-checking the rendered order/counts against a fresh `db.json` fetch — deep-links, the onEnquiry price rule (both directions), the two facets, Clear-All, the additive-listing rule, the search-modal seeds/chips/navigation, a forbidden-wording sweep, and a console-error sweep.

The single most important correctness point, confirmed from the seed: **onEnquiry products still carry a real numeric `price`** (e.g. *Fosroc Brushbond* `price: 4200`, *Full Body Vitrified Tile* `1650`). The old predicate ranged on `getProductMinPrice(p).sellingPrice`, so those would have **wrongly matched** a bounded range. Keying the new predicate off `priceType === "onEnquiry"` (→ `null`, excluded while bounded) is exactly what makes the range honest.

---

## 2. What changed — reproduced at source

| File | Change | ✓ |
|---|---|---|
| **`Products.js`** (helpers) | New module-scope `getFilterPrice(product)`: `onEnquiry → null`; `tiered → Math.min(priceTiers[].price)`; else the product's own `price`, falling back to `getProductMinPrice` for legacy/variant items (`>0` guard, never 0). New `priceComparator(dir)`: nulls (onEnquiry) sort to the **end** in both `"asc"` and `"desc"`. | ✅ |
| **`Products.js`** (price filter) | The two separate min/max filters replaced by one pass: when `hasMin || hasMax`, `getFilterPrice(p) == null` (onEnquiry/unpriceable) → **excluded**; otherwise ranged on the representative number. No bound → nothing excluded. | ✅ |
| **`Products.js`** (sorts) | `price-low` → `result.sort(priceComparator("asc"))`, `price-high` → `priceComparator("desc")`. Newest/rating/popularity unchanged. | ✅ |
| **`Products.js`** (Special facet) | New `specialOnly` state + `handleSpecialToggle` (session-only → `resetToFirstPage`) + `hasSpecialItems` guard; filter `p.special === true`. Rendered as a "Collections → Special Products" `role="switch"` toggle (blue-on), only when the catalogue has special items. | ✅ |
| **`Products.js`** (Unit-Type facet) | New `selectedUnitTypes` state + `handleUnitTypeToggle` + `availableUnitTypes` memo (distinct `unitType`, frequency-ordered) + `unitTypeLabel` map. Rendered as a brand-style checkbox group ("Unit Type"), only when present. | ✅ |
| **`Products.js`** (onEnquiry note) | `priceBoundActive = minPrice !== "" \|\| maxPrice !== ""`; when `priceBoundActive && hasOnEnquiryItems`, a subtle one-line `.priceNote` under the quick-ranges: *"Price-on-Enquiry items are hidden while a price range is applied."* | ✅ |
| **`Products.js`** (wiring) | `hasActiveFilters` + `clearAllFilters` extended with `specialOnly`/`selectedUnitTypes`; `filteredProducts` deps updated. `PRICE_RANGES` reworded to building-material bands (Under ₹500 / ₹500–₹2,000 / ₹2,000–₹10,000 / Above ₹10,000). | ✅ |
| **`SearchModal.js`** | `TRENDING_SEARCHES` → `["WPC Louvers","Polycarbonate Sheet","FRP Sheet","TMT Bars","CPVC Pipe","Door Lock","Vitrified Tiles","Waterproofing"]`. Cache/debounce/relevance/recent/`buildCategoryNav` chips untouched. | ✅ |
| **`Products.module.css`** | New `.priceNote` (12px, muted, subtle). `.priceInput:focus` box-shadow changed from the stray legacy-orange `rgba(255,153,0,.2)` to `var(--sf-shadow-focus)` (blue `rgba(24,133,216,.45)`). | ✅ |

---

## 3. Prompt-13 §9 acceptance — verified against the written files + live runtime

Every §9 bullet, with how it was checked (all **PASS**):

- **`/products?category=<slug>` filters; a parent slug returns children's products; a legacy `?category=<id>` resolves and rewrites to the slug** — runtime: `?category=6` (Doors' numeric id) rewrote to `?category=doors` and rendered **10** products (all Steel/PVC/WPC/Designer/Bathroom door children); the "Doors(10)" checkbox is checked. Parent-includes-children holds.
- **Category filter shows the NEBM tree with indented sub-categories + correct counts** — unchanged `orderCategoriesHierarchically` + `getCategoryScopeIds` counts (kept); the Doors parent count `10` matches the rendered set.
- **A Special Products facet filters `special === true` (not a category scope)** — runtime: toggling it → **10** products, all `special===true`, each showing the gold "Special" badge; `aria-checked="true"`. It's a `p.special` filter, never a `categoryId` scope.
- **Price filter: exact/tiered ranged on a representative number; onEnquiry excluded when bounded, included when not — never `₹0`** — runtime: bound ₹2,000–₹10,000 → **11** products; the 4 onEnquiry items whose *raw* price falls in-band (*Fosroc Brushbond* 4200, *Frosted Glass Aluminium Bathroom Door*, *Modular Kitchen Pull-Out Basket*, *One-Piece Water Closet*) are **hidden**; clearing the bound → **70** with *Fosroc Brushbond* visible again.
- **Price sorts order exact/tiered correctly and place onEnquiry at the end** — runtime: `price-low` page-1 (48) has **0** onEnquiry and is strictly ascending (₹53 → ₹2,112), page-2's **last 10** are all onEnquiry; `price-high` page-1 has **0** onEnquiry, descending from ₹12,900.
- **`SearchModal` trending seeds + chips are NEBM-relevant and derive from the live tree; searching navigates to `/products?search=<term>`** — runtime: trending = the 8 NEBM seeds; chips = `All` + the 12 live top-level categories; "WPC" → **5** results → *View all results* → `/products?search=WPC` with 5 cards.
- **Brand (and any real tag/attribute) facet works; clearing filters resets state + URL** — runtime: Unit-Type "Bag" → **7** products all `unitType==='bag'`; Clear-All → **70**, no checkbox checked, Special toggle `aria-checked="false"`, URL back to base.
- **No cart/buy/checkout terminology in any search/filter/sort copy** — runtime sweep of the sidebar + sort bar + search modal: `add to cart / buy now / checkout / coupon / wallet / shipping` → **none**. (The only "Free Shipping" on the page is a **Footer** trust badge + a CartDrawer CSS comment — outside search/filter/sort; see §5.4.)
- **All data flows through `IS_MOCK_API` + `extractData()`; toggling mock doesn't break it** — `getAll`/`search`/`categories.getAll` unchanged; the listing's client filter is the primary path and drove every runtime result above.

**Bonus runtime checks (§10):** the note computes a subtle muted grey `rgb(107,114,128)`; `--sf-color-primary` resolves to `#1885d8`; the 5 listing cards each expose an icon-only `aria-label="Add to Enquiry List"` button (card action, prompt 12); console error-free across homepage → `/products` (deep-links, sorts, facets) → search modal.

---

## 4. §11 KEEP-invariants — all intact

- **`utils/categories.js` untouched** — not in the diff; `categoryParam`/`resolveCategory`/`getDescendantIds`/`getCategoryScopeIds`/`orderCategoriesHierarchically`/`getMainMenuCategories` unchanged.
- **URL scheme** — `?category=<slug>` canonical + legacy numeric resolve/rewrite (runtime-confirmed), `?search=`, `?sort=` (+ `SORT_ALIASES`), `?page=`, `?per_page=`, `?min_price=`, `?max_price=` all preserved; URL stays the source of truth for URL-backed filters (Special/Unit-Type are session-only, mirroring the existing rating/discount/stock/brand facets).
- **Dual-mode API + `extractData()`** — `products.getAll`/`products.search` (`q` in mock, `search` in prod) untouched; no `db.json` writes.
- **`SearchModal`** — module-level cache, `DEBOUNCE_MS=300`, relevance scoring, recent/trending, focus/scroll-lock, and the runtime-derived `buildCategoryNav` chips all intact; only the static seeds changed.
- **Parent-includes-children + per-category counts** — unchanged and runtime-confirmed (Doors → 10).
- **Special is a badge, not a category** — the facet filters `special===true` and never removes special items from normal listings (additive-listing check confirmed live).
- **Enquiry-correct language + palette** — no cart/buy/checkout copy in search/filter/sort; blue `#1885d8` active chips/toggles/focus, gold `#fa9c4c` accents via `--sf-*`; per-component CSS Modules; storefront/admin palette separation.

---

## 5. Findings — no defects; one sanctioned decision + carry-forwards

### 5.1 — DECISION (spec §4.6/§6): the attribute facet filters the real `unitType` field, not raw `product.tags`
§6 offers "a lightweight tag/attribute facet … (e.g. `unitType`, size, finish via `tags[]`)" and forbids inventing attributes. The seed's raw `tags[]` is **274 distinct tokens** dominated by brand names and category slugs — a checkbox group over that is neither *lightweight* nor honest. `unitType` is a **real, structured, bounded** building-material attribute (5 values: piece/sheet/kg/bag/box) and is the first example §6 names. So the facet filters `product.unitType` (reusing the brand-style checkbox group), satisfying AC §9 "Brand (and any real tag/attribute) facet works." Sanctioned interpretation, documented — not a defect.

### 5.2 — CARRY-FORWARD (prompt 15): the Discount facet is left intact
The pre-existing "Discount" filter (10/20/30/50%+, computed from `comparePrice` vs `price`) is untouched — 36 seed products still carry a `comparePrice`. Whether the curated/enquiry framing should retire discount/urgency entirely is **prompt 15's** pricing-display model (`showExactPrice`/`cardPriceMode`) and the admin-cleanup prompts' call; §4 does not ask prompt 13 to remove it, so it was left to avoid scope creep. Not a Prompt-13 concern.

### 5.3 — OBSERVATION (pre-existing, out of scope): a cold-load deep-link to `?page=2` clamps to page 1
Navigating a fresh load straight to `?page=2` lands on page 1: the page-clamp effect runs while `allProducts` is still empty (`totalPages` momentarily 1), resets `currentPage`→1, and drops the param before the data arrives. This is in the **pagination** code, which Prompt-13 did not touch. In-app pager navigation works correctly — the price-sort page-2 tail check (§3) was done by clicking *Next* after data loaded. Pre-existing; belongs to whoever owns pagination hardening, not this prompt.

### 5.4 — CARRY-FORWARD (prompt 24 / prompts 16·30): "Free Shipping" wording lives in the Footer + a CartDrawer CSS comment
The only shipping/cart wording anywhere on the listing route is a **Footer** trust badge ("Free Shipping*") and a CSS **comment** inside the injected CartDrawer stylesheet — both **outside** the search/filter/sort UI (`inFilterArea: false`). AC §8 ("no cart/buy/checkout wording in search/filter/sort copy") holds. Retiring the Footer trust badge is **prompt 24**; removing the CartDrawer is **prompts 16/30**. Documented, not a Prompt-13 defect.

### 5.5 — OBSERVATION (seed/tree shape, prompt 6): "Special Products" also appears as a top-level chip in `SearchModal`
`buildCategoryNav` derives its chips from the live top-level categories, and the seeded tree includes a "Special Products" category node — so it renders as a chip. §3 explicitly says to **leave `buildCategoryNav` intact**, and the `/products` *filter* correctly treats Special as a `special`-flag facet (§4.2), so this is a seed/tree-shape artifact owned by prompt 6, not a Prompt-13 change. The chip simply filters by that category's slug/descendants like any other.

---

## 6. What this closes

`13b` closes NEBM's **search / filter / sort** surface: the listing's price filter and price sorts are honest under the `exact`/`tiered`/`onEnquiry` pricing model (onEnquiry never faked as ₹0 and never mis-ordered), the Special-Products flag is a real additive facet, a lightweight Unit-Type attribute facet is exposed, and the global search modal speaks NEBM's domain while still deriving its category chips from the live tree — all with the URL contract, the category engine, dual-mode data flow and enquiry-correct language preserved. Prompt 14 (product details), prompt 15 (pricing display — the `priceType` display model the facets already respect) and prompt 24 (footer, retiring the "Free Shipping" badge) build directly on this.

---

*Post-execution verification against the live repo (2026-07-02), commit `8a1db60`. Build: `CI=true react-scripts build` → Compiled successfully (JS +196 B → 384.24 kB, CSS −149 B → 45.48 kB gzip). Diff: +204 / −20 across `Products.js`, `SearchModal.js`, `Products.module.css`; `utils/categories.js`, `services/api.js`, `db.json` and admin files untouched. Runtime probe (preview Chromium, JSON Server on :3001): legacy `?category=6` → `?category=doors` (10 children); bound ₹2,000–₹10,000 → 11 products, 4 onEnquiry traps hidden + note shown, unbounded → 70 + note gone; price-low page-1 (48) 0 onEnquiry & ascending, page-2 last-10 all onEnquiry; price-high page-1 0 onEnquiry & descending; Special → 10 badged; Unit-Type "Bag" → 7; Clear-All → 70 reset; additive `/products?category=wpc-louvers` lists the special WPC louver with badge; SearchModal 8 NEBM trending seeds + live-tree chips + "WPC" → 5 → `/products?search=WPC`; no cart/buy/checkout wording in search/filter/sort; console error-free.*
