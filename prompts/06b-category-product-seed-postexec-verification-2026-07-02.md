# 06b — Prompt-06 Category Tree & Product Seed Post-execution Verification (2026-07-02)

> **Prompt-06 execution deliverable — the NEBM category tree is confirmed already-seeded, and the generic boilerplate catalogue is replaced with 70 realistic North East Build Mart products, verified against the plan's own §9 acceptance list and §11 KEEP invariants.** Prompt-06 asked to *seed the 12-top-level NEBM category tree (with subcategories) and ~50–70 dummy products across every leaf/flat-top category using the NEBM pricing model*. The category half was already delivered by Prompt-05 (43 nodes) and is re-verified byte-identical here; the product half — the piece `05b §5.3` explicitly handed forward — is the real work of this prompt. Bottom line: **all 39 acceptance assertions pass, the unmodified `src/utils/categories.js` helpers still resolve against the tree, every one of the 35 leaf/flat-top target categories carries ≥2 products (0 on parent nodes, 0 on Special Products), all three `priceType` modes are present with correct display flags and tier-1-price-equals-price for `getProductMinPrice`, and — because the re-seed reuses contiguous ids `1..70` — every `reviews` / `wishlist` / `enquiries` product reference still resolves.** This note **closes `05b §5.3`** (generic product content → Prompt-06 re-seed). It hands forward **two by-design scope notes** — stale `banners` deep-links to retired generic slugs (owned by Prompts 10–11) and electronics-era `reviews` content now attached to building-materials products (owned by Prompt-31) — both recorded in §5 with exact coordinates.
>
> **Data-layer only.** Only `db.json.products` was modified (19 → 70; plus this note under `prompts/`). No other `db.json` collection — `categories` included — was touched; `categories` was left exactly as Prompt-05 wrote it because it already satisfies Prompt-06 §9.1–§9.5. No `src/`, `server.js`, `public/`, root docs or config were touched. `db.json` was backed up to the scratchpad (`db.beforeP06.json`) before editing, per §4.1.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. The catalogue is re-seeded **in place** on the existing product schema (ids kept contiguous so referring collections don't break); dual-mode fidelity, slug/category rules, the parent-includes-children scope and the safe non-cascading DELETE were never in the blast radius.

---

## 1. Method — reseed deterministically, then verify against the plan's own acceptance list

The 19 generic products (a "ProBook Ultra Laptop" sitting under WPC Louvers, etc.) were replaced by a single deterministic Node transform (read → build 70 records from a hand-curated definition table → `JSON.stringify(…, null, 2)`), not by hand-editing JSON, so every product is reshaped uniformly and the field set is provably identical across all 70. Product **content** is hand-authored per category (realistic NEBM item names, real Indian building-materials brands as dummy data — Kajaria, Somany, Astral, Sintex, Jaquar, Hindware, Cera, UltraTech, Tata Tiscon, Dr. Fixit …); boilerplate fields (slug, sku, images, display flags, timestamps, ids, related links) are derived uniformly by the generator. Verification is **two passes** over the *written* `db.json`: (a) a 39-assertion harness covering every Prompt-06 §9 bullet plus product→category referential integrity, pricing-flag correctness and cross-collection reference safety; (b) that same harness imports a **byte-identical copy** of the unmodified `src/utils/categories.js` (verified `Buffer.equals`) and exercises the real `getMainMenuCategories` / `getCategoryScopeIds` / `resolveCategory` / `categoryParam` / `orderCategoriesHierarchically` against the tree. Both are green. The `products` key was replaced **in place** (between `cart` and `enquiries`) so the collection stays where it was and the diff touches nothing else.

---

## 2. The two halves — reproduced at source

| Half | Before | After (written `db.json`) | ✓ |
|---|---|---|---|
| **Categories** (Prompt-06 §2–§5, §9.1–§9.5) | already NEBM from Prompt-05 | **untouched** — 43 nodes: 12 top-level (ids 1–12, `menuOrder`/`sortOrder` 1..12, `showInMainMenu:true`, placeholder blue images) + 31 subcategories (ids 13–43, correct `parentId`, `showInMainMenu:false`); re-verified byte-identical, no re-write needed | ✅ |
| **Products** (Prompt-06 §6, §9.6–§9.8) | 19 generic (electronics/apparel names, correct pricing schema) | **70 realistic NEBM products**, ids `1..70` contiguous; every leaf/flat-top category ≥2; full NEBM pricing model on each | ✅ |

**Diff footprint:** `git diff` reports **one** changed collection — `products (19 → 70)`. Every other collection (`banners, users, admins, categories, cart, enquiries, returns, payments, refunds, shipping_methods, coupons, reviews, wishlist, leads, settings, walletTransactions, dealsConfig`) is byte-identical to `HEAD`.

**Coverage (§9.6).** 35 target categories = 4 flat top-level (WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products) + 31 leaf subcategories, each seeded with exactly **2** products → **70** total (top of the "~50–70" band). The 7 parent top-levels (Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods) carry **0** direct products — their products live on the leaves and surface on the parent listing via `getCategoryScopeIds`. **Special Products (id 12)** owns **0** products — membership is the `special` flag only (§9.6, §11).

**Pricing model (§9.7).** All three modes present and flag-correct: **tiered 32** (`showTieredPricing:true`, `cardPriceMode:"from"`, ascending `priceTiers`, tier-1 `price === price`), **exact 28** (`showExactPrice:true`, `cardPriceMode:"exact"`, `priceTiers:[]`), **onEnquiry 10** (`cardPriceMode:"onEnquiry"`, numeric `price` retained for helpers, `priceTiers:[]`). Unit types span `piece · sheet · box · bag · kg`. `featured: true` on **10** products across 8 top-levels; `special: true` on **10** across **10 distinct** top-levels; `trending: true` on **8**.

---

## 3. Prompt-06 §9 acceptance — verified against the written file

Every §9 bullet, with how it was checked (all **PASS**, 39/39):

- **`categories` = 12 top-level NEBM nodes in order + listed subcategories, unique slugs** — 12 tops in exact spec order (WPC Louvers → … → Special Products), 43 total, all 43 slugs unique.
- **Every subcategory `parentId` references an existing top-level; no orphan** — all 31 subs point at a real id ∈ {1..12}.
- **All 12 tops `showInMainMenu:true` + `menuOrder` 1..12; subs `showInMainMenu:false`** — asserted; all categories `isActive:true`.
- **`getMainMenuCategories(categories)` = 12 tops in menu order** — real helper returns exactly the 12, ordered.
- **`getCategoryScopeIds(5)` = Tiles + 5 tile subs, as strings** — returns `{5,13,14,15,16,17}` (parent-includes-children intact); `resolveCategory('floor-tiles')→13`, legacy `resolveCategory('5')→tiles`, `categoryParam(Tiles)='tiles'`.
- **Products under every leaf + every flat top; no `categoryId` = Special(12) or missing** — 35/35 targets ≥2; 0 on parents; 0 on Special; 0 orphan `categoryId`.
- **Every product has all pricing fields + `special` bool; all three `priceType` values appear** — 70/70; `{exact,tiered,onEnquiry}` all present; per-mode display flags verified.
- **~8–10 featured; ~8–12 special across different tops; all slugs unique** — featured 10, special 10 across 10 distinct top-levels, 70/70 unique slugs (and unique ids).
- **`db.json` is valid JSON** — `JSON.parse` clean; products is a flat array of plain objects (JSON-Server-friendly, maps cleanly through `extractData()`).

---

## 4. Risk register — dual-mode query keys and cross-collection references hold

**Mock query-key fidelity (§9 / §11).** The mock `products` branches filter JSON Server on top-level fields ([api.js:887–940](src/services/api.js)): `getBySlug`→`{slug}`, `getFeatured`→`{featured:true}`, `getTrending`→`{trending:true}`, `getByCategory`→`{categoryId}`, `search`→`{q}`. Simulating each exact-match filter over the written file: `?featured=true`→10, `?trending=true`→8, `?special=true`→10, `?categoryId=13`→2 (Floor Tiles), `?categoryId=1`→2 (WPC Louvers, flat top), `?slug=glazed-vitrified-floor-tile-600x600`→exactly 1. `categoryId` is numeric and `featured/trending/special` are JSON booleans, so both the mock filters and the Laravel side (via `extractData()`) see the same shape — no mock-only nesting.

**Helper price-read safety (§11).** `getProductMinPrice`/`buildCartItem` read `price`, `comparePrice`, `variants[].price`, `images[0]`, `slug`, `id` ([helpers.js:24–107](src/utils/helpers.js)). Every product keeps a numeric `price > 0`, a `comparePrice` (number or `null`), a non-empty `images[]`, a present `variants: []`, and a unique `slug` — so no helper `NaN`s and every card/detail deep-links via slug. Tiered products set tier-1 `price === product.price`, so the "From ₹X" card min-price matches the first tier.

**Cross-collection references preserved (§11 — leave `reviews`/`wishlist`/`enquiries` untouched).** The re-seed keeps product ids **contiguous `1..70`** rather than renumbering, so every id referenced by an untouched collection still resolves to a real product:

| Referring collection | Referenced product ids | Post-seed resolution |
|---|---|---|
| `reviews[].productId` | 1, 2, 4, 5 | all valid → ratings/reviews still attach on the detail page |
| `wishlist[].productId` | 1, 3, 7 | all valid (records also embed a denormalised snapshot, so cards render regardless) |
| `enquiries[].items[].productId` | 1, 2, 3, 5, 6, 9 | all valid (line items are self-contained snapshots) |
| `products[].relatedProductIds` | same-category / same-family ids | 100% reference existing products (generator fills from the live set) |

---

## 5. Findings — one closure and two by-design scope notes

### 5.1 — CLOSED: `05b §5.3`'s generic product content

`05b §5.3` recorded that Prompt-05 kept the boilerplate product **content** (e.g. "ProBook Ultra Laptop" under WPC Louvers, placeholder `unitType`s) and deferred the realistic re-seed to Prompt-06. **Closed here:** all 19 generic records are gone; the catalogue is 70 building-materials products with category-appropriate names, brands, unit types, descriptions, tags and pricing. The invariant `05b §5.3` flagged as "the one that matters now" — no orphan `categoryId`, none on a parent-with-children or on Special Products — is re-asserted green (§3).

### 5.2 — SCOPE NOTE (carry-forward, out of Prompt-06 scope): `banners` deep-link to retired generic slugs

The 3 `banners` still link to `/products?category=electronics|clothing|womens-ethnic-wear` — the **old** generic category slugs, which no longer exist after the Prompt-05 NEBM reseed, so those hero CTAs currently resolve to an empty/unmatched listing. Prompt-06 §11 **explicitly** lists `banners` among the collections to leave untouched, and the homepage/hero/banner surface is owned by **Prompt-10** (homepage redesign, `HeroSection`) and **Prompt-11** (featured/special). This is a pre-existing carry-forward from Prompt-05, not introduced here — recorded so a later note doesn't mistake it for un-swept Prompt-06 work.

### 5.3 — SCOPE NOTE (by design): `reviews` content is stale relative to the reseeded products

Because ids `1,2,4,5` are reused (to keep the `reviews` refs valid, §4), the untouched review rows now attach electronics-era titles/bodies to building-materials products — e.g. review#1 *"Absolutely love these earbuds!"* under **WPC Fluted Wall Panel**, review#2 *"Great laptop, minor nitpicks"* under **WPC Louver Panel**. This is cosmetic: the reviews are dummy seed data, the ratings/counts still render, and reusing the ids is the faithful choice (renumbering would orphan the reviews entirely). Aligning the Reviews data/module to NEBM is owned by **Prompt-31** (reviews-users-settings-cleanup). Directly parallel to `05b §5.4`'s `storeCredit`-cache cosmetic note.

### 5.4 — SCOPE NOTE: images are placeholders; brands are dummy

Per §5 image conventions, every product uses `placehold.co/600x400` placeholder art (dark-slate) and every category uses `placehold.co/400x300` (brand blue) — no real photography is introduced (that is a later content task). Brand names are real building-materials brands used purely as realistic dummy labels.

### 5.5 — UNCHANGED (still open from `05b §5.1`): the `/orders`→`/enquiries` code repoint

Not in Prompt-06 scope. The `api.js` `orders.*` namespace and order-consuming pages still address `/orders` and remain owned by Prompts 25/28/16–20 per `05b §5.1`. This prompt touched no code, so that transitional state is exactly as `05b` left it.

---

## 6. What this closes

`06b` closes the before→after loop on the **catalogue seed** — the last data-layer foundation before the storefront prompts (07–15) start rendering. The written `db.json` (a) leaves the already-compliant NEBM category tree byte-identical (§2), (b) replaces 19 generic products with 70 realistic NEBM products passing every §9 acceptance assertion plus product→category referential integrity and the **real** `categories.js` helper contract (§3), (c) preserves dual-mode query-key fidelity and every `reviews`/`wishlist`/`enquiries` product reference by keeping ids contiguous (§4), and (d) **closes `05b §5.3`** (generic product content, §5.1). It hands forward **two by-design scope notes** — stale `banners` slugs → Prompts 10–11 (§5.2); electronics-worded `reviews` → Prompt-31 (§5.3) — and leaves `05b §5.1`'s `/orders` code repoint untouched and still owned by Prompts 25/28/16–20 (§5.5). `categories.js`, `server.js`, auth, the slug/category rules and dual-mode fidelity were never in the blast radius.

---

*Post-execution verification complete against the live `db.json` (2026-07-02). Backup at scratchpad `db.beforeP06.json`. 39/39 acceptance assertions pass; the unmodified `src/utils/categories.js` helpers resolve `getMainMenuCategories`=12 tops in order, `getCategoryScopeIds(5)={5,13,14,15,16,17}`, `resolveCategory('floor-tiles')`→13, legacy `'5'`→tiles; 70 products cover all 35 leaf/flat-top categories (2 each), 0 on parents/Special; priceType tiered 32 / exact 28 / onEnquiry 10; featured 10, special 10 across 10 top-levels, trending 8; every reviews/wishlist/enquiries product ref still resolves. Only `db.json.products` and this note were modified. `05b §5.3` is closed; `banners` slugs → Prompts 10–11, `reviews` content → Prompt-31, `/orders` repoint → Prompts 25/28/16–20.*
