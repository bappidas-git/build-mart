// App Info (override via .env)
export const APP_NAME = process.env.REACT_APP_NAME || "North East Build Mart";
export const APP_TAGLINE = "Building materials for interior & exterior";
export const APP_DESCRIPTION =
  "Building materials for interior and exterior work — browse the catalogue and send an enquiry for pricing, bulk quotes and availability.";

// NEBM brand tagline — the exact marketing line used on the storefront hero and
// other brand surfaces. Kept separate from APP_TAGLINE (a short kicker used by
// the About hero) so a full sentence never has to double as a tight eyebrow.
export const BRAND_TAGLINE =
  "Deals in all kinds of building materials for interior and exterior use.";

// NEBM store contact — FALLBACK values only. The live phone/address shown across
// the storefront come from admin Settings → General via SettingsContext's
// `useStoreContact()` hook; these constants are just what that hook falls back to
// while settings load or if the fetch fails, so no contact surface renders blank.
// Do NOT import these directly into a display component — use `useStoreContact()`
// so an admin edit reaches the site (see PR: storefront contact from Settings).
export const BRAND_ADDRESS = "Lawkhuwa Road, Nagaon, Assam – 782002";
export const BRAND_PHONE_1 = "+91 86385 43526";
export const BRAND_PHONE_2 = "+91 88762 89972";

// Brand assets — single source of truth so Header/Footer/Admin import one value.
// Main logo works on both light and dark backgrounds; the icon is a square mark
// used for the favicon, loader splash, mobile header and other small-icon spots.
export const LOGO_URL =
  "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png";
export const LOGO_ICON_URL =
  "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png";

// Storefront photography — open-license images (Unsplash License: free for
// commercial use, no attribution required). They give the homepage real
// building-materials context instead of a bare gradient.
//   • HERO_IMAGE_URL is only a DEFAULT full-bleed hero background: an
//     admin-managed banner (apiService.banners.getAll) still overrides it when
//     one is configured, and the image is preloaded so a 404 / offline CDN
//     degrades to the branded blue gradient — the hero never shows a bare
//     scrim or a broken image. Sized wide for crisp desktop rendering; the
//     browser downscales it for tablets/phones (background-size: cover).
//   • PROJECT_IMAGE_URL illustrates the "Have a project in mind?" contact band
//     and degrades gracefully via an onError guard.
//   • TRUST_IMAGE_URL is the parallax backdrop of the "Why Choose us" band. A
//     dark scrim sits over it (see Home.module.css) so the heading and cards
//     stay legible; if it 404s the band falls back to a solid surface colour.
export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80";
export const PROJECT_IMAGE_URL =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=80";
export const TRUST_IMAGE_URL =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80";

