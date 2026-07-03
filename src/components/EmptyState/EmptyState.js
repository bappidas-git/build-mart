import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Icon as Iconify } from "@iconify/react";
import { onImageError } from "../../utils/helpers";
import styles from "./EmptyState.module.css";

// =============================================================================
// EmptyState — the ONE canonical storefront empty state
// =============================================================================
// Apple-minimal, brand-tinted, single-CTA empty state used by every storefront
// "loaded-but-empty" surface: the Enquiry List (page + drawer), no product
// results, the wishlist, empty reviews and customer "My Enquiries". It is
// presentation only — it is rendered ONLY for genuinely empty data, never for a
// mid-load or a caught error (those keep their own skeleton / error states).
//
// Styled entirely by the --sf-* design tokens (works light + dark) and animated
// with a subtle fade-in-up; the app-level <MotionConfig reducedMotion="user">
// plus the token zeroing in storefront-tokens.css make it reduced-motion-safe.
//
// Props:
//   icon         iconify id ("mdi:*") OR an image URL (Icons8/Cloudinary).
//                Default: mdi:clipboard-text-outline.
//   title        string   (required) — the heading line
//   description  node     optional supporting copy (accepts JSX, e.g. a bold
//                          search term)
//   action       optional SINGLE CTA — one of:
//                   { label, to }        → renders a react-router <Link>
//                   { label, onClick }   → renders a <button>
//                   { label, to, onClick } → Link that also fires onClick
//                          (e.g. to close a drawer before navigating)
//   tone         "blue" | "gold"  — icon tint (default "blue")
//   compact      boolean — tighter padding + smaller icon (drawers / sections)
//   className    optional extra class on the wrapper
// =============================================================================
const isImageSrc = (v) => typeof v === "string" && /^(https?:|data:|\/)/.test(v);

const EmptyState = ({
  icon = "mdi:clipboard-text-outline",
  title,
  description,
  action,
  tone = "blue",
  compact = false,
  className = "",
}) => {
  const img = isImageSrc(icon);

  return (
    <motion.div
      className={`${styles.wrap} ${compact ? styles.compact : ""} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className={`${styles.iconWrap} ${tone === "gold" ? styles.gold : styles.blue}`}
      >
        {img ? (
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            className={styles.iconImg}
            onError={onImageError}
          />
        ) : (
          <Iconify
            icon={icon}
            className={styles.icon}
            width="44"
            height="44"
            aria-hidden="true"
          />
        )}
      </div>

      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.desc}>{description}</p>}

      {action &&
        (action.to ? (
          <Link to={action.to} className={styles.cta} onClick={action.onClick}>
            {action.label}
          </Link>
        ) : (
          <button type="button" className={styles.cta} onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </motion.div>
  );
};

export default EmptyState;
