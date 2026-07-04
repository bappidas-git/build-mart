import React from "react";
import { formatCurrency, getProductMinPrice } from "../../utils/helpers";
import styles from "./PriceBlock.module.css";

// =============================================================================
// PriceBlock — honest, transparent, priceType-aware pricing
// =============================================================================
// One presentational component that renders NEBM's three pricing models from
// real product fields, in a COMPACT card form or the FULL details form:
//
//   • exact     — a fixed price with an optional `unitType` suffix (₹520.00 /
//                 piece). In details/legacy it also shows the struck compare +
//                 a DERIVED "% off" and (on lg/details) a "You save ₹X" line —
//                 only ever when comparePrice > price. `showExactPrice === false`
//                 hides the number → "Price on Enquiry".
//   • tiered    — IndiaMART-style bulk pricing. Card → compact "From ₹X / unit"
//                 (+ a gold "Bulk pricing" chip). Details → a quantity-vs-price
//                 TABLE from `priceTiers[{minQty,price}]` (sorted), with per-unit
//                 discounts COMPUTED against the base (smallest-qty) tier and a
//                 `minQty` minimum-order line.
//   • onEnquiry — a calm "Price on Enquiry" pill, no number (both modes). Also
//                 the fallback when an exact product hides its price, or a tiered
//                 product has no usable tiers.
//
// Honest-pricing guarantee (unchanged): every discount is derived from real
// numbers ((compare − price) or (baseTier − tier)); an author can never type a
// fake "% off".
//
// cardPriceMode (per-product display override) accepted values:
//   "exact"     → force the compact fixed price (card only)
//   "from"      → force the compact "From ₹X" (tiered) presentation (card only)
//   "onEnquiry" → withhold the price as "Price on Enquiry" — applied on the card
//                 AND in details, so the number is never exposed on the product
//                 page after a card promised "Price on Enquiry"
//   unset       → the natural presentation for `priceType`
//
// Props:
//   product       object   pricing source (priceType/unitType/minQty/priceTiers/
//                          showExactPrice/showTieredPricing/cardPriceMode + price).
//                          Omit for a legacy call — behaves exactly as before.
//   mode          "card" | "details"  compact vs full (default "card")
//   price         number   current/selling price — overrides product (PDP variant)
//   comparePrice  number   original price — overrides product
//   currency      string   ISO code (default "INR")
//   size          "sm"|"md"|"lg"  visual scale (default "lg")
//   showSavings   boolean  show the "You save ₹X" line (default true on lg)
//   taxNote       string   optional transparency note (never shown on onEnquiry)
// =============================================================================

// Pluralize a unit for the "Minimum order: N pieces" line. "kg" is invariant.
const UNIT_PLURALS = { box: "boxes" };
const pluralizeUnit = (unit, qty) => {
  if (!unit) return "";
  if (qty === 1 || unit === "kg" || unit.endsWith("s")) return unit;
  return UNIT_PLURALS[unit] || `${unit}s`;
};

// Sanitize + sort the tier ladder: numeric minQty/price, price > 0, ascending
// by minQty — so an unsorted or partly-malformed `priceTiers` still renders
// cleanly (and an all-invalid one collapses to []).
const normalizeTiers = (tiers) =>
  (Array.isArray(tiers) ? tiers : [])
    .map((t) => ({ minQty: Number(t?.minQty), price: Number(t?.price) }))
    .filter(
      (t) => Number.isFinite(t.minQty) && Number.isFinite(t.price) && t.price > 0
    )
    .sort((a, b) => a.minQty - b.minQty);

