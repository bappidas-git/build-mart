# 00 — Repository Analysis & Requirement Map (North East Build Mart)

> **Phase‑1 deliverable.** This document is the *source of truth* for the build‑prompt set (`prompts/01-*.md … prompts/35-*.md`). It records what the boilerplate is today and how every existing e‑commerce feature maps onto the **enquiry** model for **North East Build Mart (NEBM)**. It was produced by reading the repository end‑to‑end; no application code was modified in the run that created it.
>
> **Prime directive for every later prompt:** *analyze → reuse → refactor → rename → redesign → extend* the existing boilerplate. Do **not** rewrite from scratch, and do **not** break the dual‑mode API layer, auth, routing, the slug/category rules, or the safe non‑cascading DELETE.

---

## 1. Repo map — structure, stack, conventions

**App type:** Create React App (react-scripts 5) storefront **and** admin panel, backed in dev by **JSON Server** (`db.json`) through a custom `server.js`, and in production by a Laravel REST API (`…/api/v1`). One React codebase drives both backends via a **dual‑mode API layer**.

**Stack (from `package.json`, name `ecommerce-boilerplate`):** React 18, `react-router-dom` 6, MUI 5 (`@mui/material`, `@mui/icons-material`) + `@emotion`, `framer-motion` 10, `axios` 1.6, `sweetalert2`, `@iconify/react`, `canvas-confetti`, `json-server` 0.17. Dev tool: `concurrently`.

**Scripts:** `npm start` (CRA :3000) · `npm run server` (`node server.js` → JSON Server :3001) · `npm run dev` (both) · `npm run build`.

**Top‑level layout:**
```
db.json                      custom seed DB (18 collections/singletons)
server.js                    JSON Server wrapper w/ SAFE non-cascading DELETE
.env / .env.example / .env.production   REACT_APP_* config + mock switch
public/  index.html manifest.json favicon.svg logo{,192,512}.png robots.txt
00_…04_*.md, README.md, STOREFRONT_UX_GUIDELINES.md   7 docs
src/
  App.js                     provider nesting + all routes (admin + storefront)
  index.js index.css App.css
  services/  api.js (2459 lines) baseURL.js
  context/   Theme, Auth, Admin, Cart, Order, Wishlist, DealsConfig
  hooks/     useAuth, useCart, useAdminBodyClass, useSound
  theme/     tokens.js colors.js adminTheme.js storefront-tokens.css
  utils/     categories.js constants.js helpers.js dealsConfig.js authStorage.js
  components/  Header Footer HeroSection FeaturedProducts CartDrawer SidebarMenu
               SearchModal AuthModal BottomNav BottomDrawer Breadcrumb Newsletter
               CTASection FAQ ReviewModal ScrollToTop ErrorBoundary AdminLayout
    storefront/ ProductCard PriceBlock AddToCartBar QuantityStepper VariantSelector
                ProductGallery RelatedProducts ReviewsSection TrustBadges SocialProof
                FrequentlyBoughtTogether DeliveryReturnsInfo StarRating variantUtils
  pages/     Home Products ProductDetails Checkout OrderConfirmation OrderHistory
             Profile Wishlist SpecialOffers AboutUs HelpCenter Support
             PrivacyPolicy TermsOfService CookiePolicy RefundPolicy
    Admin/   AdminLogin AdminDashboard AdminProducts AdminCategories AdminOrders
             AdminReturns AdminPayments AdminUsers AdminShipping AdminCoupons
             AdminSpecialOffers AdminReviews AdminLeads AdminSettings
```

**Conventions (obey and propagate into every prompt):**
- **Styling:** per‑component **CSS Modules** (`*.module.css`) on the storefront; the admin uses MUI + a dedicated `adminTheme.js`. Storefront brand tokens are CSS custom properties in `storefront-tokens.css` (consumed by CSS Modules) mirrored in `theme/tokens.js`/`colors.js` (consumed by MUI). **Storefront and admin palettes are intentionally separate.**
- **Routing:** slug‑based product URLs (`/products/:slug`) with a legacy numeric redirect; category deep‑links use `?category=<slug>` (legacy numeric id still resolves).
- **Providers:** nested in `App.js` — `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`, with the storefront tree additionally wrapped in `DealsConfigProvider`.
- **DELETE is safe & non‑cascading** (see `server.js`): only the addressed row is removed, `getRemovable` is neutralised. Never reintroduce cascade delete.
- **JSON‑shape fidelity:** the same UI must work against JSON Server *and* Laravel; responses always flow through `extractData()`.

---

## 2. API inventory (`src/services/api.js`, ~2459 lines)

