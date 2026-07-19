# Testimonial Module

A fully dynamic, admin-managed testimonial system: one central library that powers
the dedicated **/testimonials** page, the **homepage showcase** band and
**per-product** testimonial bands — with text, photo and video (YouTube / Vimeo /
Facebook / Instagram / Cloudinary / direct MP4) formats. Built to the same
conventions as the Career Module (see `CAREERS_MODULE.md`): self-contained
service layer, additive integration, dual-mode API, `--sf-*` token styling.

---

## 1. Data model

### `testimonials` (collection)

```jsonc
{
  "id": 1,
  "type": "text | photo | video",
  "status": "published | draft | archived",   // only "published" ever reaches the storefront
  "featured": true,                            // featured badge + spotlight/featured-only surfaces
  "sortOrder": 1,                              // manual display order (drag-and-drop in admin)
  "customerName": "Ranjit Bora",
  "designation": "Site Contractor",
  "company": "Bora Constructions, Guwahati",
  "avatarUrl": "https://…",                    // profile image URL (CDN/cloud/external)
  "rating": 5,                                 // 0–5 stars (0 = no rating shown)
  "title": "Review title",
  "body": "Review description",
  "reviewDate": "2026-04-18",
  "verified": true,                            // verified badge
  "media": {                                   // null for type "text"
    "url": "https://…",                        // photo URL, or video URL on any supported platform
    "poster": "https://…",                     // optional custom video thumbnail
    "caption": "…"
  },
  "productIds": [1, 2],                        // appears on these product pages
  "categoryIds": [1],                          // …and on every product page in these categories
  "placements": { "home": true, "page": true, "products": true },
  "tags": ["wpc", "commercial"],
  "source": "direct | google | facebook | instagram | youtube | vimeo | other",
  "createdAt": "…", "updatedAt": "…"
}
```

### `testimonialsPage` (singleton — display settings)

```jsonc
{
  "enabled": true,                             // the public /testimonials page
  "seo": { "title": "…", "description": "…" },
  "hero": { "kicker": "…", "title": "…", "subtitle": "…" },
  "home": {                                    // homepage showcase controls
    "enabled": true, "kicker": "…", "title": "…", "subtitle": "…",
    "layout": "carousel | grid",
    "sort": "order | newest | rating",
    "maxItems": 6, "featuredOnly": false,
    "autoRotate": true, "autoRotateMs": 6000
  },
  "productPage": { "enabled": true, "title": "…", "maxItems": 4 },
  "page": { "layout": "masonry", "pageSize": 9 },
  "updatedAt": "…"
}
```

## 2. Files

| Area | Path |
| --- | --- |
| Service layer | `src/services/testimonialsApi.js` |
| Card (all types) | `src/components/testimonials/TestimonialCard.js` (+ `.module.css`) |
| Video facade | `src/components/testimonials/VideoEmbed.js` (+ `.module.css`) |
| Home/PDP band | `src/components/testimonials/TestimonialsSection.js` (+ `.module.css`) |
| Dedicated page | `src/pages/Testimonials/Testimonials.js` (+ `.module.css`) |
| Admin library | `src/pages/Admin/AdminTestimonials.js` → `/admin/testimonials` |
| Admin display settings | `src/pages/Admin/AdminTestimonialsPage.js` → `/admin/testimonials-page` |

Integration touch-points (all additive): `src/App.js` (routes),
`src/components/AdminLayout/AdminLayout.js` (sidebar items),
`src/components/Footer/Footer.js` (quick link),
`src/components/SidebarMenu/SidebarMenu.js` (drawer row),
`src/pages/Home/Home.js` + `src/pages/ProductDetails/ProductDetails.js` (bands).

## 3. Service layer (`testimonialsApi`)

Reuses the shared axios client + `extractData`/`extractList` from
`services/api.js`. Dual-mode like every other domain — the same one-line
`.env` switch (`REACT_APP_USE_MOCK_API=false`) targets the production API:

| JSON Server (dev) | Laravel (production) |
| --- | --- |
| `/testimonials` | `/testimonials`, `/admin/testimonials` |
| `/testimonialsPage` | `/testimonials/page`, `/admin/testimonials/page` |
| n/a (sequential PATCH) | `PATCH /admin/testimonials/bulk`, `PUT /admin/testimonials/reorder` |

Public reads: `getPage()`, `getPublished()`, `getForHome()`,
`getForProduct(product)` — each already applies status, placement, featured,
sort and max-item rules, so components stay dumb.
Admin: full CRUD + `patch`, `duplicate`, `bulkPatch(ids, patch)`,
`reorder(orderedIds)`, `getPage`/`updatePage`.

Domain vocabulary (`TESTIMONIAL_TYPES/STATUSES/SOURCES`, `HOME_LAYOUTS/SORTS`)
is exported from the service — never re-declared in components.

