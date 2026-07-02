import React from "react";
import { STOREFRONT_CONFIG, TRUST_BADGE_CATALOG } from "../../theme/tokens";
import styles from "./TrustBadges.module.css";

// =============================================================================
// TrustBadges — reassurance signals near the decision point
// =============================================================================
// Which badges appear (and their order) is CONFIG-DRIVEN via
// STOREFRONT_CONFIG.trustBadges — a new client re-skins these without code.
// These are store-owner-attested *capability* signals (genuine building
// materials, bulk availability, expert guidance, best price on enquiry) —
// legitimately configurable copy, NOT live demand/scarcity signals. NEBM is an
// ENQUIRY platform, so nothing here promises shipping, COD or returns, and there
// are no live-number sub-labels to fabricate.
//
// Props:
//   ids       array   override the configured badge ids (optional)
//   variant   "row"|"grid"
// =============================================================================

const ICONS = {
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  headset: (
    <>
      <path d="M3 18v-6a9 9 0 0118 0v6" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
};

const TrustBadges = ({
  ids = STOREFRONT_CONFIG.trustBadges,
  variant = "grid",
}) => {
  const badges = (ids || [])
    .map((id) => ({ id, ...TRUST_BADGE_CATALOG[id] }))
    .filter((b) => b.icon);

  if (badges.length === 0) return null;

  return (
    <ul className={`${styles.badges} ${styles[variant]}`} aria-label="Why enquire with us">
      {badges.map((b) => (
        <li className={styles.badge} key={b.id}>
          <span className={styles.iconWrap} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[b.icon]}
            </svg>
          </span>
          <span className={styles.text}>
            <span className={styles.label}>{b.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};

export default TrustBadges;
