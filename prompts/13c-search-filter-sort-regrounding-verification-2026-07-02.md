# 13c — Search, Filter & Sort Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over the committed Prompt-13 work (`8a1db60`) *and* its `13b` post-execution note.** Following the `06c`–`12c` precedent for a prompt that shipped with a full `b` note: **re-derive every claim in `13b` and in the Prompt-13 spec's §9/§11 independently from live source, seed data and a fresh build** — rather than trusting the note. Every material assertion was re-checked by re-reading the three changed files at their line anchors, re-running the git/grep checks, re-inspecting the seeded `db.json`, and re-building from scratch. **No application code, tokens, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **all nine §9 acceptance criteria reproduce and every `13b` claim holds** — the listing's price filter/sort key off `priceType` through `getFilterPrice` (`onEnquiry → null`, excluded while a bound is active and never coerced to ₹0; `tiered → Math.min(priceTiers[].price)`; else the product's own `price`) with `priceComparator(dir)` sinking onEnquiry to the **end** both ways; the additive `special === true` **Special Products** facet, the real-`unitType` **Unit Type** facet, and the subtle Price-on-Enquiry note are all present; `SearchModal` carries the 8 NEBM trending seeds with its live-tree `buildCategoryNav` chips untouched; and the stray legacy-orange focus ring is now the blue `--sf-shadow-focus` token. A fresh `CI=true react-scripts build` compiles cleanly and **reproduces byte-identically** — `main.2eb8c91c.js` **384.24 kB** / `main.26ff2fdb.css` **45.48 kB** gzip (react-scripts reported **+587 B JS / +15 B CSS** against the in-place Prompt-12 parent build). The diff's **+204 / −20** across 3 files reproduces exactly, and `utils/categories.js`, `services/api.js`, `db.json` and the admin files are confirmed **untouched**.

> **Companion, not a rewrite.** Following `06c`–`12c`, this note verifies the committed work alongside it and edits nothing — the committed `Products.*` and `SearchModal.js` are left byte-identical; the findings in §5 are recorded for the owning prompts.

> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-13 was **reuse + adapt** — keep the URL contract, the category engine, dual-mode data flow and the search-modal machinery; only adapt the price predicate/comparators, add two facets + one note, re-seed the trending terms, and fix one palette token. This pass only re-reads, re-greps, re-inspects the seed, re-builds and re-asserts.

---

## 1. Method — re-execute, don't trust

