# 02b — Requirement Mapping Checklist (2026-07-01)

> **Prompt‑02 deliverable.** The itemised, **source‑verified** requirement map that turns the e‑commerce→enquiry transformation into a checklist prompts `03`–`35` tick off. Every module carries exactly one action (**KEEP / RENAME / REPURPOSE / EXTEND / REMOVE**), a one‑line enquiry target, the prompt that executes it, and a source anchor proving the map targets the **real current tree** (not an assumed one). Companion to `prompts/02-requirement-mapping.md` (the spec) and `prompts/00b-regrounding-verification-2026-07-01.md` (the re‑grounding).
>
> **Analysis‑only.** No application code, `db.json`, docs or config were modified — only this note was added under `prompts/`.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

---

## A. Source‑verification anchors — the map targets the *current* state (Prompt‑02 §10.2, verified)

Both mandated cross‑checks reproduce at source today, confirming every rename/removal below has a real target to act on later:

- ✅ **`orders.create` still fires all three side effects (mock mode).** [`src/services/api.js:1139‑1174`](src/services/api.js): after `POST /orders` it calls `await createPaymentForOrder(saved)` (1159), `if (orderData?.couponCode) await redeemCouponByCode(...)` (1160), and `if (Number(saved.storeCreditUsed) > 0) await debitWallet(...)` (1163‑1168). Helper defs live at `createPaymentForOrder` (277), `redeemCouponByCode` (319), `debitWallet` (450). → **These three must NOT fire from the enquiry submit path** (prompt 18).
- ✅ **`AdminLayout.menuItems` still lists every module to be removed.** [`src/components/AdminLayout/AdminLayout.js:43‑126`](src/components/AdminLayout/AdminLayout.js): **Catalogue** (Products 55, Categories 60, Reviews 65) · **Sales** (Orders 75, Returns 80, Payments 87, Coupons 92, Special Offers 97) · **Operations** (Shipping 107, Users 112, Leads 117, Settings 122). → Orders is **renamed**; Returns/Payments/Coupons/Special Offers/Shipping are **removed** (prompt 30).
- ✅ **Notification poll still keys off order/lead statuses.** `AdminLayout.js:180‑182` filters `order.fulfillmentStatus === "unfulfilled" || order.status === "pending" || order.status === "processing"`; `:202` filters `lead.status === "new"`; `setInterval(..., 30000)` at `:232`. → Reshape order filter to `status === "New"` (enquiry set) so notifications don't silently break (prompt 25/28).
- ✅ **Admin routes present in `App.js`.** [`src/App.js:81‑93`](src/App.js) mounts all 13: dashboard, products, categories, orders, returns, payments, users, shipping, coupons, special‑offers, reviews, leads, settings. → 5 routes removed, `orders` retargeted (prompt 30/28).
- ✅ **All 14 admin page files exist** under `src/pages/Admin/` (incl. the 5 to delete: `AdminReturns.js`, `AdminPayments.js`, `AdminCoupons.js`, `AdminShipping.js`, `AdminSpecialOffers.js`).
- ✅ **`db.json` carries all 18 collections/singletons** — `orders` (1667), `returns` (2527), `payments` (2629), `refunds` (2830), `shipping_methods` (2893), `coupons` (2943), `walletTransactions` (3402), `dealsConfig` (3446) among them — so every retire/repurpose target is real.

---

## B. Terminology map (storefront) — captured verbatim (Prompt‑02 §5)

Apply throughout; keep API plumbing intact.

| E‑commerce term | Becomes |
|---|---|
| Cart | **Enquiry List** |
| Add to Cart | **Add to Enquiry List** — an **icon button with tooltip** "Add to Enquiry List" |
| Buy Now | **Removed entirely** |
| Checkout | **Submit Enquiry / Send Enquiry** (review step titled **"Enquiry Summary"**) |
| Place Order | **Submit Enquiry** |
| Order (customer) | **Enquiry** |
| Order Details | **Enquiry Details** |
| Orders (admin) | **Enquiries** |
| Payment / Shipping / Coupon UI | **Removed** |

---

## C. Enquiry status set — canonical for `enquiries.status` (Prompt‑02 §8)

> **New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost**

Consumed by: the `enquiries.status` field; Admin → Enquiries list filters; the enquiry‑detail status control + `statusHistory[]`; and the reshaped `AdminLayout` notification filter (surface `status === "New"` in place of `fulfillmentStatus === "unfulfilled"`).

---

## D. Module‑by‑module action checklist

One action per module, its enquiry target, the prompt that executes it, and a source anchor. Tick as prompts land.

### D1 — KEEP (crown jewels & re‑skin‑only)

