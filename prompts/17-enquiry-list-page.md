# 17 — Enquiry List Page

## 1. Objective

Build a full‑page **Enquiry List** for **North East Build Mart (NEBM)** at the route `/enquiry-list`, repurposing the cart drawer/page pattern. It lists every product the customer wants to enquire about — image, name, brand, and price‑mode (via `PriceBlock`) — with **editable quantities**, **remove**, a friendly **empty state** (Icons8 illustration), and a single primary CTA **"Proceed to Submit Enquiry"** → `/checkout` (the Submit Enquiry flow, prompt 18). There are **no totals, no payment, no shipping**. It reads directly from `CartContext` (`cartItems`, `updateQuantity`, `removeFromCart`) and must slot into `src/App.js` routing without breaking provider nesting.

## 2. Context / background

NEBM is an enquiry platform for building materials (React CRA + JSON Server dev / Laravel prod). Customers build an Enquiry List and submit an enquiry with a note — they never buy, pay, ship, or use coupons. Facts you need:

- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Phone: +91 86385 43526 · +91 88762 89972.
- **Primary Blue:** `#1885d8`; **Accent Gold/Orange:** `#fa9c4c`. Apple‑minimal, generous white space, soft rounded cards, mobile‑first.
- **Terminology:** "Cart" → **Enquiry List**; "Checkout / Place Order" → **Submit Enquiry**; **no** "Buy Now"/payment/shipping/coupons.
- **Placeholder image:** `https://placehold.co/600x400/1a1a2e/FFFFFF?text=Product+Name`; **empty‑state:** use an **Icons8** illustration.

**State source:** `CartContext` (localStorage key `"cart"`, kept for sync fidelity — see prompt 16) exposes `cartItems`, `updateQuantity(id, qty)`, `removeFromCart(id)`, `getCartItemCount`, and `getCartTotal` (kept but **unused** — no totals on this page). Line ids come from `lineKey(productId, variantId)`. Sibling prompts: 16 (drawer/state rename), 18 (`/checkout` → Submit Enquiry).

## 3. Files & folders to inspect

- `src/App.js` — provider nesting (`ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`, storefront wrapped in `DealsConfigProvider`) and the storefront `<Routes>` block (around lines 97–125). Add the `/enquiry-list` route here.
- `src/components/CartDrawer/CartDrawer.js` — the row/quantity/remove/empty‑state pattern to repurpose (drawer already retitled in prompt 16).
- `src/components/storefront/QuantityStepper.js` — accessible +/- stepper (reuse for rows).
- `src/components/storefront/PriceBlock.js` — price‑mode rendering (exact/tiered/onEnquiry — prompt 15).
- `src/context/CartContext.js` — `cartItems`, `updateQuantity`, `removeFromCart`, `getCartItemCount`.
- `src/hooks/useCart.js` — `useCart` hook.
- `src/utils/helpers.js` — `productPath`, `truncateText`, `PLACEHOLDER_IMG`, `onImageError`, `formatCurrency`.
- `src/pages/Wishlist/Wishlist.js` (optional reference) — an existing full‑page list layout in the storefront to match structurally.

## 4. Step-by-step implementation instructions

