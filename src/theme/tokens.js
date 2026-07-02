// =============================================================================
// STOREFRONT TOKENS & CONFIG (JS layer)
// =============================================================================
//
// Two things live here:
//
//   1. TOKENS — a JS mirror of the structural design tokens (the visual scale)
//      defined as CSS custom properties in `storefront-tokens.css`. Use these in
//      the rare places JS needs a token value (e.g. inline styles, framer-motion).
//      CSS Modules should prefer the `var(--sf-*)` custom properties directly.
//
//   2. STOREFRONT_CONFIG — the themeable *content* configuration that lets a new
//      client re-skin the storefront's persuasive surfaces WITHOUT touching
//      component code: which trust badges to show and which Average-Order-Value
//      modules are enabled.
//
// ETHICS BOUNDARY (read STOREFRONT_UX_GUIDELINES.md):
//   The values here are *store-owner-attested capability* (e.g. "we stock
//   genuine building materials", "bulk quantities available") — legitimately
//   configurable copy. They are NOT live "social proof" or "urgency" signals.
//   Anything that implies live demand, stock, ratings or deal-timing must come
//   from the API at render time, never from this config. Components are built so
//   that fake live signals are structurally impossible (see SocialProof,
//   RelatedProducts, AddToCartBar). NEBM is an ENQUIRY platform, so these signals
//   never promise shipping, COD or returns.
// =============================================================================

// --- Structural token mirror (keep in sync with storefront-tokens.css) -------
export const TOKENS = {
  radius: { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  breakpoints: { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1440 },
  tapTarget: 44,
  containerMax: 1280,
};

// --- Trust-badge catalogue ---------------------------------------------------
// A small, fixed catalogue of reassurance badges keyed by id. A client picks
// which to show via STOREFRONT_CONFIG.trustBadges (an ordered list of ids). The
// icon set is built into <TrustBadges/>; copy can be overridden per badge.
//
// NEBM is an ENQUIRY platform — customers browse and enquire, they never buy,
// pay, ship or return. So these badges are honest *capability* signals only
// (genuine stock, bulk availability, guidance, price-on-enquiry); there is no
// shipping / COD / returns promise, and therefore no `dynamic` live-number
// badges. Re-skin a client by editing this catalogue + the ordered list below.
export const TRUST_BADGE_CATALOG = {
  genuineMaterials: { icon: "shield", label: "Genuine Building Materials" },
  bulkQuantities: { icon: "layers", label: "Bulk Quantities Available" },
  expertGuidance: { icon: "headset", label: "Expert Guidance" },
  priceOnEnquiry: { icon: "tag", label: "Best Price on Enquiry" },
};

// --- The per-client storefront configuration --------------------------------
export const STOREFRONT_CONFIG = {
  // Which trust signals appear near the buy box, in order. Enquiry-safe by
  // default (no shipping/COD/returns promises); a new client re-skins by
  // reordering/swapping catalogue ids above — never by editing component code.
  trustBadges: ["genuineMaterials", "bulkQuantities", "expertGuidance", "priceOnEnquiry"],

  // Average-Order-Value modules. Each is data-driven and renders nothing when
  // there is no real data to back it — toggles here only gate *whether we try*.
  // (Bundle "buy together" pricing was removed with the enquiry pivot; only the
  // honest "you may also like" related-products carousel remains.)
  aov: {
    relatedProducts: true,
    maxRelated: 10,
  },

  // Product gallery behaviour (presentation only).
  gallery: {
    zoom: true,          // desktop hover-zoom on the main image
    thumbnailPosition: "side", // "side" (desktop) gracefully stacks on mobile
  },
};

const tokens = { TOKENS, STOREFRONT_CONFIG, TRUST_BADGE_CATALOG };
export default tokens;
