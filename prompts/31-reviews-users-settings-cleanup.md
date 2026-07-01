# 31 — Reviews, Users & Settings Alignment

## 1. Objective
Re-skin and re-word three admin modules that **stay** in North East Build Mart (NEBM) — **Reviews**, **Users**, and **Settings** — so they match the enquiry model and the NEBM brand, and **trim the Settings singleton** to only the sections NEBM needs. Concretely:
- `src/pages/Admin/AdminReviews.js` — keep the moderation workflow, re-skin only.
- `src/pages/Admin/AdminUsers.js` — keep account management; the per-user "Recent Orders" panel becomes "Recent Enquiries"; **never surface `password`**.
- `src/pages/Admin/AdminSettings.js` + the `settings` singleton in `db.json` — reshape `store` to NEBM contact facts; keep `seo`, `social`, `notifications`; **drop the `shipping` and `payment` sections/tabs entirely**.

This is a low-risk alignment prompt: no data model is invented here beyond trimming `settings`. Do **not** touch the dual-mode API layer's method signatures.

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform (no cart/checkout/payment/shipping in the storefront) built by refactoring a React + JSON Server e-commerce boilerplate. See `prompts/00-analysis-and-requirement-map.md` for the full feature→enquiry map. The admin panel KEEPS: Dashboard · Products · Categories · Reviews · **Enquiries** (renamed from Orders) · Users · Leads · Settings; and REMOVES: Returns · Payments · Coupons · Special Offers · Shipping (handled in earlier prompts). This prompt only concerns the three kept modules named above.

Brand facts to embed:
- **Business:** North East Build Mart. **Tagline:** "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002.
- **Phone:** +91 86385 43526 · +91 88762 89972. **Currency:** ₹ / INR.
- **Primary Blue** `#1885d8`, **Accent Gold** `#fa9c4c` (used sparingly). Apple-style minimalism.
- Admin uses MUI + `src/theme/adminTheme.js` (a palette **separate** from the storefront CSS-Module tokens). Do not import storefront tokens into the admin.

Dual-mode rule (restate wherever data is touched): every `api.js` method branches on `IS_MOCK_API` (`src/services/baseURL.js`) — mock = JSON Server `http://localhost:3001`, prod = Laravel. Responses always flow through `extractData()` so the same UI works against both. Keep JSON shapes interchangeable; never hardcode a shape that only works in mock.

