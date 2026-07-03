import React from "react";
import { motion } from "framer-motion";
import styles from "./BrandLoader.module.css";

// =============================================================================
// BrandLoader — branded loading indicator
// =============================================================================
// The NEBM logo icon with a gentle scale pulse inside a thin rotating blue ring.
// Token-driven (--sf-* with hard fallbacks) so it reads on light AND dark and
// works anywhere — including the MUI admin (where the tokens are still on :root).
// The app-level <MotionConfig reducedMotion="user"> makes the motion honour the
// OS "reduce motion" setting (the ring/logo simply settle static).
//
// Use for full-page/section loading fallbacks — the admin auth-restore, a route
// Suspense fallback, or any "app is getting ready" moment. The very first paint
// is still handled by the HTML splash in public/index.html (also the logo icon).
//
// Props:
//   fullScreen  boolean — fill the viewport height and center (default false)
//   label       string  — caption under the mark (default "Loading…"; pass "" to hide)
//   size        number  — logo icon size in px (default 60)
// =============================================================================
const LOGO_ICON =
  "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png";

const BrandLoader = ({ fullScreen = false, label = "Loading…", size = 60 }) => {
  const ring = size + 26;

  return (
    <div
      className={`${styles.wrap} ${fullScreen ? styles.fullScreen : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.stage} style={{ width: ring, height: ring }}>
        <motion.span
          className={styles.ring}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
          aria-hidden="true"
        />
        <motion.img
          src={LOGO_ICON}
          alt=""
          aria-hidden="true"
          className={styles.logo}
          style={{ width: size, height: size }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </span>

      {label ? (
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      ) : null}
      <span className={styles.srOnly}>Loading</span>
    </div>
  );
};

export default BrandLoader;
