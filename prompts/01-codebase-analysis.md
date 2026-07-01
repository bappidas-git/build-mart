# 01 — Codebase Analysis & Re-Grounding

## 1. Objective

Re-establish a complete, current understanding of this repository at the **start of a build session** for the **North East Build Mart (NEBM)** project, mirroring the Phase‑1 analysis captured in `prompts/00-analysis-and-requirement-map.md`. This prompt is **analysis‑only**: read the whole `src/`, `db.json`, `server.js`, the seven root docs and `.env`, then **produce or refresh a written analysis note** (repo map, API inventory, data model, feature→enquiry mapping, risk register). **No application code, `db.json`, docs or config are modified in this prompt.** The output is an updated understanding note you may append to / reconcile against `prompts/00-analysis-and-requirement-map.md`.

## 2. Context / background

North East Build Mart is a building‑materials business — *"Deals in all kinds of building materials for interior and exterior use"* — at Lawkhuwa Road, Nagaon, Assam – 782002 (phones +91 86385 43526 · +91 88762 89972). We are converting a generic React + JSON Server **e‑commerce boilerplate** (package name `ecommerce-boilerplate`) into an e‑commerce‑*style* **enquiry** platform: customers browse, build an **Enquiry List** (formerly Cart) and **Submit an Enquiry** (formerly Checkout/Order) — there is **no purchasing, payment, shipping, coupon or returns** path. Brand colours are Primary Blue `#1885d8` and Accent Gold/Orange `#fa9c4c`.

You must not assume any chat memory. Before touching anything, you re‑derive the facts. The authoritative Phase‑1 record is `prompts/00-analysis-and-requirement-map.md`; this prompt regenerates the same understanding from source so later prompts (`02`+) build on verified ground. The **prime directive** for the whole project is *analyze → reuse → refactor → rename → redesign → extend* — never rewrite from scratch, never break the dual‑mode API layer, auth, routing, slug/category rules, or the safe non‑cascading DELETE.

## 3. Files & folders to inspect

Read end‑to‑end (or skim large files structurally):

- **Config / entry:** `package.json`, `.env`, `.env.example`, `.env.production`, `src/index.js`, `src/App.js`, `public/index.html`, `public/manifest.json`.
- **Dual‑mode API layer:** `src/services/baseURL.js` (exports `BASE_URL`, `IS_MOCK_API`, `MOCK_API_URL`, `API_VERSION`), `src/services/api.js` (~2459 lines — skim structure).
- **Mock backend:** `server.js` (safe non‑cascading DELETE + neutralised `getRemovable`).
- **Data:** `db.json` — all 18 collections/singletons and their field shapes.
- **Contexts:** `src/context/` — Theme, Auth, Admin, Cart, Order, Wishlist, DealsConfig.
- **Hooks:** `src/hooks/` — useAuth, useCart, useAdminBodyClass, useSound.
- **Theme/tokens:** `src/theme/tokens.js`, `colors.js`, `adminTheme.js`, `storefront-tokens.css`; `src/index.css`, `src/App.css`.
- **Utils:** `src/utils/` — categories.js, constants.js, helpers.js, dealsConfig.js, authStorage.js.
- **Storefront:** `src/components/**` (Header, Footer, CartDrawer, SidebarMenu, BottomNav, AuthModal, SearchModal, `storefront/` PriceBlock/ProductCard/AddToCartBar/QuantityStepper/etc.) and `src/pages/**` (Home, Products, ProductDetails, Checkout, OrderConfirmation, OrderHistory, Profile, Wishlist, SpecialOffers, policy pages).
- **Admin:** `src/components/AdminLayout/AdminLayout.js` and `src/pages/Admin/**` (AdminLogin, AdminDashboard, AdminProducts, AdminCategories, AdminOrders, AdminReturns, AdminPayments, AdminUsers, AdminShipping, AdminCoupons, AdminSpecialOffers, AdminReviews, AdminLeads, AdminSettings).
- **Docs (root):** `README.md`, `00_BACKEND_README_AND_CONVENTIONS.md`, `01_DATABASE_SCHEMA.md`, `02_API_ENDPOINTS.md`, `03_BUSINESS_LOGIC_AND_CASCADES.md`, `04_AUTH_ERRORS_AND_EDGE_CASES.md`, `STOREFRONT_UX_GUIDELINES.md` (plus `MASTER_PROMPT.md` if present).

