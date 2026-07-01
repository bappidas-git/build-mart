# 14 — Product Details Redesign

## 1. Objective

Redesign the product detail page (PDP) `src/pages/ProductDetails/ProductDetails.js` + its `ProductDetails.module.css` for **North East Build Mart (NEBM)**. Keep the strong, component‑driven architecture (`ProductGallery`, `VariantSelector`, `QuantityStepper`, `RelatedProducts`, `ReviewsSection`) and rebuild it around the **enquiry** model: pricing delegates to the extended `PriceBlock` (prompt 15), the primary action becomes an **"Add to Enquiry List" icon button with the tooltip "Add to Enquiry List"** surfaced via `AddToCartBar`, **"Buy Now" is removed entirely**, and trust/delivery panels are **re‑worded** to drop all purchase promises (no shipping, no returns, no COD). Resolve the product by slug (with the legacy numeric redirect preserved). This is a redesign + terminology pivot, not a rewrite of the data logic.

## 2. Context / background

NEBM is an e‑commerce‑*style* **enquiry** platform for building materials (React CRA + JSON Server dev / Laravel prod). Customers browse and **enquire** — they never buy, pay, check out, ship, or return. Facts you need:

- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phone: +91 86385 43526 · +91 88762 89972.
- **Primary Blue:** `#1885d8`; **Accent Gold/Orange:** `#fa9c4c`. Apple‑minimal, generous white space, soft shadows, mobile‑first.
- **Terminology (storefront UI):** "Cart" → **Enquiry List**; "Add to Cart" → **Add to Enquiry List** (icon button + tooltip "Add to Enquiry List"); **"Buy Now" → removed**; "Checkout" → **Submit Enquiry**. Users **cannot** pay/checkout‑to‑buy/ship/return.
- **Pricing model:** `priceType: "exact" | "tiered" | "onEnquiry"`, `unitType`, `minQty`, `priceTiers[{minQty,price}]`, flags `showExactPrice`, `showTieredPricing`, `cardPriceMode`. The PDP shows the **full** pricing (including the tier table) via `PriceBlock` — see prompt 15.

Sibling prompts: 12 (listing/card), 13 (search/filter), 15 (pricing display), 16 (Enquiry List drawer/state). The PDP is assembled from `src/components/storefront/*` — keep those components reusable.

## 3. Files & folders to inspect

- `src/pages/ProductDetails/ProductDetails.js` + `ProductDetails.module.css` — the PDP (redesign here).
- `src/components/storefront/ProductGallery.js` — media/thumbnails/zoom (keep).
- `src/components/storefront/VariantSelector.js` — visible swatch/tile variant picker (keep).
- `src/components/storefront/QuantityStepper.js` — stock‑aware +/- control (keep).
- `src/components/storefront/PriceBlock.js` — pricing (extended in prompt 15; PDP passes the full‑tier mode).
- `src/components/storefront/AddToCartBar.js` — sticky mobile action bar (retitle CTA + drop Buy Now).
- `src/components/storefront/RelatedProducts.js` — "You may also like" (keep; card action becomes Add‑to‑Enquiry per prompt 12).
- `src/components/storefront/ReviewsSection.js`, `SocialProof.js`, `TrustBadges.js`, `DeliveryReturnsInfo.js` — reviews + trust/delivery panels (re‑word).
- `src/components/storefront/index.js` — barrel.
- `src/hooks/useCart.js` → `addToCart` (from `CartContext`).
- `src/services/api.js` — `products.getBySlug` (line ~887), `getById` (~880), `getReviews` (~942), `getRelated` (~957), `settings.get`, `shipping.getMethods`; `extractData()`.
- `src/utils/categories.js` — `categoryParam` (breadcrumb).

## 4. Step-by-step implementation instructions

1. **Keep slug resolution + legacy redirect.** `fetchProduct()` already detects a legacy numeric slug (`/^\d+$/`), calls `apiService.products.getById` vs `getBySlug`, falls back across the two, and canonical‑redirects to `/products/<slug>` when the URL differs. Preserve this exactly.
2. **Remove "Buy Now" entirely.** Delete `handleBuyNow`, the `styles.buyNowBtn` button in `actionButtons`, and the `onBuyNow` prop passed to `AddToCartBar`. No purchase path may remain anywhere on the PDP.
3. **Primary action → Add to Enquiry List (icon button + tooltip).**
   - Replace the primary "Add to Cart" button with an **icon button** whose `aria-label` and visible **tooltip** read **"Add to Enquiry List"**. Use `@iconify/react` (e.g. `mdi:playlist-plus` / `mdi:clipboard-plus-outline`) or a crisp inline SVG. No visible "Add to Cart"/"Buy Now"/"Add to Enquiry List" *text* on the button face; the confirmation micro‑state can read "Added ✓".
   - Keep `handleAddToCart(options)` and its `cartItem` shape (id `${productId}-${variantId}` or `String(productId)`, `productId`, `slug`, `variantId`, `variantName`, `name`, `image`, `price`, `comparePrice`, `currency:"INR"`, optional `stock`). Rename the click handler to `handleAddToEnquiry` for clarity; it still calls `addToCart(cartItem, quantity, options)`.
   - Keep the wishlist button beside it.
