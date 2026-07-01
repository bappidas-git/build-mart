# 06 — Category Tree & Product Seed

## 1. Objective

Replace the generic boilerplate catalogue in `db.json` with the **North East Build Mart (NEBM)** category tree and a realistic set of dummy products spanning every category and subcategory. Seed:

- `db.json.categories` — the **12 top-level** NEBM categories plus their subcategories, as a self-referencing tree (`parentId`), each with a unique `slug`, `sortOrder`, `showInMainMenu`, `menuOrder`, `isActive`, and `image`.
- `db.json.products` — dummy products under **all** categories/subcategories, using placeholder images and the NEBM **pricing model** (`priceType` exact / tiered / onEnquiry, `unitType`, `minQty`, `priceTiers[]`, display flags, and the `special` flag for the badged Special Products collection).

The seed must keep the `src/utils/categories.js` helpers working unchanged: parent-includes-children scoping (`getCategoryScopeIds`), slug URLs (`categoryParam` / `resolveCategory`), and the admin-curated main menu (`getMainMenuCategories`). This is a **data-only** change to `db.json`; do not modify `categories.js` or component code in this prompt.

## 2. Context / background

**Brand:** North East Build Mart — "Deals in all kinds of building materials for interior and exterior use." Address: Lawkhuwa Road, Nagaon, Assam – 782002. Phone: +91 86385 43526 · +91 88762 89972. It is an e-commerce-*style* **enquiry** platform, not a checkout store — but this prompt only touches catalogue data, so no UI terminology is involved here.

The boilerplate ships a generic tree (Electronics / Clothing / Home & Garden …) in `db.json.categories` (16 rows today) and 19 generic products. See `prompts/00-analysis-and-requirement-map.md` §3–§4 for the full field shapes and the target NEBM tree. `src/utils/categories.js` is the single source of truth for category logic and reads only these fields: `id, name, slug, parentId, isActive, sortOrder, showInMainMenu, menuOrder`. It never hardcodes a category — everything is data-driven — so reseeding is safe as long as the field shapes and slug/parent rules are preserved.

**Special Products (category 12)** is a *badged/curated collection*, **not** an exclusive category: items flagged `special: true` also live under their real top-level category (e.g. a "Special" WPC Louver still has `categoryId` pointing at a WPC Louvers node). Do **not** create a "Special Products" parent that owns products exclusively.

**Dual-mode rule (restate — this seed feeds both backends):** the same UI runs against JSON Server (mock) *and* a Laravel API. `db.json` is the mock seed; keep every field shape JSON-serialisable and stable so responses flow cleanly through `extractData()` in `src/services/api.js` and the same components render identically in both modes. Never invent a shape that only works in mock (e.g. do not nest products inside categories).

## 3. Files & folders to inspect

- `db.json` — the collections to edit: `categories`, `products`. (Read the current rows first for exact field shapes.)
- `src/utils/categories.js` — the helpers your seed must keep working: `categoryParam`, `resolveCategory`, `getDescendantIds`, `getCategoryScopeIds`, `orderCategoriesHierarchically`, `getMainMenuCategories`.
- `src/services/api.js` — `products.getAll/getFeatured/getTrending/getByCategory`, `categories.getAll/getBySlug`, and `extractData()` (confirm mock branches filter by `?featured=true`, `?categoryId=`, `?slug=` — so your seeded fields must match those query keys).
- `src/utils/helpers.js` — `getProductMinPrice`, `getProductMaxDiscount`, `buildCartItem`, `productPath` (they read `price`, `comparePrice`, `variants[].price`, `slug`, `id`) — so keep those fields present and sensible.
- `server.js` — SAFE non-cascading DELETE; category referential integrity is enforced in the API layer, not the DB. Do not touch.

## 4. Step-by-step implementation instructions

