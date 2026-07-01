# 25 — Admin Dashboard Cleanup

## 1. Objective
Reshape the admin **Dashboard** for North East Build Mart (NEBM), an e-commerce-*style* **enquiry** platform (no purchases/payments). The current dashboard is a store-sales cockpit: revenue, pending returns, active coupons. NEBM has none of those. Rebuild `src/pages/Admin/AdminDashboard.js` and the mock branch of `apiService.admin.getDashboardStats` in `src/services/api.js` so the KPIs describe an **enquiry + lead** operation, and **stop reading** the `/returns` and `/coupons` collections entirely.

New KPI set (7 cards): **Total Products · Total Enquiries · New/Open Enquiries · Converted Enquiries · Total Leads · Total Users · Low-Stock Products**.

## 2. Context / background
- Business: **North East Build Mart** — deals in all kinds of building materials for interior and exterior use. Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phones: +91 86385 43526 · +91 88762 89972.
- The admin panel uses **MUI 5 + `src/theme/adminTheme.js`** (a palette intentionally separate from the storefront) and **`@iconify/react`** `mdi:*` icons. Do NOT import storefront CSS Modules or storefront tokens here. Brand hexes when a branded accent is wanted: primary blue `#1885d8`, accent gold/orange `#fa9c4c` — use sparingly for card icons/accents.
- Orders are being repurposed into **Enquiries** (prompt 28). The `orders` collection becomes the enquiry store; each enquiry carries an enquiry `status` from: **New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost**. Prompt 28 renames the route `/admin/orders` → `/admin/enquiries`; this dashboard must navigate to `/admin/enquiries`.
- Prompt 30 removes the Returns/Payments/Coupons/Special Offers/Shipping admin modules. This prompt is the dashboard half of that removal: it kills every widget and every stat field that references revenue, payments, returns, or coupons.
- Dual-mode rule (restate): every `apiService` method branches on `IS_MOCK_API` (from `baseURL.js`). Mock = JSON Server at `http://localhost:3001`; production = Laravel. Responses flow through `extractData()`. The Laravel branch of `getDashboardStats` must return the **same JSON shape** as the new mock branch so the same UI works against both. See `prompts/00-analysis-and-requirement-map.md` §2 and the Risk Register item 7.

## 3. Files & folders to inspect
- `src/pages/Admin/AdminDashboard.js` — the page to rebuild.
- `src/services/api.js` — `apiService.admin.getDashboardStats` (mock branch ~line 1579), `getOrders` (~1747), `getProducts` (~1614), `getLeads` (~2359).
- `src/components/AdminLayout/AdminLayout.js` — sibling notification logic (prompt 28 handles it; keep parallel status vocabulary).
- `prompts/00-analysis-and-requirement-map.md` §2 (`getDashboardStats` shape), §5, §6.

## 4. Step-by-step implementation instructions
1. **Rewrite the mock branch of `getDashboardStats`** in `src/services/api.js`:
   - Remove `api.get("/returns")` and `api.get("/coupons")` from the `Promise.all`. Fetch only `/products`, `/orders`, `/users`, `/leads`.
   - Compute enquiry-centric stats (treat the `orders` rows as enquiries; read the enquiry `status` field, falling back to legacy fields so the dashboard survives before the prompt-28 data migration):
     - `newEnquiries` = orders where `status` is `"New"` (fallback: `fulfillmentStatus === "unfulfilled"` or missing status).
     - `openEnquiries` = orders whose `status` is in the active set `["New","Contacted","In Discussion","Quotation Sent"]`.
     - `convertedEnquiries` = orders where `status === "Converted"`.
     - `lowStockProducts` = products where `stock <= (lowStockThreshold || 10)`.
   - Return exactly:
     ```js
     {
       totalProducts: products.data.length,
       totalEnquiries: orders.data.length,
       newEnquiries,
       openEnquiries,
       convertedEnquiries,
       totalLeads: leads.data.length,
       totalUsers: users.data.length,
       lowStockProducts,
     }
     ```
   - **Delete** `totalRevenue`, `totalOrders`, `pendingOrders`, `pendingReturns`, `activeCoupons` from the return object.
   - Keep the Laravel branch (`api.get("/admin/dashboard/stats")` → `extractData(response)`) but add a one-line comment that the server must return the same 8 keys above.
2. **Rebuild `AdminDashboard.js` state**: change the initial `stats` object to the 8 new keys (all `0`). Remove `FULFILLMENT_STATUS`/`PAYMENT_STATUS` maps and the `fc` currency helper (no money on this page).
3. **`loadDashboardData`**: `Promise.all([getDashboardStats(), getOrders(), getProducts()])`. Rename `recentOrders`→`recentEnquiries` (sort by `createdAt` desc, take 5). Keep the low-stock list derived from products.
4. **Primary stat cards** (`StatCard`): render 7 cards — Total Products, Total Enquiries, New/Open Enquiries (subtitle e.g. `${openEnquiries} open`), Converted Enquiries, Total Leads, Total Users, Low-Stock Products. Each card's `onClick` navigates to a **surviving** route only: `/admin/products`, `/admin/enquiries`, `/admin/leads`, `/admin/users`. Remove any `navigate("/admin/payments" | "/admin/returns" | "/admin/coupons" | "/admin/shipping")`.
5. **Remove the entire Secondary Stats row** (Pending Orders / Pending Returns / Low Stock / Active Coupons) — its Returns and Coupons tiles are dead. Fold Low-Stock into the primary cards.
6. **Recent Enquiries table**: replace the "Recent Orders" table. Columns: Enquiry #, Customer, Items, Status, Date. Drop the Total, Payment, and Fulfillment columns. Row status renders a `Chip` labelled with the enquiry `status`. Rows and the "View All" button navigate to `/admin/enquiries`.
7. **Low Stock Alert card**: keep as-is (products with `stock <= lowStockThreshold`); it is enquiry-safe.
8. **Quick Actions**: keep only Add Product (`/admin/products`), View Enquiries (`/admin/enquiries`), Add Category (`/admin/categories`), View Leads (`/admin/leads`). **Remove** Create Coupon, Shipping Setup, View Returns.
9. Update the page subtitle from "Here's your store overview." to something enquiry-appropriate, e.g. "Here's your enquiry overview."