4. **`AddToCartBar` (sticky mobile bar).** Change its default `ctaLabel`/rendering to an **icon + tooltip "Add to Enquiry List"** and **remove the Buy Now button** (`onBuyNow` prop + `styles.buyNow`). It still reveals on scroll via the `IntersectionObserver` on `anchorRef` (`buyBoxRef`), shows the real selected price, and disables when out of stock. Pass only `onAddToCart={handleAddToEnquiry}` from the PDP.
5. **Pricing delegates to `PriceBlock` (prompt 15).** Replace the current single‑price `PriceBlock` call with the extended one that renders **exact / tiered / onEnquiry** from the product's pricing fields. On the PDP, request the **full** mode: for tiered products render the **quantity‑vs‑price table** (`priceTiers[{minQty,price}]` + computed per‑unit discount + `minQty`); for onEnquiry render **"Price on Enquiry"**; for exact render the fixed price with `unitType` and honest compare/discount. Respect `showExactPrice`, `showTieredPricing`. Remove the checkout‑implying tax note copy ("calculated at checkout"); reword to a neutral, enquiry‑safe note or omit.
6. **Product info layout.** Keep name, brand, `SocialProof` (real ratings only), SKU line, `shortDescription`, `VariantSelector` (visible swatches/tiles — never a dropdown), `QuantityStepper` (stock‑aware, honours `minQty` from the pricing model where set), honest stock status ("In Stock" / "Only N left" / "Out of Stock"). Redesign visuals to Apple‑minimal in the Blue/Gold palette.
7. **Specs + description tabs.** Keep the Description tab (`product.description`) and the Specifications table (brand, SKU, weight, dimensions, category, tags). Add `unitType` to the spec table when present. Keep the Reviews tab and `ReviewsSection`.
8. **Trust / delivery panels — re‑word (no purchase promises).** `TrustBadges` and `DeliveryReturnsInfo` currently promise shipping/COD/returns. Re‑word them to enquiry‑safe trust signals: e.g. "Genuine building materials", "Bulk quantities available", "Expert guidance", "Enquire for best price & availability", plus NEBM contact (phone/address) and a link to enquire. **Remove** any shipping cost, free‑shipping threshold, COD, delivery‑ETA, and returns/refund promises. If a panel becomes empty of honest content, remove it rather than fabricate claims.
9. **Related products.** Keep `RelatedProducts` ("You may also like") from `apiService.products.getRelated`. Its card action is the Add‑to‑Enquiry icon button (prompt 12). Keep `ReviewsSection`. **Remove** `FrequentlyBoughtTogether` if it implies bundle‑to‑buy pricing, OR reword it to a neutral "Often enquired together" that only adds items to the Enquiry List (no combined‑price "buy the bundle" CTA).
10. **Breadcrumb** stays `Home › <Category> › <Product>` using `categoryParam(category)` for the category link. **Re‑skin** the whole page to `--sf-*` Blue/Gold tokens; drop `#667eea`.

## 5. UI/UX requirements

- **Brand tokens:** `#1885d8` (primary action, links, focus), `#fa9c4c` (accents, badges, hover). Apple‑minimal, mobile‑first, soft shadows, rounded panels.
- **Primary action is an icon button with tooltip "Add to Enquiry List"** — no Buy Now, no button text.
- `ProductGallery` (thumbnails + hover‑zoom), `VariantSelector` (visible swatches/tiles), `QuantityStepper` (stock/minQty‑aware) preserved and re‑skinned.
- Tiered pricing renders a clear **quantity‑vs‑price table** on the PDP (via `PriceBlock`); onEnquiry renders "Price on Enquiry".
- Trust/delivery panels contain only honest, enquiry‑safe claims + NEBM contact — no shipping/returns/COD.
- Sticky mobile action bar reveals on scroll and mirrors the primary Add‑to‑Enquiry action only.
- Reviews section preserved; social proof shows only real ratings.

## 6. Data & API requirements

- **Dual‑mode rule (restate):** keep `IS_MOCK_API` branching and route responses through `extractData()`, preserving JSON‑shape fidelity so the same PDP works against JSON Server (`:3001`) and Laravel. `getBySlug` returns `response.data[0]` in mock and `extractData` in prod — keep both.
- **APIs:** `apiService.products.getBySlug(slug)` (line ~887), `getById(id)` (~880), `getReviews(productId)` (~942, approved‑only), `getRelated(product, limit)` (~957); `apiService.categories.getById`, `apiService.settings.get`. **Do not** call `apiService.shipping.getMethods()` for purchase promises — if you drop the delivery panel, drop that fetch too (or keep it dormant/unused).
- **Product fields:** `id, name, slug, sku, brand, images[], price, comparePrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], rating, totalReviews, description, shortDescription, categoryId` plus pricing: `priceType, unitType, minQty, priceTiers[], showExactPrice, showTieredPricing, cardPriceMode`.
- **Add‑to‑Enquiry** funnels through `addToCart` (from `useCart`); the `cart` API namespace and `"cart"` localStorage key are intentionally unchanged for sync fidelity (see prompt 16). **No** payment/coupon/wallet/shipping side effects.

