# 02 — Requirement Mapping: E-commerce → Enquiry

## 1. Objective

Turn the high‑level e‑commerce→enquiry transformation into an **actionable, itemised specification** that later prompts consume as a checklist. Produce, per module, an explicit **KEEP / RENAME / REPURPOSE / EXTEND / REMOVE** decision with the target enquiry behaviour, the canonical **terminology map**, and the **enquiry status set**. This is an **analysis/spec prompt** — the deliverable is the mapping checklist; **no application code, `db.json`, docs or config are modified here.**

## 2. Context / background

**North East Build Mart (NEBM)** — *"Deals in all kinds of building materials for interior and exterior use."* Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phones: +91 86385 43526 · +91 88762 89972. Brand: Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c`. The site is an e‑commerce‑*style* **enquiry** platform: users browse, add products to an **Enquiry List**, and **Submit an Enquiry** with a note — there is **no purchasing, payment, shipping, coupon or returns** path.

This builds on `prompts/00-analysis-and-requirement-map.md` (§5 feature map, §6 risk register) and the re‑grounding in `prompts/01-codebase-analysis.md`. The base repo is `ecommerce-boilerplate` (React 18 + MUI 5 + JSON Server, dual‑mode API in `src/services/api.js`). **Prime directive:** *analyze → reuse → refactor → rename → redesign → extend*; never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

## 3. Files & folders to inspect

- `prompts/00-analysis-and-requirement-map.md` (source map) and `prompts/01-codebase-analysis.md`.
- `src/App.js` (routes + provider nesting), `src/components/AdminLayout/AdminLayout.js` (`menuItems`, notification polling).
- Storefront term surfaces: `src/components/Header/Header.js`, `src/components/CartDrawer/CartDrawer.js`, `src/components/SidebarMenu/SidebarMenu.js`, `src/components/BottomNav/BottomNav.js`, `src/context/CartContext.js`, `src/hooks/useCart.js`, `src/components/storefront/AddToCartBar.js`, `src/components/storefront/PriceBlock.js`, `src/components/storefront/ProductCard.js`, `src/pages/ProductDetails/ProductDetails.js`, `src/pages/Checkout/Checkout.js`, `src/pages/OrderConfirmation/OrderConfirmation.js`, `src/pages/OrderHistory/OrderHistory.js`.
- Admin term surfaces: `src/pages/Admin/AdminOrders.js`, `AdminDashboard.js`, and the pages NEBM removes (`AdminReturns.js`, `AdminPayments.js`, `AdminCoupons.js`, `AdminShipping.js`, `AdminSpecialOffers.js`).
- `src/services/api.js` (`orders`, `cart`, `coupons`, `payments`, `shipping`, `returns`, `wallet`, `leads` namespaces + `orders.create` side effects) and `db.json` (`orders`, `products`, `categories`, `leads`, `settings` shapes).

## 4. Step-by-step implementation instructions

1. **Adopt the terminology map** (§5 below) as the single source of user‑facing renames. Every later storefront prompt must apply it and remove any surviving purchase term.
2. **Walk each module** and assign exactly one action (KEEP / RENAME / REPURPOSE / EXTEND / REMOVE) with a one‑line target behaviour — captured in the module table (§ "Module‑by‑module KEEP/RENAME/REPURPOSE/EXTEND/REMOVE").
3. **Enumerate the enquiry statuses** (§ statuses) as the canonical set for the `enquiries.status` field, Admin filters, and notification logic.
4. **Record the removal strategy**: admin Returns/Payments/Coupons/Shipping/Special‑Offers lose their **routes** (`App.js`), **nav entries** (`AdminLayout.menuItems`) and **page files**; the mock cascade helpers in `api.js` stay but go **dormant** (the enquiry create path must not invoke them); `getDashboardStats` fields and `AdminLayout` notification filters that reference removed modules are reshaped to enquiry statuses.
5. **Output the checklist.** Persist the mapping as this prompt's deliverable so prompts `03`–`35` can tick items off. Do not edit application code.

## 5. UI/UX requirements — Terminology map (storefront)

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

**Users CAN:** browse home/categories/listings/details; search/filter/sort; view featured & special products; add to Enquiry List & manage quantities; submit an enquiry with a note/message; register/login; use wishlist & account. **Users CANNOT:** place orders, pay, checkout‑to‑buy, use shipping, apply coupons, request returns. Product details has **no "Buy Now"**. Aesthetic: premium, minimal, Apple‑style; Blue `#1885d8` primary, Gold/Orange `#fa9c4c` sparingly.

## 6. Data & API requirements

