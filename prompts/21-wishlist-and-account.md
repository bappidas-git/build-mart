# 21 — Wishlist & Account Alignment

## 1. Objective
Re-skin the account cluster to North East Build Mart (NEBM) branding and repurpose the customer's order history into **My Enquiries**. Specifically: re-skin `src/pages/Wishlist/Wishlist.js` + `src/context/WishlistContext.js` (keep add/remove and `apiService.wishlist.*`), re-skin `src/pages/Profile/Profile.js`, and repurpose `src/pages/OrderHistory/OrderHistory.js` so the customer sees **My Enquiries** — status chips (New → Contacted → In Discussion → Quotation Sent → Converted → Closed → Lost) and enquiry details — instead of orders, reading `apiService.orders.getByUserId` (→ enquiries). Apply the Blue `#1885d8` / Gold `#fa9c4c` Apple-minimal palette. Keep auth, the wishlist API, and dual-mode fidelity intact.

## 2. Context / background
NEBM customers can browse, wishlist, manage their account, and submit enquiries — but never buy. So the account area must drop purchase/order/payment/shipping/wallet language and show **enquiries** with a lightweight CRM-style status.

Brand facts:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`

Enquiry statuses (canonical order): **New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost.** See `prompts/00-analysis-and-requirement-map.md` §5 (OrderHistory → customer enquiries; Wishlist/Profile KEEP + re-skin) and the terminology map. Enquiry submission is prompts 18/19; the admin side is prompt 28.

Today `OrderHistory.js` derives a display status from `paymentStatus`/`fulfillmentStatus`/`shippingStatus`, shows order totals, tracking, cancel, returns, and gated reviews. `Profile.js` has tabs including "My Orders", "Store Credit" (wallet), and links to `/orders` and `/wishlist`. `Wishlist.js` labels its actions "Add to Cart" / "Move to Cart". All of that gets aligned.

## 3. Files & folders to inspect
- `src/pages/OrderHistory/OrderHistory.js` + `OrderHistory.module.css` — repurpose to My Enquiries.
- `src/pages/Profile/Profile.js` + `Profile.module.css` — re-skin; drop wallet + order-money language.
- `src/pages/Wishlist/Wishlist.js` + `Wishlist.module.css` — re-skin; relabel cart actions.
- `src/context/WishlistContext.js` — keep logic; only copy/toast wording may change.
- `src/services/api.js` — `orders.getByUserId` (~1176), `wishlist.get/add/remove` (~1408), `reviews.getMine/submit`.
- `src/App.js` — routes `/orders`, `/profile`, `/wishlist`.
- `src/utils/helpers.js` — `formatDate`, `formatCurrency` (exact-price display only), `buildCartItem`, `productPath`.

## 4. Step-by-step implementation instructions
**A. My Enquiries (`OrderHistory.js`)**
1. Rename page heading "My Orders" → **"My Enquiries"** and the count "N orders" → "N enquiries". Keep the component/default export or rename to `MyEnquiries` and update the `/orders` route import atomically.
2. Replace `STATUS_CONFIG`/`FILTER_OPTIONS`/`deriveOrderStatus` with an enquiry-status model. Read `enquiry.status` directly (values: `New`, `Contacted`, `In Discussion`, `Quotation Sent`, `Converted`, `Closed`, `Lost`). Map each to a chip class + label:
   ```js
   const ENQUIRY_STATUS = {
     New:              { label: "New",              className: "statusNew" },
     Contacted:        { label: "Contacted",        className: "statusContacted" },
     "In Discussion":  { label: "In Discussion",    className: "statusDiscussion" },
     "Quotation Sent": { label: "Quotation Sent",   className: "statusQuotation" },
     Converted:        { label: "Converted",        className: "statusConverted" },
     Closed:           { label: "Closed",           className: "statusClosed" },
     Lost:             { label: "Lost",             className: "statusLost" },
   };
   ```
   Filter tabs: `All · New · In Discussion · Quotation Sent · Converted · Closed`. Keep the search-by-reference box (search `enquiryNumber`).
3. Fetch with `apiService.orders.getByUserId(user?.id)` (→ enquiries post-pivot); keep the `Promise.all` + sort-newest-first + error-state pattern. Keep `reviews.getMine` if you retain product reviews from enquiries; otherwise drop the review gating (reviews are not purchase-gated in an enquiry model — either remove the "Rate & Review" affordance or keep it ungated at your discretion, but do not tie it to a nonexistent "delivered" status).
4. **Remove order-only affordances:** totals row (`formatCurrency(order.total)`), tracking section, "Track Order", "Cancel Order" (`orders.cancel`), "Return / Exchange", refund status, `isReturnEligible`, `isCancellable`, `RETURN_WINDOW_DAYS`, `normalizeOrderAddress`, shipping-address block, and payment block. Enquiries carry no money/tracking/payment.
5. **Enquiry card** shows: reference (`enquiryNumber`), submitted date (`formatDate(createdAt)`), status chip, item thumbnails + count, and a "View Details" expander. Details show the full item list with **quantity + price mode** (exact ₹/unit, "Tiered pricing", or "Price on Enquiry"), the customer's `notes`/message, and the current status. Optionally render a compact `statusHistory` timeline if present.
6. Empty state → "No enquiries yet" with copy "Browse our building materials and send us an enquiry." and a "Browse Products" button → `/products`. Keep the fetch-error state distinct from empty (never show "No enquiries" on a failed fetch).
7. Login-required state copy: "Sign in to view your enquiries." Keep the `openAuthModal("login")` entry point.

**B. Profile (`Profile.js`)**
8. Re-skin to Blue/Gold Apple-minimal. Rename the "My Orders" tab → **"My Enquiries"** (still linking `/orders`). **Remove the "Store Credit" (wallet) tab** and `renderWalletSection`, the wallet state/effects, and `apiService.wallet.*` imports — NEBM has no wallet (prompt 00 §5). Keep Profile, Addresses, Wishlist link, Change Password, Logout.
9. Keep address management as customer contact/site addresses (still useful for enquiries), but soften copy from "delivery addresses" → "your addresses"; drop the "Currently shipping within India only" hint or reword to "India only".
10. Preserve `updateUser`, `changePassword`, and all validation (`isValidPhone`). Never surface `user.password`.

**C. Wishlist (`Wishlist.js` + `WishlistContext.js`)**
11. Re-skin to Blue/Gold. Relabel actions per the terminology map: "Add to Cart" → **"Add to Enquiry List"** and "Move to Cart" → **"Move to Enquiry List"** (still calling `addToCart(buildCartItem(...))` / `removeFromWishlist`). Keep the heart remove, sort dropdown, guest banner, and skeletons.
12. Price display uses the product price-mode: show exact ₹, a tiered chip, or "Price on Enquiry" — do not force a single `salePrice`/`originalPrice` where the product is on-enquiry or tiered. Keep discount badge only for genuine exact-price compare deltas.
13. In `WishlistContext.js` keep all logic (`apiService.wishlist.get/add/remove`, localStorage `"wishlist"` key, login-merge/logout-clear, optimistic add/remove, toasts). Only toast wording may shift toward "Enquiry List" where it references the cart; the wishlist itself stays "Wishlist".

## 5. UI/UX requirements
- Primary Blue `#1885d8` for headings, active tabs, primary buttons; Gold `#fa9c4c` for accents/badges (e.g. the "Quotation Sent" or "Converted" chip highlight) used sparingly.
- Status chips are color-coded but restrained: New (blue), In Discussion (gold), Quotation Sent (blue-tint), Converted (green), Closed (grey), Lost (muted red). Keep contrast in dark mode (`isDarkMode`).
- Apple-minimal: soft shadows, rounded cards, generous spacing, clear hierarchy, mobile-first. Keep framer-motion entrance animations already present.
- Wishlist cards keep premium product-grid styling; buttons read "Add to Enquiry List" (icon + label).

