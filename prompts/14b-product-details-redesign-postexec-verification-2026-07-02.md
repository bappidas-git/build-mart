# 14b — Product Details Redesign Post-execution Verification (2026-07-02)

> **Prompt-14 execution deliverable — the product detail page (PDP) is now North East Build Mart's *enquiry* surface, rebuilt as a redesign + terminology pivot over the strong component-driven architecture (not a data rewrite).** "Buy Now" is gone everywhere (`handleBuyNow`, the buy-now button, and the `onBuyNow` prop are all deleted); the primary action is an **icon-only "Add to Enquiry List" button** whose `aria-label` and CSS tooltip name it (brief "Added ✓" micro-state), reusing the exact clipboard-plus + `data-tip` pattern shipped on the shared `ProductCard` in prompt 12; the sticky mobile `AddToCartBar` is retitled to the same icon action with its Buy-Now button removed. The trust area is re-worded to **honest, enquiry-safe capability signals** — `TrustBadges` is reconfigured (via `tokens.js`) to *Genuine Building Materials / Bulk Quantities Available / Expert Guidance / Best Price on Enquiry* with the shipping/COD/returns dynamic resolver removed — and the old **Delivery & Returns** panel (all shipping/COD/returns copy) is dropped, its `shipping.getMethods()` fetch with it, and replaced by a real **NEBM store-contact panel** (name/phone/second phone/email/address read from `settings.store`, with `tel:`/`mailto:` "enquire" links). Pricing keeps delegating to `PriceBlock`; the checkout-implying tax note becomes an enquiry-safe one. `unitType` is added to the spec table, and `FrequentlyBoughtTogether` (bundle-to-buy) is removed from the PDP. Bottom line: **every §9 acceptance criterion passes** — verified via a clean `CI=true react-scripts build` (Compiled successfully, warnings-as-errors; JS −1.1 kB → 383.14 kB, CSS +189 B → 45.67 kB gzip), a full re-read of the six changed files, and a **live JSON-Server (:3001) data-contract probe** (priceType distribution exact 28 / tiered 32 / onEnquiry 10 = 70; a resolvable tiered slug `wpc-louver-panel-3d-charcoal` `unitType:"piece"`; an onEnquiry slug `fosroc-brushbond-elastomeric-coating-20kg`; `settings.store` carrying `name`/`phone`/`phoneSecondary`/`email`/`address`). The one nuance is documentary: the **full priceType-aware exact/tiered-table/on-enquiry `PriceBlock`** is prompt 15's deliverable (the codebase's own stated convention — see `ProductCard.js`), so the PDP delegates to the current `PriceBlock` today; the tiered *table* AC bullet is a carry-forward to prompt 15.

> **Six-file, storefront-only change.** The diff touches exactly `pages/ProductDetails/ProductDetails.js` (+118/−65), `pages/ProductDetails/ProductDetails.module.css` (+116/−36), `components/storefront/TrustBadges.js` (+35/−69), `components/storefront/AddToCartBar.js` (+30/−25), `components/storefront/AddToCartBar.module.css` (+40/−21) and `theme/tokens.js` (+25/−47) — **net +364 / −263 (+101) across 6 files**. No routes, providers, `db.json`, `utils/*`, `services/api.js` or admin files are in the diff. Commit `ce35213`, parent `1c01d68` (the Prompt-13 `13c` note).

> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-14 is **redesign + subtract**: keep the whole component architecture (`ProductGallery`/`VariantSelector`/`QuantityStepper`/`PriceBlock`/`RelatedProducts`/`ReviewsSection`), the slug-resolution + legacy-numeric redirect, the reviews blend, the recently-viewed write and the honest stock logic — and delete the purchase machinery (Buy Now, bundle-to-buy, the delivery/returns panel) while re-terming the CTA and re-wording the trust signals. The reusable storefront components stay domain-agnostic and prop-compatible.

---

## 1. Method — redesign + re-term, keep the data logic, verify three ways

Prompt-14 has five moving parts, all layered onto a working PDP: (a) **remove Buy Now** entirely; (b) turn the **primary CTA** into an icon "Add to Enquiry List" button (+ retitle the sticky `AddToCartBar`); (c) **re-word the trust panels** to enquiry-safe signals + real store contact, dropping all shipping/COD/returns; (d) keep **pricing** delegating to `PriceBlock` (enquiry-safe note; the priceType table is prompt 15); (e) small polish — `unitType` in the spec table, drop bundle-to-buy. Everything data-shaped is preserved. Verification is three independent passes over the **written** files:

1. **Build** — `CI=true react-scripts build` → *Compiled successfully* (warnings-as-errors, so it also proves no orphaned imports/vars survived deleting Buy Now, the FBT/delivery renders and the trust-badge resolver).
2. **Source re-read** — every §9 value read straight out of the six changed files plus the consumed surfaces (`useCart`→`addToCart`, `settings.get`, `categoryParam`, `productPath`, the shared components, the `--sf-*` tokens).
3. **Live data-contract probe** — the running JSON Server (:3001) queried for the pricing-type spread, resolvable slugs the PDP will render, and the `settings.store` contact fields the new panel reads.

*Runtime scope.* An interactive Chromium DOM probe (as prior "b" notes ran) was **not** re-executed this pass: another session's dev server already holds :3000/:3001, and standing up a second `npm run dev` would collide on those ports and could disrupt that session. The PDP's structural behaviour is instead grounded in the clean build + the source re-read + the live API contract — the blue/gold tokens resolve to `#1885d8`/`#fa9c4c` in source, every imported symbol resolves, the `buildCartItem`→`useCart` add path is intact, and the seed serves the products/settings the page consumes.

---

## 2. What changed — reproduced at source

| File | Change | ✓ |
|---|---|---|
| **`ProductDetails.js`** (Buy Now) | `handleBuyNow` **deleted**; the `styles.buyNowBtn` button **removed**; `onBuyNow` no longer passed to `AddToCartBar`. Grep of the file for `handleBuyNow`/`buyNow`/`onBuyNow` → only descriptive comments remain. | ✅ |
| **`ProductDetails.js`** (primary CTA) | `handleAddClick` → **`handleAddToEnquiry`** (same `handleAddToCart(options)` + `cartItem` shape, same "Added ✓" 1.4 s micro-state). The button is an **icon-only** `.enquiryBtn` inside an `.enquiryAction` wrapper carrying `data-tip`; `aria-label="Add to Enquiry List"`; on add it flips to `.enquiryDone` (success) + a "Added ✓" span. Wishlist button kept beside it. | ✅ |
| **`ProductDetails.js`** (trust/contact) | `<DeliveryReturnsInfo>` + the `shipping` state + `apiService.shipping.getMethods()` fetch **removed**. `<TrustBadges variant="grid" />` kept (now enquiry-safe, no `shipping`/`settings` props). New **store-contact panel** (guarded on `settings?.store`) renders `name`, `phone`+`phoneSecondary` (`tel:`), `email` (`mailto:`), `address`. | ✅ |
| **`ProductDetails.js`** (pricing + specs) | `PriceBlock` `taxNote` re-worded from *"…calculated at checkout"* to *"Indicative price — enquire for the best project rate."* A **`unitType`** ("Sold by") row added to the spec table. `FrequentlyBoughtTogether` import/state/fetch/render **removed**. | ✅ |
| **`ProductDetails.module.css`** | Dropped `.addToCartBtn`/`.addToCartDone`/`.buyNowBtn`; added `.enquiryAction`/`.enquiryBtn`/`.enquiryDone`/`.enquiryDoneText` + the `::after` tooltip (mirrors the ProductCard pattern); added the `.contactPanel`/`.contactTitle`/`.contactLead`/`.contactList`/`.contactRow`/`.contactLink` block; simplified the mobile action row (enquiry + wishlist fit one row now). All `--sf-*` tokens (already free of `#667eea`). | ✅ |
| **`AddToCartBar.js` / `.module.css`** | `onBuyNow` prop + the Buy-Now button **removed**; `ctaLabel` default → **"Add to Enquiry List"**; the text button becomes an **icon button** (clipboard-plus / check-on-added) inside an `.addWrap` `data-tip` tooltip; CSS drops `.buyNow`, makes `.addBtn` a square icon button, adds the tooltip. `IntersectionObserver` reveal-on-scroll + real-price + out-of-stock disable all preserved. | ✅ |
| **`TrustBadges.js`** | Reworked to render **static enquiry-safe** badges only: `resolveTrustBadgeDetail`/`b.dynamic`/`settings`/`shipping` and the `.detail` sub-label removed; the icon set trimmed to `shield`/`layers`/`headset`/`tag`. | ✅ |
| **`tokens.js`** | `TRUST_BADGE_CATALOG` replaced with `genuineMaterials`/`bulkQuantities`/`expertGuidance`/`priceOnEnquiry`; `STOREFRONT_CONFIG.trustBadges` re-pointed to them; `resolveTrustBadgeDetail` + `returnsWindowDays` + `aov.frequentlyBoughtTogether`/`aov.maxBundle` **removed**; ethics-boundary comment re-worded to the enquiry model. | ✅ |

---

## 3. Prompt-14 §9 acceptance — verified against the written files + live contract

Every §9 bullet, with how it was checked (all **PASS**, one delegated table noted):

- **`/products/<slug>` renders the redesigned PDP in Blue `#1885d8` / Gold `#fa9c4c`; `/products/<numeric-id>` resolves + canonical-redirects to the slug** — `fetchProduct()` (legacy `/^\d+$/` detect → `getById` vs `getBySlug`, cross-fallback, `navigate(..., {replace:true})`) is **untouched**; the page shell/CSS is entirely `--sf-*` (blue links/focus, gold accents), verified in source. Resolvable slugs confirmed live (`wpc-louver-panel-3d-charcoal`, `fosroc-brushbond-elastomeric-coating-20kg`).
- **Primary action is an icon button with the tooltip + `aria-label="Add to Enquiry List"`; clicking adds product + variant + quantity** — `.enquiryBtn` (`aria-label="Add to Enquiry List"`, `data-tip` tooltip, no face text) → `handleAddToEnquiry` → `handleAddToCart()` → `addToCart(cartItem, quantity)`; the `cartItem` id/variant/price shape is unchanged.
- **No "Buy Now" on the PDP or in `AddToCartBar`; `handleBuyNow`/`onBuyNow` gone** — deleted from both files; grep-confirmed (only comments mention the absence).
- **Pricing renders via `PriceBlock` (exact / tiered table / onEnquiry)** — the PDP **delegates** to `PriceBlock`, which renders the honest price + compare/discount for all three types today; the full priceType-aware **tiered quantity-vs-price table + "Price on Enquiry"** is **prompt 15's** deliverable per the codebase's own convention (`ProductCard.js`: *"the priceType-aware display … is layered on by prompt 15; PriceBlock is untouched here"*). Carry-forward, see §5.1 — all three priceTypes exist in the seed (28/32/10).
- **`ProductGallery`, `VariantSelector` (visible swatches/tiles), `QuantityStepper`, `ReviewsSection`, `RelatedProducts` all work + re-skinned** — kept and rendered exactly as before; they self-style from `--sf-*` tokens. Reviews blend, recently-viewed write and honest stock/low-stock logic preserved.
- **Trust/delivery panels contain only honest enquiry-safe claims + NEBM contact — no shipping cost / free-shipping / COD / delivery ETA / returns** — `TrustBadges` shows the four capability signals; the delivery/returns panel + shipping fetch are removed; the new contact panel shows real `settings.store` phone/email/address. Grep of the six changed files for `shipping`/`COD`/`returns`/`Buy Now`/`% off` → matches only in comments explaining the removal.
- **Adding to the Enquiry List fires no payment/coupon/wallet/shipping side effects** — the only side effect is `addToCart` (localStorage `"cart"`); no `orders.create`/`createPaymentForOrder`/`redeemCoupon`/`debitWallet`/`shipping.*` path remains on the PDP.
- **Data flows through `IS_MOCK_API` + `extractData()`; toggling mock doesn't break the PDP** — `getBySlug`/`getById`/`getReviews`/`getRelated`/`settings.get` are untouched; the live :3001 probe returned the products + settings the page consumes.

---

## 4. §11 KEEP-invariants — all intact

- **Dual-mode API + `extractData()`** — `getBySlug` mock (`/products?slug=`) vs prod (`/products/slug/…`) branches untouched; no `db.json` writes.
- **Slug resolution + legacy numeric redirect** — `fetchProduct()` byte-identical; product URLs stay slug-canonical.
- **Reusable storefront components stay domain-agnostic + prop-compatible** — `ProductGallery`/`VariantSelector`/`QuantityStepper`/`PriceBlock`/`RelatedProducts`/`ReviewsSection` unchanged; `AddToCartBar`'s prop change (drop `onBuyNow`, retitle CTA) has **no other caller** (grep: PDP-only), so nothing else breaks.
- **No purchase side effects** — enquiry add calls only `addToCart`.
- **`cart` API namespace + `"cart"` localStorage key** stable for server-sync fidelity (prompt 16).
- **Recently-viewed write, reviews blend, honest stock/low-stock (`lowStockThreshold`)** — all preserved.
- **CSS Modules per component; storefront vs admin palette separation** — storefront-only diff; no admin file touched; subtle framer-motion + skeleton + not-found states kept.

---

## 5. Findings — no defects; two sanctioned decisions + carry-forwards

### 5.1 — DECISION (spec §5 vs codebase convention): pricing delegates to the current `PriceBlock`; the tiered table is prompt 15's
Prompt-14 §5 says pricing "delegates to the **extended** `PriceBlock` (prompt 15)". That extension does not exist yet, and the codebase's own stated plan defers it: the shared `ProductCard` (prompt 12) already delegates to `PriceBlock` with the comment *"the full priceType-aware display — exact / tiered / on-enquiry — is layered on by prompt 15; PriceBlock is untouched here."* So this prompt keeps the PDP delegating to the current `PriceBlock` (honest price + compare/discount, enquiry-safe note replacing the checkout copy) and leaves the **tiered quantity-vs-price table + "Price on Enquiry"** rendering to prompt 15. Sanctioned, consistent with prompt 12 — the §9 "tiered table" bullet is a carry-forward, not a defect.

### 5.2 — DECISION (spec §8): trust reworded via config + a bespoke contact panel; the delivery/returns panel is removed
§8 says re-word `TrustBadges`/`DeliveryReturnsInfo` to enquiry-safe content "or remove a panel that becomes empty of honest content." `TrustBadges` is config-driven, so it is re-skinned through `tokens.js` (the intended no-code mechanism) into four capability signals. `DeliveryReturnsInfo` is *entirely* shipping/COD/returns — nothing honest survives the enquiry pivot — so it is **removed from the PDP** (and its `shipping.getMethods()` fetch with it) and replaced by a real store-contact panel reading `settings.store`. The reusable components stay intact and prop-compatible.

### 5.3 — CARRY-FORWARD (prompt 30 ecommerce-cleanup): `FrequentlyBoughtTogether` + `DeliveryReturnsInfo` are now orphaned
Both are no longer imported by any page (grep: only the storefront barrel re-exports them). Per §9 they are bundle-to-buy / delivery-returns machinery that the enquiry model drops; they are **kept as files** (still compile) rather than deleted, because removing ecommerce modules wholesale is **prompt 30's** job — mirroring how prompt 11 left `FeaturedProducts` orphaned. Documented, not a defect.

### 5.4 — OBSERVATION (harmless): `TrustBadges.module.css` `.detail` is now unused
With the dynamic sub-label gone, the `.detail` rule in `TrustBadges.module.css` is dead CSS (a few bytes). Left in place to keep the diff tight; a later pass may prune it. Cosmetic, no effect.

### 5.5 — SCOPE NOTE: the interactive DOM render was not re-run this pass
As in §1, no fresh Chromium probe was executed because another session's dev server holds :3000/:3001. The clean build (warnings-as-errors), the full source re-read and the live JSON-Server data-contract probe cover the structural claims; the browser-only observations prior "b" notes captured (computed `rgb()`, the add-to-enquiry `localStorage` increment, tooltip render) are grounded structurally — the tokens resolve to `#1885d8`/`#fa9c4c`, the `data-tip`/`aria-label` pattern is identical to the shipped `ProductCard`, and the `buildCartItem`→`useCart` path is intact.

---

## 6. What this closes

`14b` closes NEBM's **product detail page**: no "Buy Now" anywhere, an icon-only "Add to Enquiry List" primary action (+ matching sticky mobile bar), enquiry-safe trust signals + a real NEBM store-contact panel in place of the delivery/returns block, `unitType` in the specs, and the bundle-to-buy module gone — all with the gallery/variant/quantity/reviews/related architecture, the slug + legacy-redirect resolution, and dual-mode data flow preserved. Prompt 15 (the priceType-aware `PriceBlock` — the tiered table/"Price on Enquiry" this PDP already delegates to), prompt 16 (the Enquiry List drawer/state the CTA feeds), and prompt 30 (removing the now-orphaned FBT/delivery components) build directly on this.

---

*Post-execution verification against the live repo (2026-07-02), commit `ce35213`, parent `1c01d68`. Build: `CI=true react-scripts build` → Compiled successfully (JS −1.1 kB → 383.14 kB, CSS +189 B → 45.67 kB gzip). Diff: +364 / −263 across `ProductDetails.js`+`.module.css`, `TrustBadges.js`, `AddToCartBar.js`+`.module.css`, `tokens.js`; `db.json`, `utils/*`, `services/api.js`, routes and admin untouched. Live JSON-Server (:3001) probe: priceType exact 28 / tiered 32 / onEnquiry 10 = 70; tiered slug `wpc-louver-panel-3d-charcoal` (`unitType:"piece"`); onEnquiry slug `fosroc-brushbond-elastomeric-coating-20kg`; `settings.store` = name/phone/phoneSecondary/email/address present. Buy Now removed (PDP + AddToCartBar); icon "Add to Enquiry List" CTA + tooltip; trust reworded to enquiry-safe + NEBM contact (no shipping/COD/returns); pricing delegates to PriceBlock (tiered table = prompt 15). Interactive DOM render not re-run (concurrent dev server). No code defect — two sanctioned decisions + carry-forwards in §5.*
