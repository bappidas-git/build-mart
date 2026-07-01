# 15 — Pricing Display Logic

## 1. Objective

Extend `src/components/storefront/PriceBlock.js` (+ `PriceBlock.module.css`) so a single component renders **three pricing modes** driven by real product fields, for **North East Build Mart (NEBM)**:

- **exact** — a fixed price with `unitType` (e.g. ₹100 / piece), keeping today's honest compare/discount/savings behaviour.
- **tiered** — IndiaMART‑style quantity bulk pricing: a **quantity‑vs‑price table** from `priceTiers[{minQty,price}]`, showing per‑unit price and **computed** per‑unit discounts relative to the base tier, plus the `minQty` order minimum.
- **onEnquiry** — render **"Price on Enquiry"** (no number).

Respect the display flags `showExactPrice`, `showTieredPricing`, and `cardPriceMode` so the same component shows a **compact** form on `ProductCard` and the **full tier table** on `ProductDetails`. Preserve the honest‑pricing guarantee: discounts are always derived from real numbers, never fabricated.

## 2. Context / background

NEBM is an enquiry platform for building materials. Products can be priced flexibly and the merchant controls exactly what users see. Facts you need:

- **Primary Blue:** `#1885d8`; **Accent Gold/Orange:** `#fa9c4c`. Apple‑minimal, generous white space, clean typography.
- **Pricing schema (added to `products`):** `priceType: "exact" | "tiered" | "onEnquiry"`, `unitType` (piece/box/sheet/bundle/bag/kg/meter/sq ft…), `minQty` (number), `priceTiers: [{ minQty, price }]`, and display flags `showExactPrice` (bool), `showTieredPricing` (bool), `cardPriceMode` (how the card should present price for this product). Existing fields `price`, `comparePrice` remain.
- **Honest‑pricing rule (must keep):** the current `PriceBlock` derives `discount = round((compare − price)/compare)` and only shows it when `compare > price`; an author cannot type a fake "% off". Every computed discount in tiered mode must likewise be derived from the tier numbers.

`PriceBlock` is shared by `ProductCard` (listing + related/recently‑viewed/bundles) and `ProductDetails`. Sibling prompts: 12 (card), 14 (PDP). See the pricing model in `prompts/00-analysis-and-requirement-map.md` §3 and the grounding brief.

## 3. Files & folders to inspect

- `src/components/storefront/PriceBlock.js` — current single‑price component (extend here).
- `src/components/storefront/PriceBlock.module.css` — its styles (add tier‑table + enquiry styles).
- `src/components/storefront/ProductCard.js` — passes price to `PriceBlock` (compact/card mode).
- `src/pages/ProductDetails/ProductDetails.js` — passes price to `PriceBlock` (full mode with tier table).
- `src/utils/helpers.js` — `formatCurrency` (line ~13; `en-IN` / INR), `getProductMinPrice` (line ~24).
- `src/theme/storefront-tokens.css` — `--sf-*` tokens (Blue/Gold palette).

## 4. Step-by-step implementation instructions

