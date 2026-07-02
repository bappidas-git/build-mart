# 10b — Homepage Redesign Post-execution Verification (2026-07-02)

> **Prompt-10 execution deliverable — the NEBM homepage is redesigned into a premium, enquiry-correct Apple-minimal landing page: a single brand hero (logo + name + exact tagline + "Explore Products"/"Enquire Now" CTAs) → Shop by Category (12 top-level, slug-deep-linked) → Featured Products → a Special Products band (gold "Curated picks" kicker → `/special-offers`) → Why Choose NEBM → a blue CTA band → a Contact CTA (NEBM address + two `tel:` numbers). All purchase/deal merchandising is deleted — the Flash-Deals section, the `CountdownTimer`, the "Up to 50% Off / Limited Time" promo banner + 50%-OFF circle, and the "Trending Now — see what everyone is buying" band are gone; Special Products replaces the deals surface.** Bottom line: **every §9 acceptance criterion passes, verified two ways — a clean `CI=true react-scripts build` (Compiled successfully; JS bundle −2.17 kB → 387.31 kB, CSS −2.08 kB → 47.51 kB gzip, net −1,419 source lines) and a live Chromium runtime probe (h1 "North East Build Mart" + exact tagline; hero "Explore Products" → `/products` computed brand blue `rgb(24,133,216)` = `#1885d8`; "Enquire Now" → `tel:+918638543526`; 12 NEBM categories deep-linking `/products?category=<slug>`; 16 shared `ProductCard`s each with an "Add to Enquiry" icon-button (`title`/`aria-label` = "Add to Enquiry List"); Special band "Curated picks" kicker computed gold `rgb(250,156,76)` = `#fa9c4c` → "View All" `/special-offers`; CTA band computed blue gradient `#1885d8→#1069b0`; Contact CTA carries both NEBM `tel:` numbers; add-to-enquiry increments the list 0→1 with the correct product/price; **zero** "% off"/strikethrough/discount spans; console error-free).**

> **Nine-file, storefront-only change.** The diff touches exactly `Home.js`/`.module.css`, `HeroSection.js`/`.module.css`, `CTASection.js`/`.module.css`, the shared `storefront/ProductCard.js`/`.module.css`, and `utils/constants.js` — **net 618 ins / 2,037 del (−1,419)**, almost all from deleting the carousel + promo-card + flash-deals + local-`ProductCard` boilerplate. No routes, providers, `db.json`, `services/api.js`, `utils/categories.js`, or admin files are in the diff.

> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. `HeroSection`, `CTASection` and the shared `ProductCard` are **reused, not forked** — the page renders product bands through the one canonical `storefront/ProductCard`, the dual-mode `apiService` + `extractData` fetch keeps its `.catch(()=>[])`/`Array.isArray` guards, `categoryParam` still builds every category link, the `buildCartItem`→`useCart` quick-add path and the `localStorage["cart"]` key are untouched, and `WHY_CHOOSE_US`/`recentlyViewed` are kept.

---

## 1. Method — redesign in place, reuse the shared card, verify two ways

The starting homepage was a full ecommerce merchandising page (Hero carousel + deal-of-day promo cards → Flash Deals + live countdown → Shop by Category → Featured → 50%-OFF promo banner → Trending "everyone is buying" → Why-Choose → Recently-Viewed), rendering a **page-local** `ProductCard` with a "Add to Cart" button, a "% OFF" badge and a "Quick View" overlay. Prompt-10 wants the opposite: one clean brand hero, category/featured/special surfaces, and a contact CTA — all enquiry-correct, all through the **shared** `storefront/ProductCard`. So the work was largely **subtractive**: delete the carousel/promo/flash/countdown/trending code, rebrand the hero, repurpose the CTA band, and wire the Featured/Special bands to the canonical card. Verification is two independent passes over the **written** files: (a) `CI=true react-scripts build` → *Compiled successfully*; (b) a live runtime probe in the preview Chromium reading the DOM + `getComputedStyle` (section order, category count/links, card buttons, kicker/CTA colours, tel links, and an actual add-to-enquiry click). `preview_screenshot` timed out on the headless renderer's pinned viewport (the same environment quirk recorded in `09b` §1), so proof is from DOM/CSS probes — viewport-independent and, per the tooling's own guidance, preferred over screenshots for verifying text, structure and colour.

