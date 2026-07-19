import { api, extractData, extractList, getErrorMessage } from "./api";
import { IS_MOCK_API } from "./baseURL";

// =============================================================================
// Testimonials API — the complete service layer for the Testimonial Module
// =============================================================================
//
// Self-contained on purpose (same shape as careersApi.js): nothing in
// apiService is modified, so the module can be added or removed without
// touching existing domains. It reuses the shared axios client (auth
// interceptors, base URL) and response helpers from services/api.js, and
// follows the same dual-mode convention:
//
//   JSON Server (dev)       Laravel (production)
//   /testimonials       →   /testimonials, /admin/testimonials
//   /testimonialsPage   →   /testimonials/page, /admin/testimonials/page
//
// Switching to production is the same one-line .env change as the rest of the
// app (REACT_APP_USE_MOCK_API=false) — no code changes here.
// =============================================================================

// -----------------------------------------------------------------------------
// Domain vocabulary — single source of truth for labels/colours across the
// storefront and admin. Never re-declare these in components.
// -----------------------------------------------------------------------------

export const TESTIMONIAL_TYPES = [
  { value: "text", label: "Text Review", icon: "mdi:text-box-outline" },
  { value: "photo", label: "Photo", icon: "mdi:image-outline" },
  { value: "video", label: "Video", icon: "mdi:video-outline" },
];

export const TESTIMONIAL_STATUSES = [
  { value: "published", label: "Published", color: "success" },
  { value: "draft", label: "Draft", color: "default" },
  { value: "archived", label: "Archived", color: "warning" },
];

// Layouts the homepage section renderer understands.
export const HOME_LAYOUTS = [
  { value: "carousel", label: "Carousel", icon: "mdi:view-carousel-outline" },
  { value: "grid", label: "Card Grid", icon: "mdi:view-grid-outline" },
];

export const HOME_SORTS = [
  { value: "order", label: "Manual order" },
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Highest rated" },
];

export const TESTIMONIAL_SOURCES = [
  { value: "direct", label: "Collected directly" },
  { value: "google", label: "Google Reviews" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "other", label: "Other" },
];

export const typeMeta = (value) =>
  TESTIMONIAL_TYPES.find((t) => t.value === value) || TESTIMONIAL_TYPES[0];

export const statusMeta = (value) =>
  TESTIMONIAL_STATUSES.find((s) => s.value === value) || TESTIMONIAL_STATUSES[1];

// -----------------------------------------------------------------------------
// Media URL security + provider detection
// -----------------------------------------------------------------------------
// Admins paste plain URLs (CDN, cloud storage, YouTube, Vimeo…). Everything
// rendered from them goes through these helpers so an unsafe scheme
// (javascript:, data:) or a malformed URL can never reach an <img>, <video> or
// <iframe>. Embeds are built from PARSED IDs onto fixed provider hosts — the
// pasted string itself is never used as an iframe src.

/** True when the URL parses and uses http(s). Everything else is rejected. */
export const isSafeMediaUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

/** Returns the trimmed URL when safe, otherwise an empty string. */
export const sanitizeMediaUrl = (value) =>
  isSafeMediaUrl(value) ? value.trim() : "";

const DIRECT_VIDEO_RE = /\.(mp4|webm|ogg|ogv|m4v|mov)(\?.*)?$/i;

/**
 * Detect a video URL's provider and derive everything the player facade needs.
 *
 * Returns null for unsafe/unrecognised URLs, otherwise:
 *   {
 *     provider   "youtube" | "vimeo" | "facebook" | "instagram" | "file"
 *     label      human name for the "Watch on …" action
 *     kind       "iframe" | "file"   (file → native <video>)
 *     embedUrl   src for the iframe (built from the parsed ID, never raw input);
 *                unmuted — for click activation, where a user gesture allows sound
 *     mutedEmbedUrl  same embed with the provider's mute flag — the only form of
 *                autoplay every mobile/desktop browser permits without a gesture,
 *                used when the player auto-activates on scroll into view
 *     watchUrl   canonical page on the original platform (new-tab action)
 *     thumbnailUrl  best-effort poster (may be "" — caller falls back)
 *   }
 *
 * Cloudinary/CDN/direct links are matched by file extension (or a Cloudinary
 * `/video/upload/` path) and rendered with a native <video> element.
 */
