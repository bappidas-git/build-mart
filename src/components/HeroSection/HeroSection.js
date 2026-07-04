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
// Two visual modes:
//   • Admin banner present → full-bleed background image with a legibility scrim
//     and centred content (banners.getAll(), first entry with an `image`).
//   • No admin banner → a two-column "showcase" split: brand content on one side
//     and a default open-license building-materials photo (HERO_IMAGE_URL) on the
//     other. If that photo fails to load we fall back to the centred brand block
//     over the branded blue gradient — nothing ever shows a broken image.
// =============================================================================

// Strip formatting so "+91 86385 43526" becomes a valid tel: target.
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

const HeroSection = () => {
  const { isDarkMode } = useTheme();
  const [heroImage, setHeroImage] = useState(null);
  // The default side photo hides itself if it 404s / the CDN is unreachable, so
  // the layout collapses back to the centred brand block instead of a broken img.
  const [showcaseFailed, setShowcaseFailed] = useState(false);

  // Optional admin hero image — degrade silently to the branded default when
  // the banners endpoint is empty/absent (dual-mode safe, same guard pattern).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiService.banners.getAll();
        const banner = Array.isArray(data)
          ? data.find((b) => b && b.image)
          : null;
        if (active && banner) setHeroImage(banner.image);
      } catch {
        // no admin banner — the branded gradient is the default hero
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Split showcase only when there's no admin background image AND the default
  // photo hasn't failed. Otherwise the hero renders as a single centred column.
  const showShowcase = !heroImage && !showcaseFailed;

  return (
    <section
      className={`${styles.hero} ${heroImage ? styles.hasImage : ""} ${
        showShowcase ? styles.hasShowcase : ""
      }`}
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

        {showShowcase && (
          <motion.div
            className={styles.media}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className={styles.mediaFrame}>
              <img
                src={HERO_IMAGE_URL}
                alt="Steel rods, hardware and building materials at a construction site"
                className={styles.mediaImg}
                loading="eager"
                onError={() => setShowcaseFailed(true)}
              />
              <span className={styles.mediaChip}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Interior &amp; exterior materials
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
