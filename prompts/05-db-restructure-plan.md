# 05 — Data Model Restructure Plan

## 1. Objective

Plan **and apply** the `db.json` pivot from an e‑commerce schema to the **North East Build Mart (NEBM)** enquiry model: rename/repurpose **`orders` → `enquiries`**, drop all money/payment/shipping fields, add enquiry fields, extend `products` with the flexible pricing model, reshape `categories` (NEBM tree), trim `settings`, keep `leads` as the CRM surface, and decide keep‑empty‑array‑vs‑remove for the retired collections. Every change **preserves dual‑mode fidelity**: `api.js` reads through `extractData()`, and JSON‑Server shapes stay interchangeable with Laravel.

## 2. Context / background

**North East Build Mart** — *"Deals in all kinds of building materials for interior and exterior use."* Lawkhuwa Road, Nagaon, Assam – 782002. Phones +91 86385 43526 · +91 88762 89972. Brand Blue `#1885d8`, Accent Gold/Orange `#fa9c4c`. Site = e‑commerce‑*style* **enquiry** platform: browse → **Enquiry List** → **Submit Enquiry** with a note; **no** purchasing, payment, shipping, coupon, returns, or wallet.

Verified data facts (from `prompts/00-analysis-and-requirement-map.md` §3 and source):
- `db.json` collections/counts: `banners`(3), `users`(3), `admins`(1), `categories`(16), `products`(19), `cart`(0), `orders`(11), `returns`(2), `payments`(9), `refunds`(3), `shipping_methods`(4), `coupons`(5), `reviews`(8), `wishlist`(3), `leads`(4), `settings`(singleton), `walletTransactions`(3), `dealsConfig`(singleton).
- **orders** fields: `id, orderNumber, userId, items[], billingAddress, shippingAddress, subtotal, discountAmount, couponCode, shippingAmount, taxAmount, total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, trackingNumber, trackingUrl, shiprocketOrderId, notes, createdAt, updatedAt, statusHistory[]`. `items[]` = `{productId, variantId, name, image, sku, price, quantity, subtotal}`.
- **products** fields: `id, name, slug, sku, shortDescription, description, categoryId, brand, images[], price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], featured, trending, hot, isActive, rating, totalReviews, metaTitle, metaDescription, createdAt, updatedAt, frequentlyBoughtTogetherIds[], relatedProductIds[]`.
- **categories** fields: `id, name, slug, description, image, parentId, isActive, sortOrder, showInMainMenu, menuOrder, createdAt, updatedAt` (currently generic: Electronics/Clothing/…).
- **leads** fields: `id, type(contact|newsletter), name, email, phone, orderNumber, category, subject, message, status, notes, createdAt, updatedAt`.
- **settings** singleton sections: `store, shipping, payment, notifications, seo, social`.
- **`orders.create` (mock)** seeds `statusHistory` then fires `createPaymentForOrder`, `redeemCouponByCode` (when `couponCode`), and `debitWallet` (when `storeCreditUsed>0`). **The enquiry create path must NOT fire any of these.**
- `extractData()` returns `response.data.data` when `"success" in response.data` (Laravel), else `response.data` (JSON Server) — so both response shapes must stay compatible.
- `server.js` provides a **safe non‑cascading DELETE** (only the addressed row; `getRemovable` neutralised). **Keep it.**

**Risk register item 1 (must respect):** deleting `db.json.payments/refunds/coupons/returns/walletTransactions` must not orphan a code path that still reads them at runtime — **guard the readers or keep empty arrays**.

## 3. Files & folders to inspect

