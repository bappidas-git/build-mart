# North East Build Mart (NEBM)

**Deals in all kinds of building materials for interior and exterior use.**

North East Build Mart is an **enquiry-based building-materials catalogue** for a
brick-and-mortar store in Nagaon, Assam. Customers browse products (WPC louvers,
polycarbonate & FRP sheets, tiles, doors, hardware, plumbing, bath fittings,
cement, steel rods and more), add the items they're interested in to an
**Enquiry List**, and **Submit an Enquiry** with a note and their contact
details. The team then follows up with pricing and availability.

> **There is no cart total, no checkout, no payment, no shipping, no coupons and
> no returns.** NEBM is a *lead-generation storefront*, not a purchase store. It
> was built by refactoring a React + JSON Server e-commerce boilerplate — the
> commerce machinery (orders → **enquiries**, cart → **Enquiry List**, checkout →
> **Submit Enquiry**) was repurposed, and payment / shipping / coupon / returns /
> wallet were removed.

- **Store:** North East Build Mart · Lawkhuwa Road, Nagaon, Assam – 782002
- **Phone:** +91 86385 43526 · +91 88762 89972
- **Email:** info@northeastbuildmart.com
- **Currency:** ₹ / INR (display only — nothing is charged)
- **Brand:** Blue `#1885d8` · Gold `#fa9c4c`, Apple-minimal

---

## Tech stack

Create React App (react-scripts 5) single-page app that serves **both** the
customer storefront and the admin panel, backed in development by **JSON Server**
(`db.json` via a custom `server.js`) and in production by a **Laravel REST API**
(`…/api/v1`). One React codebase drives both backends through a **dual-mode API
layer** (`src/services/api.js`).

React 18 · react-router-dom 6 · MUI 5 + Emotion (admin) · CSS Modules + `--sf-*`
design tokens (storefront) · framer-motion 10 · axios 1.6 · sweetalert2 ·
`@iconify/react` · json-server 0.17 (dev) · concurrently (dev).

---

## Storefront features

- **Home** — hero, featured products, **Special Products** band, category cards.
- **Category browsing** — the slide-in `SidebarMenu` drawer plus a top menu, both
  driven from the admin-curated category tree (`showInMainMenu` / `menuOrder`).
- **Product listing** (`/products`) — search, category filter (parent includes
  all children), price/sort filters, all applied **client-side**. Category
  deep-links use `?category=<slug>`.
- **Product details** (`/products/:slug`) — gallery, variants, reviews, related &
  frequently-bought-together, and pricing shown in one of three modes:
  - **Exact** — a fixed ₹ price per unit.
  - **Tiered** — a quantity-break table (`priceTiers`), e.g. *from ₹299 at qty 20*.
  - **Price on Enquiry** — no price shown; quoted by the team.
- **Special Products** — a curated, badged collection (products flagged
  `special: true`) surfaced on the home page and the `/special-offers` page. These
  items also appear normally in their categories.
- **Wishlist**, **account/profile**, and **My Enquiries** (a customer's submitted
  enquiries and their status).
- **Enquiry List** (`/enquiry-list`) — the multi-product, multi-quantity list a
  customer builds (this is the old "cart", with no totals or money).
- **Submit Enquiry / Enquiry Summary** (`/checkout`) — review the list, add a note
  and contact details (name, phone, optional email), and send.
- **Enquiry success** (`/enquiry-confirmation/:enquiryNumber`) — confirmation with
  the `ENQ-…` reference.

## Admin features

Kept modules (`/admin/*`): **Dashboard · Products · Categories · Reviews ·
Enquiries · Users · Leads · Settings**.

- **Dashboard** — enquiry-centric KPIs (total / new / open / converted enquiries,
  total leads, users, products, low-stock products) and a Recent Enquiries table.
- **Products** — CRUD, including the pricing model (`priceType`, `unitType`,
  `minQty`, `priceTiers`, display flags and the `special` flag).
