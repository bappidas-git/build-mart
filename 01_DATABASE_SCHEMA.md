# 01 — MySQL Database Schema

Complete schema for the **North East Build Mart (NEBM)** collections. For each: every column with
type, nullability, default, keys, indexes and enumerated values; foreign keys & relationships; the
recommended storage for nested JSON; and seed/migration guidance.

**Read alongside file 00 §10 (JSON-shape fidelity):** however you store a nested structure, the API
**response** must serialize it with the exact camelCase keys, nesting and types shown here. Use
Laravel **API Resources** to guarantee that. Conventions: PKs `BIGINT UNSIGNED AUTO_INCREMENT`
serialized as **numbers**; timestamps ISO-8601 `…Z`; product prices INR **integer rupees**; booleans as
JSON `true/false`.

> **NEBM has no money movement.** There are no orders/payments/refunds/returns/shipping/coupons/wallet
> tables to build. The ex-commerce collections still exist in `db.json` but are **seeded empty** and are
> **not part of the contract** — see §"Retired collections" at the end.

---

## ER overview (relationships)

```
users 1───* enquiries          users 1───* reviews         users 1───* wishlist
users 1───* cart (Enquiry List mirror)
categories 1───* products      categories 1───* categories (parentId self-ref)
products 1───* reviews         products (referenced by id in enquiries.items, wishlist, related/FBT arrays)
leads (standalone)             admins (auth only)          banners (standalone)
settings (singleton)
```

Foreign keys (logical; see each table for on-delete rules — **never cascade-delete**, see file 03 §5):

- `products.categoryId → categories.id`
- `categories.parentId → categories.id` (self, nullable)
- `enquiries.userId → users.id` (**nullable** — guests may submit enquiries)
- `reviews.productId → products.id`, `reviews.userId → users.id` (nullable for admin-authored)
- `cart.userId → users.id`, `wishlist.userId → users.id`

---

## 1. `banners`

Standalone homepage hero banners. **(seed: 3 rows)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | numeric |
| `title` | VARCHAR(255) | no | | |
| `subtitle` | VARCHAR(255) | yes | | |
| `cta` | VARCHAR(100) | yes | | button label, e.g. `"Shop Now"` |
| `link` | VARCHAR(255) | yes | | e.g. `"/products?category=tiles"` |
| `gradient` | VARCHAR(255) | yes | | CSS gradient string |

> `banners.getAll()` tolerates an empty list (falls back to UI defaults). No `createdAt/updatedAt`
> in seed; you may add them but they are unused. No admin CRUD screen calls banners today.

---

## 2. `users`  **(seed: 3 rows)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `email` | VARCHAR(255) UNIQUE | no | | **unique** — duplicate ⇒ 422 on register |
| `password` | VARCHAR(255) | no | | bcrypt/argon hash. **Never serialize** to API responses |
| `firstName` | VARCHAR(100) | no | | |
| `lastName` | VARCHAR(100) | no | | |
| `phone` | VARCHAR(20) | yes | `""` | may be empty string in seed |
| `avatar` | VARCHAR(255) | yes | null | |
| `addresses` | JSON | no | `[]` | array of address objects (below) |
| `isActive` | TINYINT(1) | no | 1 | admin can toggle (`PATCH /admin/users/{id}`) |
| `createdAt` | TIMESTAMP | no | now | ISO-8601 `…Z` |
| `updatedAt` | TIMESTAMP | no | now | |

> **Legacy field:** seed rows still carry `storeCredit` (INT) from the boilerplate wallet. NEBM has no
> wallet — ignore it; you need not build the column. **Never surface `password`** into a response.

**`addresses[]` object** (recommended storage: **JSON column** — order matters, full array is
replaced on save by `PUT /auth/user { addresses:[…] }`):

| Field | Type | Notes |
| --- | --- | --- |
| `id` | number/string | unique within the user's array (client uses `generateId()` for new ones) |
| `label` | string | `"Home"` \| `"Work"` \| `"Other"` |
| `firstName`, `lastName` | string | |
| `phone` | string | |
| `addressLine1` | string | |
| `addressLine2` | string | optional |
| `city`, `state` | string | |
| `postalCode` | string | (legacy alias `zip` tolerated on read) |
| `country` | string | always `"India"` today |
| `isDefault` | boolean | exactly one address is default |

