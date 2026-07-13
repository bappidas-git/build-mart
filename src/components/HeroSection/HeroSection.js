import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import { APP_NAME } from "../../utils/constants";
import {
  normalizeHeroConfig,
  resolveVideoSource,
  isExternalLink,
} from "../../utils/heroConfig";
import { onImageError } from "../../utils/helpers";
import styles from "./HeroSection.module.css";

// =============================================================================
// HeroSection — NEBM brand hero CAROUSEL, now FULLY admin-driven
// =============================================================================
// Every slide — its order, copy, media (image OR video), badge, CTAs and
// thumbnail cluster — comes from the admin-managed `heroConfig` singleton
// (Settings → Hero Section, persisted to db.json). The component only renders;
// it owns no slide content. See utils/heroConfig.js for the shape/normalizer and
// pages/Admin/HeroSettings.js for the editor.
//
// Two slide kinds:
//   • brand    — logo + title + tagline + up to two CTAs (centered hero).
//   • showcase — badge/eyebrow + title + subtitle + up to two CTAs + an optional
//                cluster of thumbnail cards, over a full-bleed image or video.
//
// Backgrounds degrade gracefully: a broken image, an empty media slot or a
// reduced-motion video all fall back to the branded scrim/gradient so a slide
// never shows a bare or broken background.
//
// IMPLEMENTATION — a persistent sliding TRACK, not an AnimatePresence swap.
// All slides stay mounted side-by-side in a flex row and a single transform
// shifts the row. This is deliberate: framer-motion `AnimatePresence` leaves
// "exit ghost" nodes mounted under React 18 StrictMode in dev (see the project
// memory note), which would stack slides on `npm run dev`. A mount-free track
// sidesteps that entirely and works identically in dev and production.
//
// Carousel behaviour: auto-advance (paused on hover / focus / drag and disabled
// entirely under prefers-reduced-motion), prev/next arrows, dot indicators,
// pointer/touch swipe, arrow-key navigation, and ARIA carousel semantics.
// =============================================================================

const SWIPE_THRESHOLD = 50; // px of horizontal travel that counts as a swipe

// Will this slide's media actually paint a background? Drives the `hasImage`
// contrast treatment on the brand slide and mirrors what MediaLayer renders.
const mediaWillRender = (media, reducedMotion) => {
  if (!media || !media.url) return false;
  if (media.type === "video") {
    return reducedMotion ? !!media.poster : !!resolveVideoSource(media.url).src;
  }
  return true;
};

// Pick a legible text colour (black/white) for a coloured badge background.
const pickBadgeText = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Rec. 601 luma — light backgrounds get dark text and vice-versa.
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a202c" : "#ffffff";
};

const HeroSection = () => {
  const { isDarkMode } = useTheme();

  // Render the shipped defaults instantly (normalizeHeroConfig backfills them),
  // then reconcile with the admin-saved config once it loads — so the hero never
  // flashes empty, and edits appear on the next focus/refresh.
  const [config, setConfig] = useState(() => normalizeHeroConfig(null));

  const load = useCallback(async () => {
    try {
      const raw = await apiService.hero.getConfig();
      setConfig(normalizeHeroConfig(raw));
    } catch {
      // Keep the last-known (or default) config rather than breaking the page.
    }
  }, []);

  useEffect(() => {
    load();
    // Refetch when the tab regains focus so admin edits appear without a reload.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // Only enabled slides are shown; a disabled carousel (or zero enabled slides)
  // hides the whole band.
  const slides = useMemo(
    () => (config.enabled ? config.slides.filter((s) => s.enabled !== false) : []),
    [config]
  );
  const total = slides.length;
  const autoplayMs = config.autoplayMs;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Clamp the active index whenever the slide count shrinks (admin removed /
  // disabled slides, or the fetched config is shorter than the defaults).
  useEffect(() => {
    setIndex((i) => (total === 0 ? 0 : Math.min(i, total - 1)));
  }, [total]);

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
  }, [total]);

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
    (n) => setIndex((total ? ((n % total) + total) % total : 0)),
    [total]
  );
  const paginate = useCallback(
    (dir) => setIndex((i) => (total ? (((i + dir) % total) + total) % total : 0)),
    [total]
  );

  // Auto-advance. Restarts whenever the active slide changes so each slide gets
  // its full dwell time. Disabled while paused, under reduced-motion, or when
  // there is only one slide.
  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return undefined;
    const id = window.setInterval(() => paginate(1), autoplayMs);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, total, index, paginate, autoplayMs]);

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

  // Nothing to show (carousel disabled or every slide hidden) — render no band.
  if (total === 0) return null;

  const active = slides[Math.min(index, total - 1)];

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
              {slide.type === "brand" ? (
                <BrandSlide
                  slide={slide}
                  reducedMotion={reducedMotion}
                  swipedRef={swipedRef}
                />
              ) : (
                <ShowcaseSlide
                  slide={slide}
                  reducedMotion={reducedMotion}
                  swipedRef={swipedRef}
                />
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
        Slide {index + 1} of {total}: {active.title || APP_NAME}
      </p>
    </section>
  );
};