// Small helper so every hero-slide image string is built the same way (and the
// requested width is easy to tune per slot: wide for a full-bleed background,
// small for a thumbnail).
const unsplash = (id, w) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// =============================================================================
// HERO_SLIDES — the storefront hero carousel (slide 2 onwards)
// =============================================================================
// The hero is a carousel: slide 1 is always the NEBM *brand* hero (logo, name,
// tagline, CTAs — rendered by HeroSection from the brand constants above, NOT
// listed here). Slides 2+ are these honest CATEGORY showcases.
//
// ETHICS BOUNDARY (see tokens.js / STOREFRONT_UX_GUIDELINES.md): NEBM is an
// ENQUIRY platform. These slides are store-owner-attested *category capability*
// copy only — real categories we stock. There are deliberately NO "% off",
// countdowns, fake stock/urgency or deal-timing signals here; every CTA leads
// to a real category listing (or the enquiry flow), never a fabricated deal.
//
// Each slide's `image` is a full-bleed, scrimmed background and `gallery` is a
// small cluster of category thumbnails (image + label) shown alongside the copy
// — the "related product images" of the layout. Every image is an open-license
// Unsplash photo; a broken/offline URL degrades to the branded gradient
// (background) or is hidden via onError (thumbnails), so the slide never shows a
// bare scrim or a broken-image icon. Slide count and copy are data-driven —
// re-skin a client by editing this list, not the component.
export const HERO_SLIDES = [
  {
    id: "finishes",
    eyebrow: "Interior & Exterior",
    title: "Finishes Built to Last",
    subtitle:
      "WPC louvers, designer tiles and roofing sheets — the surfaces that define a space.",
    cta: { label: "Explore Tiles", to: "/products?category=tiles" },
    image: unsplash("photo-1600566752355-35792bedcfea", 1600),
    gallery: [
      {
        label: "Tiles",
        to: "/products?category=tiles",
        image: unsplash("photo-1600566752355-35792bedcfea", 400),
      },
      {
        label: "WPC Louvers",
        to: "/products?category=wpc-louvers",
        image: unsplash("photo-1600607687920-4e2a09cf159d", 400),
      },
      {
        label: "Poly Sheets",
        to: "/products?category=polycarbonate-sheets",
        image: unsplash("photo-1558618666-fcd25c85cd64", 400),
      },
    ],
  },
  {
    id: "bath",
    eyebrow: "Kitchen & Bath",
    title: "Fittings That Fit Right",
    subtitle:
      "Bath fittings, plumbing and hardware from the brands builders and contractors rely on.",
    cta: { label: "Browse Bath Fittings", to: "/products?category=bath-fittings" },
    image: unsplash("photo-1584622650111-993a426fbf0a", 1600),
    gallery: [
      {
        label: "Bath Fittings",
        to: "/products?category=bath-fittings",
        image: unsplash("photo-1584622650111-993a426fbf0a", 400),
      },
      {
        label: "Plumbing",
        to: "/products?category=plumbing",
        image: unsplash("photo-1581092160562-40aa08e78837", 400),
      },
      {
        label: "Hardware",
        to: "/products?category=hardware",
        image: unsplash("photo-1600607687920-4e2a09cf159d", 400),
      },
    ],
  },
  {
    id: "bulk",
    eyebrow: "Bulk & Project Supply",
    title: "Priced for Your Project",
    subtitle:
      "Cement, steel and waterproofing at project scale — send an enquiry for a tailored bulk quote.",
    cta: { label: "Get a Bulk Quote", to: "/products?category=cement" },
    image: unsplash("photo-1503387762-592deb58ef4e", 1600),
    gallery: [
      {
        label: "Cement",
        to: "/products?category=cement",
        image: unsplash("photo-1607400201889-565b1ee75f8e", 400),
      },
      {
        label: "Steel Rods",
        to: "/products?category=steel-rods",
        image: unsplash("photo-1621905251189-08b45d6a269e", 400),
      },
      {
        label: "Waterproofing",
        to: "/products?category=waterproofing-products",
        image: unsplash("photo-1589939705384-5185137a7f0f", 400),
      },
    ],
  },
  {
    id: "doors",
    eyebrow: "Doors & Entryways",
    title: "Doors That Make an Entrance",
    subtitle:
      "Steel, WPC and designer doors — secure, weather-ready and built to hold up in the North East.",
    cta: { label: "Explore Doors", to: "/products?category=doors" },
    image: unsplash("photo-1600585154340-be6161a56a0c", 1600),
    gallery: [
      {
        label: "Steel Doors",
        to: "/products?category=steel-doors",
        image: unsplash("photo-1600585154340-be6161a56a0c", 400),
      },
      {
        label: "WPC Doors",
        to: "/products?category=wpc-doors",
        image: unsplash("photo-1600607687920-4e2a09cf159d", 400),
      },
      {
        label: "Designer Doors",
        to: "/products?category=designer-doors",
        image: unsplash("photo-1600566752355-35792bedcfea", 400),
      },
    ],
  },
  {
    id: "roofing",
    eyebrow: "Roofing & Cladding",
    title: "Cover Every Span",
    subtitle:
      "Polycarbonate, FRP and WPC louver panels — daylight, shade and clean lines for any elevation.",
    cta: {
      label: "Explore Roofing Sheets",
      to: "/products?category=polycarbonate-sheets",
    },
    image: unsplash("photo-1558618666-fcd25c85cd64", 1600),
    gallery: [
      {
        label: "Poly Sheets",
        to: "/products?category=polycarbonate-sheets",
        image: unsplash("photo-1558618666-fcd25c85cd64", 400),
      },
      {
        label: "FRP Sheets",
        to: "/products?category=frp-sheets",
        image: unsplash("photo-1589939705384-5185137a7f0f", 400),
      },
      {
        label: "WPC Louvers",
        to: "/products?category=wpc-louvers",
        image: unsplash("photo-1600607687920-4e2a09cf159d", 400),
      },
    ],
  },
  {
    id: "special",
    eyebrow: "Curated Picks",
    title: "Special Products, Hand-Picked",
    subtitle:
      "A curated edit of standout building materials from across our catalogue — available all year round, not limited-time deals.",
    cta: { label: "See Special Products", to: "/special-offers" },
    image: unsplash("photo-1600566752355-35792bedcfea", 1600),
    gallery: [
      {
        label: "Designer Tiles",
        to: "/products?category=tiles",
        image: unsplash("photo-1600566752355-35792bedcfea", 400),
      },
      {
        label: "Bath Fittings",
        to: "/products?category=bath-fittings",
        image: unsplash("photo-1584622650111-993a426fbf0a", 400),
      },
      {
        label: "WPC Louvers",
        to: "/products?category=wpc-louvers",
        image: unsplash("photo-1600607687920-4e2a09cf159d", 400),
      },
    ],
  },
];

