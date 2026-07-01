# MASTER PROMPT — North East Build Mart (E‑commerce‑Style Enquiry Platform)

> **How to use this file:** Paste the entire contents of this document into Claude Code as a single prompt, with full read/write access to this Git repository. It instructs Claude Code to (1) **analyze this boilerplate repo end‑to‑end and map every e‑commerce feature onto the enquiry model**, then (2) **generate 30–35 sequential, self‑contained build prompts as individual `.md` files inside a `prompts/` folder at the repository root.** Running those prompts one‑by‑one afterwards will build the finished application. This file is the *generator*; it must not build the website itself.

---

## 0. YOUR ROLE & MISSION (read this first — it defines the whole task)

You are Claude Code, a senior full‑stack engineer and technical planner working inside an **existing React + JSON Server e‑commerce boilerplate** located at the root of this repository. Your job in **this run** is *not* to build the website. Your job is to produce a **complete, ordered set of build prompts** that a developer will later feed back into Claude Code, one at a time, to transform this boilerplate into **North East Build Mart** — a modern, minimalistic, e‑commerce‑*style* **enquiry‑management** website (storefront + admin panel) for a building‑materials business.

Do exactly two things, in this order, and nothing else:

1. **PHASE 1 — Analyze the repository in full and write a Requirement‑Mapping analysis.** Read the whole codebase and all existing documentation, build a precise mental model of how it works, and map every existing e‑commerce feature onto the required enquiry‑based feature (Sections 6–12 below). Persist this analysis to disk (see Phase 1 output).
2. **PHASE 2 — Generate 30–35 build prompts as Markdown files** inside a new folder `prompts/` at the repository root, named sequentially (`01-…​.md`, `02-…​.md`, …). Each prompt must follow the **structure in Section 15**, the **sequence in Section 16**, and the **quality bar in Section 17**.

### Hard constraints (do not violate)

- **DO NOT build, refactor, restyle, or rename any application code in this run.** The only files you create in this run are: the Phase‑1 analysis document(s) and the `prompts/**.md` files. (You may freely *read* every file.)
- **DO NOT output the 30–35 prompts inline in chat.** Write them to `prompts/*.md` files. Chat output should be a short summary only.
- **DO NOT invent a new stack or rewrite from scratch.** The correct approach is **analyze → reuse → refactor → rename → redesign → extend** the existing boilerplate. Preserve its API‑driven, dual‑mode architecture and conventions.
- **Each generated prompt must be self‑contained** — a developer running prompt `17` in a fresh session must have all the context they need inside that one file (brand facts, file paths, acceptance criteria). Cross‑reference earlier prompts by number, but never assume chat memory.
- **Preserve existing functionality unless this brief explicitly says to remove it.** Do not break the dual‑mode API layer, auth, routing, or data flow.

---

## 1. BUSINESS FACTS (embed these verbatim into every generated prompt that needs them)

- **Business name:** North East Build Mart
- **Tagline / type:** Deals in all kinds of building materials for interior and exterior use.
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Footer credit:** `Designed and Developed by Assam Digital` — the words **"Assam Digital"** must be a link to **https://assamdigital.com**, `target="_blank"` `rel="noopener noreferrer"`.
- **Design references (UX inspiration only — never copy content/design):** hindware.com, petradoor.com, infra.market, ibo.com.

### Brand system

- **Primary Blue:** `#1885d8` (plus tints/shades/subtle gradients).
- **Accent Gold/Orange:** `#fa9c4c` (highlights, CTA accents, badges, hover, icons — used sparingly).
- **Aesthetic:** premium, minimal, Apple‑style — generous white space, clean typography, soft shadows, rounded cards, professional product grids, minimal elegant animation, clear hierarchy, mobile‑first, fast. **Not** overloaded or overly colorful.
- **Main logo:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` — must work on light **and** dark backgrounds (header, footer, admin, login, branding).
- **Logo icon:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png` — favicon, loader/splash, mobile header, small‑icon usage.
- **Icons:** use **Icons8** icons where suitable (categories, features, enquiry list, contact, phone, location, search, account, wishlist, admin cards, status chips, empty states, success, loader). The repo also already bundles `@iconify/react` and `@mui/icons-material` — prefer these existing libraries where they already appear, and use Icons8 assets where a branded/pictorial icon is wanted. Keep icon style consistent and premium.
- **Product images:** placeholders in the format `https://placehold.co/600x400/1a1a2e/FFFFFF?text=Product+Name` (URL‑encode the product name, e.g. `?text=WPC+Louvers`, `?text=Steel+Door`, `?text=Vitrified+Tiles`).

---

## 2. CORE CONCEPT — ENQUIRY MODEL, NOT PURCHASE MODEL

