# 11b — Featured & Special Products Post-execution Verification (2026-07-02)

> **Prompt-11 execution deliverable — NEBM's Featured & Special Products surfaces are now enquiry-correct and driven by the one canonical card.** The shared `storefront/ProductCard` gains a gold `#fa9c4c` **"Special"** ribbon (top-left, additive, shown iff `product.special === true`); a new dual-mode `apiService.products.getSpecial()` mirrors `getFeatured` and becomes the **single shared data source** for both the homepage Special band and the collection page; `FeaturedProducts.js` is repurposed from a forked local "Add to Cart"/"% OFF" card into a thin reusable band over the shared card; and `/special-offers` is rebuilt from a **deals/coupons page** (master toggle + countdown + "Deal of the Day" + coupon cards + discount-sorted grid) into the **Special Products collection** — a NEBM blue hero with a gold "Curated picks" kicker, curation category tabs, and a clean badged grid of the shared card, with **no** coupons / countdown / deal-of-the-day / "% off" urgency.** Bottom line: **every §9 acceptance criterion passes, verified two ways — a clean `CI=true react-scripts build` (Compiled successfully; JS bundle −3.11 kB → 384.05 kB, CSS −1.89 kB → 45.63 kB gzip, net −1,287 source lines) and a live Chromium runtime probe (`/special-offers` h1 "Special Products"; "Curated picks" kicker computed gold `rgb(250,156,76)` = `#fa9c4c`; hero computed blue gradient `#1885d8→#1069b0`; 10 special cards each carrying a gold "Special" badge + an "Add to Enquiry List" button; "All" + 10 curation tabs; first card → normal PDP; add-to-enquiry grows `localStorage["cart"]` with the correct line; the homepage bands render 9 gold badges across 16 shared cards; the mock `/products?special=true` returns the 10 seeded specials; the additive rule holds — `/products?category=wpc-louvers` still lists the special "WPC Louver Panel 3D Charcoal"; **zero** coupon/countdown/deal-of-the-day/%-off/Buy-Now copy; console error-free).**

> **Eight-file, storefront-only change.** The diff touches exactly the shared `storefront/ProductCard.js`/`.module.css`, `services/api.js` (new `getSpecial`), `FeaturedProducts.js`/`.module.css`, `SpecialOffers.js`/`.module.css`, and `Home.js` (repoint the Special band at `getSpecial`) — **net 434 ins / 1,721 del (−1,287)**, almost all from deleting the coupons/countdown/deal-of-the-day machinery and the two forked local product cards. No routes, providers, `db.json`, `utils/*`, or admin files are in the diff.

> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. The shared `ProductCard` is **reused, not forked** — `FeaturedProducts` and `/special-offers` both render the one canonical card, the badge is additive (a missing/false `special` simply hides it), `getSpecial` reuses the exact `getFeatured` dual-mode/`extractData` shape, the `buildCartItem`→`useCart` quick-add path and the `localStorage["cart"]` key are untouched, and the responsive `CategoryTabs` is kept (reframed "All Deals" → "All").

---

## 1. Method — reuse the shared card, subtract the deals machinery, verify two ways

Prompt-11 has three moving parts: (a) make the one canonical card carry a "Special" badge so it appears on **every** surface that renders it; (b) give Featured/Special one shared, dual-mode data source; (c) turn the old deals page into a curated collection. The work was mostly **subtractive** on `/special-offers` (delete coupons/countdown/deal-of-the-day/discount-sort/`useDealsConfig` gate) and **consolidating** on the cards (delete two forked local `ProductCard`s in `SpecialOffers.js` and `FeaturedProducts.js`, render the shared one). Verification is two independent passes over the **written** files: (a) `CI=true react-scripts build` → *Compiled successfully* (warnings-as-errors, so it also proves no orphaned imports survived the deletions); (b) a live runtime probe in the preview Chromium reading the DOM + `getComputedStyle` — section content, badge colour/count, kicker/hero colours, tabs, PDP links, an actual add-to-enquiry click, the additive-listing check, and a console-error sweep.

---

## 2. What changed — reproduced at source

