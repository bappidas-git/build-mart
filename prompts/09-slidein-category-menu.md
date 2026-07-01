# 09 — Slide-in Category Menu

## 1. Objective

Repurpose `src/components/SidebarMenu/SidebarMenu.js` (+ `SidebarMenu.module.css`) into the NEBM **off-canvas / drawer category menu** — a slide-in panel (NOT a mega menu) triggered by the header's menu (hamburger) button, working equally well on desktop and mobile. It renders the NEBM category tree from `src/utils/categories.js`, links each category to `/products?category=<slug>` via `categoryParam(cat)`, lets parents expand to show subcategories, and preserves the parent-includes-children filtering rule. Smooth framer-motion slide; premium, minimal.

## 2. Context / background

**Brand:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Primary Blue `#1885d8`, Accent Gold/Orange `#fa9c4c` (sparingly). Aesthetic: Apple-minimal, soft shadows, generous white space. Main logo `…/logo_fnscna.png`, icon `…/icon_bvsukn.png`. This is an **enquiry** platform (no cart/checkout language).

**NEBM category tree** (seeded in `db.json` by prompt 06): 12 top-level categories — WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing Products, Tiles, Doors, Hardware, Plumbing, Bath Fittings, Cement, Steel Rods, Special Products — several with subcategories (Tiles/Doors/Hardware/Plumbing/Bath Fittings/Cement/Steel Rods). The brief mandates a **slide-in/off-canvas drawer**, explicitly **not** a mega menu.

**Current `SidebarMenu.js`** is already a left-side off-canvas drawer with framer-motion (backdrop + spring panel), a brand hero, a guest/user card, "Discover" quick links, a lazy-loaded "Shop by Category" accordion (fetches `apiService.categories.getAll()`, builds a parent→children index, single-open parent expansion, deep descendant rendering, "Shop all <parent>" and "View all products"), an account section, and settings (theme toggle, help). It uses `categoryParam(kid)` → `/products?category=<slug>` for links. It's opened from the header's mobile hamburger via `open`/`onClose`. The boilerplate hardcodes a generic brand icon (`ShoppingCartRounded`) and a keyword→glyph icon map tuned to the old generic tree; it also has ecommerce-flavoured quick links ("Today's Deals", "Special Offers", "Best Sellers") and "My Orders".

**Dual-mode rule (restate):** the drawer reads categories through `apiService.categories.getAll()` and must render identically against JSON Server and Laravel via `extractData()` — the API already normalises the shape. Keep the fetch API-driven; don't hardcode categories or a mock-only shape.

## 3. Files & folders to inspect

- `src/components/SidebarMenu/SidebarMenu.js` + `SidebarMenu.module.css` — the drawer to repurpose.
- `src/components/Header/Header.js` — the trigger (`sidebarOpen`, `<SidebarMenu open onClose onOpenAuth />`); prompt 08 makes the hamburger open it on all breakpoints.
- `src/utils/categories.js` — `getMainMenuCategories`, `orderCategoriesHierarchically`, `categoryParam`, `getCategoryScopeIds` (the helpers to render from and keep working).
- `src/services/api.js` — `categories.getAll()` + `extractData()` (mock vs Laravel).
- `src/context/ThemeContext.js`, `src/hooks/useAuth.js` — theme + user for the drawer hero/account rows.
- `@iconify/react` (already bundled) — for premium category glyphs.

## 4. Step-by-step implementation instructions

