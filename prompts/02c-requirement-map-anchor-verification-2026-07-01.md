# 02c — Requirement-Map Source-Anchor Verification (2026-07-01)

> **Prompt‑02 verification deliverable.** The companion/verification pass for `prompts/02b-requirement-mapping-checklist-2026-07-01.md` (the checklist) and `prompts/02-requirement-mapping.md` (the spec). Every `file:line` anchor the checklist leans on was re‑opened at source and cross‑checked line‑for‑line against the **current tree**. Bottom line: **every anchor reproduces exactly — 100% match, zero drift.** The requirement map targets the real current state, so prompts `03`–`35` can tick the §D checkboxes against trustworthy coordinates. One non‑defect nuance is recorded in §5.
>
> **Analysis‑only.** No application code, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

---

## 1. Method

Each anchor in `02b` §A (the two mandated cross‑checks plus the supporting set) and the line numbers cited in §D/§E were verified by re‑reading the exact ranges in `src/services/api.js`, `src/components/AdminLayout/AdminLayout.js`, `src/App.js`, `db.json`, and by globbing `src/pages/Admin/*.js`. A claim counts as **verified** only when the cited line holds the cited construct verbatim — not merely "somewhere in the file."

---

## 2. Mandated cross‑checks (`02b` §A) — reproduced at source

- ✅ **`orders.create` still fires all three side effects (mock mode).** [`api.js:1139‑1174`](src/services/api.js): inside `if (IS_MOCK_API)` after `POST /orders` — `await createPaymentForOrder(saved)` (**1159**), `if (orderData?.couponCode) await redeemCouponByCode(orderData.couponCode)` (**1160**), and `if (Number(saved.storeCreditUsed) > 0) await debitWallet(...)` (**1163‑1168**). Helper definitions confirmed as top‑level consts: `restockItems` (248), `createPaymentForOrder` (**277**), `redeemCouponByCode` (**319**), `debitWallet` (**450**), `performCancel` (593). → **The enquiry submit path must fire none of these** (prompt 18 / §F).
- ✅ **`AdminLayout.menuItems` still lists every removal target.** [`AdminLayout.js:43‑126`](src/components/AdminLayout/AdminLayout.js): **Catalogue** → Products **55**, Categories **60**, Reviews **65**; **Sales** → Orders **75**, Returns **80**, Payments **87**, Coupons **92**, Special Offers **97**; **Operations** → Shipping **107**, Users **112**, Leads **117**, Settings **122**. Section headers (`isSection:true`) at Catalogue 50, Sales 70, Operations 102. Every line matches.
- ✅ **Notification poll still keys off order/lead statuses.** [`AdminLayout.js:178‑183`](src/components/AdminLayout/AdminLayout.js) filters `order.fulfillmentStatus === "unfulfilled" || order.status === "pending" || order.status === "processing"`; lead filter `lead.status === "new"` at **202**; `setInterval(loadNotifications, 30000)` at **232**. → Reshape the order filter to enquiry `status === "New"` or notifications silently break (prompt 25/28).
- ✅ **Admin routes present in `App.js`.** [`App.js:80‑93`](src/App.js) mounts, inside `<Route element={<AdminLayout />}>`, all 13: dashboard **81**, products **82**, categories **83**, orders **84**, returns **85**, payments **86**, users **87**, shipping **88**, coupons **89**, special‑offers **90**, reviews **91**, leads **92**, settings **93**. Index `<AdminLogin />` at **79**.
- ✅ **All 14 admin page files exist** under `src/pages/Admin/`: `AdminCategories`, `AdminCoupons`, `AdminDashboard`, `AdminLeads`, `AdminLogin`, `AdminOrders`, `AdminPayments`, `AdminProducts`, `AdminReturns`, `AdminReviews`, `AdminSettings`, `AdminShipping`, `AdminSpecialOffers`, `AdminUsers` — including all 5 deletion targets (`AdminReturns`, `AdminPayments`, `AdminCoupons`, `AdminShipping`, `AdminSpecialOffers`).
- ✅ **`db.json` carries all 18 collections/singletons** with every retire/repurpose target at the cited line: `orders` **1667**, `returns` **2527**, `payments` **2629**, `refunds` **2830**, `shipping_methods` **2893**, `coupons` **2943**, `walletTransactions` **3402**, `dealsConfig` **3446**.

---

## 3. §D/§E line numbers — spot‑checks reconciled

The removal‑strategy line numbers in `02b` §E resolve exactly to the constructs they name:

| §E instruction | Cited line | Source | Match |
|---|---|---|---|
| Delete `<Route returns>` | App.js `:85` | `<Route path="returns" element={<AdminReturns />} />` | ✅ |
| Delete `<Route payments>` | App.js `:86` | `<Route path="payments" element={<AdminPayments />} />` | ✅ |
| Delete `<Route shipping>` | App.js `:88` | `<Route path="shipping" element={<AdminShipping />} />` | ✅ |
| Delete `<Route coupons>` | App.js `:89` | `<Route path="coupons" element={<AdminCoupons />} />` | ✅ |
| Delete `<Route special-offers>` | App.js `:90` | `<Route path="special-offers" element={<AdminSpecialOffers />} />` | ✅ |
| Rename Orders nav → Enquiries | AdminLayout.js `:75` | `title: "Orders"`, `path:"/admin/orders"` | ✅ |
| Delete Returns / Payments / Coupons / Special Offers / Shipping nav | AdminLayout.js `:80 / :87 / :92 / :97 / :107` | matching `menuItems` entries | ✅ |

---

## 4. `db.json` collection inventory (18/18)

Read from the top‑level keys: `banners` (2) · `users` (28) · `admins` (102) · `categories` (114) · `products` (340) · `cart` (1666) · `orders` (1667) · `returns` (2527) · `payments` (2629) · `refunds` (2830) · `shipping_methods` (2893) · `coupons` (2943) · `reviews` (3025) · `wishlist` (3148) · `leads` (3282) · `settings` (3344) · `walletTransactions` (3402) · `dealsConfig` (3446). → matches `02b` §A "all 18 collections/singletons" and `00b` §3 exactly.

---

## 5. Reconciliation — one nuance, no defects

Every anchor verified; nothing in the map contradicts the tree. Recorded for the executing prompts:

1. **`AdminLogin.js` is a KEEP, not a removal target — and the checklist already treats it correctly.** The **14** page files include `AdminLogin.js`, which backs the `/admin` **index** route ([`App.js:79`](src/App.js)) *outside* the `<AdminLayout>` element — so it is not one of the **13** routes listed at `:81‑93`. `02b` §A counts "14 page files" and "13 admin routes" as two distinct, correct figures; prompt 30's deletion set (the 5 e‑commerce pages) never touches it. No change needed — flagged only so the count difference isn't mistaken for drift later.

---

*Verification complete and reconciled against the live tree (2026‑07‑01). No `src/`, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`. Prompts `03`–`35` execute the checkboxes in `02b` §D against the anchors confirmed above.*
