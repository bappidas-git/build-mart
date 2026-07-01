# 00b — Re-Grounding Verification Note (2026-07-01)

> **Prompt‑01 deliverable.** A fresh, source‑verified re‑derivation of the repository at the start of a build session for **North East Build Mart (NEBM)**, produced by reading `src/`, `db.json`, `server.js`, `.env*`, root docs and config end‑to‑end. **No application code, `db.json`, docs or config were modified.** This note is the companion/verification pass for `prompts/00-analysis-and-requirement-map.md` (the source of truth). Bottom line: **every material Phase‑1 claim reproduces exactly against the current tree.** Minor enrichments/deltas are listed in §6.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend* the existing boilerplate. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules, or the safe non‑cascading DELETE.

---

## 1. Repo map — stack, scripts, conventions (verified)

- **App type:** Create React App (`react-scripts` 5.0.1) storefront + admin, backed in dev by **JSON Server** via a custom `server.js` (:3001), in prod by Laravel `…/api/v1`. Package name **`ecommerce-boilerplate`** ([package.json:2](package.json)).
- **Stack:** React 18.2, `react-router-dom` 6.20, MUI 5 (`@mui/material` 5.14, `@mui/icons-material`) + `@emotion`, `framer-motion` 10.16, `axios` 1.6, `sweetalert2` 11.10, `@iconify/react` 4.1, `canvas-confetti` 1.9, `json-server` 0.17, `web-vitals`; dev dep `concurrently` 8.2 ([package.json:5](package.json)).
- **Scripts:** `start` (CRA :3000) · `server` (`node server.js` → JSON Server :3001) · `dev` (`concurrently` both) · `build` · `test` · `eject` ([package.json:25](package.json)).
- **Dual‑mode switch:** `IS_MOCK_API` is true when `REACT_APP_USE_MOCK_API === "true"` **or** `BASE_URL === MOCK_API_URL` (`http://localhost:3001`). `getBaseURL()` prefers the mock flag, then `REACT_APP_API_URL`, then dev fallback. A `[API] Mode/Base URL` line logs in development ([baseURL.js:18‑43](src/services/baseURL.js)). Current `.env`: `REACT_APP_API_URL=http://localhost:3001`, `REACT_APP_USE_MOCK_API=true` (mock active both ways). `.env.production`: Cloudways Laravel `…/api/v1`, mock=false.
- **Conventions:** storefront = per‑component **CSS Modules** driven by CSS custom properties in `theme/storefront-tokens.css` (mirrored in `theme/tokens.js`/`colors.js` for MUI); admin = MUI + a **separate** `theme/adminTheme.js` palette. Storefront and admin palettes are intentionally distinct.
- **Safe DELETE:** `server.js` overrides `DELETE /:resource/:id` to remove **only** the addressed row and `db.write()`, and neutralises `getRemovable → []` to kill json‑server's null‑FK cascade crash. Referential integrity is enforced in the API layer, not by DB cascade ([server.js:67‑95](server.js)).

**Root docs present (8):** `README.md` (stock CRA), `00_BACKEND_README_AND_CONVENTIONS.md`, `01_DATABASE_SCHEMA.md`, `02_API_ENDPOINTS.md`, `03_BUSINESS_LOGIC_AND_CASCADES.md`, `04_AUTH_ERRORS_AND_EDGE_CASES.md`, `STOREFRONT_UX_GUIDELINES.md`, **`MASTER_PROMPT.md`** (the NEBM master prompt). The four numbered `0x_*` docs describe the Laravel schema/endpoints/cascades/auth (purchase/payment/shipping oriented) → later rewritten for the enquiry model.

---

## 2. API inventory (`src/services/api.js`, 2459 lines — verified)

Single `apiService`; **every method branches on `IS_MOCK_API`**. Shared helpers (all confirmed at source):
- `extractData(response)` — returns `response.data.data` **iff** `response.data` is an object with `"success" in response.data`, else raw `response.data` ([api.js:67‑72](src/services/api.js)). This is the JSON‑Server ⇄ Laravel shape bridge; nothing may hardcode a mock‑only shape.
- `extractMeta` (Laravel `meta`), `getErrorMessage` (message/errors) ([api.js:74‑90](src/services/api.js)).
- Axios request interceptor (admin‑vs‑user bearer token) + response interceptor (401 handling).

**Customer namespaces** (confirmed at listed line offsets): `auth` (761), `products` (872), `categories` (1026), `banners` (1064), `cart` (1085), `orders` (1138), `wallet` (1247), `reviews` (1277), `returns` (1325), `coupons` (1355), `wishlist` (1408), `shipping` (1438), `settings` (1454), `deals` (1473), `leads` (1493), `admin` (1548).