One `apiService` object; **every method branches on `IS_MOCK_API`** (from `baseURL.js`). Mock = JSON Server at `http://localhost:3001` (query params + client‑side shaping); production = Laravel REST. Shared helpers: `extractData()` (unwraps Laravel `{success,data,meta}` vs raw JSON‑Server payloads), `extractMeta()`, `getErrorMessage()`, an axios **request interceptor** (attaches the correct bearer token — admin vs user), and a **response interceptor** (per‑session 401 handling).

### Storefront/customer namespaces & methods
| Namespace | Methods |
|---|---|
| `auth` | `login, register, logout, getUser, updateUser, changePassword` |
| `products` | `getAll, getById, getBySlug, getFeatured, getTrending, getByCategory, search, getReviews, getRelated, getFrequentlyBoughtTogether` |
| `categories` | `getAll, getById, getBySlug` |
| `banners` | `getAll` |
| `cart` | `getCart, addToCart, updateCartItem, removeFromCart, clearCart` |
| `orders` | `create, getByUserId, getById, getByOrderNumber, cancel` |
| `wallet` | `getBalance, getTransactions` |
| `reviews` | `getMine, submit` |
| `returns` | `create, getByUserId, getById` |
| `coupons` | `getActive, validate` |
| `wishlist` | `get, add, remove` |
| `shipping` | `getMethods` |
| `settings` | `get` |
| `deals` | `getConfig` |
| `leads` | `createContact, createContactLead, createNewsletter, createNewsletterLead` |

### `apiService.admin.*`
`login, logout, getDashboardStats,`
`getProducts, getProduct, createProduct, updateProduct, deleteProduct,`
`getCategories, createCategory, updateCategory, deleteCategory,`
`getOrders, getOrder, updateOrder, updateOrderStatus, cancelOrder, initiateOrderRefund, completeOrderRefund, failOrderRefund,`
`getReturns, getReturn, createReturn, updateReturn, scheduleReturnPickup, markReturnInTransit,`
`getPayments, getPayment, getRefunds, issueRefund,`
`getShippingMethods, createShippingMethod, updateShippingMethod, deleteShippingMethod, shiprocketCreateOrder, shiprocketTrack,`
`getCoupons, createCoupon, updateCoupon, deleteCoupon,`
`getReviews, createReview, updateReview, deleteReview,`
`getUsers, getUser, updateUser,`
`getLeads, getLead, updateLead, deleteLead,`
`getSettings, updateSettings,`
`getDealsConfig, updateDealsConfig`

### Mock‑only cascade helpers (simulate Laravel server‑side transactions)
`performCancel`, `createPaymentForOrder`, `redeemCouponByCode` / `restoreCouponByCode`, `reflectReturnRefund`, `reflectPaymentOnOrder`, `restockItems`, wallet ledger (`creditWallet` / `debitWallet` / `computeWalletBalance` / `writeWalletTransaction`), `createRefundRecord` / `finalizeRefundRecord`, `markPaymentRefundPending`, `voidPaymentForOrder`, `deleteWithVerify`. **These couple `orders ⇄ payments ⇄ coupons ⇄ returns ⇄ wallet`.** `orders.create` (mock) already fires `createPaymentForOrder`, `redeemCouponByCode`, and `debitWallet` as side effects — the enquiry flow must **not** trigger these.

`getDashboardStats` (mock) returns `{ totalProducts, totalOrders, totalRevenue, totalUsers, pendingOrders, pendingReturns, lowStockProducts, activeCoupons }` — several fields reference modules NEBM removes and must be reshaped.

---

## 3. Data model — `db.json` collections (record counts today)

`banners`(3) · `users`(3) · `admins`(1) · `categories`(16) · `products`(19) · `cart`(0) · `orders`(11) · `returns`(2) · `payments`(9) · `refunds`(3) · `shipping_methods`(4) · `coupons`(5) · `reviews`(8) · `wishlist`(3) · `leads`(4) · `settings`(singleton) · `walletTransactions`(3) · `dealsConfig`(singleton).

