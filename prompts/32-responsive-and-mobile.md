# 32 — Responsive & Mobile Pass

## 1. Objective
Do a mobile-first responsiveness sweep across the **entire** North East Build Mart (NEBM) app — storefront **and** admin — so every surface reflows cleanly from a 360px phone up to a 1440px+ desktop, with **44px minimum tap targets**, no horizontal scroll, and no layout regressions. This is a polish/QA prompt: no data model changes, no route changes. You are refactoring per-component CSS Modules (storefront) and MUI `sx`/breakpoints (admin), not rewriting components.

## 2. Context / background
NEBM is an e-commerce-*style* **enquiry** platform (Enquiry List instead of cart; Submit Enquiry instead of checkout; no payment/shipping). It was refactored from a React + JSON Server boilerplate. See `prompts/00-analysis-and-requirement-map.md`. Styling conventions (obey them):
- **Storefront** = per-component **CSS Modules** (`*.module.css`) driven by CSS custom properties in `src/theme/storefront-tokens.css` (`--sf-*`), mirrored for JS in `src/theme/tokens.js`.
- **Admin** = MUI 5 + `src/theme/adminTheme.js` (palette **separate** from storefront). Admin is already largely responsive: `AdminLayout` uses a permanent desktop `Drawer` + temporary mobile `Drawer` gated at `md` (899.95px), and the main content pins `minWidth:0` to avoid page-wide horizontal scroll.
- **Brand:** Blue `#1885d8`, Gold `#fa9c4c` (sparingly). Apple-minimal: generous whitespace, soft shadows, rounded cards, minimal elegant motion. **Mobile-first and fast.**

Breakpoint tokens to standardise on (from `src/theme/tokens.js` `TOKENS` / `storefront-tokens.css`): **xs 480 · sm 768 · md 1024 · lg 1280 · xl 1440**. Tap target: **`TOKENS.tapTarget` = 44px** (Apple HIG minimum). Use these consistently — do not invent ad-hoc pixel breakpoints per component.

## 3. Files & folders to inspect
- Global tokens/breakpoints: `src/theme/storefront-tokens.css` (`--sf-*`, any `--sf-bp-*`), `src/theme/tokens.js` (`TOKENS.tapTarget`, breakpoint constants), `src/theme/adminTheme.js`.
- Storefront chrome: `src/components/Header/`, `src/components/Footer/`, `src/components/SidebarMenu/` (the slide-in / off-canvas category drawer — NOT a mega menu), `src/components/SearchModal/`, `src/components/BottomNav/BottomNav.js` + `BottomNav.module.css`, `src/components/BottomDrawer/BottomDrawer.js` + `.module.css`.
- Storefront pages: `src/pages/Home.js`, `src/pages/Products.js` (grid/listing + filters/sort), `src/pages/ProductDetails.js` (gallery + info stacking), the **Enquiry List** page/drawer (formerly Cart — `src/components/CartDrawer/` and/or the Enquiry List page), the **Submit Enquiry / Enquiry Summary** page (formerly `src/pages/Checkout.js`), `src/pages/Wishlist.js`, `src/pages/Profile.js`.
- Storefront product components: `src/components/storefront/ProductCard.js`, `PriceBlock.js`, `ProductGallery.js`, `QuantityStepper.js`, `AddToCartBar.js` (Add to Enquiry List bar), `RelatedProducts.js`, `ReviewsSection.js`.
- Admin: `src/components/AdminLayout/AdminLayout.js` (already responsive), and the admin tables in `src/pages/Admin/AdminProducts.js`, `AdminCategories.js`, `AdminEnquiries.js` (renamed from AdminOrders), `AdminReviews.js`, `AdminUsers.js`, `AdminLeads.js`.