---

## 2. What changed — reproduced at source

| File | Change | ✓ |
|---|---|---|
| **`HeroSection.js`** | Generic multi-banner **deal carousel + promo sidebar + hardcoded category quick-bar** replaced by a single NEBM brand hero: main logo (`LOGO_URL`), `APP_NAME`, `BRAND_TAGLINE`, primary "Explore Products" → `/products` and secondary "Enquire Now" → `tel:` (`BRAND_PHONE_1`). Optional admin hero image retained via `banners.getAll()` (first entry with `image`) behind a legibility scrim; degrades silently to the branded gradient. Dropped `defaultBanners`, `categoryIconMap`/`categoryColorMap`, auto-slide/arrows/dots, `AnimatePresence`, `useNavigate`, `categoryParam`. | ✅ |
| **`HeroSection.module.css`** | Rewritten (−≈500 lines): one centred brand hero on `--sf-*` tokens (radial blue-soft tint), `clamp()` type scale, pill CTAs (blue primary w/ gold focus ring, outlined secondary), image-scrim + light-text overrides, mobile stack. | ✅ |
| **`Home.js`** | Removed `CountdownTimer`, `ScrollRow`, the page-local `ProductCard`/`StarRating`, the Flash-Deals section, the 50%-OFF promo banner, and the Trending band. New section order: Hero → Shop by Category (top-level `!parentId && isActive`) → Featured (`getFeatured(8)`) → **Special Products** (`getAll()`+`.filter(special).slice(0,8)` → `/special-offers`) → Why-Choose → `<CTASection/>` → Contact CTA (`BRAND_ADDRESS` + two `tel:`) → Recently-Viewed. Product bands render the shared `ProductCard`; quick-add funnels `buildCartItem`→`useCart` unchanged. | ✅ |
| **`Home.module.css`** | Rewritten (−≈700 lines) on `--sf-*` tokens (dark mode now follows `body.dark` automatically, no per-rule `.dark`): section/kicker/grid, category cards, `.specialSection` subtle gold tint, trust grid, contact-CTA card, skeletons. Deleted flash/countdown/promo/local-card/scroll/star CSS. | ✅ |
| **`CTASection.js` / `.module.css`** | Defaults reworded to NEBM enquiry copy ("Building something? Let's talk materials." → "Browse Products" `/products`); re-skinned from the gold→gold gradient to the **blue** `--sf-gradient-primary` with a white pill button that gains a **gold** accent ring on hover. | ✅ |
| **`storefront/ProductCard.js` / `.module.css`** (shared — "coordinate" work, see §6.1) | "Add to Cart" text button → **"Add to Enquiry"** icon-button (list-plus SVG + `title`/`aria-label` "Add to Enquiry List"), same `buildCartItem`/out-of-stock wiring; removed the red **"% OFF" discount badge**; stopped feeding `comparePrice` to `PriceBlock` so the card shows a **clean single price** (no strikethrough/"% off"). Removed the now-orphaned `.discountBadge` CSS. `PriceBlock` itself untouched. | ✅ |
| **`utils/constants.js`** | Added `BRAND_TAGLINE` (exact NEBM line), `BRAND_ADDRESS`, `BRAND_PHONE_1`, `BRAND_PHONE_2`; reworked `WHY_CHOOSE_US` to four building-materials trust items (Wide Catalogue / Bulk & Tiered Pricing / Trusted Brands / Local Delivery — no fabricated stats/returns/payments). `APP_TAGLINE` (About eyebrow) and `SUPPORT_*` (Footer) left for their owner prompts. | ✅ |

---

## 3. Prompt-10 §9 acceptance — verified against the written files + live runtime

Every §9 bullet, with how it was checked (all **PASS**):