Restate the **dual‑mode rule**: keep `IS_MOCK_API` branching, shape responses via `extractData()`, keep JSON‑shape fidelity so the same UI works against JSON Server and Laravel. Key data decisions this map fixes (implemented in `prompts/05-db-restructure-plan.md`):

- `orders` → **`enquiries`**: keep `items[]`, `statusHistory[]`, `notes`; drop money/payment/shipping fields; add `enquiryNumber`, `contact{name,phone,email}`, `status` (7‑value set), `adminNotes`.
- **Enquiry create path must NOT fire** `createPaymentForOrder`, `redeemCouponByCode`, or `debitWallet` (the three side effects `orders.create` currently triggers in mock mode).
- `products` → **EXTEND** with `priceType ("exact"|"tiered"|"onEnquiry")`, `unitType`, `minQty`, `priceTiers[{minQty,price}]`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`, `special`.
- `categories` → **REPURPOSE (data)** to the NEBM tree (cross‑ref `prompts/06`), **KEEP** the `categories.js` helpers and slug rules.
- `payments/returns/refunds/shipping_methods/coupons/walletTransactions/dealsConfig` → retire; keep empty arrays or remove while guarding any runtime reader (risk register item 1).

## 7. Admin panel requirements

Target admin surface:
- **KEEP:** Dashboard · Products · Categories · Reviews · **Enquiries** (renamed from Orders) · Users · Leads · Settings.
- **REMOVE/HIDE:** Returns · Payments · Coupons · Special Offers · Shipping — remove routes (`App.js`), nav entries (`AdminLayout.menuItems`), page files; neutralise `getDashboardStats` fields + `AdminLayout` notification logic that reference them, without breaking the shared API layer.
- **Enquiry captured on submit:** name; phone; email (if available); products; quantities; selected price/price type; user note/message; enquiry date/time; enquiry status.

## 8. Storefront requirements

Storefront module decisions live in the module table (§ below). Highlights: Cart→**Enquiry List** (multi‑product + quantities, **no totals/payment**); Checkout→**Submit Enquiry / Enquiry Summary** (note + captured contact, no payment/shipping/coupon); OrderConfirmation→**Enquiry success** with reference; OrderHistory→customer **Enquiries**; Wishlist/Profile/Reviews KEEP (re‑skin); **Buy Now** removed everywhere; **Special Products** = badged curated collection (homepage highlight + `special` flag), not an exclusive category.

### Enquiry statuses (canonical set for `enquiries.status`)

**New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost**

Used by: the `enquiries.status` field, Admin → Enquiries list filters, the enquiry detail status control + `statusHistory[]`, and the reshaped `AdminLayout` notification filter (e.g. surface `status === "New"` instead of `fulfillmentStatus === "unfulfilled"`).

### Module‑by‑module KEEP / RENAME / REPURPOSE / EXTEND / REMOVE

| Area / file(s) | Action | Target enquiry behaviour |
|---|---|---|
| Dual‑mode API (`api.js`, `baseURL.js`) | **KEEP** | Crown jewel — `IS_MOCK_API` + `extractData()` preserved everywhere. |
| Safe DELETE (`server.js`) | **KEEP** | Non‑cascading; never revert. |
| Auth (`AuthContext`, `authStorage`, `auth`/`admin.login`) | **KEEP** | Register/login/account preserved; never leak `password`. |
| Theme (`colors.js`, `tokens.js`, `storefront-tokens.css`, `adminTheme.js`) | **EXTEND / RE‑SKIN** | Blue `#1885d8` + Gold `#fa9c4c`; keep token architecture + palette separation (prompt 03). |
| Logo / favicon / meta (`public/*`, `index.html`, `manifest.json`) | **EXTEND** | NEBM Cloudinary logo/icon, title, meta (prompt 04). |
| `categories` + `categories.js` | **REPURPOSE (data) / KEEP (helpers)** | Seed NEBM tree; slug + parent‑includes‑children rules unchanged (prompt 06). |
| `products` + admin form + `PriceBlock` | **EXTEND** | Add tiered/exact/on‑enquiry pricing, `unitType`, `special`. |
| Cart (`CartContext`, `useCart`, `CartDrawer`, `QuantityStepper`) | **RENAME / REPURPOSE** | **Enquiry List** — multi‑product + quantities, **no totals/payment**; keep localStorage key `"cart"` + login‑merge/logout‑clear. |
| Checkout + `OrderContext` + `orders.create` | **REPURPOSE** | **Submit Enquiry / Enquiry Summary** with note + contact; **no** payment/shipping/coupon; must **not** fire payment/coupon/wallet side effects. |
| `OrderConfirmation` | **RENAME** | **Enquiry success** screen with an enquiry reference. |
| `orders` + `AdminOrders` | **REPURPOSE → `enquiries` / Admin "Enquiries"** | List/search/filter, detail (products/qty/customer/note), admin notes, 7‑status workflow. |
| `OrderHistory` | **REPURPOSE** | Customer sees their **enquiries**, not orders. |
| Wishlist (`Wishlist`, `WishlistContext`) | **KEEP** | Re‑skin only. |
| Profile / account (`Profile`) | **KEEP** | Re‑skin; history = enquiries. |
| Reviews (`AdminReviews`, `ReviewsSection`, `reviews`) | **KEEP** | Re‑skin. |
| Users (`AdminUsers`) | **KEEP** | Re‑skin. |
| Leads (`AdminLeads`, `leads`) | **REPURPOSE / EXTEND** | CRM for contact + enquiry‑derived leads. |
| Settings (`AdminSettings`, `settings`) | **EXTEND / TRIM** | store/contact/SEO/social; drop shipping/payment sections. |
| **Buy Now** everywhere | **REMOVE** | No purchase path. |
| Payments (`AdminPayments`, `payments`/`refunds`) | **REMOVE / RETIRE** | Retire route/nav/page; cascade helpers dormant. |
| Shipping (`AdminShipping`, `shipping_methods`, shiprocket) | **REMOVE / RETIRE** | Same. |
| Coupons (`AdminCoupons`, `coupons`) | **REMOVE / RETIRE** | Same. |
| Returns (`AdminReturns`, `returns`/`refunds`) | **REMOVE / RETIRE** | Same. |
| Special Offers admin (`AdminSpecialOffers`, `dealsConfig`) | **REMOVE (admin)** / repurpose storefront **Special Products** | Badged Special Products collection replaces deal merchandising. |
| Wallet (`wallet`, `walletTransactions`, store credit) | **REMOVE / RETIRE** | No money movement. |
| Policy pages (`RefundPolicy`, `Privacy`, `Terms`, `Cookie`) | **KEEP / RE‑WORD** | Re‑word away from purchase/returns where needed. |
| Docs (7 `.md`) | **REWRITE** | Reflect NEBM + enquiry model + new schema/API. |

