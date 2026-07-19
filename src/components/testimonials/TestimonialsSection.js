import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import testimonialsApi from "../../services/testimonialsApi";
import TestimonialCard from "./TestimonialCard";
import styles from "./TestimonialsSection.module.css";

// =============================================================================
// TestimonialsSection — the reusable storefront testimonial band
// =============================================================================
// One component serves BOTH placements, entirely admin-driven via the
// `testimonialsPage` singleton (Admin → Testimonials → Display Settings):
//
//   <TestimonialsSection variant="home" />          Home page showcase.
//     Honours home.enabled, layout (carousel|grid), sort, maxItems,
//     featuredOnly, autoRotate + autoRotateMs, and per-testimonial `home`
//     placement flags.
//
//   <TestimonialsSection variant="product" product={product} />
//     PDP band showing only testimonials assigned to this product (directly
//     or via its category). Honours productPage.enabled + maxItems.
//
// Renders nothing at all while disabled, loading, errored or empty — the
// surrounding page never shows a broken or empty band.
//
// The carousel is a native scroll-snap track (touch gestures for free) with
// keyboard-accessible prev/next controls. Auto-rotation pauses on hover,
// focus, hidden tab, and for prefers-reduced-motion users.
// =============================================================================

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TestimonialsSection = ({ variant = "home", product = null }) => {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);

  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const productId = product?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result =
          variant === "product"
            ? await testimonialsApi.getForProduct(product)
            : await testimonialsApi.getForHome();
        if (cancelled) return;
        setItems(result.items);
        setConfig(result.config);
      } catch (e) {
        // A failed band stays invisible — never break the host page.
        console.warn("[testimonials] section load failed:", e.message);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // productId (not the object) so a parent re-render can't refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, productId]);

  const isCarousel = variant === "home" && (config?.layout || "carousel") === "carousel";

  const scrollByCard = useCallback((direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(`.${styles.slide}`);
    const step = card ? card.offsetWidth + 16 : track.clientWidth;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (direction > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: direction * step, behavior: "smooth" });
    }
  }, []);

  // Auto-rotation (homepage carousel only, admin-controlled).
  useEffect(() => {
    if (!isCarousel || !config?.autoRotate || items.length < 2) return undefined;
    if (prefersReducedMotion()) return undefined;
    const ms = Math.max(2500, Number(config.autoRotateMs) || 6000);
    const timer = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      scrollByCard(1);
    }, ms);
    return () => clearInterval(timer);
  }, [isCarousel, config, items.length, scrollByCard]);

  if (!ready || !items.length || (variant === "home" && config?.enabled === false)) {
    return null;
  }

  const heading =
    variant === "product"
      ? config?.title || "Customer stories with this product"
      : config?.title || "What our customers say";

  const cards = items.map((t) => (
    <div key={t.id} className={isCarousel ? styles.slide : styles.cell}>
      <TestimonialCard testimonial={t} clampBody={variant === "product" ? 4 : 5} />
    </div>
  ));

  return (
    <motion.section
      className={`${styles.section} ${
        variant === "product" ? styles.productVariant : styles.homeVariant
      }`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      aria-label={heading}
    >
      <div className={variant === "home" ? styles.container : undefined}>
      <div className={styles.header}>
        <div>
          {variant === "home" && (
            <span className={styles.kicker}>{config?.kicker || "Testimonials"}</span>
          )}
          <h2 className={styles.title}>{heading}</h2>
          {variant === "home" && config?.subtitle && (
            <p className={styles.subtitle}>{config.subtitle}</p>
          )}
        </div>
        {variant === "home" && config?.pageEnabled !== false && (
          <Link to="/testimonials" className={styles.viewAll}>
            Read all stories &rarr;
          </Link>
        )}
      </div>

      {isCarousel ? (
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carousel"
          aria-label={heading}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
          onFocus={() => (pausedRef.current = true)}
          onBlur={() => (pausedRef.current = false)}
        >
          <div ref={trackRef} className={styles.track} tabIndex={-1}>
            {cards}
          </div>
          {items.length > 1 && (
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCard(-1)}
                aria-label="Previous testimonials"
              >
                <Icon icon="mdi:chevron-left" />
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCard(1)}
                aria-label="Next testimonials"
              >
                <Icon icon="mdi:chevron-right" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.grid}>{cards}</div>
      )}
      </div>
    </motion.section>
  );
};

export default TestimonialsSection;