**`apiService.admin.*` — full 60‑method surface confirmed:** `login, logout, getDashboardStats`; products `getProducts/getProduct/createProduct/updateProduct/deleteProduct`; categories `getCategories/createCategory/updateCategory/deleteCategory`; orders `getOrders/getOrder/updateOrder/updateOrderStatus/cancelOrder/initiateOrderRefund/completeOrderRefund/failOrderRefund`; returns `getReturns/getReturn/createReturn/updateReturn/scheduleReturnPickup/markReturnInTransit`; payments `getPayments/getPayment/getRefunds/issueRefund`; shipping `getShippingMethods/createShippingMethod/updateShippingMethod/deleteShippingMethod/shiprocketCreateOrder/shiprocketTrack`; coupons `getCoupons/createCoupon/updateCoupon/deleteCoupon`; reviews `getReviews/createReview/updateReview/deleteReview`; users `getUsers/getUser/updateUser`; leads `getLeads/getLead/updateLead/deleteLead`; settings `getSettings/updateSettings`; deals `getDealsConfig/updateDealsConfig`.

**Mock‑only cascade helpers (top‑level consts, confirmed):** `reflectPaymentOnOrder`, `reflectReturnRefund`, `restockItems`, `createPaymentForOrder`, `redeemCouponByCode`, `restoreCouponByCode`, `computeWalletBalance`, `writeWalletTransaction`, `creditWallet`, `debitWallet`, `createRefundRecord`, `finalizeRefundRecord`, `markPaymentRefundPending`, `voidPaymentForOrder`, `performCancel`, `deleteWithVerify` — plus `appendPaymentRefund` and audit helpers `historyEvent`/`currentAdminName`. These couple `orders ⇄ payments ⇄ coupons ⇄ returns ⇄ wallet`.

> ⚠️ **`orders.create` (mock) side‑effect chain — verified verbatim ([api.js:1143‑1173](src/services/api.js)):** seeds `statusHistory` with `{action:"Order placed", by:"Customer"}`, POSTs `/orders`, then **`await createPaymentForOrder(saved)`**, **`if (couponCode) redeemCouponByCode(...)`**, and **`if (storeCreditUsed>0) debitWallet(...)`**. The enquiry submit path must send a *pure* enquiry payload and **fire none of these**. `orders.cancel` (mock) runs the full `performCancel` refund/void/restock cascade ([api.js:1216‑1240](src/services/api.js)) — also out of scope for enquiries.

**`getDashboardStats` (mock) returns** `{ totalProducts, totalOrders, totalRevenue, totalUsers, pendingOrders, pendingReturns, lowStockProducts, activeCoupons }` — several fields (`totalRevenue`, `pendingReturns`, `activeCoupons`, and order‑centric `pendingOrders`) reference modules NEBM removes and must be reshaped.

---

## 3. Data model — `db.json` (18 collections/singletons, counts verified)

`banners`(3) · `users`(3) · `admins`(1) · `categories`(16) · `products`(19) · `cart`(0) · `orders`(11) · `returns`(2) · `payments`(9) · `refunds`(3) · `shipping_methods`(4) · `coupons`(5) · `reviews`(8) · `wishlist`(3) · `leads`(4) · `settings`(singleton) · `walletTransactions`(3) · `dealsConfig`(singleton).

**Key field shapes (read from row 0 of each — match Phase‑1 exactly):**
- **products:** `id, name, slug, sku, shortDescription, description, categoryId, brand, images[], price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], featured, trending, hot, isActive, rating, totalReviews, metaTitle, metaDescription, createdAt, updatedAt, frequentlyBoughtTogetherIds[], relatedProductIds[]`. → EXTEND with `priceType/unitType/minQty/priceTiers[]`, display flags, `special`.
- **categories:** `id, name, slug, description, image, parentId, isActive, sortOrder, showInMainMenu, menuOrder, createdAt, updatedAt`. Self‑referencing tree. → REPLACE seed with NEBM tree (helpers untouched).
- **orders:** `id, orderNumber, userId, items[], billingAddress, shippingAddress, subtotal, discountAmount, couponCode, shippingAmount, taxAmount, total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, trackingNumber, trackingUrl, shiprocketOrderId, notes, createdAt, updatedAt, statusHistory[]`. → REPURPOSE → `enquiries` (keep `items/statusHistory/notes`; drop money/payment/shipping; add `contact{}`, `enquiryNumber`, enquiry `status`, `adminNotes`).
- **leads:** `id, type, name, email, phone, orderNumber, category, subject, message, status, createdAt, updatedAt, notes`. → REPURPOSE as CRM.
- **users:** `id, email, password, firstName, lastName, phone, avatar, addresses[], isActive, createdAt, updatedAt, storeCredit`. Keep; **never surface `password`**; retire `storeCredit` with wallet.
- **reviews:** `id, productId, userId, userName, rating, title, body, status, isVerifiedPurchase, helpfulCount, createdAt, updatedAt`. Keep.
- **settings** (singleton): keys `store, shipping, payment, notifications, seo, social`; `settings.store` currently holds generic e‑commerce data (`name:"My E‑Commerce Store"`, `currency/currencySymbol`, `taxRate:18`, `taxIncluded`, `logo/favicon:null`). → keep `store/seo/social/notifications` (reshape `store` to NEBM contact facts), drop `shipping/payment`.
- **dealsConfig** (singleton): `enabled, hero, timer, featuredCouponIds, dealOfTheDayIds, featuredProductIds, updatedAt`. → REMOVE (admin) / repurpose storefront Special Products.

