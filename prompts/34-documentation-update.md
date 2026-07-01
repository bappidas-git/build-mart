# 34 — Documentation Rewrite

## 1. Objective
Rewrite **all 7 root documentation files** so they describe **North East Build Mart (NEBM)** and its **enquiry model** accurately — matching the new schema, API grouping, business logic, and brand — while keeping the dual-mode conventions and JSON-shape-fidelity contract intact. The docs are the authoritative contract for the future Laravel backend and for any developer onboarding; after this rewrite they must contain **no** stale e-commerce (cart/checkout/order/payment/shipping/coupon/returns/wallet) content except where explicitly noted as removed.

The 7 files (repo root):
1. `README.md`
2. `00_BACKEND_README_AND_CONVENTIONS.md`
3. `01_DATABASE_SCHEMA.md`
4. `02_API_ENDPOINTS.md`
5. `03_BUSINESS_LOGIC_AND_CASCADES.md`
6. `04_AUTH_ERRORS_AND_EDGE_CASES.md`
7. `STOREFRONT_UX_GUIDELINES.md`

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform built by refactoring a React (CRA) + JSON Server e-commerce boilerplate. Storefront users browse building materials, add items to an **Enquiry List**, and **Submit an Enquiry** (with a note + contact details); there is **no cart total, payment, shipping, coupon, or returns**. Admins manage Products, Categories, Reviews, **Enquiries**, Users, Leads, and Settings. See `prompts/00-analysis-and-requirement-map.md` for the complete feature→enquiry map and the verified repo facts this rewrite must reflect.

Key facts to embed:
- **Business:** North East Build Mart. **Tagline:** "Deals in all kinds of building materials for interior and exterior use." **Address:** Lawkhuwa Road, Nagaon, Assam – 782002. **Phone:** +91 86385 43526 · +91 88762 89972. **Currency:** ₹ / INR.
- **Footer credit:** "Designed and Developed by Assam Digital" — "Assam Digital" links to https://assamdigital.com (`target="_blank" rel="noopener noreferrer"`).
- **Brand:** Blue `#1885d8`, Gold `#fa9c4c`; Apple-minimal.
- **Dual-mode:** `src/services/baseURL.js` exports `BASE_URL` + `IS_MOCK_API`. Mock = JSON Server `http://localhost:3001` via `server.js` + `db.json`; prod = Laravel at `REACT_APP_API_URL` when `REACT_APP_USE_MOCK_API=false`. Every `api.js` method branches on `IS_MOCK_API`; responses flow through `extractData()`. The Laravel envelope is `{ success, data, meta? }`.
- **Scripts:** `npm start` (:3000), `npm run server` (`node server.js` → :3001), `npm run dev` (both), `npm run build`.
- **Enquiry statuses:** New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost.
- **Pricing model:** per product `priceType: "exact"|"tiered"|"onEnquiry"`, plus `unitType`, `minQty`, `priceTiers:[{minQty,price}]`, display flags `showExactPrice`/`showTieredPricing`/`cardPriceMode`, and a `special` flag.

## 3. Files & folders to inspect (to keep the docs code-accurate)
- Root docs (current state to rewrite): the 7 files above.
- `src/services/api.js` (~2459 lines) — the authoritative endpoint list per namespace; `extractData()`/`extractMeta()`/`getErrorMessage()`; axios interceptors. `src/services/baseURL.js`.
- `server.js` — the SAFE non-cascading DELETE (document it, never describe cascade delete).
- `db.json` — current collections/singletons and field shapes (source for schema doc after the enquiry pivot).
- `src/App.js` — routes + provider nesting (`Theme→Auth→Admin→Wishlist→Cart→Order`, storefront in `DealsConfigProvider`).
- `src/utils/categories.js` — slug/category rules (`categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories`).
- `prompts/00-analysis-and-requirement-map.md` — the definitive KEEP/RENAME/REPURPOSE/REMOVE map.

