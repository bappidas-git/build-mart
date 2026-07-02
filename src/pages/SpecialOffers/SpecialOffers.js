import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import apiService from "../../services/api";
import ProductCard from "../../components/storefront/ProductCard";
import styles from "./SpecialOffers.module.css";

// =============================================================================
// SpecialOffers  →  the NEBM "Special Products" collection
// =============================================================================
// This page is the collection view of the additive `special: true` label — NOT
// a deals/coupons page. There are no coupons, no countdown, no "deal of the day"
// and no discount urgency: Special Products are hand-picked items curated across
// the catalogue. Each item ALSO lives under its real top-level category and
// appears in normal listings — the flag is an extra label, not its home. The
// homepage Special band and this page share one data source (products.getSpecial)
// and the one canonical, badged storefront ProductCard.
// =============================================================================

// ── Responsive Category Tabs ─────────────────────────────────────────────────
// Horizontally scrollable strip that never hides a tab: edge-fade affordances +
// scroll buttons appear when there's more off-screen, and the active tab is
// scrolled into view. Buttons are hidden on touch/mobile (CSS) where the strip
// scrolls by swipe. Framed as curation ("All"), not deals.
const CategoryTabs = ({ categories, activeTab, onChange }) => {
  const scrollRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, categories.length]);

  // Keep the active tab visible when it changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className={styles.tabBarWrap}>
      <button
        type="button"
        className={`${styles.tabScrollBtn} ${styles.tabScrollLeft} ${atStart ? styles.tabScrollHidden : ""}`}
        onClick={() => scrollByDir(-1)}
        aria-label="Scroll categories left"
        tabIndex={atStart ? -1 : 0}
      >
        &#8249;
      </button>
      <div className={`${styles.tabFade} ${styles.tabFadeLeft} ${atStart ? styles.tabFadeHidden : ""}`} />

      <div className={styles.tabBar} ref={scrollRef}>
        <button
          type="button"
          data-active={activeTab === "all"}
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => onChange("all")}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-active={activeTab === cat.id}
            className={`${styles.tab} ${activeTab === cat.id ? styles.tabActive : ""}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className={`${styles.tabFade} ${styles.tabFadeRight} ${atEnd ? styles.tabFadeHidden : ""}`} />
      <button
        type="button"
        className={`${styles.tabScrollBtn} ${styles.tabScrollRight} ${atEnd ? styles.tabScrollHidden : ""}`}
        onClick={() => scrollByDir(1)}
        aria-label="Scroll categories right"
        tabIndex={atEnd ? -1 : 0}
      >
        &#8250;
      </button>
    </div>
  );
};

// ── Skeleton card ────────────────────────────────────────────────────────────
const ProductSkeleton = () => (
  <div className={styles.skelCard}>
    <div className={`${styles.skelMedia} ${styles.skeleton}`} />
    <div className={styles.skelBody}>
      <div className={`${styles.skelLine} ${styles.skelW40}`} />
      <div className={`${styles.skelLine} ${styles.skelW80}`} />
      <div className={`${styles.skelLine} ${styles.skelW60}`} />
      <div className={`${styles.skelLine} ${styles.skelFull}`} />
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const SpecialOffers = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch the special set (one shared data source with the homepage band) plus
  // categories for the curation tabs. Guarded so a failed call → empty state.
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      const [special, cats] = await Promise.all([
        apiService.products.getSpecial(60).catch(() => []),
        apiService.categories.getAll().catch(() => []),
      ]);
      if (cancelled) return;
      // Defensive: keep only truly-special items (the flag is the source of truth).
      setProducts(
        Array.isArray(special) ? special.filter((p) => p && p.special === true) : []
      );
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // categoryId → name (products carry a numeric categoryId only).
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Curation tabs = only the categories actually represented in the special set,
  // in catalogue order — so a tab never yields an empty grid.
  const specialCategories = useMemo(() => {
    const ids = new Set(products.map((p) => p.categoryId).filter((id) => id != null));
    return categories.filter((c) => ids.has(c.id));
  }, [products, categories]);

  // Filter by active tab (tab value is a categoryId, or "all").
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.categoryId === activeTab);
  }, [products, activeTab]);

  // If the active tab's category drops out of the special set, fall back to "all".
  useEffect(() => {
    if (activeTab !== "all" && !specialCategories.some((c) => c.id === activeTab)) {
      setActiveTab("all");
    }
  }, [specialCategories, activeTab]);

  // Enquiry-list quick-add: the shared card hands back a fully-built cart line, so
  // an add here merges with PDP adds and the localStorage "cart" key is unchanged.
  const handleAddToEnquiry = useCallback(
    (cartItem) => addToCart(cartItem, 1),
    [addToCart]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className={styles.heroKicker}>Curated picks</span>
            <h1 className={styles.heroTitle}>Special Products</h1>
            <p className={styles.heroSubtitle}>
              Hand-picked items curated from across our catalogue — available all
              year round, not limited-time deals.
            </p>
          </motion.div>
        </div>
      </section>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">&#10022;</div>
            <h2 className={styles.emptyTitle}>No special products right now</h2>
            <p className={styles.emptyText}>
              We're curating our next set of special picks. In the meantime,
              browse our full catalogue of building materials.
            </p>
            <Link to="/products" className={styles.emptyBtn}>
              Browse All Products
            </Link>
          </section>
        ) : (
          <section className={styles.collection}>
            {specialCategories.length > 0 && (
              <CategoryTabs
                categories={specialCategories}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            )}

            <p className={styles.resultCount}>
              {filteredProducts.length} special product
              {filteredProducts.length !== 1 ? "s" : ""}
              {activeTab !== "all" && categoryMap[activeTab]
                ? ` in ${categoryMap[activeTab]}`
                : ""}
            </p>

            <div className={styles.grid}>
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToEnquiry}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={isInWishlist(product.id)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};

export default SpecialOffers;