export const detectVideoProvider = (rawUrl) => {
  if (!isSafeMediaUrl(rawUrl)) return null;
  const url = new URL(rawUrl.trim());
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // ---- YouTube (watch / share / shorts / embed / live) ----
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    let id = "";
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.searchParams.get("v")) {
      id = url.searchParams.get("v");
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((p) => ["embed", "shorts", "live", "v"].includes(p));
      if (marker !== -1) id = parts[marker + 1] || "";
    }
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    return {
      provider: "youtube",
      label: "YouTube",
      kind: "iframe",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1`,
      mutedEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1&mute=1`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // ---- Vimeo ----
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = (url.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p)) || "");
    if (!id) return null;
    return {
      provider: "vimeo",
      label: "Vimeo",
      kind: "iframe",
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1`,
      mutedEmbedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1&muted=1`,
      watchUrl: `https://vimeo.com/${id}`,
      // vumbnail proxies Vimeo's thumbnail API without needing an access token.
      thumbnailUrl: `https://vumbnail.com/${id}.jpg`,
    };
  }

  // ---- Facebook video (page videos + fb.watch shares) ----
  if (["facebook.com", "m.facebook.com", "fb.watch"].includes(host)) {
    const canonical = url.href;
    return {
      provider: "facebook",
      label: "Facebook",
      kind: "iframe",
      // Facebook's player handles the muted-autoplay policy itself, so both
      // activation paths share one embed URL.
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=false&autoplay=true`,
      mutedEmbedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=false&autoplay=true`,
      watchUrl: canonical,
      thumbnailUrl: "",
    };
  }

  // ---- Instagram (posts + reels, where embeddable) ----
  if (host === "instagram.com" || host === "instagr.am") {
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((p) => ["p", "reel", "reels", "tv"].includes(p));
    const code = marker !== -1 ? parts[marker + 1] : "";
    if (!/^[\w-]{5,}$/.test(code || "")) return null;
    return {
      provider: "instagram",
      label: "Instagram",
      kind: "iframe",
      // Instagram's basic embed has no autoplay flag — auto-activation just
      // mounts the embed and the visitor taps play inside it.
      embedUrl: `https://www.instagram.com/p/${code}/embed/`,
      mutedEmbedUrl: `https://www.instagram.com/p/${code}/embed/`,
      watchUrl: `https://www.instagram.com/p/${code}/`,
      thumbnailUrl: "",
    };
  }

  // ---- Direct files: Cloudinary, CDNs, storage buckets, plain MP4 links ----
  if (DIRECT_VIDEO_RE.test(url.pathname) || url.pathname.includes("/video/upload/")) {
    return {
      provider: "file",
      label: "the original site",
      kind: "file",
      // Direct files mute via the <video> muted attribute, not the URL.
      embedUrl: url.href,
      mutedEmbedUrl: url.href,
      watchUrl: url.href,
      thumbnailUrl: "",
    };
  }

  return null;
};

/** Validation message for an admin-entered media URL, or null when valid. */
export const validateMediaUrl = (type, urlValue) => {
  if (type === "text") return null;
  if (!urlValue || !urlValue.trim()) {
    return type === "photo" ? "A photo URL is required" : "A video URL is required";
  }
  if (!isSafeMediaUrl(urlValue)) {
    return "Enter a full http(s):// URL";
  }
  if (type === "video" && !detectVideoProvider(urlValue)) {
    return "Unrecognised video URL — paste a YouTube, Vimeo, Facebook, Instagram or direct video file link";
  }
  return null;
};

// -----------------------------------------------------------------------------
// Shared predicates + sorting
// -----------------------------------------------------------------------------

export const isPublished = (t) => !!t && t.status === "published";

const bySortOrder = (a, b) =>
  (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
  new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0);

const byNewest = (a, b) => new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0);

const byRating = (a, b) =>
  (Number(b.rating) || 0) - (Number(a.rating) || 0) || byNewest(a, b);

/** Sort a list by an admin-configured strategy ("order" | "newest" | "rating"). */
export const sortTestimonials = (list, sort = "order") => {
  const sorted = [...list];
  if (sort === "newest") return sorted.sort(byNewest);
  if (sort === "rating") return sorted.sort(byRating);
  return sorted.sort(bySortOrder);
};

// -----------------------------------------------------------------------------
// Homepage showcase selection — shared by the storefront and the admin
// -----------------------------------------------------------------------------
// The showcase honours several controls at once (per-testimonial placement
// flag, featuredOnly, sort strategy, maxItems). The storefront picker and the
// admin's visibility indicator both run through these helpers so they can
// never disagree about what is actually on the homepage.

/** Published testimonials eligible for the homepage, in configured order, uncapped. */
const eligibleForHome = (published, cfg = {}) => {
  let items = (published || []).filter((t) => t.placements?.home !== false);
  if (cfg.featuredOnly) items = items.filter((t) => t.featured === true);
  return sortTestimonials(items, cfg.sort || "order");
};

