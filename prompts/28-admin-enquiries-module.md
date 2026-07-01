# 28 — Admin Enquiries Module (from Orders)

## 1. Objective
Convert the admin **Orders** manager into an **Enquiries** manager for North East Build Mart (NEBM). Create `src/pages/Admin/AdminEnquiries.js` (adapted from `src/pages/Admin/AdminOrders.js`), rewire the route in `src/App.js` (`/admin/orders` → `/admin/enquiries`) and the nav entry in `src/components/AdminLayout/AdminLayout.js` (Orders → Enquiries), and update `AdminLayout`'s notification logic to read **enquiry statuses** instead of `fulfillmentStatus`/legacy `status`. The Enquiries page lists all enquiries, supports search + status filter, opens a detail dialog (products, quantities, customer contact, selected price/price type, user note, enquiry date/time), lets the admin write internal `adminNotes`, and drives the enquiry **status workflow** New → Contacted → In Discussion → Quotation Sent → Converted → Closed → Lost (writing `statusHistory`).

## 2. Context / background
- Business: **North East Build Mart** — an e-commerce-*style* **enquiry** platform for building materials. There are **no** payments, shipping, fulfillment, coupons, refunds, or invoices. `AdminOrders.js` is drenched in all of those (payment/fulfillment/refund state machines, tracking, invoice printing, CSV with money columns) — strip them out.
- Admin panel: **MUI 5 + `src/theme/adminTheme.js`** and `@iconify/react` `mdi:*` icons (palette separate from the storefront). Accent hexes: blue `#1885d8`, gold `#fa9c4c`.
- The `orders` collection is repurposed as the **enquiry store** (the DB collection name / mock route stays `orders`, joined by the API layer; the *UI vocabulary* becomes "Enquiry"). Enquiry data captured on submit (see the storefront submit-enquiry prompt): `name; phone; email (if available); products; quantities; selected price/price type; user note/message; enquiry date/time; enquiry status`. In `db.json` an enquiry keeps `items[]`, `statusHistory[]`, `notes`; NEBM adds `contact{name,phone,email}`, `enquiryNumber`, enquiry `status`, and `adminNotes`. Legacy order rows may still carry `billingAddress`/`orderNumber`/`createdAt` — read defensively.
- **Enquiry statuses (canonical, ordered):** `New · Contacted · In Discussion · Quotation Sent · Converted · Closed · Lost`. Active/open subset (used by the dashboard, prompt 25): `New, Contacted, In Discussion, Quotation Sent`.
- Dual-mode rule (restate): the admin methods branch on `IS_MOCK_API`; mock hits JSON Server, prod hits Laravel; reads shape through `extractData()`. The **safe non-cascading DELETE in `server.js`** stays. The enquiry flow must **NOT** fire the ex-commerce cascades (`createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`) — this page only reads/updates enquiries.

## 3. Files & folders to inspect
- `src/pages/Admin/AdminOrders.js` — source to adapt (copy → strip).
- `src/App.js` — admin route block (`<Route path="orders" element={<AdminOrders />} />`, ~line 84) + the import (~line 50).
- `src/components/AdminLayout/AdminLayout.js` — `menuItems` "Orders" entry (~line 75) and `loadNotifications` (filters `fulfillmentStatus === "unfulfilled"` / `status === "pending"|"processing"`, ~lines 175–194; plus "View All Orders" link ~line 684 and notification icon/type `"order"`).
- `src/services/api.js` — `admin.getOrders` (~1747), `getOrder` (~1776), `updateOrder` (~1792, appends `statusHistory` via optional `event`), `updateOrderStatus` (~1812).
- `prompts/00-analysis-and-requirement-map.md` §3 (orders→enquiries mapping), §5, §6 (Risk Register items 1 & 7).

## 4. Step-by-step implementation instructions
### New page `AdminEnquiries.js`
1. Copy `AdminOrders.js` → `AdminEnquiries.js`, rename the component `AdminEnquiries`. **Delete** all of: `PAYMENT_STATUS`, `REFUND_STATUS`, `REFUND_METHODS`, `COD_REFUND_METHODS`, `isOnlinePayment`, `refundImplication`, `cancelKind`, tracking/recall/refund/cancel dialogs and their state, `handlePrintInvoice`, `handleExportCsv` money columns, "View Returns" button, address editing, and every payment/shipping/fulfillment handler.
2. **Status model** — define:
   ```js
   const ENQUIRY_STATUS = {
     New:              { label: "New",             color: "info" },
     Contacted:        { label: "Contacted",       color: "primary" },
     "In Discussion":  { label: "In Discussion",   color: "secondary" },
     "Quotation Sent": { label: "Quotation Sent",  color: "warning" },
     Converted:        { label: "Converted",       color: "success" },
     Closed:           { label: "Closed",          color: "default" },
     Lost:             { label: "Lost",            color: "error" },
   };
   ```
   Read an enquiry's status as `enq.status || "New"` (legacy rows without `status` render as New).
