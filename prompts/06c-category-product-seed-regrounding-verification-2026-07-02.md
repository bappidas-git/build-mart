# 06c — Prompt-06 Category Tree & Product Seed Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over `06b`.** An independent, source-verified re-derivation of every material claim in `prompts/06b-category-product-seed-postexec-verification-2026-07-02.md`, run against the **live** `db.json` and the **unmodified** `src/utils/categories.js` at the current tree — not by trusting `06b`'s harness output, but by re-executing the checks from scratch. **No application code, `db.json`, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **every substantive `06b` assertion reproduces exactly** — 43-node NEBM category tree, 70-product NEBM catalogue, full coverage/pricing/flag/reference integrity, the real `categories.js` helper contract, the mock query-key simulation, and the single-collection git-diff footprint. **One wording imprecision** in `06b` is recorded in §5 — the data it describes is correct; only the adjective "ascending" understates it.
>
> **Companion, not a rewrite.** Following the `00b` precedent (`00b` is the re-grounding companion to `00`/`00b`), this note verifies `06b` alongside it rather than editing the committed `06b` text. The correction in §5 is documented here for a future editor; `06b` is left byte-identical.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. This pass touched nothing — it only re-reads and re-asserts.

---

## 1. Method — re-execute, don't trust

`06b` claims "39/39 acceptance assertions pass." Rather than accept that, this pass re-derived the claims directly:

1. **Data assertions** — a fresh Node pass over the *written* `db.json` (`require("./db.json")`) re-counting categories, subcategories, products, coverage, pricing modes, display flags, and cross-collection references.
2. **Helper contract** — a Node ESM harness that **imports the real, unmodified `src/utils/categories.js`** (via its absolute `file://` URL — no copy, no re-implementation) and exercises `getMainMenuCategories`, `getCategoryScopeIds`, `resolveCategory`, `categoryParam`, `orderCategoriesHierarchically` against the live `categories` array.
3. **Mock query-key simulation** — exact-match filters over the written products modelling the JSON-Server branches (`?featured`, `?trending`, `?special`, `?categoryId`, `?slug`).
4. **Diff footprint** — `git show 0adb740` (the Prompt-06 reseed commit) compared collection-by-collection against its parent to confirm the blast radius.

Every result below is the actual output of those runs, not a restatement of `06b`.

---

## 2. Category tree — reproduces exactly (§2, §9.1–§9.5)

| Check | `06b` claim | Re-grounded result | ✓ |
|---|---|---|---|
| Total nodes | 43 | 43 | ✅ |
| Top-level count | 12 | 12 (ids `1..12`) | ✅ |
| Subcategory count | 31 | 31 | ✅ |
| Top order (`menuOrder`) | 1..12, spec order | `1..12` → WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing Products, Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods, Special Products | ✅ |
| Tops `showInMainMenu:true` | all | all true | ✅ |
| Subs `showInMainMenu:false` | all | all false | ✅ |
| `isActive` | all | all `!== false` | ✅ |
| Slugs unique | yes | 43/43 unique | ✅ |
| Subs `parentId` valid (no orphan) | yes | 31/31 point at a real top ∈ {1..12} | ✅ |

---

## 3. Product catalogue — reproduces exactly (§2–§3, §9.6–§9.8)

| Check | `06b` claim | Re-grounded result | ✓ |
|---|---|---|---|
| Product count | 70 | 70 | ✅ |
| Ids contiguous `1..70`, unique | yes | yes / yes | ✅ |
| Slugs unique | 70/70 | 70/70 | ✅ |
| Target categories (4 flat top + 31 leaf) | 35 | 35 | ✅ |
| Coverage ≥2 per target | 35/35 | 35/35 (none under 2) | ✅ |
| Products on 7 parent tops | 0 | 0 | ✅ |
| Products on Special Products (id 12) | 0 | 0 | ✅ |
| Orphan `categoryId` | 0 | 0 | ✅ |
| priceType breakdown | tiered 32 / exact 28 / onEnquiry 10 | tiered 32 / exact 28 / onEnquiry 10 | ✅ |
| `featured` | 10 | 10 | ✅ |
| `special` (distinct top-levels) | 10 across 10 | 10 across **10 distinct** tops | ✅ |
| `trending` | 8 | 8 | ✅ |
| Unit types | piece·sheet·box·bag·kg | piece, sheet, box, bag, kg | ✅ |

**Pricing-flag correctness (re-checked per mode):**
- **tiered (32):** `showTieredPricing:true` ∧ `cardPriceMode:"from"` — all true; `priceTiers` non-empty — all true; tier-1 `price === product.price` — all true. *(Ordering: see §5.)*
- **exact (28):** `showExactPrice:true` ∧ `cardPriceMode:"exact"` ∧ `priceTiers:[]` — all true.
- **onEnquiry (10):** `cardPriceMode:"onEnquiry"` ∧ numeric `price` ∧ `priceTiers:[]` — all true.

**Helper-read safety (§11):** every product carries numeric `price > 0`, `comparePrice` (number or `null`), non-empty `images[]`, a present `variants: []`, and a unique `slug` — so `getProductMinPrice`/`buildCartItem` never `NaN` and every card deep-links.

---

## 4. Live-helper contract & query-key fidelity — reproduces exactly (§3–§4)

**Real `src/utils/categories.js` (imported, not copied):**

