# 26 — Admin Products & Categories CRUD

## 1. Objective
Bring the admin **Products** and **Categories** managers fully in line with North East Build Mart (NEBM). Update `src/pages/Admin/AdminProducts.js` and `src/pages/Admin/AdminCategories.js` so the admin can create/read/update/delete products (images, description, specifications, category/subcategory selection from the NEBM tree, brand, stock, and the `special`/`featured` flags) and categories/subcategories (parent select, slug, sortOrder, showInMainMenu, menuOrder, isActive) — with **category delete enforcing referential integrity** (blocked while children or products reference it). Pricing controls (`priceType`, tiers, unit, display flags) are added on top of the product form in **prompt 27** — leave a clear hook and cross-reference it here.

## 2. Context / background
- Business: **North East Build Mart** — building materials for interior & exterior use. The admin panel uses **MUI 5 + `src/theme/adminTheme.js`** and `@iconify/react` `mdi:*` icons (palette separate from the storefront). Brand hexes for accents: blue `#1885d8`, gold `#fa9c4c`.
- **NEBM category tree** to be seeded (data lives in `db.json`; the form must select from whatever `getCategories()` returns): WPC Louvers · Polycarbonate Sheets · FRP Sheets · Waterproofing Products · Tiles (Floor/Wall/Vitrified/Bathroom & Kitchen/Outdoor) · Doors (Steel/PVC/WPC/Designer/Bathroom) · Hardware (Door Locks/Handles & Hinges/Fasteners/Cabinet Fittings/Construction Hardware) · Plumbing (PVC/CPVC/SWR Pipes/Water Tanks/Pipe Fittings & Accessories) · Bath Fittings (Showers/Faucets & Taps/Wash Basins/Sanitary Ware/Bathroom Accessories) · Cement (OPC/PPC/Premium) · Steel Rods (TMT Bars/Construction Steel/High-Strength Reinforcement Bars). **Special Products** is a *badged collection* driven by a `special` flag on products, NOT an exclusive category.
- **`categories` schema** (`db.json`, self-referencing tree): `id, name, slug, description, image, parentId, isActive, sortOrder, showInMainMenu, menuOrder, createdAt, updatedAt`. The `src/utils/categories.js` helpers (`resolveCategory`, `getDescendantIds`, `getCategoryScopeIds` = parent-includes-children, `orderCategoriesHierarchically`, `getMainMenuCategories`) must keep working — only data changes.
- **`products` schema** (`db.json`): `id, name, slug, sku, shortDescription, description, categoryId, brand, images[], price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{}, variants[], tags[], featured, trending, hot, isActive, rating, totalReviews, metaTitle, metaDescription, createdAt, updatedAt, frequentlyBoughtTogetherIds[], relatedProductIds[]`. NEBM extends it with a **`special`** flag (this prompt) and the pricing fields `priceType, unitType, minQty, priceTiers[], showExactPrice, showTieredPricing, cardPriceMode` (**prompt 27**).
- **Referential integrity for category delete** is already enforced server-side-equivalently in `apiService.admin.deleteCategory` (mock branch, `src/services/api.js` ~line 1707): it refuses the delete while subcategories or products reference the category and throws an `Error` with `err.code = "CATEGORY_IN_USE"`. The safe **non-cascading DELETE in `server.js` stays** — never add cascade behaviour.
- Dual-mode rule (restate): every method branches on `IS_MOCK_API`; responses flow through `extractData()`; the mock uses JSON Server, prod uses Laravel; keep the payload JSON-shape identical so the same form works against both.

## 3. Files & folders to inspect
- `src/pages/Admin/AdminProducts.js` — product table + create/edit dialog.
- `src/pages/Admin/AdminCategories.js` — category table + create/edit dialog (already has cycle-guard + menu toggle).
- `src/services/api.js` — `admin.getProducts` (~1614), `createProduct` (~1636), `updateProduct` (~1651), `deleteProduct` (~1665), `getCategories` (~1677), `createCategory` (~1686), `updateCategory` (~1697), `deleteCategory` (~1707).
- `src/utils/categories.js` — hierarchy helpers (do not break).
- `prompts/00-analysis-and-requirement-map.md` §3 (schemas), §4 (tree), §6 (Risk Register items 3 & 4).

