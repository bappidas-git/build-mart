# 08 — Header & Navigation

## 1. Objective

Redesign the storefront header (`src/components/Header/Header.js` + `Header.module.css`) and mobile bottom nav (`src/components/BottomNav/BottomNav.js`) for North East Build Mart (NEBM): a minimal, premium, sticky, mobile-first bar with the **NEBM logo**, a **search entry** that opens the existing `SearchModal`, an **Enquiry List icon + count** (replacing the cart icon, wired to `useCart`), a **wishlist icon**, an **account/login** control, and a **hamburger menu button** that opens the slide-in category drawer (`SidebarMenu`). Terminology must read **"Enquiry List"**, never "Cart".

## 2. Context / background

**Brand:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phone: +91 86385 43526 · +91 88762 89972. Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c` (sparingly). Aesthetic: Apple-minimal, generous white space, soft shadows, mobile-first.
- **Main logo:** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` (works on light AND dark).
- **Logo icon (small/mobile):** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png`.

**Enquiry model (restate — this is an enquiry platform, not a shop):** there is no Buy Now / checkout-to-buy. The old **Cart** is the **Enquiry List** — a multi-product + quantity list a user submits as an enquiry (no totals/payment). See `prompts/00` terminology map. The header's basket control must therefore read **"Enquiry List"** with the item count, and open the enquiry-list drawer.

**Current header** (`Header.js`) already: is sticky with a top bar + main row + desktop nav bar; reads `getCartItemCount()`, `isCartOpen`, `setIsCartOpen` from `useCart`; reads `getWishlistCount()` from `WishlistContext`; opens `SearchModal` via a `searchModalOpen` state; opens `SidebarMenu` via `sidebarOpen` (currently only wired to the **mobile** hamburger); renders an account `Menu` and an all-categories dropdown driven by `getMainMenuCategories`/`orderCategoriesHierarchically`. The basket control currently shows a `ShoppingCart` MUI icon labelled **"Cart"** and calls `handleCartClick → setIsCartOpen(true)`. It also shows a "Free delivery on orders over ₹999" top-bar line and a "Today's Deals" nav link gated by `useDealsConfig` — both are ecommerce leftovers to reword/remove for NEBM.

**Dual-mode rule (restate):** the header reads categories via `apiService.categories.getAll()` and must keep working against JSON Server *and* Laravel through `extractData()`. Don't hardcode categories; keep the API-driven menu. No `db.json` shape changes here.

## 3. Files & folders to inspect

- `src/components/Header/Header.js` + `Header.module.css` — the header to redesign.
- `src/components/BottomNav/BottomNav.js` + `BottomNav.module.css` — mobile parity bar.
- `src/hooks/useCart.js` / `src/context/CartContext.js` — exposes `getCartItemCount`, `isCartOpen`, `setIsCartOpen`, `toggleCart` (the enquiry-list state; localStorage key `"cart"`).
- `src/components/CartDrawer/CartDrawer.js` — the drawer the icon opens (the Enquiry List drawer; a later prompt reskins/renames its internals — here just keep opening it).
- `src/components/SidebarMenu/SidebarMenu.js` — the slide-in category drawer opened by the hamburger (prompt 09 repurposes it).
- `src/components/SearchModal/SearchModal.js` — the search overlay the search entry opens.
- `src/context/WishlistContext.js` — `getWishlistCount`. `src/hooks/useAuth.js` — auth + `openAuthModal`.
- `src/utils/categories.js` — `categoryParam`, `getMainMenuCategories`, `orderCategoriesHierarchically` (menu data).
- `src/utils/constants.js` — `APP_NAME`, `SUPPORT_PHONE` (reword to NEBM facts as needed).

## 4. Step-by-step implementation instructions

1. **Logo:** replace the current `ShoppingCart` glyph + `APP_NAME` text logo with an `<img>` of the NEBM **main logo** (`…/logo_fnscna.png`) inside the existing `logoLink` `<Link to="/">`. On very small screens, optionally swap to the **logo icon** (`…/icon_bvsukn.png`). Ensure the logo is legible on both light and dark headers (it is designed to be). Set a sensible max-height (e.g. 36–40px) and `alt="North East Build Mart"`.
2. **Search entry:** keep the desktop search bar and mobile search icon, both calling `handleSearchClick → setSearchModalOpen(true)` to open `SearchModal`. Restyle to minimal/premium (rounded, soft border, subtle focus). Placeholder copy: e.g. "Search building materials, brands, categories…". Keep it keyboard-focusable.
3. **Enquiry List control (replaces Cart):**
   - Change the basket icon from `ShoppingCart` to an enquiry-appropriate glyph (e.g. MUI `RequestQuoteOutlined` / `ListAltOutlined` / `AssignmentOutlined`, or an Iconify `mdi:clipboard-list-outline`) — a list/quote icon, not a shopping cart.
   - Badge it with `getCartItemCount()` (unchanged data source; it is the enquiry-list item count). Keep `Badge … max={99}`.
   - Label it **"Enquiry List"** (desktop label text) — **never** "Cart". `aria-label="Enquiry List"`.
   - Clicking opens the enquiry-list drawer: `setIsCartOpen(true)` (or `toggleCart()`), rendering `<CartDrawer>` as today. Keep the existing `isCartOpen`/`setIsCartOpen` wiring; only the icon/label/semantics change.
4. **Wishlist:** keep the wishlist icon + `getWishlistCount()` badge, navigating to `/wishlist`. Restyle to match; gold `#fa9c4c` accent acceptable on the heart/hover.
5. **Account/login:** keep the account control — authenticated users see the avatar + dropdown (Profile, **My Enquiries** [was "My Orders"], Wishlist, Logout); guests get "Hello, Sign in" opening `openAuthModal("login")`. Reword the "My Orders" menu item to **"My Enquiries"** (route stays `/orders` until a later prompt renames it) to stay enquiry-correct.
6. **Hamburger → category drawer:** add a **menu button** (hamburger) that opens `SidebarMenu` (`setSidebarOpen(true)`) on **all** breakpoints, not just mobile — this is the primary category navigation entry (prompt 09 makes `SidebarMenu` the off-canvas category menu). On desktop you may keep or simplify the existing "All Categories" dropdown, but the hamburger-drawer must be the consistent, always-available category entry. Ensure `SidebarMenu` still receives `open`, `onClose`, `onOpenAuth`.
7. **Reword ecommerce leftovers:**
   - Top bar: replace "Free delivery on orders over ₹999" with an NEBM-appropriate line (e.g. the NEBM phone `+91 86385 43526` as a `tel:` link, or the tagline). Remove the shipping icon/shipping copy. Keep the theme toggle if present.
   - "Track Order" / "Help Center" links: keep Help/Support; reword "Track Order" → "My Enquiries" (→ `/orders`) or remove.
   - "Today's Deals" nav link: repurpose to **"Special Products"** → `/special-offers` (the badged collection), or drop the deals gating — coordinate with prompt 11. Do not advertise deal timers.