1. **Back up the current `db.json`** (copy to `db.backup.json`) before editing, so a bad seed is recoverable.
2. **Replace `db.json.categories`** with the NEBM tree below. Use stable integer `id`s. Assign top-level nodes `parentId: null`; subcategories point `parentId` at their parent's id. Every category needs a unique kebab-case `slug`.
   - **Top-level ids 1–12**, in this order (this is `sortOrder` 1..12 and `menuOrder` 1..12):
     1. WPC Louvers · 2. Polycarbonate Sheets · 3. FRP Sheets · 4. Waterproofing Products · 5. Tiles · 6. Doors · 7. Hardware · 8. Plumbing · 9. Bath Fittings · 10. Cement · 11. Steel Rods · 12. Special Products.
   - **Subcategories** (assign ids 13+ sequentially):
     - Tiles → Floor Tiles, Wall Tiles, Vitrified Tiles, Bathroom & Kitchen Tiles, Outdoor Tiles
     - Doors → Steel Doors, PVC Doors, WPC Doors, Designer Doors, Bathroom Doors
     - Hardware → Door Locks, Handles & Hinges, Fasteners, Cabinet Fittings, Construction Hardware
     - Plumbing → PVC Pipes, CPVC Pipes, SWR Pipes, Water Tanks, Pipe Fittings & Accessories
     - Bath Fittings → Showers, Faucets & Taps, Wash Basins, Sanitary Ware, Bathroom Accessories
     - Cement → OPC Cement, PPC Cement, Premium Construction Cement
     - Steel Rods → TMT Bars, Construction Steel, High-Strength Reinforcement Bars
   - **Special Products (id 12)** has **no subcategories** and **no products of its own** — it is surfaced via the `special` flag on products (see step 6). Set `showInMainMenu: false` for it (it is a homepage/badge collection, not a menu tree branch), OR `true` if you want a "Special Products" menu entry that links to the `/special-offers` collection — pick one and be consistent; the recommended default is `showInMainMenu: true`, `menuOrder: 12`, so it appears last in the menu and links to the curated collection.
3. **Set menu flags:** all 12 top-level categories get `showInMainMenu: true` with `menuOrder` = their position (1..12). Subcategories get `showInMainMenu: false` (they appear inside the slide-in drawer under their parent, not in the flat top menu) and a `sortOrder` that orders them within their parent (1,2,3…). Set `isActive: true` on all.
4. **Set images** on every category using the placeholder scheme (URL-encode the name): `https://placehold.co/400x300/1885d8/FFFFFF?text=<Name>` (blue brand tint for categories, e.g. `?text=WPC+Louvers`). Keep this consistent.
5. **Timestamps:** give each category `createdAt`/`updatedAt` ISO strings (any fixed date is fine, e.g. `"2026-01-01T00:00:00.000Z"`), matching the existing shape.
6. **Replace `db.json.products`** with dummy products so that **every leaf category has at least 2–3 products** and every parent-without-leaves (Special Products excepted) is reachable. Aim for ~50–70 products total. For each product set:
   - Identity: unique integer `id`, `name`, unique kebab-case `slug`, `sku`, `shortDescription`, `description`, `brand`, `tags[]`.
   - `categoryId` — the **leaf** category id (never the Special Products id). For flat top-level categories with no children (WPC Louvers, Polycarbonate Sheets, FRP Sheets, Waterproofing Products), use the top-level id directly.
   - `images[]` — 1–3 placeholder URLs: `https://placehold.co/600x400/1a1a2e/FFFFFF?text=<Name>` with the product name URL-encoded (spaces → `+`, `&` → `%26`), e.g. `?text=WPC+Louver+Panel`.
   - **Pricing model** (see §6 for the exact schema): choose a `priceType` per product spread across the three modes; set `unitType`, `minQty`, `priceTiers[]` (only for tiered), and the display flags.
   - Keep existing display/logic fields the UI reads: `price`, `comparePrice` (or null), `stock`, `isActive: true`, `rating`, `totalReviews`, `featured` (bool), `trending` (bool), and add `special` (bool). Set `featured: true` on ~8–10 products across categories and `special: true` on ~8–12 products across **different** top-level categories.
   - Keep `variants: []` (empty is fine) unless you want to demo variants; keep `relatedProductIds: []` / `frequentlyBoughtTogetherIds: []` present (empty arrays are safe).
7. **Verify referential integrity** (see §9): no product `categoryId` points at a missing/`Special Products` node; no subcategory `parentId` points at a missing parent; all slugs unique across `categories` and separately across `products`.
8. Do **not** edit any other `db.json` collection in this prompt.

## 5. UI/UX requirements

N/A for the data seed itself, except image conventions:
- **Category images:** `https://placehold.co/400x300/1885d8/FFFFFF?text=<Name>` (brand blue `#1885d8`).
- **Product images:** `https://placehold.co/600x400/1a1a2e/FFFFFF?text=<Name>` (dark slate, per brand placeholder spec).
- Accent gold `#fa9c4c` is used by the storefront for the "Special" badge (prompt 11) — no need to encode it here; just make sure enough products carry `special: true`.