## 4. Step-by-step implementation instructions
### Products (`AdminProducts.js`)
1. Add a **`special: false`** field to `emptyProduct`, load it in `openEdit` (`special: !!p.special`), and include it in the save payload (`special: form.special`).
2. In the "Visibility & Flags" section of the dialog, add a `Switch` labelled **"Special Product (badged collection)"** bound to `form.special`. Keep the existing Active/Featured/Trending/Hot switches.
3. **Category/subcategory select**: the `categoryId` `Select` must present the tree readably. Order options with a hierarchy helper (reuse `orderCategoriesHierarchically` from `src/utils/categories.js` if available, else sort by `sortOrder` then name) and indent subcategories (e.g. prefix child names with `— ` based on `parentId`). Keep storing the raw `categoryId` value.
4. **Specifications**: extend the form to capture a simple key/value **specifications** list (e.g. `specifications: [{ label, value }]`) with add/remove rows, rendered under a "Specifications" section between Description and Pricing. Persist `specifications` on the payload only when non-empty. (These render on the storefront product details spec table.)
5. Keep the existing **images (one-URL-per-line)**, **description/shortDescription**, **brand**, **stock/lowStockThreshold**, **variants**, **tags**, **SEO**, slug auto-generation, and `makeUniqueSlug` uniqueness logic intact.
6. **Pricing placeholder**: leave the existing "Pricing" section but add a comment `{/* Pricing controls (priceType/tiers/unit/display flags) are added in prompt 27 */}` so prompt 27 has an anchor. Do not remove the current price/comparePrice/costPrice fields yet.
7. CRUD wiring stays on `apiService.admin.getProducts / createProduct / updateProduct / deleteProduct`. On edit, keep the existing merge (`{ ...editingProduct, ...editable }`) so server-managed fields (`rating`, `totalReviews`, `createdAt`) survive the PUT.

### Categories (`AdminCategories.js`)
8. This file is already close. Verify/keep: parent `Select` excluding self + descendants (cycle guard via `getDescendantIds`), `slug` (auto from name on create), `sortOrder`, `isActive`, and the **Main Menu** block (`showInMainMenu` + `menuOrder`) with the inline quick-toggle in the table.
9. Ensure `handleSave` sends `parentId` as a number or `null`, `sortOrder`/`menuOrder` as numbers, and `showInMainMenu` as boolean, spreading `{ ...editingCategory, ...payload }` on edit so `createdAt` survives.
10. **Delete flow**: keep the early client-side subcategory guard, then call `apiService.admin.deleteCategory(cat.id)`. When the API throws with `error.code === "CATEGORY_IN_USE"`, surface it as an **info** SweetAlert ("Category in use") with the error message, NOT a red error — this is expected validation, not a fault. Do not attempt to cascade-delete.
11. Confirm the image URL field, description, and search-by-name/slug remain.

## 5. UI/UX requirements
- MUI dialogs, `Grid` layout, section dividers with `subtitle2` headers — match the existing premium/minimal admin style. Rounded cards, `1px solid divider` borders.
- Icons (`mdi:*`): add `mdi:plus`, delete `mdi:delete-outline`, edit `mdi:pencil-outline`, special-flag chip `mdi:star-shooting-outline`, specifications rows `mdi:format-list-bulleted`.
- Show a **Special** chip in the products table Flags column (alongside Featured/Trending/Hot) when `p.special` is true; use gold `#fa9c4c` accent or MUI `warning` colour sparingly.
- Category `Select` options should visually convey depth (indentation / `— ` prefix). Read colours from `adminTheme.js`; only the two brand hexes are literal.