## 4. Step-by-step implementation instructions

1. **Stack & scripts.** From `package.json` confirm: CRA (`react-scripts` 5), React 18, `react-router-dom` 6, MUI 5 + `@emotion`, `framer-motion` 10, `axios`, `sweetalert2`, `@iconify/react`, `canvas-confetti`, `json-server` 0.17, `concurrently`. Scripts: `npm start` (:3000), `npm run server` (`node server.js` → JSON Server :3001), `npm run dev` (both), `npm run build`. Record the app name (`ecommerce-boilerplate`).
2. **Dual‑mode switch.** In `baseURL.js` confirm `IS_MOCK_API` is true when `REACT_APP_USE_MOCK_API === "true"` (current `.env`) or `BASE_URL === MOCK_API_URL` (`http://localhost:3001`); production points at `REACT_APP_API_URL` (`…/api/v1`). Note the log line printed in development.
3. **API layer.** In `api.js` locate the helpers `extractData()` (unwraps Laravel `{success,data,…}` vs raw JSON‑Server payloads — verify exact logic: it returns `response.data.data` when `"success" in response.data`, else `response.data`), `extractMeta()`, `getErrorMessage()`, and the axios request/response interceptors (admin‑vs‑user bearer token; 401 handling). Confirm **every method branches on `IS_MOCK_API`**.
4. **API namespaces.** Enumerate the customer namespaces (`auth`, `products`, `categories`, `banners`, `cart`, `orders`, `wallet`, `reviews`, `returns`, `coupons`, `wishlist`, `shipping`, `settings`, `deals`, `leads`) and the full `apiService.admin.*` surface. Flag the **mock‑only cascade helpers** (`createPaymentForOrder`, `redeemCouponByCode`/`restoreCouponByCode`, `debitWallet`/`creditWallet`/`writeWalletTransaction`, `reflectReturnRefund`, `performCancel`, etc.) and note that **`orders.create` (mock) fires `createPaymentForOrder`, `redeemCouponByCode` and `debitWallet` as side effects** (verify at the `create:` method — it seeds `statusHistory` then calls these when `IS_MOCK_API`).
5. **Data model.** In `db.json` list every collection with its record count and key field shapes: `banners`(3), `users`(3), `admins`(1), `categories`(16), `products`(19), `cart`(0), `orders`(11), `returns`(2), `payments`(9), `refunds`(3), `shipping_methods`(4), `coupons`(5), `reviews`(8), `wishlist`(3), `leads`(4), `settings`(singleton: store/shipping/payment/notifications/seo/social), `walletTransactions`(3), `dealsConfig`(singleton). Note the generic seed data (Electronics/Clothing categories; laptop/earbud products) that NEBM will replace.
6. **Routing & providers.** In `App.js` record the provider nesting `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`, the storefront tree wrapped in `DealsConfigProvider`, admin routes under `/admin/*` via `AdminLayout`, `/products/:slug` (+legacy numeric redirect), `/checkout`, `/order-confirmation/:orderNumber`.
7. **Theme & utils.** Record the current storefront palette (`colors.js` primary `#667eea`, secondary `#f093fb`; `storefront-tokens.css` `--sf-color-primary:#667eea`, dark mode via `body.dark`) and the admin indigo palette in `adminTheme.js`. In `utils/categories.js` confirm the helpers `categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds` (parent‑includes‑children), `orderCategoriesHierarchically`, `getMainMenuCategories`, and the slug URL scheme (`/products?category=<slug>`, legacy numeric resolves).
8. **Storefront & admin surfaces.** Walk the components/pages, noting where e‑commerce terms surface (Cart, Add to Cart, Buy Now, Checkout, Order, Payment, Shipping, Coupon) and where `AdminLayout.menuItems` and `getDashboardStats` reference modules NEBM removes.
9. **Docs.** Skim the seven root docs; note which describe purchase/payment/shipping flows that the enquiry pivot invalidates.
10. **Produce the analysis note.** Write (or refresh) a structured understanding note covering: **(a) repo map**, **(b) API inventory**, **(c) data model**, **(d) feature→enquiry mapping (KEEP/RENAME/REPURPOSE/EXTEND/REMOVE)**, **(e) risk register**. Reconcile against `prompts/00-analysis-and-requirement-map.md`; append deltas or corrections there if anything drifted. Do **not** edit application code.