8. **Sticky & premium styling:** keep the header sticky/fixed with its in-flow spacer (`headerSpacer`) so content isn't hidden. Apply brand blue `#1885d8` for primary elements and gold `#fa9c4c` sparingly (active/hover/badge accents). Soft shadow under the header on scroll; minimal borders; comfortable spacing.
9. **BottomNav parity** (`BottomNav.js`): keep the mobile tab bar (Home, Categories, Search, Wishlist, Account). Add/relabel an **Enquiry List** tab (list/quote icon) that opens the enquiry-list drawer (or navigates to it) with the same `getCartItemCount()` badge, so mobile users reach the enquiry list without the header. "Categories" should open the `SidebarMenu` drawer (parity with the hamburger) rather than only routing to `/products`, if that reads better on mobile. Keep the hide-on-scroll-down behaviour and wishlist badge.
10. Keep all existing modal/drawer mounts at the bottom of `Header.js` (`CartDrawer`, `SidebarMenu`, `AuthModal`, `SearchModal`) — only their triggers/labels change.

## 5. UI/UX requirements

- **Logo:** NEBM main logo image, light/dark safe; icon variant on tiny screens.
- **Icons:** prefer the already-bundled `@mui/icons-material` / `@iconify/react`; enquiry-list icon = a list/quote glyph (not a cart). Consistent, premium icon style.
- **Colors:** primary blue `#1885d8`; gold `#fa9c4c` for accents/badges/hover only (sparingly). Neutral, airy header.
- **Layout:** sticky, mobile-first, minimal; soft shadow; generous tap targets (44px). Search entry is prominent but understated.
- **Copy:** the basket control's label and `aria-label` say **"Enquiry List"**; account menu says **"My Enquiries"**. No "Cart", "Buy", "Checkout", "Order" purchase language in the header UI.
- **Motion:** keep subtle framer-motion hover/tap scales; nothing flashy.

## 6. Data & API requirements

- **Enquiry count:** `getCartItemCount()` from `useCart` (the `CartContext` value; localStorage key `"cart"`). Do not rename the context or storage key in this prompt — only the header's icon/label/semantics change. Drawer open/close via `isCartOpen`/`setIsCartOpen`/`toggleCart`.
- **Wishlist count:** `getWishlistCount()` from `WishlistContext`.
- **Categories:** `apiService.categories.getAll()` → filtered via `getMainMenuCategories` (main menu) / `orderCategoriesHierarchically` (drawer/dropdown). Links use `categoryParam(cat)` → `/products?category=<slug>`.
- **Dual-mode (restate):** categories fetch flows through `extractData()`; the header works identically against JSON Server and Laravel. Keep the existing focus-refetch so admin menu edits appear without reload. No `db.json` changes.

