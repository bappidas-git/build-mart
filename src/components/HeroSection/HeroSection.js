import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import {
  APP_NAME,
  BRAND_TAGLINE,
  BRAND_PHONE_1,
  LOGO_URL,
  HERO_IMAGE_URL,
  HERO_SLIDES,
} from "../../utils/constants";
import { onImageError } from "../../utils/helpers";
import styles from "./HeroSection.module.css";

// =============================================================================
// HeroSection — NEBM brand hero, now a CAROUSEL
// =============================================================================
// Slide 1 is always the clean NEBM *brand* hero (logo, name, tagline and two
// CTAs — "Explore Products" and "Enquire Now"). Slides 2+ are honest category
// showcases from HERO_SLIDES (see constants.js): a headline, sub-copy, a CTA to
// a real category, and a cluster of category thumbnails. There is NO countdown,
// no "% off", no fake stock/urgency — NEBM is an enquiry platform.
//
// Slide 1's background is a three-tier, always-safe source:
//   1. An admin-managed banner (banners.getAll(), first entry with an `image`).
//   2. Else a default open-license building-materials photo (HERO_IMAGE_URL).
//   3. Else — if the chosen image can't load — the branded blue gradient stands
//      on its own (the image is preloaded, so a broken URL degrades gracefully).
//
// IMPLEMENTATION — a persistent sliding TRACK, not an AnimatePresence swap.
// All slides stay mounted side-by-side in a flex row and a single transform
// shifts the row. This is deliberate: framer-motion `AnimatePresence` leaves
// "exit ghost" nodes mounted under React 18 StrictMode in dev (see the
// project memory note), which would stack slides on `npm run dev`. A mount-free
// track sidesteps that entirely and works identically in dev and production.
//
// Carousel behaviour: auto-advance (paused on hover / focus / drag and disabled
// entirely under prefers-reduced-motion), prev/next arrows, dot indicators,
// pointer/touch swipe, arrow-key navigation, and ARIA carousel semantics.
// =============================================================================

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50; // px of horizontal travel that counts as a swipe

// Strip formatting so "+91 86385 43526" becomes a valid tel: target.
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

const HeroSection = () => {
  const { isDarkMode } = useTheme();
  const [heroImage, setHeroImage] = useState(null);

  // Slide 1 is the brand hero (rendered inline); the rest come from config.
  const slides = useMemo(
    () => [{ id: "brand", brand: true }, ...(HERO_SLIDES || [])],
    []
  );
  const total = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // The track is translated in PIXELS (index * slideWidth), not a percentage.
  // A CSS transition on a *percentage* transform fails to resolve in some
  // engines (the target is never applied), so we measure the viewport width and
  // animate a concrete pixel offset, which transitions reliably.
  const viewportRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const measure = () => setSlideWidth(el.clientWidth);
    measure();
    let ro;
    if (typeof ResizeObserver === "function") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Honour prefers-reduced-motion: no autoplay, and an instant (non-sliding)
  // transition instead of the spring.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const goTo = useCallback(
    (n) => setIndex(((n % total) + total) % total),
    [total]
  );
  const paginate = useCallback(
    (dir) => setIndex((i) => (((i + dir) % total) + total) % total),
    [total]
  );

  // Resolve the brand slide's background: admin banner first, else the default
  // open-license photo. Each candidate is preloaded, so a broken/offline URL
  // degrades to the next option (and ultimately the branded gradient).
  useEffect(() => {
    let active = true;
    const preload = (src) =>
      new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    (async () => {
      let adminSrc = null;
      try {
        const data = await apiService.banners.getAll();
        const banner = Array.isArray(data)
          ? data.find((b) => b && b.image)
          : null;
        if (banner) adminSrc = banner.image;
      } catch {
        // no admin banner configured — fall through to the default photo
      }

      const resolved =
        (await preload(adminSrc)) || (await preload(HERO_IMAGE_URL));
      if (active && resolved) setHeroImage(resolved);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Auto-advance. Restarts whenever the active slide changes so each slide gets
  // its full dwell time. Disabled while paused, under reduced-motion, or when
  // there is only one slide.
  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return undefined;
    const id = window.setInterval(() => paginate(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, total, index, paginate]);

  // Pause autoplay whenever the tab is hidden (background tabs shouldn't churn).
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Keep off-screen slides out of the tab order / accessibility tree. All slides
  // stay mounted (the track never unmounts them), so `inert` is toggled
  // imperatively per slide — set via ref to avoid React 18 unknown-prop warnings.
  const slideRefs = useRef([]);
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === index) el.removeAttribute("inert");
      else el.setAttribute("inert", "");
    });
  }, [index, total]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        paginate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        paginate(1);
      }
    },
    [paginate]
  );

  // Pointer swipe (works for mouse + touch). We record the pointer-down origin
  // and, on release, treat a dominant-horizontal drag past the threshold as a
  // slide change. `swipedRef` suppresses the click that ends a swipe so it does
  // not also activate the CTA/thumbnail underneath.
  const pointer = useRef({ x: 0, y: 0, active: false });
  const swipedRef = useRef(false);

  const onPointerDown = (e) => {
    pointer.current = { x: e.clientX, y: e.clientY, active: true };
    swipedRef.current = false;
  };
  const onPointerUp = (e) => {
    if (!pointer.current.active) return;
    pointer.current.active = false;
    const dx = e.clientX - pointer.current.x;
    const dy = e.clientY - pointer.current.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true;
      paginate(dx < 0 ? 1 : -1);
    }
  };

  const active = slides[index];

  return (
    <section
      className={styles.carousel}
      data-theme={isDarkMode ? "dark" : "light"}
      aria-roledescription="carousel"
      aria-label={`${APP_NAME} highlights`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className={styles.viewport}
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* The track is moved with a plain CSS transform in pixels (index *
            measured slide width). Pixels transition reliably where a percentage
            transform does not, and resolve deterministically regardless of the
            track's overflowing content. */}
        <div
          className={styles.track}
          style={{
            transform: `translateX(-${index * slideWidth}px)`,
            transition: reducedMotion
              ? "none"
              : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
              aria-hidden={i !== index}
            >
              {slide.brand ? (
                <BrandSlide heroImage={heroImage} />
              ) : (
                <ShowcaseSlide slide={slide} swipedRef={swipedRef} />
              )}
            </div>
          ))}
        </div>

        {/* Prev / next controls */}
        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => paginate(-1)}
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => paginate(1)}
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className={styles.dots} role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Screen-reader live announcement of the current slide. */}
      <p className={styles.srOnly} aria-live="polite">
        Slide {index + 1} of {total}: {active.brand ? APP_NAME : active.title}
      </p>
    </section>
  );
};