The storefront mirrors an e‑commerce experience but replaces every *buying* concept with an *enquiry* concept. Apply this terminology/behaviour mapping throughout the UI **without breaking the API‑driven data flow** (rename in the UI/domain layer; keep the underlying request/response plumbing intact and consistent):

| E‑commerce term | Becomes |
|---|---|
| Cart | **Enquiry List** |
| Add to Cart | **Add to Enquiry List** — an **icon button with a tooltip** reading "Add to Enquiry List" |
| Buy Now | **Removed entirely** |
| Checkout | **Submit Enquiry / Send Enquiry** (review step titled **"Enquiry Summary"**) |
| Place Order | **Submit Enquiry** |
| Order (customer) | **Enquiry** |
| Order Details | **Enquiry Details** |
| Orders (admin module) | **Enquiries** |
| Payment UI | **Removed** |
| Shipping UI | **Removed** |
| Coupon UI | **Removed** |

**Users CAN:** browse home/categories/listings/details; search, filter, sort; view featured & special products; add to Enquiry List and manage quantities; submit an enquiry with a note/message; register/login; use wishlist & account pages (already in the boilerplate).

**Users CANNOT:** place orders, pay, checkout‑to‑buy, use shipping, apply coupons, or request returns.

The "Add to Enquiry List" CTA appears on product cards, listing pages, featured/special sections, and the product details page — modern, clear, minimal. On product details there is **no "Buy Now"**.

---

## 3. WHAT I ALREADY KNOW ABOUT THIS REPO (trusted grounding — verify while you analyze)

This is a **Create React App** storefront **and** admin panel, backed by **JSON Server** (`db.json`) with a **dual‑mode API layer** that also targets a Laravel backend in production. Use the facts below to anchor your analysis, but confirm each by reading the files — do not take them on faith where a detail matters.