// Routes
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:slug",
  PROFILE: "/profile",
  ORDERS: "/orders",
  ENQUIRY_CONFIRMATION: "/enquiry-confirmation",
  CHECKOUT: "/checkout",
  WISHLIST: "/wishlist",
  SUPPORT: "/support",
  HELP: "/help",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  REFUND: "/refund",
  COOKIES: "/cookies",
  SPECIAL_OFFERS: "/special-offers",
};

// Product flags
export const PRODUCT_FLAGS = {
  FEATURED: "featured",
  TRENDING: "trending",
  HOT: "hot",
  NEW: "new",
  SALE: "sale",
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: "card",
  UPI: "upi",
  COD: "cod",
  WALLET: "wallet",
  NET_BANKING: "net_banking",
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  REFUNDED: "refunded",
};

// Fulfillment statuses
export const FULFILLMENT_STATUS = {
  UNFULFILLED: "unfulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  FULFILLED: "fulfilled",
  RETURNED: "returned",
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PARTIALLY_PAID: "partially_paid",
  REFUNDED: "refunded",
  VOIDED: "voided",
};

// Return statuses
export const RETURN_STATUS = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  RECEIVED: "received",
  REFUNDED: "refunded",
};

// Return reasons
export const RETURN_REASONS = [
  { value: "defective", label: "Defective / Damaged" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not As Described" },
  { value: "changed_mind", label: "Changed Mind" },
  { value: "size_fit", label: "Size / Fit Issue" },
  { value: "quality", label: "Quality Not Satisfactory" },
  { value: "other", label: "Other" },
];

// Currencies
export const CURRENCIES = {
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
};
export const DEFAULT_CURRENCY = CURRENCIES.INR;

// Shipping
// Single source of truth for the free-shipping threshold. Mirrors the
// Standard shipping method's `freeAbove` value in db.json (₹999) and is
// shared by the Header banner and the CartDrawer progress bar.
export const FREE_SHIPPING_THRESHOLD = 999;

// Social links (sensible defaults — update per project). Used by
// useSocialLinks() as the fallback when admin Settings → Social has no URL for
// a platform, so the footer and hamburger icons still render on a fresh store.
// An entry with an empty URL has no fallback and stays hidden until the admin
// saves a link.
export const SOCIAL_LINKS = {
  FACEBOOK: "https://facebook.com/mystore",
  TWITTER: "https://twitter.com/mystore",
  INSTAGRAM: "https://instagram.com/mystore",
  YOUTUBE: "https://youtube.com/@mystore",
  WHATSAPP: "",
};

// Store contact — NEBM. SUPPORT_EMAIL is the fallback the storefront uses when
// admin Settings has no store email yet (legal pages still read it directly).
// The phone/address that used to live here (SUPPORT_PHONE/SUPPORT_ADDRESS) are
// now served live from Settings via `useStoreContact()` — see BRAND_* above.
export const SUPPORT_EMAIL = "info@northeastbuildmart.com";
export const SUPPORT_HOURS = "Mon – Sat: 9:00 AM – 8:00 PM IST";

// Date the legal/policy pages were last reviewed. Single source so the Privacy,
// Terms, Cookie and Refund pages never show contradictory "last updated" dates.
export const POLICY_LAST_UPDATED = "June 1, 2026";

// FAQs — written for the enquiry model (NEBM is not an online checkout store).
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "How do I get a price or place an enquiry?",
    answer:
      "Browse the catalogue, add the items you need to your Enquiry List, and submit an enquiry with your contact details. Our team reviews it and gets back to you with pricing, availability and the best way to proceed.",
  },
  {
    id: 2,
    question: "Why do some products show \"Price on Enquiry\"?",
    answer:
      "Prices on building materials vary with grade, brand, quantity and current stock. For these items we quote you directly so the rate is accurate for what your project actually needs — just add them to your Enquiry List and send it across.",
  },
  {
    id: 3,
    question: "Do you offer bulk or project pricing?",
    answer:
      "Yes. Many products have tiered pricing, so larger quantities get better rates. For project or contractor requirements, mention the quantities in your enquiry and we'll prepare a tailored bulk quote.",
  },
  {
    id: 4,
    question: "Do you deliver, and where?",
    answer:
      "We deliver across Nagaon and the wider North East region. Delivery options, timelines and any charges are confirmed along with your quote, based on the items and destination.",
  },
  {
    id: 5,
    question: "How can I reach North East Build Mart?",
    answer:
      "Call or message us on either of our numbers, email us, or visit the store on Lawkhuwa Road, Nagaon. You can also send an enquiry from any product page and we'll respond as soon as we can.",
  },
];

