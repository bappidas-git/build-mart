import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useOrder } from "../../context/OrderContext";
import {
  productPath,
  PLACEHOLDER_IMG,
  onImageError,
  isValidPhone,
  isEmailValid,
} from "../../utils/helpers";
import PriceBlock from "../../components/storefront/PriceBlock";
import QuantityStepper from "../../components/storefront/QuantityStepper";
import styles from "./Checkout.module.css";

// =============================================================================
// SubmitEnquiry — NEBM's single-step "Submit Enquiry" screen (route /checkout)
// =============================================================================
// NEBM is an e-commerce-STYLE enquiry platform, not a store: customers build an
// Enquiry List (the repurposed cart) and send an enquiry — they never pay, ship
// or check out to buy. So this page has NO payment / shipping / coupon / tax /
// store-credit UI and renders NO subtotal or grand total. It shows an "Enquiry
// Summary" (each item's quantity + honest price mode via PriceBlock) plus a
// contact + note block, and posts a pure enquiry payload through
// OrderContext.createOrder → apiService.orders.create. Because that payload omits
// every money/payment/coupon/wallet field (and is flagged `type: "enquiry"`),
// the mock createPaymentForOrder / redeemCouponByCode / debitWallet side effects
// never fire. Guests can submit (userId: null); logged-in users get prefilled
// contact and their enquiry linked to their userId.

const NEBM_PHONES = ["+91 86385 43526", "+91 88762 89972"];