const homeMaxItems = (cfg = {}) => Math.max(1, Number(cfg.maxItems) || 6);

/** The exact homepage selection for a given `home` config block. */
export const selectHomeItems = (published, cfg = {}) =>
  eligibleForHome(published, cfg).slice(0, homeMaxItems(cfg));

/**
 * Why a record is — or isn't — part of the homepage showcase right now.
 * Powers the admin library's per-row indicator and the edit dialog hint, so
 * the "Homepage showcase" switch is never a silent no-op: a testimonial can
 * carry the flag yet stay invisible (unpublished, featured-only mode, or
 * beyond the maxItems cap — new records join at the END of the manual order).
 *
 * Returns { visible, reason, canPromote? } — reason is null when visible;
 * canPromote marks the one case a front-of-manual-order move would fix.
 */
export const explainHomeVisibility = (record, allRecords, page) => {
  const cfg = page?.home || {};
  if (cfg.enabled === false) {
    return { visible: false, reason: "The homepage showcase is turned off in Display Settings." };
  }
  if (!isPublished(record)) {
    return {
      visible: false,
      reason: `Only published testimonials reach the storefront — this one is ${statusMeta(record?.status).label.toLowerCase()}.`,
    };
  }
  if (record.placements?.home === false) {
    return { visible: false, reason: 'The "Homepage showcase" placement is switched off for this testimonial.' };
  }
  if (cfg.featuredOnly && record.featured !== true) {
    return {
      visible: false,
      reason: "Display Settings limits the showcase to featured testimonials — feature this one to include it.",
    };
  }
  const eligible = eligibleForHome((allRecords || []).filter(isPublished), cfg);
  const max = homeMaxItems(cfg);
  const position = eligible.findIndex((t) => String(t.id) === String(record.id)) + 1;
  if (position >= 1 && position <= max) {
    return { visible: true, reason: null };
  }
  const sort = cfg.sort || "order";
  const shown =
    sort === "newest" ? `${max} newest` : sort === "rating" ? `${max} highest-rated` : `first ${max} in manual order`;
  const remedy =
    sort === "order"
      ? 'Move it up via Reorder, or raise "Max items" in Display Settings.'
      : 'Raise "Max items" in Display Settings to include more.';
  return {
    visible: false,
    canPromote: sort === "order",
    reason: `Beyond the showcase limit — the homepage shows the ${shown} of ${eligible.length} eligible testimonials and this one is #${position}. ${remedy}`,
  };
};

// -----------------------------------------------------------------------------
// SEO — schema.org Review structured data for crawlers
// -----------------------------------------------------------------------------

/** JSON-LD for the testimonials page: an ItemList of Reviews of the store. */
export const buildReviewsJsonLd = (testimonials, storeName = "North East Build Mart") => {
  const items = (testimonials || []).filter(isPublished);
  if (!items.length) return null;
  const ratings = items.map((t) => Number(t.rating) || 0).filter((r) => r > 0);
  const avg = ratings.length
    ? ratings.reduce((s, r) => s + r, 0) / ratings.length
    : null;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: storeName,
    ...(avg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avg.toFixed(1)),
            reviewCount: ratings.length,
            bestRating: 5,
          },
        }
      : {}),
    review: items.slice(0, 25).map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.customerName },
      datePublished: t.reviewDate || undefined,
      name: t.title || undefined,
      reviewBody: t.body || undefined,
      ...(Number(t.rating) > 0
        ? {
            reviewRating: {
              "@type": "Rating",
              ratingValue: Number(t.rating),
              bestRating: 5,
            },
          }
        : {}),
    })),
  };
};

// -----------------------------------------------------------------------------
// Public (storefront) API
// -----------------------------------------------------------------------------