| File | Change | ✓ |
|---|---|---|
| **`storefront/ProductCard.js`** | Added a gold **"Special"** ribbon: `{product.special === true && <span className={styles.specialBadge} title="Special product">Special</span>}` inside `.media` (top-left). Additive/optional — false/missing hides it; purely presentational (never changes price or links). Card comment updated to record the badge is now present (was "layered on by prompt 11"). | ✅ |
| **`storefront/ProductCard.module.css`** | New `.specialBadge` on `--sf-*` tokens: `background: var(--sf-color-accent)` (`#fa9c4c`), white text, pill, `top/left: --sf-space-2`, `pointer-events: none`, `z-index: 1`. Sits top-left; the wishlist heart is top-right — **no overlap**. | ✅ |
| **`services/api.js`** | New `apiService.products.getSpecial(limit = 12)` mirroring `getFeatured`: mock `GET /products?special=true` sliced to `limit`; Laravel `GET /products/special?limit=` via `extractData()`. `IS_MOCK_API` branch + try/catch preserved. | ✅ |
| **`Home.js`** | Special band repointed from `getAll().filter(special).slice(0,8)` to the shared **`getSpecial(8)`** (§6 "share the same data source"); the redundant client-side `.filter` is gone; `.catch(()=>[])` + `Array.isArray` guard kept. Featured band already renders the shared card, so it now shows the badge automatically. | ✅ |
| **`FeaturedProducts.js`** | Forked local card (`getProductMinPrice`, `formatCurrency`, a "% OFF" `.discountBadge`, an "Add to Cart" button) **deleted**; the band now maps products to the shared `storefront/ProductCard` with `useCart`/`useWishlist` wiring (`buildCartItem`→`addToCart`) and framer-motion `whileInView` reveals. New optional `subtitle`/`viewAllText` props; renders nothing when empty. | ✅ |
| **`FeaturedProducts.module.css`** | Rewritten (−≈local-card CSS) on `--sf-*` tokens: section/container/header/title/subtitle/view-all/grid only; dark mode follows `body.dark` automatically. Deleted the local card/discount/wishlist/price CSS. | ✅ |
| **`SpecialOffers.js`** | **Rebuilt** into the Special Products collection. Removed: coupons (`coupons.getActive`, coupon cards, copy-code), the countdown hook (`useDealsCountdown`/`resolveCountdownTarget`/`diffToParts`), "Deal of the Day", discount-sort, the forked local `ProductCard`/`StarRating`, and the `useDealsConfig` master-toggle gate. Now: fetch **`getSpecial(60)`** + `categories.getAll()` (guarded), render the badged shared card in a grid, curation `CategoryTabs` (filter by `categoryId`, "All" + represented categories), a NEBM blue hero with a gold "Curated picks" kicker, a result count, skeletons, and a graceful empty state → `/products`. | ✅ |
| **`SpecialOffers.module.css`** | Rewritten (−≈1,000 lines) on `--sf-*` tokens: page shell, blue `--sf-gradient-primary` hero + gold kicker, token-based tabs (kept), product grid, token skeletons, empty state. Deleted all coupon/countdown/deal-of-the-day/local-card CSS and every per-rule `.dark` (dark mode follows `body.dark`). | ✅ |

---

## 3. Prompt-11 §9 acceptance — verified against the written files + live runtime

Every §9 bullet, with how it was checked (all **PASS**):

