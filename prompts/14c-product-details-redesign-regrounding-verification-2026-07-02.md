# 14c — Product Details Redesign Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over the committed Prompt-14 work (`ce35213`) *and* its `14b` post-execution note.** Following the `06c`–`13c` precedent for a prompt that shipped with a full `b` note: **re-derive every claim in `14b` and in the Prompt-14 spec's §9/§11 independently from live source, seed data, git and a fresh build**, rather than trusting the note. Every material assertion was re-checked by **re-reading the six changed files plus the consumed surfaces, re-running the git/grep checks, re-inspecting the live seed/API, and re-building from scratch** — not by echoing `14b`. **No application code, tokens, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **all §9 acceptance criteria reproduce, and all `14b` claims hold** — "Buy Now" deleted everywhere (`handleBuyNow`/`buyNow`/`onBuyNow` gone from both `ProductDetails.js` and `AddToCartBar.js`), the primary action an **icon-only "Add to Enquiry List"** button (`aria-label` + `data-tip` tooltip, "Added ✓" micro-state) mirroring the shared `ProductCard` pattern, the sticky `AddToCartBar` retitled to the same icon action with Buy-Now removed, `TrustBadges` reconfigured to four **enquiry-safe capability signals** with the shipping/COD/returns resolver deleted, the old **Delivery & Returns** panel + its `shipping.getMethods()` fetch removed and replaced by a real **NEBM store-contact panel** (`settings.store` phone/email/address, `tel:`/`mailto:` links), pricing still delegating to `PriceBlock` (enquiry-safe note; the priceType-aware tiered/on-enquiry table is prompt 15), `unitType` added to the spec table, and `FrequentlyBoughtTogether` dropped. A fresh `CI=true react-scripts build` **compiles successfully** at **JS 383.14 kB gzip / CSS 45.67 kB gzip** (deterministic — identical asset hashes `main.1ae4a9f4.js` / `main.ddecc072.css` across two runs), reproducing `14b`'s absolute figures, and the build-reported **−1.1 kB JS / +189 B CSS** delta lands exactly on the Prompt-13 parent's `384.24 kB / 45.48 kB` (13b's recorded figures). The diff's **364 ins / 263 del (+101 lines)** across 6 files reproduces exactly.
>
> **Companion, not a rewrite.** Following `06c`–`13c`, this note verifies the committed work alongside it and edits nothing — the committed `ProductDetails.*`, `TrustBadges.js`, `AddToCartBar.*` and `tokens.js` are left byte-identical; the findings in §7 are recorded for the owning prompts.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-14 was **redesign + subtract**: keep the component architecture, the slug + legacy-numeric redirect, the reviews blend and the honest stock logic; delete the purchase machinery (Buy Now, bundle-to-buy, delivery/returns); re-term the CTA and re-word the trust signals. This pass only re-reads, re-greps, re-inspects the seed, re-builds and re-asserts.

---

## 1. Method — re-execute, don't trust

`14b` asserts a three-way verification: a clean build, a full source re-read, and a live JSON-Server (:3001) data-contract probe (priceType spread; resolvable tiered + onEnquiry slugs; `settings.store` contact fields). Rather than accept those, this pass re-derived them:

1. **Diff footprint** — `git show ce35213 --numstat` (blast radius) + `git status --porcelain` (working tree clean) + lineage.
2. **Source re-read** — every value the spec §9 / §11 and `14b` assert read straight out of the **written** `pages/ProductDetails/ProductDetails.js` / `.module.css`, `components/storefront/TrustBadges.js`, `components/storefront/AddToCartBar.js` / `.module.css`, and `theme/tokens.js`.
3. **Contract check** — the consumed surfaces re-read at source (`products.getBySlug`/`getById`/`getReviews`/`getRelated` + `extractData`, `settings.get`, `hooks/useCart` `addToCart`, `context/WishlistContext`, `utils/categories.js` `categoryParam`, the shared `ProductGallery`/`VariantSelector`/`QuantityStepper`/`PriceBlock`/`RelatedProducts`/`ReviewsSection`, `theme/storefront-tokens.css` palette) to confirm every symbol/prop the PDP calls exists and is unchanged.
4. **Seed/API re-inspection** — the running JSON Server re-queried for the `priceType` distribution, resolvable slugs, and the `settings.store` contact the new panel reads.
5. **Grep** — a fresh sweep of the changed files for Buy-Now / shipping / COD / returns / bundle wording, and of `src` for stray references to the removed symbols.
6. **Build** — a fresh `CI=true react-scripts build` from the current tree (run twice to confirm deterministic hashes), reconciled against the Prompt-13 parent figures.