Key field shapes (verified):
- **products:** `id, name, slug, sku, shortDescription, description, categoryId, brand, images[], price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], featured, trending, hot, isActive, rating, totalReviews, metaTitle, metaDescription, createdAt, updatedAt, frequentlyBoughtTogetherIds[], relatedProductIds[]`. → **Extend** with `priceType ("exact"|"tiered"|"onEnquiry")`, `unitType`, `minQty`, `priceTiers[{minQty,price}]`, display flags `showExactPrice`, `showTieredPricing`, `cardPriceMode`, and a `special` flag for the Special Products collection.
- **categories:** self‑referencing tree — `id, name, slug, description, image, parentId, isActive, sortOrder, showInMainMenu, menuOrder, createdAt, updatedAt`. Current tree is generic (Electronics/Clothing/…). → **Replace** with the NEBM tree (§4 below).
- **orders:** `id, orderNumber, userId, items[], billingAddress, shippingAddress, subtotal, discountAmount, couponCode, shippingAmount, taxAmount, total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, trackingNumber, trackingUrl, shiprocketOrderId, notes, createdAt, updatedAt, statusHistory[]`. → **Repurpose into `enquiries`**: keep `items[]`, `statusHistory[]`, `notes`; drop money/payment/shipping fields; add `contact{name,phone,email}`, `enquiryNumber`, enquiry `status`, `adminNotes`.
- **leads:** `id, type(contact|newsletter), name, email, phone, orderNumber, category, subject, message, status, notes, createdAt, updatedAt`. → **Repurpose** as the Leads/CRM surface (contact submissions + enquiry‑derived leads).
- **users:** `id, email, password, firstName, lastName, phone, avatar, addresses[], isActive, createdAt, updatedAt, storeCredit`. Keep (drop/ignore `storeCredit` once wallet is retired). **Never leak `password` into state/storage.**
- **reviews:** `id, productId, userId, userName, rating, title, body, status, isVerifiedPurchase, helpfulCount, createdAt, updatedAt`. Keep.
- **settings** (singleton): `store, shipping, payment, notifications, seo, social`. → keep `store/seo/social/notifications`; drop `shipping/payment` sections; reshape `store` to NEBM contact facts.
- **wishlist / banners:** keep.

---

## 4. NEBM category tree to seed (replaces generic tree)

Top‑level (with sub‑categories):
1. **WPC Louvers**
2. **Polycarbonate Sheets**
3. **FRP Sheets**
4. **Waterproofing Products**
5. **Tiles** → Floor Tiles · Wall Tiles · Vitrified Tiles · Bathroom & Kitchen Tiles · Outdoor Tiles
6. **Doors** → Steel Doors · PVC Doors · WPC Doors · Designer Doors · Bathroom Doors
7. **Hardware** → Door Locks · Handles & Hinges · Fasteners · Cabinet Fittings · Construction Hardware
8. **Plumbing** → PVC Pipes · CPVC Pipes · SWR Pipes · Water Tanks · Pipe Fittings & Accessories
9. **Bath Fittings** → Showers · Faucets & Taps · Wash Basins · Sanitary Ware · Bathroom Accessories
10. **Cement** → OPC Cement · PPC Cement · Premium Construction Cement
11. **Steel Rods** → TMT Bars · Construction Steel · High‑Strength Reinforcement Bars
12. **Special Products** — a *badged/curated collection* (homepage highlight + `special` flag on products), **not** an exclusive category; those items also live under their top‑level categories.

The `src/utils/categories.js` helpers (`categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories`) must keep working unchanged — only the seed data and `showInMainMenu`/`menuOrder`/`sortOrder` values change.

---

## 5. Feature → Enquiry mapping (KEEP / RENAME / REPURPOSE / EXTEND / REMOVE)

