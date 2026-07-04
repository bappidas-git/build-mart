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
} from "../../utils/constants";
import styles from "./HeroSection.module.css";

// =============================================================================
// HeroSection — NEBM brand hero
// =============================================================================
// A single, clean brand hero (NOT a multi-banner deal carousel): the NEBM logo,
// business name, tagline and two CTAs — "Explore Products" and a contact/enquire
// action. No countdown, no "% off", no promo cards. We still support an optional
// admin-managed hero background image via banners.getAll() (first entry with an
// `image`); absent that, the branded blue gradient stands on its own.
// =============================================================================

// Strip formatting so "+91 86385 43526" becomes a valid tel: target.
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

const HeroSection = () => {
  const { isDarkMode } = useTheme();
  const [heroImage, setHeroImage] = useState(null);

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