`13b` asserts a two-way verification: a clean build **and** a live Chromium runtime probe (legacy `?category=6` → `?category=doors` with 10 children; a ₹2,000–₹10,000 bound → 11 products with 4 onEnquiry traps hidden + the note, then unbounded → 70 with onEnquiry back + note gone; price-low page-1 0 onEnquiry & ascending, page-2 last-10 all onEnquiry; price-high page-1 0 onEnquiry & descending; Special → 10 badged; Unit-Type "Bag" → 7; Clear-All → 70 reset; the additive WPC-louver check; SearchModal's 8 NEBM seeds + live-tree chips + "WPC" → 5 → `/products?search=WPC`; no cart/buy wording in search/filter/sort; console error-free). Rather than accept those, this pass re-derived them:

1. **Diff footprint** — `git show 8a1db60 --numstat` (blast radius) + `git status --porcelain` (working tree clean) + `git diff a5f6399..8a1db60 -- utils/categories.js services/api.js db.json` (owned surfaces untouched).
2. **Source re-read** — every value the spec §9/§11 and `13b` assert read straight out of the **committed** `pages/Products/Products.js` / `.module.css` and `components/SearchModal/SearchModal.js` at their line anchors.
3. **Seed re-inspection** — `db.json` re-counted for the `priceType` / `special` / `unitType` distributions that drive the filter/sort behaviour, and for the onEnquiry-carries-a-real-price trap.
4. **Grep** — a fresh sweep of the changed files for cart/buy/checkout/coupon wording and for the onEnquiry rule + comparator + facet symbols.
5. **Build** — a fresh `CI=true react-scripts build` from the current tree, reproducing the compile and the exact bundle hashes/sizes.

Every result below is the actual output of those runs — the browser-only observations in `13b` are re-grounded from committed **source logic + seed + build** where not re-executed (consistent with how `06c`–`12c` re-ran build/seed rather than the UI), and the seed re-count independently proves the one assertion the whole prompt turns on (see §3).

---

## 2. Diff footprint & invariants — reproduced

- **Blast radius** — `git show 8a1db60 --numstat`: exactly `SearchModal.js (+11/−8)`, `Products.js (+182/−11)`, `Products.module.css (+11/−1)` = **+204 / −20 across 3 files**. Matches `13b`.
- **Working tree** — `git status --porcelain` (tracked): **clean**; the only untracked path is the gitignored `build/`.
- **Owned surfaces untouched** — `git diff a5f6399..8a1db60 -- src/utils/categories.js src/services/api.js db.json` is **empty**: `categoryParam`/`resolveCategory`/`getDescendantIds`/`getCategoryScopeIds`/`orderCategoriesHierarchically`/`getMainMenuCategories`, the dual-mode `products.getAll`/`products.search` + `extractData`, and the seed are byte-identical. No admin file is in the diff.
- **Symbol anchors** — re-grep of committed `Products.js` confirms `getFilterPrice` (L95, `priceType === "onEnquiry" → null` at L97), `priceComparator` (L113), `specialOnly` (L271), `selectedUnitTypes` (L273/L513-514), `hasOnEnquiryItems` (L415), the single-pass price filter (L498), the two price sorts (L540/L543), the extended `filteredProducts` deps (L559), and `.priceNote` (L916).
- **Forbidden wording** — `grep -niE "add to cart|buy now|checkout|coupon"` over the three changed files → **NONE** in real copy (only "removed"/explanatory comments elsewhere).

---

## 3. The load-bearing fact, re-proven from the seed

The entire price-honesty requirement hinges on one seed reality: **onEnquiry products still carry a real numeric `price`.** Re-counted independently this pass:

- `priceType`: **tiered 32 / exact 28 / onEnquiry 10** (total 70); `special: true` → **10**.
- `unitType`: **piece 35 / box 16 / kg 8 / bag 7 / sheet 4** — a bounded 5-value set.
- **All 10 onEnquiry products have `Number(price) > 0`** (e.g. *Fosroc Brushbond* 4200, *Full Body Vitrified Tile* 1650).
- Raw `tags[]`: **274 distinct tokens.**

So the *old* predicate (`getProductMinPrice(p).sellingPrice`) would have ranged those onEnquiry items on 4200/1650 and **wrongly matched** a bounded range; the committed `getFilterPrice` returns `null` for `priceType === "onEnquiry"` and the single-pass filter drops them while bounded — which is exactly the §9 requirement. The same 274-vs-5 gap independently justifies the §5.1 decision to build the attribute facet on the real `unitType` field rather than the noisy raw tags.

---

## 4. §9 acceptance — re-derived (all reproduce)

- **Category deep-link + parent scope + legacy-id rewrite** — engine untouched (`git diff` empty for `categories.js`); `13b`'s `?category=6 → ?category=doors` (10 children) reproduces from the unchanged `resolveCategory`/`getCategoryScopeIds` + the URL-sync effect.
- **NEBM tree filter list + counts** — unchanged `orderCategoriesHierarchically` + `getCategoryScopeIds` counting; re-confirmed in source.
- **Special facet filters `special === true`** — committed `if (specialOnly) result.filter(p => p.special === true)` (L508); seed has 10 special → `13b`'s "10 badged" reproduces.
- **Price filter: representative number; onEnquiry excluded when bounded, else included; never ₹0** — committed single-pass filter (L490-505) + `getFilterPrice`; seed re-count (§3) proves the 4 in-band onEnquiry traps have real prices and are dropped only because their `priceType` returns `null`.
- **Price sorts place onEnquiry at the end** — committed `priceComparator(dir)` returns `+1/−1` for null in both directions (L113-121); reproduces `13b`'s page-1-has-0-onEnquiry / page-2-tail-all-onEnquiry.
- **SearchModal NEBM seeds + live-tree chips + navigation** — committed `TRENDING_SEARCHES` = the 8 NEBM terms; `buildCategoryNav`/`goToSearchResults('/products?search=…')` unchanged.
- **Brand (and real attribute) facet + Clear-All reset** — committed brand group unchanged; `selectedUnitTypes` filter (L513) + `handleUnitTypeToggle`; `clearAllFilters` resets `specialOnly`/`selectedUnitTypes` (with the extended `hasActiveFilters`).
- **No cart/buy/checkout wording in search/filter/sort** — grep clean (§2).
- **Dual-mode + `extractData()`** — `api.js` untouched (§2).

---

## 5. Findings — carried forward from `13b`, re-confirmed

The `13b` §5 findings reproduce unchanged and remain **non-defects**:

- **§5.1 DECISION (spec §4.6/§6)** — the attribute facet filters the real `unitType` field, not raw `tags`. Re-grounded: 274 distinct tags vs 5 bounded `unitType` values (§3) — the honest, *lightweight* choice; `unitType` is the first attribute §6 names, and AC §9 "any real tag/attribute facet works" is satisfied.
- **§5.2 CARRY-FORWARD (prompt 15)** — the pre-existing Discount facet is left intact (36 seed products carry a `comparePrice`); retiring discount/urgency framing is prompt 15's pricing-display model, not §4's ask.
- **§5.3 OBSERVATION (pre-existing, pagination)** — a cold-load deep-link to `?page=2` clamps to page 1 (the clamp effect runs before data loads); the pagination code is not in the Prompt-13 diff, and in-app pager navigation works.
- **§5.4 CARRY-FORWARD (prompt 24 / 16·30)** — "Free Shipping" appears only in the Footer trust badge and a CartDrawer CSS comment — outside search/filter/sort; AC §8 holds.
- **§5.5 OBSERVATION (seed/tree, prompt 6)** — "Special Products" shows as a top-level `SearchModal` chip because the seeded tree has that category node; §3 of the spec says leave `buildCategoryNav` intact, and the `/products` filter treats Special as a flag facet (§4.2).

No new defects were found by this pass.

---

## 6. What this closes

`13c` re-grounds Prompt-13 end-to-end: the committed diff is exactly three storefront files, the category engine / dual-mode API / seed are provably untouched, the onEnquiry price-honesty rule is re-proven from both the committed `getFilterPrice`/`priceComparator` source **and** the independently re-counted seed, the two new facets + note are present at their anchors, and a fresh build reproduces byte-identically. The Prompt-13 story — enquiry-correct, pricing-model-tolerant search / filter / sort — stands verified twice (post-exec `13b` + this re-grounding). Prompts 14 (product details), 15 (pricing display) and 24 (footer) build directly on it.

---

*Re-grounding verification against the live repo (2026-07-02): committed code `8a1db60` + note `cce064c`. `git show 8a1db60 --numstat` → +204/−20 across 3 files; `git status` clean; `git diff a5f6399..8a1db60 -- utils/categories.js services/api.js db.json` empty. Seed re-count: 70 products, priceType tiered 32 / exact 28 / onEnquiry 10 (all with numeric price>0), special 10, unitType piece 35 / box 16 / kg 8 / bag 7 / sheet 4, 274 distinct tags. Fresh `CI=true react-scripts build` → Compiled successfully, `main.2eb8c91c.js` 384.24 kB / `main.26ff2fdb.css` 45.48 kB gzip (identical hashes; +587 B JS / +15 B CSS vs the Prompt-12 parent). Grep of the changed files → no cart/buy/checkout wording in real copy. This note is the only artifact added by the pass; no application code, tokens or config were modified.*
