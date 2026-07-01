# 07 — Storefront Layout Foundation

## 1. Objective

Establish the global **storefront layout shell** and visual foundation for North East Build Mart (NEBM): a max-width content container (~1280px), a consistent spacing scale, an Inter-based typography scale, responsive breakpoints, soft shadows and generous white space — an Apple-minimal, mobile-first base that every storefront page and section builds on. This prompt sets structure and tokens; it must **not** restructure routes or the provider tree.

Touch: `src/App.js` (storefront shell markup only, provider nesting untouched), `src/index.css`, `src/App.css`, and the shared layout wrappers used across pages. Keep the admin palette and admin screens entirely separate.

## 2. Context / background

**Brand:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Address: Lawkhuwa Road, Nagaon, Assam – 782002. Aesthetic: premium, minimal, Apple-style — generous white space, clean typography, soft shadows, rounded cards, clear hierarchy, mobile-first, fast; **not** overloaded or overly colorful. Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c` (used sparingly for highlights, hover, badges).

The boilerplate's storefront tokens live as CSS custom properties in `src/theme/storefront-tokens.css` (the `--sf-*` scale; current primary is `#667eea`) and are mirrored in `src/theme/tokens.js` (`TOKENS`, with `containerMax: 1280` and `breakpoints { xs:480, sm:768, md:1024, lg:1280, xl:1440 }`). `src/index.css` imports Inter and `storefront-tokens.css`; `src/App.css` holds global app-shell styles and the legacy `.container` (currently `max-width: 1440px`) plus a lot of leftover "neon/glass" styling from the boilerplate. A separate palette prompt swaps the brand hex; **this** prompt owns the structural layer (container, spacing, type scale, breakpoints, shadows, shell). Where you set brand color here, use `#1885d8` / `#fa9c4c` (or, preferably, reference the `--sf-*` custom properties so the palette prompt stays the single source of truth).

**App shell today** (`src/App.js`): providers nest `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`; the storefront tree is wrapped in `DealsConfigProvider` and renders `<div className="App"> <Header/> <main className="main-content"> …routes… </main> <Footer/> <BottomNav/> </div>`. Admin routes live under `/admin/*` via `AdminLayout`. See `prompts/00-analysis-and-requirement-map.md` §1.

**Dual-mode rule (restate — layout touches no data, but keep it true):** this prompt changes structure/CSS only; it must not alter any `IS_MOCK_API` branch, `extractData()` usage, or `db.json` shape. The layout must render identically whether pages are fed by JSON Server or Laravel.

## 3. Files & folders to inspect

- `src/App.js` — the storefront shell markup (`.App`, `.main-content`) and provider nesting. **Do not** change route paths or provider order.
- `src/index.css` — Inter import, `@import "./theme/storefront-tokens.css"`, base `body`/`*` rules.
- `src/App.css` — global shell styles, `.container`, `.main-content`, legacy neon/glass/gradient utilities, SweetAlert theming, responsive helpers.
- `src/theme/tokens.js` — `TOKENS` (`radius`, `space`, `breakpoints`, `tapTarget: 44`, `containerMax: 1280`) and `STOREFRONT_CONFIG`.
- `src/theme/storefront-tokens.css` — the `--sf-*` custom properties (spacing, radius, shadow, color, container) consumed by CSS Modules.
- `src/components/Header/Header.module.css`, `src/pages/Home/Home.module.css` — examples of how the container/spacing is consumed today (for consistency).

## 4. Step-by-step implementation instructions

