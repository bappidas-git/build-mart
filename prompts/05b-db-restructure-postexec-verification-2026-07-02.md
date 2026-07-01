# 05b — Prompt-05 DB Restructure Post-execution Verification (2026-07-02)

> **Prompt-05 execution deliverable — the e-commerce→enquiry data pivot is applied to `db.json` and verified against the plan's own §9 acceptance list and §11 KEEP invariants.** Prompt-05 asked to *plan **and** apply* the schema pivot: rename `orders`→`enquiries` (drop every money/payment/shipping field, add `enquiryNumber`/`contact`/`status`/`adminNotes`), extend `products` with the NEBM pricing model, reseed `categories` to the NEBM tree, trim `settings`, keep `leads`, and neutralise the retired collections to empty arrays. Bottom line: **all 41 acceptance assertions pass, the real `categories.js` helpers resolve against the reseeded tree (parent-includes-children, main menu, slug + legacy-id URLs), every retired-collection runtime reader degrades safely to `[]` / a disabled singleton (risk register item 1), and the enquiry records carry no field that could re-trigger `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet`.** One **by-design transitional state** — the `api.js` `orders.*` namespace, `admin.getOrders`/`getDashboardStats`, and the order-consuming pages still address `/orders`, which 404s in mock until later prompts repoint them to `/enquiries` — is recorded in §5 with exact coordinates and the prompts that own each fix. This note **closes `04c §5.5`'s db.json `settings.store` residue carry-forward.**
>
> **Data-layer only.** Only `db.json` was modified (plus this note under `prompts/`). No `src/`, `server.js`, `public/`, root docs or config were touched. `db.json` was backed up to the scratchpad (`db.backup.json`, 107684 bytes) before editing, per §4.1.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Migrate records **in place** (ids/`createdAt` preserved); never break dual-mode fidelity, auth, slug/category rules or the safe non-cascading DELETE.

---

## 1. Method — apply, then verify against the plan's own acceptance list

The pivot was applied by a single deterministic Node transform (read → transform → `JSON.stringify(…, null, 2)`), not by hand-editing 3473 lines, so every record is reshaped uniformly and `id`/`createdAt` are provably preserved. Verification is **three independent passes** over the *written* `db.json`: (a) a 41-assertion script covering every Prompt-05 §9 bullet plus product→category referential integrity; (b) an ESM harness that imports the **unmodified** `src/utils/categories.js` and exercises the real `getCategoryScopeIds`/`getMainMenuCategories`/`resolveCategory`/`orderCategoriesHierarchically` against the new tree; (c) a targeted side-effect-guard check (§4.9). All three are green. File key order was preserved and `orders` was swapped to `enquiries` **in place** (between `cart` and `returns`) so the diff stays legible.

---

## 2. The six transforms — reproduced at source

