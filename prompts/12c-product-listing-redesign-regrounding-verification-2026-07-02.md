# 12c — Product Listing Redesign Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over the committed Prompt-12 work (`0a87bf2`) *and* its `12b` post-execution note.** Following the `06c`–`11c` precedent for a prompt that shipped with a full `b` note: **re-derive every claim in `12b` and in the Prompt-12 spec's §9/§11 independently from live source, seed data and a fresh build — twice (Prompt-12 and its parent)** — rather than trusting the note. Every material assertion was re-checked by re-reading the four changed files at their line anchors, re-running the git/grep checks, re-inspecting the seeded `db.json`, and re-building from scratch. **No application code, tokens, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **all ten §9 acceptance criteria reproduce, and all `12b` claims hold** — the `/products` listing now delegates every grid **and** list item to the ONE canonical `storefront/ProductCard`; that card carries a stacked top-left badge set (always-on gold `#fa9c4c` **Special**, plus blue `#1885d8` **Featured**/**Trending** and an honest green **discount** chip gated behind the new `showBadges` prop so Prompt-11's curated bands stay clean), an **icon-only** "Add to Enquiry List" action with a CSS tooltip (blue CTA, gold hover, disabled + "Out of Stock" when `stock === 0`), a renamed `onAddToEnquiry` prop (with `onAddToCart` alias), and a `layout="grid"|"list"` variant; the forked inline card and ~200 lines of dead CSS are deleted. Two fresh `CI=true react-scripts build`s compile cleanly — **HEAD JS 383.65 kB / CSS 45.46 kB gzip**, **parent `e3496b3` JS 384.05 kB / CSS 45.63 kB** — so Prompt-12's true bundle delta is **−0.40 kB JS / −0.17 kB CSS** (≈ −391 B / −164 B). The diff's **273 ins / 423 del (net −150)** across 4 files reproduces exactly.
>
> **Companion, not a rewrite.** Following `06c`–`11c`, this note verifies the committed work alongside it and edits nothing — the committed `ProductCard.*` and `Products.*` are left byte-identical; the findings in §7 are recorded for the owning prompts.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-12 was **reuse + subtract**: give the one canonical card its full listing design once (so it flows to every surface), point `/products` at it, and delete the fork. This pass only re-reads, re-greps, re-inspects the seed, re-builds and re-asserts.

---

## 1. Method — re-execute, don't trust

`12b` asserts a two-way verification: a clean build **and** a live Chromium runtime probe (`/products` 12 shared cards; computed badge colours Special `#fa9c4c` / Trending `#1885d8` / discount `#15803d`; 12 icon-only enquiry buttons with no visible text and no Add-to-Cart/Buy-Now; an add-to-enquiry click growing the list qty 4→5; a temporarily-zeroed product rendering a disabled "Out of Stock" button; the Tiles parent → 10 child products with breadcrumb `Home › Products › Tiles`; the homepage bands showing 9 gold Special + 0 Featured/Trending/discount across 16 icon-only cards; console error-free). Rather than accept those, this pass re-derived them:

1. **Diff footprint** — `git show 0a87bf2 --numstat` (blast radius) + `git status --porcelain` (working tree clean) + lineage.
2. **Source re-read** — every value the spec §9/§11 and `12b` assert read straight out of the **written** `storefront/ProductCard.js` / `.module.css` and `pages/Products/Products.js` / `.module.css`.
3. **Contract check** — the consumed surfaces re-read at source (`getProductMinPrice`/`buildCartItem`/`productPath`/`truncateText`/`onImageError` in `utils/helpers.js`, `getCategoryScopeIds`/`resolveCategory`/`orderCategoriesHierarchically` in `utils/categories.js`, `PriceBlock`, `StarRating`, `hooks/useCart`, `WishlistContext`, `theme/storefront-tokens.css` palette, `db.json` seed) to confirm every symbol/prop the listing calls exists and is unchanged.
4. **Seed re-inspection** — `db.json` re-grepped for the flag/price counts that drive the rendered badges.
5. **Grep** — a fresh sweep of the changed files for cart/buy/`#667eea` wording.
6. **Build** — a fresh `CI=true npm run build` from the current tree, **and** a second build of the parent `e3496b3` to reproduce the true bundle delta.