1. **Extend the prop contract** (keep backward compatibility). Today `PriceBlock` takes `{ price, comparePrice, currency, size, showSavings, taxNote }`. Add a way to pass the pricing model. Prefer a single `product` prop (or explicit `priceType`, `unitType`, `minQty`, `priceTiers`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`) plus a `mode: "card" | "details"` prop. When only `price`/`comparePrice` are passed (legacy callers), behave exactly as today (exact mode). Derive `priceType` defaulting to `"exact"` when absent.
2. **exact mode.** Render `formatCurrency(price, currency)` and, **only when `comparePrice > price`**, the struck‑through compare + a derived `{discount}% off` and (on large/details) a "You save ₹X" line — unchanged from today. Append the **`unitType`** as a subtle suffix, e.g. `₹100.00 / piece`, when `unitType` is present. Honour `showExactPrice`: if a merchant sets `showExactPrice === false` for an exact product, fall back to "Price on Enquiry" (they've chosen to hide the number).
3. **tiered mode.**
   - **Details (`mode="details"`, `showTieredPricing !== false`):** render a **quantity‑vs‑price table** from `priceTiers`, sorted ascending by `minQty`. Columns: **Quantity** (e.g. "1–4", "5–9", "10+"), **Price / <unitType>**, **Discount**. Compute the range labels from consecutive `minQty` values (last row is `<minQty>+`). Per‑unit discount for each tier = `round((base − tierPrice)/base × 100)` where `base` is the **first (smallest‑qty) tier price**; the base row shows no discount (or "—"). Show the `minQty` order minimum as a line above/below the table (e.g. "Minimum order: 5 pieces") when `minQty > 1`. All numbers via `formatCurrency`.
   - **Card (`mode="card"`):** render a **compact** form — the lowest tier price (starting price) as `From ₹X / <unitType>` (compute the min tier price, falling back to `getProductMinPrice`). Optionally a tiny "bulk pricing" chip in gold. Never render the full table on a card.
   - Never fabricate a discount: every tier discount is derived from the tier numbers only.
4. **onEnquiry mode.** In both card and details modes render a clear **"Price on Enquiry"** label (no number, no struck price, no discount). Style it as a calm blue/gold pill or muted text — Apple‑minimal, honest. This is also the fallback when `showExactPrice === false` on an exact product or when a tiered product has an empty `priceTiers`.
5. **`cardPriceMode`.** Use this per‑product display flag to let the merchant override the card presentation (e.g. force "Price on Enquiry" on a card even if a number exists, or force the compact "From ₹X"). Interpret it conservatively and document the accepted values in a comment; default to the natural mode for the `priceType` when unset.
6. **Wire callers.**
   - `ProductCard.js`: pass the product's pricing fields + `mode="card"`. Remove the ad‑hoc `getProductMinPrice` price passing if it now flows through the product; keep the honest discount badge on the media consistent with the card price.
   - `ProductDetails.js`: pass the product's pricing fields + `mode="details"` so the tier table renders. Replace the checkout‑implying `taxNote` copy with a neutral, enquiry‑safe note or omit it.
7. **Styling.** Add tier‑table styles (soft borders, zebra rows, gold highlight on the best‑value/highest‑discount row) and the "Price on Enquiry" pill, all via `--sf-*` Blue/Gold tokens. Keep the existing `sm`/`md`/`lg` size classes working for legacy callers.

## 5. UI/UX requirements

- **Brand tokens:** `#1885d8` (prices, table header/accents, focus), `#fa9c4c` (bulk‑pricing chip, best‑value row highlight). Apple‑minimal, legible number typography, right‑aligned prices in the table.
- **exact:** `₹X.XX / <unitType>` + honest compare/discount/savings when real.
- **tiered (details):** clean quantity‑vs‑price table with computed per‑unit discounts + a `minQty` line; **tiered (card):** compact `From ₹X / <unitType>` + optional gold "bulk pricing" chip.
- **onEnquiry:** "Price on Enquiry" pill/label, no number, in both modes.
- Currency always via `formatCurrency` (INR, `en-IN`).
- Dark mode legible; reduced‑motion friendly (no animated numbers required).

## 6. Data & API requirements

- **Dual‑mode rule (restate):** `PriceBlock` is presentational and consumes product fields already fetched through `apiService.products.*` → `extractData()` with `IS_MOCK_API` branching upstream. Keep JSON‑shape fidelity so the same fields (`priceType`, `unitType`, `minQty`, `priceTiers[]`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`) render identically against JSON Server (`:3001`) and Laravel. Do not fetch inside `PriceBlock`.
- **Fields consumed:** `price`, `comparePrice`, `priceType`, `unitType`, `minQty`, `priceTiers:[{minQty,price}]`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`.
- **Helpers:** `formatCurrency(amount, "INR")` for all money; `getProductMinPrice(product)` as the fallback for a representative/min price when tiers are absent or malformed.
- **Guardrails:** tolerate missing/empty `priceTiers` (→ onEnquiry or exact fallback), non‑numeric prices (skip), and unsorted tiers (sort by `minQty` before rendering).

## 7. Admin panel requirements

N/A here. The admin product form authors `priceType`, `unitType`, `minQty`, `priceTiers`, and the display flags (separate prompt); this prompt only renders them. Keep the field names identical so the admin form and `PriceBlock` agree.

## 8. Storefront requirements

- `ProductCard` shows the **compact** card price (exact `₹X/unit`, tiered `From ₹X/unit`, or "Price on Enquiry").
- `ProductDetails` shows the **full** pricing (exact with unit + honest discount, tiered **quantity‑vs‑price table**, or "Price on Enquiry").
- No fabricated discounts anywhere; every % is derived from real numbers.
- Legacy callers passing only `price`/`comparePrice` still render correctly (exact mode).

## 9. Acceptance criteria

- [ ] `PriceBlock` renders three modes from product fields: **exact**, **tiered**, **onEnquiry**.
- [ ] **exact:** fixed price with `unitType` suffix and honest compare/discount/savings (only when `comparePrice > price`); `showExactPrice === false` falls back to "Price on Enquiry".
- [ ] **tiered (details):** a quantity‑vs‑price table from `priceTiers[{minQty,price}]` (sorted), with **computed** per‑unit discounts vs the base tier and a `minQty` minimum‑order line; no fabricated numbers.
- [ ] **tiered (card):** compact "From ₹X / <unitType>" (min tier price), no full table.
- [ ] **onEnquiry:** "Price on Enquiry" in both card and details modes; also the fallback for empty `priceTiers`.
- [ ] `cardPriceMode` can override the card presentation; unset falls back to the natural mode for the `priceType`.
- [ ] `ProductCard` uses card mode; `ProductDetails` uses details mode (tier table visible).
- [ ] Legacy callers passing only `price`/`comparePrice` still work (exact mode) — no regressions.
- [ ] All money uses `formatCurrency` (INR); palette uses `#1885d8` / `#fa9c4c`; dark mode legible.

## 10. Testing / verification steps

1. `npm run dev`.
2. Seed/verify one product of each type in `db.json` (`priceType: "exact" | "tiered" | "onEnquiry"`, with `unitType`, `minQty`, `priceTiers`).
3. On `/products` cards: exact → `₹X / unit`; tiered → `From ₹X / unit` (+ optional gold chip); onEnquiry → "Price on Enquiry".
4. On each PDP: exact → fixed price + unit + honest discount; tiered → quantity‑vs‑price **table** with correct range labels ("1–4", "5–9", "10+"), correct `formatCurrency` prices, computed discounts, and the `minQty` line; onEnquiry → "Price on Enquiry".
5. Set `showExactPrice: false` on an exact product → its price shows "Price on Enquiry".
6. Set an intentionally unsorted/partial `priceTiers` → the table still renders sorted and never shows a fake discount; an empty `priceTiers` → falls back to "Price on Enquiry".
7. Confirm a legacy call `<PriceBlock price={100} comparePrice={150} />` still renders exact mode with a 33% off.
8. JSON Server check: `http://localhost:3001/products` shows the pricing fields; toggle `IS_MOCK_API` and confirm identical rendering.

## 11. Notes on preserving existing functionality

- **Honest‑pricing guarantee:** discounts remain derived from real numbers (compare − price, or base‑tier − tier‑price). Never accept an author‑typed "% off".
- **Backward compatibility:** the existing `{ price, comparePrice, currency, size, showSavings, taxNote }` contract and `sm`/`md`/`lg` sizes must keep working for every current caller; `PriceBlock` is used across cards, related, recently‑viewed, and bundles — grep usages before changing prop names, and keep a legacy path.
- **Dual‑mode fidelity:** consume the same field names in both API modes; `PriceBlock` must not fetch or branch on `IS_MOCK_API` itself (upstream `apiService` + `extractData()` own that).
- **Currency:** always `formatCurrency` (INR / `en-IN`) — no manual `₹` string building.
- CSS Modules per component; storefront vs admin palette separation; Blue `#1885d8` / Gold `#fa9c4c` via `--sf-*`.
- No cart/buy/checkout wording enters `PriceBlock`; it is price‑only. Reuse/refactor rather than rewrite.