Every result below is the actual output of those runs. The **browser-only** observations (`getComputedStyle` colours, the add-to-enquiry `localStorage` increment, the rendered tooltip) are re-grounded **from source + build + the live API contract**, consistent with how `06c`–`13c` re-ran build/seed rather than the UI (see §8).

---

## 2. Diff footprint & lineage — reproduce exactly

- **Footprint.** `git show ce35213 --numstat` → exactly **six** files: `AddToCartBar.js` (**30/25**), `AddToCartBar.module.css` (**40/21**), `TrustBadges.js` (**35/69**), `ProductDetails.js` (**118/65**), `ProductDetails.module.css` (**116/36**), `theme/tokens.js` (**25/47**) — commit total **364 ins / 263 del (net +101)**, reproducing `14b` byte-for-byte. Routes, providers, `db.json`, `utils/*`, `services/api.js`, `PriceBlock`, the shared gallery/variant/quantity/reviews components and the admin palette are **absent from the diff**.
- **Lineage.** `ce35213^` = `1c01d68` (the Prompt-13 `13c` re-grounding note), whose tree is code-identical to Prompt-13's implementation `8a1db60` (the intervening `13b`/`13c` commits added only notes). So Prompt-14 sits directly on the shipped Prompt-13 tree — the correct baseline for the bundle delta.
- **Clean tree.** `git status --porcelain` is **empty** after the rebuilds (`build/` is gitignored), and HEAD is on `analysis/regrounding-verification-note` — so the verification left the tracked tree byte-identical.

---

## 3. What changed — reproduced at source

| File | Change re-grounded from the written file | ✓ |
|---|---|---|
| **`ProductDetails.js`** | Buy Now fully removed (no `handleBuyNow`, no `.buyNowBtn`, no `onBuyNow`). `handleAddToEnquiry` (renamed from `handleAddClick`) wraps the unchanged `handleAddToCart(options)` + `cartItem` shape. Primary CTA = icon-only `.enquiryBtn` in an `.enquiryAction` (`data-tip`) wrapper, `aria-label="Add to Enquiry List"`, `.enquiryDone` + "Added ✓" on add; wishlist kept beside. `<TrustBadges variant="grid" />` (no `shipping`/`settings` props); `<DeliveryReturnsInfo>` + `shipping` state + `shipping.getMethods()` removed; new `settings?.store`-guarded contact panel (`tel:`/`mailto:`). `PriceBlock` `taxNote` = enquiry-safe; `unitType` "Sold by" spec row added; `FrequentlyBoughtTogether` import/state/fetch/render removed. `fetchProduct()` slug + legacy-redirect **byte-identical**. | ✅ |
| **`ProductDetails.module.css`** | `.addToCartBtn`/`.addToCartDone`/`.buyNowBtn` dropped; `.enquiryAction`/`.enquiryBtn`/`.enquiryDone`/`.enquiryDoneText` + `::after` tooltip added (mirrors ProductCard); `.contactPanel`/`.contactTitle`/`.contactLead`/`.contactList`/`.contactRow`/`.contactLink`/`.contactText` added; mobile action row simplified. All `--sf-*` tokens; no `#667eea` (grep → 0). | ✅ |
| **`TrustBadges.js`** | Static enquiry-safe badges only: `resolveTrustBadgeDetail`/`b.dynamic`/`settings`/`shipping`/`.detail` removed; icon set trimmed to `shield`/`layers`/`headset`/`tag`; `aria-label="Why enquire with us"`. | ✅ |
| **`AddToCartBar.js`** | `onBuyNow` prop + Buy-Now button removed; `ctaLabel` default → "Add to Enquiry List"; icon button (clipboard-plus / check-on-added) in an `.addWrap` `data-tip` tooltip; `aria-label={ctaLabel}`. `IntersectionObserver` reveal, real price, out-of-stock disable preserved. | ✅ |
| **`AddToCartBar.module.css`** | `.buyNow` dropped; `.addBtn` reshaped to a square icon button; `.addWrap` + `::after` tooltip added. Mobile-first `@media` block preserved. | ✅ |
| **`tokens.js`** | `TRUST_BADGE_CATALOG` → `genuineMaterials`/`bulkQuantities`/`expertGuidance`/`priceOnEnquiry`; `STOREFRONT_CONFIG.trustBadges` re-pointed; `resolveTrustBadgeDetail`, `returnsWindowDays`, `aov.frequentlyBoughtTogether`, `aov.maxBundle` removed; ethics comment re-worded to the enquiry model; default export trimmed. | ✅ |
| **`PriceBlock` / `useCart` / `helpers.js` / `categories.js` / shared components** | **UNCHANGED** — not in the diff. `PriceBlock` still carries its honest compare/discount logic; `addToCart`, `buildCartItem`/`productPath`, `categoryParam`, the gallery/variant/quantity/reviews/related components byte-identical. | ✅ |

