import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import {
  APP_NAME,
  BRAND_TAGLINE,
  BRAND_PHONE_1,
  LOGO_URL,
  HERO_IMAGE_URL,
} from "../../utils/constants";
import styles from "./HeroSection.module.css";

// =============================================================================
// HeroSection — NEBM brand hero
// =============================================================================
// A single, clean brand hero (NOT a multi-banner deal carousel): the NEBM logo,
// business name, tagline and two CTAs — "Explore Products" and a contact/enquire
// action. No countdown, no "% off", no promo cards.
//
// The hero renders over a full-bleed background image (a legibility scrim keeps
// the brand copy readable) with a three-tier, always-safe source:
//   1. An admin-managed banner (banners.getAll(), first entry with an `image`).
//   2. Else a default open-license building-materials photo (HERO_IMAGE_URL).
//   3. Else — if the chosen image can't load (404 / offline CDN) — the branded
//      blue gradient stands on its own. The image is preloaded, so a broken URL
//      degrades to the gradient instead of a bare dark scrim.
// =============================================================================

// Strip formatting so "+91 86385 43526" becomes a valid tel: target.
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

const HeroSection = () => {
  const { isDarkMode } = useTheme();
  const [heroImage, setHeroImage] = useState(null);

  // Resolve the hero background: admin banner first, else the default
  // open-license photo. Each candidate is preloaded, so a broken/offline URL
  // degrades to the next option (and ultimately the branded gradient) rather
  // than flashing a bare dark scrim over no image.
  useEffect(() => {
    let active = true;

    // Resolve to `src` once it loads, or to null if it errors / is empty.
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

  return (
    <section
      className={`${styles.hero} ${heroImage ? styles.hasImage : ""}`}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      {heroImage && (
        <div
          className={styles.heroImage}
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
      )}

      <div className={styles.inner}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img src={LOGO_URL} alt={APP_NAME} className={styles.logo} />
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.tagline}>{BRAND_TAGLINE}</p>

          <div className={styles.actions}>
            <Link to="/products" className={styles.primaryCta}>
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
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
