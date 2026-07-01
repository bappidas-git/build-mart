# 04 — Logo, Icon, Favicon & Meta

## 1. Objective

Integrate the **North East Build Mart (NEBM)** brand assets across the app: place the **main logo** in the storefront Header, Footer, admin `AdminLayout` and `AdminLogin`; use the **logo icon** for the favicon, the HTML loading splash, the mobile header and small‑icon usage; and update `public/index.html` and `public/manifest.json` with the correct title, meta, Open Graph/Twitter tags, `theme-color`, and PWA identity. Page title becomes **"North East Build Mart"**.

## 2. Context / background

**North East Build Mart** — *"Deals in all kinds of building materials for interior and exterior use."* Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phones: +91 86385 43526 · +91 88762 89972. Brand Blue `#1885d8`, Accent Gold/Orange `#fa9c4c`.

**Brand assets (embed these exact URLs):**
- **Main logo** (works on light AND dark backgrounds): `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png`
- **Logo icon** (favicon, loader/splash, mobile header, small icons): `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`

Verified current state (baseline to replace):
- `public/index.html`: `<title>My Store - Shop the Best Products Online</title>`, `<meta name="theme-color" content="#667eea" />`, generic description/keywords/author "My Store", OG/Twitter title/description/url `mystore.com`, `apple-touch-icon` → `logo192.png`, favicon → `favicon.svg`. The loading splash renders an inline SVG cube with brand name **"MY STORE"** and tagline "Your Online Shopping Destination" over a purple gradient (`#667eea`/`#764ba2`) — plus a body‑background gradient and a pre‑mount theme script that also uses those gradients.
- `public/manifest.json`: `short_name: "My Store"`, `name: "My Store - Online Shopping"`, `theme_color: "#667eea"`, `background_color: "#f5f7fa"`, icons `favicon.svg` / `logo192.png` / `logo512.png`.
- `src/components/AdminLayout/AdminLayout.js`: `const LOGO = "https://placehold.co/160x40/4f46e5/ffffff?text=LOGO";` rendered in the drawer.
- `src/pages/Admin/AdminLogin.js`: `const LOGO = "https://placehold.co/210x70/4f46e5/ffffff?text=LOGO";` rendered above "Admin Console".
- `src/components/Header/Header.js`: logo is an inline `<ShoppingCart>` icon + `{APP_NAME}` text (no image). `src/components/Footer/Footer.js`: brand shown as `<h4>{APP_NAME}</h4>` text.

`APP_NAME` comes from `src/utils/constants.js` (and `REACT_APP_NAME` in `.env`, currently "My E-Commerce Store"). Coordinate the theme‑color and loader gradients with the brand blue re‑skin in `prompts/03`.

## 3. Files & folders to inspect

- `public/index.html` (title, meta, OG/Twitter, theme-color, apple-touch-icon, favicon links, loading‑screen markup + CSS + pre‑mount script).
- `public/manifest.json` (name/short_name/theme_color/background_color/icons).
- `src/components/Header/Header.js` (+ `Header.module.css`) — logo block (`styles.logo`, `logoIcon`, `logoText`).
- `src/components/Footer/Footer.js` (+ `Footer.module.css`) — brand block (`styles.brandName`).
- `src/components/AdminLayout/AdminLayout.js` — `LOGO` constant + drawer `<img>`.
- `src/pages/Admin/AdminLogin.js` — `LOGO` constant + header `<img>`.
- `src/utils/constants.js` — `APP_NAME` (align to "North East Build Mart").
- `public/favicon.svg`, `public/logo192.png`, `public/logo512.png` (existing icon fallbacks).

## 4. Step-by-step implementation instructions