1. **Keep it a drawer, not a mega menu.** Preserve the off-canvas structure: backdrop + left-slide panel, body-scroll lock while open, Escape-to-close, focus-into-panel. Confirm the header opens it on **all** breakpoints (coordinated with prompt 08), so it's the primary category navigation on desktop too.
2. **Brand the hero** with the NEBM logo (`…/logo_fnscna.png` or icon `…/icon_bvsukn.png`) instead of the `ShoppingCartRounded` glyph + `APP_NAME`. Keep the guest/user card, but reword ecommerce copy (e.g. guest sub-text → "Sign in to manage your enquiries & wishlist").
3. **Render the NEBM tree from `categories.js`:**
   - Fetch via `apiService.categories.getAll()` (keep lazy-load on first open, or eager if simpler — either is fine, but keep it API-driven).
   - Build the parent→children structure. You may keep the existing local index logic OR use `orderCategoriesHierarchically(categories)` for a consistent hierarchical order and `getMainMenuCategories(categories)` where a menu-curated top set is wanted. The category section should show the **12 top-level** categories, each expandable to its subcategories.
   - Treat a category as top-level when `parentId == null` (or its parent isn't in the active list) so orphans never vanish.
4. **Expandable parents:** each parent row toggles open to reveal its subcategories (single-open accordion is fine). Parents **with** children expand on click; parents **without** children (WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing Products, Special Products) navigate directly. Provide a **"Shop all <Parent>"** link at the top of an expanded group that navigates to the parent's own `/products?category=<parent-slug>` — this is what makes **parent-includes-children** visible (the listing uses `getCategoryScopeIds` to include descendants).
5. **Links:** every category/subcategory link uses `categoryParam(cat)` → `navigate('/products?category=' + categoryParam(cat))` then `onClose()`. Do not build ad-hoc URLs; the slug scheme is canonical.
6. **Category icons:** give each top-level NEBM category a fitting **Iconify** (or Icons8-style) glyph — e.g. WPC Louvers, Tiles, Doors, Hardware (wrench), Plumbing (pipe), Bath Fittings (shower), Cement (bag), Steel Rods (rebar), Sheets (panel), Waterproofing (shield/drop), Special Products (star/gold). Replace the generic keyword map with an NEBM-oriented name→icon map (keep a safe generic fallback so an unseen name never breaks). Keep the style consistent and premium.
7. **Reword quick links / account** for the enquiry model: drop deal/coupon-flavoured items; keep sensible discovery ("Featured", "Special Products" → `/special-offers`, "All Products" → `/products`). In the account section, rename "My Orders" → **"My Enquiries"** (route `/orders` for now). Keep wishlist, profile, help, theme toggle, logout.
8. **Motion:** keep the framer-motion backdrop-fade + spring panel-slide and the staggered row entrance; smooth and subtle. Don't make it a full-width mega panel — it stays a fixed-width drawer (e.g. ~360–420px, full-height, full-width on small phones).
9. **Palette:** apply brand blue `#1885d8` for primary/active states and gold `#fa9c4c` for small accents (e.g. the Special Products glyph/badge). Neutral surfaces, soft shadow on the panel edge, comfortable 44px tap targets.
10. Keep the drawer's `open`/`onClose`/`onOpenAuth` props unchanged so `Header.js` doesn't need rewiring beyond opening it on all breakpoints.

## 5. UI/UX requirements

- **Type:** off-canvas drawer (left slide-in), NOT a mega menu. Fixed width on desktop, full-width on small phones; full height with its own scroll area.
- **Tree:** 12 NEBM top-level categories, expandable to subcategories; "Shop all <Parent>" per expanded group; "View all products" at the bottom.
- **Icons:** Iconify/Icons8 category glyphs, one per top-level category, consistent and premium; generic fallback for safety.
- **Colors:** blue `#1885d8` primary/active; gold `#fa9c4c` sparingly (Special Products accent, subtle highlights).
- **Motion:** framer-motion backdrop fade + spring slide + staggered rows; smooth, not flashy.
- **A11y:** `role="dialog"`, `aria-modal`, Escape-to-close, focus management, `aria-expanded` on parent toggles, body-scroll lock.
- **Copy:** enquiry-correct — no "Cart/Buy/Checkout/Deals-timer" language; "My Enquiries" not "My Orders".

## 6. Data & API requirements

- **Categories:** `apiService.categories.getAll()` → array of `{ id, name, slug, parentId, isActive, sortOrder, showInMainMenu, menuOrder }`. Render via `orderCategoriesHierarchically` / `getMainMenuCategories`; link via `categoryParam`.
- **Parent-includes-children:** the drawer only *links* to `/products?category=<slug>`; the listing page applies `getCategoryScopeIds(categoryId, categories)` so selecting a parent includes all descendant products. Do not filter products in the drawer — just navigate.
- **Dual-mode (restate):** the fetch flows through `extractData()`; the same drawer works against JSON Server (`:3001/categories`) and Laravel. Handle both array and `{data:[…]}` shapes defensively (the code already does `Array.isArray(data) ? data : data?.data ?? []`). No `db.json` changes.

## 7. Admin panel requirements

N/A. The tree is admin-driven through category data (`isActive`, `sortOrder`, `parentId`, `showInMainMenu`, `menuOrder`) — no hardcoding; admin edits to categories reflect here on next fetch.

## 8. Storefront requirements

- Opened by the header hamburger on desktop and mobile as the primary category navigation.
- Shows the full NEBM tree with expandable parents and subcategory links; every link deep-links to the slug-based listing.
- "Shop all <Parent>" demonstrates parent-includes-children; "View all products" → `/products`.
- Enquiry-correct copy throughout; NEBM branding in the hero.

## 9. Acceptance criteria

- [ ] The menu is an off-canvas **drawer** (left slide-in), not a mega menu; fixed-width desktop, full-width phone, full height with internal scroll.
- [ ] Opened by the header menu button on **all** breakpoints via the existing `open`/`onClose` props.
- [ ] Renders the **12 NEBM top-level** categories from `apiService.categories.getAll()` (no hardcoded list), each with an Iconify/Icons8 glyph and a safe fallback.
- [ ] Parents with children expand to show subcategories; parents without children navigate directly.
- [ ] Every category/subcategory link uses `categoryParam(cat)` → `/products?category=<slug>` and closes the drawer.
- [ ] "Shop all <Parent>" links to the parent slug (parent-includes-children preserved via `getCategoryScopeIds` on the listing).
- [ ] Hero shows NEBM logo/icon; copy is enquiry-correct ("My Enquiries", no cart/deal language).
- [ ] Brand blue `#1885d8` primary/active; gold `#fa9c4c` used only as accents.
- [ ] Framer-motion slide/backdrop + staggered rows; Escape closes; body scroll locks; `aria-modal`/`aria-expanded` present.

## 10. Testing / verification steps

1. `npm run dev`; open `http://localhost:3000`.
2. Click the header hamburger on **desktop** and **mobile** widths → the drawer slides in from the left with a backdrop.
3. Expand **Tiles** → Floor/Wall/Vitrified/Bathroom & Kitchen/Outdoor Tiles appear; click "Shop all Tiles" → `/products?category=tiles` shows Tiles + all subcategory products (parent-includes-children).
4. Click a subcategory (e.g. Floor Tiles) → `/products?category=floor-tiles` shows only that leaf's products; the drawer closes.
5. Expand a flat top-level (e.g. WPC Louvers) → it navigates directly (no children).
6. Press Escape → drawer closes; confirm body scroll was locked while open and restored after.
7. Verify each top-level category shows a fitting NEBM icon; an unknown name would fall back to a generic glyph.
8. Confirm no "Cart/Buy/Checkout/Deal-timer" copy; account shows "My Enquiries".
9. **Dual-mode:** categories match `http://localhost:3001/categories`; order reflects `sortOrder`/`menuOrder`.

## 11. Notes on preserving existing functionality

Do **not** break:
- **Slug/category rules** — links stay `/products?category=${categoryParam(cat)}`; the listing's parent-includes-children (`getCategoryScopeIds`) must keep working; don't filter products inside the drawer.
- **API-driven & dual-mode** — keep `apiService.categories.getAll()` + `extractData()` fidelity; handle array and `{data:[]}` shapes; no hardcoded categories or mock-only shape.
- **Drawer contract** — keep `open`/`onClose`/`onOpenAuth` props so `Header.js` wiring holds; keep body-scroll lock, Escape-to-close, and focus management.
- **`categories.js` helpers** — use `categoryParam`, `orderCategoriesHierarchically`, `getMainMenuCategories`; don't reimplement or alter their logic.
- **Auth** — user/guest card, `onOpenAuth`, logout stay intact; never surface passwords.
- **Not a mega menu** — keep the off-canvas drawer form factor per the brief.
- **Enquiry-correct language** — no "Cart/Buy Now/Checkout"; "My Enquiries" not "My Orders"; no deal-timer/urgency copy.
- **Per-component CSS Modules** — keep styles in `SidebarMenu.module.css`; storefront-only (don't touch admin).
- **Reuse, don't rewrite** — extend the existing drawer; keep the motion variants, accordion, and index logic where they already work.