## 4. Media & security

All admin-entered URLs pass through the service-layer guards before touching
the DOM:

- `isSafeMediaUrl` / `sanitizeMediaUrl` — http(s)-only; `javascript:`/`data:`
  and malformed URLs are rejected everywhere (avatars, photos, posters).
- `detectVideoProvider(url)` — parses YouTube (watch/short/share/embed), Vimeo,
  Facebook, Instagram, Cloudinary and direct-file URLs. **Embeds are built from
  the parsed video ID onto fixed provider hosts** (`youtube-nocookie.com`,
  `player.vimeo.com`, …) — pasted strings are never used verbatim as iframe
  `src`, so a testimonial record can't inject an arbitrary frame.
- `validateMediaUrl(type, url)` — the admin form's save gate.

`VideoEmbed` autoplays on view: only a thumbnail (`i.ytimg.com` /
`vumbnail.com` / custom poster) renders with the page; the player iframe or
native `<video>` mounts — muted, since browsers only allow gesture-less
autoplay without sound — once the frame scrolls half into view on any device
(`playsinline` keeps iOS from going fullscreen). Native `<video>` players
also pause off screen and resume on return. Visitors with
`prefers-reduced-motion` or data-saver enabled keep the click-to-play facade
and get sound on click. Every embed offers a "Watch on <platform>" new-tab
action. Photos and avatars are `loading="lazy"` with graceful `onError`
fallbacks.

## 5. Storefront behaviour

- **/testimonials** — admin-managed hero + SEO (`useDocumentMeta` + schema.org
  `AggregateRating`/`Review` JSON-LD), aggregate stats bar, media-type chips +
  rating filter + free-text search, featured spotlight (top 2 featured),
  CSS-columns masonry wall, "Show more" batching (`page.pageSize`), skeleton /
  error / empty states. `enabled:false` renders a friendly unavailable notice.
- **Homepage band** — renders via `<TestimonialsSection variant="home" />`;
  scroll-snap carousel (touch native, keyboard-accessible arrows, auto-rotate
  paused on hover/focus/hidden-tab/reduced-motion) or card grid. Owns its own
  section rhythm and renders `null` when disabled/empty/errored — no gap, no
  broken band.
- **PDP band** — `<TestimonialsSection variant="product" product={product} />`
  between the tabs and Related Products; shows only testimonials assigned to
  that product (or its category), capped by `productPage.maxItems`.

## 6. Admin panel

`/admin/testimonials` — the central library:

- Search (customer / review / product / tag), filters (type, status, rating,
  product, featured-only).
- Row quick actions: featured toggle (optimistic + rollback, saves instantly —
  house convention), status chip menu (Published/Draft/Archived), edit,
  duplicate (creates a draft), delete (Swal confirm).
- **Homepage column** — every row shows a Live/Hidden chip for the homepage
  showcase with the exact reason on hover (unpublished, placement off,
  featured-only mode, or beyond the `home.maxItems` window). New records —
  including duplicates — join at the FRONT of the manual order, so the
  showcase always leads with the last-added testimonial; older records drift
  down and can fall outside the window. Under manual sort, clicking a Hidden
  chip offers a one-click "move to front" reorder.
  The edit dialog's Assignment tab shows the same live verdict, so the
  "Homepage showcase" switch is never a silent no-op. Selection logic is
  shared with the storefront (`selectHomeItems` / `explainHomeVisibility` in
  `testimonialsApi.js`).
- Bulk actions on selection: publish / draft / archive / feature / unfeature /
  delete.
- Drag-and-drop **Reorder** dialog (framer-motion `Reorder`) → persists
  `sortOrder` 1..n.
- Create/Edit dialog tabs: **Content** (identity, rating, title, body, date,
  source, tags, verified/featured), **Media** (type switch; photo/video URL with
  live preview + provider-detection chip), **Assignment** (placement switches +
  product/category multi-selects), **Preview** (renders the real storefront
  `TestimonialCard`).

`/admin/testimonials-page` — display settings for all three surfaces
(page visibility/hero/SEO/page size, homepage layout/sort/limits/rotation,
product-page band title/limit). Numeric fields keep raw strings while typing
and clamp on save (house convention).

## 7. Conventions & gotchas

- Storefront styling is 100% `--sf-*` tokens (light + dark for free); admin is
  MUI + sweetalert2, mirroring `AdminCareers`.
- Only `status === "published"` records leave the service layer's public
  methods; placement flags are additionally enforced per surface.
- json-server only re-reads `db.json` on restart — after hand-editing seeds,
  restart `node server.js`.
- Scale path: list virtualisation/pagination, multi-language fields, moderation
  queues and third-party review sync all slot into the service layer without
  touching components (they consume `publicApi` outputs only).