Every result below is the actual output of those runs — the browser-only observations in `12b` are re-grounded from source + build + seed where not re-executed (see §8), consistent with how `06c`–`11c` re-ran build/seed rather than the UI.

---

## 2. Diff footprint & lineage — reproduce exactly

- **Footprint.** `git show 0a87bf2 --numstat` → exactly **four** files: `storefront/ProductCard.js` (**110/56**), `storefront/ProductCard.module.css` (**114/22**), `pages/Products/Products.js` (**32/139**), `pages/Products/Products.module.css` (**17/206**) — commit total **273 ins / 423 del (net −150)**. Routes, providers, `db.json`, `utils/*`, `PriceBlock`, `StarRating` and the admin palette are **absent from the diff**.
- **Lineage.** `0a87bf2^` = `e3496b3` (Prompt-11 `11c` re-grounding note, no code change) → `6c89c59` (`11b`) → `d922868` (Prompt-11 impl). So Prompt-12 sits directly on the committed, twice-verified Prompt-11 tree — the correct baseline for the bundle delta.
- **Clean tree.** `git status --porcelain` is **empty** after both rebuilds (`build/` is gitignored), and HEAD is `304eb09` on `analysis/regrounding-verification-note` — the verification left the tracked tree byte-identical.

---

## 3. What changed — reproduced at source

