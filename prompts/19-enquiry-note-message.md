# 19 — Enquiry Note & Contact Capture

## 1. Objective
Add a **note/message textarea** and **contact capture** (name, phone, email) to the Submit Enquiry page (the ex-Checkout page from prompt 18), prefilling from the logged-in `user` while allowing guest entry, and fold the captured data into the enquiry payload as `contact { name, phone, email }` and `notes` (a.k.a. `message`). Validate **name and phone required, email optional (valid if present)**. The captured data must appear in **Admin → Enquiries** (prompt 28).

## 2. Context / background
North East Build Mart (NEBM) is an enquiry platform. When a customer submits their **Enquiry List**, the NEBM team needs to reach them, so every enquiry carries a contact block and the customer's free-text message. This is the enquiry equivalent of a "leave your details and we'll call you" form — there is **no payment, no shipping address, no order**.

Brand facts:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`

This prompt extends **prompt 18 (Submit Enquiry Flow)** and feeds **prompt 28 (Admin → Enquiries)**. The enquiry `status` on creation is `"New"` (prompt 18). See `prompts/00-analysis-and-requirement-map.md` §3 (enquiries repurpose the `orders` collection: keep `items[]`, `statusHistory[]`, `notes`; add `contact{name,phone,email}`, `enquiryNumber`, `status`, `adminNotes`).

The existing `Checkout.js` already pulls `user` from `useAuth()` and prefilled a shipping-address `firstName/lastName/phone`. Reuse that pattern for the lighter contact block, and reuse the existing form/input CSS Module classes.

## 3. Files & folders to inspect
- `src/pages/Checkout/Checkout.js` — the Submit Enquiry page (rebuilt in prompt 18); add the contact + note block here.
- `src/pages/Checkout/Checkout.module.css` — reuse `.formGroup`, `.formRow`, input, and `.fieldError` styles.
- `src/context/OrderContext.js` — `createOrder`; ensure `contact` and `notes` pass through untouched.
- `src/utils/helpers.js` — reuse `isValidPhone` (10-digit Indian mobile) and the email validator (`isEmailValid`, used in `Support.js`).
- `src/services/api.js` — `orders.create` (~1138); confirm it forwards arbitrary payload fields (it spreads `...orderData`).
- `src/pages/Support/Support.js` — reference implementation of prefill-from-`user` + field validation.
- `db.json` — enquiry record shape (post-pivot `enquiries`, currently `orders`).

## 4. Step-by-step implementation instructions
1. **Add contact state** to the Submit Enquiry page:
   ```js
   const [contact, setContact] = useState({ name: "", phone: "", email: "" });
   const [note, setNote] = useState("");
   const [contactErrors, setContactErrors] = useState({});
   ```
2. **Prefill from the logged-in user** without clobbering typed values (mirror `Support.js`):
   ```js
   useEffect(() => {
     if (!user) return;
     setContact((prev) => ({
       name: prev.name || [user.firstName, user.lastName].filter(Boolean).join(" "),
       phone: prev.phone || user.phone || "",
       email: prev.email || user.email || "",
     }));
   }, [user]);
   ```
   Guests see empty fields and fill them in.
3. **Render the contact block** below the Enquiry Summary, inside its own card headed "Your Details":
   - **Full Name \*** — text input, `name="name"`.
   - **Phone \*** — `type="tel"`, placeholder `+91 98765 43210`.
   - **Email** (optional) — `type="email"`, hint "Optional — for a written quotation".
   Wire `onChange` to update `contact` and clear the matching `contactErrors[name]`.
4. **Render the note textarea** in the same card, headed by a label **"Message / Requirement (optional)"**, `rows={4}`, placeholder like "Tell us quantities, sizes, site location, or any specific requirement." Bind to `note`.
5. **Validate on submit** in a `validateContact()` helper called at the top of `handleSubmitEnquiry`:
   - `name` required → `"Please enter your name"`.
   - `phone` required and must pass `isValidPhone(phone)` → `"Enter a valid 10-digit mobile number"`.
   - `email` optional; if non-empty it must pass `isEmailValid(email)` → `"Enter a valid email address"`.
   Set `contactErrors` and return `false` on any failure so submission is blocked; render `.fieldError` spans under each field.
6. **Fold into the payload** (extends prompt 18 §4.7):
   ```js
   contact: {
     name: contact.name.trim(),
     phone: contact.phone.trim(),
     email: contact.email.trim() || null,
   },
   notes: note.trim(),      // stored as `notes` (Admin reads notes / message)
   ```
   Keep the field name `notes` to match the existing `orders`/`enquiries` schema (`orders` already has a `notes` field). If prompt 28 expects `message`, also mirror it: `message: note.trim()` — but `notes` is canonical. Do not add address/payment fields.
7. **Pass through OrderContext untouched.** `createOrder` spreads `...orderData`, so `contact` and `notes` reach `apiService.orders.create` and persist. Confirm no default overwrites them.

## 5. UI/UX requirements
- Apple-minimal card, Primary Blue `#1885d8` focus rings on inputs; Gold `#fa9c4c` reserved for the small "required" asterisk or a subtle accent. Clear labels, single-column on mobile, two-column (name/phone) on desktop via the existing `.formRow`.
- Inline validation: red `.fieldError` text under the offending field; the field border turns to the existing error style.
- The note textarea is comfortably sized (min-height ~120px), non-resizable-shrink, with a soft rounded border.
- No emojis; use consistent iconography if any icon accompanies the section header.