1. **Container:** define a single canonical content container that all pages/sections use. Target `max-width: var(--sf-container, 1280px)` (matching `TOKENS.containerMax`), centered (`margin-inline: auto`), with responsive side padding (24px desktop, 20px tablet, 16px mobile). Update `src/App.css` `.container` from `1440px` down to the `1280px` container (or expose it as a `--sf-container` token in `storefront-tokens.css` and reference it), keeping the existing `.container` class name so current consumers don't break.
2. **Spacing scale:** ensure the spacing steps in `storefront-tokens.css` match `TOKENS.space` (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`) exposed as `--sf-space-*`. Do not introduce a competing ad-hoc scale.
3. **Typography scale (Inter):** confirm Inter is loaded (it is, via `index.css`). Define a small, consistent type scale as `--sf-text-*` custom properties (e.g. display / h1 / h2 / h3 / body / small) with sensible `line-height` and `font-weight` steps, and apply base `body` typography (Inter, antialiased, comfortable base size 15–16px, `color: var(--sf-color-text)`). Keep the existing `-webkit-font-smoothing`/`-moz-osx-font-smoothing` rules.
4. **Breakpoints:** standardise the media-query breakpoints to `TOKENS.breakpoints` — xs 480, sm 768, md 1024, lg 1280, xl 1440. Use them consistently in `App.css` responsive blocks and document them in a comment. (Existing `@media (max-width: 768px)` etc. already align to sm/md — keep them, don't scatter new arbitrary values.)
5. **Soft shadows & radii:** define/reuse a soft elevation scale (`--sf-shadow-sm/md/lg`) — subtle, low-opacity shadows (e.g. `0 1px 2px rgba(16,24,40,.06)`, `0 8px 24px rgba(16,24,40,.10)`) — and rounded-card radii from `TOKENS.radius` (`sm 6, md 10, lg 16, xl 22, pill 999`) as `--sf-radius-*`. Cards across the storefront should feel light and premium, not heavy.
6. **App shell:** keep the `.App` flex column (`min-height: 100vh`, header → main → footer) and `.main-content` (flex:1, `padding-bottom` clearing the fixed mobile `BottomNav`). Retire the boilerplate "neon/glass/gradient" background theming from `App.css` in favour of a clean neutral storefront surface (light: soft off-white/`#f7f9fc`-ish; dark handled by `body.dark`). Do **not** remove the admin-area body classes/scrollbar rules or the SweetAlert2 z-index/theming blocks — those are load-bearing.
7. **Section rhythm:** establish a reusable section vertical rhythm (consistent top/bottom padding via the spacing scale) so Home, Products, and detail pages share the same generous white-space cadence. Prefer a shared `.container` + section padding tokens over per-page magic numbers.
8. **Mobile-first:** author base rules for small screens and layer desktop enhancements at `min-width` breakpoints. Ensure tap targets meet `TOKENS.tapTarget` (44px) for interactive shell elements.
9. **Keep `src/App.js` structural JSX/routes identical** — you may add a wrapper class or a layout comment, but do not add/remove providers, reorder them, or change route paths.

## 5. UI/UX requirements

- **Container:** ~1280px max width, centered, responsive gutters (24/20/16). Content never runs edge-to-edge on wide screens.
- **Palette:** neutral, airy surfaces; brand blue `#1885d8` for primary accents and gold `#fa9c4c` used sparingly (highlights/hover only) — but prefer referencing `--sf-color-primary` / `--sf-color-accent` so the dedicated palette prompt remains the single hex source.
- **Typography:** Inter throughout; clear hierarchy via the type scale; readable base size, comfortable line-height, restrained weights (400/500/600/700).
- **Shadows/radii:** soft, low-opacity elevation; rounded cards (`--sf-radius-lg`); no heavy borders or neon glows.
- **White space:** generous, consistent section rhythm; uncluttered, Apple-minimal.
- **Responsive:** mobile-first; graceful scale-up across sm/md/lg/xl; 44px tap targets.
- **Dark mode:** respect the existing `body.dark` mechanism (ThemeContext) — surfaces and text remain legible; do not hardcode light-only colors on the shell.

## 6. Data & API requirements

N/A — no data or API changes. Do not touch `IS_MOCK_API`, `extractData()`, `api.js`, or `db.json`. The layout must be data-agnostic and render identically in both backends.

## 7. Admin panel requirements

N/A — and importantly, **keep storefront and admin palettes separate**. Do not let storefront token changes leak into `src/theme/adminTheme.js` or admin screens; the admin body-class rules and admin scrollbar styling in `App.css` must remain intact.

## 8. Storefront requirements

- Every storefront page (`Home`, `Products`, `ProductDetails`, account pages, policy pages) inherits the shared container, spacing, type scale, shadows, and section rhythm.
- The `.App` shell renders Header (sticky), `main` content, Footer, and the mobile `BottomNav` without layout shift; `main-content` clears the fixed header (header renders its own spacer) and the fixed mobile bottom nav.
- Enquiry-correct: this shell must not reintroduce any purchase/cart chrome — it's structural only. (Header/enquiry-list wiring is prompt 08.)

## 9. Acceptance criteria

- [ ] A single canonical container caps content at ~1280px and is centered with responsive 24/20/16 gutters; the legacy 1440px `.container` no longer overrides it.
- [ ] Spacing, radius, and shadow scales are defined once as `--sf-*` custom properties and match `TOKENS` (`space`, `radius`).
- [ ] An Inter type scale (`--sf-text-*`) is defined and applied to base typography; headings/body read with clear hierarchy.
- [ ] Breakpoints used across `App.css` align to `TOKENS.breakpoints` (480/768/1024/1280/1440).
- [ ] Cards/surfaces use soft, low-opacity shadows and rounded radii; the boilerplate neon/glass/gradient background theming is removed from the storefront shell.
- [ ] `src/App.js` provider nesting order and all route paths are byte-for-byte unchanged (only shell class/comment additions allowed).
- [ ] Admin-area body classes, admin scrollbar rules, and SweetAlert2 z-index/theming in `App.css` are preserved.
- [ ] Dark mode (`body.dark`) still renders legibly across the shell.

## 10. Testing / verification steps

1. `npm run dev` and open `http://localhost:3000`.
2. **Container:** resize the window from >1440px down to 320px; confirm content caps at ~1280px, centers, and gutters step 24→20→16 without horizontal scroll.
3. **Type/spacing:** inspect headings and body text — Inter, consistent scale; section vertical rhythm is uniform across Home and Products.
4. **Shadows/radii:** cards show soft elevation and rounded corners; no neon glow / glass artifacts remain on the storefront.
5. **Shell:** header is sticky, footer sits at the bottom on short pages, mobile `BottomNav` doesn't overlap content (bottom padding clears it).
6. **Dark mode:** toggle theme; surfaces/text remain readable.
7. **Regression:** navigate to `/admin` — admin still uses its own slate palette (storefront tokens didn't leak); a SweetAlert confirm renders above dialogs.
8. **Provider/routing sanity:** app boots with no white-screen (confirms provider nesting untouched); deep links (`/products`, `/products/:slug`) still resolve.

## 11. Notes on preserving existing functionality

Do **not** break:
- **Provider nesting order** in `src/App.js` — `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`, storefront wrapped in `DealsConfigProvider`. Reordering white-screens the app.
- **Routing** — all storefront route paths (`/`, `/products`, `/products/:slug`, `/wishlist`, `/special-offers`, policy pages, etc.) and the `/admin/*` tree stay exactly as-is; slug product URLs + `?category=<slug>` deep links keep working.
- **Storefront vs admin palette separation** — do not modify `adminTheme.js` or admin screens; keep admin body-class + scrollbar rules in `App.css`.
- **Per-component CSS Modules** — this prompt sets global tokens/shell; keep component styles in their `*.module.css` files rather than pushing component-specific CSS into global files.
- **SweetAlert2 theming & z-index** overrides in `App.css`/`index.css` — leave intact (popups must stay above MUI dialogs).
- **Dark-mode mechanism** (`body.dark` via ThemeContext) — don't hardcode light-only shell colors.
- **Dual-mode / data layer** — no changes to `api.js`, `IS_MOCK_API`, `extractData()`, or `db.json`.
- **Fixed header spacer + mobile BottomNav clearance** — `.main-content` must keep clearing both; don't reintroduce a redundant top padding gap.
- **Reuse, don't rewrite** — extend the existing token architecture (`storefront-tokens.css` + `tokens.js`); don't fork a parallel design system.
