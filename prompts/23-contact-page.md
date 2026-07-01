# 23 — Contact Page

## 1. Objective
Repurpose `src/pages/Support/Support.js` (with `HelpCenter` re-worded as needed) into a **Contact page** for North East Build Mart (NEBM) that surfaces the address and **both** phone numbers, an optional map embed, and a contact form that posts via `apiService.leads.createContact` (writing a `leads` row of `type: "contact"`). Handle success and failure states. Keep dual-mode `IS_MOCK_API` / `extractData()`. Submissions surface in **Admin → Leads** (prompt 29).

## 2. Context / background
NEBM is an enquiry platform; the "Support" page becomes a plain **Contact** page (no order-tracking, refund, or shipping topics). Visitors reach the business by phone/address or by sending a message, which lands in the Leads/CRM surface.

Brand facts to embed **verbatim**:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`

See `prompts/00-analysis-and-requirement-map.md` §2 (`leads.createContact`) and §5 (Leads repurposed as CRM). Admin Leads is prompt 29; the Footer (prompt 24) and About (prompt 22) also carry the contact facts.

The current `Support.js` already posts to `apiService.leads.createContact(formData)` and has a success card. It imports `SUPPORT_EMAIL`/`SUPPORT_PHONE` (generic) and offers order-centric categories ("Order Related", "Shipping & Delivery", "Returns & Refunds", "Payment Issues"). Replace the identity/copy/categories with NEBM contact content; keep the working lead-submission plumbing.

## 3. Files & folders to inspect
- `src/pages/Support/Support.js` + `Support.module.css` — the page to repurpose into Contact.
- `src/pages/HelpCenter/HelpCenter.js` + `HelpCenter.module.css` — re-word away from shipping/returns/coupons; its FAQ can stay but must not reference removed features. (Optional in this prompt; primary work is the Contact page.)
- `src/services/api.js` — `leads.createContact` (~1494): mock POSTs to `/leads` with `type: "contact"`, `status: "new"`, timestamps, `notes: ""`; Laravel POSTs `/leads/contact`; both return via `extractData()`/`response.data`.
- `src/utils/helpers.js` — `isEmailValid`, `isValidPhone`.
- `src/utils/constants.js` — `SUPPORT_EMAIL`/`SUPPORT_PHONE`/`SUPPORT_ADDRESS` (generic; override with NEBM facts).
- `src/App.js` — route `/support` (line ~120); keep it or add `/contact`.

## 4. Step-by-step implementation instructions
1. **Re-identify the page.** Heading "Contact Support" → **"Contact Us"**; subtext → "We're here to help — reach us by phone, visit us, or send a message.". Rename the component to `Contact` if you like (keep default export; update `src/App.js` atomically). Keep the route `/support` working (it is linked from Footer/About); optionally also register `/contact` pointing at the same component.
2. **Contact info cards** (left column) — replace the generic values with NEBM facts:
   - **Visit Us** — `Lawkhuwa Road, Nagaon, Assam – 782002`.
   - **Call Us** — **two** entries/links: `+91 86385 43526` and `+91 88762 89972`, each a `tel:` link (strip spaces for the href).
   - Optionally **Email Us** if NEBM has an address; otherwise omit the email card rather than showing a fake one.
   - Remove "Live Chat / Available 24/7" unless real.
   - Replace the order/refund "Quick Links" with enquiry-appropriate ones: "Browse Products" (`/products`), "My Enquiries" (`/orders`), "About Us" (`/about`).
3. **Optional map embed.** Add a lightweight, responsive Google Maps `<iframe>` (lazy-loaded) centered on Nagaon, Assam / the Lawkhuwa Road area, with a rounded, bordered container matching the card style. Keep it optional and non-blocking (wrap so a blocked iframe doesn't break layout); include `title` for accessibility. Do not add API keys.
4. **Contact form** — keep the working form but trim the categories to NEBM-relevant options: `General Enquiry`, `Product Enquiry`, `Bulk / Project Requirement`, `Feedback`, `Other`. Remove `Order Related`, `Shipping & Delivery`, `Returns & Refunds`, `Payment Issues`. Remove the "Order Number" field (there are no orders). Keep fields: Name (required), Email (required, valid), Phone (optional, valid if present), Category, Subject (required), Message (required, min length). Keep prefill of email from the logged-in `user`.
5. **Submit** via `await apiService.leads.createContact(formData)`. On success show the success card reworded: "Message Sent! Thank you for reaching out — the NEBM team will get back to you soon." with a "Send Another" reset. On failure set `errors.submit` = "Failed to send. Please try again." (keep the existing try/catch/finally + `isSubmitting` states).
6. **Re-token styles** to Blue `#1885d8` / Gold `#fa9c4c`; confirm the dark variant.
7. **(Optional) HelpCenter cleanup.** If touched, remove/re-word topics referencing Shipping, Returns & Refunds, Payments, Coupons/Deals, and point "Contact" affordances at `/support` (Contact). Do not leave links to removed routes (`/refund`, `/special-offers`) if those pages are being retired by other prompts — guard or re-point them.