## 5. UI/UX requirements
- Keep the existing `StatCard` component and MUI layout language; premium, minimal, generous whitespace, soft borders (`1px solid divider`), rounded `Paper` cards — no new colour noise.
- Icons (`@iconify/react` `mdi:*`): Total Products `mdi:package-variant`, Total Enquiries `mdi:clipboard-text-outline`, New/Open Enquiries `mdi:email-alert-outline`, Converted `mdi:check-decagram-outline`, Total Leads `mdi:account-voice`, Total Users `mdi:account-group-outline`, Low-Stock `mdi:alert-circle-outline`.
- Where an accent colour is wanted on a card icon, use brand blue `#1885d8` or gold `#fa9c4c`; keep the palette restrained. Do NOT introduce a `mdi:currency-inr` icon anywhere.
- Respect `adminTheme.js` — read colours via theme tokens (`divider`, `text.secondary`, `primary.main`) except the two brand hexes above.

## 6. Data & API requirements
- `getDashboardStats` (mock) returns the 8 keys in §4.1; the Laravel branch returns the identical shape via `extractData()`. **Dual-mode preserved.**
- The dashboard must NOT call, directly or indirectly, `apiService.admin.getReturns`, `getPayments`, `getCoupons`, `getShippingMethods`, or `getDealsConfig`. It reads only `getDashboardStats`, `getOrders`, `getProducts`.
- Enquiry status vocabulary (canonical): `New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost`. Active/open subset: `New, Contacted, In Discussion, Quotation Sent`.
- `db.json` fields read: products (`stock`, `lowStockThreshold`, `name`, `sku`, `images`), orders/enquiries (`status`, `createdAt`, `items`, contact name), users (count), leads (count).

## 7. Admin panel requirements
This whole prompt is admin-side. After this change the Dashboard must render with zero references to money, returns, or coupons and must link only to surviving admin routes.

## 8. Storefront requirements
N/A.

## 9. Acceptance criteria
- [ ] `getDashboardStats` (mock) no longer requests `/returns` or `/coupons`; it returns exactly `totalProducts, totalEnquiries, newEnquiries, openEnquiries, convertedEnquiries, totalLeads, totalUsers, lowStockProducts`.
- [ ] The Dashboard renders 7 KPI cards matching those fields (no Revenue card, no `₹`).
- [ ] No dashboard element navigates to `/admin/payments`, `/admin/returns`, `/admin/coupons`, or `/admin/shipping`.
- [ ] "Recent Enquiries" table shows Enquiry #, Customer, Items, Status, Date (no Total/Payment/Fulfillment columns) and links to `/admin/enquiries`.
- [ ] Quick Actions contains only Add Product, View Enquiries, Add Category, View Leads.
- [ ] Enquiry status chips use the New→Lost vocabulary.
- [ ] Dual-mode intact: Laravel branch returns the same 8-key shape via `extractData()`.
- [ ] App builds and the Dashboard loads without console errors.

## 10. Testing / verification steps
1. Run `npm run dev` (CRA :3000 + JSON Server :3001).
2. Log in at `/admin`, land on `/admin/dashboard`.
3. Confirm 7 KPI cards, no revenue/returns/coupons widgets, no `₹` symbol.
4. Open DevTools → Network; reload the dashboard and confirm there are **no** requests to `http://localhost:3001/returns` or `/coupons`. Requests to `/products`, `/orders`, `/users`, `/leads` are expected.
5. Click each KPI card and Quick Action; confirm they route only to products/enquiries/leads/users (no 404 / removed route).
6. Inspect the raw stats at the source data: `http://localhost:3001/orders` and `/leads` counts should match the Total Enquiries / Total Leads cards.

## 11. Notes on preserving existing functionality
- **Dual-mode `IS_MOCK_API` + `extractData()` + JSON-shape fidelity** — keep both branches of `getDashboardStats`; return the identical 8-key object from each.
- **Do not** delete the `getReturns/getPayments/getCoupons` methods from `api.js` (prompt 30 leaves them dormant); this prompt only stops the *dashboard* from calling them.
- **Routing** — link only to routes that still exist after prompt 30 (`/admin/dashboard|products|categories|enquiries|reviews|users|leads|settings`).
- **adminTheme separation** — no storefront tokens/CSS Modules; read colours from the admin MUI theme plus the two brand hexes.
- **Safe non-cascading DELETE** (`server.js`), **auth/token interceptors**, and **provider nesting** are untouched by this prompt — do not modify them.
- Preserve the low-stock computation and the `StatCard`/skeleton-loading UX; reuse, don't rewrite.
