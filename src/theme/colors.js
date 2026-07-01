// =====================================================================
// GLOBAL COLOR THEME — Edit this file to restyle the entire storefront
// =====================================================================
// All colors used by the front-end come from here. The admin panel uses
// its own hardcoded palette and is NOT affected by changes to this file.
//
// HOW TO USE:
//   1. Change the hex values below.
//   2. Save the file — hot-reload picks up the changes instantly in dev.
//   3. Rebuild for production: `npm run build`.
// =====================================================================

// ---------------------
// LIGHT MODE PALETTE
// ---------------------
export const LIGHT = {
  // Primary brand color — NEBM Blue; used for buttons, links, active states
  primary: {
    main:  "#1885d8",
    light: "#4ea3e3",
    dark:  "#1069b0",
  },
  // Secondary accent color — NEBM Gold/Orange; badges, hover accents, CTAs (sparingly)
  secondary: {
    main:  "#fa9c4c",
    light: "#fcb576",
    dark:  "#e07f2b",
  },
  // Page and component backgrounds
  background: {
    default: "#f4f7fb",
    paper:   "#ffffff",
  },
  // Text colors
  text: {
    primary:   "#1a202c",
    secondary: "#4a5568",
  },
  // Gradient used for contained buttons, hero section, etc.
  gradient: {
    primary:        "linear-gradient(135deg, #1885d8 0%, #1069b0 100%)",
    primaryReverse: "linear-gradient(135deg, #1069b0 0%, #1885d8 100%)",
    // Hero background gradient
    hero: "linear-gradient(135deg, #1885d8 0%, #1069b0 55%, #4ea3e3 100%)",
  },
  // Body background applied on initial HTML load (before React mounts)
  bodyBackground: "linear-gradient(135deg, #f4f7fb 0%, #ffffff 100%)",
};

// ---------------------
// DARK MODE PALETTE
// ---------------------
export const DARK = {
  // Lifted blue so the brand reads clearly on dark surfaces
  primary: {
    main:  "#4ea3e3",
    light: "#7bbced",
    dark:  "#1885d8",
  },
  secondary: {
    main:  "#fa9c4c",
    light: "#fcb576",
    dark:  "#e07f2b",
  },
  // Deep navy "blue brand dark" (not purple)
  background: {
    default: "#0b1a2e",
    paper:   "#122238",
  },
  text: {
    primary:   "#f5f7fa",
    secondary: "#a0aec0",
  },
  gradient: {
    primary:        "linear-gradient(135deg, #4ea3e3 0%, #1885d8 100%)",
    primaryReverse: "linear-gradient(135deg, #1885d8 0%, #4ea3e3 100%)",
    hero: "linear-gradient(135deg, #0b1a2e 0%, #122238 55%, #1069b0 100%)",
  },
  bodyBackground: "linear-gradient(135deg, #0b1a2e 0%, #122238 100%)",
};