> Response must include `addresses` but **never `password`**. `GET /auth/user` and login `data.user`
> return the safe user (all columns above except `password`).

---

## 3. `admins`  **(seed: 1 row)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `email` | VARCHAR(255) UNIQUE | no | | |
| `password` | VARCHAR(255) | no | | hashed; never serialized |
| `firstName` | VARCHAR(100) | no | | used for `statusHistory.by` actor name |
| `lastName` | VARCHAR(100) | yes | | |
| `role` | VARCHAR(30) | no | `"super_admin"` | seed: `super_admin`. Suggested set: `super_admin`, `admin`, `manager` |
| `isActive` | TINYINT(1) | no | 1 | |
| `createdAt` | TIMESTAMP | no | now | |

> Separate table/guard from `users`. Admin auth uses an **admin-scoped Sanctum token** (file 04).
> Login `data.admin` returns this row minus `password`. Seed admin: `admin@store.com` / `admin123`.

---

## 4. `categories`  **(seed: 43 rows — self-referencing NEBM tree)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `name` | VARCHAR(150) | no | | |
| `slug` | VARCHAR(160) UNIQUE | no | | used by `/categories/slug/{slug}` |
| `description` | VARCHAR(500) | yes | | |
| `image` | VARCHAR(255) | yes | | |
| `parentId` | BIGINT UNSIGNED FK→categories.id | yes | null | top-level when null |
| `isActive` | TINYINT(1) | no | 1 | storefront `getAll()` hides `isActive===false` |
| `sortOrder` | INT | no | 0 | storefront sorts ascending by this |
| `showInMainMenu` | TINYINT(1) | no | 0 | drives the top-nav menu (`getMainMenuCategories`) |
| `menuOrder` | INT | no | 0 | order within the main menu |
| `createdAt` | TIMESTAMP | no | now | |
| `updatedAt` | TIMESTAMP | no | now | |

Indexes: `slug` (unique), `parentId`, `isActive`, (`showInMainMenu`,`menuOrder`).

**The NEBM tree** (top-level → sub-categories): **WPC Louvers · Polycarbonate Sheets · FRP Sheets ·
Waterproofing Products** (no subs) · **Tiles** (Floor · Wall · Vitrified · Bathroom & Kitchen ·
Outdoor) · **Doors** (Steel · PVC · WPC · Designer · Bathroom) · **Hardware** (Door Locks · Handles &
Hinges · Fasteners · Cabinet Fittings · Construction Hardware) · **Plumbing** (PVC · CPVC · SWR Pipes ·
Water Tanks · Fittings & Accessories) · **Bath Fittings** (Showers · Faucets & Taps · Wash Basins ·
Sanitary Ware · Bathroom Accessories) · **Cement** (OPC · PPC · Premium) · **Steel Rods** (TMT Bars ·
Construction Steel · High-Strength Reinforcement). *"Special Products" is **not** a category — it is a
badged collection driven by the `products.special` flag (§5).*

> **Referential integrity (file 03 §5):** deleting a category that still has child categories
> (`parentId`) **or** products (`categoryId`) must be **blocked** (no cascade). The public
> `GET /categories` may return everything (the client filters `isActive`, sorts, and applies
> parent-includes-children scoping via `getCategoryScopeIds`); `GET /admin/categories` must include
> inactive rows.

---