## 7. Admin panel requirements

N/A (storefront header). The main menu remains fully admin-driven via category `showInMainMenu`/`menuOrder` — don't hardcode a category list.

## 8. Storefront requirements

- Header present on every storefront route, sticky, with the NEBM logo, search entry, Enquiry List (count), wishlist, account, and hamburger→category drawer.
- The Enquiry List icon opens `CartDrawer` (the enquiry-list drawer); the count reflects items added across the app.
- The hamburger opens `SidebarMenu` on all breakpoints as the primary category navigation.
- Mobile `BottomNav` gives parity: Home / Categories(→drawer) / Search / Enquiry List (count) / Account (or Wishlist), matching the header's enquiry-correct labels.
- No purchase/cart wording anywhere in header or bottom nav.

## 9. Acceptance criteria

- [ ] Header shows the NEBM main logo (image), legible on light and dark; small-screen icon variant works.
- [ ] Search entry (desktop bar + mobile icon) opens `SearchModal`.
- [ ] The basket control uses a list/quote icon (not a cart), is labelled **"Enquiry List"** with `aria-label="Enquiry List"`, badges `getCartItemCount()`, and opens `CartDrawer` via `setIsCartOpen(true)`/`toggleCart`.
- [ ] Wishlist icon badges `getWishlistCount()` and links to `/wishlist`.
- [ ] Account control works: guest → `openAuthModal("login")`; authed → dropdown with **My Enquiries** (not "My Orders"), Profile, Wishlist, Logout.
- [ ] A hamburger/menu button opens `SidebarMenu` on **all** breakpoints.
- [ ] No "Cart"/"Buy Now"/"Checkout" text appears in the header or bottom nav; ecommerce top-bar copy (free-shipping/track-order) is reworded to NEBM.
- [ ] Header is sticky with the spacer preserved (no content hidden under it).
- [ ] `BottomNav` includes an Enquiry List entry with the same count and enquiry-correct labels; hide-on-scroll still works.
- [ ] Brand blue `#1885d8` primary, gold `#fa9c4c` used only as accents.

## 10. Testing / verification steps

1. `npm run dev`; open `http://localhost:3000`.
2. **Logo:** confirm the NEBM logo renders; toggle dark mode — still legible; shrink to mobile — icon/logo swap works.
3. **Search:** click the search bar (desktop) and search icon (mobile) → `SearchModal` opens.
4. **Enquiry List:** add a product to the enquiry list (from Home/PDP); the header badge increments; the control reads "Enquiry List"; clicking opens the drawer. Confirm no "Cart" text anywhere (search the DOM).
5. **Wishlist:** toggle a wishlist item; header badge updates; icon links to `/wishlist`.
6. **Account:** as guest, click account → auth modal; log in → dropdown shows "My Enquiries".
7. **Hamburger:** on desktop *and* mobile, the menu button opens `SidebarMenu`; category links go to `/products?category=<slug>`.
8. **BottomNav (mobile):** Enquiry List tab shows the count and opens the drawer; Categories opens the drawer; nav hides on scroll-down.
9. **Dual-mode:** categories load (JSON Server at `http://localhost:3001/categories`); menu reflects `showInMainMenu` order.

## 11. Notes on preserving existing functionality

Do **not** break:
- **`useCart` contract** — `getCartItemCount`, `isCartOpen`, `setIsCartOpen`, `toggleCart`, and the localStorage key `"cart"` stay as-is; login-merge / logout-clear / server-sync untouched. Only the header's icon/label/semantics change to "Enquiry List".
- **Modal/drawer mounts** — keep `CartDrawer`, `SidebarMenu`, `AuthModal`, `SearchModal` mounted with their `open`/`onClose` props; only rewire triggers/labels.
- **API-driven menu & dual-mode** — keep `apiService.categories.getAll()` + `getMainMenuCategories`/`orderCategoriesHierarchically`; keep the focus-refetch; `extractData()` fidelity so it works on JSON Server and Laravel. No hardcoded category list.
- **Slug/category URLs** — links stay `/products?category=${categoryParam(cat)}`; parent-includes-children resolution is downstream and unaffected.
- **Auth** — `openAuthModal`, avatar/initials, logout, and token handling stay intact; never surface passwords.
- **Sticky spacer** — keep `headerSpacer` so page content isn't hidden under the fixed header.
- **BottomNav behaviour** — keep hide-on-scroll and existing badges; don't break the SearchModal mount there.
- **Storefront vs admin separation** — header/nav changes are storefront-only; don't touch admin layout/palette.
- **Enquiry-correct language** — never reintroduce "Cart"/"Buy Now"/"Checkout" wording; no deal-timer/urgency copy.