**Current generic seed (to be replaced by NEBM):** top‑level categories are `Electronics, Clothing, Home & Garden, Sports & Fitness, Books, Women's Ethnic Wear, Men's Fashion, Beauty & Personal Care, Kitchen & Dining, Footwear` **plus a stray `Test` (id 16)**; products are generic (laptop/earbuds/etc.).

---

## 4. Routing & providers (verified from `App.js`)

**Provider nesting (outer→inner):** `ErrorBoundary → ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider → Router`. The **storefront** subtree (`path="/*"`) is additionally wrapped in `DealsConfigProvider` ([App.js:66‑135](src/App.js)). Renaming Cart→Enquiry / Order→Enquiry contexts must preserve these exact positions or the app white‑screens.

**Admin routes** under `/admin` (index = `AdminLogin`; the rest inside `<AdminLayout/>`): `dashboard, products, categories, orders, returns, payments, users, shipping, coupons, special-offers, reviews, leads, settings`.

**Storefront routes:** `/`, `/products`, `/products/:slug` (legacy numeric id resolves + redirects to slug — handled inside `ProductDetails`), `/checkout`, `/order-confirmation/:orderNumber`, `/orders` (OrderHistory), `/profile`, `/wishlist`, `/special-offers`, `/help`, `/support`, `/about`, `/privacy`, `/terms`, `/cookies`, `/refund`, `* → /`.

**Category helpers (`utils/categories.js`, all 6 present & unchanged‑target):** `categoryParam` (slug‑preferred token), `resolveCategory` (slug or legacy numeric id), `getDescendantIds`, `getCategoryScopeIds` (**parent‑includes‑children**), `orderCategoriesHierarchically`, `getMainMenuCategories` (`showInMainMenu && isActive`, ordered by `menuOrder`). Canonical URL scheme: `/products?category=<slug>`.

**Palettes (re‑skin baseline):** storefront light `--sf-color-primary:#667eea`, `--sf-color-secondary:#f093fb`, `--sf-color-accent:#ec4899`; **dark mode via `body.dark`** flips to purple/pink (`#a855f7`/`#ec4899`) — both blocks must be re‑skinned. `colors.js` mirrors this for MUI (LIGHT `#667eea`/`#f093fb`, DARK `#a855f7`/`#ec4899`). Admin is a **separate indigo** palette (`#4338ca`/`#4f46e5`) in `adminTheme.js`. Target brand: Blue `#1885d8` + Gold/Orange `#fa9c4c`.

---

## 5. Feature → Enquiry mapping (KEEP / RENAME / REPURPOSE / EXTEND / REMOVE)

Reconfirmed identical to `prompts/00` §5. Summary:

| Area | Action | Enquiry target |
|---|---|---|
| Dual‑mode API (`api.js`/`baseURL.js`), safe DELETE (`server.js`), Auth, slug/category rules | **KEEP** | Crown jewels — never break. |
| Theme tokens + logo/manifest | **EXTEND/RE‑SKIN** | Blue `#1885d8` / Gold `#fa9c4c`; NEBM logo/meta. |
| categories data / products schema + admin form + `PriceBlock` | **REPURPOSE (data) / EXTEND** | NEBM tree; tiered/exact/on‑enquiry pricing, `unitType`, `special`. |
| Cart (`CartContext`, `CartDrawer`, `useCart`, `AddToCartBar`, `QuantityStepper`) | **RENAME → Enquiry List** | Multi‑product + qty, **no totals/payment**; keep localStorage key + merge/clear logic. |
| Checkout + `OrderContext` + `orders.create` | **REPURPOSE → Submit Enquiry** | Note/message + captured contact; **no payment/shipping/coupon side effects**. |
| OrderConfirmation | **RENAME → Enquiry success** | Enquiry reference. |
| orders collection + AdminOrders | **REPURPOSE → `enquiries` / Admin "Enquiries"** | CRM: New→Contacted→In Discussion→Quotation Sent→Converted→Closed→Lost. |
| OrderHistory | **REPURPOSE** | Customer's enquiries. |
| Wishlist / Profile / Reviews / Users | **KEEP (re‑skin)** | — |
| Leads (`AdminLeads`) | **REPURPOSE/EXTEND** | Contact + enquiry CRM. |
| Settings | **EXTEND/TRIM** | store/contact/SEO/social; drop shipping/payment. |
| Buy Now | **REMOVE** | No purchase path. |
| Payments / Shipping / Coupons / Returns / Special Offers (admin) / Wallet | **REMOVE / RETIRE** | Delete routes+nav+pages; leave shared cascade helpers **dormant** (not invoked). |
| Policy pages | **KEEP / RE‑WORD** | Away from purchase/returns. |
| 4 numbered docs + README | **REWRITE** | NEBM + enquiry model. |