- **Hero shows NEBM logo, name, exact tagline, "Explore Products" CTA + a contact CTA; no gradient-carousel/countdown** — runtime: `<h1>` = "North East Build Mart"; a `<p>` renders "Deals in all kinds of building materials for interior and exterior use."; `a[href="/products"]` computes `background-color: rgb(24,133,216)`; `tel:+918638543526` present. No carousel/promo/countdown DOM remains.
- **"Shop by Category" from `categories.getAll()`, each → `/products?category=<slug>`** — runtime returned **12** `a[href*="/products?category="]` in seeded order (`wpc-louvers`, `polycarbonate-sheets`, `frp-sheets`, …), built via `categoryParam`; no hardcoded list.
- **Featured from `products.getFeatured()` using the shared `ProductCard` with an "Add to Enquiry List" icon-button** — 8 featured cards; sampled button `text:"Add to Enquiry"`, `title/aria-label:"Add to Enquiry List"`, `hasSvg:true`; "View All" → `/products?sort=featured`.
- **Special Products band renders `special:true`, links `/special-offers`, gold "Special" badge (badge = prompt 11)** — 8 special cards; "Curated picks" kicker computes `rgb(250,156,76)` = `#fa9c4c`; "View All" → `/special-offers`. (The gold **"Special" badge on the card** is prompt 11's addition — see §6.1.)
- **Flash Deals, `CountdownTimer`, "Up to 50% Off/Limited Time" banner, promo circle, discount-urgency copy removed** — none present in the DOM or source; `grep` of the changed files for `Add to Cart|Buy Now|Flash Deal|Countdown|Limited Time|Deal of the Day|% Off|everyone is buying|Trending Now` → **zero**.
- **No "Buy Now"/"Add to Cart" text or deal-timer/urgency/fake-social-proof copy on the homepage** — runtime `body.innerText` check: `pctOffInText:false`, `compareStrikethroughs:0`, `discountSpans:0`; no forbidden terms.
- **All fetches keep `.catch`/`Array.isArray` guards; failed call → empty section; skeletons while loading** — `Promise.all` with per-call `.catch(()=>[])`, `Array.isArray` guards on every setter; grid/category skeletons render while `loading`.
- **Brand blue `#1885d8` primary, gold `#fa9c4c` accents only; premium/minimal/soft-shadow; subtle motion** — blue on hero CTA + CTA band + contact button; gold confined to the Special "Curated picks" kicker + CTA hover ring + the `.specialSection` tint; framer-motion `whileInView` reveals preserved.
- **Renders identically in mock (JSON Server) via `apiService` + `extractData()`** — the page never calls JSON-Server URLs directly; all data flows through `apiService.categories.getAll`/`products.getFeatured`/`products.getAll`.

**Bonus runtime check (spec §10.4):** clicking a Featured card's "Add to Enquiry" grew `localStorage["cart"]` 0→1 with the correct line (`Dr. Fixit Pidicrete URP Waterproof Coating`, price 950, qty 1) — the quick-add path and storage key are intact.

---

## 4. §11 KEEP-invariants — all intact

- **Dual-mode API + `extractData()`** — data via `apiService.*` only; `IS_MOCK_API` branching untouched; no `db.json` writes.
- **Fetch guards** — `.catch(()=>[])` + `Array.isArray` preserved on every call → graceful empty sections.
- **Slug/category rules** — links stay `/products?category=${categoryParam(cat)}`; parent-includes-children resolution is downstream (untouched).
- **Enquiry-list wiring** — the shared card's quick-add still calls `buildCartItem(product)` through the same `useCart` add path; `localStorage["cart"]` key unchanged (runtime-confirmed add).
- **Shared components** — `HeroSection`, `CTASection`, `ProductCard` reused (not forked); the canonical card is now the only product card the homepage renders.
- **Enquiry-correct language** — no "Buy Now/Add to Cart/Checkout/Flash Deals/Deal-of-the-Day timer/% off urgency"; Special Products framed as a curated collection ("Curated picks"), not a countdown.
- **Recently Viewed** localStorage key (`recentlyViewed`) kept; rendered with the shared card.
- **Per-component CSS Modules** + storefront/admin palette separation; `/special-offers` route unchanged (owned by prompt 11).

---

## 5. Findings — no defects; one coordinated shared change + carry-forwards

### 5.1 — COORDINATED (spec-sanctioned): the shared `ProductCard` was made enquiry-correct now
Prompt-10 §4.3/§9 require the Featured band to use the **shared** `ProductCard` "with an 'Add to Enquiry List' icon-button" and §5/§9 forbid any "% off" urgency on the homepage — but that card is the single canonical card, and its enquiry-button + badge changes are nominally prompt 11's (§4.3 "coordinate with the enquiry-list/ProductCard prompts") and prompt 16's. Since the homepage renders this card, satisfying Prompt-10 **requires** touching it. I therefore did the minimal shared "coordinate" work: (a) "Add to Cart" → "Add to Enquiry" icon-button; (b) removed the red "% OFF" badge; (c) stopped feeding `comparePrice` to `PriceBlock` so the card shows a clean price. Left to their owners: the **gold "Special" badge** (prompt 11 §4.1), the **priceType-aware display** (exact/tiered/on-enquiry via `showExactPrice`/`cardPriceMode`, prompt 15), and the **cart drawer/toast copy** ("Added to Enquiry List", prompt 16). `PriceBlock` itself is untouched, so the PDP still shows a compare price until prompts 14/15. This is a net-positive, enquiry-correct change with no regression to any completed prompt (prompt 07 established the card's layout, not its discount display).

### 5.2 — NUANCE (spec-compliant): Iconify glyphs (trust + contact) resolve from the Iconify API at runtime
`@iconify/react` fetches `mdi:*` data from `api.iconify.design` on first use (then caches), so the Why-Choose and Contact-CTA icons paint a frame late and would be blank fully offline. This is the **established app pattern** (`WHY_CHOOSE_US` already rendered `mdi:*`; the SidebarMenu does the same per `09b` §6.2). Recorded, not a defect.

### 5.3 — CARRY-FORWARD: contact/tagline duplication until the footer/about/pricing prompts
- `SUPPORT_ADDRESS` (Footer) still holds the **generic Mumbai** default; the homepage now shows the correct **NEBM** address via the new `BRAND_ADDRESS`. Consolidating the Footer/Contact/Support onto `BRAND_*` is owned by prompts 23/24 — a pre-existing footer wrongness, not introduced here.
- `APP_TAGLINE` ("Quality products, great prices") is left unchanged because it doubles as the **About** hero eyebrow (prompt 22); the hero uses the dedicated `BRAND_TAGLINE`.
- **Pricing display:** the card shows the plain `sellingPrice`; products with `priceType` `tiered`/`onEnquiry` are not yet displayed differently — that's prompt 15's model (`showExactPrice`/`showTieredPricing`/`cardPriceMode` already seeded).

### 5.4 — CARRY-FORWARD: `FeaturedProducts.js` left untouched (dead import; prompt 11 owns it)
`FeaturedProducts` and `CTASection` were both imported nowhere before this prompt. The homepage now uses `CTASection` (rebranded) but renders its product bands directly through the shared `ProductCard`, so `FeaturedProducts.js` (which still contains a local "Add to Cart" card) remains **unused/unrendered**. Prompt 11 §3 explicitly owns repurposing it — left in place to avoid stepping on that prompt; it violates no runtime AC because it is not on the page.

---

## 6. What this closes

`10b` closes the **storefront landing page** for NEBM: a single premium brand hero, a slug-deep-linked category grid, Featured + Special Products bands rendered through the one canonical enquiry-correct `ProductCard`, a blue CTA band and an NEBM contact CTA — with every deal/countdown/urgency surface removed and gold used only as an accent. Combined with Prompt-08's header/nav and Prompt-09's category drawer, the storefront's top-of-funnel is now enquiry-correct end to end; prompt 11 (Special badge + `/special-offers` collection), prompt 12 (listing) and prompt 15 (pricing display) build directly on the shared card and the section scaffolding established here.

---

*Post-execution verification against the live repo (2026-07-02). Build: `CI=true react-scripts build` → Compiled successfully (JS −2.17 kB → 387.31 kB, CSS −2.08 kB → 47.51 kB gzip; net −1,419 source lines across 9 files). Grep of the changed files → zero cart/deal/countdown/% -off wording. Runtime probe (preview Chromium): h1 + exact tagline; hero "Explore Products" → `/products` (blue `#1885d8`); "Enquire Now" → NEBM `tel:`; 12 slug-linked categories; 16 shared `ProductCard`s with "Add to Enquiry" icon-buttons; Special "Curated picks" gold `#fa9c4c` → `/special-offers`; CTA band blue gradient `#1885d8→#1069b0`; Contact CTA with both NEBM `tel:` numbers; add-to-enquiry 0→1 with correct line; zero "% off"/strikethrough/discount spans; console error-free. Only `Home`, `HeroSection`, `CTASection`, the shared `ProductCard` and `constants.js` changed; routes, providers, `db.json`, `api.js`, `categories.js` and the admin palette are untouched.*