## 5. `products`  **(seed: 70 rows)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | numeric |
| `name` | VARCHAR(255) | no | | |
| `slug` | VARCHAR(255) UNIQUE | no | | `/products/slug/{slug}` |
| `sku` | VARCHAR(100) | yes | | top-level SKU (e.g. `"NEBM-1-001"`) |
| `shortDescription` | VARCHAR(500) | yes | | |
| `description` | TEXT | yes | | |
| `categoryId` | BIGINT UNSIGNED FK→categories.id | yes | null | |
| `brand` | VARCHAR(150) | yes | | e.g. `"Greenpanel"`, `"CenturyPly"` |
| `images` | JSON | no | `[]` | array of URL strings |
| `price` | INT | no | 0 | INR; reference/display price |
| `comparePrice` | INT | yes | | strike-through original |
| `costPrice` | INT | yes | | admin-only cost |
| `stock` | INT | no | 0 | top-level stock |
| `lowStockThreshold` | INT | yes | 10 | dashboard "low stock" uses `stock ≤ (this ?? 10)` |
| `weight` | DECIMAL(8,3) | yes | | kg — **non-integer allowed here** |
| `dimensions` | JSON | yes | `{}` | `{ length, width, height }` numbers (cm); may be `{}` |
| `variants` | JSON | no | `[]` | array of variant objects (below); often empty for building materials |
| `tags` | JSON | no | `[]` | array of strings |
| `featured` | TINYINT(1) | no | 0 | `/products/featured` |
| `trending` | TINYINT(1) | no | 0 | `/products/trending` |
| `hot` | TINYINT(1) | no | 0 | |
| `isActive` | TINYINT(1) | no | 1 | inactive hidden in related/FBT/storefront |
| `rating` | DECIMAL(2,1) | yes | | aggregate display rating (e.g. `4.2`) |
| `totalReviews` | INT | yes | 0 | aggregate display count |
| `metaTitle` | VARCHAR(255) | yes | | |
| `metaDescription` | VARCHAR(500) | yes | | |
| `frequentlyBoughtTogetherIds` | JSON | yes | `[]` | array of product ids (numbers) |
| `relatedProductIds` | JSON | yes | `[]` | array of product ids (numbers), curated order |
| **`priceType`** | ENUM | no | `"onEnquiry"` | `"exact"` \| `"tiered"` \| `"onEnquiry"` — drives price display |
| **`unitType`** | VARCHAR(30) | yes | null | selling unit, e.g. `"piece"`, `"sq ft"`, `"bag"`, `"kg"` |
| **`minQty`** | INT | yes | 1 | minimum enquiry quantity |
| **`priceTiers`** | JSON | no | `[]` | quantity-break table (below); non-empty for `tiered` |
| **`showExactPrice`** | TINYINT(1) | no | 0 | show the fixed `price` on the PDP |
| **`showTieredPricing`** | TINYINT(1) | no | 0 | show the tier table on the PDP |
| **`cardPriceMode`** | VARCHAR(20) | no | `"hidden"` | product-card price mode: `"exact"` \| `"from"` \| `"hidden"` |
| **`special`** | TINYINT(1) | no | 0 | member of the **Special Products** collection (§Special Products) |
| `createdAt` | TIMESTAMP | no | now | |
| `updatedAt` | TIMESTAMP | no | now | |

Seed pricing mix (70 products): **28 `exact` · 32 `tiered` · 10 `onEnquiry`**; **10** flagged `special`.

**`priceTiers[]` object** (JSON; each row is a quantity break, ascending by `minQty`):

| Field | Type | Notes |
| --- | --- | --- |
| `minQty` | number | quantity at which this price applies |
| `price` | number (INR) | unit price at/above that quantity |

Example: `[{ "minQty": 1, "price": 340 }, { "minQty": 5, "price": 320 }, { "minQty": 20, "price": 299 }]`
renders as *"from ₹299"* on the card (`cardPriceMode:"from"`) and a full break table on the PDP.

**`variants[]` object** (recommended: **JSON column**; if normalized, serialize back to this exact
shape). Optional for NEBM — most building materials have `variants: []`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | **string** | e.g. `"v1"` — **must stay a string**; matched with `===` for Enquiry List/enquiry items |
| `name` | string | e.g. `"6mm / Clear"` |
| `price` | number (INR) | variant price |
| `stock` | number | variant stock |
| `sku` | string | variant SKU |
| `attributes` | object | optional, e.g. `{ "Thickness": "6mm" }` |
| `swatchHex` | string | optional color swatch |

> `rating`/`totalReviews`/`metaTitle` may be absent on admin-created rows — tolerate nulls.
> `frequentlyBoughtTogetherIds`/`relatedProductIds` reference live product ids; the storefront resolves
> them against the real catalogue (inactive/self filtered out client-side).

### Special Products (the `special` flag)
There is **no** separate "special" table or category. `products.getSpecial()` returns products with
`special === true` (mock: `GET /products?special=true`; Laravel: `GET /products/special?limit=`).
These items **also** appear normally in their category listings — the flag is purely additive, used to
populate the home-page band and the `/special-offers` collection page.

---

## 6. `cart`  **(seed: 0 rows — empty)** — the **Enquiry List** mirror