| Area / file(s) | Action | Why / target enquiry behaviour |
|---|---|---|
| Dual‑mode API layer (`api.js`, `baseURL.js`) | **KEEP** | Crown jewel. Preserve `IS_MOCK_API` branching + `extractData()` everywhere. |
| Safe DELETE (`server.js`) | **KEEP** | Prevents cascade/500 desync. Never revert. |
| Auth (`AuthContext`, `authStorage`, `auth`/`admin.login`) | **KEEP** | Register/login/account preserved. |
| Theme (`colors.js`, `tokens.js`, `storefront-tokens.css`, `adminTheme.js`) | **EXTEND/RE‑SKIN** | Swap palette to Blue `#1885d8` + Gold `#fa9c4c`; keep the token architecture. |
| Logo/favicon/manifest (`public/*`, `index.html`) | **EXTEND** | NEBM logo/icon (Cloudinary), title, meta. |
| `categories` collection + `categories.js` | **REPURPOSE (data) / KEEP (helpers)** | Seed NEBM tree; parent‑includes‑children + slug rules unchanged. |
| `products` schema + admin form + `PriceBlock` | **EXTEND** | Add tiered/exact/on‑enquiry pricing, `unitType`, `special`. |
| Cart (`CartContext`, `useCart`, `CartDrawer`, `QuantityStepper`, `cart` API) | **RENAME/REPURPOSE** | Becomes **Enquiry List** (multi‑product + quantities, **no totals/payment**). `getCartTotal` retired from UI. |
| `Checkout` page + `OrderContext` + `orders.create` | **REPURPOSE** | Becomes **Submit Enquiry / Enquiry Summary** with a note/message + captured contact; **no payment/shipping/coupon**; must **not** fire payment/coupon/wallet side effects. |
| `OrderConfirmation` | **RENAME** | **Enquiry success** screen with an enquiry reference. |
| `orders` collection + `AdminOrders` | **REPURPOSE → `enquiries` / Admin “Enquiries”** | Lightweight CRM: list/search/filter, detail (products/qty/customer/note), admin notes, status New→Contacted→In Discussion→Quotation Sent→Converted→Closed→Lost. |
| `OrderHistory` | **REPURPOSE** | Customer sees their **enquiries**, not orders. |
| Wishlist (`Wishlist`, `WishlistContext`) | **KEEP** | Re‑skin only. |
| Profile / account (`Profile`) | **KEEP** | Re‑skin; history = enquiries. |
| Reviews (`AdminReviews`, `ReviewsSection`, `reviews`) | **KEEP** | Re‑skin. |
| Users (`AdminUsers`) | **KEEP** | Re‑skin. |
| Leads (`AdminLeads`, `leads`) | **REPURPOSE/EXTEND** | CRM for contact + enquiry data. |
| Settings (`AdminSettings`, `settings`) | **EXTEND/TRIM** | store/contact/SEO/social; drop shipping/payment sections. |
| **Buy Now** everywhere | **REMOVE** | No purchase path. |
| Payments (`AdminPayments`, `payments`/`refunds`, refund methods) | **REMOVE/RETIRE** | Retire route/nav/page; leave cascade helpers dormant (not invoked by enquiry flow). |
| Shipping (`AdminShipping`, `shipping_methods`, shiprocket) | **REMOVE/RETIRE** | Same. |
| Coupons (`AdminCoupons`, `coupons`) | **REMOVE/RETIRE** | Same. |
| Returns (`AdminReturns`, `returns`/`refunds`) | **REMOVE/RETIRE** | Same. |
| Special Offers admin (`AdminSpecialOffers`, `dealsConfig`, `DealsConfigProvider`) | **REMOVE** (admin) / repurpose storefront **Special Products** | The *badged Special Products collection* replaces deal/coupon merchandising. |
| Wallet (`wallet`, `walletTransactions`, store credit) | **REMOVE/RETIRE** | No money movement. |
| Policy pages (`RefundPolicy`, `Privacy`, `Terms`, `Cookie`) | **KEEP/RE‑WORD** | Re‑word away from purchase/returns where needed. |
| Docs (7 `.md`) | **REWRITE** | Reflect NEBM + enquiry model + new schema/API. |

### Removal strategy for the ex‑commerce cascades
The mock cascade helpers stay in `api.js` but become **dormant**: the enquiry create path calls only `POST /orders` (→ `/enquiries`) with `statusHistory` seeded, and must **not** call `createPaymentForOrder`, `redeemCouponByCode`, or `debitWallet`. Removing admin Payments/Shipping/Coupons/Returns/Special‑Offers means deleting their **routes** (`App.js`), **nav entries** (`AdminLayout.menuItems`), and **page files**, and neutralising the `getDashboardStats` fields and `AdminLayout` notification logic that reference orders‑as‑purchases. Do this without deleting the shared helpers other code imports, so the build never breaks.

---

## 6. Risk register (fragile couplings later prompts must respect)

1. **order⇄payment⇄coupon⇄return⇄wallet cascades** — `orders.create` (mock) auto‑creates a payment, redeems coupons, and debits the wallet. The enquiry submit must send a *pure* enquiry payload and never invoke these. When repurposing `orders`→`enquiries`, verify no residual side effect fires. Deleting `db.json.payments/refunds/coupons/returns/walletTransactions` must not orphan a code path that still reads them at runtime (guard reads or keep empty arrays).
2. **Provider nesting order** (`App.js`) — Theme→Auth→Admin→Wishlist→Cart→Order, storefront wrapped in `DealsConfigProvider`. If `DealsConfigProvider`/`OrderProvider` are renamed, update the nesting atomically or the app white‑screens. Renaming Cart→Enquiry context must keep the same provider position.
3. **Slug + category rules** — product URLs resolve by slug with legacy numeric redirect; category filtering uses `getCategoryScopeIds` (parent includes children). Reseeding categories/products must preserve unique slugs and correct `parentId` links, or listings/deep links break.
4. **Safe non‑cascading DELETE** (`server.js`) — must remain; category referential integrity is enforced in the API layer (block delete while children/products reference it), not by DB cascade.
5. **Dual‑mode fidelity** — every data change must keep the JSON‑Server and Laravel response shapes interchangeable through `extractData()`; never hardcode a shape that only works in mock.
6. **Password hygiene** — `users[].password` exists in `db.json`; never surface it into React state, `localStorage`, or logs.
7. **AdminLayout notifications & dashboard** poll `getOrders`/`getLeads` and filter on `fulfillmentStatus`/legacy `status`; after the enquiry pivot these filters must read enquiry statuses instead, or notifications silently break.
8. **CartContext localStorage key `"cart"`** and server‑sync effects — renaming to Enquiry List should keep a stable storage key and the login‑merge/logout‑clear logic, or persisted lists are lost.

---

*End of analysis. Prompts `01`–`35` operationalise this map, in build order, each self‑contained.*