## 5. UI/UX requirements
- Premium, minimal, Apple-style: two-column layout (info + map on the left, form on the right) collapsing to one column on mobile. Primary Blue `#1885d8` for the submit button, focus rings, and headings; Gold `#fa9c4c` for icon accents/badges, sparingly.
- Both phone numbers clearly presented and tappable; address readable.
- Map embed rounded, bordered, responsive, lazy-loaded, with an accessible `title`.
- Inline validation with `.error` spans; disabled submit while sending ("Sending...").
- No emojis; consistent iconography.

## 6. Data & API requirements
- **Dual-mode rule (restate):** `leads.createContact` keeps `IS_MOCK_API` branching — mock POSTs to `/leads` (`type: "contact"`, `status: "new"`, `createdAt`/`updatedAt`, `notes: ""`) and returns `response.data`; Laravel POSTs `/leads/contact` and returns `extractData(response)`. Preserve JSON-shape fidelity; do not hardcode a mock-only shape.
- **db.json `leads` row** written: `{ id, type: "contact", name, email, phone, category, subject, message, status: "new", notes, createdAt, updatedAt }` (the `orderNumber` field may be omitted/null now that the order-number input is gone). This is the shape Admin → Leads (prompt 29) reads.
- Reuse validators `isEmailValid`, `isValidPhone` from `src/utils/helpers.js`.
- No coupon/wallet/shipping/order APIs are involved.

## 7. Admin panel requirements
N/A here — submitted messages appear in **Admin → Leads (prompt 29)** as `type: "contact"` rows with `status: "new"`. This page must write exactly the fields that surface there (name, email, phone, category, subject, message).

## 8. Storefront requirements
- Route `/support` (and optionally `/contact`) renders the NEBM Contact page.
- Address + both phones are present and correct; phones are `tel:` links; the optional map centers on Nagaon.
- Quick links point at real routes (`/products`, `/orders`, `/about`); no order/refund/shipping links.

## 9. Acceptance criteria
- [ ] Page is titled "Contact Us" and shows the address "Lawkhuwa Road, Nagaon, Assam – 782002".
- [ ] **Both** phone numbers "+91 86385 43526" and "+91 88762 89972" are shown as `tel:` links.
- [ ] The form submits via `apiService.leads.createContact`, writing a `leads` row with `type: "contact"` and `status: "new"`.
- [ ] Success and failure states both render (success card + inline submit error).
- [ ] Order/shipping/returns/payment categories and the Order Number field are removed.
- [ ] Optional map embed (if included) is responsive, lazy-loaded, and accessible.
- [ ] Blue `#1885d8` / Gold `#fa9c4c` palette applied, light and dark.
- [ ] Dual-mode `IS_MOCK_API` + `extractData()` preserved on the lead submission.

## 10. Testing / verification steps
1. `npm run dev`; open `/support` (Contact).
2. Confirm the address and both phone numbers render; click each phone link (opens the dialer). Confirm the map (if added) loads and is responsive.
3. Submit with an empty name/email/subject/message → inline errors; submit with an invalid email → inline error.
4. Fill a valid message with category "Bulk / Project Requirement" and submit → success card appears.
5. Open `http://localhost:3001/leads` and confirm a new row: `type: "contact"`, `status: "new"`, with the submitted name/email/phone/category/subject/message.
6. Trigger a failure (e.g. stop JSON Server) → confirm the inline "Failed to send" message, not a false success.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API** — keep `IS_MOCK_API` + `extractData()`/`response.data` handling in `leads.createContact`; identical lead shape in both backends.
- **Lead plumbing** — reuse the existing form submit/try-catch/`isSubmitting`/success-card flow; don't rewrite the API method.
- **Auth** — keep the email prefill from `user`; never touch `user.password`; guests can still submit.
- **Routing** — `/support` keeps resolving (Footer/About/HelpCenter link to it); if you add `/contact`, register it without removing `/support`. Don't leave links to retired routes (`/refund`, `/special-offers`).
- **Validation helpers** — reuse `isEmailValid`/`isValidPhone`; don't fork regexes.
- **CSS Modules** — reuse `Support.module.css`; keep per-component styling and storefront palette.
