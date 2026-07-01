# 27 — Admin Pricing Controls

## 1. Objective
Extend the admin product form (`src/pages/Admin/AdminProducts.js`) with North East Build Mart's **flexible pricing model**. Per product the admin controls exactly how a price is expressed and what the customer sees: **exact** (fixed), **tiered** (IndiaMART-style quantity bulk pricing), or **onEnquiry** ("Price on Enquiry"). Add `priceType`, `unitType`, `minQty`, an editable `priceTiers[{minQty,price}]` table, and the display toggles `showExactPrice`, `showTieredPricing`, `cardPriceMode`. Validate tiers and persist everything via `updateProduct`/`createProduct` with a JSON shape identical across JSON Server and Laravel. Storefront rendering of these fields is **prompt 15** (cross-reference).

## 2. Context / background
- Business: **North East Build Mart** — an e-commerce-*style* **enquiry** platform for building materials (no cart-to-buy, no checkout-to-pay). Prices are informational and drive enquiries. Admin uses **MUI 5 + `src/theme/adminTheme.js`** and `@iconify/react` `mdi:*` icons (palette separate from storefront). Accent hexes: blue `#1885d8`, gold `#fa9c4c`.
- **Pricing model** (from `prompts/00-analysis-and-requirement-map.md` §PRICING MODEL):
  - **exact** — one fixed price, e.g. ₹100/piece.
  - **tiered** — quantity bulk pricing, e.g. 1pc=₹100, 5pc=₹400, 10pc=₹700; renders on product details as a quantity-vs-price table.
  - **onEnquiry** — no price shown; storefront displays **"Price on Enquiry"**.
- **Schema additions** (extend the `products` collection, keep JSON-shape fidelity both modes):
  - `priceType: "exact" | "tiered" | "onEnquiry"`
  - `unitType: string` — one of piece · box · sheet · bundle · bag · kg · meter · sq ft (etc.)
  - `minQty: number` — minimum order/enquiry quantity
  - `priceTiers: [{ minQty: number, price: number }]`
  - display flags: `showExactPrice: boolean`, `showTieredPricing: boolean`, `cardPriceMode: "card" | "details"` (where the price is surfaced — on the product card vs only on the details page)
- **Prompt 26** already added the `special` flag and specifications and left a `{/* Pricing controls … added in prompt 27 */}` anchor in the Pricing section. This prompt fills that anchor.
- Dual-mode rule (restate): `apiService.admin.createProduct`/`updateProduct` branch on `IS_MOCK_API`, POST/PUT the whole record to JSON Server in mock and to Laravel in prod, shaping reads via `extractData()`. Send the same fields both ways.

## 3. Files & folders to inspect
- `src/pages/Admin/AdminProducts.js` — the product create/edit dialog + `handleSave` payload (`editable` object) + `emptyProduct` default + `openEdit` loader + `clampNum` helper.
- `src/services/api.js` — `admin.createProduct` (~1636), `updateProduct` (~1651) (already persist the full payload; no change needed).
- `src/components/storefront/PriceBlock.js` — the storefront renderer these fields feed (read-only reference; edited in prompt 15).
- `prompts/00-analysis-and-requirement-map.md` §PRICING MODEL, §3.
- `prompts/15-*.md` (storefront price rendering) — cross-reference, do not depend on chat memory.

## 4. Step-by-step implementation instructions
1. **Defaults** — add to `emptyProduct`:
   ```js
   priceType: "exact",
   unitType: "piece",
   minQty: 1,
   priceTiers: [],
   showExactPrice: true,
   showTieredPricing: true,
   cardPriceMode: "card",
   ```
2. **`openEdit`** — hydrate the new fields from the record with safe fallbacks:
   ```js
   priceType: p.priceType || "exact",
   unitType: p.unitType || "piece",
   minQty: p.minQty ?? 1,
   priceTiers: Array.isArray(p.priceTiers) ? p.priceTiers.map(t => ({ minQty: t.minQty ?? 1, price: t.price ?? 0 })) : [],
   showExactPrice: p.showExactPrice !== false,
   showTieredPricing: p.showTieredPricing !== false,
   cardPriceMode: p.cardPriceMode || "card",
   ```
