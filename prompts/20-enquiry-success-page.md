# 20 — Enquiry Success Page

## 1. Objective
Repurpose `src/pages/OrderConfirmation/OrderConfirmation.js` (+ `OrderConfirmation.module.css`) into an **enquiry success** screen for North East Build Mart (NEBM). It shows a success mark, an **"Enquiry submitted"** message, the prominent **enquiry reference number** (`enquiryNumber`), a summary of the enquired items, clear next-steps that the NEBM team will make contact on **+91 86385 43526 / +91 88762 89972**, and CTAs to keep browsing or view "My Enquiries". It reads the record via `apiService.orders.getByOrderNumber` (dual-mode) and removes all payment / shipping / delivery / invoice UI.

## 2. Context / background
NEBM is an enquiry platform: customers submit an Enquiry List, they do not place or pay for orders. After **Submit Enquiry** (prompt 18), the app routes here with the enquiry reference so the customer sees confirmation and next steps. There is **no payment status, no estimated delivery, no shipping address, no invoice** — those all get stripped.

Brand facts to embed verbatim:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`
- **Logo icon (loader/success mark accent):** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`

This follows **prompt 18 (Submit Enquiry Flow)** and **prompt 19 (Contact & Note capture)**; "My Enquiries" is **prompt 21**. See `prompts/00-analysis-and-requirement-map.md` §5 (OrderConfirmation → Enquiry success) and §3 (enquiry record carries `enquiryNumber`, `items[]`, `contact`, `notes`, `status`).

The current page fetches an order by number, then renders a check animation, an order-number banner (copyable), an estimated-delivery banner, an order-summary card with money totals, a shipping-address card, a payment-method card, and Track/Continue/Invoice buttons. Most of that is removed; the copy/animation/card scaffolding is reused.

## 3. Files & folders to inspect
- `src/pages/OrderConfirmation/OrderConfirmation.js` — the page to repurpose.
- `src/pages/OrderConfirmation/OrderConfirmation.module.css` — reuse the check-circle animation, banner, and card styles; delete delivery/payment/totals rules.
- `src/App.js` — route `/order-confirmation/:orderNumber` (line ~114).
- `src/services/api.js` — `orders.getByOrderNumber` (~1194), dual-mode.
- `src/utils/helpers.js` — `formatDate` (for "Submitted on"); drop `normalizeOrderAddress` usage.
- `package.json` — `canvas-confetti` is already bundled (optional celebration).

## 4. Step-by-step implementation instructions
1. **Route & param.** Keep the record fetch working. Two acceptable options — pick one and apply atomically in `src/App.js`:
   - **(Preferred)** rename the route to `/enquiry-confirmation/:enquiryNumber` and read `const { enquiryNumber } = useParams();`, updating the `navigate(...)` call in prompt 18 to match; **or**
   - keep the path `/order-confirmation/:orderNumber` and only re-word the UI, reading `orderNumber` as the enquiry reference.
   Whichever you choose, the fetch uses `apiService.orders.getByOrderNumber(<ref>)` (→ `/enquiries` after the db pivot, prompt 05/28).
2. **Fetch + state.** Keep `fetchEnquiry()` (rename from `fetchOrder`) with the existing `loading` / `fetchError` / not-found branches. Update copy: not-found heading "Enquiry Not Found", error heading "Couldn't Load Your Enquiry", and change the fallback CTA `navigate("/orders")` → `navigate("/orders")` (the My Enquiries route from prompt 21; keep the path stable).
3. **Success header.** Keep the animated `checkCircle` + `showCheck` timing. Change `<h1>` to **"Enquiry submitted"** and the subtext to a fixed, payment-free line: **"Thanks! Your enquiry has been received. Our team will review it and get back to you shortly."** Remove the `isPaymentPending` branch entirely. Optionally accent the check mark with brand blue; the Icons8/iconify success mark or the NEBM logo icon may sit beside it.
4. **Reference-number banner.** Reuse the copyable banner. Label it **"Enquiry Reference"** and show `enquiry.enquiryNumber || enquiry.orderNumber || <refParam>`. Keep the copy-to-clipboard button and "Submitted on {formatDate(enquiry.createdAt)}" meta. Remove the `orderNumberLabel`/`orderNumberValue` order wording.
5. **Delete the delivery banner** (`deliveryBanner`, `getEstimatedDelivery`, `formatDeliveryDate`, `isDelivered`) — there is no delivery.
6. **Enquired-items summary.** Reuse the items card. Header "Enquiry Summary" with the item count. For each item render thumbnail, name (+ variant), `Qty: {item.quantity}`, and the **price mode** instead of a money line total:
   - `priceType: "exact"` → `formatCurrency(item.price)` + unit;
   - `priceType: "tiered"` → "Tiered pricing";
   - else → **"Price on Enquiry"**.
   **Remove the totals section entirely** (subtotal/discount/shipping/tax/total/store-credit rows) — enquiries carry no money.
7. **Delete the shipping-address and payment-method cards** and `normalizeOrderAddress`. Replace them (right column) with a **"What happens next"** card:
   - Line 1: "Our team will review your enquiry and prepare a quotation."
   - Line 2: **"We'll contact you on +91 86385 43526 / +91 88762 89972."** (render both as `tel:` links).
   - Optional: show the submitted contact (`enquiry.contact?.name` / `phone`) as "We'll reach out to: {name} · {phone}".