- **Categories** — CRUD over the self-referencing NEBM tree; delete is **blocked**
  while a category still has child categories or products.
- **Reviews** — moderation (approve / reject / delete) plus admin-authored reviews.
- **Enquiries** — the lightweight CRM: list/search/filter, a detail view
  (products, quantities, customer, note), **admin notes**, and the **status
  workflow** below.
- **Users** — view accounts and toggle `isActive`.
- **Leads** — contact-form and newsletter submissions.
- **Settings** — store info / SEO / social / notifications (singleton).

**Removed modules** (deleted from routes, nav and pages): **Returns · Payments ·
Coupons · Special Offers · Shipping.** There is no money movement anywhere in the
app, so nothing prices, charges, refunds, ships or discounts.

---

## The two core flows

### Customer — build & submit an enquiry
1. Browse / search / filter → open a product → **Add to Enquiry List** (with a
   quantity). Prices show as exact, tiered, or *Price on Enquiry*.
2. Open the **Enquiry List**, adjust quantities or remove items.
3. **Submit Enquiry**: add a note + contact details (name, phone, optional email).
4. See the **success screen** with the `ENQ-…` reference. Logged-in customers can
   revisit it under **My Enquiries**.

The submitted payload is **pure** — contact + items + note + a `status:"New"` — and
carries **no** subtotal, discount, coupon, shipping, tax, total, store-credit or
payment fields. Submitting an enquiry fires **no** payment/coupon/wallet side
effects.

### Admin — manage the enquiry
Each enquiry moves through a fixed status pipeline; every change appends a
`statusHistory` entry (actor + timestamp), and admins can add free-text
**admin notes**:

**New → Contacted → In Discussion → Quotation Sent → Converted → Closed / Lost**

Contact submissions and enquiry-derived leads surface under **Leads** for CRM
follow-up.

---

## Getting started

**Prerequisites:** Node.js 16+ and npm.

```bash
npm install
```

### Run everything (recommended)
```bash
npm run dev
```
Runs, concurrently:
- **CRA storefront + admin** on <http://localhost:3000>
- **JSON Server** (mock API) on <http://localhost:3001>

### Individual scripts
| Script | What it does |
| --- | --- |
| `npm start` | CRA dev server only, <http://localhost:3000> |
| `npm run server` | `node server.js` → JSON Server on <http://localhost:3001> |
| `npm run dev` | both of the above via `concurrently` |
| `npm run build` | production build into `build/` |

### The mock API (JSON Server)
- `server.js` wraps JSON Server over `db.json`. All standard behaviour
  (GET/POST/PUT/PATCH, filtering, sorting) is preserved, **except DELETE**, which
  is overridden to be **safe and non-cascading**: it removes only the addressed
  row and never cascade-deletes dependents (category referential integrity is
  enforced in the API layer, not by the database).
- Browse the mock data directly at `http://localhost:3001/<collection>`, e.g.
  `http://localhost:3001/products`, `/categories`, `/enquiries`.

### Seed logins
- **Customer:** `user@example.com` / `password123`
- **Admin:** `admin@store.com` / `admin123` → `/admin`

---

## Managing content in the admin

- **Products:** `/admin/products` → add/edit. Set `priceType` to `exact`,
  `tiered`, or `onEnquiry`; for tiered, add `priceTiers` (`minQty` → `price`);
  set `unitType` (e.g. *piece*, *sq ft*, *bag*), `minQty`, the display flags
  (`showExactPrice`, `showTieredPricing`, `cardPriceMode`), and toggle `special`
  to add it to the Special Products collection.
- **Categories:** `/admin/categories` → manage the tree (parent/child via
  `parentId`), `showInMainMenu` + `menuOrder` to control the top menu, and
  `sortOrder`. A category with children or products **cannot be deleted** until
  they're reassigned/removed.
- **Enquiries:** `/admin/enquiries` → open an enquiry, read the items/contact/note,
  add admin notes, and advance the status. Each status change is timestamped in
  the enquiry's history.