## 6. Data & API requirements

**Category object — concrete example (a subcategory of Tiles, id 5):**
```json
{
  "id": 16,
  "name": "Floor Tiles",
  "slug": "floor-tiles",
  "description": "Durable floor tiles for interior and exterior use",
  "image": "https://placehold.co/400x300/1885d8/FFFFFF?text=Floor+Tiles",
  "parentId": 5,
  "isActive": true,
  "sortOrder": 1,
  "showInMainMenu": false,
  "menuOrder": 0,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```
A top-level example (id 5, Tiles): same shape with `"parentId": null`, `"sortOrder": 5`, `"showInMainMenu": true`, `"menuOrder": 5`.

**Product object — concrete example (tiered pricing, lives under Floor Tiles):**
```json
{
  "id": 101,
  "name": "Glazed Vitrified Floor Tile 600x600",
  "slug": "glazed-vitrified-floor-tile-600x600",
  "sku": "TIL-FLR-6060-001",
  "shortDescription": "Premium glazed vitrified floor tile, 600x600mm, box of 4",
  "description": "High-strength glazed vitrified floor tile suited to living rooms, lobbies and commercial floors. Low water absorption, scratch resistant, easy to clean.",
  "categoryId": 16,
  "brand": "NEBM",
  "images": [
    "https://placehold.co/600x400/1a1a2e/FFFFFF?text=Glazed+Vitrified+Floor+Tile",
    "https://placehold.co/600x400/16213e/FFFFFF?text=Floor+Tile+Detail"
  ],
  "price": 720,
  "comparePrice": 850,
  "stock": 320,
  "isActive": true,
  "rating": 4.4,
  "totalReviews": 37,
  "featured": true,
  "trending": false,
  "special": false,
  "priceType": "tiered",
  "unitType": "box",
  "minQty": 1,
  "priceTiers": [
    { "minQty": 1, "price": 720 },
    { "minQty": 10, "price": 690 },
    { "minQty": 50, "price": 650 }
  ],
  "showExactPrice": false,
  "showTieredPricing": true,
  "cardPriceMode": "from",
  "tags": ["tile", "vitrified", "floor", "600x600"],
  "variants": [],
  "relatedProductIds": [],
  "frequentlyBoughtTogetherIds": []
}
```

**Pricing model field reference (add to every product):**

| Field | Type | Meaning |
|---|---|---|
| `priceType` | `"exact"` \| `"tiered"` \| `"onEnquiry"` | Which pricing behaviour the product uses |
| `unitType` | string | `piece`, `box`, `sheet`, `bundle`, `bag`, `kg`, `meter`, `sq ft`, … |
| `minQty` | number | Minimum order/enquiry quantity |
| `priceTiers` | `[{minQty, price}]` | Bulk tiers (tiered only); ascending `minQty`. Empty `[]` otherwise |
| `showExactPrice` | boolean | Card/detail shows the fixed price (exact mode) |
| `showTieredPricing` | boolean | Detail renders the quantity-vs-price tier table (tiered mode) |
| `cardPriceMode` | `"exact"` \| `"from"` \| `"onEnquiry"` | How the card summarises price ("₹100", "From ₹650", "Price on Enquiry") |
| `special` | boolean | Badged Special Products collection membership |

- **exact** products: `priceType:"exact"`, `showExactPrice:true`, `showTieredPricing:false`, `cardPriceMode:"exact"`, `priceTiers:[]`, real `price`.
- **tiered** products: `priceType:"tiered"`, `showTieredPricing:true`, `cardPriceMode:"from"`, `priceTiers` populated (ascending), `price` = the tier-1 price for `getProductMinPrice` compatibility.
- **onEnquiry** products: `priceType:"onEnquiry"`, `showExactPrice:false`, `showTieredPricing:false`, `cardPriceMode:"onEnquiry"`, `priceTiers:[]`. Keep a numeric `price` (used internally by helpers) but the UI shows "Price on Enquiry".

**Dual-mode / API notes:**
- Mock branches key on your seeded fields: `getFeatured` filters `?featured=true`, `getTrending` filters `?trending=true`, `getByCategory` filters `?categoryId=`, `getBySlug` filters `?slug=`. So `featured`, `trending`, `categoryId`, and `slug` must be present and correctly typed (booleans as JSON booleans, `categoryId` numeric).
- Keep the shape flat and JSON-Server-friendly (arrays of plain objects). The same seed shape must map cleanly through `extractData()` on the Laravel side — do not nest sub-resources.