const publicApi = {
  /** Display-settings singleton (page hero/SEO + homepage/PDP section config). */
  getPage: async () => {
    if (IS_MOCK_API) {
      const response = await api.get("/testimonialsPage");
      return response.data || {};
    }
    const response = await api.get("/testimonials/page");
    return extractData(response);
  },

  /** All published testimonials (drafts/archived never leak), manual order. */
  getPublished: async () => {
    const response = await api.get(IS_MOCK_API ? "/testimonials" : "/testimonials");
    return sortTestimonials(
      extractList(response, "testimonials").filter(isPublished),
      "order"
    );
  },

  /**
   * The homepage selection, honouring every admin control on the singleton's
   * `home` block: placement flag per testimonial, featured-only, sort strategy
   * and maximum count. Returns { config, items }.
   */
  getForHome: async () => {
    const [page, all] = await Promise.all([publicApi.getPage(), publicApi.getPublished()]);
    const cfg = page?.home || {};
    return {
      config: { ...cfg, pageEnabled: page?.enabled !== false },
      items: selectHomeItems(all, cfg),
    };
  },

  /**
   * Testimonials assigned to one product (directly, or via its category),
   * capped by the admin-configured per-product maximum. No hardcoded
   * relationships: assignment lives on each testimonial record.
   */
  getForProduct: async (product) => {
    if (!product) return { config: {}, items: [] };
    const [page, all] = await Promise.all([publicApi.getPage(), publicApi.getPublished()]);
    const cfg = page?.productPage || {};
    if (cfg.enabled === false) return { config: cfg, items: [] };
    const pid = String(product.id);
    const cid = String(product.categoryId ?? "");
    const items = all
      .filter((t) => t.placements?.products !== false)
      .filter(
        (t) =>
          (t.productIds || []).some((id) => String(id) === pid) ||
          (t.categoryIds || []).some((id) => cid && String(id) === cid)
      )
      .slice(0, Math.max(1, Number(cfg.maxItems) || 4));
    return { config: cfg, items };
  },
};

// -----------------------------------------------------------------------------
// Admin API
// -----------------------------------------------------------------------------

const stamp = () => new Date().toISOString();

const adminApi = {
  getAll: async () => {
    const response = await api.get(IS_MOCK_API ? "/testimonials" : "/admin/testimonials");
    return IS_MOCK_API ? extractList(response, "testimonials") : extractData(response);
  },

  create: async (data) => {
    const payload = { ...data, createdAt: stamp(), updatedAt: stamp() };
    const response = await api.post(
      IS_MOCK_API ? "/testimonials" : "/admin/testimonials",
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  update: async (id, data) => {
    const payload = { ...data, updatedAt: stamp() };
    const response = await api.put(
      IS_MOCK_API ? `/testimonials/${id}` : `/admin/testimonials/${id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  /** Partial update for quick toggles (featured, status, placements…). */
  patch: async (id, patch) => {
    const payload = { ...patch, updatedAt: stamp() };
    const response = await api.patch(
      IS_MOCK_API ? `/testimonials/${id}` : `/admin/testimonials/${id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  delete: async (id) => {
    const response = await api.delete(
      IS_MOCK_API ? `/testimonials/${id}` : `/admin/testimonials/${id}`
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  /** Duplicate as a fresh draft placed at the end of the manual order. */
  duplicate: async (record, allRecords = []) => {
    const { id, createdAt, updatedAt, ...copy } = record;
    const maxOrder = allRecords.reduce((m, t) => Math.max(m, Number(t.sortOrder) || 0), 0);
    return adminApi.create({
      ...copy,
      title: copy.title ? `${copy.title} (Copy)` : "(Copy)",
      status: "draft",
      featured: false,
      sortOrder: maxOrder + 1,
    });
  },

  /**
   * Apply one patch to many records (bulk publish / draft / archive /
   * feature). Sequential-safe on json-server; one endpoint call in production.
   */
  bulkPatch: async (ids, patch) => {
    if (!IS_MOCK_API) {
      const response = await api.patch("/admin/testimonials/bulk", { ids, ...patch });
      return extractData(response);
    }
    const results = [];
    for (const id of ids) {
      results.push(await adminApi.patch(id, patch));
    }
    return results;
  },

  /**
   * Persist a full manual ordering: `orderedIds` is every testimonial id in
   * its new display order. sortOrder is rewritten 1..n.
   */
  reorder: async (orderedIds) => {
    if (!IS_MOCK_API) {
      const response = await api.put("/admin/testimonials/reorder", { ids: orderedIds });
      return extractData(response);
    }
    const results = [];
    for (let i = 0; i < orderedIds.length; i++) {
      results.push(await adminApi.patch(orderedIds[i], { sortOrder: i + 1 }));
    }
    return results;
  },

  // ---- Display settings singleton ----
  getPage: async () => {
    const response = await api.get(
      IS_MOCK_API ? "/testimonialsPage" : "/admin/testimonials/page"
    );
    return IS_MOCK_API ? response.data || {} : extractData(response);
  },

  updatePage: async (data) => {
    const payload = { ...data, updatedAt: stamp() };
    const response = await api.put(
      IS_MOCK_API ? "/testimonialsPage" : "/admin/testimonials/page",
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },
};

const testimonialsApi = { ...publicApi, admin: adminApi, getErrorMessage };

export default testimonialsApi;