1. **Create the page** `src/pages/EnquiryList/EnquiryList.js` + `EnquiryList.module.css` (per‑component CSS Module). Consume `useCart()` for `cartItems`, `updateQuantity`, `removeFromCart`, `getCartItemCount`. Do **not** read or render `getCartTotal` (no monetary total).
2. **Header / breadcrumb.** Page title **"Enquiry List"** with the item count (e.g. "3 products to enquire about") and a breadcrumb `Home › Enquiry List`. Apple‑minimal heading, Blue/Gold accents.
3. **Row list.** For each `item` in `cartItems`, render a soft rounded card row with:
   - Image linking to `productPath(item)` (fallback `PLACEHOLDER_IMG`, `onError={onImageError}`).
   - **Name** (`truncateText(item.name, 60)`, links to `productPath`), **brand** (if present), and **variant name** (if present).
   - **Price‑mode** via `<PriceBlock … mode="card" />` using the item's pricing fields (exact `₹X/unit`, tiered `From ₹X/unit`, or "Price on Enquiry"); if the cart line lacks full pricing fields, show the stored `item.price` in exact form or "Price on Enquiry" — never fabricate a discount.
   - **Editable quantity** via `<QuantityStepper value={item.quantity} onChange={(q)=>updateQuantity(item.id, q)} min={1} max={item.stock ?? Infinity} />` (stock‑capped, "No more stock available" title).
   - **Remove** button → `removeFromCart(item.id)` with a small trash icon and an exit animation (framer‑motion, consistent with the drawer).
4. **No totals / payment / shipping.** Do not render subtotal, shipping, free‑shipping progress, taxes, coupons, or any price total. A per‑line informational price is fine; an aggregate money total is not.
5. **Primary CTA.** A sticky/prominent **"Proceed to Submit Enquiry"** button → `navigate("/checkout")` (Submit Enquiry flow, prompt 18). Disable it when `cartItems.length === 0`. Optionally a secondary "Continue Browsing" → `/products`.
6. **Empty state.** When `cartItems.length === 0`, show a centered **Icons8** illustration, heading "Your Enquiry List is empty", subtext "Browse our building materials and add products you'd like a quote on.", and a **"Browse Products"** CTA → `/products`. Apple‑minimal, generous white space.
7. **Add the route.** In `src/App.js`, inside the storefront `<Routes>` (the block that already holds `/products`, `/checkout`, `/wishlist`), add `<Route path="/enquiry-list" element={<EnquiryList />} />` and the corresponding lazy/normal import. Do **not** alter the provider nesting or the admin routes. (Alternatively repurpose an unused route, but a dedicated `/enquiry-list` is cleanest; ensure the Header/BottomNav "Enquiry List" link points here.)
8. **Link entry points.** Point the drawer's optional "View Enquiry List" link (prompt 16) and any Header/BottomNav Enquiry List affordance to `/enquiry-list`.
9. **Re‑skin** to `--sf-*` Blue/Gold tokens (primary CTA blue with gold hover accent), soft rounded rows, dark‑mode aware. Respect `prefers-reduced-motion`.

## 5. UI/UX requirements

- **Brand tokens:** `#1885d8` (title accents, primary CTA, links), `#fa9c4c` (hover accents, badges). Apple‑minimal, mobile‑first, soft shadows, rounded rows.
- Rows: image, name, brand, variant, **`PriceBlock` price‑mode**, **`QuantityStepper`**, remove. No money total anywhere.
- Sticky primary CTA **"Proceed to Submit Enquiry"** → `/checkout`; disabled when empty.
- Empty state: **Icons8** illustration + "Browse Products" CTA.
- Responsive: comfortable single‑column list on mobile, roomy rows on desktop; dark‑mode legible.

## 6. Data & API requirements

- **Dual‑mode rule (restate):** this page is presentational over `CartContext`; the underlying `apiService.cart.*` sync keeps `IS_MOCK_API` branching + `extractData()` and JSON‑shape fidelity (JSON Server `:3001` ↔ Laravel). This page performs **no** direct API calls beyond what `CartContext` already does; edits go through `updateQuantity` / `removeFromCart`, which the context mirrors to the server (debounced) for logged‑in users.
- **State:** `cartItems` (lines keyed by `lineKey(productId, variantId)`), `updateQuantity(id, qty)`, `removeFromCart(id)`, `getCartItemCount`. `getCartTotal` is intentionally **not** used.
- **Fields per line:** `id, productId, slug, variantId, variantName, name, brand?, image, price, comparePrice, currency, quantity, stock?` plus any pricing fields (`priceType, unitType, minQty, priceTiers[]`) carried for `PriceBlock`.
- **Money:** any per‑line price uses `formatCurrency` (INR); no aggregate total.