**Storefront e‑commerce terms to convert** (locations confirmed by surface walk): `AddToCartBar` ("Add to Cart"/"Buy Now"/"Out of Stock"), `PriceBlock`/`ProductCard` (price/compare/"You save"), `CartDrawer` ("Shopping Cart"/"Checkout"/"Shipping"/"Continue Shopping"), `Header` (cart badge), `Footer` ("Order Tracking"/"Returns & Exchange"/"Shipping Info"), `Checkout` (`STEPS=["Cart","Shipping","Payment","Review"]`, coupon, address, payment methods, "Place Order", Order Summary), `OrderConfirmation` ("Order Confirmed!", payment/shipping/invoice/track), `OrderHistory` ("My Orders", cancel/return/track), `SpecialOffers` ("Active Coupons"), `SidebarMenu` (Deals).

**Admin surface (`AdminLayout.js`) — verified:** menu groups **Dashboard** | **Catalogue** (Products, Categories, Reviews) | **Sales** (Orders, Returns, Payments, Coupons, Special Offers) | **Operations** (Shipping, Users, Leads, Settings). Notifications **poll every 30 000 ms** when authenticated, calling `admin.getOrders()` (filter `fulfillmentStatus==="unfulfilled" || status ∈ {pending,processing}`) and `admin.getLeads()` (filter `status==="new"`); sorts by time, badges uncleared count. After the pivot these filters must read **enquiry** statuses or notifications silently break. 14 admin page files exist under `src/pages/Admin/` (incl. `AdminLogin`).

---

## 6. Reconciliation deltas vs `prompts/00`

All Phase‑1 claims reproduce. The following are **enrichments / small corrections** (none contradict the map):

1. **Stray `Test` category (id 16)** exists in the seed's 16 categories — a reseed artifact to drop when the NEBM tree lands (`prompts/06`).
2. **8 root docs, not 7** — `MASTER_PROMPT.md` (the NEBM master prompt) is present alongside the 7 the map lists; `README.md` is stock CRA.
3. **Dark‑mode palette is real** — storefront has a full `body.dark` token block (purple/pink `#a855f7`/`#ec4899`), and `colors.js` DARK mirrors it. The re‑skin (`prompts/03`) must handle **both** light and dark blocks, not just the light `#667eea`.
4. **Fuller storefront route list** — beyond the map's headline routes, `/orders`, `/profile`, `/wishlist`, `/special-offers`, `/help`, `/support`, `/about`, `/privacy`, `/terms`, `/cookies`, `/refund`, and `* → /` are all present; the legacy numeric product redirect lives **inside `ProductDetails`** (route is `/products/:slug`).
5. **Extra cascade/audit helpers** beyond the map's list: `appendPaymentRefund`, `historyEvent`, `currentAdminName` — same "keep dormant" treatment.
6. **`.env` nuance** — the dev `.env` sets `REACT_APP_API_URL=http://localhost:3001` **and** `REACT_APP_USE_MOCK_API=true`, so `IS_MOCK_API` is true via both code paths simultaneously (belt‑and‑suspenders).

---

## 7. Risk register (unchanged — restated for the build)

1. **order⇄payment⇄coupon⇄return⇄wallet cascades** — enquiry submit must POST a pure payload; verify no residual `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` fires. Guard reads of emptied collections.
2. **Provider nesting order** (`App.js`) — rename Cart/Order/Deals contexts atomically at the same positions or white‑screen.
3. **Slug + category rules** — preserve unique slugs, correct `parentId`, and `getCategoryScopeIds` parent‑includes‑children on reseed.
4. **Safe non‑cascading DELETE** (`server.js`) — must remain; integrity enforced in the API layer.
5. **Dual‑mode fidelity** — every change stays interchangeable through `extractData()`.
6. **Password hygiene** — never surface `users[].password`.
7. **AdminLayout notifications + `getDashboardStats`** — retarget `fulfillmentStatus`/legacy `status` filters to enquiry statuses; reshape revenue/returns/coupons stats.
8. **Cart localStorage key + sync effects** — keep a stable key and login‑merge/logout‑clear when renaming to Enquiry List.

---

*Verification complete. No `src/`, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`. Later prompts (`02`+) build on the facts above.*