- **`ProductCard` renders a gold `#fa9c4c` "Special" badge iff `product.special === true`; no overlap with the wishlist heart; false/missing hides it** — runtime: the homepage bands show **9** gold badges (computed `rgb(250,156,76)`) across 16 shared cards (the 8 special-band cards + one featured card that is *also* `special` — additive, as intended), and `/special-offers` shows **10** (one per special card). Badge is top-left, heart top-right, `pointer-events:none`. Non-special cards show none.
- **Special products fetched dual-mode (`getSpecial` mirrors `getFeatured`) via `extractData()`; mock hits `/products?special=true`** — `curl http://localhost:3001/products?special=true` → **10** products; `getSpecial` mock branch slices them; Laravel branch hits `/products/special` via `extractData`.
- **`/special-offers` lists only `special === true` using the badged shared card; no coupons/countdown/deal-of-the-day/"% off"** — runtime: 10 cards, all badged; `body.innerText` sweep `coupon/deal of the day/deals end in/countdown/% off/Buy Now/Add to Cart` → **all false**.
- **Featured band uses `products.getFeatured()` and the shared card with an "Add to Enquiry List" icon-button (no cart/urgency)** — homepage Featured renders the shared card (`getFeatured(8)`); sampled button `aria-label="Add to Enquiry List"`; `FeaturedProducts.js` (reusable band) now delegates to the same card.
- **A special product also appears in its normal category listing (NOT removed)** — runtime: `/products?category=wpc-louvers` → "Showing 2 products" including **"WPC Louver Panel 3D Charcoal"** (a special item). The flag is additive.
- **Special items link to their normal PDP (`productPath`) and category (`categoryParam`)** — runtime: first `/special-offers` card → `/products/wpc-louver-panel-3d-charcoal`; category deep-links resolve (verified via the additive check above).
- **Copy is enquiry-correct: "Special Products"/"curated", "Add to Enquiry List"; no deal/coupon/limited-time/Buy-Now language** — hero "Special Products" + "Curated picks" + "…not limited-time deals"; grep of the changed storefront files finds the forbidden terms only inside comments that state they were removed.
- **Graceful empty state when no products are special** — coded: `products.length === 0` → "No special products right now — browse our full catalogue" → `/products` (structure confirmed; the seed has 10 specials so the populated path renders live).
- **Brand blue `#1885d8` primary, gold `#fa9c4c` for the badge; premium/minimal; dual-mode identical in mock** — runtime: hero computed `linear-gradient(135deg, rgb(24,133,216) 0%, rgb(16,105,176) …)`; kicker + badges computed `rgb(250,156,76)`; the page reads only through `apiService.*` + `extractData`.

**Bonus runtime checks (§10):** clicking a `/special-offers` card's "Add to Enquiry List" grew `localStorage["cart"]` with the correct line (e.g. `Dr. Fixit Pidicrete URP Waterproof Coating`, price 950, qty 1); the console had **zero** errors across homepage → `/special-offers` → `/products`.

---

## 4. §11 KEEP-invariants — all intact

- **Dual-mode API + `extractData()`** — `getSpecial` keeps `IS_MOCK_API` branching + `extractData`; no `db.json` writes.
- **Special is a badge, not a category** — never filtered out of normal listings; additive-listing check confirmed live; `categoryId` untouched.
- **`ProductCard` reuse** — the single canonical, domain-agnostic card; the badge is additive/optional; no "special" fork; the two forked local cards were **deleted**, not multiplied.
- **Enquiry-list wiring** — cards add via `buildCartItem` → `addToCart` (localStorage `"cart"`); no purchase/coupon/wallet path (runtime-confirmed increment).
- **Enquiry-correct language** — all coupon/deal/countdown/Buy-Now copy removed from `/special-offers`; "Add to Enquiry List" everywhere.
- **Route stability** — `/special-offers` path unchanged in `App.js`; no Special-Offers **admin** route re-added.
- **Per-component CSS Modules + storefront/admin palette separation**; subtle framer-motion; skeleton + empty states preserved.

---

## 5. Findings — no defects; one sanctioned cross-prompt touch + carry-forwards

### 5.1 — SANCTIONED (spec §6): `Home.js` repointed at the shared `getSpecial`
Prompt-10 left the homepage Special band on `getAll().filter(special)`; its own re-grounding note (`10c` §5) anticipated "prompt 11 may add a dedicated `getSpecial`." Prompt-11 §6 requires the homepage band and `/special-offers` to "share the same data source." So `Home.js` was repointed to `apiService.products.getSpecial(8)` and the now-redundant client-side `.filter` removed — a 1-line-net simplification, guards intact, no behavioural change (the band still renders the same 8 specials through the same shared card, now badged). Sanctioned coordination, not a defect.