// Why choose us — NEBM (building-materials supplier). Reworded for the enquiry
// model: no payments/returns/fake stats. Shared by the homepage trust band and
// the About page.
export const WHY_CHOOSE_US = [
  {
    id: 1,
    title: "Wide Catalogue",
    description:
      "Everything for interior and exterior work — sheets, tiles, doors, hardware and more, in one place.",
    icon: "mdi:warehouse",
  },
  {
    id: 2,
    title: "Bulk & Tiered Pricing",
    description:
      "Better rates on larger quantities — send an enquiry for a tailored bulk quote.",
    icon: "mdi:tag-multiple",
  },
  {
    id: 3,
    title: "Trusted Brands",
    description:
      "Quality products from names builders and contractors rely on.",
    icon: "mdi:check-decagram",
  },
  {
    id: 4,
    title: "Local Delivery",
    description:
      "Reliable delivery across Nagaon and the wider North East region.",
    icon: "mdi:truck-fast",
  },
];

// Framer Motion animation variants
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
  slideDown: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  },
  slideLeft: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  },
  slideRight: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
};

// Breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 768,
  MD: 1024,
  LG: 1280,
  XL: 1440,
};

// Trust badges — enquiry model (no payments/returns messaging).
export const TRUST_BADGES = [
  "Wide Building-Materials Range",
  "Bulk & Tiered Pricing",
  "Local North East Delivery",
  "Trusted Brands",
];
