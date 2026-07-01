# 18 — Submit Enquiry Flow

## 1. Objective
Convert the multi-step e-commerce checkout at `src/pages/Checkout/Checkout.js` into a single-purpose **Submit Enquiry** screen for **North East Build Mart (NEBM)**. The page shows a review step titled **"Enquiry Summary"** listing every product, its quantity, and its price mode — with **no payment, shipping, coupon, tax, or store-credit UI** — and a primary button labelled **"Submit Enquiry"**. On submit it must send a *pure* enquiry payload through `src/context/OrderContext.js` → `apiService.orders.create` that captures only contact, items, note, and `status: "New"`, and must **NOT** trigger the mock cascade side effects `createPaymentForOrder` / `redeemCouponByCode` / `debitWallet`.

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform, not a store. Customers browse building materials (WPC Louvers, Polycarbonate Sheets, FRP Sheets, Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods, and a badged Special Products collection), build an **Enquiry List** (the repurposed cart), and submit an enquiry with a note. There is **no Buy Now, no cart-to-purchase, no checkout-to-pay, no shipping, no coupons, no returns** anywhere in the storefront.

Brand facts to keep on hand:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`

This prompt is part of the enquiry-flow build set. Contact/note capture detail is in **prompt 19 (Enquiry Note & Contact Capture)**; the post-submit screen is **prompt 20 (Enquiry Success Page)**; the admin surface that reads these records is **prompt 28 (Admin → Enquiries)**; the `orders → enquiries` db pivot is **prompt 05 / 28**. See `prompts/00-analysis-and-requirement-map.md` §5 (Feature → Enquiry mapping) and §6 (Risk register #1) for the source of truth.

The current `Checkout.js` is a 4-step wizard (`Cart → Shipping → Payment → Review`) with coupon logic, shipping-method selection, GST tax math, a store-credit wallet, and five payment methods. All of that is removed here. `OrderContext.createOrder` currently seeds `paymentStatus` / `fulfillmentStatus` / `shippingStatus` and calls `generateOrderNumber` (`ORD-...`). `apiService.orders.create` (mock) seeds `statusHistory` and then fires `createPaymentForOrder`, `redeemCouponByCode` (when a `couponCode` is present), and `debitWallet` (when `storeCreditUsed > 0`). **The enquiry payload must contain none of `couponCode` or `storeCreditUsed`, and no payment fields, so those side effects never run.**

## 3. Files & folders to inspect
- `src/pages/Checkout/Checkout.js` — the wizard to gut and rebuild as Submit Enquiry.
- `src/pages/Checkout/Checkout.module.css` — reuse layout/card styles; delete payment/shipping/coupon/wallet rules.
- `src/context/OrderContext.js` — `createOrder`, `generateOrderNumber`, `loadUserOrders`.
- `src/services/api.js` — `orders.create` (~line 1138), the side-effect helpers `createPaymentForOrder` (~277), `redeemCouponByCode` (~319), `debitWallet` (~450).
- `src/hooks/useCart.js` + `src/context/CartContext.js` — Enquiry List source (`cartItems`, `updateQuantity`, `removeFromCart`, `clearCart`, `getCartItemCount`).
- `src/components/storefront/PriceBlock.js` — for rendering the per-item price mode consistently (exact / tiered / Price on Enquiry).
- `src/utils/helpers.js` — `formatCurrency` (only for exact/tiered display, never for a grand total).
- `src/App.js` — route `/checkout` (line ~113); success route (prompt 20).

## 4. Step-by-step implementation instructions
1. **Strip the wizard to one step.** Remove the `STEPS`/`PAYMENT_OPTIONS` arrays, the `step` state machine, `handleNext`, and all shipping/coupon/tax/wallet/payment state (`shippingMethods`, `selectedShipping`, `couponCode`, `couponApplied`, `walletBalance`, `applyStoreCredit`, `creditAmount`, `paymentMethod`, `storeSettings`) and their `useEffect`s and helpers (`couponDiscountFor`, `validateAddress`, `applyCoupon`, `removeCoupon`). Delete the imports of `apiService.shipping`, `apiService.coupons`, `apiService.wallet`, `apiService.settings` from this page.
2. **Rename the page component** to `SubmitEnquiry` (keep the default export) and point the route at it. Keep the route path `/checkout` working for now (a later prompt may add `/enquiry`); if you rename the file/route, update `src/App.js` atomically so the app never white-screens. Recommended: keep the file at `src/pages/Checkout/` to avoid churn, rename only the component and heading text.
3. **Build the Enquiry Summary.** Under an `<h2>` reading **"Enquiry Summary"**, map `cartItems` to rows showing: thumbnail, product name (+ variant name if present), a quantity stepper (reuse the existing `updateQuantity(item.id, ...)` +/- controls), a remove button (`removeFromCart(item.id)`), and a **price-mode label** per item:
   - `priceType: "exact"` → show the exact unit price via `formatCurrency(item.price)` + `unitType` (e.g. `₹100 / piece`).
   - `priceType: "tiered"` → show a compact "Tiered pricing" chip (link to product for the full table); do **not** compute a line total.
   - `priceType: "onEnquiry"` (or missing price) → show **"Price on Enquiry"**.
   Reuse `PriceBlock` where practical for consistency. **Render no subtotal, no discount, no shipping, no tax, no grand total anywhere.**
4. **Add the contact + note block** per prompt 19: name, phone, email fields (prefilled from `user` when logged in, editable, guest entry allowed) and a note/message `<textarea>`. Validate **name and phone required, email optional/valid-if-present**. (Full spec in prompt 19 — reference it, do not duplicate its acceptance criteria here.)
5. **Auth is optional for enquiries.** Do not gate submit behind login. Logged-in users get prefilled contact and their enquiry linked to `userId`; guests submit with `userId: null`. Remove the `openAuthModal("login")` gate that blocked the old step 0.
6. **Wire the primary button** labelled **"Submit Enquiry"** (never "Place Order"/"Checkout"). On click call `handleSubmitEnquiry()` (below). Disable it while `isProcessing` or when `cartItems.length === 0`.
7. **Build the pure enquiry payload** in `handleSubmitEnquiry`:
   ```js
   const enquiryData = {
     items: cartItems.map((item) => ({
       productId: item.productId,
       variantId: item.variantId,
       name: `${item.name}${item.variantName ? ` - ${item.variantName}` : ""}`,
       image: item.image,
       sku: item.sku || "",
       quantity: item.quantity,
       priceType: item.priceType || "onEnquiry",
       unitType: item.unitType || null,
       price: item.priceType === "exact" ? item.price : null,
     })),
     contact: { name, phone, email }, // from step 4
     notes: note,                      // user message
     status: "New",
   };
   ```
   **Do not include** `subtotal`, `discountAmount`, `couponCode`, `shippingAmount`, `taxAmount`, `total`, `storeCreditUsed`, `amountPayable`, `paymentMethod`, `paymentStatus`, `shippingAddress`, or `billingAddress`.
8. **Route through OrderContext.** Call `const result = await createOrder(enquiryData)` (see §6 for the context change). On `result.success`: call `clearCart({ silent: true })` to empty the Enquiry List, then `navigate` to the success page with the reference number (prompt 20): `navigate(\`/order-confirmation/${result.order.orderNumber || result.order.id}\`)`.
9. **Empty state.** When `cartItems.length === 0` and no enquiry was just submitted, show an enquiry-appropriate empty state: heading "Your Enquiry List is empty", copy "Add products to your Enquiry List to send an enquiry.", and a `Link to="/products"` button "Browse Products". No cart/checkout wording.
10. **OrderContext change (§6):** make `createOrder` seed only enquiry-safe fields and stop seeding payment/shipping/fulfillment defaults for enquiries; generate an `enquiryNumber` prefix `ENQ-` alongside (or instead of) `ORD-`. Ensure the persisted record carries `status: "New"` and `statusHistory` (seeded server-side by `orders.create`). Confirm no code path passes `couponCode` or `storeCreditUsed`, so `redeemCouponByCode` / `debitWallet` are never invoked.

## 5. UI/UX requirements
- Premium, minimal, Apple-style: generous white space, one clean card for the summary, one for contact+note. Primary Blue `#1885d8` for the **Submit Enquiry** button and active states; Gold `#fa9c4c` used sparingly for the price-mode chip / accent underline. Soft shadows, rounded cards, clear hierarchy, mobile-first.
- Remove the 4-dot step indicator, the trust badges ("Secure Payment / Fast Delivery / Easy Returns"), and the order-summary sidebar with money rows. Replace the sidebar (if kept) with a lightweight "Items (N)" count and the two NEBM phone numbers as a "Questions? Call us" helper.
- Quantity steppers keep the existing accessible `aria-label`s.
- No emojis for payment icons (they are deleted). Use `@iconify/react` `mdi:*` icons if any icon is needed.

## 6. Data & API requirements
- **Dual-mode rule (restate):** every data call must keep `IS_MOCK_API` branching and shape responses via `extractData()`, preserving JSON-shape fidelity so the same UI works against JSON Server (`:3001`) and the Laravel API. Never hardcode a shape that only works in mock.
- `apiService.orders.create` stays the single create method. In mock mode it seeds `statusHistory` and then runs the side effects **only when the triggering fields are present**. Because the enquiry payload omits `couponCode` and `storeCreditUsed`, `redeemCouponByCode` and `debitWallet` do not fire. `createPaymentForOrder` currently runs unconditionally in mock — **guard it** so it is skipped when the record has no `paymentMethod`/`total` (i.e. an enquiry): wrap the three side effects in `if (saved.paymentMethod || saved.total)` or, cleaner, branch on an explicit `saved.type === "enquiry"` flag you add to the payload. When the db is pivoted to an `enquiries` collection (prompt 05/28), retarget `orders.create` / `getByUserId` / `getByOrderNumber` to `/enquiries` and drop the payment/coupon/wallet side effects entirely.
- **db.json enquiry shape** (the record this flow writes; see prompt 00 §3 and prompt 28): `{ id, enquiryNumber, userId, items[], contact{name,phone,email}, notes, status, adminNotes, statusHistory[], createdAt, updatedAt }`. No money/payment/shipping fields.
- `OrderContext.createOrder`: stop defaulting `paymentStatus`/`fulfillmentStatus`/`shippingStatus`/`trackingNumber`/`shiprocketOrderId` for enquiries. Keep `loadUserOrders` (reads `apiService.orders.getByUserId`) working so the customer's My Enquiries view (prompt 21) populates.

## 7. Admin panel requirements
N/A here — the submitted record surfaces in **Admin → Enquiries (prompt 28)** with the captured contact, items, note, and status `New`. This flow only writes; it must write the exact fields prompt 28 reads.

## 8. Storefront requirements
- Route `/checkout` renders the Submit Enquiry page. The page is reachable from the Enquiry List drawer's "Submit Enquiry / Send Enquiry" button (repurposed cart CTA). No "Proceed to Checkout" wording survives.
- No login wall: guests can submit.
- After a successful submit the Enquiry List is emptied (`clearCart({ silent: true })`) and the user lands on the success page (prompt 20).

## 9. Acceptance criteria
- [ ] `src/pages/Checkout/Checkout.js` renders a single-step page headed **"Enquiry Summary"** with a primary **"Submit Enquiry"** button.
- [ ] No payment, shipping, coupon, tax, GST, or store-credit UI remains anywhere on the page.
- [ ] Each item shows name, quantity (editable stepper), remove control, and its price mode (exact ₹/unit, tiered chip, or "Price on Enquiry"). No subtotal/total is shown.
- [ ] Submitting posts a payload with `contact`, `items`, `notes`, and `status: "New"` and **no** money/payment/coupon/wallet fields.
- [ ] `createPaymentForOrder`, `redeemCouponByCode`, and `debitWallet` are provably **not** invoked (verified via `db.json` — no new `payments`, `coupons.usedCount` unchanged, no new `walletTransactions`).
- [ ] On success the Enquiry List is cleared via `clearCart({ silent: true })` and the app routes to the success page with the enquiry reference.
- [ ] Guests (not logged in) can submit; logged-in users get prefilled contact and `userId` linkage.
- [ ] Dual-mode `IS_MOCK_API` + `extractData()` preserved on every API call.

## 10. Testing / verification steps
1. Run `npm run dev` (CRA `:3000` + JSON Server `:3001`).
2. Add 2–3 products (mix of exact / tiered / on-enquiry price types) to the Enquiry List; open `/checkout`.
3. Confirm the heading reads "Enquiry Summary", quantities are editable, price modes render correctly, and there is no money/payment/shipping/coupon UI.
4. Note the counts before submitting: open `http://localhost:3001/payments`, `http://localhost:3001/coupons`, `http://localhost:3001/walletTransactions`.
5. Fill contact + note, click **Submit Enquiry**.
6. Verify the app navigates to the success page and the Enquiry List (cart drawer) is now empty.
7. Open `http://localhost:3001/orders` (or `/enquiries` post-pivot) — confirm a new record with `contact`, `items`, `notes`, `status: "New"`, `statusHistory`, and **no** `total`/`paymentMethod`/`couponCode`/`storeCreditUsed`.
8. Re-check `/payments`, `/coupons`, `/walletTransactions` — counts must be **unchanged** (no side effects fired).
9. Log out and repeat as a guest — enquiry still submits with `userId: null`.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API layer** — keep `IS_MOCK_API` branching and `extractData()` on `orders.create` / `getByUserId` / `getByOrderNumber`; keep JSON-shape fidelity for the Laravel branch.
- **No side effects from the enquiry flow** — `createPaymentForOrder` / `redeemCouponByCode` / `debitWallet` must stay dormant for enquiries. Leave those helpers in `api.js` (other retired modules import them); just don't invoke them here.
- **Enquiry List persistence** — the CartContext `"cart"` localStorage key, `lineKey`, login-merge/logout-clear, and debounced server sync stay intact; only the checkout UI changes. Keep `clearCart({ silent: true })`.
- **Provider nesting** in `src/App.js` (`Theme → Auth → Admin → Wishlist → Cart → Order`, storefront in `DealsConfigProvider`) — if `OrderProvider` is renamed, update the nesting atomically.
- **Auth** — never surface `user.password`; guest and logged-in paths both work.
- **Routing** — `/checkout` keeps resolving; the success route (prompt 20) keeps working. Reuse/refactor `Checkout.module.css`, don't rewrite from scratch.
