import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/helpers";
import { PLACEHOLDER_IMG, onImageError } from "../../utils/helpers";
import styles from "./AddToCartBar.module.css";

// =============================================================================
// AddToCartBar — persistent mobile Add-to-Enquiry bar (mobile-first)
// =============================================================================
// On phones the primary action must always be a thumb away. This bar pins the
// price + the "Add to Enquiry List" ICON button to the bottom of the screen and
// reveals itself once the in-page buy box scrolls out of view (tracked via
// IntersectionObserver on `anchorRef`). It shows the REAL selected price and is
// disabled when the real selection is out of stock — it asserts nothing the buy
// box doesn't. NEBM is an enquiry platform: there is no "Buy Now" here, and the
// action carries no visible label text (the tooltip + aria-label name it).
//
// Props:
//   anchorRef    ref      element whose visibility toggles the bar (the buy box)
//   price        number   current selected price (real)
//   comparePrice number   optional
//   onEnquiry    boolean  the price is withheld — show "Price on Enquiry", no number
//   currency     string
//   image,name   string   small product thumbnail/label
//   disabled     boolean  out of stock
//   ctaLabel     string   accessible label + tooltip (default "Add to Enquiry List")
//   onAddToCart  fn       adds the current selection to the Enquiry List
// =============================================================================
const AddToCartBar = ({
  anchorRef,
  price = 0,
  comparePrice = 0,
  onEnquiry = false,
  currency = "INR",
  image,
  name,
  disabled = false,
  ctaLabel = "Add to Enquiry List",
  onAddToCart,
}) => {
  const [showBar, setShowBar] = useState(false);
  const [added, setAdded] = useState(false);

  // Reveal the bar only after the in-page buy box has scrolled away.
  useEffect(() => {
    const el = anchorRef?.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShowBar(true); // graceful fallback: always available on mobile
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting),
      { rootMargin: "0px 0px -10% 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [anchorRef]);

  const handleAdd = () => {
    if (disabled) return;
    onAddToCart?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const hasCompare = !onEnquiry && comparePrice > price && price > 0;

  return (
    <div
      className={`${styles.bar} ${showBar ? styles.visible : ""}`}
      aria-hidden={!showBar}
    >
      <div className={styles.info}>
        {image && (
          <img
            className={styles.thumb}
            src={image || PLACEHOLDER_IMG}
            alt=""
            onError={onImageError}
          />
        )}
        <div className={styles.priceWrap}>
          {name && <span className={styles.name}>{name}</span>}
          <span className={styles.priceRow}>
            {onEnquiry ? (
              <span className={styles.price}>Price on Enquiry</span>
            ) : (
              <>
                <span className={styles.price}>{formatCurrency(price, currency)}</span>
                {hasCompare && (
                  <span className={styles.compare}>
                    {formatCurrency(comparePrice, currency)}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <span
          className={styles.addWrap}
          data-tip={disabled ? "Out of Stock" : added ? "Added ✓" : ctaLabel}
        >
          <button
            type="button"
            className={`${styles.addBtn} ${added ? styles.addBtnDone : ""}`}
            onClick={handleAdd}
            disabled={disabled}
            aria-label={ctaLabel}
            tabIndex={showBar ? 0 : -1}
          >
            {added ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2" />
                <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <path d="M15 11h4M17 9v4M9 12h3M9 16h3" />
              </svg>
            )}
          </button>
        </span>
      </div>
    </div>
  );
};

export default AddToCartBar;