## 6. Data & API requirements
- **Dual-mode rule (restate):** keep `IS_MOCK_API` branching + `extractData()` on `orders.getByUserId`, `wishlist.get/add/remove`, `reviews.*`. Responses must shape identically for JSON Server and Laravel. `getByUserId` (mock) queries `/orders?userId=` and returns `response.data`; post-pivot it targets `/enquiries?userId=`.
- Enquiry fields read: `enquiryNumber`, `status`, `items[]` (`quantity`, `priceType`, `price`, `unitType`, `name`, `image`, `variantName`), `notes`, `statusHistory[]`, `createdAt`. Do not read `total`/`paymentStatus`/`shippingStatus`/`trackingNumber`.
- Wishlist rows keep the flat snapshot shape from `WishlistContext` (`productId`, `slug`, `name`, `image`, price fields, `variants`, `stock`, `addedAt`). Do not change the persisted shape.
- `apiService.wishlist.*` unchanged. `apiService.wallet.*` is no longer called from Profile.

## 7. Admin panel requirements
N/A — customer-facing. The same enquiry records are managed in Admin → Enquiries (prompt 28); status values must match exactly so chips render for statuses the admin sets.

## 8. Storefront requirements
- `/orders` renders **My Enquiries** with status chips and details; `/profile` shows the re-skinned account with a "My Enquiries" tab and no wallet; `/wishlist` shows the re-skinned wishlist with "Add/Move to Enquiry List".
- Guests keep a working wishlist (device-local) with the login banner; logged-in users get server-synced wishlist + their enquiries.