| # | Transform | Before | After (written `db.json`) | ✓ |
|---|---|---|---|---|
| 1 | `orders` → `enquiries` | 11 orders, e-commerce shape | key renamed in place; 11 records, each `{id, enquiryNumber, userId, items[], contact{name,phone,email}, notes, adminNotes, status, statusHistory[], createdAt, updatedAt}` | ✅ |
| 2 | Drop order money/payment/shipping | `subtotal…total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, tracking*, shiprocketOrderId, billing/shippingAddress, orderNumber` | **0 occurrences** on any enquiry record **or line item** (line `subtotal` also dropped) | ✅ |
| 3 | Add enquiry fields | — | `enquiryNumber` = `ENQ-YYYYMMDD-NNNN` (from `createdAt`+id); `contact` from billingAddress + user-email join; `status` ∈ 7-set; `adminNotes`; `statusHistory[]` rewritten to "Enquiry submitted" / "Status changed to …" | ✅ |
| 4 | Extend `products` | 19 products, no pricing model | all 19 gain `priceType`/`unitType`/`minQty`/`priceTiers[]`/`showExactPrice`/`showTieredPricing`/`cardPriceMode`/`special`; existing fields intact; `categoryId` remapped onto a valid NEBM leaf | ✅ |
| 5 | Reseed `categories` | 16 generic (Electronics/Clothing/Test…) | 43 NEBM: 12 top-level (ids 1–12, `sortOrder=menuOrder=1..12`, `showInMainMenu:true`) + 31 subcategories (ids 13–43, `showInMainMenu:false`), unique slugs, correct `parentId` | ✅ |
| 6 | Trim `settings` | `store/shipping/payment/notifications/seo/social`, store="My E-Commerce Store" | `store/notifications/seo/social` (no `shipping`/`payment`); store = NEBM name/tagline/address/**both** phones/Cloudinary logo+favicon; purchasing `taxRate`/`taxIncluded` dropped | ✅ |

Retired collections `returns`/`payments`/`refunds`/`shipping_methods`/`coupons`/`walletTransactions` → `[]`; `dealsConfig` → `{ "enabled": false }`. `leads`(4)/`users`(3)/`reviews`(8)/`wishlist`(3)/`banners`(3)/`admins`(1)/`cart`([]) preserved untouched.

---

## 3. Prompt-05 §9 acceptance — verified against the written file

Every §9 bullet, with how it was checked (all **PASS**):

- **`enquiries` exists, no `orders`; each record has `enquiryNumber`/`contact{name,phone,email}`/`status`(7-set)/`adminNotes` and retains `items[]`/`statusHistory[]`/`notes`** — structural assertion over all 11. Statuses seeded to span **all seven** values (New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost) so the admin filter has a full test surface.
- **No enquiry carries `subtotal/discount/coupon/shipping/tax/total/paymentStatus/paymentMethod/fulfillmentStatus/shippingStatus/tracking*/shiprocketOrderId`** — field-presence sweep across records **and** line items = 0 hits.
- **Every product has all 8 pricing fields (existing fields intact)** — 19/19; `priceType` ∈ {exact, tiered, onEnquiry} all present; tiered products have ascending `priceTiers` with tier-1 `price === price` (keeps `getProductMinPrice` correct); 11 `special`, 10 `featured`.
- **`categories` is the NEBM tree, unique slugs, correct `parentId`; `categories.js` helpers still resolve scope + slugs** — see §4 (real-helper harness).
- **`settings` has no `shipping`/`payment`; `store` shows NEBM name/tagline/address/phones + Cloudinary logo/favicon** — asserted on the written object.
- **Retired collections present as empty arrays; no removed-collection 404/undefined** — see §4 (reader guard).
- **Enquiry create payload cannot trigger the 3 cascades** — see §4.9 check below.
- **`server.js` safe non-cascading DELETE unchanged** — `server.js` absent from the change set (only `db.json` modified).
- **Both dual-modes parse via `extractData()`; every record has `id`** — every collection record has a non-null `id`; the seed is flat arrays/singletons with no mock-only nesting, so `extractData()` ([api.js:67](src/services/api.js)) returns the same shape whether the payload is a raw array (JSON Server) or `{success,data}` (Laravel).

---

## 4. Risk register item 1 — every retired-collection reader degrades safely

Retired keys were kept as empty arrays (not deleted), so no runtime reader hits a 404/undefined. Confirmed each reader tolerates the empty shape:

| Reader | Endpoint | Empty-shape behaviour |
|---|---|---|
| `shipping.getMethods` [api.js:1442](src/services/api.js) · `admin.getShippingMethods` [:2169](src/services/api.js) | `/shipping_methods` | `[]` → no methods listed |
| `deals.getConfig` [api.js:1477](src/services/api.js) · `admin.getDealsConfig` [:2436](src/services/api.js) | `/dealsConfig` | `{enabled:false}` → nav "Today's Deals" hidden; **singleton chosen over `[]` so the `.enabled` read stays valid** |
| `coupons.getActive`/`validate` [api.js:1360](src/services/api.js) · `admin.getCoupons` [:2216](src/services/api.js) | `/coupons` | `[]` → no active coupons; `validate` → "Invalid coupon code" |
| `returns.*` [api.js:1325](src/services/api.js) · `admin.getReturns` [:1968](src/services/api.js) | `/returns` | `[]` |
| `admin.getPayments` [api.js:2088](src/services/api.js) · `getRefunds` [:2114](src/services/api.js) | `/payments`, `/refunds` | `[]` |
| `wallet.getBalance`/`getTransactions` [api.js:1250](src/services/api.js) | `/walletTransactions` | balance sums to `0`; history `[]` |

**§4.9 side-effect guard (data shape).** `orders.create` fires `createPaymentForOrder` (always), `redeemCouponByCode` (only if `orderData.couponCode`), and `debitWallet` (only if `saved.storeCreditUsed > 0`) ([api.js:1157–1169](src/services/api.js)). No enquiry record carries `couponCode`, `storeCreditUsed`, or any payment field (verified = 0), so a payload derived from the enquiry shape cannot re-trigger the coupon/wallet cascades; and with `coupons`/`walletTransactions` now empty, both are no-ops even if called. The **removal of the three calls themselves** is a later-prompt code change (§4.9 says so); this prompt satisfies the *data-shape* half.

---

## 5. Findings — one by-design transitional state, and scope notes

### 5.1 — TRANSITIONAL (by design of the prompt sequence): `api.js` + order pages still address `/orders`

Prompt-05 renames the **collection** but explicitly defers the **code** repoint to later prompts (§4.9: "When `orders.create` is repurposed for enquiries (later prompt)…"; §7: "`getDashboardStats` must be reshaped (later prompts)"). Until those land, in **mock mode** the following read `/orders`, which no longer exists → 404:

- `admin.getDashboardStats` [api.js:1582](src/services/api.js) (the `/orders` GET has **no** `.catch`, so the dashboard tile query rejects) — owner: **Prompt-25** (admin dashboard cleanup).
- `admin.getOrders`/`getOrder`/`updateOrder`/`cancelOrder` [api.js:1747–1840](src/services/api.js) and the `orders.*` storefront namespace [:1138–1242](src/services/api.js) — owner: **Prompt-28** (admin enquiries module) + the storefront enquiry-flow prompts (**16–20**).
- Consuming pages `Checkout.js`, `OrderConfirmation.js`, `OrderHistory.js`, `AdminOrders.js` — repurposed by the same later prompts.

This is the intended migration path (DB first, code after), not a regression introduced here — recorded so a later note doesn't mistake it for un-swept Prompt-05 work. The **enquiries data is already correct and browsable** at `/enquiries`; only the not-yet-repointed callers 404. The app's non-order surfaces (catalogue, categories, product detail, wishlist, reviews, auth) are unaffected.

### 5.2 — CLOSED: `04c §5.5`'s db.json `settings.store` residue

`04c §5.5` carried forward `settings.store` `name "My E-Commerce Store"` / `email hello@mystore.com` / `metaTitle` as "→ Prompt-05/06". **Closed here:** `store.name` = "North East Build Mart", `email` = `info@northeastbuildmart.com`, `seo.metaTitle`/`metaDescription` re-authored to NEBM building-materials copy, and `logo`/`favicon` now point at the Prompt-04 Cloudinary assets (`logo_fnscna.png` / `icon_bvsukn.png`).

### 5.3 — SCOPE NOTE: product **names** stay generic; only the schema pivots

Per §11 ("migrate in place, don't rewrite from scratch") this prompt reshapes the product *schema* and remaps `categoryId` onto valid NEBM leaves, but keeps the boilerplate product **content** (e.g. "ProBook Ultra Laptop" now sits under WPC Louvers; `unitType` values are placeholders). This is a deliberate transient — **Prompt-06** fully re-seeds `products` with realistic NEBM items under the same tree. The invariant that matters now — no orphan `categoryId`, none pointing at a parent-with-children or at Special Products — holds.

### 5.4 — NUANCE: `users[].storeCredit` cache vs. empty ledger

`walletTransactions` is now `[]`, so `computeWalletBalance` returns `0`, but the denormalised `users[].storeCredit` cache still shows old non-zero values (e.g. user 3 = 2918). Harmless — the wallet feature is retired and `getBalance` reads the (empty) ledger, not the cache. `users` was intentionally left untouched (§11: keep `users` working, never surface `password`).

---

## 6. What this closes

`05b` closes the before→after loop on the **data-model pivot** — the schema foundation every downstream NEBM prompt builds on. The written `db.json` (a) applies all six transforms at source (§2), (b) passes every §9 acceptance assertion plus product→category referential integrity and the **real** `categories.js` helper contract (§3), (c) satisfies risk register item 1 — all six retired-collection readers degrade to `[]`/disabled-singleton and the enquiry shape can't re-trigger the payment/coupon/wallet cascades (§4), and (d) **closes `04c §5.5`** (settings.store residue, §5.2). It hands forward **one by-design transitional state** — the `/orders`-addressing callers 404 in mock until Prompts 25/28/16–20 repoint them to `/enquiries` (§5.1) — and **two scope notes** (generic product content → Prompt-06 re-seed; `storeCredit` cache cosmetic, §5.3–5.4). `server.js`, auth, the slug/category rules and dual-mode fidelity were never in the blast radius.

---

*Post-execution verification complete against the live `db.json` (2026-07-02). Backup at scratchpad `db.backup.json`. 41/41 acceptance assertions pass; the unmodified `src/utils/categories.js` helpers resolve `getCategoryScopeIds(5)={5,13,14,15,16,17}`, `getMainMenuCategories`=12 tops in order, `resolveCategory('floor-tiles')`→id 13, legacy `?category=5`→tiles; every retired-collection reader degrades safely; the enquiry payload carries no `couponCode`/`storeCreditUsed`/payment field. Only `db.json` and this note were modified. `04c §5.5` is closed; the `/orders`→`/enquiries` code repoint is deferred to Prompts 25/28/16–20 by Prompt-05's own §4.9/§7.*
