# 35 — Final QA & Consistency

## 1. Objective
Run an end-to-end quality gate over the whole North East Build Mart (NEBM) app before it's considered production-ready. This prompt is a **concrete pass/fail checklist**, not a feature build: a terminology audit, the full enquiry journey, pricing-mode rendering, verification that removed admin modules are truly gone, a **dual-mode smoke test** (`REACT_APP_USE_MOCK_API=true` and `=false`), a responsive check, a clean `npm run build`, a lint pass, and JSON Server data checks. Fix anything that fails; make no gratuitous changes.

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform refactored from a React (CRA) + JSON Server e-commerce boilerplate (see `prompts/00-analysis-and-requirement-map.md`). By this point, prompts 01–34 have: re-skinned to Blue `#1885d8` / Gold `#fa9c4c` (Apple-minimal); seeded the NEBM category tree and products with the pricing model (`priceType: exact|tiered|onEnquiry`, `unitType`, `priceTiers[]`, `special`); renamed cart→**Enquiry List**, checkout→**Submit Enquiry / Enquiry Summary**, orders→**Enquiries**; removed the Payments/Shipping/Coupons/Returns/Special-Offers admin modules; trimmed `settings`; and rewritten the docs. This prompt confirms all of that holds together.

Dual-mode (must survive QA): `src/services/baseURL.js` exports `IS_MOCK_API`; mock = JSON Server `http://localhost:3001` (`server.js`+`db.json`), prod = Laravel via `REACT_APP_API_URL` when `REACT_APP_USE_MOCK_API=false`. Every `api.js` method branches on `IS_MOCK_API`; responses flow through `extractData()`.

## 3. Files & folders to inspect
- Whole app, but especially: `src/App.js` (routes + provider nesting), `src/services/api.js` + `baseURL.js`, `server.js`, `db.json`, `.env` / `.env.production`.
- Storefront strings: `src/pages/*`, `src/components/**` (Header, Footer, SidebarMenu, CartDrawer/Enquiry List, Checkout/Submit Enquiry, ProductCard, PriceBlock, AddToCartBar, BottomNav, BottomDrawer).
- Admin: `src/components/AdminLayout/AdminLayout.js` (`menuItems`, notification polling), `src/pages/Admin/*` (confirm removed pages are gone/unrouted; `getDashboardStats` reshaped).
- Utils: `src/utils/categories.js`, `src/utils/helpers.js` (`formatCurrency`), `src/context/*`.

## 4. Step-by-step implementation instructions
Work through the checklist in §9 and fix failures. The ordered method:
1. **Terminology audit (storefront UI strings).** Grep the storefront for leftover e-commerce vocabulary that must NOT appear in user-facing copy:
   ```
   grep -rniE "buy now|add to cart|checkout|place order|\border\b|payment|shipping|coupon|\breturns?\b|\bcart\b" src/pages src/components --include=*.js --include=*.module.css
   ```
   For each hit, decide: (a) user-facing string → must be renamed per the map (Cart→Enquiry List, Add to Cart→Add to Enquiry List, Checkout→Submit Enquiry, Order→Enquiry, Buy Now→removed); (b) internal identifier/route/localStorage key/`api.js` plumbing → **allowed to remain** (e.g. `CartContext`, localStorage key `"cart"`, the `cart` API namespace, `/checkout` route file name) as long as nothing user-facing shows it. Record each decision as pass/allowed.
2. **Full enquiry journey (happy path).** Browse home → open category drawer (`SidebarMenu`) → open a listing → filter/sort → open product details → **Add to Enquiry List** (icon+tooltip) → open **Enquiry List** (adjust quantities, remove) → **Submit Enquiry** → **Enquiry Summary** (contact name/phone/email + note) → submit → **success screen with an enquiry reference** → confirm the enquiry appears in **Admin → Enquiries** with status **New**. Confirm **no** payment/shipping/coupon step exists anywhere in this flow.
3. **Pricing modes render correctly.** Verify three products (one each of `exact`, `tiered`, `onEnquiry`):
   - `exact` → shows a fixed ₹ price with `unitType` (e.g. ₹100 / piece).
   - `tiered` → product details shows a clear **quantity-vs-price table** (tiers + implied discount); card respects `cardPriceMode`.
   - `onEnquiry` → shows **"Price on Enquiry"**, no number. Confirm the enquiry payload carries the selected price/priceType per line.