### 5.2 — CARRY-FORWARD: the `/products` listing still uses its own card (prompt 12 owns it)
The badge, the enquiry button and the clean price appear on **every surface that renders the shared card** — today the homepage Featured/Special bands and `/special-offers`. The `/products` listing page still renders its **own** card with "% OFF"/"Add to Cart" (seen live at `/products?category=wpc-louvers`). That page is **prompt 12's** to redesign onto the shared card; when it adopts the shared card, the "Special" badge and enquiry-correct copy flow there automatically with no further ProductCard change. The additive **data** rule already holds (special items are listed there). Not a Prompt-11 defect.

### 5.3 — DECISION (spec §4.4): the `useDealsConfig` gate was removed from `/special-offers`, not repurposed
§4.4 offered two options; per its stated preference ("if the deals admin is being removed elsewhere, prefer removing the `useDealsConfig` gate … and simply render the collection"), the gate was removed and the collection now always renders (graceful empty state when nothing is special). Consequence to record: the storefront nav (`Header`/`Footer`/`SidebarMenu`) **still** gates the `/special-offers` link on `useDealsConfig().enabled`, and `DealsConfigProvider`/`DealsConfigContext`/`AdminSpecialOffers` remain intact — so if an admin "disables deals," the nav link hides but the page still renders when reached directly. Removing the deals master-toggle, the nav gating and the deals **admin** entirely is owned by the admin-cleanup prompts (24/25/28/30); this prompt deliberately left them untouched to avoid stepping on those. Documented, not a defect.

### 5.4 — CARRY-FORWARD: `FeaturedProducts.js` is now correct/reusable but still unmounted
Prompt-10 inlined the homepage product bands (rendering the shared card directly), so `FeaturedProducts.js` is imported nowhere. Prompt-11 §3 owns making it correct: it is now a thin, enquiry-correct band over the shared card (no local card, no "% OFF", no "Add to Cart") — genuinely reusable — but remains **unmounted**, so it changes no runtime AC. Kept (not deleted) because it is the sanctioned reusable Featured band the spec names; a later prompt may mount it.

### 5.5 — CARRY-FORWARD (unchanged): pricing display is still the plain `sellingPrice`
The shared card shows a clean single `sellingPrice`; `priceType` `tiered`/`onEnquiry` products are not yet displayed differently — that is **prompt 15's** model (`showExactPrice`/`cardPriceMode`). Special items are correctly framed as curated, never discounted. Not a Prompt-11 concern.

---

## 6. What this closes

`11b` closes NEBM's **Featured & Special Products** surfaces: the one canonical card now carries the additive gold "Special" badge everywhere it renders, Featured and Special share a single dual-mode data source (`getSpecial`), and `/special-offers` is a premium curated collection — badged shared cards, curation tabs, NEBM blue/gold, no deals/coupons/countdown. Combined with Prompt-10's homepage bands, the Special-Products story is now consistent from the homepage band ("View All" → `/special-offers`) to the collection page. Prompt 12 (listing redesign onto the shared card — inheriting the badge), prompt 15 (pricing display) and the admin-cleanup prompts (24/25/28/30, retiring the deals config + nav gating) build directly on this.

---

*Post-execution verification against the live repo (2026-07-02). Build: `CI=true react-scripts build` → Compiled successfully (JS −3.11 kB → 384.05 kB, CSS −1.89 kB → 45.63 kB gzip; net −1,287 source lines across 8 files). Grep of the changed storefront files → forbidden deal/coupon/countdown/%-off/Buy-Now/Add-to-Cart wording appears only in "removed" comments. Runtime probe (preview Chromium): `/special-offers` h1 "Special Products", "Curated picks" gold `#fa9c4c`, blue hero `#1885d8→#1069b0`, 10 badged shared cards + "Add to Enquiry List", "All" + 10 curation tabs, first card → `/products/wpc-louver-panel-3d-charcoal`; homepage 9 gold badges across 16 shared cards; mock `/products?special=true` → 10; additive check `/products?category=wpc-louvers` lists the special WPC louver; add-to-enquiry grows `localStorage["cart"]` with the correct line; console error-free. Only the shared `ProductCard`, `api.js` (`getSpecial`), `FeaturedProducts`, `SpecialOffers` and `Home.js` changed; routes, providers, `db.json`, `utils/*` and the admin palette are untouched.*
