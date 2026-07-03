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

// NEBM store contact — single source for the storefront brand/contact surfaces
// (homepage hero + contact CTA). The Footer/Contact/Support pages carry their
// own SUPPORT_* values today and are consolidated onto these by their own
// prompts (23/24); until then these are the canonical NEBM details.
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

// Social links (sensible defaults — update per project). The Footer renders an
// icon only for entries with a non-empty URL, so blanking one here hides it
// instead of leaving a dead link.
export const SOCIAL_LINKS = {
  FACEBOOK: "https://facebook.com/mystore",
  TWITTER: "https://twitter.com/mystore",
  INSTAGRAM: "https://instagram.com/mystore",
  YOUTUBE: "https://youtube.com/@mystore",
  WHATSAPP: "",
};

// Store contact — NEBM. Single source so the Header top bar, Help Center and
// Support/legal pages all stay in sync with the brand details above.
export const SUPPORT_EMAIL = "info@northeastbuildmart.com";
export const SUPPORT_PHONE = BRAND_PHONE_1;
export const SUPPORT_ADDRESS = BRAND_ADDRESS;
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