## 4. Step-by-step implementation instructions
1. **Standardise breakpoints.** Confirm `storefront-tokens.css` exposes breakpoint values (add `--sf-bp-xs:480px … --sf-bp-xl:1440px` if missing) and `TOKENS` exposes the same for MUI. Refactor per-component media queries to use these five stops (xs480/sm768/md1024/lg1280/xl1440). Remove one-off widths that don't map to a token unless there's a documented reason.
2. **Header + category drawer (`Header`, `SidebarMenu`).** On < md, collapse the desktop nav to a hamburger that opens the **`SidebarMenu`** slide-in category drawer (off-canvas, left, with backdrop, scroll-lock, ESC/back to close). The NEBM logo icon `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png` is the compact mobile-header mark; the full logo shows ≥ md. Hamburger, search, wishlist, account icons in the header are all ≥ 44px tap targets. Ensure the drawer lists the NEBM category tree (WPC Louvers, Tiles→…, Doors→…, etc.) and is a drawer, **not** a mega menu.
3. **BottomNav / BottomDrawer (mobile only).** `BottomNav` (Home · Categories · Search · Wishlist · Account) shows only < md and hides on scroll-down / shows on scroll-up (already implemented). Verify each `navItem` button is ≥ 44px, the wishlist badge doesn't overflow, and safe-area insets are respected (`env(safe-area-inset-bottom)`). `BottomDrawer` (bottom sheet used for filters/sort/quick actions) must have a large-enough drag handle and 44px controls; content scrolls within, backdrop closes. Keep the framer-motion spring.
4. **Product grids reflow (`Products.js`, `Home.js`, `RelatedProducts`, `FeaturedProducts`).** Grid columns: **2 up @ xs**, 2–3 @ sm, 3–4 @ md, 4 @ lg, up to 5 @ xl. Use CSS grid `repeat(auto-fill, minmax(...))` or explicit per-breakpoint counts. `ProductCard` image keeps aspect ratio; the "Add to Enquiry List" icon button and wishlist heart are ≥ 44px and don't overlap text. `PriceBlock` (exact / tiered "Price on Enquiry") must not clip at narrow widths.
5. **Product details stacking (`ProductDetails.js`, `ProductGallery`, `PriceBlock`, `QuantityStepper`, `AddToCartBar`).** Below md, stack **gallery → title/price → quantity + Add to Enquiry List → description → tiered-pricing table → reviews → related** in one column. The tiered quantity-vs-price table must be horizontally scrollable (or reflow to stacked rows) on narrow screens, never break layout. On mobile, pin a sticky bottom **Add to Enquiry List** bar (`AddToCartBar`) with a 44px+ button; no "Buy Now" anywhere.
6. **Enquiry List + Submit Enquiry on mobile.** The Enquiry List (drawer and/or page) shows line items with `QuantityStepper` (44px steppers), remove buttons, and **no monetary total / no payment UI**. The Submit Enquiry / **Enquiry Summary** page stacks the item review, the contact fields (name/phone/email), and the note/message textarea into one column with a full-width sticky **Submit Enquiry** button on mobile.
7. **Admin tables → cards on small screens.** For each admin list (`AdminProducts`, `AdminCategories`, `AdminEnquiries`, `AdminReviews`, `AdminUsers`, `AdminLeads`): below `md`, either (a) allow the existing `<TableContainer>` (which already sets `minWidth`) to scroll horizontally inside its `Paper` (never page-wide), or preferably (b) render a **stacked card list** per row (avatar/title + key fields + an actions menu) so admins aren't pinching a wide table on a phone. Keep the MUI table for ≥ md. `AdminLayout`'s drawer is already responsive — verify only; do not rework it.
8. **Kill horizontal scroll.** Audit for any element wider than the viewport (long product names, SKUs, tiered tables, wide chips). Use `min-width:0`, `overflow-wrap:anywhere`, `text-overflow:ellipsis`, and container `overflow-x` scoping. The admin main already sets `minWidth:0` + `overflowX:hidden` — preserve that.
9. **Tap targets pass.** Sweep every interactive element (icon buttons, chips-as-buttons, steppers, nav items, filter toggles) to ≥ 44×44px on touch. Add padding rather than shrinking the visual glyph.
10. **Motion.** Keep framer-motion transitions subtle (already a dependency): drawer slides, bottom-sheet spring, card hover. Respect `prefers-reduced-motion`.

## 5. UI/UX requirements
- Brand tokens only: Blue `#1885d8`, Gold `#fa9c4c` (accents/badges/hover, sparingly). Apple-minimal, generous whitespace, soft shadows, rounded corners.
- Storefront edits go in the relevant `*.module.css` (consume `--sf-*` tokens); admin edits use MUI `sx` with `theme.breakpoints`/the token stops. **Never** cross the streams (no storefront tokens in admin, no MUI palette leaking into storefront CSS).
- Logo: full logo `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` ≥ md; icon `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png` on compact mobile header. Both must read on light AND dark backgrounds.
- Icons via `@iconify/react` (`mdi:*`) / `@mui/icons-material` where already used; keep consistent, premium.
- All tap targets ≥ 44px (`TOKENS.tapTarget`). Respect safe-area insets on `BottomNav`.

## 6. Data & API requirements
N/A — this is a pure presentation/responsiveness pass. Do **not** change any `api.js` method, `db.json` shape, or the dual-mode `IS_MOCK_API` / `extractData()` plumbing. (Restated because the sweep touches components that render API data: leave the data flow, field names, and response shapes exactly as they are — only CSS/layout/`sx` changes.)