3. **List/table**: columns Enquiry # (`enquiryNumber || orderNumber`), Customer (`contact?.name || billingAddress?.firstName + …`), Contact (phone/email), Items (`items.length`), Status chip, Date (`createdAt`), Actions (view). Remove Total/Payment/Fulfillment columns and the money `fc` from the table (a rupee helper may remain only for showing a selected price inside the detail dialog).
4. **Search** — match on customer name, phone, email, and enquiry number (`enquiryNumber || orderNumber`). Keep the search box + a status `Select` filter (options = the 7 statuses + "All"). Keep the date-from/date-to filters and the newest/oldest sort; drop total-based sorts.
5. **Status breakdown chips** row: one chip per status showing counts (mirror the existing pattern but over `ENQUIRY_STATUS`).
6. **Detail dialog** — show:
   - **Customer contact**: `contact.name`, `contact.phone`, `contact.email` (fall back to `billingAddress`/`customerEmail`/`customerName` for legacy rows).
   - **Products & quantities**: each `items[]` row → name, SKU, quantity, and the **selected price / price type** (read `item.priceType`/`item.selectedPrice`/`item.price`/`item.unitType` if present; show "On Enquiry" when `priceType === "onEnquiry"`).
   - **User note/message**: the customer's `notes` / message submitted with the enquiry.
   - **Enquiry date/time**: `createdAt` formatted.
   - **Internal `adminNotes`**: a `TextField` the admin edits (separate from the customer note).
   - **Timeline**: reuse the existing `statusHistory` timeline render.
7. **Status workflow controls**: a `Select` (or button group) to set the next status from `ENQUIRY_STATUS`. On change call:
   ```js
   await apiService.admin.updateOrder(enq.id, { status: nextStatus, adminNotes }, { action: `Status → ${nextStatus}`, note: adminNotes || undefined });
   ```
   The optional `event` arg makes `updateOrder` append a `statusHistory` entry (mock reads-and-appends; Laravel sends the event). Also allow "Save notes" without a status change (`updateOrder(id, { adminNotes }, { action: "Notes updated" })`). You MAY keep `updateOrderStatus(id, status)` as a convenience but prefer `updateOrder` so `adminNotes` and the event ride together.
8. **Data load**: keep `loadEnquiries` calling `apiService.admin.getOrders()` (mock GET `/orders`, joined with users). Keep `getOrder` available for a fresh single fetch if needed.

### Route + nav
9. `src/App.js`: replace the import `AdminOrders` → `AdminEnquiries` and the route `<Route path="orders" element={<AdminOrders />} />` → `<Route path="enquiries" element={<AdminEnquiries />} />`. (Optionally add a redirect `<Route path="orders" element={<Navigate to="/admin/enquiries" replace />} />` to catch old bookmarks — `Navigate` is already imported.)
10. `src/components/AdminLayout/AdminLayout.js` `menuItems`: change the "Orders" item to `{ title: "Enquiries", icon: "mdi:clipboard-text-outline", path: "/admin/enquiries" }`. (Section grouping is finalised in prompt 30; here just fix this one entry + path.)

### Notifications
11. In `AdminLayout.loadNotifications`, replace the order filter. New enquiries = statuses in the active set:
    ```js
    const activeEnquiries = orders.filter(o => ["New","Contacted","In Discussion","Quotation Sent"].includes(o.status || "New"));
    ```
    Push notifications with `type: "enquiry"`, title `"New Enquiry"`, message `${o.enquiryNumber || o.orderNumber || o.id} — ${o.contact?.name || o.customerName || "Customer"}`, `status: o.status || "New"`, `link: "/admin/enquiries"`. Update the notification avatar/icon branch that keys off `type === "order"` to key off `type === "enquiry"` (icon `mdi:clipboard-text-outline`), and change the "View All Orders" footer link text/target to "View All Enquiries" → `/admin/enquiries`. Keep the leads notification branch as-is.

## 5. UI/UX requirements
- Reuse the existing MUI table/dialog/chip layout; premium, minimal, `1px solid divider`, rounded `Paper`. No money-heavy chrome.
- Status chips coloured per `ENQUIRY_STATUS`. Page title "Enquiries", subtitle e.g. "Manage customer enquiries and follow-ups".
- Icons (`mdi:*`): nav/notification `mdi:clipboard-text-outline`, view `mdi:eye-outline`, status update `mdi:swap-horizontal`, note `mdi:note-text-outline`. Accent with `#1885d8`/`#fa9c4c` sparingly; other colours from `adminTheme.js`.