| Call | `06b` claim | Re-grounded result | ✓ |
|---|---|---|---|
| `getMainMenuCategories(categories)` | 12 tops in menu order | 12, `menuOrder` 1..12, all top-level | ✅ |
| `getCategoryScopeIds(5)` | `{5,13,14,15,16,17}` | `{5,13,14,15,16,17}` | ✅ |
| `resolveCategory('floor-tiles')` | → 13 | id 13 | ✅ |
| `resolveCategory('5')` (legacy) | → tiles | slug `tiles` | ✅ |
| `categoryParam(Tiles)` | `'tiles'` | `tiles` | ✅ |
| `orderCategoriesHierarchically(categories)` | all 43 | 43 (== total) | ✅ |

**Mock query-key simulation over the written file:**

| Filter | `06b` claim | Re-grounded result | ✓ |
|---|---|---|---|
| `?featured=true` | 10 | 10 | ✅ |
| `?trending=true` | 8 | 8 | ✅ |
| `?special=true` | 10 | 10 | ✅ |
| `?categoryId=13` (Floor Tiles) | 2 | 2 | ✅ |
| `?categoryId=1` (WPC Louvers, flat top) | 2 | 2 | ✅ |
| `?slug=glazed-vitrified-floor-tile-600x600` | 1 | 1 | ✅ |

**Cross-collection references (§4) — all resolve against the contiguous `1..70` id space:**

| Referring collection | Referenced product ids | Resolution |
|---|---|---|
| `reviews[].productId` | {1, 2, 4, 5} | all valid ✅ |
| `wishlist[].productId` | {1, 3, 7} | all valid ✅ |
| `enquiries[].items[].productId` | {1, 2, 3, 5, 6, 9} | all valid ✅ |
| `products[].relatedProductIds` | same-family ids | 100% resolve ✅ |

---

## 5. Findings — one wording imprecision, data is correct

### 5.1 — WORDING DRIFT (in `06b` §9.7 / line 28): "ascending `priceTiers`" understates the bulk-discount model

`06b` describes tiered products as having "ascending `priceTiers`". Re-grounded against the data, this is ambiguous and — read as ascending *price* — inaccurate. The real ordering is:

```
#1 wpc-louver-panel-3d-charcoal (price 340):
   [{minQty:1, price:340}, {minQty:5, price:320}, {minQty:20, price:299}]
```

Across all 32 tiered products:
- **`minQty` is ascending** — 32/32 (tiers listed smallest-quantity first).
- **unit `price` is *descending*** — 32/32 (a proper **bulk discount**: buy more, pay less).
- **tier-1 `price === product.price`** — 32/32 (the base single-unit price is the top of the ladder).

So the **data is correct and follows the right B2B model**; only `06b`'s adjective is off. Accurate phrasing for a future edit of `06b` §9.7: *"ascending `minQty` / descending unit price (bulk discount), tier-1 `price === base price`."* No data change is warranted — the catalogue is right.

### 5.2 — CONFIRMED still accurate: `06b` §5.2 (banners → retired slugs)

The 3 `banners` still deep-link to `/products?category=electronics | clothing | womens-ethnic-wear`; all three slugs are confirmed **absent** from the current 43-node tree. Pre-existing carry-forward, owned by Prompts 10–11 — `06b`'s note holds.

### 5.3 — CONFIRMED still accurate: `06b` §5.3 (reviews content stale vs. reseeded products)

Verbatim re-check: review#1 *"Absolutely love these earbuds!"* → **WPC Fluted Wall Panel Teak Finish** (id 2); review#2 *"Great laptop, minor nitpicks"* → **WPC Louver Panel 3D Charcoal** (id 1). Electronics-era copy on building-materials products, exactly as `06b` §5.3 describes. Cosmetic; owned by Prompt-31. `06b`'s note holds.

---

## 6. Diff footprint — reproduces exactly (§2)

`git show 0adb740` ("Reseed db.json products with NEBM catalogue (Prompt-06)") compared collection-by-collection against its parent:

- **CHANGED:** `products` 19 → 70.
- **byte-identical:** `banners, users, admins, categories (43→43), cart, enquiries, returns, payments, refunds, shipping_methods, coupons, reviews, wishlist, leads, settings, walletTransactions, dealsConfig`.

Confirms `06b`'s claim: the Prompt-06 reseed touched exactly one collection.

---

## 7. Conclusion

`06b` is **faithful to the live repository**. Every material assertion — category tree, product coverage, pricing modes and display flags, the real `categories.js` helper contract, the mock query-key simulation, cross-collection reference integrity, and the single-collection diff footprint — reproduces exactly under an independent re-run. The only correction is documentary: `06b` §9.7's "ascending `priceTiers`" should read "ascending `minQty` / descending unit price (bulk discount)" (§5.1); the underlying data is correct. The two carry-forward scope notes (`banners` → Prompts 10–11; `reviews` → Prompt-31) remain accurate.

---

*Re-grounding complete against the live `db.json` and unmodified `src/utils/categories.js` (2026-07-02). No files changed except this note. `getMainMenuCategories`=12 tops in order · `getCategoryScopeIds(5)={5,13,14,15,16,17}` · `resolveCategory('floor-tiles')`→13 · legacy `'5'`→tiles · 70 products cover all 35 leaf/flat-top targets (2 each), 0 on parents/Special · priceType tiered 32 / exact 28 / onEnquiry 10 · featured 10, special 10 across 10 tops, trending 8 · all reviews/wishlist/enquiries product refs resolve · Prompt-06 commit changed only `products` (19→70). One wording correction for `06b` §9.7 recorded in §5.1.*
