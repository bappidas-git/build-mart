// App Info (override via .env)
export const APP_NAME = process.env.REACT_APP_NAME || "North East Build Mart";
export const APP_TAGLINE = "Quality products, great prices";
export const APP_DESCRIPTION = "Shop with confidence – fast delivery, secure payments, easy returns";

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

// Store contact (sensible defaults — update per project). Single source so the
// Header top bar, Footer, Help Center and Support page all stay in sync.
export const SUPPORT_EMAIL = "support@mystore.com";
export const SUPPORT_PHONE = "+91 86385 43526";
export const SUPPORT_ADDRESS =
  "123 Commerce Street, Andheri East, Mumbai, Maharashtra 400069";
export const SUPPORT_HOURS = "Mon – Sat: 9:00 AM – 8:00 PM IST";

// Date the legal/policy pages were last reviewed. Single source so the Privacy,
// Terms, Cookie and Refund pages never show contradictory "last updated" dates.
export const POLICY_LAST_UPDATED = "June 1, 2026";

// FAQs
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 5-7 business days. Express delivery is available in 2-3 business days. Same-day delivery is available in select cities.",
  },
  {
    id: 2,
    question: "What is your return policy?",
    answer:
      "We offer a 7-day hassle-free return policy. If you're not satisfied with your purchase, you can request a return within 7 days of delivery. Refunds are processed within 5-7 business days.",
  },
  {
    id: 3,
    question: "Is payment secure?",
    answer:
      "Yes, all payments are processed through industry-standard SSL encryption. We support UPI, credit/debit cards, net banking, and Cash on Delivery.",
  },
  {
    id: 4,
    question: "Do you offer Cash on Delivery?",
    answer:
      "Yes, Cash on Delivery is available on orders up to ₹50,000 in most pin codes across India.",
  },
  {
    id: 5,
    question: "How do I track my order?",
    answer:
      "Once your order is shipped, you'll receive an email with a tracking number. You can track your order from the 'My Orders' section in your account.",
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

// Trust badges
export const TRUST_BADGES = [
  "100% Secure Payment",
  "Easy 7-Day Returns",
  "24/7 Support",
  "Best Price Guarantee",
];