## 4. Step-by-step implementation instructions
Rewrite each file to reflect NEBM + the enquiry model. Preserve each file's existing heading/section discipline and the dual-mode contract; change the domain content.

1. **`README.md`** — replace the stock CRA boilerplate. Cover:
   - Project purpose: NEBM, an enquiry-based building-materials catalogue (browse → Enquiry List → Submit Enquiry), not a purchase store.
   - Storefront features: home, category browsing via the slide-in `SidebarMenu` drawer, listings with search/filter/sort, product details with **exact / tiered / Price-on-Enquiry** pricing, featured & **Special Products**, wishlist, account, **Enquiry List**, **Submit Enquiry / Enquiry Summary**, enquiry success.
   - Admin features: Dashboard, Products, Categories, Reviews, **Enquiries**, Users, Leads, Settings. Explicitly note the removed modules (Returns, Payments, Coupons, Special Offers, Shipping).
   - The **Enquiry List flow** (customer) and the **enquiry-management flow** (admin: statuses New→…→Lost, admin notes, leads).
   - How to run: prerequisites, `npm install`, `npm run dev` (CRA :3000 + JSON Server :3001), `npm start`, `npm run server`, `npm run build`. JSON Server usage (`server.js`, `db.json`, `http://localhost:3001/…`, the safe DELETE).
   - Managing products / categories / enquiries in the admin. The dual-mode switch (`.env`: `REACT_APP_API_URL`, `REACT_APP_USE_MOCK_API`).
   - A "What changed from the boilerplate" section listing every rename/removal (cart→Enquiry List, checkout→Submit Enquiry, orders→enquiries, removed payment/shipping/coupon/returns/wallet, added pricing model + Special Products).
   - Brand/credit footer (Assam Digital link).
