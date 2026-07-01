# 24 — Footer Redesign

## 1. Objective
Redesign `src/components/Footer/Footer.js` (+ `Footer.module.css`) for North East Build Mart (NEBM): the NEBM logo, the address and **both** phone numbers, quick links, category links, and the credit line **`Designed and Developed by Assam Digital`** where **"Assam Digital"** is a link to `https://assamdigital.com` with `target="_blank"` and `rel="noopener noreferrer"`. Remove the e-commerce payment/trust bar and shipping/returns/deals language. Works on light **and** dark backgrounds. Blue `#1885d8` / Gold `#fa9c4c` minimal.

## 2. Context / background
NEBM is an enquiry platform. The footer must drop all purchase/payment/shipping/returns merchandising (the "We Accept: Visa/Mastercard/UPI/COD" bar, "Free Shipping*", "Easy Returns", "Secure Payment", newsletter "latest deals"/"exclusive offers" framing) and present NEBM identity, contact, and navigation instead. The mandatory footer credit links to the developer, Assam Digital.

Brand facts to embed **verbatim**:
- **Business:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use."
- **Address:** Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Footer credit:** `Designed and Developed by Assam Digital` — the words **"Assam Digital"** must be an anchor to **https://assamdigital.com** with `target="_blank"` `rel="noopener noreferrer"`.
- **Primary Blue:** `#1885d8` · **Accent Gold/Orange:** `#fa9c4c`
- **Logo:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` — must work on light AND dark backgrounds.

Category links (top-level; see `prompts/00-analysis-and-requirement-map.md` §4): WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products · Tiles · Doors · Hardware · Plumbing · Bath Fittings · Cement · Steel Rods (+ Special Products). Deep-link via `/products?category=<slug>`. This footer complements About (prompt 22) and Contact (prompt 23).

The current `Footer.js` imports `APP_NAME`, `SUPPORT_EMAIL`, `SUPPORT_PHONE`, `SUPPORT_ADDRESS`, `SUPPORT_HOURS`, `SOCIAL_LINKS` (generic "My Store"), gates a "Deals" link on `useDealsConfig`, and renders a payment/trust bar. Re-skin and de-commerce it.

## 3. Files & folders to inspect
- `src/components/Footer/Footer.js` — the footer to redesign.
- `src/components/Footer/Footer.module.css` — reuse the grid/columns/bottom-bar; re-token Blue/Gold; delete payment/trust-bar rules.
- `src/utils/constants.js` — `APP_NAME`, `SUPPORT_*`, `SOCIAL_LINKS`. Prefer hardcoding NEBM address/phones here for a self-contained footer; if constants are already NEBM, use them.
- `src/utils/categories.js` — `getMainMenuCategories` if rendering live category links; else static list.
- `src/context/DealsConfigContext.js` — the `useDealsConfig` gate; Deals/Special Offers merchandising is being retired (prompt 00 §5), so drop the deals-gated links.
- `src/services/api.js` — `leads.createNewsletter` (~1515) if the newsletter is retained.
- `src/App.js` — confirm every footer link resolves to a real route.

## 4. Step-by-step implementation instructions
1. **Brand column.** Replace the text `APP_NAME` heading with the **NEBM logo** `<img>` (Cloudinary URL), sized for the footer and legible on the dark footer background (the logo supports light + dark). Under it, the tagline "Deals in all kinds of building materials for interior and exterior use." Keep the social icons **only if** `SOCIAL_LINKS` hold real NEBM URLs; otherwise omit them (don't render dead social links).
2. **Contact column.** Show, verbatim:
   - Address: `Lawkhuwa Road, Nagaon, Assam – 782002` (with a location icon).
   - Phone 1: `+91 86385 43526` — `tel:` link (strip spaces in href).
   - Phone 2: `+91 88762 89972` — `tel:` link.
   - Email only if NEBM has one; otherwise omit. Drop `SUPPORT_HOURS` unless real.
3. **Quick Links column.** Re-point to real NEBM routes: "Home" (`/`), "Products" (`/products`), "About Us" (`/about`), "Contact Us" (`/support`), "My Enquiries" (`/orders`), "Wishlist" (`/wishlist`). **Remove** "New Arrivals"/"Best Sellers"/"Deals"/"Special Offers" deals-gated links and the `useDealsConfig` dependency, and remove "Order Tracking"/"Returns & Exchange"/"Shipping Info".
4. **Categories column.** Add a column of top-level category links deep-linking to `/products?category=<slug>` (WPC Louvers, Polycarbonate Sheets, FRP Sheets, Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods, and Special Products). Static or from `getMainMenuCategories()`. Keep it tidy (a subset of the most important categories is fine if space is tight).
5. **Remove the Trust & Payment bar** entirely — the "We Accept" payment badges (Visa/Mastercard/UPI/COD) and the trust badges ("Secure Payment / Easy Returns / Free Shipping* / 24/7 Support"). NEBM has no payment/shipping/returns.
6. **Newsletter.** Either remove the newsletter block or re-word it away from "latest deals / exclusive offers" toward "Get updates from North East Build Mart." If kept, it still posts via `apiService.leads.createNewsletter` (dual-mode) and keeps the success/error states. Removing it is acceptable and simpler.
7. **Bottom bar.** Keep the copyright line, updated: `© {year} North East Build Mart. All rights reserved.` Add the mandatory credit line beside/below it:
   ```jsx
   <p className={styles.credit}>
     Designed and Developed by{" "}
     <a
       href="https://assamdigital.com"
       target="_blank"
       rel="noopener noreferrer"
       className={styles.creditLink}
     >
       Assam Digital
     </a>
   </p>
   ```
   Keep the legal links (Terms / Privacy / Cookies) since those policy pages are retained (prompt 00 §5).
8. **Re-token the stylesheet** to Blue `#1885d8` / Gold `#fa9c4c`. Ensure the footer background and the logo both look right in light and dark (`data-theme={isDarkMode ? "dark" : "light"}` is already wired). Gold for link hover/accents, sparingly.