## 3. Files & folders to inspect
- `src/pages/Admin/AdminReviews.js` — reviews table + moderation + admin-authored review dialog.
- `src/pages/Admin/AdminUsers.js` — users table + detail dialog (currently loads `getOrders({ userId })`).
- `src/pages/Admin/AdminSettings.js` — two tabs today (General incl. Currency & Tax + COD; Categories redirect).
- `db.json` → `settings` singleton (line ~3344): keys `store`, `shipping`, `payment`, `notifications`, `seo`, `social`.
- `src/services/api.js` → `apiService.admin.getReviews / createReview / updateReview / deleteReview`, `getUsers / getUser / updateUser`, `getSettings` (~line 2403) / `updateSettings(section, data)` (~line 2414); storefront `settings.get` (~line 1454).
- `src/theme/adminTheme.js`, `src/theme/colors.js` — where blue/gold land in the MUI layer (set by an earlier theme prompt; consume, don't redefine here).
- `src/utils/helpers.js` → `formatCurrency`.

## 4. Step-by-step implementation instructions
1. **AdminReviews.js — re-skin only.** Keep the whole workflow: `apiService.admin.getReviews`, `updateReview(id, { status })`, `deleteReview(id)`, `createReview(...)`. Status config stays `pending / approved / rejected`. Change nothing about the API calls. Replace the `MOCK_REVIEWERS` list of names with NEBM-appropriate Assam/India names if desired (cosmetic). Ensure the `Add Review` button and the pending-count `Chip` use the admin theme's primary (blue) — do not hardcode indigo. Keep the `<Rating>`, verified chip, and detail dialog. The date formatter already uses `en-IN` — keep it.
2. **AdminUsers.js — re-skin + re-word the enquiries panel.**
   - Keep `getUsers`, `updateUser(id, { isActive })`, and the search/filter/detail structure.
   - **Rename the "Recent Orders" section to "Recent Enquiries."** Replace the `apiService.admin.getOrders({ userId: user.id })` call with `apiService.admin.getEnquiries({ userId: user.id })` (the enquiries API introduced when `orders`→`enquiries`; if that method name differs in this repo, use whatever the enquiries namespace exposes — do **not** re-introduce `getOrders`). Keep the same loading/error/empty three-state logic (`ordersLoading`/`ordersError` → rename to `enquiriesLoading`/`enquiriesError`).
   - In each enquiry row: show `#{enquiry.enquiryNumber}`, `formatDate(enquiry.createdAt)`, `{enquiry.items?.length || 0} items`, and the enquiry `status` chip. **Remove the money** (`formatCurrency(order.total)` and the "Total spent" summary line) — enquiries have no monetary total. Replace "Total spent" with nothing, or a neutral "Total enquiries: N".
   - Keep the error copy pattern but re-word: "Couldn't load this user's enquiries."
   - **Password hygiene:** confirm the component never reads `user.password` (it doesn't today). Do not add it to any state, dialog, log, or export. Keep it that way.
3. **AdminSettings.js — trim to NEBM sections.**
   - **Remove the Cash on Delivery (COD) card** and all `paymentForm` state, `handlePaymentChange`, and the second `updateSettings("payment", …)` write. Payments are gone from NEBM.
   - **Remove the "Currency & Tax" card's tax controls** if a purely-enquiry store has no checkout tax (recommended: drop `taxRate` / `taxIncluded` — there is no order subtotal to tax). Keep the **Currency** selector + symbol (used by `formatCurrency` and price display across the app), defaulting to **INR / ₹**.
   - Reshape the **Store Information** card to NEBM: prefill `name = "North East Build Mart"`, `tagline = "Deals in all kinds of building materials for interior and exterior use."`, `address = "Lawkhuwa Road, Nagaon, Assam – 782002"`, and **support two phone numbers** (`+91 86385 43526`, `+91 88762 89972`). Either keep a single `phone` string with both numbers, or extend to `phone` + `phoneAlt` — pick one and mirror it in `db.json` (§6).
   - Add **SEO** and **Social** cards/tabs backed by `settings.seo` and `settings.social` (fields already exist in the singleton). Add a **Notifications** card backed by `settings.notifications` **minus** the shipping/order-email fields that no longer apply (keep `adminEmail`, `lowStockAlert`, `lowStockEmail`, `adminNewOrderEmail` → re-label as "New enquiry email").
   - Update the sub-header copy: replace "Store configuration that powers your storefront and checkout" with "Store configuration that powers your storefront and enquiries."
   - Keep the **Categories** redirect tab (points at `/admin/categories`) — it's still valid.
4. **Persist correctly via `updateSettings(section, data)`.** Save `store`, then `seo`, `social`, `notifications` as separate section writes (the mock branch PATCHes the nested settings object; the sequential re-read behaviour is already handled). **Delete** the `updateSettings("payment", …)` call.
5. **Do not change `api.js` method signatures.** `getSettings()` / `updateSettings(section, data)` stay as-is; you simply stop calling the removed sections.

## 5. UI/UX requirements
- Admin MUI theme only: primary Blue `#1885d8`, accent Gold `#fa9c4c` for highlights/badges (used sparingly). No hardcoded `#667eea`/indigo left in these three files.
- Keep the Apple-minimal admin look: `elevation={0}` cards with `1px` divider borders, generous spacing, `size="small"` inputs, `en-IN` dates, ₹ currency.
- Reviews: pending rows keep a subtle gold/amber tint; verified = success chip.
- Settings: card icons via `@iconify/react` `mdi:*` (`mdi:store`, `mdi:web`/`mdi:magnify` for SEO, `mdi:share-variant` for Social, `mdi:bell-outline` for Notifications). Remove `mdi:cash-fast`/`mdi:cash-multiple` COD/tax iconography.
- Save button shows a `CircularProgress` while `saving`; success/error via the existing `Snackbar`/`Alert`.

## 6. Data & API requirements
- **`settings` singleton reshape (db.json).** This is the only `db.json` change in this prompt (and it is done via an earlier data-seeding prompt / the admin UI, not by this file writer — but document the target shape here):
  - `store`: `{ name: "North East Build Mart", tagline: "Deals in all kinds of building materials for interior and exterior use.", email: <nebm email>, phone: "+91 86385 43526", phoneAlt: "+91 88762 89972", address: "Lawkhuwa Road, Nagaon, Assam – 782002", currency: "INR", currencySymbol: "₹", logo, favicon }` — **drop** `taxRate`, `taxIncluded`, `timezone` (or keep timezone if used elsewhere).
  - `seo`: `{ metaTitle, metaDescription, googleAnalyticsId, facebookPixelId }` — re-word defaults to NEBM.
  - `social`: `{ facebook, instagram, twitter, youtube, whatsapp }` — keep.
  - `notifications`: keep `{ adminNewOrderEmail (re-label "new enquiry"), adminEmail, lowStockAlert, lowStockEmail }`; drop `orderConfirmationEmail`, `shippingUpdateEmail`.
  - **Remove the `shipping` and `payment` keys** from the singleton.
- **API methods (unchanged signatures):** `apiService.admin.getSettings()` returns the full singleton; `apiService.admin.updateSettings(section, data)` writes one section. Reviews: `getReviews()`, `updateReview(id, patch)`, `deleteReview(id)`, `createReview(body)`. Users: `getUsers()`, `getUser(id)`, `updateUser(id, patch)`. Enquiries panel: use the enquiries namespace method (e.g. `getEnquiries({ userId })`), **not** `getOrders`.
- **Dual-mode / `extractData()`:** every call above already branches on `IS_MOCK_API` and returns through `extractData()`. Keep JSON-shape fidelity so the same three pages work identically against JSON Server (:3001) and Laravel. Never leak `users[].password` into React state, `localStorage`, or logs.

## 7. Admin panel requirements
- Reviews, Users, Settings remain in `AdminLayout.menuItems` (Catalogue → Reviews; Operations → Users, Settings). No nav changes here beyond what the removal prompts already did.
- Settings tabs after trim: **General** (Store Info + Currency), **SEO**, **Social**, **Notifications**, **Categories** (redirect). No **Shipping** or **Payment/COD** tab or card anywhere.
- Users detail dialog shows enquiries, no money totals, no order/payment vocabulary.

## 8. Storefront requirements
N/A for the admin pages. Note only: the storefront `settings.get` reads the same singleton — after the reshape, the footer/contact surfaces should read `store.phone`/`store.phoneAlt`/`store.address` (handled where the footer is built). Do not break `settings.get`.

## 9. Acceptance criteria
- [ ] `AdminReviews.js` unchanged in behaviour (get/update/delete/create still work); styled in blue/gold; no indigo hardcodes.
- [ ] `AdminUsers.js` detail dialog reads **enquiries** (not orders); shows enquiry number, date, item count, status; **no money** rendered.
- [ ] No code path in these three files reads, stores, or logs `user.password`.
- [ ] `AdminSettings.js` has **no** Shipping and **no** Payment/COD controls; `updateSettings("payment", …)` and `updateSettings("shipping", …)` are never called.
- [ ] Settings Store Info shows NEBM name/tagline/address and both phone numbers; currency defaults to INR/₹.
- [ ] Settings exposes SEO, Social, Notifications sections backed by the singleton keys.
- [ ] `db.json.settings` no longer contains `shipping` or `payment` keys (verified via the JSON Server check below).
- [ ] `npm run build` is clean; no unused-import/lint errors from removed COD state.

## 10. Testing / verification steps
1. Run `npm run dev` (CRA :3000 + JSON Server :3001). Log into `/admin`.
2. **Reviews:** open `/admin/reviews`; approve/reject/delete a review; add a review — confirm it appears on the storefront product page. Confirm colours are blue/gold.
3. **Users:** open `/admin/users`; open a user detail — confirm the panel title reads "Recent Enquiries", shows enquiry numbers/statuses, and shows **no ₹ totals**. Toggle active/inactive.
4. **Settings:** open `/admin/settings`; confirm no COD/Payment/Shipping controls; edit Store Info (both phones), SEO, Social, Notifications; Save; confirm the Snackbar success and that values reload.
5. **JSON Server data checks:** open `http://localhost:3001/settings` — confirm `store` has NEBM values + both phones, and that **`shipping` and `payment` keys are absent**; confirm `seo/social/notifications` persist your edits. Open `http://localhost:3001/reviews` to confirm status changes persisted.
6. **Dual-mode smoke:** set `REACT_APP_USE_MOCK_API=false` (with a stub `REACT_APP_API_URL`) and confirm the three pages compile and call the Laravel branch through `extractData()` (no mock-only shape assumptions). Revert to `true`.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode** `IS_MOCK_API` branching + `extractData()` + JSON-shape fidelity for `getSettings`/`updateSettings`, reviews, and users methods — keep signatures identical.
- **Auth** (admin token via `sessionStorage.adminToken`, request interceptor) — these pages sit behind `AdminLayout`'s guard.
- **Password hygiene** — never surface `users[].password`.
- **Category manager** integrity — the Settings→Categories redirect must keep pointing at `/admin/categories`; do not add a competing category editor here.
- **Storefront `settings.get`** and the footer/contact reads that depend on `store` fields — keep the keys the footer expects.
- **Safe non-cascading DELETE** (`server.js`) — unaffected; do not change delete behaviour.
- **Admin vs storefront palette separation** — style these pages via the MUI admin theme only; never import `storefront-tokens.css` values here.
- Reuse/refactor the existing components; do not rewrite these pages from scratch.
