# 16 — Cart → Enquiry List (State & Drawer)

## 1. Objective

Convert the cart state + drawer into an **Enquiry List** for **North East Build Mart (NEBM)** without breaking the server‑sync plumbing. Repurpose `src/context/CartContext.js`, `src/hooks/useCart.js`, `src/components/CartDrawer/CartDrawer.js`, and `src/components/storefront/QuantityStepper.js`: rename every **user‑facing** string/toast from "cart" to "Enquiry List", retitle the drawer to **"Enquiry List"**, keep multi‑product management with quantities (via `QuantityStepper`), keep remove‑item, and **remove all totals / shipping / payment / checkout‑to‑buy UI**. The drawer's primary action becomes **"Submit Enquiry"** → the `/checkout` route (which prompt 18 repurposes into the enquiry submit flow). Drop `getCartTotal` from the UI (keep the function, unused). Critically: **keep the internal API and storage names stable** — the `cart` API namespace and the `"cart"` localStorage key stay to preserve login‑merge / logout‑clear / debounced server sync and dual‑mode fidelity.

## 2. Context / background

NEBM is an e‑commerce‑*style* **enquiry** platform (React CRA + JSON Server dev / Laravel prod). Customers add products to an **Enquiry List** and submit an enquiry with a note — they never pay, check out to buy, ship, or use coupons. Facts you need:

- **Primary Blue:** `#1885d8`; **Accent Gold/Orange:** `#fa9c4c`. Apple‑minimal, mobile‑first, soft shadows.
- **Terminology (storefront UI):** "Cart" → **Enquiry List**; "Add to Cart" → **Add to Enquiry List** (icon button + tooltip); "Buy Now" → **removed**; "Checkout / Place Order" → **Submit Enquiry**. Remove all payment/shipping/coupon UI.
- **What users CAN do:** browse, search/filter/sort, add to the Enquiry List & manage quantities, then **submit an enquiry** with a note. **CANNOT:** place orders, pay, checkout‑to‑buy, ship, apply coupons, request returns.

**Why the internal names stay:** `CartContext` persists to `localStorage["cart"]`, merges a guest list into the server list on **login**, clears on **logout**, and **debounces** a full‑replace mirror to the API via `apiService.cart.*` (`getCart`, `addToCart`, `removeFromCart`, `clearCart`). Renaming the storage key or API namespace would lose persisted lists and break the dual‑mode sync. So we rename the **UI**, not the **plumbing**. See `prompts/00-analysis-and-requirement-map.md` §5 and risk register §6.8.

Sibling prompts: 12/14 (Add‑to‑Enquiry icon buttons feed this list), 17 (full Enquiry List page), 18 (Submit Enquiry / `/checkout` repurpose).

## 3. Files & folders to inspect

- `src/context/CartContext.js` — the state machine: `lineKey`, `normalizeCartItem`, `clampQty`, `mergeCarts`, `cartToast`, load/save `"cart"`, `replaceApiCart`/`queueApiSync`, login‑merge/logout‑clear effect, debounced sync, and the exposed value (`cartItems, isCartOpen, isLoading, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount, toggleCart, setIsCartOpen`).
- `src/hooks/useCart.js` — re‑exports `useCart` from `CartContext` (keep the hook name for import stability).
- `src/components/CartDrawer/CartDrawer.js` + `CartDrawer.module.css` — the slide‑in drawer (retitle + strip totals/shipping/checkout).
- `src/components/storefront/QuantityStepper.js` — accessible +/- stepper (reuse in the drawer rows).
- `src/services/api.js` — `cart` namespace (line ~1085): `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`; `extractData()`.
- `src/components/Header/Header.js` (renders `<CartDrawer open={isCartOpen} .../>` ~line 511) and `src/utils/constants.js` (`FREE_SHIPPING_THRESHOLD`) — for the strings/threshold you are removing from the drawer.

## 4. Step-by-step implementation instructions