---

## 4. The CTA, trust rework & data contract — re-derived from the live seed/API

`14b` claims the CTA adds real selections, the contact panel shows real store data, and the seed carries all three priceTypes. Re-grounding against the live API the PDP reads:

- **All three priceTypes exist (exact 28 / tiered 32 / onEnquiry 10 = 70).** So the PDP renders every `priceType` today via the current `PriceBlock` (a price for exact/tiered, and the raw `price` for onEnquiry). This is exactly why the full priceType-aware **tiered table + "Price on Enquiry"** is a genuine prompt-15 concern, not a Prompt-14 gap — the delegation is deliberate (§7.1).
- **Resolvable slugs the PDP will render.** A tiered product `wpc-louver-panel-3d-charcoal` (`unitType:"piece"` → the new "Sold by" spec row renders) and an onEnquiry product `fosroc-brushbond-elastomeric-coating-20kg` both resolve via `getBySlug`.
- **The contact panel reads real data.** `settings.store` carries `name` ("North East Build Mart"), `phone` (`+91 86385 43526`), `phoneSecondary` (`+91 88762 89972`), `email` (`info@northeastbuildmart.com`) and `address` (`Lawkhuwa Road, Nagaon, …`) — so the panel's `tel:`/`mailto:` "enquire" links and address are honest, not hardcoded (the `settings?.store` guard hides it entirely if absent).
- **The CTA funnels through the shared enquiry wiring.** `handleAddToEnquiry` → `handleAddToCart()` builds the same `cartItem` (`${id}-${variantId}` or `String(id)`, price/comparePrice/currency/stock) and calls `addToCart(cartItem, quantity)` — the `"cart"` localStorage key is unchanged, so a PDP add merges with card/quick adds (the structural basis for `14b`'s live increment).

---

## 5. Prompt-14 §9 acceptance — re-derived against source + seed

Every §9 bullet, with how it was re-checked (all **PASS**; one delegated table noted):

- **`/products/<slug>` renders the redesigned PDP in Blue `#1885d8` / Gold `#fa9c4c`; `/products/<numeric-id>` resolves + redirects to the slug** — `fetchProduct()` legacy-numeric + canonical-redirect logic untouched; page/CSS entirely `--sf-*` (tokens resolve to `#1885d8`/`#fa9c4c`); slugs resolve live.
- **Primary action is an icon button with tooltip + `aria-label="Add to Enquiry List"`; click adds product + variant + quantity** — `.enquiryBtn` (`aria-label`, `data-tip`, no face text) → `handleAddToEnquiry` → `addToCart(cartItem, quantity)`.
- **No "Buy Now" on the PDP or `AddToCartBar`; `handleBuyNow`/`onBuyNow` gone** — grep of both files → only comments note the removal.
- **Pricing via `PriceBlock` (exact / tiered table / onEnquiry)** — delegated to the current `PriceBlock` (honest price + compare/discount for all three types); the full tiered **table** + "Price on Enquiry" is **prompt 15** per the codebase convention (`ProductCard.js`). Carry-forward, §7.1.
- **`ProductGallery` / `VariantSelector` / `QuantityStepper` / `ReviewsSection` / `RelatedProducts` work + re-skinned** — kept and rendered; token-styled; reviews blend / recently-viewed / honest stock preserved.
- **Trust/delivery panels: only honest enquiry-safe claims + NEBM contact — no shipping / free-shipping / COD / delivery ETA / returns** — `TrustBadges` = four capability signals; delivery/returns panel + shipping fetch removed; contact panel = real `settings.store`. Grep of the six changed files for the forbidden terms → matches only in "removed"-explaining comments.
- **Adding fires no payment/coupon/wallet/shipping side effects** — only `addToCart` (localStorage `"cart"`); no `orders.*`/`payment`/`coupon`/`wallet`/`shipping.*` path on the PDP.
- **Data via `IS_MOCK_API` + `extractData()`; toggling mock doesn't break** — `getBySlug`/`getById`/`getReviews`/`getRelated`/`settings.get` untouched; the live :3001 probe returned the products + settings the page consumes.

---

## 6. §11 KEEP-invariants — all intact

| Invariant (§11) | Re-grounded result | ✓ |
|---|---|---|
| **Dual-mode API + `extractData()`** | `getBySlug` mock/prod branches untouched; no `db.json` writes | ✅ |
| **Slug resolution + legacy numeric redirect** | `fetchProduct()` byte-identical; slug-canonical URLs | ✅ |
| **Reusable storefront components stay domain-agnostic + prop-compatible** | `ProductGallery`/`VariantSelector`/`QuantityStepper`/`PriceBlock`/`RelatedProducts`/`ReviewsSection` unchanged; `AddToCartBar`'s prop change has **no other caller** (grep: PDP-only) | ✅ |
| **No purchase side effects** | enquiry add calls only `addToCart`; no `orders.create`/`payment`/`coupon`/`wallet`/`shipping.*` | ✅ |
| **`cart` API namespace + `"cart"` localStorage key** | stable for server-sync fidelity (prompt 16) | ✅ |
| **Recently-viewed write, reviews blend, honest stock/low-stock** | preserved (unchanged in the diff) | ✅ |
| **CSS Modules + storefront/admin palette separation** | storefront-only diff; no admin file; subtle framer-motion + skeleton + not-found kept | ✅ |

---

## 7. Findings — `14b` claims reconciled; no code defect

### 7.1 — RECONCILE (`14b` §5.1): pricing delegates to the current `PriceBlock`; the tiered table is prompt 15's — sanctioned by codebase convention
Prompt-14 §5 references the "**extended** `PriceBlock` (prompt 15)", which does not exist yet. The codebase's own plan defers it: the shared `ProductCard` already delegates to `PriceBlock` with the comment *"the priceType-aware display … is layered on by prompt 15; PriceBlock is untouched here."* Re-grounding confirms `PriceBlock` is **absent from the diff** and renders an honest price for all three seed priceTypes today. So the tiered quantity-vs-price **table** + "Price on Enquiry" is a documented carry-forward to prompt 15, not a Prompt-14 defect.

### 7.2 — RECONCILE (build baseline): `14b`'s −1.1 kB / +189 B delta is against the Prompt-13 parent `1c01d68`
Two from-scratch builds of the current tree are deterministic (identical hashes `main.1ae4a9f4.js` / `main.ddecc072.css`, sizes **383.14 kB JS / 45.67 kB CSS**). The first build's reported **−1.1 kB JS / +189 B CSS** delta is measured against the pre-existing `build/` (the Prompt-13 tree), and lands exactly on **384.24 kB / 45.48 kB** — `13b`'s recorded Prompt-13 figures. The net JS shrink is the removed Buy-Now/FBT/delivery-panel/trust-resolver code net of the added contact panel + tooltip CSS; the small CSS bump is the new contact-panel + tooltip rules. To avoid disrupting a concurrent session's dev server that shares this working tree, the parent figure was reconciled from the build-reported delta + `13b`'s record rather than an in-place parent checkout (see §8). Documentary reconciliation, not a defect.

**Reproducibility caveat (audited 2026-07-03).** The recorded asset *hashes* are deterministic only within a single build environment: rebuilding the exact commit `ce35213` later (same `caniuse-lite 1.0.30001609`, react-scripts 5.0.1) yields `main.fd491cd5.js` / `main.8cb4de64.css`, **not** the hashes above — a few bytes of toolchain drift that leaves the gzip *sizes* stable to rounding. Built back-to-back in one isolated git worktree (so the shared tree/dev server were untouched), parent `1c01d68` = **384.23 kB JS / 45.47 kB CSS** and Prompt-14 `ce35213` = **383.12 kB JS / 45.67 kB CSS** — a reproducible **−1.11 kB JS / +195 B CSS**. The note's `+189 B` is CRA's byte-delta against `13b`'s in-environment parent record (`45.48`); a same-environment parent rebuild reads `45.47`, giving `+195 B`. So the *sizes* reproduce; the exact hashes and the byte-level CSS delta do not, as expected across dependency drift.

### 7.3 — CARRY-FORWARD (`14b` §5.3, prompt 30): `FrequentlyBoughtTogether` + `DeliveryReturnsInfo` are now orphaned
Re-grounding confirms neither is imported by any page (grep: only the storefront barrel re-exports them). They are bundle-to-buy / delivery-returns machinery the enquiry model drops; kept as files (still compile) rather than deleted, because wholesale ecommerce-module removal is **prompt 30's** job — mirroring prompt 11 leaving `FeaturedProducts` orphaned. Documented, not a defect.

### 7.4 — CARRY-FORWARD (`14b` §5.2): trust reworded via config; `DeliveryReturnsInfo` removed from the PDP
`TrustBadges` is re-skinned through `tokens.js` (its intended no-code mechanism) into four enquiry-safe capability signals; `DeliveryReturnsInfo` (entirely shipping/COD/returns) is removed from the PDP with its `shipping.getMethods()` fetch and replaced by the real store-contact panel. Sanctioned by §8 ("remove a panel empty of honest content"); the reusable components stay intact and prop-compatible.

### 7.5 — NEW DOCUMENTARY NIT: `TrustBadges.module.css` `.detail` is now dead CSS
With the dynamic sub-label removed, the `.detail` rule (a few bytes) is unused. Left in place to keep the diff tight; a later pass may prune it. Cosmetic, no effect — recorded, not a defect.

### 7.6 — SUPERSEDED SINCE (audited 2026-07-03): Prompt-15 has landed the deferred `PriceBlock` work
This note verifies commit `ce35213`, at which `PriceBlock` is unchanged and the priceType-aware tiered/on-enquiry table is future work (§5, §7.1). **Since this note was committed (`550a26a`), Prompt-15 (`016e34e`, "Add priceType-aware pricing display to PriceBlock") has been committed on this same branch**, implementing exactly that carry-forward: `PriceBlock.js` (+228), `PriceBlock.module.css` (+118), `ProductCard.js`, and the PDP's `PriceBlock` call in `ProductDetails.js` (adds `product={product}` + `mode="details"`). Consequence: a build of **current HEAD** reflects the Prompt-15 tree (**384.15 kB JS / 46.08 kB CSS**), *not* the Prompt-14 tree this note measures — the §8 figures reproduce only against `ce35213` in isolation (§7.2). The note stays accurate for the commit it verifies; this records that the work it defers to is now shipped, so a naïve rebuild at HEAD will not match the figures above.

---

## 8. Build & runtime-scope note — reproduce exactly

- **Build (Prompt-14).** Two fresh `CI=true npm run build` runs → **`Compiled successfully.`** (exit 0, warnings-as-errors — so it also proves the deletions left no orphaned imports/vars), deterministic assets `main.1ae4a9f4.js` = **383.14 kB gzip**, `main.ddecc072.css` = **45.67 kB gzip** — reproducing `14b`'s absolute figures.
- **Parent reconciliation.** The build-reported **−1.1 kB JS / +189 B CSS** delta against the pre-existing `build/` reconciles exactly to the Prompt-13 parent `384.24 kB / 45.48 kB` (`13b`'s record). A from-scratch **in-place** parent checkout was intentionally **not** performed this pass: another session's dev server shares this working tree, and flipping the tracked source to the parent and back would disrupt it. `build/` is gitignored, so the rebuilds left the tracked tree clean and HEAD on the branch.
- **Runtime scope.** `14b`'s *structural* claims (icon CTA + tooltip, Buy-Now removal, the reworded trust badges, the contact panel, the delegated `PriceBlock`, the slug redirect) are re-grounded here **from source + seed + build** rather than a fresh browser run — consistent with `06c`–`13c`. The **browser-only** observations (`getComputedStyle` → `rgb(24,133,216)` / `rgb(250,156,76)`, the add-to-enquiry `localStorage` increment, the tooltip render, "console error-free") were **not** re-executed this pass (concurrent dev server on :3000/:3001); their structural basis is confirmed — the blue/gold tokens resolve to `#1885d8`/`#fa9c4c` in source, every imported symbol resolves, the `data-tip`/`aria-label` pattern is identical to the shipped `ProductCard`, the `buildCartItem`→`useCart` add path is intact, the live API serves the products/settings the PDP reads, and the build compiles with no errors.

---

## 9. Conclusion

The committed Prompt-14 Product Details redesign is **faithful to the live repository, its own spec, and the `14b` post-execution note**. All §9 acceptance criteria reproduce under an independent re-run — Buy Now deleted everywhere, an icon-only "Add to Enquiry List" primary action (+ matching sticky bar) reusing the shared `ProductCard` tooltip pattern, `TrustBadges` reworked into four enquiry-safe capability signals, the delivery/returns panel + its shipping fetch replaced by a real NEBM store-contact panel, `unitType` in the specs, and the bundle-to-buy module gone — with the gallery/variant/quantity/reviews/related architecture, the slug + legacy-numeric redirect, dual-mode data flow and no-purchase-side-effects invariants all preserved. Two deterministic production builds compile cleanly at **JS 383.14 kB / CSS 45.67 kB**, reproducing the **−1.1 kB JS / +189 B CSS** shift against the Prompt-13 parent (net +101 source lines across 6 files). The six findings are reconciliations/nuances, not defects: the sanctioned `PriceBlock` delegation with the tiered/on-enquiry table owned by prompt 15 (§7.1), a build-baseline reconciliation + hash/delta reproducibility caveat (§7.2), the config-reworded trust + removed delivery panel (§7.4), the orphaned FBT/delivery components owned by prompt 30 (§7.3), a dead-CSS nit (§7.5), and the note that Prompt-15 has since shipped the deferred `PriceBlock` work so a HEAD rebuild no longer matches these figures (§7.6). Prompt-14 is enquiry-correct and behaviourally sound.

---

*Re-grounding complete against the live `pages/ProductDetails/ProductDetails.js`/`.module.css`, `components/storefront/TrustBadges.js`, `components/storefront/AddToCartBar.js`/`.module.css`, `theme/tokens.js` and the consumed `PriceBlock`, `useCart`, `utils/helpers.js`, `utils/categories.js`, `theme/storefront-tokens.css`, the live JSON-Server (:3001) + `db.json` (2026-07-02). No files changed except this note. Buy Now removed (PDP + AddToCartBar) · icon-only "Add to Enquiry List" CTA (`aria-label` + `data-tip`, "Added ✓") mirroring ProductCard · TrustBadges → 4 enquiry-safe signals, shipping/COD/returns resolver deleted · DeliveryReturnsInfo + `shipping.getMethods()` removed → real NEBM store-contact panel (`settings.store` phone/email/address, tel:/mailto:) · pricing delegates to PriceBlock (tiered/on-enquiry table = prompt 15) · unitType spec row · FrequentlyBoughtTogether dropped · seed priceType exact 28 / tiered 32 / onEnquiry 10 = 70 · commit `ce35213` = 6 files, 364/263 (+101), parent `1c01d68` · `CI=true react-scripts build` → Compiled successfully, JS 383.14 kB / CSS 45.67 kB, −1.1 kB JS / +189 B CSS vs Prompt-13 parent (384.24 / 45.48) · working tree clean. Six reconciliations/nuances in §7 — no code defect; hashes/CSS-delta reproduce within-environment only (§7.2) and Prompt-15 `016e34e` has since landed the deferred `PriceBlock` work, so a HEAD rebuild reads 384.15 kB JS / 46.08 kB CSS (§7.6).*
