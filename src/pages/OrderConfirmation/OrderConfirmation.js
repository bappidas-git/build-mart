import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/SettingsContext";
import apiService from "../../services/api";
import { formatDate } from "../../utils/helpers";
import styles from "./OrderConfirmation.module.css";

// North East Build Mart contact numbers — the team reaches out on these after
// an enquiry lands. Both render as tappable tel: links.
const PHONE_NUMBERS = ["+91 86385 43526", "+91 88762 89972"];
const telHref = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;

const EnquiryConfirmation = () => {
  // Preferred route carries :enquiryNumber; the legacy /order-confirmation path
  // still resolves here with :orderNumber, so accept either as the reference.
  const { enquiryNumber, orderNumber } = useParams();
  const refParam = enquiryNumber || orderNumber;
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { formatPrice } = useCurrency();

  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    fetchEnquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam]);

  useEffect(() => {
    if (enquiry) {
      const timer = setTimeout(() => setShowCheck(true), 300);
      return () => clearTimeout(timer);
    }
  }, [enquiry]);

  // A subtle, one-shot celebration once the enquiry loads. canvas-confetti is
  // imported lazily so a missing/broken module can never block the screen from
  // rendering, and the burst is skipped entirely under reduced-motion.
  useEffect(() => {
    if (!enquiry || confettiFired.current) return;
    confettiFired.current = true;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cancelled = false;
    import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return;
        confetti({
          particleCount: 60,
          spread: 65,
          startVelocity: 38,
          ticks: 160,
          origin: { y: 0.35 },
          colors: ["#1885d8", "#4ea3e3", "#fa9c4c"],
          disableForReducedMotion: true,
        });
      })
      .catch(() => {
        /* confetti is optional — never surface a failure to the user */
      });
    return () => {
      cancelled = true;
    };
  }, [enquiry]);

  const fetchEnquiry = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Dual-mode read: mock queries /enquiries?enquiryNumber= and returns the
      // first row; Laravel hits /enquiries/number/:n. Unwrap the same way the
      // rest of the app does, tolerating either shape.
      const response = await apiService.orders.getByOrderNumber(refParam);
      const data = response?.data || response?.order || response;
      setEnquiry(data || null);
    } catch (err) {
      // A failed request is not "enquiry not found" — offer a retry instead.
      console.error("Failed to fetch enquiry:", err);
      setEnquiry(null);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = () => {
    const text = enquiry?.enquiryNumber || enquiry?.orderNumber || refParam;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Price mode per item — enquiries never carry money totals, only how each
  // line will be quoted.
  const renderPriceMode = (item) => {
    if (item.priceType === "exact" && item.price != null) {
      return (
        <span className={styles.itemPrice}>
          {formatPrice(item.price)}
          {item.unitType ? (
            <span className={styles.itemUnit}> / {item.unitType}</span>
          ) : null}
        </span>
      );
    }
    if (item.priceType === "tiered") {
      return <span className={styles.itemPriceMuted}>Tiered pricing</span>;
    }
    return <span className={styles.itemPriceMuted}>Price on Enquiry</span>;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading your enquiry...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch failed — distinct from "not found" so a flaky network never claims
  // the enquiry doesn't exist.
  if (fetchError) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>
              <Iconify icon="mdi:alert-circle-outline" width="64" height="64" />
            </div>
            <h2>Couldn't Load Your Enquiry</h2>
            <p>
              Something went wrong while fetching enquiry {refParam}. Please
              check your connection and try again.
            </p>
            <div className={styles.notFoundActions}>
              <button className={styles.btnPrimary} onClick={fetchEnquiry}>
                Try Again
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/orders")}
              >
                View My Enquiries
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enquiry not found
  if (!enquiry) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>
              <Iconify icon="mdi:file-search-outline" width="64" height="64" />
            </div>
            <h2>Enquiry Not Found</h2>
            <p>
              We couldn't find the enquiry you're looking for. It may have been
              submitted in a different session.
            </p>
            <div className={styles.notFoundActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate("/products")}
              >
                Continue Browsing
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/orders")}
              >
                View My Enquiries
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const enquiryItems = enquiry.items || [];
  const reference = enquiry.enquiryNumber || enquiry.orderNumber || refParam;
  const contact = enquiry.contact || {};

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* Success Animation */}
        <motion.div
          className={styles.successSection}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.6 }}
        >
          <div className={`${styles.checkCircle} ${showCheck ? styles.checkCircleActive : ""}`}>
            <svg
              className={styles.checkSvg}
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className={styles.successTitle}>Enquiry submitted</h1>
          <p className={styles.successSubtext}>
            Thanks! Your enquiry has been received. Our team will review it and
            get back to you shortly.
          </p>
        </motion.div>

        {/* Enquiry Reference (Prominent + Copyable) */}
        <motion.div
          className={styles.orderNumberBanner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className={styles.orderNumberLabel}>Enquiry Reference</span>
          <div className={styles.orderNumberRow}>
            <span className={styles.orderNumberValue}>{reference}</span>
            <button className={styles.btnCopyBanner} onClick={handleCopyReference}>
              {copied ? (
                <>
                  <Iconify icon="mdi:check" width="16" height="16" />
                  Copied!
                </>
              ) : (
                <>
                  <Iconify icon="mdi:content-copy" width="16" height="16" />
                  Copy
                </>
              )}
            </button>
          </div>
          {enquiry.createdAt && (
            <div className={styles.orderMeta}>
              <span>Submitted on {formatDate(enquiry.createdAt)}</span>
            </div>
          )}
        </motion.div>

        <div className={styles.contentGrid}>
          {/* Left Column — Enquiry Summary */}
          <div className={styles.mainColumn}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Iconify icon="mdi:clipboard-text-outline" width="20" height="20" />
                  Enquiry Summary
                </h3>
                <span className={styles.itemCount}>
                  {enquiryItems.length} item{enquiryItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.itemsList}>
                  {enquiryItems.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemImage}>
                        <img
                          src={item.image || "https://placehold.co/72x72?text=Item"}
                          alt={item.name || "Product"}
                        />
                      </div>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>
                          {item.name || item.productName}
                        </span>
                        {item.variantName && (
                          <span className={styles.itemVariant}>{item.variantName}</span>
                        )}
                        <span className={styles.itemQty}>Qty: {item.quantity}</span>
                      </div>
                      <div className={styles.itemPriceCell}>{renderPriceMode(item)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column — Next steps + CTAs */}
          <div className={styles.sideColumn}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Iconify icon="mdi:progress-check" width="20" height="20" />
                  What happens next
                </h3>
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.nextSteps}>
                  <li className={styles.nextStepRow}>
                    <Iconify
                      className={styles.nextStepIcon}
                      icon="mdi:file-document-check-outline"
                      width="20"
                      height="20"
                    />
                    <span>
                      Our team will review your enquiry and prepare a quotation.
                    </span>
                  </li>
                  <li className={styles.nextStepRow}>
                    <Iconify
                      className={styles.nextStepIcon}
                      icon="mdi:phone-outline"
                      width="20"
                      height="20"
                    />
                    <span>
                      We'll contact you on{" "}
                      <a className={styles.telLink} href={telHref(PHONE_NUMBERS[0])}>
                        {PHONE_NUMBERS[0]}
                      </a>{" "}
                      /{" "}
                      <a className={styles.telLink} href={telHref(PHONE_NUMBERS[1])}>
                        {PHONE_NUMBERS[1]}
                      </a>
                      .
                    </span>
                  </li>
                </ul>

                {(contact.name || contact.phone) && (
                  <div className={styles.contactBadge}>
                    <Iconify icon="mdi:account-outline" width="16" height="16" />
                    <span>
                      We'll reach out to:{" "}
                      <strong>
                        {[contact.name, contact.phone].filter(Boolean).join(" · ")}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className={styles.actionsCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button className={styles.btnBrowse} onClick={() => navigate("/products")}>
                <Iconify icon="mdi:storefront-outline" width="18" height="18" />
                Continue Browsing
              </button>
              <button className={styles.btnContinue} onClick={() => navigate("/orders")}>
                <Iconify icon="mdi:format-list-bulleted" width="18" height="18" />
                View My Enquiries
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryConfirmation;