## 7. Admin panel requirements

N/A (storefront page only).

## 8. Storefront requirements

- New `/enquiry-list` route rendering the full‑page Enquiry List from `CartContext`.
- Editable quantities + remove; price‑mode display; empty state; "Proceed to Submit Enquiry" → `/checkout`.
- No totals/payment/shipping; enquiry‑only terminology throughout.

## 9. Acceptance criteria

- [ ] `/enquiry-list` renders a full‑page Enquiry List reading from `CartContext` (`cartItems`).
- [ ] Each row shows image, name, brand, variant (when present), and price‑mode via `PriceBlock` (exact/tiered "From"/onEnquiry) — no fabricated discounts.
- [ ] Quantities are editable via `QuantityStepper` (stock‑capped) through `updateQuantity`; items removable via `removeFromCart` with an exit animation.
- [ ] **No** subtotal, total, shipping, taxes, or coupon UI anywhere; `getCartTotal` is not used.
- [ ] A **"Proceed to Submit Enquiry"** CTA navigates to `/checkout`; it is disabled when the list is empty.
- [ ] Empty state shows an **Icons8** illustration + "Your Enquiry List is empty" + a "Browse Products" CTA → `/products`.
- [ ] The `/enquiry-list` route is added in `src/App.js` inside the storefront `<Routes>` **without** changing provider nesting or admin routes.
- [ ] Palette is Blue `#1885d8` / Gold `#fa9c4c`; responsive; dark‑mode legible.
- [ ] Underlying dual‑mode cart sync still works (edits mirror to `apiService.cart.*` for logged‑in users).

## 10. Testing / verification steps

1. `npm run dev`.
2. Add several products via Add‑to‑Enquiry (listing/PDP), then visit `/enquiry-list` (via the drawer's "View Enquiry List" link or the Header affordance).
3. Confirm rows show image/name/brand/variant + price‑mode (test an exact, a tiered, and an onEnquiry product). Confirm **no** money total anywhere.
4. Edit a quantity (respecting stock) and remove an item → the list updates; the drawer count stays in sync (`getCartItemCount`).
5. Click **Proceed to Submit Enquiry** → navigates to `/checkout`.
6. Remove all items → the Icons8 empty state shows; the CTA is disabled; "Browse Products" → `/products`.
7. Reload → the list persists (localStorage `"cart"`). While logged in, `http://localhost:3001/cart?userId=<id>` mirrors edits after the debounce; confirm no `/payments` or `/orders` rows are created.
8. Confirm `/products`, `/products/:slug`, `/checkout`, and `/admin/*` routes all still resolve (provider nesting intact). Toggle dark mode.

## 11. Notes on preserving existing functionality

- **Routing + provider nesting:** add `/enquiry-list` inside the existing storefront `<Routes>` only; do not touch the `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider` order or the `DealsConfigProvider` wrap, and do not disturb `/admin/*`.
- **State contract:** read `cartItems` / `updateQuantity` / `removeFromCart` / `getCartItemCount` from `CartContext`; do not rename them. `getCartTotal` stays defined but unused here.
- **Storage + dual‑mode sync:** `localStorage["cart"]` and `apiService.cart.*` (`IS_MOCK_API` + `extractData()`) are unchanged; edits go through the context so the debounced server mirror keeps working.
- **No purchase surface:** no totals, payment, shipping, or coupons; navigating to `/checkout` starts the enquiry submit flow (prompt 18), which posts a pure enquiry payload — never `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet`.
- **Slug URLs:** row links use `productPath` (slug‑canonical, legacy id resolves).
- **Reuse** `QuantityStepper`, `PriceBlock`, and the drawer's row/empty‑state pattern rather than reimplementing them.
- CSS Modules per component; storefront vs admin palette separation; Icons8 for the empty illustration; reuse/refactor rather than rewrite.