1. **Define a single source for the URLs.** Add the two Cloudinary URLs as constants (e.g. in `src/utils/constants.js` export `LOGO_URL` and `LOGO_ICON_URL`) so Header/Footer/Admin import one value. Set `APP_NAME = "North East Build Mart"`.
2. **Header (`Header.js`).** Replace the inline `<ShoppingCart>` + `{APP_NAME}` logo with an `<img src={LOGO_URL} alt="North East Build Mart" />` inside the existing `styles.logoLink`. On **mobile** (the `isMobile` branch), use the **logo icon** (`LOGO_ICON_URL`) as a compact mark; on desktop/tablet use the full logo. Keep the `whileHover`/`whileTap` motion and the `<Link to="/">`. Add sensible height in `Header.module.css` (e.g. logo ~32–40px tall, icon ~28–32px) with `width:auto`; ensure it reads on both light and dark headers.
3. **Footer (`Footer.js`).** Replace the text `<h4 className={styles.brandName}>{APP_NAME}</h4>` with the **main logo** `<img>` (keep an `aria-label`/`alt` of "North East Build Mart"). Since the logo works on dark backgrounds, it sits correctly on the dark footer. Keep the surrounding about‑text/social block.
4. **AdminLayout (`AdminLayout.js`).** Replace `const LOGO = "https://placehold.co/160x40/4f46e5/ffffff?text=LOGO";` with the **main logo** URL. Keep the existing drawer `<img style={{ height: 32, width: "auto" }} />`; update `alt` to "North East Build Mart".
5. **AdminLogin (`AdminLogin.js`).** Replace `const LOGO = "https://placehold.co/210x70/4f46e5/ffffff?text=LOGO";` with the **main logo** URL; keep the `height: 56` image above "Admin Console"; update `alt`.
6. **`public/index.html` — head/meta.**
   - `<title>North East Build Mart</title>`.
   - `<meta name="description" content="North East Build Mart — deals in all kinds of building materials for interior and exterior use. Browse and enquire for tiles, doors, hardware, plumbing, bath fittings, cement, steel and more." />`.
   - `<meta name="keywords" content="North East Build Mart, building materials, WPC louvers, polycarbonate sheets, FRP sheets, waterproofing, tiles, doors, hardware, plumbing, bath fittings, cement, steel rods, Nagaon, Assam" />`.
   - `<meta name="author" content="North East Build Mart" />`.
   - `<meta name="theme-color" content="#1885d8" />` (was `#667eea`).
   - **Favicon:** point `<link rel="alternate icon" ...>` / the icon links at the **logo icon** URL (add `<link rel="icon" type="image/png" href="https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png" />`); keep the SVG fallback if desired. `<link rel="apple-touch-icon" href="https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png" />`.
   - **OG/Twitter:** set `og:title` / `twitter:title` = "North East Build Mart"; `og:description`/`twitter:description` = the tagline description above; `og:image`/`twitter:image` = the **main logo** URL; `og:url`/`twitter:url` to the NEBM domain (or leave a placeholder — do not keep `mystore.com`).
7. **`public/index.html` — loading splash.** Replace the inline SVG cube with the **logo icon** image (`<img src="https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png" alt="North East Build Mart" />` sized to the existing `.loader-logo-icon`). Change `.loader-brand-name` text from "MY STORE" to **"NORTH EAST BUILD MART"** and the tagline to **"Building Materials · Interior & Exterior"**. Recolour the splash gradients, spinner and progress bar from purple/pink to the brand blue family (`#1885d8`/`#1069b0`/`#4ea3e3`) so it matches `prompts/03`. Keep the `react-loaded` fade‑out logic and the 10s safety timeout untouched.
8. **`public/index.html` — pre‑mount theme script.** Update the two inline body‑background gradients (light/dark) to the brand blue pair used in `prompts/03` so the first paint matches (keep the `body.dark`/`body.light` class logic and `localStorage` read intact).
9. **`public/manifest.json`.** `short_name: "NE Build Mart"`, `name: "North East Build Mart"`, `theme_color: "#1885d8"`, `background_color: "#ffffff"` (or the brand light bg). Update the icon entries to the **logo icon** — either reference the Cloudinary icon URL or replace the bundled `logo192.png`/`logo512.png` with the brand icon; keep the `sizes`/`purpose` fields valid.
10. **Alt/aria text & fallbacks.** Every logo `<img>` gets `alt="North East Build Mart"`. Ensure images have explicit sizing so layout doesn't shift while loading; keep the existing SVG/PNG local fallbacks referenced so the app still renders if Cloudinary is unreachable.

## 5. UI/UX requirements