## 7. Admin panel requirements

N/A (data seed only). The admin Categories/Products screens read the same collections and will display the new tree; a later prompt extends the admin product form with the pricing-model fields.

## 8. Storefront requirements

N/A here (rendering is covered by prompts 07–11). This seed must simply make the storefront's category and product surfaces non-empty and correctly linked: `?category=<slug>` deep links resolve, parent categories include their children's products via `getCategoryScopeIds`, and featured/special products exist for the homepage bands.

## 9. Acceptance criteria

- [ ] `db.json.categories` contains exactly **12 top-level** NEBM nodes (`parentId: null`) in the specified order, plus the listed subcategories, each with a **unique** `slug`.
- [ ] Every subcategory's `parentId` references an existing top-level id; no orphan `parentId`.
- [ ] All 12 top-level categories have `showInMainMenu: true` and `menuOrder` 1..12; subcategories have `showInMainMenu: false`.
- [ ] `getMainMenuCategories(categories)` returns the 12 top-level categories in menu order (verify in the console or via the header once wired).
- [ ] `getCategoryScopeIds(5, categories)` (Tiles) returns Tiles + all 5 tile subcategory ids as strings.
- [ ] `db.json.products` has products under **every** leaf category and every flat top-level category; no product's `categoryId` equals the Special Products id or a missing id.
- [ ] Every product has the pricing fields (`priceType`, `unitType`, `minQty`, `priceTiers`, `showExactPrice`, `showTieredPricing`, `cardPriceMode`) and a `special` boolean; all three `priceType` values appear across the catalogue.
- [ ] ~8–10 products have `featured: true`; ~8–12 have `special: true`, spread across different top-level categories; all product `slug`s are unique.
- [ ] `db.json` is valid JSON (parses without error).

## 10. Testing / verification steps

1. **Validate JSON:** `node -e "JSON.parse(require('fs').readFileSync('db.json','utf8')); console.log('ok')"`.
2. **Run the app:** `npm run dev` (CRA :3000 + JSON Server :3001).
3. **JSON Server data checks:**
   - `http://localhost:3001/categories` — 12 top-level + subcategories present; slugs unique.
   - `http://localhost:3001/products?featured=true` — returns your featured set.
   - `http://localhost:3001/products?special=true` — returns the special set.
   - `http://localhost:3001/products?categoryId=16` — returns Floor Tiles products.
   - `http://localhost:3001/products?slug=glazed-vitrified-floor-tile-600x600` — returns exactly one product.
4. **Referential integrity script (quick):** load `db.json`, assert every `product.categoryId` exists in `categories` and is not the Special Products id; assert every non-null `category.parentId` exists.
5. **In-app:** open a category deep link like `/products?category=tiles` — the listing shows Tiles + all subcategory products (parent-includes-children). Open a subcategory link `/products?category=floor-tiles` — shows only Floor Tiles products. Both resolve via slug.

## 11. Notes on preserving existing functionality

Do **not** break:
- **`src/utils/categories.js` helpers** — keep `id, name, slug, parentId, isActive, sortOrder, showInMainMenu, menuOrder` shapes exactly; do not rename fields. Slug is the canonical URL token (`categoryParam`), numeric id is the legacy fallback (`resolveCategory`).
- **Parent-includes-children** (`getCategoryScopeIds`) — correct `parentId` links are load-bearing; a wrong parent hides products from the parent listing.
- **Slug uniqueness & product URLs** (`productPath`, `/products/:slug`) — duplicate slugs break deep links and detail resolution.
- **Dual-mode fidelity** — flat, JSON-serialisable shapes only; the same seed must flow through `extractData()` unchanged on Laravel. No mock-only nesting.
- **Mock query keys** — `featured`, `trending`, `categoryId`, `slug`, `q` are the params the mock API filters on; keep those fields present/typed.
- **Helper price reads** — keep `price` (and tier-1 price consistency for tiered), `comparePrice`, and `variants[]` present so `getProductMinPrice`/`buildCartItem` don't `NaN`.
- **Safe non-cascading DELETE** (`server.js`) — untouched; referential integrity stays enforced in the API layer, not by DB cascade.
- **Special Products is a badge, not a category owner** — never assign a product's `categoryId` to the Special Products node; use the `special` flag instead.
- **Other `db.json` collections** — leave `banners, users, admins, orders, reviews, wishlist, leads, settings, dealsConfig`, etc. untouched in this prompt.