2. **`00_BACKEND_README_AND_CONVENTIONS.md`** — keep the "one hard guarantee" (flip two env vars → Laravel must match the frontend). Update all examples to NEBM. Re-affirm: the `{ success, data, meta? }` envelope; **JSON-shape fidelity** (exact camelCase keys/nesting/types via API Resources); the **safe-delete** rule (delete only the addressed row; category referential integrity enforced in the API layer, not DB cascade); the **server-authoritative** rule (server owns/recomputes status/counters — but note there is now **no money math** to own). Remove references to payment/coupon/wallet/shipping cascades from the conventions.
3. **`01_DATABASE_SCHEMA.md`** — reflect the new collection set. **Add** the `enquiries` table (repurposed from `orders`): `id, enquiryNumber, userId (nullable), contact{name,phone,email}, items[]{productId,name,quantity,unitType,priceType,price?,priceTiers?}, note/message, status (New|Contacted|In Discussion|Quotation Sent|Converted|Closed|Lost), adminNotes, statusHistory[], createdAt, updatedAt` — **no** money/payment/shipping fields. **Add** the pricing fields to `products` (`priceType, unitType, minQty, priceTiers[], showExactPrice, showTieredPricing, cardPriceMode, special`). Keep `leads` (contact + enquiry-derived). **Drop** the schema for: `payments`, `refunds`, `returns`, `shipping_methods`, `coupons`, `walletTransactions`, and the `dealsConfig` money bits. Update the ER overview accordingly (users 1─* enquiries; categories self-ref; products 1─* reviews; leads standalone; settings singleton). Update the `settings` singleton to `store/seo/social/notifications` only (drop `shipping`/`payment`). Reseed note: NEBM category tree + INR-integer prices where a fixed price exists.
4. **`02_API_ENDPOINTS.md`** — regroup around the enquiry model. Keep groups: **Auth**, **Products**, **Categories**, **Banners**, **Enquiry List (cart)** (the client-side/persisted list endpoints), **Enquiries** (create/list/get, admin update-status), **Reviews**, **Wishlist**, **Settings**, **Leads**, plus the **Admin** groups (Products/Categories/Reviews/Enquiries/Users/Leads/Settings). **Drop** the Payments, Refunds, Returns, Shipping, Coupons, Wallet, and Deals/Special-Offers endpoint sections. For enquiry creation, document a **pure** payload (no totals/payment/coupon/wallet fields) and note the server must **not** fire payment/coupon/wallet side effects. Keep the ✦ "server recomputes/ignores" markers only where still meaningful (e.g. `enquiryNumber`, `status`, timestamps).
5. **`03_BUSINESS_LOGIC_AND_CASCADES.md`** — replace the checkout money math and order⇄payment⇄coupon⇄return⇄wallet cascades with the **enquiry creation flow**: create enquiry → seed `statusHistory` with the initial `New` entry → (optionally) derive a lead → send admin notification. Explicitly state **no money/payment/coupon/wallet cascades** run. Keep/adapt: **category referential integrity** (block delete while children or products reference a category; enforced in the API layer, not cascade); **singletons** (`settings`); status-transition rules for enquiries (allowed transitions across New→Contacted→In Discussion→Quotation Sent→Converted→Closed→Lost). Document that `orders.create`'s old side effects (`createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`) are **not** invoked by the enquiry path.
6. **`04_AUTH_ERRORS_AND_EDGE_CASES.md`** — keep the **Sanctum**, token-based auth (two independent sessions: customer via `authStorage` session/local per "remember", admin via `sessionStorage.adminToken`; interceptor picks the token by `/admin/` in the URL; restore only when user+token both present). Keep the **error envelope** and validation catalogue; add **enquiry edge cases** (empty Enquiry List, missing contact phone, invalid quantity, guest vs logged-in enquiry, `onEnquiry`/tiered items without a fixed price). Update the **per-module parity checklist** to the kept modules (Auth/Products/Categories/Banners/Enquiry List/Enquiries/Reviews/Wishlist/Settings/Leads) and drop the removed ones. Reaffirm password hygiene (never return `password`).
7. **`STOREFRONT_UX_GUIDELINES.md`** — describe the **enquiry-model architecture** (Enquiry List, Submit Enquiry / Enquiry Summary, no purchase path). Update the **brand system** to Blue `#1885d8` + Gold `#fa9c4c`, NEBM logo/icon, Apple-minimal, the `--sf-*` token / CSS-Module architecture. Keep the **ethics / authenticity > persuasion** non-negotiable. Add an **"admin untouched vs changed"** note (kept: Dashboard/Products/Categories/Reviews/Enquiries/Users/Leads/Settings; removed: Returns/Payments/Coupons/Special Offers/Shipping). Terminology map: Cart→Enquiry List, Add to Cart→Add to Enquiry List (icon+tooltip), Buy Now→removed, Checkout→Submit Enquiry, Order→Enquiry.
8. **Consistency sweep across all 7:** replace every business name, contact detail, hex, and endpoint list to NEBM values; ensure no doc still promises payment/shipping/coupon/returns/wallet as a live feature (only as "removed"). Keep dual-mode and conventions accurate and mutually consistent.

## 5. UI/UX requirements
- Where docs mention brand/tokens, use Blue `#1885d8` / Gold `#fa9c4c`, the NEBM logo `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` and icon `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`, and the Assam Digital footer credit. Otherwise N/A (docs, not UI).

## 6. Data & API requirements
- The docs must describe the **actual** dual-mode contract: `IS_MOCK_API` branching, `extractData()`, the `{ success, data, meta? }` envelope, JSON-shape fidelity, and the safe non-cascading DELETE — all accurately, matching `src/services/api.js`, `baseURL.js`, and `server.js`. Document the enquiry payload as **pure** (no money/payment/shipping fields) and note the removed collections. No code changes — these are documentation files only.