## 6. Data & API requirements
- Products persist via `apiService.admin.createProduct(payload)` (mock POST `/products`) and `updateProduct(id, payload)` (mock PUT `/products/:id`); delete via `deleteProduct(id)` (uses `deleteWithVerify`). New/changed fields on the payload: `special` (this prompt), `specifications[]` (this prompt). **Keep the JSON shape identical between mock and Laravel branches.**
- Categories persist via `createCategory / updateCategory / deleteCategory`. `deleteCategory` mock branch enforces referential integrity and throws `CATEGORY_IN_USE`; do not weaken it.
- **Dual-mode**: all reads/writes go through the `apiService.admin.*` methods that already branch on `IS_MOCK_API` and shape via `extractData()`. Do not bypass them with raw `fetch`/`axios`.
- Slugs must stay **unique** (products) and URL-safe; `parentId` links must stay valid so `getCategoryScopeIds` (parent-includes-children) and slug deep-links keep working.

## 7. Admin panel requirements
Entirely admin-side. Products and Categories remain in the **Catalogue** nav group. No new nav entries.

## 8. Storefront requirements
N/A for editing, but note the downstream contract: products flagged `special` feed the storefront **Special Products** badged collection (prompt 11), and `specifications[]` renders in the storefront product details spec table. Keep field names stable so storefront code can read them.

## 9. Acceptance criteria
- [ ] Product create/edit dialog has a **Special Product** switch persisting `special` on the record.
- [ ] Product category `Select` lists the NEBM tree with subcategories visually nested; saving stores the chosen `categoryId`.
- [ ] Product **specifications** (label/value rows) can be added/removed and persist as `specifications[]`.
- [ ] Existing product fields (images, description, brand, stock, variants, tags, SEO, slug uniqueness) still work; edit preserves `rating`/`totalReviews`/`createdAt`.
- [ ] A **Special** chip appears in the products table for flagged products.
- [ ] Categories create/edit persists parent, slug, sortOrder, showInMainMenu, menuOrder, isActive; cycle guard prevents self/descendant parenting.
- [ ] Deleting a category that has subcategories OR products is **blocked** with an info message; deleting an unused leaf category succeeds.
- [ ] Dual-mode intact; no raw fetch/axios bypass; `server.js` DELETE remains non-cascading.
- [ ] App builds; both pages load without console errors.

## 10. Testing / verification steps
1. `npm run dev`; log in at `/admin`.
2. **Products**: open `/admin/products` → Add Product. Pick a subcategory (e.g. Tiles → Floor Tiles), add 2 image URLs, 2 specification rows, toggle Special + Featured, save. Confirm the row shows Special/Featured chips.
3. Verify persistence: `http://localhost:3001/products` — the new product has `special: true`, correct `categoryId`, and `specifications[]`.
4. Edit the product, change stock, save; confirm `rating`/`createdAt` are unchanged in JSON.
5. **Categories**: open `/admin/categories` → Add subcategory under "Doors" (parent select), set sortOrder and Show-in-menu, save. Toggle the inline Main-Menu switch on a row; confirm `showInMainMenu`/`menuOrder` update at `http://localhost:3001/categories`.
6. Try to delete a top-level category that still has subcategories/products → expect a blocking info dialog. Delete an empty leaf category → succeeds.
7. Confirm storefront listing deep-link `/products?category=<slug>` still resolves (parent-includes-children) for a parent category.

## 11. Notes on preserving existing functionality
- **Dual-mode `IS_MOCK_API` + `extractData()` + JSON-shape fidelity** — never bypass `apiService.admin.*`.
- **Category referential integrity** enforced in `deleteCategory` (`CATEGORY_IN_USE`) and the **safe non-cascading DELETE in `server.js`** — keep both; do not cascade.
- **`src/utils/categories.js` helpers** (`getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`) and the cycle-guard must keep working — only data/UI change.
- **Slug + category rules** — product slugs unique + URL-safe; `parentId` links valid; `?category=<slug>` + legacy numeric id keep resolving.
- **adminTheme separation** — no storefront tokens/CSS Modules; brand hexes `#1885d8`/`#fa9c4c` only where an accent is wanted.
- Do NOT remove the current price/comparePrice/costPrice fields — prompt 27 extends the pricing block; this prompt only anchors it.
- **Auth/token interceptors** and **provider nesting** untouched. Reuse and refactor the existing dialogs rather than rewriting them.
