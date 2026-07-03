import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as Iconify } from "@iconify/react";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../context/ThemeContext";
import {
  truncateText,
  productPath,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import QuantityStepper from "../../components/storefront/QuantityStepper";
import PriceBlock from "../../components/storefront/PriceBlock";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import styles from "./EnquiryList.module.css";

// Full-page Enquiry List. NEBM customers build an Enquiry List and submit an
// enquiry — they never pay or buy — so this page shows NO totals, shipping,
// taxes or coupons. It is purely presentational over CartContext: it reuses the
// shared QuantityStepper + PriceBlock and edits go through updateQuantity /
// removeFromCart, which the context mirrors (debounced) to the server for
// logged-in users. `getCartTotal` is intentionally NOT read here.
//
// Empty-state illustration is an Icons8 "clouds" illustration; onImageError
// degrades to the inline SVG placeholder if it ever fails to load.
const EMPTY_ILLUSTRATION = "https://img.icons8.com/clouds/256/purchase-order.png";

const EnquiryList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { cartItems, updateQuantity, removeFromCart, getCartItemCount } =
    useCart();

  const items = cartItems || [];
  const count = getCartItemCount ? getCartItemCount() : 0;
  const isEmpty = items.length === 0;

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: "Enquiry List" }]} />

        {/* Header — title + friendly item count */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className={styles.headerLeft}>
            <Iconify
              icon="mdi:clipboard-list-outline"
              className={styles.headerIcon}
              width="30"
              height="30"
              aria-hidden="true"
            />
            <h1 className={styles.title}>Enquiry List</h1>
          </div>
          <p className={styles.subtitle}>
            {isEmpty
              ? "No products added yet"
              : `${count} ${count === 1 ? "product" : "products"} to enquire about`}
          </p>
        </motion.div>

        {/* Body — empty state or the row list */}
        {isEmpty ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <img
              src={EMPTY_ILLUSTRATION}
              alt=""
              className={styles.emptyImage}
              onError={onImageError}
              width={200}
              height={200}
            />
            <h2 className={styles.emptyTitle}>Your Enquiry List is empty</h2>
            <p className={styles.emptyText}>
              Browse our building materials and add products you'd like a quote on.
            </p>
            <button
              type="button"
              className={styles.browseBtn}
              onClick={() => navigate("/products")}
            >
              Browse Products
            </button>
          </motion.div>
        ) : (
          <div className={styles.list}>
            {/* Exit animation consistent with the drawer: `layout` smoothly
                reflows the remaining rows while the removed row fades + slides
                out. The exit animates opacity/x/scale (not height), so it never
                fights the layout animation. */}
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const productHref = productPath(item);
                // Cap the stepper at real stock when known; otherwise unbounded.
                const stockMax =
                  typeof item.stock === "number" && item.stock > 0
                    ? item.stock
                    : Infinity;

                return (
                  <motion.div
                    key={item.id}
                    className={styles.row}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      to={productHref}
                      className={styles.rowImage}
                      aria-label={item.name}
                    >
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt={item.name}
                        onError={onImageError}
                      />
                    </Link>

                    <div className={styles.rowBody}>
                      <div className={styles.rowInfo}>
                        {item.brand && (
                          <span className={styles.brand}>{item.brand}</span>
                        )}
                        <Link to={productHref} className={styles.name}>
                          {truncateText(item.name, 60)}
                        </Link>
                        {item.variantName && (
                          <span className={styles.variant}>
                            {item.variantName}
                          </span>
                        )}

                        {/* Price-mode via the shared PriceBlock (exact / tiered
                            "From" / onEnquiry). Passing the cart line as the
                            product means it stays honest: when the line only
                            carries `price` it renders the exact figure, and a
                            zero/absent price falls back to "Price on Enquiry".
                            Card mode never shows a struck compare/discount, so
                            no discount can be fabricated. No line total. */}
                        <div className={styles.priceWrap}>
                          <PriceBlock
                            product={item}
                            price={item.price}
                            comparePrice={item.comparePrice}
                            currency={item.currency}
                            mode="card"
                            size="md"
                          />
                        </div>
                      </div>

                      <div className={styles.rowControls}>
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.id, q)}
                          min={1}
                          max={stockMax}
                          size="sm"
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from Enquiry List`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span className={styles.removeLabel}>Remove</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Sticky action bar — NO totals/shipping/payment, just the enquiry CTA. */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/products")}
          >
            Continue Browsing
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate("/checkout")}
            disabled={isEmpty}
          >
            <Iconify
              icon="mdi:clipboard-check-outline"
              width="20"
              height="20"
              aria-hidden="true"
            />
            Proceed to Submit Enquiry
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryList;