## 5. UI/UX requirements
- Premium, minimal: clean multi-column grid collapsing gracefully on mobile, generous spacing, subtle dividers. Primary Blue `#1885d8` for headings/link hover base; Gold `#fa9c4c` for hover accent / the credit link or a small highlight, used sparingly.
- The NEBM logo renders crisply on the footer's dark surface and on a light one.
- Both phone numbers are tappable `tel:` links; address is readable.
- The "Assam Digital" credit link is visually distinct (accent color) and opens in a new tab safely (`rel="noopener noreferrer"`).
- No payment/trust badges, no emojis.

## 6. Data & API requirements
- **Dual-mode rule (restate):** if the newsletter is kept, `leads.createNewsletter` keeps `IS_MOCK_API` branching (mock POSTs to `/leads` with `type: "newsletter"`, `status: "subscribed"`, timestamps; Laravel POSTs `/leads/newsletter`) and unwraps via `response.data`/`extractData()`. Preserve JSON-shape fidelity. If the newsletter is removed, no API is involved.
- If category links are rendered live via `getMainMenuCategories()`, keep that path dual-mode.
- No coupon/wallet/shipping/payment data anywhere in the footer.

## 7. Admin panel requirements
N/A. (Retained newsletter signups still land in `leads` as `type: "newsletter"`, visible in Admin → Leads, prompt 29.)

## 8. Storefront requirements
- The footer renders on every storefront page (already mounted in the layout) in light and dark.
- Every link resolves to a real route in `src/App.js` (no catch-all `/` redirect); category links deep-link correctly with `?category=<slug>`.
- The "Assam Digital" credit link points to `https://assamdigital.com` in a new tab.

## 9. Acceptance criteria
- [ ] Footer shows the NEBM logo (legible on the dark footer), the tagline, the address "Lawkhuwa Road, Nagaon, Assam – 782002", and **both** phones as `tel:` links.
- [ ] Quick links and category links all resolve to real routes; no deals/shipping/returns/order-tracking links remain.
- [ ] The payment "We Accept" bar and the shipping/returns trust badges are removed.
- [ ] The credit line reads `Designed and Developed by Assam Digital`, with "Assam Digital" linking to `https://assamdigital.com` with `target="_blank"` and `rel="noopener noreferrer"`.
- [ ] Copyright reads "© {year} North East Build Mart. All rights reserved."
- [ ] Blue `#1885d8` / Gold `#fa9c4c` palette applied; footer looks correct in light and dark.
- [ ] If retained, the newsletter still submits dual-mode via `leads.createNewsletter`; if removed, nothing breaks.

## 10. Testing / verification steps
1. `npm run dev`; scroll to the footer on the home page.
2. Confirm the NEBM logo, tagline, address, and both phone numbers render; click each phone link.
3. Click each quick link and category link → all land on real routes (`/`, `/products`, `/about`, `/support`, `/orders`, `/wishlist`, `/products?category=<slug>`); none redirect to `/`.
4. Click "Assam Digital" → opens `https://assamdigital.com` in a new tab; verify `rel="noopener noreferrer"` in the DOM.
5. Confirm the payment/trust bar is gone.
6. Toggle dark mode → logo and text remain legible; colors hold.
7. If the newsletter is kept: subscribe with a valid email → success; check `http://localhost:3001/leads` for a new `type: "newsletter"` row.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode API** — if the newsletter stays, keep `IS_MOCK_API` + `extractData()`/`response.data` in `leads.createNewsletter`; identical shape both backends.
- **Routing** — every footer link must resolve to a real route in `src/App.js`; dropping the `useDealsConfig` gate must not leave links to retired `/special-offers`. Keep Terms/Privacy/Cookies links (those pages remain).
- **Theme** — keep the `data-theme` light/dark wiring; keep storefront/admin palette separation; logo must work on both.
- **External-link safety** — the "Assam Digital" (and any social) links use `target="_blank"` + `rel="noopener noreferrer"`.
- **CSS Modules** — reuse/refactor `Footer.module.css`; no global styles; keep per-component styling.
- **No commerce plumbing revived** — removing the payment/trust bar and deals links must not touch coupon/wallet/shipping helpers in `api.js` (leave them dormant).
