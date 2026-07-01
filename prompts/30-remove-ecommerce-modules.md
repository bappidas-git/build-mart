# 30 — Remove E-commerce-only Modules

## 1. Objective
Surgically remove the admin modules North East Build Mart (NEBM) does not use — **Returns, Payments, Coupons, Special Offers, Shipping** — from the routing, navigation, and page files, plus retire the storefront **Special Offers admin surface** (`AdminSpecialOffers` / `dealsConfig`). Do it without breaking the build, the shared API layer, auth, or routing. Leave the mock cascade helpers and the `admin.getReturns/getPayments/...` methods in `src/services/api.js` **dormant** (not imported by any remaining page) rather than ripping them out mid-file, and ensure nothing remaining reads the retired `db.json` collections at runtime.

## 2. Context / background
- Business: **North East Build Mart** — an e-commerce-*style* **enquiry** platform for building materials. NEBM has no purchases, so returns, payments, coupons, shipping methods, and deal/coupon merchandising are all dead weight in the admin. Admin panel: **MUI 5 + `src/theme/adminTheme.js`** + `@iconify/react` `mdi:*` icons.
- **Admin panel target after this prompt** — KEEP: Dashboard · Products · Categories · Reviews · **Enquiries** (renamed from Orders, prompt 28) · Users · Leads · Settings. REMOVE/HIDE: **Returns · Payments · Coupons · Special Offers · Shipping**.
- **Storefront Special Products** is a *badged collection* driven by the `special` flag on products (prompt 11 / prompt 26), NOT the old deal/coupon merchandising — so the admin **Special Offers** module and the `dealsConfig`-driven `DealsConfigProvider` admin surface are obsolete. (The storefront `DealsConfigProvider` wrapping in `App.js` and the `/special-offers` storefront route are handled by the storefront prompts; this prompt only removes the **admin** Special Offers page/route/nav — do not touch the storefront `DealsConfigProvider` tree unless a storefront prompt says so.)
- **Fragile couplings (Risk Register, `prompts/00-analysis-and-requirement-map.md` §6)**: the mock cascade helpers couple `orders ⇄ payments ⇄ coupons ⇄ returns ⇄ wallet`. Removing pages must NOT delete helpers other code imports (e.g. `deleteWithVerify`, `historyEvent`, `performCancel`). Deleting/ignoring the `db.json.returns/payments/refunds/coupons/shipping_methods` collections must not orphan a code path that still reads them at runtime — guard reads or keep empty arrays.
- Dual-mode rule (restate): the `apiService` layer branches on `IS_MOCK_API` and shapes via `extractData()`; leaving methods dormant keeps both branches valid. The **safe non-cascading DELETE in `server.js`** stays.

## 3. Files & folders to inspect (exact removal targets)
- `src/App.js` — imports (~lines 51–56) and routes (~lines 85–90) for AdminReturns, AdminPayments, AdminShipping, AdminCoupons, AdminSpecialOffers.
- `src/components/AdminLayout/AdminLayout.js` — `menuItems` "Sales"/"Operations" sections (~lines 70–110): Returns, Payments, Coupons, Special Offers, Shipping entries.
- Page files to delete: `src/pages/Admin/AdminReturns.js`, `AdminPayments.js`, `AdminCoupons.js`, `AdminSpecialOffers.js`, `AdminShipping.js`.
- `src/services/api.js` — the `admin.getReturns/getReturn/createReturn/updateReturn/scheduleReturnPickup/markReturnInTransit`, `getPayments/getPayment/getRefunds/issueRefund`, `getShippingMethods/createShippingMethod/updateShippingMethod/deleteShippingMethod/shiprocket*`, `getCoupons/createCoupon/updateCoupon/deleteCoupon`, `getDealsConfig/updateDealsConfig` methods (leave DORMANT); and shared helpers `deleteWithVerify`, `historyEvent`, `performCancel`, `createPaymentForOrder`, `redeemCouponByCode` (do NOT delete — still referenced).
- `prompts/00-analysis-and-requirement-map.md` §5 (removal strategy) and §6 (Risk Register).