## 5. UI/UX requirements

N/A — analysis only. (For reference in later prompts: brand Blue `#1885d8`, Accent Gold/Orange `#fa9c4c`, Apple‑style minimalism.)

## 6. Data & API requirements

No writes. Read‑only inspection of `db.json` and `api.js`. When you record the API inventory, restate the **dual‑mode rule**: every method branches on `IS_MOCK_API`; responses are normalised through `extractData()`; JSON‑Server and Laravel response shapes must stay interchangeable. Explicitly note that `orders.create` (mock) triggers `createPaymentForOrder` / `redeemCouponByCode` / `debitWallet` — the future enquiry flow must **not** fire these.

## 7. Admin panel requirements

Inventory only. Record `AdminLayout.menuItems` groups (Dashboard | Catalogue: Products, Categories, Reviews | Sales: Orders, Returns, Payments, Coupons, Special Offers | Operations: Shipping, Users, Leads, Settings), the 30s polling of `getOrders`+`getLeads` for notifications, and the `getDashboardStats` fields (`totalProducts, totalOrders, totalRevenue, totalUsers, pendingOrders, pendingReturns, lowStockProducts, activeCoupons`) — note which reference modules NEBM removes.

## 8. Storefront requirements

Inventory only. Note every user‑facing e‑commerce term (Cart, Add to Cart, Buy Now, Checkout, Place Order, Order, Payment, Shipping, Coupon) and the components/pages that render them, so `prompts/02` can turn the terminology map into an itemised spec.

## 9. Acceptance criteria

- [ ] A written analysis note exists (new file or an appended/reconciled section of `prompts/00-analysis-and-requirement-map.md`) with all five parts: repo map, API inventory, data model, feature→enquiry mapping, risk register.
- [ ] Stack, scripts and the `IS_MOCK_API` switch are documented from source (not memory).
- [ ] The `api.js` namespaces and the `orders.create` side‑effect chain are listed.
- [ ] All 18 `db.json` collections/singletons with counts and key field shapes are captured.
- [ ] Provider nesting order and the slug/category routing rules are recorded.
- [ ] Current palettes (`#667eea` storefront, indigo admin) are noted as the re‑skin baseline.
- [ ] **No** application code, `db.json`, docs or config were modified by this prompt.

## 10. Testing / verification steps

1. `git status` shows **no** changes to `src/`, `db.json`, `server.js`, `public/`, docs or config — only (optionally) an analysis note under `prompts/`.
2. Sanity‑run the app to confirm the baseline you analysed still boots: `npm run dev`, open `http://localhost:3000` (storefront) and `http://localhost:3001/products` (JSON Server) — 19 products, 16 categories, 11 orders returned.
3. Cross‑check three claims against source: `IS_MOCK_API` in `baseURL.js`, the `extractData()` body in `api.js`, and the safe DELETE handler in `server.js`.

## 11. Notes on preserving existing functionality

This prompt is non‑destructive. Do **not**:
- Modify any file outside `prompts/`.
- Alter the **dual‑mode API layer** (`IS_MOCK_API` branching + `extractData()` + JSON‑shape fidelity).
- Touch **auth** (register/login/account, token interceptors — never surface `users[].password`).
- Change **routing / provider nesting** order, the **slug** product URLs, `?category=<slug>`, or the parent‑includes‑children rule (`getCategoryScopeIds`).
- Revert the **safe non‑cascading DELETE** in `server.js`.
- Trigger any payment/coupon/wallet side effect.

Your only deliverable is an accurate, current understanding note that later prompts consume.