3. **Pricing section UI** (replace the prompt-26 anchor inside the existing "Pricing" block):
   - `priceType` — MUI `Select` / `ToggleButtonGroup` with options **Exact price · Tiered pricing · Price on enquiry**.
   - `unitType` — `Select` with piece/box/sheet/bundle/bag/kg/meter/sq ft (allow free-text via an "Other" text field if you like, but a Select is sufficient).
   - `minQty` — number field (integer ≥ 1), reuse `clampNum(v, { int: true, fallback: 1 })`.
   - **Conditional fields**:
     - When `priceType === "exact"` → keep the existing **Selling Price** (`price`) + Compare-at + Cost fields visible; show a `showExactPrice` switch ("Show price on storefront").
     - When `priceType === "tiered"` → render an editable **price-tiers table** (see step 4) + a `showTieredPricing` switch.
     - When `priceType === "onEnquiry"` → hide price/tier inputs and show an info line: "Storefront will display 'Price on Enquiry'." Ignore the display toggles.
   - `cardPriceMode` — `Select`/`ToggleButtonGroup` **Show on card · Details only** bound to `"card"`/`"details"`.
4. **Editable price-tiers table** (`priceTiers`):
   - Add/remove tier rows (`addTier`, `removeTier`, `updateTier(idx, key, value)` mirroring the existing `addVariant`/`removeVariant`/`updateVariant` pattern).
   - Each row: `minQty` (integer ≥ 1) and `price` (₹, ≥ 0). "Add tier" button.
5. **Validation** (in `handleSave`, before building the payload):
   - If `priceType === "tiered"`: require ≥ 1 tier; every tier `minQty` must be a positive integer and `price` a positive number; **`minQty` values must be strictly ascending** across rows (sort or reject non-ascending). Reject duplicates. Surface errors via the existing `errors` state + the warning toast pattern.
   - If `priceType === "exact"`: keep the existing "selling price > 0 (or add a variant)" rule.
   - If `priceType === "onEnquiry"`: no price validation; force `price` handling to not block save.
   - `minQty` ≥ 1 always.
6. **Payload** — extend the `editable` object in `handleSave` with:
   ```js
   priceType: form.priceType,
   unitType: form.unitType,
   minQty: clampNum(form.minQty, { int: true, fallback: 1 }) || 1,
   priceTiers: form.priceType === "tiered"
     ? form.priceTiers
         .map(t => ({ minQty: clampNum(t.minQty, { int: true, fallback: 1 }) || 1, price: clampNum(t.price) }))
         .sort((a, b) => a.minQty - b.minQty)
     : [],
   showExactPrice: form.priceType === "exact" ? !!form.showExactPrice : false,
   showTieredPricing: form.priceType === "tiered" ? !!form.showTieredPricing : false,
   cardPriceMode: form.cardPriceMode || "card",
   ```
   Keep the existing `price`, `comparePrice`, `costPrice` fields on the payload for `exact` products.
7. **Products table** — optionally show a small chip for `priceType` (e.g. "Tiered" / "On Enquiry") in the Price column so the admin sees the mode at a glance; when `onEnquiry`, show "On Enquiry" instead of `₹`.
8. Do NOT alter `createProduct`/`updateProduct` in `api.js` — they already POST/PUT the whole payload; the new keys ride along unchanged.

## 5. UI/UX requirements
- Keep the MUI dialog/`Grid`/section-divider style from the existing form. The tiers table mirrors the existing variants rows (aligned `TextField`s + a red `mdi:delete-outline` remove button; `mdi:plus` add button).
- Conditional rendering must be clean: only the fields relevant to the selected `priceType` appear. Premium, minimal, no clutter.
- Icons (`mdi:*`): pricing section `mdi:cash-multiple`, tiers `mdi:table`, on-enquiry `mdi:message-question-outline`. Accent with blue `#1885d8` / gold `#fa9c4c` sparingly; read other colours from `adminTheme.js`.
- A helper caption under the tiers table: "Higher quantities should cost less per unit — min quantities must increase down the table."