- [ ] **KEEP** — Dual‑mode API (`api.js`, `baseURL.js`) · `IS_MOCK_API` + `extractData()` preserved everywhere · *runs through all prompts* · anchor `api.js:67‑72`, `baseURL.js`.
- [ ] **KEEP** — Safe non‑cascading DELETE (`server.js`) · never revert · anchor `server.js:67‑95`.
- [ ] **KEEP** — Auth (`AuthContext`, `authStorage`, `auth`/`admin.login`) · register/login/account intact; never leak `users[].password` · prompt 21/31.
- [ ] **KEEP** — `categories.js` helpers (slug + `getCategoryScopeIds` parent‑includes‑children) · unchanged while data reseeds · prompt 06 · anchor `src/utils/categories.js`.
- [ ] **KEEP** — Wishlist (`Wishlist`, `WishlistContext`) · re‑skin only · prompt 21.
- [ ] **KEEP** — Profile / account (`Profile`) · re‑skin; history = enquiries · prompt 21.
- [ ] **KEEP** — Reviews (`AdminReviews`, `ReviewsSection`, `reviews`) · re‑skin · prompt 31.
- [ ] **KEEP** — Users (`AdminUsers`) · re‑skin · prompt 31.

### D2 — EXTEND / RE‑SKIN

- [ ] **EXTEND / RE‑SKIN** — Theme (`colors.js`, `tokens.js`, `storefront-tokens.css`, `adminTheme.js`) · Blue `#1885d8` + Gold `#fa9c4c`; keep token architecture + storefront/admin palette separation; re‑skin **both** light and `body.dark` blocks · prompt 03.
- [ ] **EXTEND** — Logo / favicon / meta (`public/*`, `index.html`, `manifest.json`) · NEBM Cloudinary logo/icon, title, meta · prompt 04.
- [ ] **EXTEND** — `products` schema + admin form + `PriceBlock` · add `priceType ("exact"\|"tiered"\|"onEnquiry")`, `unitType`, `minQty`, `priceTiers[{minQty,price}]`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`, `special` · prompt 05/15/27.
- [ ] **EXTEND / TRIM** — Settings (`AdminSettings`, `settings`) · keep store/contact/SEO/social; drop shipping/payment sections · prompt 31.

### D3 — RENAME / REPURPOSE

- [ ] **REPURPOSE (data) / KEEP (helpers)** — `categories` collection · seed NEBM tree; slug + parent rules unchanged · prompt 06.
- [ ] **RENAME / REPURPOSE** — Cart (`CartContext`, `useCart`, `CartDrawer`, `QuantityStepper`) → **Enquiry List** · multi‑product + quantities, **no totals/payment**; keep localStorage key `"cart"` + login‑merge/logout‑clear · prompt 16/17.
- [ ] **REPURPOSE** — Checkout + `OrderContext` + `orders.create` → **Submit Enquiry / "Enquiry Summary"** · note + captured contact; **no** payment/shipping/coupon; **must not** fire payment/coupon/wallet side effects (§A) · prompt 18/19.
- [ ] **RENAME** — `OrderConfirmation` → **Enquiry success** screen with an enquiry reference · prompt 20.
- [ ] **REPURPOSE → `enquiries` / Admin "Enquiries"** — `orders` collection + `AdminOrders` · list/search/filter, detail (products/qty/customer/note), admin notes, 7‑status workflow · prompt 05/28.
- [ ] **REPURPOSE** — `OrderHistory` · customer sees their **enquiries**, not orders · prompt 21.
- [ ] **REPURPOSE / EXTEND** — Leads (`AdminLeads`, `leads`) · CRM for contact + enquiry‑derived leads · prompt 29.

### D4 — REMOVE / RETIRE

- [ ] **REMOVE** — **Buy Now** everywhere (`AddToCartBar`, `ProductDetails`) · no purchase path · prompt 14.
- [ ] **REMOVE / RETIRE** — Payments (`AdminPayments`, `payments`/`refunds`) · route/nav/page removed; cascade helpers dormant · prompt 30.
- [ ] **REMOVE / RETIRE** — Shipping (`AdminShipping`, `shipping_methods`, shiprocket) · same · prompt 30.
- [ ] **REMOVE / RETIRE** — Coupons (`AdminCoupons`, `coupons`) · same · prompt 30.
- [ ] **REMOVE / RETIRE** — Returns (`AdminReturns`, `returns`/`refunds`) · same · prompt 30.
- [ ] **REMOVE (admin) / repurpose storefront** — Special Offers (`AdminSpecialOffers`, `dealsConfig`) → badged **Special Products** collection · prompt 11/30.
- [ ] **REMOVE / RETIRE** — Wallet (`wallet`, `walletTransactions`, `users[].storeCredit`) · no money movement · prompt 30.

### D5 — KEEP / RE‑WORD & REWRITE

- [ ] **KEEP / RE‑WORD** — Policy pages (`RefundPolicy`, `Privacy`, `Terms`, `Cookie`) · re‑word away from purchase/returns where needed · prompt 22‑24.
- [ ] **REWRITE** — Docs (`00_BACKEND_README_AND_CONVENTIONS.md`, `01_DATABASE_SCHEMA.md`, `02_API_ENDPOINTS.md`, `03_BUSINESS_LOGIC_AND_CASCADES.md`, `04_AUTH_ERRORS_AND_EDGE_CASES.md`, `README.md`, `STOREFRONT_UX_GUIDELINES.md`) · reflect NEBM + enquiry model + new schema/API · prompt 34.

---

## E. Removal strategy (Prompt‑02 §4/§7 — how the D4 modules retire)

- [ ] **Routes** — delete the 5 `<Route>` entries in `App.js` (returns `:85`, payments `:86`, shipping `:88`, coupons `:89`, special‑offers `:90`); keep `orders` route but retarget to Enquiries.
- [ ] **Nav** — delete the 5 `menuItems` entries in `AdminLayout.js` (Returns `:80`, Payments `:87`, Coupons `:92`, Special Offers `:97`, Shipping `:107`) and prune now‑empty section headers; rename Orders `:75` → Enquiries.
- [ ] **Page files** — delete `AdminReturns.js`, `AdminPayments.js`, `AdminCoupons.js`, `AdminShipping.js`, `AdminSpecialOffers.js`.
- [ ] **Cascade helpers stay DORMANT** — the mock helpers in `api.js` (`createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`, `performCancel`, `restockItems`, wallet/refund/payment/audit helpers) are **not deleted** and **not invoked** by the enquiry create path; the shared API layer stays intact.
- [ ] **Dashboard stats reshaped** — `getDashboardStats` fields referencing removed modules (`totalRevenue`, `pendingReturns`, `activeCoupons`, order‑centric `pendingOrders`) reshaped to enquiry metrics · prompt 25.
- [ ] **Notification filter reshaped** — `AdminLayout.js:180‑182` retargeted from `fulfillmentStatus === "unfulfilled" \| status ∈ {pending,processing}` to enquiry `status === "New"`; lead filter (`:202`) kept · prompt 25/28.
- [ ] **Data collections retired** — `payments/returns/refunds/shipping_methods/coupons/walletTransactions/dealsConfig` emptied or removed **while guarding any runtime reader** (risk item 1) · prompt 05.

---

## F. Data & API rule — restated (Prompt‑02 §6, non‑negotiable)

- [ ] **Dual‑mode preserved** — keep `IS_MOCK_API` branching, shape every response via `extractData()`, keep JSON‑shape fidelity so the same UI runs against JSON Server (dev) and Laravel (prod). Renames never bypass it.
- [ ] **No side effects from enquiry submit** — the enquiry create path POSTs a *pure* enquiry payload and fires **none** of `createPaymentForOrder` / `redeemCouponByCode` / `debitWallet` (verified live at §A).
- [ ] **`orders` → `enquiries` shape** — keep `items[]`, `statusHistory[]`, `notes`; drop money/payment/shipping fields; add `enquiryNumber`, `contact{name,phone,email}`, `status` (7‑value set), `adminNotes` · prompt 05.
- [ ] **Slug rules preserved** — product slug URLs, `?category=<slug>`, and `getCategoryScopeIds` parent‑includes‑children survive the reseed.
- [ ] **Safe DELETE preserved** — `server.js` non‑cascading override untouched.
- [ ] **Cart localStorage key `"cart"`** + login‑merge/logout‑clear kept through the Enquiry‑List rename.
- [ ] **Provider nesting order preserved** — `Theme→Auth→Admin→Wishlist→Cart→Order`, storefront under `DealsConfigProvider`; Cart/Order context renames keep the same positions.

---

## G. Admin surface target & enquiry capture (Prompt‑02 §7)

- **KEEP:** Dashboard · Products · Categories · Reviews · **Enquiries** (renamed from Orders) · Users · Leads · Settings.
- **REMOVE/HIDE:** Returns · Payments · Coupons · Special Offers · Shipping.
- **Captured on enquiry submit:** name · phone · email (if available) · products · quantities · selected price / price type · user note/message · enquiry date/time · enquiry status.

## H. Users CAN / CANNOT (Prompt‑02 §5)

- **CAN:** browse home/categories/listings/details; search/filter/sort; view featured & special products; add to Enquiry List & manage quantities; submit an enquiry with a note/message; register/login; use wishlist & account.
- **CANNOT:** place orders, pay, checkout‑to‑buy, use shipping, apply coupons, request returns. Product details has **no "Buy Now"**.

---

## I. Acceptance‑criteria self‑check (Prompt‑02 §9)

- [x] Terminology map captured verbatim → **§B**.
- [x] Every module has exactly one action + target behaviour → **§D** (KEEP/EXTEND/RENAME‑REPURPOSE/REMOVE/REWORD buckets, one line each).
- [x] The 7 enquiry statuses listed as the canonical set → **§C**.
- [x] Removal strategy documented (routes/nav/pages removed; cascade helpers dormant; dashboard/notification filters reshaped) → **§E**.
- [x] Dual‑mode rule + "enquiry create must not fire payment/coupon/wallet side effects" restated → **§F**.
- [x] No application code, `db.json`, docs or config modified → only this note under `prompts/`.

---

*Mapping complete and reconciled against the live tree (2026-07-01). No `src/`, `db.json`, `server.js`, `public/`, root docs or config were touched. Prompts `03`–`35` execute the checkboxes above.*