const PriceBlock = ({
  product = null,
  mode = "card",
  price = 0,
  comparePrice = 0,
  currency = "INR",
  size = "lg",
  showSavings,
  taxNote,
}) => {
  const p = product || {};
  const priceType = p.priceType || "exact";
  const unitType = p.unitType || null;
  const minQty = Number(p.minQty) || 1;
  const showExactPrice = p.showExactPrice !== false; // default true (legacy safe)
  const showTieredPricing = p.showTieredPricing !== false; // default true
  const cardPriceMode = p.cardPriceMode; // "exact" | "from" | "onEnquiry" | undefined
  const tiers = normalizeTiers(p.priceTiers);

  // Representative current/compare numbers. An explicit `price`/`comparePrice`
  // prop (the PDP's variant-adjusted figure, or a legacy caller) always wins;
  // otherwise derive honestly from the product via getProductMinPrice.
  const derived = product ? getProductMinPrice(product) : null;
  const current =
    Number(price) > 0 ? Number(price) : derived ? derived.sellingPrice : 0;
  const compare =
    Number(comparePrice) > 0
      ? Number(comparePrice)
      : derived && derived.originalPrice > derived.sellingPrice
      ? derived.originalPrice
      : 0;

  // Lowest per-unit tier price for the compact "From ₹X" card (falls back to the
  // representative min price when tiers are absent).
  const minTierPrice = tiers.length
    ? Math.min(...tiers.map((t) => t.price))
    : current;

  const unitSuffix = unitType ? (
    <span className={styles.unit}> / {unitType}</span>
  ) : null;

  // ---- Resolve which of the three displays to render -----------------------
  const resolveDisplay = () => {
    let type = priceType;
    // "Price on Enquiry" is a WITHHOLD-the-price intent, not a card cosmetic —
    // honor it in BOTH the compact card and the full details view so the price
    // is never exposed on the product page after a card promised "on enquiry".
    if (cardPriceMode === "onEnquiry") return "onEnquiry";
    // The remaining card overrides only restyle the compact card's price; they
    // never apply in details (which always shows the natural full presentation).
    if (mode === "card" && cardPriceMode) {
      if (cardPriceMode === "from") type = "tiered";
      else if (cardPriceMode === "exact") type = "exact";
    }
    if (type === "onEnquiry") return "onEnquiry";
    if (type === "tiered") return tiers.length ? "tiered" : "onEnquiry";
    // exact
    if (!showExactPrice) return "onEnquiry"; // merchant chose to hide the number
    if (product && !(current > 0)) return "onEnquiry"; // product with no usable price
    return "exact";
  };
  const display = resolveDisplay();

  // ---------- onEnquiry -----------------------------------------------------
  if (display === "onEnquiry") {
    return (
      <div className={`${styles.block} ${styles[size]}`}>
        <span className={styles.enquiry}>Price on Enquiry</span>
      </div>
    );
  }

  // ---------- tiered --------------------------------------------------------
  if (display === "tiered") {
    // Card, or a details view where the merchant hid the table → compact "From".
    if (mode === "card" || !showTieredPricing) {
      return (
        <div className={`${styles.block} ${styles[size]}`}>
          <div className={styles.row}>
            <span className={styles.price}>
              <span className={styles.from}>From </span>
              {formatCurrency(minTierPrice, currency)}
              {unitSuffix}
            </span>
            {mode === "card" && <span className={styles.bulkChip}>Bulk pricing</span>}
          </div>
        </div>
      );
    }

    // Details → the full quantity-vs-price table. Per-unit discount is computed
    // against the base (smallest-qty) tier; the base row shows "—". The
    // best-value (highest-discount) row is highlighted gold.
    const base = tiers[0].price;
    let bestIdx = -1;
    let bestDisc = 0;
    const rows = tiers.map((t, i) => {
      const next = tiers[i + 1];
      const end = next ? next.minQty - 1 : null;
      const label =
        next == null
          ? `${t.minQty}+`
          : end > t.minQty
          ? `${t.minQty}–${end}`
          : `${t.minQty}`;
      const disc = base > t.price ? Math.round(((base - t.price) / base) * 100) : 0;
      if (disc > 0 && disc >= bestDisc) {
        bestDisc = disc;
        bestIdx = i;
      }
      return { label, price: t.price, disc };
    });

    return (
      <div className={`${styles.block} ${styles[size]} ${styles.tiered}`}>
        {minQty > 1 && (
          <div className={styles.minOrder}>
            Minimum order: {minQty} {pluralizeUnit(unitType, minQty)}
          </div>
        )}
        {/* Scroll wrapper keeps the tier table from ever breaking the layout on
            narrow phones — it scrolls horizontally within its own bounds. */}
        <div className={styles.tierTableWrap}>
          <table className={styles.tierTable}>
            <thead>
              <tr>
                <th scope="col">Quantity</th>
                <th scope="col" className={styles.numCol}>
                  Price{unitType ? ` / ${unitType}` : ""}
                </th>
                <th scope="col" className={styles.numCol}>
                  Discount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i === bestIdx ? styles.bestRow : undefined}>
                  <td>{r.label}</td>
                  <td className={styles.numCol}>{formatCurrency(r.price, currency)}</td>
                  <td className={styles.numCol}>
                    {r.disc > 0 ? (
                      <span className={styles.tierDiscount}>{r.disc}% off</span>
                    ) : (
                      <span className={styles.tierBase}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------- exact ---------------------------------------------------------
  const hasDiscount = compare > current && current > 0;
  const discount = hasDiscount
    ? Math.round(((compare - current) / compare) * 100)
    : 0;
  const savings = hasDiscount ? compare - current : 0;
  // The compact card shows a single clean number (the honest "% off" lives on
  // the card's media badge — §4.6); the struck compare/savings are for the
  // details view and legacy callers (no product).
  const compact = Boolean(product) && mode === "card";
  const wantSavings = !compact && (showSavings ?? size === "lg");

  return (
    <div className={`${styles.block} ${styles[size]}`}>
      <div className={styles.row}>
        <span className={styles.price}>
          {formatCurrency(current, currency)}
          {unitSuffix}
        </span>
        {hasDiscount && !compact && (
          <>
            <span className={styles.compare}>
              {formatCurrency(compare, currency)}
            </span>
            <span className={styles.discount}>{discount}% off</span>
          </>
        )}
      </div>
      {hasDiscount && wantSavings && (
        <div className={styles.savings}>
          You save {formatCurrency(savings, currency)}
        </div>
      )}
      {taxNote && <div className={styles.taxNote}>{taxNote}</div>}
    </div>
  );
};

export default PriceBlock;