## 6. Data & API requirements
- Reads: `apiService.admin.getOrders()` / `getOrder(id)` (mock `/orders`). Writes: `apiService.admin.updateOrder(id, updates, event)` (mock PATCH `/orders/:id`, appends `statusHistory` when `event` given) and optionally `updateOrderStatus(id, status)`. **All `IS_MOCK_API`-branched; reads shaped via `extractData()`. Dual-mode preserved.**
- Enquiry fields used: `enquiryNumber` (fallback `orderNumber`), `status`, `contact{name,phone,email}` (fallback `billingAddress`/`customerName`/`customerEmail`), `items[]` (with optional `priceType`/`selectedPrice`/`unitType`/`quantity`/`sku`/`name`), `notes` (customer message), `adminNotes` (internal), `statusHistory[]`, `createdAt`.
- Status set is the canonical 7. Do NOT read/write payment/shipping/fulfillment/refund/coupon fields. Do NOT trigger `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` — this page never calls `orders.create` or `cancelOrder`.

## 7. Admin panel requirements
- Nav: "Enquiries" replaces "Orders" (`mdi:clipboard-text-outline`, `/admin/enquiries`).
- Notifications poll enquiries by active status (not `fulfillmentStatus`).
- Route `/admin/enquiries` renders `AdminEnquiries`; `/admin/orders` no longer maps to `AdminOrders` (optional redirect to the new path).

## 8. Storefront requirements
N/A here. The customer-facing enquiry submission and history live in other prompts; this page consumes what they write (`contact`, `items`, `notes`, `status`, `enquiryNumber`).

## 9. Acceptance criteria
- [ ] `src/pages/Admin/AdminEnquiries.js` exists; no payment/shipping/refund/coupon/tracking/invoice code remains.
- [ ] `/admin/enquiries` route renders it; the "Orders" import/route is gone (or redirects to `/admin/enquiries`).
- [ ] AdminLayout nav shows **Enquiries** with `mdi:clipboard-text-outline` → `/admin/enquiries`.
- [ ] Table lists enquiries with Enquiry #, Customer, Contact, Items, Status, Date; search matches name/phone/email/number; status filter works.
- [ ] Detail dialog shows products + quantities + selected price/price type, customer contact, user note, enquiry date/time, editable internal `adminNotes`, and the status timeline.
- [ ] Changing status writes `status` and appends a `statusHistory` entry (visible in the timeline and in `http://localhost:3001/orders/:id`).
- [ ] Notifications surface active-status enquiries (New/Contacted/In Discussion/Quotation Sent), not `fulfillmentStatus`; footer link says "View All Enquiries".
- [ ] Dual-mode intact; no payment/coupon/wallet side effects fire; `server.js` DELETE unchanged.
- [ ] App builds; page + notifications load without console errors.

## 10. Testing / verification steps
1. `npm run dev`; log in at `/admin`.
2. Confirm the sidebar shows **Enquiries** (not Orders) and it opens `/admin/enquiries`.
3. Confirm the list renders; use the search box (by phone and by enquiry number) and the status filter.
4. Open an enquiry → change status New → Contacted, add an internal note, save. Reopen and confirm the timeline shows "Status → Contacted" and the note persisted.
5. Check JSON: `http://localhost:3001/orders/:id` → `status:"Contacted"`, appended `statusHistory` entry, `adminNotes` set. Confirm **no** new `payments`/`coupons` rows were created (`http://localhost:3001/payments`, `/coupons` unchanged).
6. Click the bell: a new/active enquiry appears as a "New Enquiry" notification linking to `/admin/enquiries`.
7. Visit the old `/admin/orders` URL — it should not render the old orders screen (either redirects to `/admin/enquiries` or falls through to the login guard, per your choice).

## 11. Notes on preserving existing functionality
- **Dual-mode `IS_MOCK_API` + `extractData()` + JSON-shape fidelity** — use `apiService.admin.getOrders/getOrder/updateOrder/updateOrderStatus`; never bypass with raw fetch.
- **No ex-commerce side effects** — do not call `orders.create`, `cancelOrder`, or anything that fires `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` (Risk Register item 1).
- **Safe non-cascading DELETE** (`server.js`) unchanged.
- **AdminLayout notifications** must read enquiry statuses after this change or notifications silently break (Risk Register item 7) — verify the leads branch still works.
- **Routing + provider nesting** — only swap the Orders route/import; keep the `/admin/*` + `AdminLayout` structure and provider order intact.
- **adminTheme separation** — no storefront tokens/CSS Modules; brand hexes only for accents. Reuse the existing table/dialog/timeline rather than rewriting.