// ── Background media layer (image, direct video file, or embed) ───────────────
// Rendered inside the slide's positioned background element (which carries the
// scrim ::after). Falls back to nothing (letting the scrim/gradient show) when
// there's no renderable media or reduced-motion suppresses a video.
const MediaLayer = ({ media, reducedMotion, className }) => {
  const type = media?.type === "video" ? "video" : "image";
  const url = media?.url || "";
  const poster = media?.poster || "";

  if (type === "image") {
    return (
      <div
        className={className}
        style={url ? { backgroundImage: `url(${url})` } : undefined}
        aria-hidden="true"
      />
    );
  }

  // Video — under reduced motion show the poster still (if any), never autoplay.
  const video = resolveVideoSource(url);
  if (reducedMotion || video.kind === "none") {
    return (
      <div
        className={className}
        style={poster ? { backgroundImage: `url(${poster})` } : undefined}
        aria-hidden="true"
      />
    );
  }

  if (video.kind === "embed") {
    return (
      <div className={className} aria-hidden="true">
        <iframe
          className={styles.mediaFrame}
          src={video.src}
          title="Slide background video"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <video
        className={styles.mediaVideo}
        src={video.src}
        poster={poster || undefined}
        autoPlay
        muted
        loop
        playsInline
        tabIndex={-1}
      />
    </div>
  );
};

// ── A single CTA — internal <Link> or external <a> (http/tel/mailto) ──────────
const SlideCta = ({ cta, variant, swipedRef }) => {
  if (!cta || !cta.label || !cta.to) return null;
  const cls = variant === "secondary" ? styles.secondaryCta : styles.primaryCta;
  const swallowIfSwiping = (e) => {
    if (swipedRef?.current) e.preventDefault();
  };

  const inner = (
    <>
      {variant === "secondary" && /^tel:/i.test(cta.to) && (
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
      )}
      {cta.label}
      {variant === "primary" && (
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
      )}
    </>
  );

  if (isExternalLink(cta.to)) {
    return (
      <a href={cta.to} className={cls} onClick={swallowIfSwiping}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={cta.to} className={cls} onClick={swallowIfSwiping} draggable={false}>
      {inner}
    </Link>
  );
};

// ── Eyebrow / badge (offers, new launch, daily deals…) ────────────────────────
const Badge = ({ text, color }) => {
  if (!text) return null;
  const style = color
    ? { background: color, color: pickBadgeText(color) || undefined }
    : undefined;
  return (
    <span className={styles.eyebrow} style={style}>
      {text}
    </span>
  );
};

// ── Brand slide ───────────────────────────────────────────────────────────────
const BrandSlide = ({ slide, reducedMotion, swipedRef }) => {
  const hasBg = mediaWillRender(slide.media, reducedMotion);
  return (
    <div className={`${styles.brand} ${hasBg ? styles.hasImage : ""}`}>
      <MediaLayer
        media={slide.media}
        reducedMotion={reducedMotion}
        className={styles.brandImage}
      />
      <div className={styles.brandInner}>
        {slide.logo && (
          <img
            src={slide.logo}
            alt={slide.title || APP_NAME}
            className={styles.logo}
            draggable={false}
            onError={onImageError}
          />
        )}
        <Badge text={slide.eyebrow} color={slide.eyebrowColor} />
        {slide.title && <h1 className={styles.title}>{slide.title}</h1>}
        {slide.subtitle && <p className={styles.tagline}>{slide.subtitle}</p>}

        <div className={styles.actions}>
          <SlideCta cta={slide.primaryCta} variant="primary" swipedRef={swipedRef} />
          <SlideCta cta={slide.secondaryCta} variant="secondary" swipedRef={swipedRef} />
        </div>
      </div>
    </div>
  );
};

// ── Showcase slide ────────────────────────────────────────────────────────────
// `swipedRef` guards against the pointer-up that ends a swipe also activating a
// link/CTA underneath it.
const ShowcaseSlide = ({ slide, reducedMotion, swipedRef }) => {
  const swallowIfSwiping = (e) => {
    if (swipedRef.current) e.preventDefault();
  };
  const hasGallery = Array.isArray(slide.gallery) && slide.gallery.length > 0;

  return (
    <div className={styles.showcase}>
      <MediaLayer
        media={slide.media}
        reducedMotion={reducedMotion}
        className={styles.showcaseImage}
      />
      <div
        className={`${styles.showcaseInner} ${
          slide.align === "center" ? styles.alignCenter : ""
        } ${!hasGallery ? styles.noGallery : ""}`}
      >
        <div className={styles.showcaseCopy}>
          <Badge text={slide.eyebrow} color={slide.eyebrowColor} />
          {slide.title && <h2 className={styles.showcaseTitle}>{slide.title}</h2>}
          {slide.subtitle && (
            <p className={styles.showcaseSubtitle}>{slide.subtitle}</p>
          )}
          {(slide.primaryCta?.label || slide.secondaryCta?.label) && (
            <div className={styles.showcaseActions}>
              <SlideCta cta={slide.primaryCta} variant="primary" swipedRef={swipedRef} />
              <SlideCta cta={slide.secondaryCta} variant="secondary" swipedRef={swipedRef} />
            </div>
          )}
        </div>

        {hasGallery && (
          <ul className={styles.gallery}>
            {slide.gallery.map((item, i) => {
              const card = (
                <>
                  <img
                    src={item.image}
                    alt={item.label}
                    className={styles.galleryImg}
                    draggable={false}
                    onError={onImageError}
                  />
                  {item.label && (
                    <span className={styles.galleryLabel}>{item.label}</span>
                  )}
                </>
              );
              return (
                <li key={item.label || i} className={styles.galleryItem}>
                  {item.to ? (
                    isExternalLink(item.to) ? (
                      <a
                        href={item.to}
                        className={styles.galleryCard}
                        onClick={swallowIfSwiping}
                      >
                        {card}
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        className={styles.galleryCard}
                        onClick={swallowIfSwiping}
                        draggable={false}
                      >
                        {card}
                      </Link>
                    )
                  ) : (
                    <div className={styles.galleryCard}>{card}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