## 6. Data & API requirements
- **Dual-mode rule (restate):** keep `IS_MOCK_API` branching and `extractData()` on `orders.create`; keep JSON-shape fidelity so `contact` and `notes` round-trip identically against JSON Server and Laravel. Never hardcode a mock-only shape.
- **db.json enquiries shape** (relevant fields): `contact: { name, phone, email }` and `notes: string`. Email may be `null`. On the Laravel branch the same JSON body is POSTed; `extractData()` unwraps the response.
- No new API method is needed — reuse `apiService.orders.create`. Do not introduce coupon/wallet/payment fields (they would re-trigger side effects; see prompt 18 §6 and risk register #1).
- `contact.name` here is a single display name; do not split into first/last (the enquiry model is lighter than the old order).

## 7. Admin panel requirements
The captured `contact { name, phone, email }` and `notes` render in **Admin → Enquiries** (prompt 28): the list shows name + phone; the detail view shows the full contact block, the customer's message, the items, and the status. This prompt only guarantees the data is written in the shape prompt 28 reads.

## 8. Storefront requirements
- Contact + note block lives on the Submit Enquiry page (`/checkout`), directly above the **Submit Enquiry** button.
- Works for both guests and logged-in users; logged-in users see prefilled, editable fields.
- Submission is blocked with inline errors until name and a valid phone are present; email is truly optional.

## 9. Acceptance criteria
- [ ] The Submit Enquiry page has a "Your Details" card with Name (required), Phone (required), Email (optional), and a Message textarea.
- [ ] Logged-in users see prefilled name/phone/email from `user`; guests see empty editable fields.
- [ ] Submitting with an empty name or invalid/empty phone shows inline errors and does not submit.
- [ ] A blank email submits fine; a malformed email is rejected inline.
- [ ] The persisted record contains `contact { name, phone, email }` (email `null` when blank) and `notes` with the typed message.
- [ ] No address/payment/coupon/wallet fields are added to the payload.
- [ ] Dual-mode `IS_MOCK_API` + `extractData()` preserved.

## 10. Testing / verification steps
1. `npm run dev`; add products, open `/checkout`.
2. As a guest: leave name blank → submit → inline "Please enter your name". Enter an invalid phone → inline phone error. Enter a bad email → inline email error.
3. Fill valid name + phone, leave email blank, type a message, submit.
4. Open `http://localhost:3001/orders` (or `/enquiries`) and confirm the newest record has `contact: { name, phone, email: null }` and `notes` set.
5. Log in as a seeded user, reopen `/checkout` — confirm name/phone/email are prefilled from the account and editable; submit and confirm `contact.email` is the account email.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API** — `IS_MOCK_API` + `extractData()` intact on `orders.create`; contact/notes shape identical in both modes.
- **No enquiry side effects** — do not add `couponCode`/`storeCreditUsed`/payment fields; keep `createPaymentForOrder`/`redeemCouponByCode`/`debitWallet` dormant (prompt 18).
- **Auth** — prefill reads only safe `user` fields (`firstName`, `lastName`, `phone`, `email`); never touch/leak `user.password`. Guests must still submit.
- **Validation helpers** — reuse `isValidPhone` and `isEmailValid` from `src/utils/helpers.js`; do not fork new regexes.
- **CSS Modules** — reuse `Checkout.module.css` classes; keep per-component styling.
- **OrderContext** — keep `createOrder` passing arbitrary payload fields through; don't add defaults that clobber `contact`/`notes`.
