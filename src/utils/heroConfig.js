// =============================================================================
// Hero carousel configuration — shared shape, defaults & helpers
// =============================================================================
//
// The storefront hero is now FULLY admin-managed. Its config lives in a single
// `heroConfig` record (a json-server singleton in mock mode, `GET/PUT
// /hero/config` on Laravel) and is the SINGLE SOURCE OF TRUTH for the whole
// carousel:
//
//   • enabled     — master show/hide for the entire hero band.
//   • autoplayMs  — auto-advance dwell time (ms) between slides.
//   • slides[]    — an ordered list of slides the admin can add / edit / delete /
//                   reorder. Each slide is one of two kinds:
//
//       type: "brand"    — the logo + name + tagline + two CTAs hero.
//       type: "showcase" — a headline slide: eyebrow/badge (offers, new launch,
//                          daily offers…), title, subtitle, up to two CTAs, an
//                          optional cluster of thumbnail cards (gallery), and a
//                          full-bleed background that can be an IMAGE or a VIDEO
//                          (direct .mp4/.webm file OR a YouTube / Vimeo link).
//
// The component (HeroSection) renders straight from this normalized shape, so a
// client can be re-skinned — or a fresh offer slide added with a photo or a
// video — entirely from the admin panel, never by editing code.
//
// Everything is tolerant: a missing/partial record, or the legacy `{ image }` /
// `{ cta }` slide shape, is upgraded to the full shape by normalizeHeroConfig so
// the storefront and admin always work against a complete object.
// =============================================================================

import {
  APP_NAME,
  BRAND_TAGLINE,
  BRAND_PHONE_1,
  LOGO_URL,
  HERO_IMAGE_URL,
  HERO_SLIDES,
} from "./constants";

export const HERO_SLIDE_TYPES = [
  { value: "brand", label: "Brand hero (logo + tagline)" },
  { value: "showcase", label: "Showcase slide (headline + media)" },
];

export const HERO_MEDIA_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export const HERO_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
];

// A few ready-to-use badge presets so the admin can flag a slide as an offer /
// launch in one click. `color` is any CSS colour; empty = the default gold.
export const HERO_BADGE_PRESETS = [
  { label: "New Launch", color: "#22c55e" },
  { label: "Today's Offer", color: "#f59e0b" },
  { label: "Daily Deals", color: "#ef4444" },
  { label: "Limited Time", color: "#8b5cf6" },
  { label: "Bulk Pricing", color: "#0ea5e9" },
];

const DEFAULT_AUTOPLAY_MS = 6000;

// Strip formatting so "+91 86385 43526" becomes a valid tel: target.
export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

// Coerce anything to a trimmed-safe string (null/number tolerant).
const str = (v, fallback = "") =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