## 7. Admin panel requirements
- Docs must list the kept admin modules (Dashboard/Products/Categories/Reviews/Enquiries/Users/Leads/Settings) and clearly mark the removed ones (Returns/Payments/Coupons/Special Offers/Shipping) as removed, with the enquiry status workflow and admin-notes/leads described.

## 8. Storefront requirements
- Docs must describe the enquiry-only storefront journey (browse → filter → details → Add to Enquiry List → Enquiry List → Submit Enquiry / Enquiry Summary → success) and the pricing display modes (exact / tiered table / Price on Enquiry). No purchase/payment/shipping described as available.

## 9. Acceptance criteria
- [ ] All 7 root docs name **North East Build Mart**, the correct address/phones, currency ₹/INR, and brand hex `#1885d8`/`#fa9c4c`.
- [ ] `README.md` covers purpose, storefront + admin features, Enquiry List + enquiry-management flows, `npm run dev`/JSON Server usage, managing products/categories/enquiries, and a "what changed from the boilerplate" list.
- [ ] `01_DATABASE_SCHEMA.md` documents `enquiries` + tiered-pricing product fields + `leads`; **drops** payments/refunds/returns/shipping_methods/coupons/walletTransactions and the `settings.shipping`/`settings.payment` sections.
- [ ] `02_API_ENDPOINTS.md` is regrouped (Auth/Products/Categories/Banners/Enquiry-List/Enquiries/Reviews/Wishlist/Settings/Leads + Admin) with the removed modules gone.
- [ ] `03_BUSINESS_LOGIC_AND_CASCADES.md` describes the enquiry creation flow with **no** money/payment/coupon/wallet cascades; keeps category referential integrity + singletons.
- [ ] `04_AUTH_ERRORS_AND_EDGE_CASES.md` keeps Sanctum auth + error envelope + validation, adds enquiry edge cases, and updates the parity checklist to the kept modules.
- [ ] `STOREFRONT_UX_GUIDELINES.md` describes the enquiry architecture, the blue/gold brand system, ethics, and admin untouched-vs-changed.
- [ ] No doc describes payment/shipping/coupon/returns/wallet as a live feature; dual-mode + conventions remain accurate and consistent.

## 10. Testing / verification steps
1. Read each rewritten doc end-to-end; cross-check endpoint lists against `src/services/api.js` (kept namespaces only) and schema against `db.json` (post-pivot collections).
2. Grep the docs for leftover stale terms — `payment`, `shipping`, `coupon`, `return`, `wallet`, `checkout`, `Buy Now`, `place order`, and the old store name/address — and confirm each hit is either removed or explicitly framed as "removed".
3. Confirm the dual-mode instructions match reality: `npm run dev` starts CRA :3000 + JSON Server :3001; flipping `REACT_APP_USE_MOCK_API=false` points at `REACT_APP_API_URL`; responses go through `extractData()`.
4. Confirm brand facts (name, address, both phones, hex, logo URLs, Assam Digital credit) are correct and identical across docs.
5. Confirm `01`'s ER diagram and `02`'s groups agree with each other and with `03`'s cascades.

## 11. Notes on preserving existing functionality
Do **not** (in the process of documenting) misdescribe or break:
- **Dual-mode** `IS_MOCK_API` + `extractData()` + JSON-shape fidelity + the `{success,data,meta?}` envelope — document them exactly as implemented.
- **Auth** (Sanctum, two sessions, `/admin/` token selection, restore-only-with-token, never return `password`).
- **Routing + provider nesting order** and **slug/category rules** (`getCategoryScopeIds`, parent-includes-children, `?category=<slug>`, slug product URLs + legacy numeric redirect).
- **Safe non-cascading DELETE** (`server.js`) and **category referential integrity** enforced in the API layer.
- The rule that the **enquiry flow fires no payment/coupon/wallet side effects**.
- These are **documentation files only** — do not edit application code, `db.json`, or config while rewriting them. Keep all 7 docs internally consistent.