Server-side persistence of a logged-in user's **Enquiry List** (the renamed cart). The client treats
local state as the source of truth and **mirrors it to the server as a full replace** (delete existing
rows for the user, re-POST each line). There are **no totals** — quantities only.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | row id; client `DELETE /cart/{id}` uses it |
| `userId` | BIGINT UNSIGNED FK→users.id | no | owner |
| `productId` | BIGINT UNSIGNED | no | |
| `variantId` | VARCHAR(20) | yes | null when no variant |
| `variantName` | VARCHAR(255) | yes | |
| `name` | VARCHAR(255) | no | |
| `image` | VARCHAR(255) | yes | |
| `price` | INT | yes | reference price snapshot (may be null for on-enquiry) |
| `comparePrice` | INT | yes | |
| `priceType` | VARCHAR(20) | yes | `exact`/`tiered`/`onEnquiry` snapshot |
| `unitType` | VARCHAR(30) | yes | |
| `currency` | VARCHAR(3) | yes | `"INR"` |
| `quantity` | INT | no | ≥ 1 |
| `stock` | INT | yes | carried only when known |
| `createdAt`/`updatedAt` | TIMESTAMP | yes | |

**Endpoints used:** `GET /cart`, `POST /cart` (add a line — body is the row above minus id),
`PATCH /cart/{id}`, `DELETE /cart/{id}`, `DELETE /cart` (clear all for user). See file 02
(Enquiry List). Scope every row to the authenticated user (derive `userId` from the token).

---

## 7. `enquiries`  **(seed: 11 rows)** — the central table

Repurposed from the boilerplate `orders` table. A **pure lead**: contact + items + note + a workflow
`status`. **No money, payment, shipping, coupon or address fields.**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `enquiryNumber` | VARCHAR(40) UNIQUE | no | server-gen | `ENQ-YYYYMMDD-NNNN` — **server owns** (file 00 §7) |
| `userId` | BIGINT UNSIGNED FK→users.id | **yes** | null | **nullable** — guests may submit |
| `items` | JSON | no | `[]` | array of enquiry line items (below) |
| `contact` | JSON | no | | `{ name, phone, email }` (below) |
| `notes` | VARCHAR(1000) | yes | `""` | the customer's note/message |
| `adminNotes` | VARCHAR(2000) | yes | `""` | internal admin notes (not shown to the customer) |
| `status` | ENUM | no | `New` | enum below |
| `statusHistory` | JSON | no | `[]` | append-only audit timeline (below) |
| `createdAt` | TIMESTAMP | no | now | |
| `updatedAt` | TIMESTAMP | no | now | |

**Computed-on-read (admin only, NOT stored):** `GET /admin/enquiries` includes `customerName` and
`customerEmail` per row — from `contact.name`/`contact.email`, falling back to the joined user account.

**`status` enum** (the workflow pipeline — file 03 §3):

```
status : New | Contacted | In Discussion | Quotation Sent | Converted | Closed | Lost
```

**`items[]` object** (JSON) — a lightweight snapshot captured at submit time; **no line totals**:

| Field | Type | Notes |
| --- | --- | --- |
| `productId` | number | |
| `variantId` | string \| null | `"v1"` etc. |
| `name` | string | includes any variant suffix, e.g. `"… - 6mm / Clear"` |
| `image` | string | |
| `sku` | string | may be `""` |
| `quantity` | number | |
| `priceType` | string | `"exact"` \| `"tiered"` \| `"onEnquiry"` (snapshot of the product's mode) |
| `unitType` | string \| null | e.g. `"piece"` |
| `price` | number \| null | **only an `exact` item carries a number**; `tiered`/`onEnquiry` ⇒ `null` |

> Legacy seed rows (pre-pivot) may carry the older item shape `{ productId, variantId, name, image,
> sku, price, quantity }` with `price` populated and no `priceType`/`unitType` — tolerate both.

**`contact` object** (JSON): `{ name: string, phone: string, email: string|null }`. `phone` is required
at submit; `email` is optional.

**`statusHistory[]` object** (JSON; append-only): `{ at: ISO, by: string, action: string, note?: string }`.
`by` is the actor — the submitting contact's name (or `"Customer"`) on creation, or the admin's name
on a status change. **Server derives `by` from the bearer token** for admin actions (file 00 §14).
The first entry is always `{ …, action: "Enquiry submitted" }`, seeded at create.

Indexes: `enquiryNumber` (unique), `userId`, `status`, `createdAt`.

---

## 8. `reviews`  **(seed: 8 rows)**

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `productId` | BIGINT UNSIGNED FK→products.id | no | | |
| `userId` | BIGINT UNSIGNED FK→users.id | yes | null | **null for admin-authored** reviews |
| `userName` | VARCHAR(150) | no | | display name e.g. `"John D."` |
| `rating` | TINYINT | no | | 1–5 |
| `title` | VARCHAR(150) | yes | `""` | |
| `body` | TEXT | yes | `""` | |
| `status` | ENUM | no | `pending` | `pending` \| `approved` \| `rejected` |
| `isVerifiedPurchase` | TINYINT(1) | no | 0 | |
| `helpfulCount` | INT | no | 0 | |
| `source` | VARCHAR(20) | yes | null | `"admin"` for admin-authored; else absent/null |
| `photos` | JSON | yes | null | optional array of image URLs |
| `createdAt` | TIMESTAMP | no | now | |
| `updatedAt` | TIMESTAMP | no | now | |

Indexes: `productId`, `userId`, `status`, **unique (`userId`,`productId`)** for non-null userId
(one review per user per product — re-submit updates the row; file 03 §4).

> Storefront `GET /products/{id}/reviews` returns **approved only**. `GET /reviews/mine` returns the
> signed-in user's reviews in **all** statuses. Product `rating`/`totalReviews` are display aggregates
> you may recompute from approved reviews (file 03 §4).

---

## 9. `wishlist`  **(seed: 3 rows)**

Server wishlist for a logged-in user. The client stores a **flat product snapshot** per row and, on
the Laravel branch, expects the product nested under `product` on read (it normalises both shapes).

**Recommended:** store rows as `{ id, userId, productId, createdAt }` and **return the product nested**
as `product` (the client reads `item.product.*`). The flat fields below are what the mock stores/POSTs;
supporting either is fine as long as `productId` and a product snapshot are present.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | row id; `DELETE /wishlist/{id}` uses it |
| `userId` | BIGINT UNSIGNED FK→users.id | |
| `productId` | BIGINT UNSIGNED | |
| `createdAt` | TIMESTAMP | client also reads `addedAt` (alias) |

**POST `/wishlist` body the client sends** (flat snapshot — store what you need, at minimum `productId`
+ `userId`): `productId, slug, name, image, brand, price, comparePrice, rating, totalReviews,
shortDescription, variants, stock, trending, hot, addedAt, userId`.

**On read**, the Laravel branch maps `item.product.{id,slug,name,images[0],brand,price,comparePrice,
rating,totalReviews,shortDescription,variants,stock,trending,hot}` → flat. So returning each row as
`{ id, productId, createdAt, product: { …product fields… } }` is the clean approach.

---

## 10. `leads`  **(seed: 4 rows)** — contact + newsletter, one table

The CRM surface: storefront contact-form submissions and newsletter sign-ups.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `type` | ENUM | no | | `contact` \| `newsletter` |
| `name` | VARCHAR(150) | yes | null | null for newsletter rows |
| `email` | VARCHAR(255) | no | | |
| `phone` | VARCHAR(20) | yes | null | |
| `orderNumber` | VARCHAR(40) | yes | null | free-text reference the contact form may attach (legacy name) |
| `category` | VARCHAR(30) | yes | null | contact category; null for newsletter |
| `subject` | VARCHAR(255) | yes | null | |
| `message` | TEXT | yes | null | |
| `status` | VARCHAR(20) | no | | contact: `new`,`contacted`,`resolved`,`spam`; newsletter: `subscribed`,`unsubscribed` |
| `notes` | VARCHAR(500) | yes | `""` | admin notes |
| `createdAt` | TIMESTAMP | no | now | |
| `updatedAt` | TIMESTAMP | no | now | |

> `POST /leads/contact` body: `{ name, email, phone?, orderNumber?, category?, subject?, message }` →
> server sets `type:"contact"`, `status:"new"`, `notes:""`. `POST /leads/newsletter` body: `{ email }`
> → server sets `type:"newsletter"`, `status:"subscribed"`, and the other contact fields to null.
> *(Seed contact rows carry legacy categories/order references from the boilerplate — tolerate any
> free-text `category`/`orderNumber`.)*

---

## 11. `settings` — **singleton** (one object, four sections)

Not a list. Store as a **single row** (or a JSON document) and serialize as one nested object.
`GET /settings` (public) and `GET /admin/settings` return the whole object; `PATCH /admin/settings/{section}`
merges fields into **one** section and returns the whole object.

```jsonc
{
  "store": {
    "name": "North East Build Mart",
    "tagline": "Deals in all kinds of building materials for interior and exterior use.",
    "email": "info@northeastbuildmart.com",
    "phone": "+91 86385 43526",
    "phoneSecondary": "+91 88762 89972",
    "address": "Lawkhuwa Road, Nagaon, Assam – 782002",
    "currency": "INR", "currencySymbol": "₹",
    "timezone": "Asia/Kolkata",
    "logo": "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png",
    "favicon": "https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png"
  },
  "notifications": {
    "adminNewOrderEmail": true, "adminEmail": "info@northeastbuildmart.com",
    "lowStockAlert": true, "lowStockEmail": "info@northeastbuildmart.com"
  },
  "seo": {
    "metaTitle": "North East Build Mart — Building Materials in Nagaon, Assam",
    "metaDescription": "…", "googleAnalyticsId": "", "facebookPixelId": ""
  },
  "social": { "facebook": "", "instagram": "", "twitter": "", "youtube": "", "whatsapp": "" }
}
```

**Storage recommendation:** a single `settings` row with one `JSON` column per section (or one JSON
document). `PATCH /admin/settings/{section}` does a **shallow merge** of the posted fields into that
section and returns the **whole** settings object. Section names: **`store`, `notifications`, `seo`,
`social`** — there is **no** `shipping` or `payment` section (removed), and **no** `taxRate` (no money
math).

---

## Retired collections (present in `db.json`, seeded empty — do NOT build)

These ex-commerce collections remain as top-level keys in `db.json` only so the dormant helper code
doesn't throw; every one is an **empty array** and **no live NEBM feature reads or writes them**. There
is **no schema to build** for any of them, and `dealsConfig` is trimmed to a dead master toggle:

| Key | Seed | Status |
| --- | --- | --- |
| `payments` | `[]` | removed (no payment) |
| `refunds` | `[]` | removed |
| `returns` | `[]` | removed |
| `shipping_methods` | `[]` | removed (no shipping) |
| `coupons` | `[]` | removed |
| `walletTransactions` | `[]` | removed (no wallet/store credit) |
| `dealsConfig` | `{ "enabled": false }` | removed (Special Offers admin retired; superseded by the `products.special` flag) |

If you build the Laravel API, simply **omit** these tables and endpoints. Their dormant `apiService`
namespaces (`wallet`, `returns`, `coupons`, `shipping`, `deals`) need no implementation.

---

## Seed / migration guidance

To reproduce the working dataset the frontend is verified against:

1. **Migrations** for the NEBM tables (banners, users, admins, categories, products, cart, enquiries,
   reviews, wishlist, leads) + the `settings` singleton. Use `JSON` columns for the nested structures
   (simplest path to shape fidelity), or normalized child tables with API Resources that re-serialize
   to the exact shapes.
2. **Seeders** importing `db.json` verbatim (it is the canonical fixture):
   - Preserve **ids exactly** (so `categoryId`, `parentId`, `relatedProductIds`,
     `frequentlyBoughtTogetherIds`, and `enquiries.items[].productId` all resolve). Seed with explicit
     ids; reset `AUTO_INCREMENT` past the max id afterward.
   - Hash the seed plaintext passwords (`users`: `password123` / `Bappi@12345`; `admins`: `admin123`)
     — but the seed logins must still work, so hash those exact strings.
   - Keep all timestamps as the seed's ISO strings; keep `enquiryNumber` values (`ENQ-YYYYMMDD-NNNN`).
   - Seed the `settings` singleton as one record.
   - INR **integer** prices where a fixed price exists; `tiered` products carry a `priceTiers[]`;
     `onEnquiry` products show no price.
3. **Counts to match:** banners 3, users 3, admins 1, categories 43, products 70, cart 0, enquiries 11,
   reviews 8, wishlist 3, leads 4. (Retired-empty: payments/refunds/returns/shipping_methods/coupons/
   walletTransactions 0.)
4. Verify the **dashboard stats** endpoint reproduces sane numbers from the seed (file 02 §K / file 03 §6).