### Stack & scripts
- React 18, `react-router-dom` 6, **MUI 5** (`@mui/material`, `@mui/icons-material`) + `@emotion`, `framer-motion`, `axios`, `sweetalert2`, `@iconify/react`, `canvas-confetti`, `json-server`.
- `package.json` name is currently `ecommerce-boilerplate`. Scripts: `npm start` (CRA dev server :3000), `npm run server` (`node server.js`, JSON Server on :3001), `npm run dev` (both via `concurrently`), `npm run build`.
- `server.js` is a **custom JSON Server** wrapper that overrides `DELETE` to be **safe & non‑cascading** (it disables json‑server's `getRemovable` cascade to avoid `null.toString()` 500s and memory/disk desync). Preserve this behaviour.

### Dual‑mode API architecture (the crown jewel — must be preserved)
- `src/services/baseURL.js` exports `BASE_URL` and **`IS_MOCK_API`**. Mock mode = JSON Server at `http://localhost:3001`; production = `REACT_APP_API_URL` (Laravel `…/api/v1`) when `REACT_APP_USE_MOCK_API=false`.
- `src/services/api.js` (~2460 lines) exports one `apiService` object. Every method branches on `IS_MOCK_API`: **mock** talks to JSON Server (query params, client‑side shaping) and **production** hits Laravel REST endpoints. Helpers: `extractData()` (unwraps Laravel `{success,data,meta}` vs raw JSON‑Server data), `extractMeta()`, `getErrorMessage()`, axios request interceptor (attaches bearer token; admin vs user token), response interceptor (401 handling per session).
- **`apiService` namespaces:** `auth`, `products`, `categories`, `banners`, `cart`, `orders`, `wallet`, `reviews`, `returns`, `coupons`, `wishlist`, `shipping`, `settings`, `deals`, `leads`, `admin`.
- **`apiService.admin.*` methods** include: `login`, `logout`, `getDashboardStats`, product CRUD (`getProducts/getProduct/createProduct/updateProduct/deleteProduct`), category CRUD (`getCategories/createCategory/updateCategory/deleteCategory`), orders (`getOrders/getOrder/updateOrder/updateOrderStatus/cancelOrder/initiateOrderRefund/completeOrderRefund/failOrderRefund`), returns (`getReturns/getReturn/createReturn/updateReturn/scheduleReturnPickup/markReturnInTransit`), payments/refunds (`getPayments/getPayment/getRefunds/issueRefund`), shipping (`getShippingMethods/createShippingMethod/updateShippingMethod/deleteShippingMethod/shiprocketCreateOrder/shiprocketTrack`), coupons (`getCoupons/createCoupon/updateCoupon/deleteCoupon`), reviews (`getReviews/createReview/updateReview/deleteReview`), users (`getUsers/getUser/updateUser`), leads (`getLeads/getLead/updateLead/deleteLead`), settings (`getSettings/updateSettings`), deals (`getDealsConfig/updateDealsConfig`).
- **Mock‑only cascade helpers** in `api.js` mimic server‑side transactions: `performCancel`, `createPaymentForOrder`, `redeemCouponByCode`/`restoreCouponByCode`, `reflectReturnRefund`, `reflectPaymentOnOrder`, `restockItems`, the store‑credit wallet ledger (`creditWallet`/`debitWallet`/`computeWalletBalance`), `createRefundRecord`/`finalizeRefundRecord`, `markPaymentRefundPending`, `voidPaymentForOrder`, `deleteWithVerify`. **These couple orders ⇄ payments ⇄ coupons ⇄ returns ⇄ wallet.** Removing purchase features must be done carefully so these cascades don't break the enquiry (ex‑order) flow.

### Data model — `db.json` collections (record counts today)
`banners`(3), `users`(3), `admins`(1), `categories`(16), `products`(19), `cart`(0), `orders`(11), `returns`(2), `payments`(9), `refunds`(3), `shipping_methods`(4), `coupons`(5), `reviews`(8), `wishlist`(3), `leads`(4), `settings`(singleton: `store/shipping/payment/notifications/seo/social`), `walletTransactions`(3), `dealsConfig`(singleton).

- **`products`** fields: `id, name, slug, sku, shortDescription, description, categoryId, brand, images[], price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], featured, trending, hot, isActive, rating, totalReviews, metaTitle, metaDescription, createdAt, updatedAt, frequentlyBoughtTogetherIds[], relatedProductIds[]`. → **Extend** with the flexible pricing model (Section 9) and a `unitType`.
- **`categories`** are a **self‑referencing tree** (`id, name, slug, parentId, sortOrder, showInMainMenu, menuOrder, isActive, …`). The current tree is generic (Electronics/Clothing/…). → **Replace** with the NEBM tree (Section 6). Category helpers live in `src/utils/categories.js` (`categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories`) — the parent‑includes‑children filtering rule and slug URL scheme must keep working.
- **`orders`** fields: `id, orderNumber, userId, items[], billingAddress, shippingAddress, subtotal, discountAmount, couponCode, shippingAmount, taxAmount, total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, trackingNumber, trackingUrl, shiprocketOrderId, notes, createdAt, updatedAt, statusHistory[]`. → **Repurpose into `enquiries`** (Section 10) — keep `items[]`, `statusHistory[]`, `notes`; drop money/payment/shipping fields; add customer contact + enquiry status + admin notes.
- **`leads`** fields: `id, type(contact|newsletter), name, email, phone, orderNumber, category, subject, message, status, notes, createdAt, updatedAt`. → **Repurpose** as the Leads/CRM surface for enquiries + contact submissions.

### Frontend structure
- **Routing:** `src/App.js` nests all providers (`ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`) and defines `/admin/*` routes (under `AdminLayout`) and storefront `/*` routes (under `DealsConfigProvider`). Product detail resolves by **slug** (`/products/:slug`) with a legacy numeric redirect.
- **Contexts:** `src/context/` → `ThemeContext`, `AuthContext`, `AdminContext`, `CartContext`, `OrderContext`, `WishlistContext`, `DealsConfigContext`. **Hooks:** `src/hooks/` → `useAuth`, `useCart`, `useAdminBodyClass`, `useSound`.
- **Theme:** `src/theme/` → `tokens.js`, `colors.js`, `adminTheme.js` (MUI), `storefront-tokens.css` (CSS custom properties). **Utils:** `src/utils/` → `categories.js`, `constants.js`, `helpers.js`, `dealsConfig.js`, `authStorage.js`.
- **Storefront pages** (`src/pages/`): `Home`, `Products`, `ProductDetails`, `Checkout`, `OrderConfirmation`, `OrderHistory`, `Profile`, `Wishlist`, `SpecialOffers`, `AboutUs`, `HelpCenter`, `Support`, `PrivacyPolicy`, `TermsOfService`, `CookiePolicy`, `RefundPolicy`.
- **Storefront components** (`src/components/`): `Header`, `Footer`, `HeroSection`, `FeaturedProducts`, `CartDrawer`, `SidebarMenu`, `SearchModal`, `AuthModal`, `BottomNav`, `BottomDrawer`, `Breadcrumb`, `Newsletter`, `CTASection`, `FAQ`, `ReviewModal`, `ScrollToTop`, `ErrorBoundary`, plus `components/storefront/` (`ProductCard`, `PriceBlock`, `AddToCartBar`, `QuantityStepper`, `VariantSelector`, `ProductGallery`, `RelatedProducts`, `ReviewsSection`, `TrustBadges`, `SocialProof`, `FrequentlyBoughtTogether`, `DeliveryReturnsInfo`, `StarRating`, `variantUtils`). Styling is per‑component **CSS Modules** (`*.module.css`).
- **Admin pages** (`src/pages/Admin/`): `AdminLogin`, `AdminDashboard`, `AdminProducts`, `AdminCategories`, `AdminOrders`, `AdminReturns`, `AdminPayments`, `AdminUsers`, `AdminShipping`, `AdminCoupons`, `AdminSpecialOffers`, `AdminReviews`, `AdminLeads`, `AdminSettings`; shell is `src/components/AdminLayout/AdminLayout.js`.

### Documentation (7 files at repo root — all must be updated in the docs prompt)
- `README.md` (currently the default CRA readme).
- `00_BACKEND_README_AND_CONVENTIONS.md` — the one hard guarantee, integration point, env switch, **response envelope**, auth summary, IDs, human‑readable numbers, dates, money, **JSON‑shape fidelity rule**, pagination, error format, mock‑only scaffolding to ignore, server‑authoritative/recompute‑money security rule.
- `01_DATABASE_SCHEMA.md` — MySQL schema + ER overview, one section per table (banners, users, admins, categories, products, cart, orders, returns, payments, refunds, shipping_methods, coupons, reviews, wishlist, leads, settings, walletTransactions, dealsConfig) + seed guidance.
- `02_API_ENDPOINTS.md` — every endpoint grouped Auth/Products/Categories/Banners/Cart/Orders/Wallet/Reviews/Returns/Coupons/Wishlist/Shipping‑Settings‑Deals/Leads + all Admin groups.
- `03_BUSINESS_LOGIC_AND_CASCADES.md` — checkout money math, order creation, cancellation cascade, refund settlement, return refund, wallet, coupons, reviews, category referential integrity, singletons.
- `04_AUTH_ERRORS_AND_EDGE_CASES.md` — Sanctum auth, error envelope/catalogue, validation rules, edge cases, per‑module parity test checklist.
- `STOREFRONT_UX_GUIDELINES.md` — architecture, principles & enforcing components, ethics (non‑negotiable), building a new client storefront, "admin panel is untouched".

> **Conventions you must obey and propagate into every generated prompt:** keep the dual‑mode `IS_MOCK_API` branching; always shape responses through `extractData()`; never leak passwords into state/storage; preserve the slug‑based URL scheme and the parent‑includes‑children category rule; keep the safe non‑cascading DELETE; maintain JSON‑shape fidelity so the same UI works against both JSON Server and Laravel; per‑component CSS Modules for styling; brand tokens flow through `storefront-tokens.css` + `theme/*` (storefront) and `adminTheme.js` (admin).

---

## 4. PRODUCT CATEGORIES & SUBCATEGORIES (the NEBM tree to seed)

Use a clean **slide‑in / off‑canvas drawer** category menu (repurpose `SidebarMenu`) triggered by a menu button — **not a mega menu** — great on desktop and mobile.

1. **WPC Louvers**
2. **Polycarbonate Sheets**
3. **FRP Sheets**
4. **Waterproofing Products**
5. **Tiles** — Floor Tiles · Wall Tiles · Vitrified Tiles · Bathroom & Kitchen Tiles · Outdoor Tiles
6. **Doors** — Steel Doors · PVC Doors · WPC Doors · Designer Doors · Bathroom Doors
7. **Hardware** — Door Locks · Handles & Hinges · Fasteners · Cabinet Fittings · Construction Hardware
8. **Plumbing** — PVC Pipes · CPVC Pipes · SWR Pipes · Water Tanks · Pipe Fittings & Accessories
9. **Bath Fittings** — Showers · Faucets & Taps · Wash Basins · Sanitary Ware · Bathroom Accessories
10. **Cement** — OPC Cement · PPC Cement · Premium Construction Cement
11. **Steel Rods** — TMT Bars · Construction Steel · High‑Strength Reinforcement Bars
12. **Special Products** — a curated/spotlight grouping of signature items (WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing, etc.). Treat as a **featured/badged collection** (homepage highlight + flag on products), **not** a separate exclusive category — those items also live under their top‑level categories.

Seed `db.json` with realistic dummy products across **all** categories and subcategories, using the placeholder image format and the pricing model below.

---

## 5. PRICING SYSTEM (extend the product schema + admin form + storefront display)

Per product, admin controls flexible pricing and exactly what users see:

- **Option 1 — Exact/fixed price** (e.g. ₹100 per piece).
- **Option 2 — Quantity‑based tiered pricing** (IndiaMART‑style bulk pricing), e.g. 1 pc = ₹100; 5 pc = ₹400; 10 pc = ₹700 (increasing discount).

Admin pricing controls must allow: multiple quantity tiers; optional **minimum quantity**; a **unit type** (piece, box, sheet, bundle, bag, kg, meter, square feet, …); toggle **exact price** visibility; toggle **quantity‑based pricing** visibility; show **"Price on Enquiry"** when pricing is disabled/unavailable; and choose which pricing format shows on **product cards** vs the **product details page**.

Suggested schema additions (finalize during analysis, keep JSON‑shape fidelity for both modes): `priceType: "exact" | "tiered" | "onEnquiry"`, `unitType`, `minQty`, `priceTiers: [{ minQty, price }]`, and display flags such as `showExactPrice`, `showTieredPricing`, `cardPriceMode`. Keep the UI clean; on product details, if tiered pricing is enabled, render a clear **quantity‑vs‑price table** showing tiers and discounts. Reuse/extend the existing `src/components/storefront/PriceBlock.js`.

---

## 6. STOREFRONT PAGES & COMPONENTS (redesign & reuse what exists)

Required pages (map to existing files where possible): Homepage (`Home`); Category listing + Product listing with search/filter/sort (`Products`); Product details with the **Add‑to‑Enquiry‑List icon+tooltip**, no Buy Now (`ProductDetails`); Special products (`SpecialOffers` → repurpose, or a dedicated section); **Enquiry List** page (from `CartDrawer`/cart flow, multi‑product + quantities); **Submit Enquiry / Enquiry Summary** with the **note/message** field (from `Checkout`); Login & Register (from `AuthModal`); Wishlist (`Wishlist`); Account/Profile (`Profile`); About (`AboutUs`); Contact (surface address + phones — likely from `Support`/`HelpCenter`); **Enquiry confirmation/success** (from `OrderConfirmation`); static policy pages (keep those already present, re‑worded away from purchase/returns where needed).

Required components: modern `Header` with logo; `SearchModal`/search bar; slide‑in/popup category menu (`SidebarMenu`); featured categories; `FeaturedProducts`; special‑product highlights; product cards with badges (`ProductCard`); Enquiry List icon (replaces cart icon); wishlist icon; responsive mobile menu (`BottomNav`/`BottomDrawer`); professional `Footer` with contact details + the **Assam Digital** credit link.

---

## 7. ADMIN PANEL (fit the enquiry business model)

- **KEEP:** Dashboard · Products · Categories · Reviews · **Enquiries** (renamed from Orders) · Users · Leads · Settings.
- **REMOVE / HIDE:** Returns · Payments · Coupons · Special Offers · Shipping · any order‑fulfillment‑only modules. Remove their **routes** (`src/App.js`), **nav entries** (`AdminLayout`), and **pages**, and neutralize dashboard widgets/`getDashboardStats` fields that reference them — without breaking the app or the shared API layer.
- **Capabilities:** full CRUD for categories/subcategories and products (images, descriptions, specifications, category/subcategory, pricing per Section 5); manage enquiries as a lightweight CRM.
- **Enquiry data captured on submit:** user name; phone; email (if available); products in the Enquiry List; quantities; selected pricing/price type (if any); user note/message; enquiry date/time; enquiry status.
- **Enquiry management:** list all; search; filter by status; full detail (products, quantities, customer details, user note); internal admin notes; update status.
- **Enquiry statuses:** New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost.
- **Leads:** a Leads module to view/manage useful customer/enquiry data (repurpose `AdminLeads` + `leads` collection).

---

## 8. DOCUMENTATION TO REWRITE

Update/rewrite so everything reflects NEBM and the enquiry data model: `README.md`, `00_…CONVENTIONS.md`, `01_DATABASE_SCHEMA.md`, `02_API_ENDPOINTS.md`, `03_BUSINESS_LOGIC_AND_CASCADES.md`, `04_AUTH_ERRORS_AND_EDGE_CASES.md`, `STOREFRONT_UX_GUIDELINES.md`, plus any other developer references. Docs must clearly explain: project purpose; storefront features; admin features; the Enquiry List flow; the enquiry‑management flow; the updated data structure (enquiries, tiered pricing, leads); how to run the project; how JSON Server is used; how to manage products/categories/enquiries; and every change made from the original boilerplate.

---

# PHASE 1 — MANDATORY REPOSITORY ANALYSIS & REQUIREMENT MAPPING

Before writing any prompt, **read the repository in full** and produce a written analysis. At minimum, read and understand:

- Project config & runtime: `package.json`, `server.js`, `.env` / `.env.example` / `.env.production`, `public/index.html`, `public/manifest.json`.
- API layer: `src/services/api.js` (**all** of it), `src/services/baseURL.js`, `src/utils/authStorage.js`, `src/utils/constants.js`.
- Data: `db.json` (every collection, field shapes, relationships) cross‑checked against `01_DATABASE_SCHEMA.md`.
- Routing & providers: `src/App.js`, everything in `src/context/`, `src/hooks/`.
- Theme & utils: `src/theme/*`, `src/utils/*`.
- Storefront: every file in `src/pages/*` (non‑admin) and `src/components/*` (incl. `components/storefront/*`), reading the pivotal ones closely (`Header`, `ProductCard`, `PriceBlock`, `CartDrawer`, `Checkout`, `ProductDetails`, `SidebarMenu`, `Home`, `Footer`).
- Admin: `src/components/AdminLayout/AdminLayout.js` and every file in `src/pages/Admin/*`.
- All 7 documentation files.

**Phase‑1 output (write to disk, do not just print):** create `prompts/00-analysis-and-requirement-map.md` (or `docs/ANALYSIS.md` if you prefer a separate location, but `prompts/00-…` is preferred so it ships with the set) containing:

1. **Repo map** — folder structure, stack, conventions, styling approach, how the app is API‑driven.
2. **API inventory** — every `apiService` namespace + method with its mock vs Laravel behaviour, and the mock cascade helpers.
3. **Data model** — every `db.json` collection with fields + relationships.
4. **Feature → Enquiry mapping table** — for each existing feature/module/file: **KEEP / RENAME / REPURPOSE / EXTEND / REMOVE**, with a one‑line why and the target enquiry behaviour. Explicitly cover: Cart→Enquiry List, Checkout→Submit Enquiry, Orders→Enquiries, product pricing→tiered pricing, categories→NEBM tree, and the removal of Payments/Shipping/Coupons/Returns/Special‑Offers/wallet (and what to do about the `api.js` cascades that reference them).
5. **Risk register** — the fragile couplings (order⇄payment⇄coupon⇄return⇄wallet cascades, provider nesting, slug/category rules, safe‑delete) and how later prompts must avoid breaking them.

This analysis is the source of truth for Phase 2. (Note: generated prompt `01` will *also* instruct a future run to re‑establish this analysis — that is intentional; each build run must re‑ground itself.)

---

# PHASE 2 — GENERATE THE BUILD PROMPTS

Create a **`prompts/` folder at the repository root** and write **30–35** sequential `.md` files. Naming: zero‑padded number + kebab‑case slug, e.g. `01-codebase-analysis.md`, `02-requirement-mapping.md`, `03-brand-system-and-theme.md`, … Keep the numeric order matching the build order. Cover every requirement in Sections 1–8 across the set; no requirement may be left unassigned to a prompt.

## 15. Required structure for EACH generated prompt

Every `prompts/NN-*.md` file must contain **all** of these clearly‑headed sections, in this order:

1. **Prompt title**
2. **Objective**
3. **Context / background** (self‑contained — restate the brand/domain facts this prompt needs; reference the analysis and prior prompt numbers)
4. **Files & folders to inspect** (concrete paths from this repo)
5. **Step‑by‑step implementation instructions** (specific and ordered)
6. **UI/UX requirements** (where relevant — reference brand tokens `#1885d8`/`#fa9c4c`, Apple‑style minimalism, icons, logo)
7. **Data & API requirements** (where relevant — exact `db.json` fields, `api.js` methods, dual‑mode `IS_MOCK_API` handling, `extractData()`)
8. **Admin panel requirements** (where relevant)
9. **Storefront requirements** (where relevant)
10. **Acceptance criteria** (checklist, testable)
11. **Testing / verification steps** (how to run — `npm run dev` — and what to click/observe; JSON Server data checks)
12. **Notes on preserving existing functionality** (explicit "do not break" list: dual‑mode API, auth, routing, slug/category rules, safe‑delete, remaining features)

## 16. Required sequence (30–35 prompts — adjust only if analysis reveals a better technical order)

Produce the set in this order (you may merge/split to land within 30–35, but keep the logical progression and cover everything). For each, target the concrete files noted:

1. **`01-codebase-analysis.md`** — re‑establish full repo understanding for a build session (mirror Phase‑1). Files: whole `src/`, `db.json`, `server.js`, all docs.
2. **`02-requirement-mapping.md`** — the e‑commerce→enquiry mapping table as an actionable spec. Files: the analysis output.
3. **`03-brand-system-and-theme.md`** — brand tokens, colors (`#1885d8`, `#fa9c4c`), typography, spacing. Files: `src/theme/tokens.js`, `colors.js`, `adminTheme.js`, `storefront-tokens.css`, `src/index.css`, `src/App.css`.
4. **`04-logo-and-icon-integration.md`** — main logo + icon (light/dark), favicon, loader/splash, manifest, page title/meta. Files: `public/index.html`, `public/manifest.json`, `public/favicon.*`, `Header`, `Footer`, `AdminLayout`, `AdminLogin`.
5. **`05-db-restructure-plan.md`** — plan & apply the `db.json` schema pivot: rename/repurpose `orders`→`enquiries`, drop `payments/returns/refunds/shipping_methods/coupons/walletTransactions/dealsConfig` (decide keep‑but‑hidden vs remove, per risk register), extend `products` pricing, reshape `categories`, `settings`, `leads`. Keep it consistent with `api.js` + docs.
6. **`06-category-and-product-seed.md`** — seed the NEBM category tree (Section 4) + realistic dummy products across all categories/subcategories with placeholder images and the pricing model. Files: `db.json`, `src/utils/categories.js`.
7. **`07-storefront-layout-foundation.md`** — global layout, container, spacing, typography scale, responsive shell. Files: `src/App.js`, `src/index.css`, `App.css`, layout components.
8. **`08-header-and-navigation.md`** — redesign `Header` (logo, search, Enquiry List icon + count, wishlist, account, menu button). Files: `src/components/Header/*`, `BottomNav`.
9. **`09-slidein-category-menu.md`** — off‑canvas/drawer category menu (not mega menu). Files: `src/components/SidebarMenu/*`, `categories.js`.
10. **`10-homepage-redesign.md`** — premium hero, featured categories, featured products, special‑products highlight, CTAs. Files: `src/pages/Home/*`, `HeroSection`, `FeaturedProducts`, `CTASection`.
11. **`11-featured-and-special-products.md`** — featured categories section + Special Products badged collection logic. Files: `FeaturedProducts`, `SpecialOffers`, `ProductCard`, `db.json` flags.
12. **`12-product-listing-redesign.md`** — grid, cards, badges, pagination. Files: `src/pages/Products/*`, `ProductCard`.
13. **`13-search-filter-sort.md`** — search + category/price/attribute filters + sorting UX, keeping slug URLs & parent‑includes‑children. Files: `Products`, `SearchModal`, `categories.js`.
14. **`14-product-details-redesign.md`** — gallery, specs, **Add‑to‑Enquiry‑List icon+tooltip, NO Buy Now**, related products. Files: `src/pages/ProductDetails/*`, `ProductGallery`, `AddToCartBar`, `RelatedProducts`, `VariantSelector`.
15. **`15-pricing-display-logic.md`** — exact / tiered (quantity‑vs‑price table) / "Price on Enquiry"; card vs details display modes. Files: `src/components/storefront/PriceBlock.js`, `ProductCard`, `ProductDetails`.
16. **`16-cart-to-enquiry-list.md`** — convert cart state/context/drawer to Enquiry List (multi‑product + quantities, no totals/payment). Files: `CartContext`, `useCart`, `CartDrawer`, `QuantityStepper`, `api.js` `cart` namespace.
17. **`17-enquiry-list-page.md`** — full Enquiry List page (edit quantities, remove, proceed to submit). Files: repurpose cart page/drawer, `CartContext`.
18. **`18-submit-enquiry-flow.md`** — convert Checkout into Submit Enquiry / **Enquiry Summary** (no payment/shipping/coupon). Files: `src/pages/Checkout/*`, `OrderContext`, `api.js` `orders`→enquiry create.
19. **`19-enquiry-note-message.md`** — note/message field + capture of name/phone/email into the enquiry payload. Files: `Checkout`/submit page, `OrderContext`, `db.json` enquiries shape.
20. **`20-enquiry-success-page.md`** — confirmation/success screen (Icons8 success, next steps, enquiry reference). Files: `src/pages/OrderConfirmation/*`.
21. **`21-wishlist-and-account.md`** — align Wishlist + Profile/account pages to brand & enquiry model (history shows enquiries, not orders). Files: `Wishlist`, `Profile`, `OrderHistory`, `WishlistContext`.
22. **`22-about-page.md`** — About with business info. Files: `src/pages/AboutUs/*`.
23. **`23-contact-page.md`** — Contact surfacing address + both phone numbers + map/enquiry CTA. Files: `Support`/`HelpCenter`, `leads` API.
24. **`24-footer-redesign.md`** — footer with contact details + **"Assam Digital"** link (new tab). Files: `src/components/Footer/*`.
25. **`25-admin-dashboard-cleanup.md`** — dashboard KPIs for enquiries/leads; remove payment/shipping/coupon/returns widgets. Files: `AdminDashboard`, `api.js` `admin.getDashboardStats`.
26. **`26-admin-products-categories.md`** — product & category CRUD updates (subcategories, specs, images). Files: `AdminProducts`, `AdminCategories`, `admin` API.
27. **`27-admin-pricing-fields.md`** — pricing controls in the product form (exact/tiered/on‑enquiry, unit type, min qty, tiers, display toggles). Files: `AdminProducts`, product schema.
28. **`28-admin-enquiries-module.md`** — rename Orders→**Enquiries**: list, search, status filter, detail dialog (products/qty/customer/note), internal admin notes, status workflow (New→…→Lost). Files: `AdminOrders`→`AdminEnquiries`, `App.js`, `AdminLayout`, `admin` orders API.
29. **`29-admin-leads-module.md`** — Leads CRM view/manage. Files: `AdminLeads`, `leads` API.
30. **`30-remove-ecommerce-modules.md`** — remove/hide Returns, Payments, Coupons, Special Offers, Shipping (routes, nav, pages) and safely retire their `api.js`/cascade coupling without breaking enquiries. Files: `App.js`, `AdminLayout`, `src/pages/Admin/AdminReturns|AdminPayments|AdminCoupons|AdminSpecialOffers|AdminShipping.js`, `api.js`.
31. **`31-reviews-users-settings-cleanup.md`** — keep & align Reviews, Users, Settings to NEBM (settings: store info/contact/SEO/social; drop payment/shipping sections). Files: `AdminReviews`, `AdminUsers`, `AdminSettings`, `settings` schema.
32. **`32-responsive-and-mobile.md`** — mobile‑first pass across storefront + admin (drawer menu, bottom nav, tables→cards). Files: global + key pages/components.
33. **`33-empty-states-loaders-microinteractions.md`** — Icons8 empty states, loader/splash (logo icon), skeletons, subtle framer‑motion, tooltips. Files: shared components.
34. **`34-documentation-update.md`** — rewrite all 7 docs + `README` to NEBM/enquiry model (Section 8), matching the new schema/API. Files: all root `.md` docs.
35. **`35-final-qa-and-consistency.md`** — end‑to‑end QA, terminology consistency (no leftover "cart/checkout/order/buy" in UI), dual‑mode smoke test (`IS_MOCK_API` true/false), responsive/lint/build check, production readiness. Files: whole app.

If analysis shows a cleaner order or a needed split (e.g. separating category‑listing from product‑listing, or auth pages into their own prompt), adjust while staying within 30–35 and keeping full coverage.

## 17. Quality bar for every generated prompt (Section 15 of the brief)

- **Specific, structured, implementation‑ready.** Reference real files/paths, real `db.json` fields, real `api.js` methods, exact brand values, exact acceptance criteria.
- **No vague filler.** Never write "make it modern" without the concrete tokens, spacing, components, and states that define "modern" here.
- **Enquiry‑correct.** Every UI‑facing purchase term must be mapped (Section 2); no "Buy Now", payment, shipping, coupon, or returns UI survives.
- **API‑safe.** Every prompt that touches data restates the dual‑mode rule (`IS_MOCK_API`, `extractData`, JSON‑shape fidelity) and lists what must not break.
- **Testable.** Acceptance criteria are checkable; verification steps say exactly what to run and observe.
- Detailed enough that a developer running the prompt cold cannot miss a requirement.

---

## FINAL DEFINITION OF DONE (self‑verify before you finish this run)

- [ ] Phase‑1 analysis written to disk (`prompts/00-analysis-and-requirement-map.md` or agreed location), covering repo map, API inventory, data model, feature→enquiry mapping table, and risk register.
- [ ] `prompts/` folder exists at repo root with **30–35** sequentially‑named `.md` files.
- [ ] Every file follows the **12‑section structure** (Section 15) and the quality bar (Section 17).
- [ ] The set collectively covers **all** requirements in Sections 1–8 (brand, categories, pricing, storefront pages/components, admin keep/remove, enquiry flow, leads, documentation) with each requirement traceable to a prompt.
- [ ] Terminology mapping (Section 2) is applied throughout the prompts; no purchase concepts remain as user‑facing features.
- [ ] Prompts consistently instruct builders to **preserve the dual‑mode API architecture, auth, routing, slug/category rules, and the safe non‑cascading DELETE**, and to reuse/refactor rather than rewrite.
- [ ] **No application/website code was built or modified in this run** — only the analysis doc and the `prompts/*.md` files were created.
- [ ] Chat output is a brief summary (what was analyzed + the list of generated prompt filenames), not the prompt contents.

**Now: complete Phase 1, then Phase 2.**