## 6. Data & API requirements
- New/changed `products` fields: `priceType, unitType, minQty, priceTiers[{minQty,price}], showExactPrice, showTieredPricing, cardPriceMode`. **Identical JSON shape for JSON Server (mock) and Laravel (prod).**
- Persistence via `apiService.admin.createProduct(payload)` (POST `/products` mock) and `updateProduct(id, { ...editingProduct, ...editable })` (PUT `/products/:id` mock) — both already `IS_MOCK_API`-branched and read-shaped through `extractData()`. **Dual-mode preserved.**
- Storefront read contract (prompt 15 / `PriceBlock.js`): `onEnquiry` → "Price on Enquiry"; `tiered` → quantity-vs-price table; `exact` respects `showExactPrice` and `cardPriceMode`. Keep field names exactly as above.

## 7. Admin panel requirements
Admin-only change, contained to the product dialog. No new routes or nav entries.

## 8. Storefront requirements
N/A here (rendering is prompt 15). This prompt only guarantees the data contract the storefront reads.

## 9. Acceptance criteria
- [ ] Product form exposes `priceType` (Exact / Tiered / On Enquiry), `unitType`, `minQty`.
- [ ] Selecting **Tiered** shows an editable tiers table with add/remove; **On Enquiry** hides prices and shows the "Price on Enquiry" note; **Exact** keeps the selling-price fields.
- [ ] Display toggles `showExactPrice`, `showTieredPricing`, and `cardPriceMode` persist.
- [ ] Tier validation blocks: fewer than 1 tier when tiered, non-positive price/qty, non-ascending or duplicate `minQty`.
- [ ] Saved product JSON (`http://localhost:3001/products/:id`) contains all seven new fields with correct types; tiers are sorted ascending by `minQty`.
- [ ] `createProduct`/`updateProduct` are unchanged; the new keys persist through the existing methods.
- [ ] Dual-mode intact; the same payload shape would post to Laravel.
- [ ] App builds; the product dialog loads without console errors.

## 10. Testing / verification steps
1. `npm run dev`; log in at `/admin` → `/admin/products` → Add Product.
2. Choose **Tiered**, add tiers 1→₹100, 5→₹400, 10→₹700, set unit "sheet", minQty 1, save. Confirm success.
3. Verify JSON at `http://localhost:3001/products/:id`: `priceType:"tiered"`, `priceTiers` sorted ascending, `unitType:"sheet"`, `showTieredPricing`, `cardPriceMode`.
4. Edit the product, switch to **On Enquiry**, save; confirm `priceType:"onEnquiry"` and `priceTiers:[]`.
5. Create an **Exact** product with `showExactPrice` off and `cardPriceMode:"details"`; confirm the flags persist.
6. Enter tiers out of order (10 before 5) → expect a validation warning; enter a duplicate `minQty` → expect a validation warning.
7. (Cross-check) Open the storefront product page for a tiered product once prompt 15 is done and confirm the quantity-vs-price table renders.

## 11. Notes on preserving existing functionality
- **Dual-mode `IS_MOCK_API` + `extractData()` + JSON-shape fidelity** — send the identical pricing fields to JSON Server and Laravel; do not hardcode a mock-only shape.
- **Do not modify** `createProduct`/`updateProduct` in `api.js` — they persist the whole payload already; the merge `{ ...editingProduct, ...editable }` on edit must be preserved so `rating`/`totalReviews`/`createdAt` survive.
- **Keep** the existing variants, images, specifications (prompt 26), `special`/featured flags, slug-uniqueness, and SEO logic — this prompt only extends the Pricing block.
- **adminTheme separation** — no storefront CSS Modules/tokens; brand hexes `#1885d8`/`#fa9c4c` only for accents.
- **Storefront contract** — field names (`priceType`, `priceTiers`, `unitType`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`, `minQty`) must match what `PriceBlock.js`/prompt 15 reads.
- **Safe non-cascading DELETE** (`server.js`), **auth/token interceptors**, **provider nesting**, and **slug/category rules** untouched. Reuse the variants-row pattern for tiers rather than inventing a new one.