| File | Change re-grounded from the written file | ✓ |
|---|---|---|
| **`storefront/ProductCard.js`** | Stacked top-left `.badges`: gold **Special** iff `product.special === true` ([:98](../src/components/storefront/ProductCard.js)) — always additive; blue **Featured**/**Trending** ([:106, :111](../src/components/storefront/ProductCard.js)) + honest green **discount** `{discount}% OFF` ([:93–95](../src/components/storefront/ProductCard.js)) gated by `showBadges` ([:58](../src/components/storefront/ProductCard.js)); `discount` from `getProductMinPrice(product)` ([:63](../src/components/storefront/ProductCard.js)). Icon-only action: `data-tip` tooltip + `aria-label` = "Add to Enquiry List"/"Out of Stock", `buildCartItem → addHandler`, disabled when `outOfStock` ([:150–192](../src/components/storefront/ProductCard.js)). `addHandler = onAddToEnquiry \|\| onAddToCart` ([:71](../src/components/storefront/ProductCard.js)); `showAdd` honours the legacy `showAddToCart` override ([:72](../src/components/storefront/ProductCard.js)); `layout="grid"\|"list"` + list-only `shortDescription` ([:67, :143–145](../src/components/storefront/ProductCard.js)). Price still `PriceBlock price={sellingPrice} showSavings={false}` — untouched. | ✅ |
| **`storefront/ProductCard.module.css`** | `.badges` column (`pointer-events:none`) + `.badge` base + `.badgeSpecial` (`--sf-color-accent`), `.badgeFeatured`/`.badgeTrending` (`--sf-color-primary`), `.badgeDiscount` (`--sf-color-discount`) ([:36–74](../src/components/storefront/ProductCard.module.css)); heart stays `right` — no overlap. `.footer` + `.enquiryBtn` (44px, blue → gold hover, [:177–211](../src/components/storefront/ProductCard.module.css)) + CSS tooltip `.enquiryWrap::after`/`:hover`/`:focus-within` ([:214–238](../src/components/storefront/ProductCard.module.css)) + `.cardList` horizontal variant ([:240–256](../src/components/storefront/ProductCard.module.css)). The old `.addBtn`/`.specialBadge` are gone (grep → 0). | ✅ |
| **`pages/Products/Products.js`** | `renderProductCard` → `<ProductCard product layout={viewMode==="list"?"list":"grid"} onAddToEnquiry={handleAddToEnquiry} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(product.id)} showBadges>` ([:872–882](../src/pages/Products/Products.js)); the forked inline card + `HeartIcon`/`CartIcon` deleted. `handleAddToEnquiry(cartItem) → addToCart(cartItem, 1)` ([:628–631](../src/pages/Products/Products.js)); `handleProductClick`/`handleWishlistToggle` removed. Unused imports (`formatCurrency`/`truncateText`/`buildCartItem`/`productPath`) dropped ([:14](../src/pages/Products/Products.js)); `getProductMinPrice` kept (price/discount filters), `RatingStars`/`StarIcon` kept (rating filter). | ✅ |
| **`pages/Products/Products.module.css`** | Forked inline-card CSS deleted; only `.grid`/`.gridList`/`.cardWrap` + the skeleton shell `.card`/`.cardImageWrap`/`.cardBody` remain ([:522–564](../src/pages/Products/Products.module.css)). Responsive grid **4 → 3 (`≤1100`, [:872](../src/pages/Products/Products.module.css)) → 2 (`≤768`, [:904](../src/pages/Products/Products.module.css)) → 1 (`≤480`, [:966](../src/pages/Products/Products.module.css))**. | ✅ |
| **`helpers.js` / `categories.js` / `PriceBlock` / `StarRating`** | **UNCHANGED** — not in the diff. `getProductMinPrice` (honest `discount = round((compare−price)/compare)`, [helpers.js:24](../src/utils/helpers.js)), `buildCartItem` ([helpers.js:76](../src/utils/helpers.js)), `productPath` (slug-first, [helpers.js:103](../src/utils/helpers.js)), `getCategoryScopeIds`/`resolveCategory` byte-identical; `PriceBlock` still carries its compare-price logic for the PDP. | ✅ |

---

## 4. The badges, the shared source & the counts — re-derived from the seed

`12b` claims the listing shows the full badge set while the homepage bands show only Special. Re-grounding the numbers against the seed the pages read:

- **10 special / 10 featured / 10 trending; 73 `comparePrice` keys.** `db.json` carries **10** `special:true`, **10** `featured:true`, **10** `trending:true`, and **73** products with a `comparePrice` — so the honest discount chip (`comparePrice > price`) can legitimately appear on the listing (e.g. WPC Louver 420→340 = **19%**), driven purely by real numbers.
- **The badge visibility is a pure function of the flag × `showBadges`.** Special renders iff `product.special === true` ([ProductCard.js:98](../src/components/storefront/ProductCard.js)) — on **every** surface; Featured/Trending/discount render iff their flag/discount is truthy **and** `showBadges` is passed ([:93, :106, :111](../src/components/storefront/ProductCard.js)). The listing passes `showBadges` ([Products.js:880](../src/pages/Products/Products.js)); the homepage bands ([Home.js](../src/pages/Home/Home.js)), `/special-offers` ([SpecialOffers.js](../src/pages/SpecialOffers/SpecialOffers.js)), `FeaturedProducts` and the related/bundle carousels do **not** — the structural basis for `12b`'s "9 gold Special + 0 Featured/Trending/discount" on the homepage.
- **One canonical card, one enquiry path.** The listing, the bands and the carousels all render the same `ProductCard`, which emits `buildCartItem(product)` ([:189](../src/components/storefront/ProductCard.js)) into each caller's handler → `addToCart(cartItem, 1)` — so a listing quick-add merges with PDP/band adds and the `localStorage["cart"]` key is unchanged. The `onAddToCart` alias ([:71](../src/components/storefront/ProductCard.js)) keeps `RelatedProducts`/`FrequentlyBoughtTogether` working untouched.

---

## 5. Prompt-12 §9 acceptance — re-derived against source + seed

Every §9 bullet, re-checked (all **PASS**):

- **Responsive grid (1/2/3/4), soft rounded cards, Blue/Gold, no `#667eea`** — grid steps `repeat(4)` → `3` → `2` → `1` ([Products.module.css:524, :872, :904, :966](../src/pages/Products/Products.module.css)); card `--sf-radius-lg` + `translateY(-4px)` hover; grep of changed files for `#667eea` → **0**.
- **Image, brand, name, conditional rating, `PriceBlock` price** — all on the shared card; rating guarded by `totalReviews > 0`.
- **Featured/Special/Trending from the flags; Special gold, others blue; honest discount** — `.badgeSpecial` = `--sf-color-accent` (`#fa9c4c`, [tokens:35](../src/theme/storefront-tokens.css)), `.badgeFeatured`/`.badgeTrending` = `--sf-color-primary` (`#1885d8`, [tokens:29](../src/theme/storefront-tokens.css)), `.badgeDiscount` = `--sf-color-discount` (`#15803d`, [tokens:65](../src/theme/storefront-tokens.css)); discount derived, never fabricated.
- **Only action = Add-to-Enquiry icon-button + tooltip; click adds via `buildCartItem` + `addToCart`** — icon-only `.enquiryBtn`, `aria-label`/`data-tip` "Add to Enquiry List", `buildCartItem → addHandler → addToCart(cartItem, 1)` ([ProductCard.js:186–189](../src/components/storefront/ProductCard.js), [Products.js:628–631](../src/pages/Products/Products.js)).
- **No Buy-Now, no visible Add-to-Cart/Add-to-Enquiry text** — the button has no text node; grep of changed files → no "Buy Now"/"Add to Cart" copy.
- **Out-of-stock disables the button; tooltip "Out of Stock"** — `outOfStock = product.stock === 0` → `disabled` + `enquiryTip = "Out of Stock"` on `aria-label`/`data-tip` ([:66, :73, :162–165](../src/components/storefront/ProductCard.js)). (`12b`'s live temporarily-zeroed check confirmed it; not re-executed here — see §8.)
- **Parent category returns children; count reflects the scoped set** — `getCategoryScopeIds`/`resolveCategory`/`wantedIds.has(String(p.categoryId))` untouched in `Products.js`; `utils/categories.js` not in the diff. (`12b` live: Tiles → 10.)
- **Slug links; legacy numeric resolves** — the card links `productPath(product)` (slug-first, [helpers.js:103](../src/utils/helpers.js)); PDP slug+legacy resolution untouched.
- **Breadcrumb, results count, sort, filters, pagination still work** — none are in the card refactor; the filter/sort/paginate memoization + URL sync are byte-identical.
- **Loads via `getAll()`/`getByCategory()` through `extractData()`; `IS_MOCK_API` toggle safe** — `fetchCatalog` unchanged; the card reads product fields only.

---

## 6. §11 KEEP-invariants — all intact

| Invariant (§11) | Re-grounded result | ✓ |
|---|---|---|
| **Dual-mode API + `extractData()`** | `fetchCatalog` unchanged; card consumes fields only; no mock-only shape; no `db.json` writes (out-of-stock probe reverted) | ✅ |
| **Slug + category rules** | `productPath` slug + legacy; `getCategoryScopeIds` parent-includes-children + `orderCategoriesHierarchically` untouched | ✅ |
| **`ProductCard` shared & prop-compatible** | one canonical card; `onAddToCart` alias keeps every caller working; badge/action additive | ✅ |
| **Enquiry-list wiring** | `buildCartItem → addToCart` (localStorage `"cart"`, qty 1); no purchase/coupon/wallet path | ✅ |
| **API/storage stability** | add still calls `addToCart`; `cart` namespace + `"cart"` key unchanged | ✅ |
| **CSS Modules + palette separation** | storefront-only (no admin file in the diff); framer-motion reveals; skeleton/error/empty/heart/count/breadcrumb/sort/pagination preserved | ✅ |

---

## 7. Findings — `12b` claims reconciled; one build-delta + one numstat reconciliation; no code defect

### 7.1 — RECONCILE (build delta): the impl commit message's "−3.5 kB / −2.05 kB" is CRA's delta vs a stale `build/`, not the true parent
The commit `0a87bf2` message records "JS -3.5 kB, CSS -2.05 kB" — the figure `react-scripts build` printed, which compares against whatever artifacts happened to be in `build/` at the time (a larger, stale build). Re-grounding resolves it with two fresh builds: **parent `e3496b3` = JS 384.05 kB / CSS 45.63 kB** (reproducing `11c` byte-for-byte) and **HEAD = JS 383.65 kB / CSS 45.46 kB**, so Prompt-12's **true** gzip delta is **−0.40 kB JS / −0.17 kB CSS** (≈ −391 B / −164 B). The modest bundle delta despite **net −150 source lines** is expected: the deleted forked inline card (~200 CSS + ~90 JS lines) is largely offset by the shared card's new badge/tooltip/list code (~110 JS + ~114 CSS lines). `12b`'s **absolute** figures (383.65 / 45.46) are correct; only the commit-message *delta* framing is superseded here. Documentary reconciliation, not a defect.

### 7.2 — RECONCILE (numstat): `12b`'s per-file insert/delete estimate is superseded by the exact numstat
`12b` §2 gave a per-file breakdown ("ProductCard.js +108/−58" etc.) that was an estimate; the exact `git show --numstat` is **ProductCard.js 110/56 · ProductCard.module.css 114/22 · Products.js 32/139 · Products.module.css 17/206**. The **totals** `12b` quoted (273 ins / 423 del, net −150) are exact and reproduce; only the per-file split is corrected here. No code impact.

### 7.3 — DECISION re-confirmed (§5 + §11): the `showBadges` gate keeps Prompt-11's bands clean
Re-reading confirms the single-prop reconciliation: Special is always additive; Featured/Trending/discount reveal only under `showBadges` ([ProductCard.js:93, :106, :111](../src/components/storefront/ProductCard.js)), which the listing passes and the curated bands/carousels omit. This satisfies Prompt-12 §5/§9 (full badge set on the listing) **and** Prompt-11 §5/§7 (no "% off" urgency on the bands) from one card — grounded in `prompts/00` §3/§5 (NEBM keeps honest `comparePrice` discounts; removes Buy-Now/coupons/deal-timers). Sanctioned, not a defect.

### 7.4 — SANCTIONED cross-surface effect re-confirmed: the canonical card action is now icon-only everywhere
The shared card's button is now icon-only + tooltip ([:158–192](../src/components/storefront/ProductCard.js)); because the card is shared, this propagates to the homepage bands, `/special-offers` and the carousels. This fulfils Prompt-11 §3's stated "icon-button w/ tooltip" intent (its impl had kept visible text) **and** Prompt-12 §6's "no visible text" — an intended, uniform evolution of the one card, confirmed at source.

### 7.5 — CARRY-FORWARD (prompt 15): clean card price now; struck compare price + `priceType` deferred
The card shows a clean `sellingPrice` (`showSavings={false}`, no inline struck compare), with the honest savings surfaced as the media discount chip. The struck MRP + `priceType` (exact/tiered/onEnquiry) card display is owned by **prompt 15** ("keep the honest discount badge on the media consistent with the card price"); `PriceBlock` is untouched here. Also, the media discount chip is currently driven purely by `comparePrice > price` and ignores `priceType`, so a tiered/onEnquiry product with a `comparePrice` could show a chip — harmless (derived from real numbers) and subsumed by prompt 15's `priceType`-aware card price. Not a Prompt-12 defect.

### 7.6 — NOTE: `Products.module.css` now holds only grid + skeleton-shell classes
The forked inline-card CSS is deleted; the file lays out the grid and the loading skeleton (`.card`/`.cardImageWrap`/`.cardBody`), with all card visuals in `ProductCard.module.css`. The grid/list **toggle** is preserved via the shared card's `layout="list"` variant — no feature removed, no dead card CSS left behind.

---

## 8. Build & runtime-scope note — reproduce exactly

- **Build (HEAD).** A fresh `CI=true npm run build` → **`Compiled successfully.`** (warnings-as-errors — so it also proves the deletions left no orphaned imports/vars), JS `main.00e4f048.js` = **383.65 kB gzip**, CSS `main.a6fab375.css` = **45.46 kB gzip**.
- **Build (parent `e3496b3`).** A second build → **`Compiled successfully.`**, JS `main.1f7c74c9.js` = **384.05 kB gzip**, CSS `main.872a712d.css` = **45.63 kB gzip** (reproducing `11c`). True Prompt-12 delta **−0.40 kB JS / −0.17 kB CSS**. `build/` is gitignored; both rebuilds left the tracked tree clean and HEAD returned to `304eb09` on the branch.
- **Runtime scope.** `12b`'s *structural* live claims (12 shared cards, badge colours/counts, the icon-only no-text button, the enquiry-list increment, the out-of-stock disabled state, Tiles → 10 with breadcrumb, the homepage `showBadges` gate) are re-grounded here **from source + seed + build** rather than a fresh browser run — consistent with `06c`–`11c`. The **browser-only** observations (computed `rgb()`, the `localStorage` qty 4→5, the temporarily-zeroed-stock check, "console error-free") were **not** re-executed this pass; their structural basis is confirmed — the blue/gold/green tokens resolve to `#1885d8`/`#fa9c4c`/`#15803d` in source, every imported symbol resolves, `buildCartItem → useCart` is intact, the seed carries 10/10/10 flags + 73 comparePrice, and the build compiles with no errors.

---

## 9. Conclusion

The committed Prompt-12 product-listing redesign is **faithful to the live repository, its own spec, and the `12b` post-execution note**. All ten §9 acceptance criteria reproduce under an independent re-run — the listing delegates every grid and list item to the ONE canonical `storefront/ProductCard`; that card carries the stacked gold-Special / blue-Featured-Trending / green-honest-discount badges (merchandising chips gated by `showBadges` so Prompt-11's curated bands stay clean, Special always additive), the icon-only "Add to Enquiry List" action with a CSS tooltip (blue → gold hover, disabled + "Out of Stock"), the `onAddToEnquiry` prop with an `onAddToCart` alias, and a `layout="grid"|"list"` variant; the forked inline card + ~200 lines of dead CSS are gone, replaced by a thin delegating wrapper. The §11 KEEP invariants (dual-mode `apiService` + `extractData`, slug/category parent-includes-children rules, shared-card reuse with the fork deleted, enquiry-list `buildCartItem` wiring, `cart` namespace/key stability, CSS-Module/palette separation, skeleton/error/empty states) all hold. Two fresh production builds compile cleanly (HEAD 383.65 / 45.46 kB; parent `e3496b3` 384.05 / 45.63 kB → −0.40 kB JS / −0.17 kB CSS), and the diff's 273 ins / 423 del (net −150) across 4 files reproduces exactly. The six findings are reconciliations/nuances, not defects: the build-delta reconciliation (the commit message's −3.5/−2.05 is CRA's delta vs a stale build/, the true delta is −0.40/−0.17 vs the parent, §7.1), the exact-numstat reconciliation of `12b`'s per-file estimate (§7.2), the re-confirmed `showBadges` gate (§7.3) and icon-only propagation (§7.4), and the carry-forwards owned by prompt 15 (§7.5) plus the grid/skeleton-only CSS note (§7.6). Prompt-12 is enquiry-correct and behaviourally sound.

---

*Re-grounding complete against the live `storefront/ProductCard.js`/`.module.css`, `pages/Products/Products.js`/`.module.css` and the consumed `utils/helpers.js`, `utils/categories.js`, `theme/storefront-tokens.css`, `storefront/PriceBlock`, `storefront/StarRating`, `db.json` (2026-07-02). No files changed except this note. `/products` delegates to the one canonical ProductCard (grid + list) · badges: gold Special (always additive) + blue Featured/Trending + green honest discount, gated by `showBadges` (listing on, bands off) · icon-only Add-to-Enquiry (tooltip, blue→gold hover, disabled "Out of Stock") · `onAddToEnquiry` (+ `onAddToCart` alias) · `layout="grid"|"list"` · forked inline card + ~200 lines dead CSS deleted · grid 4/3(≤1100)/2(≤768)/1(≤480) · seed 10 special / 10 featured / 10 trending / 73 comparePrice · commit `0a87bf2` = 4 files, 273/423 (−150), parent `e3496b3` · `CI=true react-scripts build` → Compiled successfully, HEAD JS 383.65 kB / CSS 45.46 kB, parent 384.05 / 45.63 → −0.40 kB JS / −0.17 kB CSS · working tree clean. Six reconciliations/nuances in §7 — no code defect.*