## 4. Step-by-step implementation instructions
### A. Delete the page files (exact list)
1. Delete `src/pages/Admin/AdminReturns.js`
2. Delete `src/pages/Admin/AdminPayments.js`
3. Delete `src/pages/Admin/AdminCoupons.js`
4. Delete `src/pages/Admin/AdminSpecialOffers.js`
5. Delete `src/pages/Admin/AdminShipping.js`

### B. `src/App.js` — remove imports + routes
6. Delete these imports: `AdminReturns`, `AdminPayments`, `AdminShipping`, `AdminCoupons`, `AdminSpecialOffers` (lines ~51–56).
7. Delete these routes inside `<Route element={<AdminLayout />}>`:
   - `<Route path="returns" element={<AdminReturns />} />`
   - `<Route path="payments" element={<AdminPayments />} />`
   - `<Route path="shipping" element={<AdminShipping />} />`
   - `<Route path="coupons" element={<AdminCoupons />} />`
   - `<Route path="special-offers" element={<AdminSpecialOffers />} />`
8. Leave the surviving admin routes: `dashboard, products, categories, enquiries` (prompt 28), `reviews, users, leads, settings`. Do NOT touch the storefront routes or the `DealsConfigProvider` wrapper.

### C. `src/components/AdminLayout/AdminLayout.js` — remove nav entries + regroup
9. From `menuItems`, delete the entries: **Returns, Payments, Coupons, Special Offers** (the "Sales" group) and **Shipping** (the "Operations" group).
10. Regroup the sections so no empty section header remains:
    - **Dashboard** (ungrouped, first).
    - **Catalogue**: Products, Categories, Reviews.
    - **Enquiries** section (or fold under a sensible header): the **Enquiries** entry (`mdi:clipboard-text-outline`, `/admin/enquiries` — from prompt 28).
    - **Operations**: Users (`mdi:account-multiple-outline`), Leads (`mdi:message-text-outline`), Settings (`mdi:cog-outline`).
    Ensure the "Sales" section header is removed entirely (it would otherwise render with no items). Verify no `menuItems` entry points to `/admin/returns|payments|coupons|special-offers|shipping`.
11. Confirm `loadNotifications` no longer references orders-as-purchases (prompt 28 already switched it to enquiry statuses). This prompt must not reintroduce any returns/payments notification logic.

### D. `src/services/api.js` — keep dormant, verify no orphan reads
12. **Do NOT delete** the `admin.getReturns/getPayments/getCoupons/getShippingMethods/getDealsConfig` (and siblings) methods, nor the cascade helpers (`performCancel`, `createPaymentForOrder`, `redeemCouponByCode`, `restoreCouponByCode`, `debitWallet`, `deleteWithVerify`, `historyEvent`, …). They stay in the file, un-imported by any remaining page. Removing them mid-file risks breaking still-referenced helpers and the build.
13. **Runtime-read audit**: grep the remaining code for any surviving reader of the retired collections. After prompt 25 the dashboard no longer reads `/returns` or `/coupons`; confirm nothing else in a KEPT page calls `getReturns/getPayments/getCoupons/getShippingMethods/getDealsConfig`. If a stray call remains (e.g. an old refund button), remove that call. Any remaining defensive read must tolerate an empty/missing collection (`.catch(() => ({ data: [] }))` / `|| []`) so a pruned `db.json` never crashes the app.
14. Leave the `db.json` `returns/payments/refunds/coupons/shipping_methods/walletTransactions/dealsConfig` collections in place (or empty) — do not edit `db.json` in this prompt; just ensure no KEPT code path hard-requires their contents.

### E. Storefront Special Offers admin surface
15. Remove the **admin** Special Offers page/route/nav (steps A4, B7, C9) and its `getDealsConfig/updateDealsConfig` usage from admin. Do NOT remove the storefront `DealsConfigProvider` from `App.js` or the storefront `/special-offers` route here — those are storefront-prompt territory; ripping them out now would break the storefront tree (Risk Register item 2). The badged **Special Products** collection (prompt 11) replaces this merchandising surface.

## 5. UI/UX requirements
- After removal the admin sidebar shows only: Dashboard · Products · Categories · Reviews · Enquiries · Users · Leads · Settings — no empty section headers, no dead links. Keep the existing `adminTheme.js` styling and `mdi:*` icons. No new colours needed; brand hexes `#1885d8`/`#fa9c4c` unchanged.