4. **Removed admin modules are gone.** Confirm there are **no routes** for `/admin/payments`, `/admin/shipping`, `/admin/coupons`, `/admin/returns`, `/admin/special-offers` in `App.js`; **no nav entries** for them in `AdminLayout.menuItems`; and no dead links. Confirm `getDashboardStats` no longer surfaces `pendingReturns`/`activeCoupons` (or they're neutralised) and the dashboard renders without them. Confirm `AdminLayout` notification polling reads **enquiry** statuses (not `fulfillmentStatus`/order `status`) and Leads — and doesn't error.
5. **Dual-mode smoke test (critical).**
   - With `.env` `REACT_APP_USE_MOCK_API=true`: run `npm run dev`, exercise the enquiry journey + admin, confirm data reads/writes hit JSON Server (:3001).
   - Set `REACT_APP_USE_MOCK_API=false` and `REACT_APP_API_URL` to a stub/staging Laravel base: run `npm start`, and confirm the app compiles and every touched call goes through the **`IS_MOCK_API === false`** branch and `extractData()` (unwraps `{success,data,meta}`), with no mock-only shape assumptions crashing the UI. (You don't need a live Laravel; you're verifying the branch is taken and the code path is sound — use network inspection / temporary logging.)
   - Revert `.env` to mock=true.
6. **Responsive check.** Re-run the key screens at 360/768/1024/1440 (see prompt 32): no horizontal scroll, 44px tap targets, header→hamburger+`SidebarMenu` < md, `BottomNav` < md, product grid reflow, product-details stacking, admin tables usable.
7. **Build + lint.** `npm run build` must complete with **no errors** (warnings triaged). Run the project's linter (CRA ESLint via `npm run build`, or an explicit lint script if present) and clear errors — especially unused imports/state left behind by module removals.
8. **JSON Server data checks.** With the server running, confirm the seed data matches the enquiry model (see §10 URLs).
9. **Production readiness.** Confirm `public/index.html` title/meta/theme-color and `manifest.json` are NEBM (not "My Store"); favicon = NEBM icon; footer credit links to Assam Digital; no console errors on load; no leftover `console.log` noise; `.env.production` sane.

## 5. UI/UX requirements
- Confirm Blue `#1885d8` / Gold `#fa9c4c` throughout; no leftover `#667eea`/indigo. Apple-minimal look intact. NEBM logo `.../logo_fnscna.png` and icon `.../icon_bvsukn.png` render on light AND dark. "Add to Enquiry List" tooltip present. Empty states/loaders (prompt 33) present where applicable.

## 6. Data & API requirements
- Dual-mode must pass in both settings (`IS_MOCK_API` true and false), all through `extractData()` with interchangeable JSON shapes.
- The enquiry create payload must be **pure** — no totals/payment/coupon/wallet fields — and must NOT trigger `createPaymentForOrder`, `redeemCouponByCode`, or `debitWallet`.
- `db.json` collections reflect the pivot: `enquiries` present; `leads` present; `payments`/`refunds`/`returns`/`shipping_methods`/`coupons`/`walletTransactions` and `settings.shipping`/`settings.payment` removed or empty-and-unreferenced (guarded reads, no runtime orphan).
- Never surface `users[].password`.

## 7. Admin panel requirements
- Kept modules only in nav + routes: Dashboard · Products · Categories · Reviews · **Enquiries** · Users · Leads · Settings. Removed modules produce no route, nav entry, dead link, or dashboard/notification reference.
- Enquiries admin: list/filter/detail, status workflow New→Contacted→In Discussion→Quotation Sent→Converted→Closed→Lost, admin notes. Notification polling reads enquiries + leads without error.

## 8. Storefront requirements
- Full enquiry journey works; no cart total, no payment, no shipping, no coupon, no returns, no Buy Now anywhere in user-facing UI.
- Pricing modes (exact/tiered/onEnquiry) render correctly; tiered shows the quantity-vs-price table.
- Wishlist, account, reviews, search/filter/sort all still work.

## 9. Acceptance criteria (concrete pass/fail)
- [ ] **Terminology:** the grep in §4.1 yields no *user-facing* cart/checkout/order/buy-now/payment/shipping/coupon/returns strings (internal identifiers/routes/`api.js`/localStorage `"cart"` allowed).
- [ ] **Enquiry journey:** browse → filter → details → Add to Enquiry List → Enquiry List → Submit Enquiry → Enquiry Summary → success (with reference) → appears in Admin Enquiries as **New**. No payment/shipping/coupon step.
- [ ] **Pricing:** exact shows ₹+unit; tiered shows the quantity-vs-price table; onEnquiry shows "Price on Enquiry"; enquiry lines carry the chosen price/priceType.
- [ ] **Removed modules:** no `/admin/{payments,shipping,coupons,returns,special-offers}` routes/nav/dead links; dashboard + notifications don't reference them and don't error.
- [ ] **Dual-mode:** app works with `REACT_APP_USE_MOCK_API=true`; with `=false` the `IS_MOCK_API` false branch + `extractData()` are taken and the app compiles/behaves without mock-only crashes.
- [ ] **Enquiry side-effect-free:** submitting an enquiry does not create a payment/redeem a coupon/debit a wallet (verify no such rows appear).
- [ ] **Responsive:** no horizontal scroll and ≥44px tap targets at 360/768/1024/1440; header/`BottomNav`/grids/admin tables behave.
- [ ] **Build:** `npm run build` completes with no errors.
- [ ] **Lint:** no lint errors; no unused imports/state from removed modules.
- [ ] **Data checks:** the JSON Server URLs in §10 return NEBM-shaped data.
- [ ] **Production readiness:** NEBM title/meta/manifest/favicon; Assam Digital footer credit; no console errors; brand colours consistent (no `#667eea`).

## 10. Testing / verification steps
1. `npm run dev`. Execute the enquiry journey and admin walkthrough above; capture any failure.
2. Run the terminology grep (§4.1); classify every hit pass/allowed.
3. Dual-mode: run once with mock=true, once with mock=false + stub `REACT_APP_API_URL`; confirm branch taken via network/logging; revert.
4. Responsive sweep in the device toolbar at 360/768/1024/1440.
5. `npm run build` (expect clean) and the linter (expect clean).
6. **JSON Server data checks** (server running):
   - `http://localhost:3001/enquiries` → enquiries with `enquiryNumber`, `contact`, `items[]`, `status`, `statusHistory[]`; **no** payment/shipping/total fields.
   - `http://localhost:3001/products` → each product has `priceType`, `unitType`, and (for tiered) `priceTiers[]`; some have `special:true`.
   - `http://localhost:3001/categories` → the NEBM tree with correct `parentId`/`slug`/`showInMainMenu`.
   - `http://localhost:3001/leads` → contact + enquiry-derived leads.
   - `http://localhost:3001/settings` → `store` (NEBM name/tagline/address/both phones/INR), `seo`, `social`, `notifications`; **no** `shipping`/`payment`.
   - Confirm `http://localhost:3001/payments`, `/coupons`, `/returns`, `/shipping_methods` are absent or empty-and-unreferenced.
7. Submit one enquiry, then re-check `/enquiries` (new row, status New) and confirm `/payments`, `/coupons`, and any wallet ledger did **not** gain a row.

## 11. Notes on preserving existing functionality
Do **not** break while fixing QA failures:
- **Dual-mode** `IS_MOCK_API` + `extractData()` + JSON-shape fidelity — the smoke test must leave both branches working.
- **Auth** (customer + admin sessions, token interceptor, restore-with-token, never leak `password`).
- **Routing + provider nesting order** (`Theme→Auth→Admin→Wishlist→Cart→Order`, storefront in `DealsConfigProvider`) — renames must keep provider positions.
- **Slug/category rules** — `getCategoryScopeIds` (parent-includes-children), slug product URLs + legacy numeric redirect, `?category=<slug>`.
- **Safe non-cascading DELETE** (`server.js`) — never revert to cascade.
- **localStorage `"cart"`** persistence + login-merge/logout-clear behind the Enquiry List.
- **Enquiry flow fires no payment/coupon/wallet side effects.**
- **Per-component CSS Modules** + **storefront vs admin palette separation**.
- Fix only what fails; do not rewrite working modules or introduce new dependencies during QA.