8. **CTAs.** Replace the three buttons with two:
   - **"Continue Browsing"** → `navigate("/products")`.
   - **"View My Enquiries"** → `navigate("/orders")` (the My Enquiries page, prompt 21).
   Remove the "Track Order" and "Download Invoice" buttons and `handleDownloadInvoice`.
9. **Optional confetti.** A subtle one-shot `canvas-confetti` burst on successful load is acceptable (brand blue/gold particles, low particle count, short duration). Keep it tasteful and skip on reduced-motion.
10. **Component rename.** Rename the component to `EnquiryConfirmation` (keep default export) and update the import in `src/App.js`. If you keep the folder/file name to reduce churn, rename only the component + heading copy.

## 5. UI/UX requirements
- Apple-minimal, premium. Primary Blue `#1885d8` for the success accent and primary CTA; Gold `#fa9c4c` sparingly (e.g. the reference-number highlight or a small badge). Soft shadows, rounded cards, centered success block, two-column content grid collapsing to one column on mobile.
- The reference number is the visual hero after the check mark — large, monospace, copyable.
- Both phone numbers are tappable `tel:` links. No emojis; use `@iconify/react` `mdi:*` or an Icons8 success glyph consistently.
- Respect `prefers-reduced-motion` for the confetti and check animation.

## 6. Data & API requirements
- **Dual-mode rule (restate):** `orders.getByOrderNumber` keeps `IS_MOCK_API` branching (mock queries `/orders?orderNumber=` and returns the first row; Laravel hits `/orders/number/:n`) and unwraps via the existing `response?.data || response?.order || response` pattern → later `extractData()`. Preserve JSON-shape fidelity. After the pivot (prompt 05/28) this reads `/enquiries` by `enquiryNumber` with the same dual-mode shape.
- Fields read: `enquiryNumber` (fallback `orderNumber`), `items[]` (with `quantity`, `priceType`, `price`, `unitType`, `name`, `image`, `variantName`), `contact { name, phone }`, `createdAt`, `status`. **Do not read** `total`, `subtotal`, `taxAmount`, `shippingAmount`, `paymentStatus`, `paymentMethod`, `shippingAddress`.
- No new API method required.

## 7. Admin panel requirements
N/A — this is a storefront confirmation screen. The referenced enquiry is managed in Admin → Enquiries (prompt 28).

## 8. Storefront requirements
- Reached automatically after Submit Enquiry (prompt 18) with the reference in the route.
- Deep-linking / refreshing the URL re-fetches the enquiry by reference and renders the same screen (or the not-found/error state on failure).
- No purchase, payment, delivery, tracking, or invoice affordances anywhere.

## 9. Acceptance criteria
- [ ] Heading reads **"Enquiry submitted"** with a payment-free confirmation subtext.
- [ ] The **enquiry reference number** is displayed prominently and is copyable.
- [ ] A summary lists the enquired items with quantity and price mode; there are **no** money totals.
- [ ] A "What happens next" block states the team will contact the customer on **+91 86385 43526 / +91 88762 89972** (both `tel:` links).
- [ ] CTAs are "Continue Browsing" (→ `/products`) and "View My Enquiries" (→ `/orders`); no Track Order / Download Invoice.
- [ ] Estimated-delivery, shipping-address, and payment-method cards are removed.
- [ ] Refreshing the confirmation URL re-fetches and re-renders correctly; error/not-found states work.
- [ ] Dual-mode `IS_MOCK_API` + `extractData()`-style unwrapping preserved on the fetch.

## 10. Testing / verification steps
1. `npm run dev`; submit an enquiry via `/checkout` (prompts 18/19) and land on this page.
2. Confirm the heading, reference number (matches the new `orders`/`enquiries` row's `enquiryNumber`), item summary with price modes, both phone numbers as links, and the two CTAs.
3. Copy the reference; confirm the clipboard button toggles to "Copied!".
4. Refresh the page URL — the enquiry re-loads from `http://localhost:3001/orders?orderNumber=<ref>` (or `/enquiries`).
5. Visit the URL with a bogus reference — confirm the "Enquiry Not Found" state and its CTAs.
6. Confirm no delivery/payment/shipping/invoice UI is present anywhere.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API** — keep `IS_MOCK_API` branching + response unwrapping on `orders.getByOrderNumber`; identical shape in both backends.
- **Routing** — if the route is renamed, update `src/App.js` and the `navigate(...)` in prompt 18 atomically so no link 404s; the legacy `/order-confirmation/:orderNumber` should not silently break existing bookmarks (redirect if you rename).
- **No side effects** — this is a read-only screen; it must not create payments, redeem coupons, or touch the wallet.
- **CSS Modules** — reuse `OrderConfirmation.module.css`; keep per-component styling and the check animation.
- **Enquiry model integrity** — read only enquiry fields (`enquiryNumber`, `items`, `contact`, `notes`, `status`); never resurrect money/payment/shipping fields.
- **canvas-confetti** — optional and subtle; must respect reduced-motion and never block render if the module fails.
