# 03 — Business Logic & Server-Side Cascades

Everything the **mock branch** of `api.js` does client-side (under `IS_MOCK_API`) must, in Laravel,
run **server-side inside a single DB transaction** on the relevant endpoint. The client **does not**
repeat these in production, so **the server is solely responsible**. Identity/status/timestamps are
server-owned (file 00 §14).

> **North East Build Mart (NEBM) has no money.** The boilerplate's order⇄payment⇄coupon⇄return⇄wallet
> cascades are **gone**.
> The enquiry path is a **pure lead** — it moves no money, redeems no coupon, touches no wallet, ships
> nothing. What remains server-side is small: **enquiry creation, the enquiry status workflow, review
> moderation, category referential integrity, the settings singleton, and the dashboard rollup.**

Legend for state tables: **trigger → tables touched → field changes → emitted `statusHistory` entry**.

---

## 1. Enquiry creation — `POST /enquiries` (one transaction)

`Checkout.js` (**Submit Enquiry**) → `OrderContext.createOrder` → `orders.create`. The client sends a
**pure enquiry payload** (file 02 §F): `type:"enquiry"`, `contact`, `items`, `notes`, and (advisory)
`userId`/`enquiryNumber`/`status`/`statusHistory`. The server:

1. **Validate** the payload: non-empty `items[]`; `contact.name` and `contact.phone` present;
   `contact.email` optional; each item resolves to a live product; `quantity ≥ 1`. Reject with **422**
   otherwise (file 04).
2. **Create the enquiry**, generating `enquiryNumber` (`ENQ-YYYYMMDD-NNNN`, **server-owned** — ignore
   any client value), forcing `status:"New"`, persisting `userId` (from the token when logged in; else
   `null` for a guest), and stamping `createdAt`/`updatedAt`.
3. **Seed `statusHistory`** with a single entry `{ at: now, by: contact.name (or "Customer"),
   action: "Enquiry submitted" }`.
4. **(Optional) Derive a lead** for the CRM: you may create a `leads` `contact` row from the enquiry's
   contact details so follow-ups surface under Admin → Leads. *(Not done by the mock; safe to add.)*
5. **(Optional) Notify the store** by email if `settings.notifications.adminNewOrderEmail` is true
   (to `settings.notifications.adminEmail`). *(Not done by the mock; the notification is intent, not a
   data cascade.)*
6. Return the saved enquiry (with server `id`, `enquiryNumber`, seeded `statusHistory`, timestamps).

**Item snapshot rule:** each `items[]` row stores `productId, variantId, name, image, sku, quantity,
priceType, unitType` and a `price` that is **only** populated for an `exact`-priced product (`tiered`
and `onEnquiry` items carry `price: null`). There is **no line subtotal and no enquiry total.**

> **No idempotency ledger needed** — an enquiry create writes exactly one row and no side-effect ledger.
> A double-submit simply creates two enquiries (the client guards against it in the UI).

---

## 2. What must NOT happen on the enquiry path (removed cascades)

The mock's `orders.create` still contains the boilerplate side effects **but they are gated off**: the
payload is flagged `type:"enquiry"`, and the code runs `createPaymentForOrder` / `redeemCouponByCode` /
`debitWallet` **only** when `saved.type !== "enquiry"` — which never happens for a real NEBM enquiry.
Your Laravel `POST /enquiries` must mirror this: **do none of the following.**

| Removed cascade (boilerplate) | NEBM behaviour |
| --- | --- |
| Create a `payments` row (`createPaymentForOrder`) | **Never.** No payment exists. |
| Increment a coupon `usedCount` (`redeemCouponByCode`) | **Never.** No coupons. |
| Debit a store-credit wallet (`debitWallet`) | **Never.** No wallet. |
| Compute `subtotal`/`discount`/`shipping`/`tax`/`total`/`amountPayable` | **Never.** No money math. |
| Reserve/deduct stock, restock on cancel | **Never.** Submitting an enquiry does not move stock. |
| Any refund / return / recall / void flow | **Never.** Those modules are removed. |

The enquiry update path (§3) is likewise money-free — `PATCH /admin/enquiries/{id}` only ever changes
`status`, `adminNotes` and appends `statusHistory`.

---

## 3. Enquiry status workflow (admin)

Triggered by `PATCH /admin/enquiries/{id}` with `{ status?, adminNotes?, event? }`
(`updateEnquiry` / `updateEnquiryStatus`). On any status change the server:

- sets the new `status`, updates `updatedAt`;
- appends a `statusHistory` entry `{ at: now, by: <admin name from token>, action, note? }` — the
  client sends `event: { action: "Status → <status>" }`;
- optionally merges `adminNotes` (internal; never shown to the customer).

**The status values** (the only allowed set):

```
New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost
```

**Intended pipeline** (each step appends history):

```
New ──▶ Contacted ──▶ In Discussion ──▶ Quotation Sent ──▶ Converted ──▶ Closed
   └──────────────────────────────────────────────────────────────▶ Lost
```

- **Converted** — the enquiry led to a sale (handled offline). **Closed** — finished/archived.
  **Lost** — the customer did not proceed. These three are the terminal states.