## 9. Acceptance criteria
- [ ] `/orders` is titled **My Enquiries**, lists enquiries with correct status chips (New→…→Lost) and a working details expander showing items, quantities, price modes, and the customer note.
- [ ] All order-only UI (totals, tracking, cancel, returns, refunds, payment, shipping address) is removed from `/orders`.
- [ ] `/profile` has a "My Enquiries" tab, no "Store Credit"/wallet tab, and no wallet API calls; auth, address CRUD, and password change still work.
- [ ] `/wishlist` uses "Add to Enquiry List" / "Move to Enquiry List" labels; add/remove and `apiService.wishlist.*` still work for guests and logged-in users; price modes render correctly.
- [ ] Blue `#1885d8` / Gold `#fa9c4c` palette applied across all three pages, light and dark.
- [ ] Dual-mode `IS_MOCK_API` + `extractData()` preserved on all API calls.

## 10. Testing / verification steps
1. `npm run dev`. Submit an enquiry (prompts 18/19), then open `/orders` — confirm it reads "My Enquiries" and the new record shows with a "New" chip.
2. In `db.json` (or via Admin later), change an enquiry `status` to "Quotation Sent" and refresh `/orders` — confirm the chip and filter update.
3. Expand an enquiry — confirm items, quantities, price modes, and the note render; confirm no totals/tracking/cancel/return buttons appear.
4. Open `/profile` — confirm the "My Enquiries" tab links to `/orders`, no wallet tab exists, and editing profile/addresses/password still works.
5. Open `/wishlist` as a guest — add from a product page, confirm "Add to Enquiry List" adds to the Enquiry List drawer; log in and confirm the wishlist syncs (`http://localhost:3001/wishlist`).
6. Toggle dark mode — confirm chips and cards remain legible.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API** — `IS_MOCK_API` + `extractData()` on `orders.getByUserId`, `wishlist.*`, `reviews.*`.
- **Auth** — login/logout, session restore (`authLoading` guards), `updateUser`, `changePassword`; never surface `user.password`.
- **Wishlist internals** — `apiService.wishlist.get/add/remove`, localStorage `"wishlist"` key, login-merge/logout-clear, optimistic mutations, toasts.
- **Enquiry List (cart) integration** — Wishlist "Add/Move to Enquiry List" still uses `addToCart(buildCartItem(...))`; the `"cart"` localStorage key and merge logic are untouched.
- **Routing & provider nesting** — `/orders`, `/profile`, `/wishlist` keep resolving; if any component is renamed, update `src/App.js` imports atomically.
- **CSS Modules** — reuse each page's `*.module.css`; keep per-component styling and storefront/admin palette separation.
- **No money movement** — removing the wallet tab must not call `debitWallet`/`creditWallet`; leave those helpers dormant in `api.js`.