// ── Slide 1: the NEBM brand hero ──────────────────────────────────────────────
const BrandSlide = ({ heroImage }) => (
  <div className={`${styles.brand} ${heroImage ? styles.hasImage : ""}`}>
    {heroImage && (
      <div
        className={styles.brandImage}
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
    )}
    <div className={styles.brandInner}>
      <img src={LOGO_URL} alt={APP_NAME} className={styles.logo} draggable={false} />
      <h1 className={styles.title}>{APP_NAME}</h1>
      <p className={styles.tagline}>{BRAND_TAGLINE}</p>

      <div className={styles.actions}>
        <Link to="/products" className={styles.primaryCta} draggable={false}>
          Explore Products
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <a href={telHref(BRAND_PHONE_1)} className={styles.secondaryCta}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          Enquire Now
        </a>
      </div>
    </div>
  </div>
);

// ── Slides 2+: honest category showcase ───────────────────────────────────────
// `swipedRef` guards against the pointer-up that ends a swipe also activating a
// link/CTA underneath it.
const ShowcaseSlide = ({ slide, swipedRef }) => {
  const swallowIfSwiping = (e) => {
    if (swipedRef.current) e.preventDefault();
  };

  return (
    <div className={styles.showcase}>
      <div
        className={styles.showcaseImage}
        style={{ backgroundImage: `url(${slide.image})` }}
        aria-hidden="true"
      />
      <div className={styles.showcaseInner}>
        <div className={styles.showcaseCopy}>
          {slide.eyebrow && (
            <span className={styles.eyebrow}>{slide.eyebrow}</span>
          )}
          <h2 className={styles.showcaseTitle}>{slide.title}</h2>
          {slide.subtitle && (
            <p className={styles.showcaseSubtitle}>{slide.subtitle}</p>
          )}
          {slide.cta && (
            <Link
              to={slide.cta.to}
              className={styles.primaryCta}
              onClick={swallowIfSwiping}
              draggable={false}
            >
              {slide.cta.label}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {Array.isArray(slide.gallery) && slide.gallery.length > 0 && (
          <ul className={styles.gallery}>
            {slide.gallery.map((item, i) => (
              <li key={item.label || i} className={styles.galleryItem}>
                <Link
                  to={item.to}
                  className={styles.galleryCard}
                  onClick={swallowIfSwiping}
                  draggable={false}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className={styles.galleryImg}
                    draggable={false}
                    onError={onImageError}
                  />
                  <span className={styles.galleryLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