## 9. Acceptance criteria

- [ ] The terminology map (Cart→Enquiry List; Add to Cart→Add to Enquiry List icon+tooltip; Buy Now→removed; Checkout→Submit Enquiry/"Enquiry Summary"; Order→Enquiry; admin Orders→Enquiries; Payment/Shipping/Coupon→removed) is captured verbatim.
- [ ] Every module has exactly one action (KEEP/RENAME/REPURPOSE/EXTEND/REMOVE) with a target behaviour.
- [ ] The 7 enquiry statuses (New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost) are listed as the canonical set.
- [ ] The removal strategy (routes/nav/pages removed; cascade helpers dormant; dashboard/notification filters reshaped) is documented.
- [ ] The dual‑mode rule and the "enquiry create must not fire payment/coupon/wallet side effects" constraint are restated.
- [ ] **No** application code, `db.json`, docs or config were modified.

## 10. Testing / verification steps

1. `git status` shows changes only under `prompts/` (the mapping deliverable) — nothing in `src/`, `db.json`, `public/` or config.
2. Cross‑check the map against source: `AdminLayout.menuItems` still lists Orders/Returns/Payments/Coupons/Special Offers/Shipping (to be removed later); `orders.create` in `api.js` still calls `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` (to go dormant later). This confirms the map targets the real current state.
3. Optional smoke run: `npm run dev`; confirm the storefront still shows "Cart"/"Buy Now"/"Checkout" today so the rename scope is exactly as mapped.

## 11. Notes on preserving existing functionality

Spec‑only prompt. Do **not** change code. When later prompts execute this map, they must preserve:
- **Dual‑mode API** (`IS_MOCK_API` + `extractData()` + JSON‑shape fidelity) — renames never bypass it.
- **Auth** (register/login/account, token interceptors; never leak `users[].password`).
- **Routing + provider nesting** order (`Theme→Auth→Admin→Wishlist→Cart→Order`, storefront in `DealsConfigProvider`) — renaming Cart→Enquiry or Order contexts keeps the same provider position.
- **Slug** product URLs + `?category=<slug>` + parent‑includes‑children (`getCategoryScopeIds`).
- **Safe non‑cascading DELETE** (`server.js`).
- **CartContext localStorage key `"cart"`** + login‑merge/logout‑clear.
- **No** payment/coupon/wallet side effect from the enquiry flow.
- Reuse/refactor rather than rewrite.
