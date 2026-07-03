# 29 — Admin Leads (CRM)

## 1. Objective

Align the admin **Leads** manager (`src/pages/Admin/AdminLeads.js`) to North East Build Mart (NEBM) as a lightweight CRM. It must list/search/filter `leads` (types `contact` and `newsletter`), open a detail view, let the admin update **status** and internal **notes**, and delete a lead — all through `apiService.admin.getLeads / getLead / updateLead / deleteLead`. Contact-form submissions from the storefront (prompt 23) land in this collection and surface here.

## 2. Context / background

- Business: **North East Build Mart** — deals in all kinds of building materials for interior and exterior use. Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phones: +91 86385 43526 · +91 88762 89972. Admin uses **MUI 5 + `src/theme/adminTheme.js`** + `@iconify/react` `mdi:*` icons (palette separate from the storefront). Accent hexes: blue `#1885d8`, gold `#fa9c4c`.
- **`leads` schema** (`db.json`, 4 seed rows): `id, type (contact|newsletter), name, email, phone, subject, message, status, notes, createdAt, updatedAt`. Some legacy rows also carry `orderNumber`/`category` — NEBM is an enquiry platform with no orders in the storefront, so **do not surface an "Order Number" field or an order/payment/delivery category** in the NEBM UI; treat those as optional legacy metadata only.
- **Statuses**: contact leads use `new · contacted · resolved · spam`; newsletter leads use `subscribed · unsubscribed`. Keep these two status sets segmented by `type` (the status `Select` in the detail dialog must show the right set for the lead's type).
- **Where leads come from**: the storefront **contact form** (prompt 23) calls `apiService.leads.createContact` / `createContactLead` (type `contact`) and the **newsletter** signup calls `createNewsletter` / `createNewsletterLead` (type `newsletter`). Both write into `leads`. This admin page is the CRM surface for them. `AdminLayout` notifications already flag `leads` with `status === "new"` — keep that working.
- The existing `AdminLeads.js` is largely correct already; this prompt is an **alignment/trim**, not a rewrite: remove ecommerce-flavoured bits (the `getCategoryIcon` order/payment/delivery mapping, phone-less contact assumptions) and make sure `phone` is displayed.
- Dual-mode rule (restate): `apiService.admin.getLeads/getLead/updateLead/deleteLead` branch on `IS_MOCK_API` (mock = JSON Server `/leads`; prod = Laravel `/admin/leads`); reads shape through `extractData()`. Keep the JSON shape identical both ways. The **safe non-cascading DELETE in `server.js`** stays.

## 3. Files & folders to inspect

- `src/pages/Admin/AdminLeads.js` — the page to align (table, filters, stats, detail dialog).
- `src/services/api.js` — `admin.getLeads` (~2359), `getLead` (~2370), `updateLead` (~2381, PATCH `/leads/:id`), `deleteLead` (~2395); and the storefront `leads.createContact*/createNewsletter*` producers.
- `src/components/AdminLayout/AdminLayout.js` — leads notification branch (`lead.status === "new"`), keep intact.
- `prompts/00-analysis-and-requirement-map.md` §3 (leads schema), §5.
- `prompts/23-*.md` (storefront contact/newsletter forms) — the producers feeding this page (cross-reference, do not assume chat memory).

## 4. Step-by-step implementation instructions

1. **Data load**: keep `loadLeads` → `apiService.admin.getLeads()`, sorted by `createdAt` desc. Keep `getLead(id)` available if a fresh single fetch is wanted before opening the dialog (optional).
2. **Search**: keep matching on `name`, `email`, `subject`, `message`; **add `phone`** to the search predicate so the admin can find a lead by phone number.
3. **Filters**: keep the `type` filter (All / Contact / Newsletter) and the `status` filter. Ensure the status filter options cover both sets: `new, contacted, resolved, spam, subscribed, unsubscribed` (+ "All").
4. **Stats cards**: keep Total Leads / Contact Requests / Newsletter Subs / New (unread). These are enquiry-safe; just verify the counts read from `leads`.
5. **Table**: columns Type, Contact (avatar + name + email), Subject/Category, Date, Status, Actions. In the Contact cell, **also render `lead.phone`** (small caption under the email) when present. For newsletter leads keep the "Newsletter Subscription" label. Keep the row highlight for `status === "new"`.
6. **Remove ecommerce residue**:
   - Delete `getCategoryIcon` and the order/payment/delivery/technical category icon mapping; if a `category` value exists, render it as a plain outlined chip (no order-centric iconography) or omit it.
   - In the detail dialog, drop the **Order Number** row (or gate it behind a generic "Reference" label only if a value exists) — NEBM has no storefront orders.
7. **Detail dialog**: keep Contact Information (name, email, **phone**, date, last updated), Request Details (subject; optional reference), Message (contact type), and the **Update Lead** block: a status `Select` scoped to the lead's type (`contactStatuses` vs `newsletterStatuses`) plus a **Notes** `TextField` for internal notes.
8. **Update**: keep `handleUpdateLead` → `apiService.admin.updateLead(id, { status, notes })`, updating local state on success with `updatedAt`. Keep the success toast.
9. **Delete**: keep `handleDeleteLead` → `apiService.admin.deleteLead(id)` behind a SweetAlert confirm; remove from local state on success.
10. Verify the page still renders when a lead is missing optional fields (`name`, `subject`, `message`, `phone`) — all reads must be null-safe (they largely are already).

## 5. UI/UX requirements

- Keep the existing premium/minimal MUI layout: stat cards, filter bar, paginated table, detail dialog. `1px solid divider`, rounded `Paper`, generous spacing.
- Icons (`mdi:*`): contact `mdi:message-text`, newsletter `mdi:email-newsletter`, view `mdi:eye`, delete `mdi:delete-outline`, phone caption `mdi:phone-outline`, search `mdi:magnify`, refresh `mdi:refresh`.
- Status chip colours: `new`→info, `contacted`→warning, `resolved`/`subscribed`→success, `unsubscribed`→default, `spam`→error (keep `getStatusColor`).
- Accent with brand blue `#1885d8` / gold `#fa9c4c` sparingly; read other colours from `adminTheme.js`. No storefront tokens/CSS Modules.

## 6. Data & API requirements

- Reads: `apiService.admin.getLeads()` (mock GET `/leads`) / `getLead(id)`. Writes: `updateLead(id, { status, notes })` (mock PATCH `/leads/:id`, stamps `updatedAt`), `deleteLead(id)` (mock DELETE `/leads/:id`). **All `IS_MOCK_API`-branched; reads via `extractData()`. Dual-mode preserved.**
- `leads` fields used: `type, name, email, phone, subject, message, status, notes, createdAt, updatedAt` (+ optional legacy `category`). Do NOT introduce order/payment fields.
- Status sets: contact → `new|contacted|resolved|spam`; newsletter → `subscribed|unsubscribed`. `AdminLayout` counts `status === "new"` for notifications — keep that field meaningful.

## 7. Admin panel requirements

- Leads stays in the nav (finalised in prompt 30's grouping) at `/admin/leads` with icon `mdi:message-text-outline`.
- The page must not reference removed modules (orders/payments/shipping) in copy or icons.

## 8. Storefront requirements

N/A here. This page consumes what the storefront contact form (prompt 23, `leads.createContact*`) and newsletter signup (`leads.createNewsletter*`) write.

## 9. Acceptance criteria

- [ ] Leads list loads, sorted newest first; search matches name/email/phone/subject/message.
- [ ] Type filter (contact/newsletter) and status filter (both status sets) work.
- [ ] Contact cell and detail dialog display `phone` when present.
- [ ] Detail dialog updates `status` (type-scoped options) and internal `notes` via `updateLead`; success toast + local state update.
- [ ] Delete removes a lead via `deleteLead` after confirm.
- [ ] No order/payment/delivery category icons or Order-Number field remain in the NEBM UI.
- [ ] `AdminLayout` leads notifications (`status === "new"`) still fire.
- [ ] Dual-mode intact; `server.js` DELETE unchanged; page is null-safe for missing fields.
- [ ] App builds; page loads without console errors.

## 10. Testing / verification steps

1. `npm run dev`; log in at `/admin` → `/admin/leads`.
2. Confirm the four stat cards and the table populate from `http://localhost:3001/leads`.
3. Search by a phone number and by name; toggle the type and status filters.
4. (If prompt 23 is in) Submit the storefront contact form; refresh Leads and confirm a new `type:"contact"`, `status:"new"` row appears (also visible at `http://localhost:3001/leads`).
5. Open a contact lead → set status `new → contacted`, add notes, save. Confirm the toast and that `http://localhost:3001/leads/:id` shows the new `status`/`notes`/`updatedAt`.
6. Delete a test lead → confirm it disappears from the list and JSON.
7. Click the admin bell — a `new` lead should appear as a notification linking to `/admin/leads`.

## 11. Notes on preserving existing functionality

- **Dual-mode `IS_MOCK_API` + `extractData()` + JSON-shape fidelity** — use `apiService.admin.getLeads/getLead/updateLead/deleteLead`; never bypass.
- **AdminLayout notifications** rely on `leads[].status === "new"` — keep the field and the "new" default from the storefront producers.
- **Safe non-cascading DELETE** (`server.js`) unchanged; delete only the addressed lead row.
- **adminTheme separation** — no storefront CSS Modules/tokens; brand hexes only for accents.
- **Auth/token interceptors**, **routing**, and **provider nesting** untouched.
- Keep the two status sets segmented by `type`; keep pagination, stats, and the animated table rows. This is an alignment — reuse, don't rewrite.
