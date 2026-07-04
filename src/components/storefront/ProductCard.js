import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import PriceBlock from "./PriceBlock";
import {
  getProductMinPrice,
  isPriceOnEnquiry,
  buildCartItem,
  productPath,
  truncateText,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import styles from "./ProductCard.module.css";

// =============================================================================
// ProductCard — the ONE canonical storefront product card
// =============================================================================
// Used by every product surface: the /products listing (grid + list), the
// homepage Featured/Special bands, /special-offers, and the related /
// you-may-also-like / recently-viewed / bundle carousels. Domain-agnostic — it
// renders whatever real product it is given. Social proof (stars + count) shows
// ONLY when there are real ratings; otherwise it is omitted — never a hollow
// "(0)".
//
// NEBM is an ENQUIRY platform: the single action is an ICON-ONLY "Add to Enquiry
// List" button with a tooltip — no "Add to Cart"/"Buy Now" text, ever. The price
// flows through PriceBlock in card mode (prompt 15): exact → "₹X / unit", tiered
// → "From ₹X / unit" (+ a gold bulk chip), onEnquiry → "Price on Enquiry".
//
// Badges (top-left of the media, stacked, never overlapping the top-right heart):
//   • Special  — GOLD (#fa9c4c). ADDITIVE brand label shown on EVERY surface
//     whenever product.special === true (never gated): a curation flag, not a
//     price change.
//   • Featured / Trending — BLUE chips — and the honest, derived Discount chip
//     are MERCHANDISING badges shown only where the caller opts in via
//     `showBadges` (the listing). The curated homepage bands / carousels leave it
//     off so they stay clean (no "% off" urgency — prompt 11).
//
// Props:
//   product           object  (required)
//   onAddToEnquiry    fn      (cartItem) => void  — omit to hide the button
//   onAddToCart       fn      legacy alias for onAddToEnquiry (kept for callers)
//   onToggleWishlist  fn      (product) => void   — omit to hide the heart
//   isWishlisted      boolean
//   showAddToEnquiry  boolean default true (when a handler is given)
//   showAddToCart     boolean legacy alias override
//   showBadges        boolean default false — reveal Featured/Trending/Discount
//   layout            "grid" | "list"  default "grid"
// =============================================================================
const ProductCard = ({
  product,
  onAddToEnquiry,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  showAddToEnquiry = true,
  showAddToCart,
  showBadges = false,
  layout = "grid",
}) => {
  if (!product) return null;

  const { discount } = getProductMinPrice(product);
  const ratingCount = Number(product.totalReviews) || 0;
  const rating = Number(product.rating) || 0;
  const outOfStock = product.stock === 0;
  const isList = layout === "list";

  // The media "% OFF" chip only makes sense when the card shows a single exact
  // number to discount FROM. A tiered card shows "From ₹X" and an on-enquiry
  // card shows "Price on Enquiry" — neither has a comparable struck price — so
  // the chip is suppressed there, keeping the media badge consistent with the
  // PriceBlock card price (prompt 15 §4.6). isPriceOnEnquiry also covers a
  // "Price on Enquiry" card override on an otherwise-exact product. Legacy
  // products with no priceType default to "exact", so the honest chip still
  // shows exactly as before.
  const showsExactPrice =
    (product.priceType || "exact") === "exact" && !isPriceOnEnquiry(product);
  const showDiscountBadge = showBadges && discount > 0 && showsExactPrice;

  // The add prop was renamed onAddToCart → onAddToEnquiry in prompt 12; both are
  // accepted so existing callers (related/recently-viewed/bundles) keep working.
  const addHandler = onAddToEnquiry || onAddToCart;
  const showAdd = showAddToCart === undefined ? showAddToEnquiry : showAddToCart;
  const enquiryTip = outOfStock ? "Out of Stock" : "Add to Enquiry List";

  return (
    <div className={`${styles.card} ${isList ? styles.cardList : ""}`}>
      <Link
        to={productPath(product)}
        className={styles.media}
        aria-label={product.name}
      >
        <img
          src={product.images?.[0] || product.image || PLACEHOLDER_IMG}
          alt={product.name}
          loading="lazy"
          onError={onImageError}
        />

        {/* Badges — top-left, stacked. Special is always additive; the
            merchandising chips (discount/featured/trending) reveal only when the
            caller opts in via showBadges. */}
        <div className={styles.badges}>
          {showDiscountBadge && (
            <span className={`${styles.badge} ${styles.badgeDiscount}`}>
              {discount}% OFF
            </span>
          )}
          {product.special === true && (
            <span
              className={`${styles.badge} ${styles.badgeSpecial}`}
              title="Special product"
            >
              Special
            </span>
          )}
          {showBadges && product.featured === true && (
            <span className={`${styles.badge} ${styles.badgeFeatured}`}>
              Featured
            </span>
          )}
          {showBadges && product.trending === true && (
            <span className={`${styles.badge} ${styles.badgeTrending}`}>
              Trending
            </span>
          )}
        </div>

        {onToggleWishlist && (
          <button
            type="button"
            className={`${styles.wishlist} ${isWishlisted ? styles.wishlisted : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product);
            }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        )}
      </Link>

      <div className={styles.body}>
        {product.brand && <span className={styles.brand}>{product.brand}</span>}
        <Link to={productPath(product)} className={styles.name}>
          {truncateText(product.name, 48)}
        </Link>

        {isList && product.shortDescription && (
          <p className={styles.desc}>
            {truncateText(product.shortDescription, 120)}
          </p>
        )}

        {ratingCount > 0 && (
          <span className={styles.rating}>
            <StarRating rating={rating} size={13} />
            <span className={styles.ratingCount}>({ratingCount.toLocaleString()})</span>
          </span>
        )}

        <div className={styles.footer}>
          <PriceBlock product={product} mode="card" size="sm" />

          {showAdd && addHandler && (
            <span className={styles.enquiryWrap} data-tip={enquiryTip}>
              <button
                type="button"
                className={styles.enquiryBtn}
                disabled={outOfStock}
                aria-label={enquiryTip}
                onClick={(e) => {
                  e.preventDefault();
                  addHandler(buildCartItem(product));
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2" />
                  <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <path d="M15 11h4M17 9v4M9 12h3M9 16h3" />
                </svg>
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