1. **Keep the storage key and API namespace.** Do **not** rename `localStorage["cart"]`, the `cart` API namespace, or the `apiService.cart.*` methods. Add a code comment at the top of `CartContext.js` explaining that the `"cart"` key and `cart` API are intentionally retained for server‑sync + dual‑mode fidelity even though the UI now says "Enquiry List".
2. **Rename user‑facing strings/toasts in `CartContext.js`.** In `cartToast` calls and `clearCart`, change copy:
   - "Added to Cart" → **"Added to Enquiry List"**; "Cart Updated" → **"Enquiry List Updated"**; text "…added to your cart" → "…added to your Enquiry List".
   - "Removed" / "Item removed from cart" → **"Removed" / "Item removed from your Enquiry List"**.
   - "Cart Cleared" / "Your cart has been emptied" → **"Enquiry List Cleared" / "Your Enquiry List has been emptied"**.
   - Keep the toast config, timers, and success/info icons. Do **not** rename the state fields (`cartItems`), functions (`addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `toggleCart`, `setIsCartOpen`, `getCartItemCount`), or the `isCartOpen` flag — callers across the app import these.
3. **`getCartTotal`: keep the function, drop it from the UI.** Leave `getCartTotal` defined and exported on the context value for compatibility, but **stop using it** anywhere in the UI (no totals rendered). Add a comment that it is retained but unused by the enquiry UI (no monetary total is shown for an enquiry). `getCartItemCount` stays in use (badge/count).
4. **Preserve the sync machinery.** Keep `firstSaveRef`, `syncChainRef`, `prevUserRef`, `cartLoadedRef`, `cartItemsRef`; keep the load‑on‑mount, save‑on‑change, login‑merge (`mergeCarts`), logout‑clear (`localStorage.removeItem("cart")` + `setCartItems([])`), and the 600ms debounced `queueApiSync` → `replaceApiCart`. These are the crown‑jewel behaviours — do not simplify them away.
5. **Retitle the drawer (`CartDrawer.js`).** Change the header title "Shopping Cart" → **"Enquiry List"**. Swap the cart‑glyph header icon for an enquiry/clipboard‑list icon (`@iconify/react`, e.g. `mdi:clipboard-list-outline`). Keep the item count badge (`getCartItemCount`).
6. **Strip the money/shipping/checkout UI from the drawer:**
   - Remove the **free‑shipping progress banner** (and `FREE_SHIPPING_THRESHOLD` / `FLAT_SHIPPING` usage, `amountToFreeShipping`, `shippingProgress`).
   - Remove the **footer summary** (Subtotal, Estimated Shipping) and any line totals per item (`lineTotal`) — an enquiry has no price total.
   - Remove `getCartTotal` usage from the drawer.
   - Remove the "View Cart" + "Checkout" buttons; add a single primary CTA **"Submit Enquiry"** that calls `onClose()` then `navigate("/checkout")` (the enquiry submit flow lives at `/checkout`, repurposed in prompt 18). Optionally add a secondary "View Enquiry List" link → `/enquiry-list` (prompt 17).
7. **Keep multi‑product + quantity management.** Each drawer row keeps image (links to `productPath(item)`), name, variant name, and **quantity controls**. Replace the inline +/- buttons with the shared **`QuantityStepper`** (`value={item.quantity}`, `onChange={(q)=>updateQuantity(item.id, q)}`, `min={1}`, `max={item.stock ?? Infinity}`), preserving the stock cap and "No more stock available" title. Keep the remove‑item button (`removeFromCart(item.id)`) and its exit animation. You may keep a per‑item price line (informational) but **do not** compute or show a cart total.
8. **Empty state.** Reword "Your cart is empty" → **"Your Enquiry List is empty"** and "Looks like you haven't added anything to your cart yet." → "You haven't added any products to enquire about yet." Keep the "Continue Shopping" → `/` button (or reword to "Browse Products"). Prefer an Icons8 empty illustration for the premium feel.
9. **Re‑skin** the drawer to `--sf-*` Blue/Gold tokens (primary "Submit Enquiry" button = blue with gold hover accent). Keep the slide‑in animation, backdrop, body‑scroll lock, and dark‑mode path.

## 5. UI/UX requirements

- **Brand tokens:** `#1885d8` (primary "Submit Enquiry", count badge, links), `#fa9c4c` (hover accents). Apple‑minimal, mobile‑first, soft shadows, rounded rows.
- Drawer titled **"Enquiry List"** with an enquiry/clipboard icon and item count.
- Rows: image, name, variant, **`QuantityStepper`**, remove button — **no** line totals shown; **no** subtotal/shipping/free‑shipping banner; **no** checkout/payment UI.
- Single primary CTA **"Submit Enquiry"** → `/checkout`; optional "View Enquiry List" → `/enquiry-list`.
- Empty state reworded, Icons8 illustration, "Browse Products" CTA.
- All toasts say "Enquiry List", not "cart".

## 6. Data & API requirements

- **Dual‑mode rule (restate):** keep `IS_MOCK_API` branching + `extractData()` in `apiService.cart.*`; the same JSON shapes must work against JSON Server (`:3001`) and Laravel. The debounced full‑replace sync (`replaceApiCart` → `getCart`/`removeFromCart`/`addToCart`) stays.
- **Storage:** `localStorage["cart"]` key retained (do not rename). Login merges guest list into server list via `mergeCarts`; logout clears local + `removeItem("cart")`; server list left intact for re‑login.
- **API namespace:** `apiService.cart` (line ~1085) retained: `getCart(userId)`, `addToCart(item)`, `updateCartItem(id,updates)`, `removeFromCart(id)`, `clearCart()`. The line item JSON shape (`productId, variantId, variantName, name, image, price, comparePrice, currency, quantity, stock?, userId`) stays for both modes.
- **Line identity:** `lineKey(productId, variantId)` stays canonical; every add path funnels through `normalizeCartItem`. Do not change the id scheme.
- **No purchase side effects:** the list never triggers payment/coupon/wallet/shipping. Submitting the enquiry (prompt 18) posts a pure enquiry payload.

## 7. Admin panel requirements

N/A (storefront state/drawer only).

## 8. Storefront requirements

- Enquiry List drawer: retitled, money/shipping/checkout stripped, quantity + remove kept, "Submit Enquiry" CTA → `/checkout`.
- Header count badge continues to reflect `getCartItemCount`.
- All user‑facing "cart" copy becomes "Enquiry List".

## 9. Acceptance criteria

- [ ] The drawer is titled **"Enquiry List"** (with an enquiry/clipboard icon) and shows the item count.
- [ ] Rows manage multiple products with per‑line **quantity** (via `QuantityStepper`, stock‑capped) and **remove**; the exit animation still plays.
- [ ] **No** subtotal, estimated shipping, free‑shipping banner, line totals, "View Cart", or "Checkout" remain in the drawer.
- [ ] A single primary **"Submit Enquiry"** button navigates to `/checkout` after closing the drawer.
- [ ] Every toast reads "Enquiry List" (added / updated / removed / cleared) — no "cart" wording in any user‑facing string.
- [ ] `getCartTotal` still exists on the context value but is **unused** by the UI; no monetary total is displayed for the enquiry.
- [ ] `localStorage["cart"]` key, the `cart` API namespace, `lineKey`, `normalizeCartItem`, `mergeCarts`, login‑merge, logout‑clear, and the debounced server sync are all unchanged and working.
- [ ] Empty state reads "Your Enquiry List is empty" with a "Browse Products" CTA.
- [ ] Palette is Blue `#1885d8` / Gold `#fa9c4c`; dark mode legible; slide‑in + backdrop + scroll‑lock preserved.

## 10. Testing / verification steps

1. `npm run dev`.
2. Add a few products from the listing/PDP (Add‑to‑Enquiry icon buttons) → the drawer opens titled **"Enquiry List"**; toast reads "Added to Enquiry List".
3. In the drawer: change a quantity with the stepper (respecting stock), remove an item → toasts read "Enquiry List Updated" / "Item removed from your Enquiry List". Confirm **no** totals/shipping/checkout UI.
4. Click **Submit Enquiry** → drawer closes and navigates to `/checkout`.
5. Reload the page → the list persists (from `localStorage["cart"]`). Log in with a seeded user → guest list merges with the server list (no duplicate lines, larger qty wins). Log out → list clears locally; log back in → server list restores.
6. JSON Server checks: while logged in, `http://localhost:3001/cart?userId=<id>` mirrors the list after the ~600ms debounce; removing/clearing reflects there. Confirm **no** rows appear in `/payments`, `/coupons`, or `/orders` from list actions.
7. Toggle `IS_MOCK_API`; confirm the drawer + sync still work.
8. Toggle dark mode; verify legibility.

## 11. Notes on preserving existing functionality

- **Keep internal names stable:** `localStorage["cart"]`, the `cart` API namespace + methods, `lineKey`, `normalizeCartItem`, `clampQty`, `mergeCarts`, and every exposed function/field name (`cartItems`, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getCartTotal`, `getCartItemCount`, `toggleCart`, `isCartOpen`, `setIsCartOpen`). Rename **copy**, not code. Document the retention in a comment.
- **Dual‑mode API:** keep `IS_MOCK_API` + `extractData()`; the debounced full‑replace sync and login‑merge/logout‑clear are load‑bearing — do not simplify.
- **`useCart` hook name** stays (re‑exported) so all importers keep working.
- **QuantityStepper** stays domain‑agnostic; reuse it, don't fork it.
- **No purchase side effects:** the list must not fire payment/coupon/wallet/shipping; do not call `orders.create` from here.
- Provider nesting/order in `App.js` is unchanged (`CartProvider` stays in the same position); this prompt does not rename the provider.
- CSS Modules per component; storefront vs admin palette separation; reuse/refactor rather than rewrite.