- Main logo renders crisply on both light (header/admin/login) and dark (footer, dark‑mode header) backgrounds — it is designed to work on both, so no forced background box is needed.
- Mobile header uses the compact **logo icon**; desktop uses the full **main logo**.
- Splash/loader uses the **logo icon** on a brand‑blue gradient, with "NORTH EAST BUILD MART" wordmark.
- Icons stay consistent and premium (Icons8 / `@iconify/react` / `@mui/icons-material` where pictorial icons are wanted, per brand guidance). No layout shift on logo load.
- Colours align to `prompts/03`: Blue `#1885d8` primary, Gold/Orange `#fa9c4c` accents (sparingly).

## 6. Data & API requirements

N/A for the asset wiring. (The `settings.store.logo`/`favicon` fields are set in `prompts/05`; keep the dual‑mode API and `extractData()` untouched — this prompt does not call the API.)

## 7. Admin panel requirements

- `AdminLayout` drawer shows the **main logo** (replacing the placehold.co constant).
- `AdminLogin` shows the **main logo** above "Admin Console".
- Admin retains its own slate/indigo theme (`adminTheme.js`); only the logo image changes, not the admin palette.

## 8. Storefront requirements

- Header logo = image (`<Link to="/">`), full logo on desktop, icon on mobile, motion preserved.
- Footer brand = **main logo** image on the dark footer.
- Document/tab title = "North East Build Mart"; favicon = logo icon; social share cards use the main logo.

## 9. Acceptance criteria

- [ ] `AdminLayout.js` and `AdminLogin.js` `LOGO` constants use `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png`; both render the logo with `alt="North East Build Mart"`.
- [ ] Header renders the main logo (desktop) and the icon (mobile); Footer renders the main logo; `<Link to="/">` and motion preserved.
- [ ] `public/index.html` title = "North East Build Mart"; `theme-color` = `#1885d8`; description/keywords/author are NEBM; OG/Twitter title/description/image updated; no `mystore.com` residue.
- [ ] Favicon and `apple-touch-icon` point at the logo icon URL; SVG/PNG fallback still present.
- [ ] Loading splash shows the logo icon + "NORTH EAST BUILD MART" on a brand‑blue gradient; `react-loaded` fade‑out + 10s safety timeout intact.
- [ ] `public/manifest.json` name/short_name/theme_color/icons reflect NEBM (`theme_color: "#1885d8"`).
- [ ] `APP_NAME` (constants) = "North East Build Mart"; no "My Store" text visible anywhere in header/footer/admin/title.
- [ ] App builds and boots; no console errors from missing images; no layout shift on logo load.

## 10. Testing / verification steps

1. `npm run dev`; open `http://localhost:3000` — browser tab title reads "North East Build Mart", favicon is the brand icon.
2. On first load, the splash shows the brand icon + wordmark on a blue gradient, then fades when React mounts.
3. Desktop: header shows the full logo; resize to mobile (<768px) → header shows the compact icon. Footer shows the logo on the dark background.
4. Open `/admin` → login page shows the logo above "Admin Console"; sign in → drawer shows the logo.
5. Toggle dark mode — the main logo remains legible in header and footer.
6. View page source / devtools → confirm `theme-color #1885d8`, OG/Twitter tags, and manifest values; check the network tab shows the Cloudinary images loading (and the local fallback path exists).

## 11. Notes on preserving existing functionality

Do **not**:
- Break the loading‑screen mechanism: keep the `#loading-screen`, the `react-loaded` class toggle (set in `src/index.js`), the `MutationObserver` fade‑out, and the 10s safety `setTimeout`.
- Remove the pre‑mount theme script's `body.dark`/`body.light` + `localStorage("theme")` logic — only update its gradient colours.
- Alter the **dual‑mode API**, **auth**, **routing/provider nesting**, **slug/category rules**, or the **safe non‑cascading DELETE** — none are touched here.
- Change the admin design system (`adminTheme.js`) beyond swapping the logo image.
- Drop the local `favicon.svg` / `logo192.png` / `logo512.png` fallbacks entirely; keep a graceful fallback if Cloudinary is unreachable.
- Introduce layout shift: give every logo `<img>` explicit dimensions.