- `db.json` — `orders`, `products`, `categories`, `leads`, `settings`, and the retired collections (`payments`, `returns`, `refunds`, `shipping_methods`, `coupons`, `walletTransactions`, `dealsConfig`).
- `src/services/api.js` — `orders.*` (esp. `create`), the cascade helpers `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet`, `extractData()`, and the `payments`/`shipping`/`coupons`/`returns`/`wallet`/`deals` namespaces (identify runtime readers).
- `src/context/OrderContext.js`, `src/pages/Checkout/Checkout.js`, `src/pages/OrderConfirmation/OrderConfirmation.js`, `src/pages/OrderHistory/OrderHistory.js`, `src/pages/Admin/AdminOrders.js` — consumers of the `orders`/`enquiries` shape.
- `src/utils/categories.js` — helpers that must keep working against the reseeded tree.
- `server.js` — the safe DELETE (do not touch).
- Cross‑reference: `prompts/06` (NEBM category seed), `prompts/02` (enquiry statuses + module map), `prompts/03` (brand), `prompts/04` (settings.store logo/contact).

## 4. Step-by-step implementation instructions

1. **Back up** the current `db.json` (e.g. copy to `db.backup.json` under the scratchpad, not committed) before editing.
2. **`orders` → `enquiries`.** Rename the collection key. For each record: **keep** `items[]` (each `{productId, variantId, name, image, sku, price, quantity}` — you may keep `subtotal` per line as an informational figure but no order‑level money totals), `statusHistory[]`, `notes`. **Drop** `subtotal, discountAmount, couponCode, shippingAmount, taxAmount, total, paymentStatus, paymentMethod, fulfillmentStatus, shippingStatus, trackingNumber, trackingUrl, shiprocketOrderId` and the `billingAddress`/`shippingAddress` money/shipping intent (retain contact essentials via the new `contact` object). **Add** `enquiryNumber` (e.g. `ENQ-YYYYMMDD-NNNN`, migrate from `orderNumber`), `contact { name, phone, email }`, `status` (one of the 7‑value set), and `adminNotes` (admin‑only text). Rewrite `statusHistory[]` entries to enquiry actions (e.g. "Enquiry submitted", "Status changed to Contacted").
3. **Enquiry status set (from `prompts/02`):** `status ∈ { "New", "Contacted", "In Discussion", "Quotation Sent", "Converted", "Closed", "Lost" }`. Seed migrated records with sensible values (new/unworked → `"New"`).
4. **Extend `products`.** Add per product: `priceType: "exact" | "tiered" | "onEnquiry"`; `unitType` (piece/box/sheet/bundle/bag/kg/meter/sq ft…); `minQty` (number); `priceTiers: [{ minQty, price }]` (empty unless tiered); display flags `showExactPrice` (bool), `showTieredPricing` (bool), `cardPriceMode` (how the card summarises price, e.g. "from" / "exact" / "onEnquiry"); and `special` (bool) for the Special Products collection. Keep all existing fields; default `priceType: "exact"`, `showExactPrice: true`, `special: false` where unspecified so nothing breaks.
5. **Reshape `categories`.** Replace the generic tree with the **NEBM tree** (cross‑ref `prompts/06`): WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products · Tiles(→Floor/Wall/Vitrified/Bathroom & Kitchen/Outdoor) · Doors(→Steel/PVC/WPC/Designer/Bathroom) · Hardware(→Door Locks/Handles & Hinges/Fasteners/Cabinet Fittings/Construction Hardware) · Plumbing(→PVC/CPVC/SWR Pipes/Water Tanks/Pipe Fittings & Accessories) · Bath Fittings(→Showers/Faucets & Taps/Wash Basins/Sanitary Ware/Bathroom Accessories) · Cement(→OPC/PPC/Premium Construction) · Steel Rods(→TMT Bars/Construction Steel/High‑Strength Reinforcement). Keep the exact field shape (`id, name, slug, parentId, isActive, sortOrder, showInMainMenu, menuOrder, …`); ensure **unique slugs** and correct `parentId` links so `getCategoryScopeIds` (parent‑includes‑children) and slug URLs keep working. Special Products is a **badged collection** (via the product `special` flag), not a category.
6. **Trim `settings`.** Keep `store`, `seo`, `social`, `notifications`; **drop** the `shipping` and `payment` sections. Reshape `store` to NEBM facts: `name: "North East Build Mart"`, `tagline: "Deals in all kinds of building materials for interior and exterior use."`, address "Lawkhuwa Road, Nagaon, Assam – 782002", phones "+91 86385 43526" / "+91 88762 89972", `logo`/`favicon` set to the Cloudinary assets from `prompts/04`. Keep `currency`/`currencySymbol` (₹) for price display. Remove tax fields tied to purchasing if unused, or leave them inert.
7. **`leads`.** Keep as the CRM surface (contact + newsletter + enquiry‑derived leads). Keep the field shape; the `orderNumber`/`category` fields may now reference an enquiry number. Optionally re‑seed away from purchase language, but preserve the collection.
8. **Decide keep‑empty‑array vs remove for retired collections** (`payments`, `returns`, `refunds`, `shipping_methods`, `coupons`, `walletTransactions`, `dealsConfig`): **Recommended — keep them as empty arrays** (`[]`) / a minimal disabled singleton for `dealsConfig` (`{ "enabled": false }`) rather than deleting the keys outright. This satisfies **risk register item 1**: any residual reader in `api.js`/contexts gets a valid empty shape instead of a 404/undefined at runtime. If a key is removed instead, you **must** guard every runtime reader (return `[]`/`null` safely) first. Do not leave a reader that assumes the collection exists.
9. **Enquiry create path — no side effects.** Ensure the enquiry submit sends a **pure enquiry payload** (contact + items + note + seeded `statusHistory`) and does **not** invoke `createPaymentForOrder`, `redeemCouponByCode`, or `debitWallet`. When the `orders.create` method is repurposed for enquiries (later prompt), strip those three calls; here, verify the data shape it will POST has no `couponCode`/`storeCreditUsed`/payment fields that would re‑trigger them.
10. **Dual‑mode fidelity check.** Confirm the reshaped collections read correctly through `extractData()` in both modes: JSON Server returns raw arrays/objects; Laravel wraps in `{success,data,meta}`. Do not introduce any shape that only works in mock (e.g. relying on JSON Server's implicit `id` autoincrement in a way Laravel can't mirror). Keep `id` present on every record.
11. **Preserve the safe DELETE.** Do not modify `server.js`. Category referential integrity (block delete while children/products reference it) stays an **API‑layer** concern, not a DB cascade.

