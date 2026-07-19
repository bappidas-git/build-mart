import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import HeroSection from "../../components/HeroSection/HeroSection";
import CTASection from "../../components/CTASection/CTASection";
import TestimonialsSection from "../../components/testimonials/TestimonialsSection";
import ProductCard from "../../components/storefront/ProductCard";
import {
  APP_NAME,
  WHY_CHOOSE_US,
  PROJECT_IMAGE_URL,
  TRUST_IMAGE_URL,
} from "../../utils/constants";
import { useStoreContact } from "../../context/SettingsContext";
import { onImageError } from "../../utils/helpers";
import styles from "./Home.module.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Must match the key written by ProductDetails.js so viewing a product
// populates this list end-to-end.
const RECENTLY_VIEWED_KEY = "recentlyViewed";

const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const SectionHeader = ({ title, subtitle, kicker, linkText, linkTo }) => (
  <div className={styles.sectionHeader}>
    <div>
      {kicker && <span className={styles.sectionKicker}>{kicker}</span>}
      <h2 className={styles.sectionTitle}>{title}</h2>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
    {linkText && linkTo && (
      <Link to={linkTo} className={styles.viewAllLink}>
        {linkText} &rarr;
      </Link>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE  (NEBM — enquiry model, no deals/checkout merchandising)
// ══════════════════════════════════════════════════════════════════════════════

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  // Contact CTA reads the store phone/address from admin Settings → General.
  const { address, phones, phone, telHref } = useStoreContact();

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [specialProducts, setSpecialProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  // Distinguishes "the catalog couldn't load" (API unreachable — e.g. the mock
  // server isn't running) from "the catalog is genuinely empty". Drives the
  // retryable panel in the Shop-by-Category section instead of a silent blank.
  const [catalogError, setCatalogError] = useState(false);

  // ── Data fetching (dual-mode via apiService + extractData) ─────────────────

  // Retryable — the error panel's "Try Again" button and the focus/online
  // auto-recovery below both call this.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setCatalogError(false);
    try {
      // allSettled (not all) so one failing band never blanks the others, and so
      // we can tell an unreachable API (rejected) apart from an empty-but-live
      // catalog (fulfilled with []).
      const [catsRes, featuredRes, specialRes] = await Promise.allSettled([
        apiService.categories.getAll(),
        apiService.products.getFeatured(8),
        // Special Products band shares ONE data source with the /special-offers
        // collection page: the dual-mode getSpecial (products flagged
        // `special: true`).
        apiService.products.getSpecial(8),
      ]);

      const valueOr = (res) =>
        res.status === "fulfilled" && Array.isArray(res.value) ? res.value : [];

      // Top-level NEBM categories only (no hardcoded list).
      setCategories(
        valueOr(catsRes).filter((c) => !c.parentId && c.isActive !== false)
      );
      setFeaturedProducts(valueOr(featuredRes).slice(0, 8));
      setSpecialProducts(valueOr(specialRes).slice(0, 8));

      // Treat the catalog as failed only when the API is genuinely unreachable:
      // the categories fetch rejected (a connection error throws; a reachable-but-
      // empty catalog resolves fulfilled with []). This is the "no main-menu
      // categories, no product cards" symptom made visible and recoverable.
      setCatalogError(catsRes.status === "rejected");
    } catch (err) {
      console.error("Error fetching home data:", err);
      setCatalogError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the latest error state readable from the (stable) recovery listeners
  // without re-subscribing on every fetch.
  const catalogErrorRef = useRef(false);
  useEffect(() => {
    catalogErrorRef.current = catalogError;
  }, [catalogError]);

  useEffect(() => {
    fetchData();
    setRecentlyViewed(getRecentlyViewed());
    // Self-healing: if the catalog failed to load (e.g. the mock API wasn't up
    // yet), refetch when the tab regains focus or connectivity returns, so the
    // storefront recovers on its own once the backend is reachable — no reload.
    const recover = () => {
      if (catalogErrorRef.current) fetchData();
    };
    window.addEventListener("focus", recover);
    window.addEventListener("online", recover);
    return () => {
      window.removeEventListener("focus", recover);
      window.removeEventListener("online", recover);
    };
  }, [fetchData]);

  // ── Enquiry-list quick-add ─────────────────────────────────────────────────
  // The shared ProductCard passes a fully-built cart line (buildCartItem), so a
  // homepage quick-add merges with PDP adds and the localStorage "cart" key is
  // unchanged. (Toast copy is reworded to "Enquiry List" by prompt 16.)
  const handleAddToEnquiry = useCallback(
    (cartItem) => {
      addToCart(cartItem, 1);
    },
    [addToCart]
  );

  const handleToggleWishlist = useCallback(
    (product) => {
      toggleWishlist(product);
    },
    [toggleWishlist]
  );

  // ── Renderers ──────────────────────────────────────────────────────────────

  const ProductSkeleton = () => (
    <div className={styles.skelCard}>
      <div className={`${styles.skelMedia} ${styles.skeleton}`} />
      <div className={styles.skelBody}>
        <div className={`${styles.skeletonLine} ${styles.skeletonW80}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonW50}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonW60}`} />
      </div>
    </div>
  );

  const renderProductGrid = (products, skeletonCount = 4) => {
    if (loading) {
      return (
        <div className={styles.productGrid}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!products || products.length === 0) return null;

    return (
      <div className={styles.productGrid}>
        {products.map((product, i) => (
          <motion.div
            key={product.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.35 }}
          >
            <ProductCard
              product={product}
              onAddToCart={handleAddToEnquiry}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={isInWishlist(product.id)}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={styles.homePage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 1. Hero */}
      <section className={styles.heroSection}>
        <HeroSection />
      </section>

      {/* 2. Shop by Category */}
      <section className={`${styles.section} ${styles.categorySection}`}>
        <div className={styles.container}>
          <SectionHeader
            title="Shop by Category"
            subtitle="Building materials for every interior and exterior job."
            linkText="All Products"
            linkTo="/products"
          />
          {catalogError && !loading ? (
            /* API unreachable — never masquerade as "no categories"; offer a
               retry. The focus/online listeners also recover this automatically
               once the backend is reachable. */
            <div className={styles.catalogError} role="alert">
              <svg
                className={styles.catalogErrorIcon}
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className={styles.catalogErrorTitle}>
                Couldn&rsquo;t load the catalogue
              </h3>
              <p className={styles.catalogErrorText}>
                We couldn&rsquo;t reach the store right now. Please check your
                connection and try again.
              </p>
              <button
                type="button"
                className={styles.catalogErrorBtn}
                onClick={fetchData}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {loading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${styles.categoryCard} ${styles.skeleton}`}
                    />
                  ))
                : categories.map((cat, i) => (
                    <motion.div
                      key={cat.id || i}
                      initial={{ opacity: 0, scale: 0.92 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i, 8) * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Link
                        to={`/products?category=${categoryParam(cat)}`}
                        className={styles.categoryCard}
                      >
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className={styles.categoryImage}
                            loading="lazy"
                            onError={onImageError}
                          />
                        )}
                        <div className={styles.categoryOverlay}>
                          <h3 className={styles.categoryName}>{cat.name}</h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Featured Products */}
      {(loading || featuredProducts.length > 0) && (
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              title="Featured Products"
              subtitle="A handpicked selection from our catalogue."
              linkText="View All"
              linkTo="/products?sort=featured"
            />
            {renderProductGrid(featuredProducts, 4)}
          </div>
        </section>
      )}

      {/* 4. Special Products band (curated collection — NOT a limited-time deal) */}
      {!loading && specialProducts.length > 0 && (
        <section className={`${styles.section} ${styles.specialSection}`}>
          <div className={styles.container}>
            <SectionHeader
              kicker="Curated picks"
              title="Special Products"
              subtitle="Hand-picked items from across our catalogue."
              linkText="View All"
              linkTo="/special-offers"
            />
            {renderProductGrid(specialProducts, 4)}
          </div>
        </section>
      )}

      {/* 5. Why Choose NEBM — parallax building-materials backdrop behind a scrim */}
      <section
        className={`${styles.section} ${styles.trustSection}`}
        style={{ backgroundImage: `url(${TRUST_IMAGE_URL})` }}
      >
        <div className={styles.container}>
          <SectionHeader
            title={`Why Choose ${APP_NAME}`}
            subtitle="A supplier built for interior and exterior projects."
          />
          <div className={styles.trustGrid}>
            {WHY_CHOOSE_US.map((item, i) => (
              <motion.div
                key={item.id || i}
                className={styles.trustCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.trustIcon}>
                  <Icon icon={item.icon} />
                </div>
                <h4 className={styles.trustTitle}>{item.title}</h4>
                <p className={styles.trustDesc}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Customer testimonials — fully admin-managed (Testimonial module).
          The band owns its own rhythm and renders nothing while disabled or
          empty, so it can never leave a blank section here. */}
      <TestimonialsSection variant="home" />

      {/* 7. CTA band */}
      <CTASection />

      {/* 8. Contact CTA */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.contactCta}>
            <div className={styles.contactMain}>
              <div className={styles.contactBody}>
                <h2 className={styles.contactTitle}>Have a project in mind?</h2>
                <p className={styles.contactText}>
                  Visit our store or call us — we'll help you find the right
                  materials and share bulk pricing.
                </p>
                <div className={styles.contactRows}>
                  <span className={styles.contactItem}>
                    <Icon icon="mdi:map-marker-outline" aria-hidden="true" />
                    {address}
                  </span>
                  {phones.map((num) => (
                    <a
                      key={num}
                      className={styles.contactItem}
                      href={telHref(num)}
                    >
                      <Icon icon="mdi:phone-outline" aria-hidden="true" />
                      {num}
                    </a>
                  ))}
                </div>
              </div>
              <div className={styles.contactActions}>
                <a
                  href={telHref(phone)}
                  className={styles.contactCallBtn}
                >
                  <Icon icon="mdi:phone" aria-hidden="true" />
                  Call to Enquire
                </a>
              </div>
            </div>
            <div className={styles.contactMedia} aria-hidden="true">
              <img
                src={PROJECT_IMAGE_URL}
                alt=""
                loading="lazy"
                onError={onImageError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Recently Viewed (optional, localStorage-driven) */}
      {recentlyViewed.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeader
              title="Recently Viewed"
              subtitle="Continue where you left off."
            />
            {renderProductGrid(recentlyViewed.slice(0, 4), 4)}
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default Home;