## 7. Admin panel requirements
- `AdminLayout` drawer already responsive (permanent ≥ md, temporary < md, closes on resize, backdrop) — verify, don't rebuild.
- Admin tables reflow to horizontally-scrollable-within-`Paper` or stacked cards below `md`; the page never scrolls horizontally.
- Admin toolbars/search/filter rows wrap gracefully; buttons stay ≥ 44px on touch.
- No removed modules reappear (Shipping/Payments/Coupons/Returns/Special Offers stay gone).

## 8. Storefront requirements
- Header collapses to hamburger + `SidebarMenu` category drawer < md; `BottomNav` shows < md only.
- Product grids: 2-up @ xs → up to 5 @ xl; cards keep aspect ratio; enquiry/wishlist icon buttons ≥ 44px.
- Product details single-column stack on mobile with sticky Add-to-Enquiry-List bar; tiered price table scrolls, never breaks.
- Enquiry List and Submit Enquiry / Enquiry Summary stack cleanly; full-width sticky Submit Enquiry button on mobile; **no cart total, no payment, no shipping, no Buy Now**.

## 9. Acceptance criteria
- [ ] No horizontal page scroll at 360px, 390px, 414px, 768px, 1024px, 1280px, 1440px on any storefront or admin route.
- [ ] All five breakpoint stops (xs480/sm768/md1024/lg1280/xl1440) come from tokens, not ad-hoc widths.
- [ ] Every interactive control is ≥ 44×44px on touch.
- [ ] Header collapses to hamburger + `SidebarMenu` drawer < md; full logo ≥ md, icon logo on compact mobile header.
- [ ] Product grid is 2-up on phones and scales up to 5 on wide desktop; cards never overlap or clip.
- [ ] Product details stack in one column on mobile with a sticky Add-to-Enquiry-List bar; tiered table scrolls without breaking.
- [ ] Enquiry List + Submit Enquiry pages are usable on a 360px phone; no money/payment/shipping UI.
- [ ] Admin tables are usable on mobile (scroll-in-`Paper` or stacked cards); `AdminLayout` drawer works; no page-wide horizontal scroll.
- [ ] `prefers-reduced-motion` disables/reduces animations.
- [ ] `npm run build` is clean.

## 10. Testing / verification steps
1. `npm run dev`. In DevTools device toolbar, test iPhone SE (375), iPhone 14 Pro (393), Pixel 7 (412), iPad (768/1024), and desktop (1280/1440).
2. Storefront: home → open category drawer (`SidebarMenu`) → product listing (check grid columns per width) → product details (check stacking + sticky enquiry bar + tiered table scroll) → Add to Enquiry List → Enquiry List → Submit Enquiry / Enquiry Summary. Scroll to confirm `BottomNav` hides/shows.
3. Toggle dark mode; confirm logos and tokens read on both themes.
4. Admin: log into `/admin`; open the mobile drawer at < md; visit Products/Categories/Enquiries/Reviews/Users/Leads and confirm the tables are usable (scroll-in-card or stacked) with no page-wide horizontal scroll.
5. Tap-target audit: use DevTools "Show rulers"/inspect to confirm icon buttons and nav items measure ≥ 44px.
6. Enable "Emulate CSS prefers-reduced-motion: reduce" and confirm animations quiet down.
7. `npm run build` — confirm a clean production build.

## 11. Notes on preserving existing functionality
Do **not** break:
- **Dual-mode** `IS_MOCK_API` + `extractData()` + JSON-shape fidelity — this pass changes only CSS/layout/`sx`, never data flow or `api.js`.
- **Auth**, **routing**, and **provider nesting order** in `App.js` (`Theme→Auth→Admin→Wishlist→Cart→Order`, storefront in `DealsConfigProvider`) — untouched.
- **Slug product URLs** + `?category=<slug>` + parent-includes-children (`getCategoryScopeIds`) — untouched.
- **Safe non-cascading DELETE** (`server.js`) — untouched.
- **Per-component CSS Modules** convention and **storefront vs admin palette separation** — keep them strictly separate.
- **localStorage `"cart"`** persistence and the login-merge/logout-clear behaviour behind the Enquiry List — untouched.
- **Enquiry-only storefront** — do not reintroduce cart totals, payment, shipping, or Buy Now while restyling.
- Reuse/refactor existing components and their CSS Modules; do not rewrite them or the `AdminLayout` responsive drawer.