## 7. Admin panel requirements

N/A. Pricing fields, `special`, and product content are authored in the admin (separate prompts); the PDP only reads them.

## 8. Storefront requirements

- Slug‑resolved PDP with legacy numeric redirect preserved.
- No "Buy Now" anywhere; primary action is the Add‑to‑Enquiry icon button + tooltip.
- Pricing via extended `PriceBlock` (exact/tiered table/onEnquiry).
- Trust/delivery panels re‑worded — no shipping/returns/COD/payment promises.
- Gallery, variant selector, quantity stepper, reviews, related products preserved.

## 9. Acceptance criteria

- [ ] `/products/<slug>` renders the redesigned PDP in the Blue `#1885d8` / Gold `#fa9c4c` palette; `/products/<numeric-id>` resolves and canonical‑redirects to the slug.
- [ ] The primary action is an **icon button with the tooltip "Add to Enquiry List"** (`aria-label="Add to Enquiry List"`); clicking it adds the current selection (product + variant + quantity) to the Enquiry List.
- [ ] **No "Buy Now"** button exists on the PDP or in the sticky `AddToCartBar`; `handleBuyNow`/`onBuyNow` are gone.
- [ ] Pricing renders via the extended `PriceBlock`: exact shows fixed price + `unitType` + honest discount; **tiered shows a quantity‑vs‑price table** with per‑unit discounts + `minQty`; onEnquiry shows **"Price on Enquiry"**.
- [ ] `ProductGallery`, `VariantSelector` (visible swatches/tiles), `QuantityStepper`, `ReviewsSection`, and `RelatedProducts` all work and are re‑skinned.
- [ ] Trust/delivery panels contain only honest enquiry‑safe claims + NEBM contact — **no** shipping cost, free‑shipping, COD, delivery ETA, or returns/refund promises.
- [ ] Adding to the Enquiry List fires **no** payment/coupon/wallet/shipping side effects.
- [ ] Data flows through `IS_MOCK_API` + `extractData()`; toggling mock does not break the PDP.

## 10. Testing / verification steps

1. `npm run dev`.
2. Open a product via the listing → `/products/<slug>`. Confirm the redesigned layout, gallery, variant swatches, quantity stepper, and reviews.
3. Confirm the primary action is an **icon button**; hover → tooltip "Add to Enquiry List". Click → the item (with selected variant + quantity) lands in the Enquiry List (drawer/toast per prompt 16). Confirm **no Buy Now** anywhere, including the sticky mobile bar (scroll down to reveal it).
4. Verify pricing per product type: an **exact** product shows fixed price + unit; a **tiered** product shows the quantity‑vs‑price table + discounts; an **onEnquiry** product shows "Price on Enquiry" and the action still adds to the Enquiry List.
5. Confirm the trust/delivery area shows only enquiry‑safe claims + NEBM phone/address — no shipping/returns/COD/payment copy.
6. Visit `/products/<numeric-id>` → resolves and the URL rewrites to the slug.
7. JSON Server checks: `http://localhost:3001/products?slug=<slug>` returns the product; `http://localhost:3001/reviews?productId=<id>&status=approved` returns approved reviews. Confirm no new payment/order rows are created by adding to the Enquiry List.
8. Toggle dark mode; confirm legibility.

## 11. Notes on preserving existing functionality

- **Dual‑mode API:** keep `IS_MOCK_API` + `extractData()`; `getBySlug` mock vs prod branches stay.
- **Slug resolution + legacy numeric redirect** in `fetchProduct()` must remain; product URLs are slug‑canonical.
- **Reusable storefront components** (`ProductGallery`, `VariantSelector`, `QuantityStepper`, `PriceBlock`, `RelatedProducts`, `ReviewsSection`) stay domain‑agnostic and prop‑compatible; changes to `AddToCartBar` (drop Buy Now, retitle CTA) must not break other callers — grep for its usages.
- **No purchase side effects:** adding to the Enquiry List calls only `addToCart`; never `orders.create`, `createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`, or `shipping.*`.
- **`cart` API namespace + `"cart"` localStorage key** stay stable for server‑sync fidelity (prompt 16).
- Keep the recently‑viewed localStorage write, the reviews blend (consistent average), and the honest stock/low‑stock logic (`lowStockThreshold`).
- CSS Modules per component; storefront vs admin palette separation; reuse/refactor rather than rewrite.