- **Lost** / **Closed** are reachable from any active state; an admin may also reopen a terminal
  enquiry back to an active state if needed.

> The mock does **not** enforce a state machine — it stores whatever `status` the admin picks. If you
> enforce transitions server-side, accept at minimum the forward pipeline above plus `→ Lost`/`→ Closed`
> from any state, and reject unknown status strings with **422**. Do not otherwise constrain the admin,
> or the dropdown in Admin → Enquiries will break parity.

---

## 4. Reviews (moderation)

NEBM keeps the reviews module for social proof on product pages, but **there is no purchase-gating**
(no orders/deliveries exist). The live paths:

- **Visibility:** `GET /products/{id}/reviews` → **approved only**. This is what the PDP renders.
- **Admin moderation:** `GET /admin/reviews` (all statuses), `PATCH /admin/reviews/{id} { status }`
  (`approved`/`rejected`/`pending`), `DELETE /admin/reviews/{id}`.
- **Admin-authored reviews:** `POST /admin/reviews` sets `userId:null`, `source:"admin"`, default
  `status:"approved"`, `helpfulCount:0`, author under the supplied `userName`.
- **Aggregates:** products carry display `rating`/`totalReviews`. Recommended: recompute them from
  **approved** reviews when a review's status changes (and on admin create), so the badge matches the
  visible reviews. (The mock leaves the seeded aggregates static; recomputing is the correct production
  behaviour and won't break the UI.)
- **Customer submission** (`GET /reviews/mine`, `POST /products/{id}/reviews`) exists in the API layer
  with one-review-per-(user,product) + re-submit-⇒-pending semantics, but is **not surfaced by any
  NEBM screen** (file 02 §G). Implement it only if you later add a review-writing UI.

---

## 5. Category referential integrity (no cascade)

`DELETE /admin/categories/{id}` must be **blocked** when the category still has **child categories**
(`parentId === id`) **or** **products** (`categoryId === id`). Do **not** cascade-delete dependents.

- Status: **409 Conflict** (recommended; the frontend surfaces whatever `message` you send).
- Message shape the mock produces (reproduce the spirit): `"Cannot delete this category — N
  subcategor(y/ies) and M product(s) still reference it. Reassign or remove them first."`
- The frontend marks this an **expected** outcome (client code `CATEGORY_IN_USE`), not a logged error.
- A category with no dependents deletes normally → **200** (or **404** if already gone).

This generalises (file 00 §13): **no DELETE cascades** anywhere; enforce integrity by blocking instead.
The `server.js` mock already removes only the addressed row and neutralises json-server's dependent
scan — your Laravel API must match that safety.

---

## 6. Dashboard stats (`GET /admin/dashboard/stats`)

Compute the **8 keys** server-side from live data (mock logic, file 02 §K):

```
totalProducts      = count(products)
totalEnquiries     = count(enquiries)
newEnquiries       = count(enquiries where status = "New")            // missing status ⇒ counts as New
openEnquiries      = count(enquiries where status ∈ {New, Contacted, In Discussion, Quotation Sent})
convertedEnquiries = count(enquiries where status = "Converted")
totalLeads         = count(leads)
totalUsers         = count(users)
lowStockProducts   = count(products where stock ≤ (lowStockThreshold ?? 10))
```

Return exactly these keys (no revenue/orders/returns/coupons fields — those modules are removed).

---

## 7. Settings singleton

`GET /settings` (public) / `GET /admin/settings`. **`PATCH /admin/settings/{section}`** shallow-merges
that section's posted fields and returns the **whole** settings object. Section names: **`store`,
`notifications`, `seo`, `social`** (file 01 §11). There is **no** `shipping` or `payment` section and
**no** `taxRate` — nothing in NEBM reads a tax rate or COD limits, because there is no checkout.

---

## Cascade coverage (every relevant `api.js` behaviour → server responsibility)

| Behaviour | Documented in | Server responsibility |
| --- | --- | --- |
| Enquiry create (`orders.create` → `POST /enquiries`) | §1 | generate `enquiryNumber`, set `status:"New"`, seed `statusHistory`, stamp timestamps |
| `type:"enquiry"` guard (skip payment/coupon/wallet) | §2 | fire **none** of the money side effects |
| Enquiry status update (`updateEnquiry`/`updateEnquiryStatus`) | §3 | set `status`/`adminNotes`, append `statusHistory` (actor from token) |
| Review moderation & admin-authored reviews | §4 | approve/reject/delete; recompute aggregates |
| Category in-use block | §5 | block delete (**409**), no cascade |
| Dashboard stats | §6 | compute the 8 keys server-side |
| Settings section merge | §7 | shallow-merge one section, return the whole object |
| **Removed:** `createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`, `performCancel`, `restockItems`, `restoreCouponByCode`, `voidPaymentForOrder`, `initiateOrderRefund`, `completeOrderRefund`, `failOrderRefund`, `issueRefund`, `reflectReturnRefund`, `creditWallet`, refund ledger, etc. | file 00 §13 | **none** — dormant scaffolding, not invoked by any NEBM path; do not implement |
