import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as Iconify } from "@iconify/react";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/SettingsContext";
import {
  truncateText,
  productPath,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import QuantityStepper from "../storefront/QuantityStepper";
import EmptyState from "../EmptyState/EmptyState";
import styles from "./CartDrawer.module.css";

// Enquiry List drawer. NEBM customers build an Enquiry List and submit an enquiry —
// they never pay or check out to buy, so this drawer shows NO totals, shipping,
// free-shipping banner or checkout UI. It keeps multi-product management (quantity
// via the shared QuantityStepper + remove) and a single "Submit Enquiry" CTA that
// hands off to the /checkout route (repurposed into the enquiry submit flow).
// The internal `cart*` names are retained on purpose — see CartContext.js.
const CartDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { formatPrice } = useCurrency();
  // getCartTotal is intentionally NOT read here — an enquiry has no monetary total.
  const { cartItems, updateQuantity, removeFromCart, getCartItemCount } =
    useCart();

  const cart = cartItems || [];
  const cartCount = getCartItemCount ? getCartItemCount() : 0;

  // Lock body scroll while the drawer is open so the page behind it can't move.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const themeClass = isDarkMode ? styles.dark : styles.light;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            className={`${styles.drawer} ${themeClass}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <Iconify
                  icon="mdi:clipboard-list-outline"
                  className={styles.headerIcon}
                  width="24"
                  height="24"
                />
                <h2 className={styles.title}>Enquiry List</h2>
                {cartCount > 0 && (
                  <span className={styles.itemCount}>{cartCount}</span>
                )}
              </div>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close Enquiry List"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Enquiry List items */}
            <div className={styles.itemsContainer}>
              {cart.length === 0 ? (
                <EmptyState
                  compact
                  icon="mdi:clipboard-text-outline"
                  title="Your Enquiry List is empty"
                  description="Add building materials you're interested in and send us one enquiry."
                  action={{
                    label: "Browse Products",
                    onClick: () => handleNavigate("/products"),
                  }}
                />
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item) => {
                    const hasDiscount =
                      item.comparePrice && item.comparePrice > item.price;
                    const productHref = productPath(item);
                    const stockMax =
                      typeof item.stock === "number" && item.stock > 0
                        ? item.stock
                        : Infinity;

                    return (
                      <motion.div
                        key={item.id}
                        className={styles.cartItem}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          x: -40,
                          height: 0,
                          marginBottom: 0,
                          padding: 0,
                          overflow: "hidden",
                        }}
                        transition={{ duration: 0.25 }}
                      >
                        <div
                          className={styles.itemImage}
                          onClick={() => handleNavigate(productHref)}
                        >
                          <img
                            src={item.image || PLACEHOLDER_IMG}
                            alt={item.name}
                            onError={onImageError}
                          />
                        </div>

                        <div className={styles.itemDetails}>
                          <div className={styles.itemMeta}>
                            <h4
                              className={styles.itemName}
                              onClick={() => handleNavigate(productHref)}
                            >
                              {truncateText(item.name, 45)}
                            </h4>
                            {item.variantName && (
                              <span className={styles.itemVariant}>
                                {item.variantName}
                              </span>
                            )}
                          </div>

                          {/* Per-item price is informational only — no line total
                              is computed and no cart subtotal is shown. */}
                          <div className={styles.itemPricing}>
                            <span className={styles.itemPrice}>
                              {formatPrice(item.price)}
                            </span>
                            {hasDiscount && (
                              <span className={styles.itemComparePrice}>
                                {formatPrice(item.comparePrice)}
                              </span>
                            )}
                          </div>

                          <div className={styles.itemBottom}>
                            <QuantityStepper
                              value={item.quantity}
                              onChange={(q) => updateQuantity(item.id, q)}
                              min={1}
                              max={stockMax}
                              size="sm"
                            />

                            <button
                              className={styles.removeBtn}
                              onClick={() => handleRemoveItem(item.id)}
                              aria-label="Remove item"
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
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — "Submit Enquiry" CTA + a link to the full Enquiry List
                page (no totals/shipping/checkout). */}
            {cart.length > 0 && (
              <div className={styles.footer}>
                <button
                  className={styles.submitBtn}
                  onClick={() => handleNavigate("/checkout")}
                >
                  <Iconify
                    icon="mdi:clipboard-check-outline"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  />
                  Submit Enquiry
                </button>
                <button
                  className={styles.viewListBtn}
                  onClick={() => handleNavigate("/enquiry-list")}
                >
                  View Enquiry List
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