## 5. UI/UX requirements

N/A (data layer). Downstream UI (PriceBlock tiered table, Enquiry List, Admin Enquiries) consumes these fields in later prompts; ensure the field names here match what those prompts expect (`priceType`, `priceTiers[]`, `unitType`, `special`, `enquiryNumber`, `contact{}`, `status`, `adminNotes`).

## 6. Data & API requirements

- **Dual‑mode rule:** all reads flow through `extractData()`; JSON‑Server and Laravel shapes stay interchangeable. Every record keeps an `id`.
- **`enquiries`** replaces `orders`; fields: `id, enquiryNumber, userId, items[], contact{name,phone,email}, notes, adminNotes, status, statusHistory[], createdAt, updatedAt`.
- **`products`** gains `priceType, unitType, minQty, priceTiers[], showExactPrice, showTieredPricing, cardPriceMode, special` (existing fields intact).
- **`categories`** reseeded to the NEBM tree with unique slugs + correct `parentId`; helper contract (`categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories`) unchanged.
- **`settings`** loses `shipping`/`payment`; `store` reshaped to NEBM.
- **Retired collections** kept as empty arrays (recommended) or removed only with guarded readers (risk register item 1).
- **Enquiry create must NOT fire** `createPaymentForOrder` / `redeemCouponByCode` / `debitWallet`.

## 7. Admin panel requirements

Admin → **Enquiries** (renamed from Orders) consumes the new `enquiries` shape: list/search/filter by `status` (7 values), detail (products/qty/`contact`/`notes`), `adminNotes`, and `statusHistory[]`. The `AdminLayout` notification poll and `getDashboardStats` must be reshaped (later prompts) to read enquiry statuses instead of `fulfillmentStatus`/legacy purchase fields — ensure the field names align. Admin Payments/Shipping/Coupons/Returns/Special‑Offers are retired; their (now empty) collections must not break the remaining admin pages.

