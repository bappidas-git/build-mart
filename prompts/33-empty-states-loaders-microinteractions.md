# 33 — Empty States, Loaders & Microinteractions

## 1. Objective
Give North East Build Mart (NEBM) a consistent, premium set of **empty states**, **loaders/splash**, **skeleton loaders**, subtle **framer-motion transitions**, and **tooltips** across the storefront and admin. The goal is a polished, Apple-minimal feel — never flashy. No data model or route changes; this is presentation + microinteraction work reusing existing shared components.

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform (Enquiry List instead of cart; Submit Enquiry instead of checkout; no payment/shipping) refactored from a React + JSON Server boilerplate. See `prompts/00-analysis-and-requirement-map.md`. Relevant facts:
- **Brand:** Blue `#1885d8`, Gold `#fa9c4c` (accents, sparingly). Apple-minimal: whitespace, soft shadows, rounded cards, minimal elegant motion.
- **Logo icon** (for loader/splash + small usage): `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`. **Full logo:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png`.
- **Icons:** use **Icons8** (or `@iconify/react` pictorial `mdi:*`) for empty-state illustrations; keep them consistent and premium. `framer-motion` (v10) and `@iconify/react` are already dependencies.
- Storefront styling = per-component CSS Modules + `--sf-*` tokens (`src/theme/storefront-tokens.css`); admin = MUI + `src/theme/adminTheme.js`. Keep them separate.
- Storefront terminology: **Enquiry List** (cart), **Add to Enquiry List** (an icon button with a tooltip), **Submit Enquiry / Enquiry Summary** (checkout), **Enquiries** (orders). No "Buy Now".

## 3. Files & folders to inspect
- Shared: `src/components/ErrorBoundary/ErrorBoundary.js`, `src/components/ScrollToTop/ScrollToTop.js`.
- Suggested new shared components (create under `src/components/`): `EmptyState/EmptyState.js` (+ `.module.css`), `BrandLoader/BrandLoader.js` (+ `.module.css`), `Skeleton/*` if not already present (or reuse MUI `<Skeleton>` in admin and a CSS-Module shimmer on the storefront).
- Storefront pages/lists that need empty states: the **Enquiry List** page/drawer (`src/components/CartDrawer/` / Enquiry List page), `src/pages/Products.js` (no results / no products), `src/pages/Wishlist.js`, `src/pages/ProductDetails.js` (reviews empty), search results (`src/components/SearchModal/`), `src/pages/OrderHistory.js` (customer "My Enquiries" empty).
- Admin lists that need empty states: `src/pages/Admin/AdminEnquiries.js` (no enquiries), `AdminLeads.js` (no leads), `AdminReviews.js`, `AdminUsers.js`, `AdminProducts.js`.
- Product grid/detail loaders: `src/components/storefront/ProductCard.js`, `RelatedProducts.js`, `ProductGallery.js`, `PriceBlock.js`.
- Tooltips: `AddToCartBar.js` / `ProductCard.js` (the "Add to Enquiry List" icon button), wishlist heart, share, quantity stepper.
- Route-level splash: `src/App.js` (initial mount) / `src/index.js`; theme mount in `src/context/ThemeContext.js`.

## 4. Step-by-step implementation instructions
1. **Build a reusable `EmptyState` component.** Props: `icon` (Icons8/iconify id or image URL), `title`, `description`, optional `action` (label + onClick, e.g. "Browse Products"). Center-aligned, generous padding, muted icon in a soft blue/gold tint, one primary CTA max. Storefront variant uses CSS Modules + `--sf-*`; an admin variant (or the same component themed) uses MUI tokens. Use it everywhere below instead of the ad-hoc "No X found" `<Typography>` lines currently scattered in admin tables.
2. **Wire empty states to real surfaces:**
   - **Empty Enquiry List:** icon (`mdi:clipboard-text-outline` or an Icons8 "list" mark) + "Your Enquiry List is empty" + "Add building materials you're interested in and send us one enquiry." + CTA "Browse Products" → `/products`.
   - **No results (search / filtered products):** "No products match your search" + "Try a different keyword or clear filters." + CTA "Clear filters".
   - **No enquiries (admin `AdminEnquiries`):** "No enquiries yet" + subtext.
   - **No leads (admin `AdminLeads`):** "No leads yet".
   - **No wishlist items / no reviews / no customer enquiries (`OrderHistory`):** matching states.
3. **Build a branded loader/splash `BrandLoader`.** Center the **logo icon** (`.../icon_bvsukn.png`) with a subtle framer-motion pulse/scale + a thin blue ring/progress; gold accent optional. Use it for: the initial app splash (brief, on first mount before providers/data are ready) and as a full-page/section fallback (e.g. route lazy-load `Suspense` fallback, admin auth-restore in `AdminLayout` instead of a bare `CircularProgress`). Keep it fast and quiet — no long artificial delay, respect `prefers-reduced-motion`.
4. **Skeleton loaders for grids/details.** While products load:
   - Product grid: render N `ProductCard` skeletons (image block + two text lines + price line) — CSS-Module shimmer on the storefront.
   - Product details: skeleton for gallery, title, price block, and the tiered-pricing table.
   - Admin tables already use MUI `<Skeleton>` rows — keep and standardise them (consistent row count/height).
5. **Subtle framer-motion transitions.** Add small, tasteful motion: page/section fade-in-up on mount (already used in `AdminSettings`), staggered product-card entrance (small stagger, short duration), drawer/bottom-sheet springs (already in `BottomDrawer`), and a gentle scale on "Add to Enquiry List" success. Keep durations ≤ ~300ms; nothing bouncy or attention-grabbing. Gate all of it behind `prefers-reduced-motion`.
6. **Tooltips.** Add clear tooltips to icon-only actions:
   - **"Add to Enquiry List"** on the enquiry icon button (storefront: a lightweight CSS/`title` or a small tooltip component; admin: MUI `<Tooltip>` — already used in admin tables). This tooltip is explicitly required by the brand terminology map.
   - Wishlist heart ("Add to Wishlist" / "Remove from Wishlist"), share, quantity +/−, and admin row actions (already tooltipped — keep consistent copy).
7. **Refine `ErrorBoundary`.** Replace any generic fallback with a branded, minimal error card: logo icon, "Something went wrong", a short reassurance line, and a "Reload" / "Back to Home" action — styled to NEBM (blue/gold), not raw text. Keep it framework-safe (no hooks that could re-throw).
8. **`ScrollToTop`** — leave its behaviour (scroll to top on route change) intact; optionally add a smooth-scroll and a subtle back-to-top floating button on long pages (≥ 44px, appears after scrolling down, fades via framer-motion). Optional, keep minimal.

## 5. UI/UX requirements
- Brand tokens only: Blue `#1885d8` for primary accents/rings, Gold `#fa9c4c` for sparing highlights (e.g. CTA accent, badge). Empty-state icons muted/tinted, not loud.
- Apple-minimal: one CTA per empty state, generous whitespace, soft shadows, rounded corners, restrained motion (≤ 300ms, `prefers-reduced-motion` respected).
- Loader/splash uses the **logo icon** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`; must read on light AND dark backgrounds.
- Icons: Icons8 / `@iconify/react` `mdi:*`, consistent style. Skeletons match the real component's shape and spacing.
- Storefront = CSS Modules + `--sf-*`; admin = MUI + `adminTheme`. Do not cross palettes.

## 6. Data & API requirements
N/A for data shape. Empty states must be driven by **real** loading/empty conditions (an empty array from `extractData()`, a caught error) — never fabricate content. Do **not** change any `api.js` method, `db.json` shape, or the dual-mode `IS_MOCK_API` / `extractData()` handling. (Restated: loaders/skeletons/empty-states react to the existing data flow; they must distinguish "loading" vs "loaded-but-empty" vs "error" — as `AdminUsers` already does with `ordersLoading`/`ordersError` — and must not misread an error as an empty state.)

## 7. Admin panel requirements
- Every admin list (`AdminEnquiries`, `AdminLeads`, `AdminReviews`, `AdminUsers`, `AdminProducts`) uses the shared `EmptyState` (themed for MUI) for its empty case, and consistent MUI `<Skeleton>` rows for loading.
- `AdminLayout` auth-restore uses `BrandLoader` (or keeps `CircularProgress` if you prefer minimal) — consistent choice.
- Keep MUI `<Tooltip>` on all icon actions with consistent copy. No removed-module empty states (no Payments/Shipping/etc.).

## 8. Storefront requirements
- Empty Enquiry List, no-results, empty wishlist, empty reviews, and empty "My Enquiries" all use `EmptyState` with a single relevant CTA.
- Product grid and product details show skeletons while loading, then content or empty state.
- The "Add to Enquiry List" icon button has a visible tooltip; wishlist/share/stepper have tooltips.
- Splash/`BrandLoader` uses the logo icon; entrance motion is subtle and reduced-motion-safe. No "Buy Now", no cart totals in any state.

## 9. Acceptance criteria
- [ ] A single reusable `EmptyState` component exists and is used by the Enquiry List, no-results, wishlist, reviews, `OrderHistory`, `AdminEnquiries`, and `AdminLeads` surfaces.
- [ ] A `BrandLoader` using `.../icon_bvsukn.png` is used for at least the initial splash / route Suspense fallback.
- [ ] Product grid and product details render skeletons while loading (shape matches the real content).
- [ ] The "Add to Enquiry List" icon button shows the tooltip "Add to Enquiry List".
- [ ] framer-motion transitions are subtle (≤ ~300ms) and disabled under `prefers-reduced-motion`.
- [ ] `ErrorBoundary` renders a branded, minimal fallback (logo icon + message + action), not raw text.
- [ ] Empty states are only shown for genuinely empty data, never for errors or mid-load.
- [ ] Blue `#1885d8` / gold `#fa9c4c` used; nothing flashy; `npm run build` clean.

## 10. Testing / verification steps
1. `npm run dev`. Clear the Enquiry List → confirm the empty-list `EmptyState` + "Browse Products" CTA.
2. Search a nonsense term / apply filters that match nothing on `/products` → confirm the no-results state and "Clear filters" CTA.
3. Throttle the network (DevTools "Slow 3G") and reload `/products` and a product detail → confirm skeletons appear, then real content.
4. Hover/focus the enquiry icon button → confirm the "Add to Enquiry List" tooltip; add an item → confirm the subtle success scale.
5. Empty the wishlist and a product's reviews → confirm their empty states. Visit customer "My Enquiries" with none → confirm empty state.
6. Admin: open `/admin/enquiries` and `/admin/leads` on a fresh DB → confirm the empty states; throttle to see skeleton rows.
7. Force an error (temporarily throw in a child) → confirm the branded `ErrorBoundary` fallback, not a white screen.
8. Enable "Emulate prefers-reduced-motion: reduce" → confirm animations are minimal/off. `npm run build` — clean.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode** `IS_MOCK_API` + `extractData()` + JSON-shape fidelity — loaders/empty-states are presentation only; never alter `api.js` or `db.json`.
- The **loading vs empty vs error** distinction (as `AdminUsers` does) — an empty state must not mask a failed request.
- **Auth**, **routing**, **provider nesting order**, **slug/category rules** (`getCategoryScopeIds`) — untouched.
- **Safe non-cascading DELETE** (`server.js`) — untouched.
- **Per-component CSS Modules** + **storefront vs admin palette separation**.
- **localStorage `"cart"`** persistence behind the Enquiry List — untouched.
- **Enquiry-only storefront** — no cart total / payment / shipping / Buy Now in any new state or loader.
- `ScrollToTop`'s existing scroll-on-route-change behaviour — keep it; only additive polish.
- Reuse existing shared components; add small new ones (`EmptyState`, `BrandLoader`) rather than rewriting pages.