const SubmitEnquiry = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { cartItems, getCartItemCount, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { user } = useAuth();
  const { createOrder } = useOrder();

  // Contact + note (prompt 19). Name & phone required, email optional/valid.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  // Guards the empty state from flashing in the tick between clearCart and the
  // navigate to the success page.
  const [submitted, setSubmitted] = useState(false);

  // Prefill contact for signed-in users without clobbering edits or the guest
  // path — only fill a field that is still empty (auth may hydrate after mount).
  useEffect(() => {
    if (!user) return;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    setName((v) => v || fullName);
    setPhone((v) => v || user.phone || "");
    setEmail((v) => v || user.email || "");
  }, [user]);

  const clearError = (key) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Please enter your name";
    if (!phone.trim()) errs.phone = "Please enter your phone number";
    else if (!isValidPhone(phone))
      errs.phone = "Enter a valid 10-digit mobile number";
    if (email.trim() && !isEmailValid(email))
      errs.email = "Enter a valid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitEnquiry = async () => {
    if (cartItems.length === 0) return;
    if (!validate()) return;

    setIsProcessing(true);
    try {
      // Pure enquiry payload: contact, items, note, status — and nothing that
      // implies money (no subtotal/discount/coupon/shipping/tax/total/
      // storeCredit/payment/address). `type: "enquiry"` is the explicit flag the
      // API layer branches on to skip the payment/coupon/wallet side effects.
      const enquiryData = {
        type: "enquiry",
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: `${item.name}${item.variantName ? ` - ${item.variantName}` : ""}`,
          image: item.image,
          sku: item.sku || "",
          quantity: item.quantity,
          priceType: item.priceType || "onEnquiry",
          unitType: item.unitType || null,
          // Only an exact-priced item carries a number; tiered / on-enquiry
          // items are quoted by our team, so no price is captured here.
          price: item.priceType === "exact" ? item.price : null,
        })),
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
        },
        notes: note.trim(),
        status: "New",
      };

      const result = await createOrder(enquiryData);
      if (result.success) {
        setSubmitted(true);
        clearCart({ silent: true });
        const ref =
          result.order.enquiryNumber ||
          result.order.orderNumber ||
          result.order.id;
        navigate(`/order-confirmation/${ref}`);
      }
    } catch (e) {
      console.error("Submit enquiry error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (cartItems.length === 0 && !submitted) {
    return (
      <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.emptyState}>
          <Iconify
            icon="mdi:clipboard-text-outline"
            className={styles.emptyIcon}
            width="72"
            height="72"
            aria-hidden="true"
          />
          <h2>Your Enquiry List is empty</h2>
          <p>Add products to your Enquiry List to send an enquiry.</p>
          <Link to="/products" className={styles.browseBtn}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link> <span>/</span>{" "}
        <Link to="/enquiry-list">Enquiry List</Link> <span>/</span>{" "}
        <span>Submit Enquiry</span>
      </div>

      <motion.div
        className={styles.pageHead}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className={styles.pageTitle}>Submit Enquiry</h1>
        <p className={styles.pageSubtitle}>
          Review your list and share your requirements — our team will get back
          to you with a quote. No payment needed.
        </p>
      </motion.div>

      <div className={styles.layout}>
        {/* Main column */}
        <div className={styles.mainContent}>
          {/* Enquiry Summary */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Enquiry Summary</h2>
            <div className={styles.items}>
              {cartItems.map((item) => {
                const stockMax =
                  typeof item.stock === "number" && item.stock > 0
                    ? item.stock
                    : Infinity;
                const href = productPath(item);
                return (
                  <div key={item.id} className={styles.item}>
                    <Link
                      to={href}
                      className={styles.itemImageLink}
                      aria-label={item.name}
                    >
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt={item.name}
                        onError={onImageError}
                        className={styles.itemImage}
                      />
                    </Link>

                    <div className={styles.itemInfo}>
                      <Link to={href} className={styles.itemName}>
                        {item.name}
                      </Link>
                      {item.variantName && (
                        <p className={styles.variant}>{item.variantName}</p>
                      )}
                      {/* Honest price mode via the shared PriceBlock: exact
                          ₹/unit, tiered "From ₹X" + Bulk-pricing chip (links to
                          the product for the full table), or "Price on Enquiry".
                          Card mode never fabricates a discount, and there is no
                          line total. */}
                      <div className={styles.itemPrice}>
                        <PriceBlock
                          product={item}
                          price={item.price}
                          comparePrice={item.comparePrice}
                          currency={item.currency}
                          mode="card"
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className={styles.itemControls}>
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
                        aria-label={`Remove ${item.name} from your Enquiry List`}
                      >
                        <Iconify
                          icon="mdi:trash-can-outline"
                          width="18"
                          height="18"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact + note (prompt 19) */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Your Details</h2>
            <p className={styles.cardHint}>
              Tell us who to contact about this enquiry.
            </p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="enq-name">Name *</label>
                <input
                  id="enq-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError("name");
                  }}
                  placeholder="Your full name"
                  className={errors.name ? styles.inputError : ""}
                />
                {errors.name && (
                  <span className={styles.fieldError}>{errors.name}</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="enq-phone">Phone *</label>
                <input
                  id="enq-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError("phone");
                  }}
                  placeholder="+91 98765 43210"
                  className={errors.phone ? styles.inputError : ""}
                />
                {errors.phone && (
                  <span className={styles.fieldError}>{errors.phone}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="enq-email">
                Email <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="enq-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                placeholder="you@example.com"
                className={errors.email ? styles.inputError : ""}
              />
              {errors.email && (
                <span className={styles.fieldError}>{errors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="enq-note">Message / Requirements</label>
              <textarea
                id="enq-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Quantities, sizes, delivery location, timeline, or any specific requirements…"
                className={styles.textarea}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHead}>
              <Iconify
                icon="mdi:clipboard-list-outline"
                width="22"
                height="22"
                aria-hidden="true"
              />
              <span>Items ({getCartItemCount()})</span>
            </div>
            <p className={styles.summaryNote}>
              Submitting sends your list to our team for a quote — you won't be
              charged.
            </p>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSubmitEnquiry}
              disabled={isProcessing || cartItems.length === 0}
            >
              <Iconify
                icon="mdi:clipboard-check-outline"
                width="20"
                height="20"
                aria-hidden="true"
              />
              {isProcessing ? "Submitting…" : "Submit Enquiry"}
            </button>

            <div className={styles.callUs}>
              <span className={styles.callUsLabel}>Questions? Call us</span>
              {NEBM_PHONES.map((num) => (
                <a
                  key={num}
                  href={`tel:${num.replace(/\s/g, "")}`}
                  className={styles.callUsPhone}
                >
                  <Iconify
                    icon="mdi:phone-outline"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  />
                  {num}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SubmitEnquiry;