// --- ID generation ----------------------------------------------------------
// Slides need stable keys for React and for reorder/delete in the editor. New
// slides created in the admin get a fresh id; existing ones keep theirs.
let idSeq = 0;
export const genSlideId = () =>
  `slide-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

// --- Media helpers ----------------------------------------------------------
// A slide background can be a plain image, a direct video file, or an embeddable
// YouTube / Vimeo link. resolveVideoSource classifies a video URL so the
// component can pick <video> (file) vs <iframe> (embed) and build an autoplay,
// muted, looped source that works as a silent background.
export const resolveVideoSource = (url) => {
  const u = str(url).trim();
  if (!u) return { kind: "none", src: "" };

  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) {
    const id = yt[1];
    return {
      kind: "embed",
      src:
        `https://www.youtube.com/embed/${id}` +
        `?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0` +
        `&rel=0&modestbranding=1&playsinline=1&disablekb=1`,
    };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    return {
      kind: "embed",
      src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1`,
    };
  }

  // Anything else is treated as a direct video file (best effort).
  return { kind: "file", src: u };
};

// A CTA target that isn't an in-app route (external site, phone, mail) must be a
// plain <a>, not a react-router <Link>.
export const isExternalLink = (to) =>
  /^(https?:|tel:|mailto:)/i.test(str(to).trim());

// --- Normalizers ------------------------------------------------------------
const normalizeCta = (cta) => {
  const c = cta && typeof cta === "object" ? cta : {};
  return { label: str(c.label), to: str(c.to) };
};

const normalizeGalleryItem = (g) => {
  const it = g && typeof g === "object" ? g : {};
  return { label: str(it.label), to: str(it.to), image: str(it.image) };
};

// Accept both the new `{ media: { type, url, poster } }` shape and the legacy
// `{ image }` shape (constants.js HERO_SLIDES) so old data upgrades cleanly.
const normalizeMedia = (slide) => {
  const m = slide.media && typeof slide.media === "object" ? slide.media : {};
  const type = m.type === "video" ? "video" : "image";
  const url = str(m.url) || (type === "image" ? str(slide.image) : "");
  return { type, url, poster: str(m.poster) };
};

export const normalizeSlide = (raw, i = 0) => {
  const s = raw && typeof raw === "object" ? raw : {};
  const type = s.type === "brand" ? "brand" : "showcase";
  return {
    id: s.id != null && s.id !== "" ? String(s.id) : `slide-${i}`,
    type,
    enabled: s.enabled !== false,
    eyebrow: str(s.eyebrow),
    eyebrowColor: str(s.eyebrowColor),
    logo: str(s.logo),
    title: str(s.title),
    subtitle: str(s.subtitle),
    align: s.align === "center" ? "center" : type === "brand" ? "center" : "left",
    media: normalizeMedia(s),
    // Accept legacy `cta` as the primary CTA.
    primaryCta: normalizeCta(s.primaryCta || s.cta),
    secondaryCta: normalizeCta(s.secondaryCta),
    gallery: Array.isArray(s.gallery) ? s.gallery.map(normalizeGalleryItem) : [],
  };
};

// The default brand slide (logo + name + tagline + Explore / Enquire CTAs).
const DEFAULT_BRAND_SLIDE = {
  id: "brand",
  type: "brand",
  enabled: true,
  logo: LOGO_URL,
  title: APP_NAME,
  subtitle: BRAND_TAGLINE,
  align: "center",
  media: { type: "image", url: HERO_IMAGE_URL, poster: "" },
  primaryCta: { label: "Explore Products", to: "/products" },
  secondaryCta: { label: "Enquire Now", to: telHref(BRAND_PHONE_1) },
  gallery: [],
};

// The default showcase slides are the honest category showcases that already
// shipped (constants.js HERO_SLIDES), upgraded to the new shape. Keeping them in
// one place means a fresh install / missing record renders exactly what shipped.
export const DEFAULT_HERO_CONFIG = {
  enabled: true,
  autoplayMs: DEFAULT_AUTOPLAY_MS,
  slides: [DEFAULT_BRAND_SLIDE, ...(HERO_SLIDES || [])].map((s, i) =>
    normalizeSlide(s, i)
  ),
};

// Fill in any missing fields so callers always get a complete config. An empty
// or missing `slides` list falls back to the shipped defaults so the homepage
// never renders a bare band.
export const normalizeHeroConfig = (raw) => {
  const cfg = raw && typeof raw === "object" ? raw : {};
  const hasSlides = Array.isArray(cfg.slides) && cfg.slides.length > 0;
  const slides = (hasSlides ? cfg.slides : DEFAULT_HERO_CONFIG.slides).map(
    (s, i) => normalizeSlide(s, i)
  );
  const autoplayMs = Number(cfg.autoplayMs);
  return {
    enabled: cfg.enabled !== false,
    autoplayMs:
      Number.isFinite(autoplayMs) && autoplayMs >= 1000
        ? autoplayMs
        : DEFAULT_AUTOPLAY_MS,
    slides,
  };
};

// --- Editor factories -------------------------------------------------------
export const makeBlankGalleryItem = () => ({ label: "", to: "", image: "" });

export const makeBlankSlide = (type = "showcase") =>
  normalizeSlide({
    id: genSlideId(),
    type,
    enabled: true,
    align: type === "brand" ? "center" : "left",
    media: { type: "image", url: "", poster: "" },
    primaryCta: { label: "", to: "" },
    secondaryCta: { label: "", to: "" },
    gallery: [],
    ...(type === "brand"
      ? { logo: LOGO_URL, title: APP_NAME, subtitle: BRAND_TAGLINE }
      : {}),
  });
