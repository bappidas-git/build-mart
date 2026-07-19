import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import testimonialsApi, {
  TESTIMONIAL_TYPES,
  buildReviewsJsonLd,
  sortTestimonials,
} from "../../services/testimonialsApi";
import apiService from "../../services/api";
import TestimonialCard from "../../components/testimonials/TestimonialCard";
import StarRating from "../../components/storefront/StarRating";
import EmptyState from "../../components/EmptyState/EmptyState";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import useDocumentMeta from "../Careers/useDocumentMeta";
import { useSettings } from "../../context/SettingsContext";
import styles from "./Testimonials.module.css";

// =============================================================================
// Testimonials — the dedicated customer-stories page
// =============================================================================
// Everything on this page is admin-managed: the hero copy and SEO come from
// the `testimonialsPage` singleton, the wall renders published testimonials
// from the central library (drafts/archived never leak), and the featured
// spotlight honours each record's Featured flag. Filters cover media type and
// rating, plus free-text search across customer, company, review and tags.
//
// SEO: document title/description via useDocumentMeta + schema.org Review
// JSON-LD (aggregate rating + individual reviews) injected while mounted.
// =============================================================================

const RATING_FILTERS = [
  { value: 0, label: "Any rating" },
  { value: 5, label: "5 stars" },
  { value: 4, label: "4 stars & up" },
  { value: 3, label: "3 stars & up" },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const Testimonials = () => {
  const { store } = useSettings();

  const [page, setPage] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [typeFilter, setTypeFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);

  useDocumentMeta(
    page?.seo?.title || "Customer Testimonials",
    page?.seo?.description
  );

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      // Products resolve the "on <product>" chips; a failure there must never
      // sink the page, hence allSettled for the non-critical fetch.
      const [pageData, published, productsRes] = await Promise.all([
        testimonialsApi.getPage(),
        testimonialsApi.getPublished(),
        apiService.products.getAll().catch(() => []),
      ]);
      setPage(pageData);
      setItems(published.filter((t) => t.placements?.page !== false));
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setVisibleCount(Math.max(1, Number(pageData?.page?.pageSize) || 9));
    } catch (e) {
      console.error("Testimonials page load failed:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---- SEO: schema.org Review structured data while mounted ----------------
  useEffect(() => {
    if (!items.length) return undefined;
    const jsonLd = buildReviewsJsonLd(items, store?.name || "North East Build Mart");
    if (!jsonLd) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => script.remove();
  }, [items, store?.name]);

  const productLookup = useCallback(
    (id) => {
      const p = products.find((prod) => String(prod.id) === String(id));
      return p ? { name: p.name, slug: p.slug } : null;
    },
    [products]
  );

  // ---- Aggregate header stats (real data only) -----------------------------
  const stats = useMemo(() => {
    const rated = items.filter((t) => Number(t.rating) > 0);
    const avg = rated.length
      ? rated.reduce((s, t) => s + Number(t.rating), 0) / rated.length
      : 0;
    return { count: items.length, avg, videos: items.filter((t) => t.type === "video").length };
  }, [items]);

  // ---- Filtering -----------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortTestimonials(
      items.filter((t) => {
        if (typeFilter && t.type !== typeFilter) return false;
        if (ratingFilter && (Number(t.rating) || 0) < ratingFilter) return false;
        if (q) {
          const haystack = [
            t.customerName,
            t.company,
            t.designation,
            t.title,
            t.body,
            ...(t.tags || []),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
      "order"
    );
  }, [items, typeFilter, ratingFilter, search]);

  const featured = useMemo(
    () => filtered.filter((t) => t.featured === true).slice(0, 2),
    [filtered]
  );
  const wall = useMemo(
    () => filtered.filter((t) => !featured.includes(t)),
    [filtered, featured]
  );

  const visibleWall = wall.slice(0, visibleCount);
  const hasFilters = !!(typeFilter || ratingFilter || search);
  const pageSize = Math.max(1, Number(page?.page?.pageSize) || 9);

  // ---- Render --------------------------------------------------------------

  if (!loading && !loadError && page?.enabled === false) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <EmptyState
            icon="mdi:comment-quote-outline"
            title="Testimonials are taking a short break"
            description="This page isn't available right now — please check back soon."
            action={{ label: "Back to Home", to: "/" }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Testimonials" }]} />
          {page?.hero?.kicker && (
            <motion.p className={styles.heroKicker} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {page.hero.kicker}
            </motion.p>
          )}
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {page?.hero?.title || "What our customers say"}
          </motion.h1>
          {page?.hero?.subtitle && (
            <motion.p
              className={styles.heroSubtitle}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {page.hero.subtitle}
            </motion.p>
          )}

          {!loading && stats.count > 0 && (
            <motion.div
              className={styles.heroStats}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <span className={styles.stat}>
                <span className={styles.statValue}>{stats.avg.toFixed(1)}</span>
                <StarRating rating={stats.avg} size={16} />
              </span>
              <span className={styles.statDivider} aria-hidden="true" />
              <span className={styles.stat}>
                <span className={styles.statValue}>{stats.count}</span>
                <span className={styles.statLabel}>customer stories</span>
              </span>
              {stats.videos > 0 && (
                <>
                  <span className={styles.statDivider} aria-hidden="true" />
                  <span className={styles.stat}>
                    <span className={styles.statValue}>{stats.videos}</span>
                    <span className={styles.statLabel}>video testimonials</span>
                  </span>
                </>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <div className={styles.container}>
        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className={styles.filters} role="group" aria-label="Filter testimonials">
          <div className={styles.typeChips}>
            <button
              type="button"
              className={`${styles.chip} ${!typeFilter ? styles.chipActive : ""}`}
              onClick={() => setTypeFilter("")}
              aria-pressed={!typeFilter}
            >
              All
            </button>
            {TESTIMONIAL_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.chip} ${typeFilter === t.value ? styles.chipActive : ""}`}
                onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
                aria-pressed={typeFilter === t.value}
              >
                <Icon icon={t.icon} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.filterRight}>
            <label className={styles.srOnly} htmlFor="testimonial-rating">
              Minimum rating
            </label>
            <select
              id="testimonial-rating"
              className={styles.select}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(Number(e.target.value))}
            >
              {RATING_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <div className={styles.searchBox}>
              <Icon icon="mdi:magnify" className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search stories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search testimonials"
              />
            </div>
          </div>
        </div>

        {/* ── Content states ──────────────────────────────────────────────── */}
        {loading ? (
          <div className={styles.masonry} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.masonryItem}>
                <div className={styles.skeletonCard}>
                  <div className={styles.skelRow}>
                    <span className={`${styles.skelAvatar} ${styles.skeleton}`} />
                    <span className={`${styles.skelLine} ${styles.skeleton}`} />
                  </div>
                  <span className={`${styles.skelLine} ${styles.skeleton}`} />
                  <span className={`${styles.skelLineWide} ${styles.skeleton}`} />
                  <span className={`${styles.skelLineWide} ${styles.skeleton}`} />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className={styles.errorPanel} role="alert">
            <Icon icon="mdi:cloud-off-outline" className={styles.errorIcon} aria-hidden="true" />
            <h2 className={styles.errorTitle}>Couldn&rsquo;t load testimonials</h2>
            <p className={styles.errorText}>
              We couldn&rsquo;t reach the store right now. Please try again.
            </p>
            <button type="button" className={styles.retryBtn} onClick={fetchAll}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon="mdi:comment-search-outline"
            title={hasFilters ? "No stories match those filters" : "No testimonials yet"}
            description={
              hasFilters
                ? "Try removing a filter or searching for something else."
                : "Customer stories will appear here soon."
            }
            action={
              hasFilters
                ? {
                    label: "Clear filters",
                    onClick: () => {
                      setTypeFilter("");
                      setRatingFilter(0);
                      setSearch("");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Featured spotlight */}
            {featured.length > 0 && (
              <motion.div className={styles.featuredGrid} {...reveal}>
                {featured.map((t) => (
                  <div key={t.id} className={styles.featuredCell}>
                    <TestimonialCard
                      testimonial={t}
                      productLookup={productLookup}
                      clampBody={0}
                    />
                  </div>
                ))}
              </motion.div>
            )}

            {/* Masonry wall */}
            <div className={styles.masonry}>
              {visibleWall.map((t, i) => (
                <motion.div
                  key={t.id}
                  className={styles.masonryItem}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i % pageSize, 6) * 0.05, duration: 0.35 }}
                >
                  <TestimonialCard testimonial={t} productLookup={productLookup} />
                </motion.div>
              ))}
            </div>

            {wall.length > visibleCount && (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  onClick={() => setVisibleCount((c) => c + pageSize)}
                >
                  Show more stories
                  <span className={styles.loadMoreCount}>
                    ({wall.length - visibleCount} remaining)
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Testimonials;