## 6. Data & API requirements
- No `db.json` edits in this prompt. `apiService` keeps every method (dormant ones included) so **dual-mode `IS_MOCK_API` + `extractData()`** stays valid.
- No KEPT page may read `returns/payments/refunds/coupons/shipping_methods/dealsConfig` at runtime; any residual read is guarded to tolerate empty/missing data.

## 7. Admin panel requirements
- Routes removed: `/admin/returns`, `/admin/payments`, `/admin/coupons`, `/admin/special-offers`, `/admin/shipping`. Navigating to them should fall through to the storefront catch-all / login guard (they no longer render the deleted pages).
- Nav entries removed; sections regrouped with no empty headers.

## 8. Storefront requirements
- Do NOT alter storefront routes, the `DealsConfigProvider` wrapper, or the storefront `/special-offers` page in this prompt. Storefront Special Products is a badged collection (prompt 11).

## 9. Acceptance criteria
- [ ] `AdminReturns.js`, `AdminPayments.js`, `AdminCoupons.js`, `AdminSpecialOffers.js`, `AdminShipping.js` are deleted.
- [ ] `src/App.js` has no imports or routes for those five pages; surviving admin routes intact.
- [ ] `AdminLayout.menuItems` has no Returns/Payments/Coupons/Special Offers/Shipping entries and no empty "Sales" header; sidebar lists exactly the 8 kept modules.
- [ ] No KEPT page calls `getReturns/getPayments/getCoupons/getShippingMethods/getDealsConfig`; any residual read tolerates empty/missing collections.
- [ ] The dormant `admin.*` methods and cascade helpers still exist in `api.js`; shared helpers (`deleteWithVerify`, `historyEvent`, `performCancel`) are intact and the file compiles.
- [ ] `npm run build` succeeds; no unresolved imports; auth/routing/provider nesting intact.
- [ ] Storefront `DealsConfigProvider` and `/special-offers` storefront route untouched.

## 10. Testing / verification steps
1. `npm run build` — must complete with no "module not found" / unused-import failures. Then `npm run dev`.
2. Log in at `/admin`; confirm the sidebar shows only Dashboard, Products, Categories, Reviews, Enquiries, Users, Leads, Settings — no empty section header.
3. Manually visit `/admin/returns`, `/admin/payments`, `/admin/coupons`, `/admin/special-offers`, `/admin/shipping` — none render the deleted pages (redirect/guard/catch-all), and there is no white-screen crash.
4. Open the Dashboard, Products, Categories, Enquiries, Leads, Users, Settings pages — each loads without console errors and without requesting `/returns`, `/payments`, `/coupons`, `/shipping_methods`, or `/dealsConfig` (check DevTools → Network).
5. Confirm the storefront still loads (`/`) and the storefront `/special-offers` page (if present) is unaffected.

## 11. Notes on preserving existing functionality (risk-register cautions)
- **Do NOT delete shared helpers or the dormant `admin.*` methods** from `api.js` — `performCancel`/`createPaymentForOrder`/`redeemCouponByCode`/`deleteWithVerify`/`historyEvent` are still referenced by KEPT code; removing them mid-file breaks the build (Risk Register item 1).
- **Provider nesting order** — do not remove `DealsConfigProvider`/`OrderProvider` or reorder `Theme→Auth→Admin→Wishlist→Cart→Order`; touching the storefront `DealsConfigProvider` here white-screens the storefront (Risk Register item 2).
- **Dual-mode `IS_MOCK_API` + `extractData()`** stays valid because methods remain; never introduce a mock-only shape.
- **Safe non-cascading DELETE** (`server.js`) unchanged.
- **No orphan runtime reads** — a pruned/empty `returns/payments/coupons/shipping_methods/dealsConfig` collection must never crash a KEPT page; guard reads (`|| []`, `.catch(() => …)`).
- **Auth/token interceptors** and the `/admin/*` + `AdminLayout` routing structure intact.
- **Storefront untouched** — Special Products badged collection replaces the deal/coupon merchandising; the storefront tree is not modified by this prompt.
- This is a careful surgical removal: delete exactly the five pages + their routes/imports/nav entries listed above, and nothing else.