## 8. Storefront requirements

Customer **Enquiries** (repurposed OrderHistory) and the enquiry success screen read `enquiryNumber`, `items[]`, `status`, `contact{}`, `notes`. The Enquiry List (repurposed cart) and PriceBlock read the new product pricing fields (`priceType`, `priceTiers[]`, `unitType`, display flags). No storefront surface should read the dropped money/payment/shipping fields.

## 9. Acceptance criteria

- [ ] `db.json` has an `enquiries` collection (no `orders`); each record has `enquiryNumber`, `contact{name,phone,email}`, `status` (∈ the 7 values), `adminNotes`, and retains `items[]`, `statusHistory[]`, `notes`.
- [ ] No enquiry record contains `subtotal/discountAmount/couponCode/shippingAmount/taxAmount/total/paymentStatus/paymentMethod/fulfillmentStatus/shippingStatus/tracking*/shiprocketOrderId`.
- [ ] Every product has `priceType`, `unitType`, `minQty`, `priceTiers[]`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`, `special` (existing fields intact).
- [ ] `categories` is the NEBM tree with unique slugs + correct `parentId`; `categories.js` helpers still resolve category scope + slugs.
- [ ] `settings` has no `shipping`/`payment` sections; `store` shows NEBM name/tagline/address/phones and the Cloudinary logo/favicon.
- [ ] Retired collections are present as empty arrays (or removed with all readers guarded); no runtime 404/undefined from a removed collection.
- [ ] The enquiry create payload cannot trigger `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet`.
- [ ] `server.js` safe non‑cascading DELETE is unchanged.
- [ ] Both dual‑modes still parse via `extractData()`; every record has an `id`.

## 10. Testing / verification steps

1. `npm run dev`. Check JSON Server: open `http://localhost:3001/enquiries` (returns the migrated records with `enquiryNumber`/`contact`/`status`), `http://localhost:3001/products` (19 products with the new pricing fields), `http://localhost:3001/categories` (NEBM tree), `http://localhost:3001/settings` (no shipping/payment; NEBM store).
2. Confirm retired endpoints respond with `[]` (recommended): `http://localhost:3001/payments`, `/returns`, `/refunds`, `/shipping_methods`, `/coupons`, `/walletTransactions`.
3. Storefront: category deep‑links (`/products?category=<slug>`) and a parent category (should include its children via `getCategoryScopeIds`) still list products; a product detail resolves by slug.
4. Submit a test enquiry (once the flow is wired) and confirm a new `enquiries` row appears with `status: "New"` and **no** new `payments`/`coupons`/`walletTransactions` rows were created.
5. Admin → Enquiries lists the records and filters by the 7 statuses; the app does not white‑screen from any removed collection.
6. Delete a category via admin/API and confirm only that row is removed (safe DELETE), and that the API layer blocks deleting a category still referenced by children/products.

## 11. Notes on preserving existing functionality

Do **not**:
- Break **dual‑mode fidelity** — keep JSON‑Server/Laravel shapes interchangeable through `extractData()`; never hardcode a mock‑only shape; keep `id` on every record.
- Fire **payment/coupon/wallet side effects** from the enquiry flow (`createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` must stay dormant).
- Modify **`server.js`** — keep the safe non‑cascading DELETE; category referential integrity stays in the API layer.
- Break **slug/category rules** — unique slugs, correct `parentId`, parent‑includes‑children (`getCategoryScopeIds`); keep `categories.js` helpers working.
- Orphan a **runtime reader** of a removed collection — keep empty arrays or guard the reader (risk register item 1).
- Touch **auth** or surface `users[].password`; keep the `users`/`wishlist`/`reviews`/`banners` collections working.
- Rewrite from scratch — migrate the existing records in place, preserving `id`s and `createdAt` where sensible.