## Dual-mode switch (going to Laravel)

The frontend talks to a backend **only** through `src/services/api.js`. To point
it at the production Laravel API, change **two** environment variables and
restart — nothing else:

```dotenv
# .env
REACT_APP_API_URL=https://your-laravel-api.com/api/v1
REACT_APP_USE_MOCK_API=false
```

`src/services/baseURL.js` exports `BASE_URL` and `IS_MOCK_API`; every `api.js`
method branches on `IS_MOCK_API` (JSON Server vs Laravel) and every response flows
through `extractData()`, which unwraps the Laravel envelope `{ success, data,
meta? }`. The complete backend contract lives in the docs below.

---

## What changed from the boilerplate

| Boilerplate (e-commerce) | NEBM (enquiry) |
| --- | --- |
| Cart | **Enquiry List** (multi-product + quantities, **no totals**) |
| Add to Cart | **Add to Enquiry List** |
| Buy Now | **Removed** (no purchase path) |
| Checkout | **Submit Enquiry / Enquiry Summary** (note + contact, no payment) |
| Order / `orders` | **Enquiry / `enquiries`** (`ENQ-…`, workflow status, admin notes) |
| Order confirmation | **Enquiry success** screen |
| Order History | **My Enquiries** |
| Admin Orders | **Admin Enquiries** (CRM with status pipeline) |
| Payments, Refunds, Returns, Shipping, Coupons, Special Offers, Wallet | **Removed** |
| — | **Pricing model** added: exact / tiered / on-enquiry, `unitType`, `minQty` |
| — | **Special Products** added (badged collection via the `special` flag) |
| Generic storefront brand | **NEBM** brand: Blue `#1885d8` + Gold `#fa9c4c`, NEBM logo |

Retained-but-dormant scaffolding: a few ex-commerce helpers and API namespaces
(`wallet`, `returns`, `coupons`, `shipping`, `deals`, and the ex-order admin
methods) remain in `src/services/api.js` so imports never break, but they are
**not part of the NEBM contract** — their collections (`payments`, `refunds`,
`returns`, `shipping_methods`, `coupons`, `walletTransactions`) are seeded empty,
and the enquiry path never invokes them.

---

## Backend contract & documentation

These documents are the authoritative contract for the Laravel backend and for
onboarding developers:

| File | What's in it |
| --- | --- |
| [`00_BACKEND_README_AND_CONVENTIONS.md`](00_BACKEND_README_AND_CONVENTIONS.md) | The one hard guarantee, the response envelope, JSON-shape fidelity, IDs/dates, the safe-delete rule, server-authoritative fields. |
| [`01_DATABASE_SCHEMA.md`](01_DATABASE_SCHEMA.md) | MySQL schema for every collection (incl. `enquiries` + the product pricing fields), the ER overview, and seed guidance. |
| [`02_API_ENDPOINTS.md`](02_API_ENDPOINTS.md) | Every endpoint the frontend calls, grouped by domain, with bodies and success JSON. |
| [`03_BUSINESS_LOGIC_AND_CASCADES.md`](03_BUSINESS_LOGIC_AND_CASCADES.md) | The enquiry creation flow, status transitions, category referential integrity, singletons — and the explicit "no money cascades" rule. |
| [`04_AUTH_ERRORS_AND_EDGE_CASES.md`](04_AUTH_ERRORS_AND_EDGE_CASES.md) | Sanctum auth (two sessions), the error envelope, validation rules, enquiry edge cases, and the per-module parity checklist. |
| [`STOREFRONT_UX_GUIDELINES.md`](STOREFRONT_UX_GUIDELINES.md) | The enquiry-model UX architecture, the blue/gold brand system, and the authenticity-over-persuasion ethics rule. |

---

<sub>Designed and Developed by <a href="https://assamdigital.com" target="_blank" rel="noopener noreferrer">Assam Digital</a>.</sub>
