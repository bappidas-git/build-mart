# 02 — API Endpoints

Every endpoint the **North East Build Mart** frontend calls, derived from the **Laravel (non-mock)
branch** of `src/services/api.js` and the admin pages. All paths are **relative to `REACT_APP_API_URL`**
(production `https://…/api/v1`). All success responses use the envelope `{ success, data, meta? }`
(file 00 §4); request/response fields are **camelCase** unless explicitly noted.

**Auth column:** `Public` (no token) · `Customer` (customer Bearer token) · `Admin` (admin-scoped
Bearer token, sent automatically because the URL contains `/admin/`). See file 04 for token mechanics.

> **NEBM is an enquiry platform — there is no cart total, checkout, payment, shipping, coupon, returns
> or wallet.** The dormant `apiService` namespaces (`wallet`, `returns`, `coupons`, `shipping`, `deals`)
> and the ex-`orders` admin methods are **not** documented here — they are retired scaffolding hitting
> now-empty collections (file 00 §13, file 01 "Retired collections"). The ✦ marker flags fields the
> server must **ignore or set itself** rather than trust from the client (file 00 §14).

---

## A. Auth (customer)

### `POST /auth/login` — Public
Body: `{ "email": string, "password": string, "remember": boolean }`
Response `data`: `{ "token": "<opaque>", "user": { …safe user, no password… } }`
Status: **200** ok · **401**/**422** invalid credentials (see file 04).
The client stores `data.token` (local vs session per `remember`) and `data.user`.

```jsonc
// 200
{ "success": true, "data": {
  "token": "12|abcdef…",
  "user": { "id": 3, "email": "mail4bappidas@gmail.com", "firstName": "Bappi",
            "lastName": "Das", "phone": "", "avatar": null, "addresses": [ … ],
            "isActive": true,
            "createdAt": "2025-06-01T10:00:00.000Z", "updatedAt": "2026-06-14T14:22:33.376Z" } } }
```

### `POST /auth/register` — Public
Body: `{ "firstName", "lastName", "email", "phone"?, "password", "password_confirmation" }`
*(note snake_case `password_confirmation`)*. Response `data`: the new safe user.
Status: **201/200** · **422** duplicate email (`{ "message": "An account with this email already
exists. Please log in instead." }`) or validation. The frontend then asks the user to log in.

### `POST /auth/logout` — Customer
No body. Must **revoke the current token** server-side. Response: `{ "success": true, "data": … }`
(any). The client clears local session regardless.

### `GET /auth/user` — Customer
Response `data`: the safe user object (as in login).

### `PUT /auth/user` — Customer
Body: partial user updates. Two shapes are sent:
- profile: `{ "firstName", "lastName", "phone" }`
- addresses: `{ "addresses": [ { id, label, firstName, lastName, phone, addressLine1, addressLine2,
  city, state, postalCode, country, isDefault }, … ] }` (**full array replace**).
Response `data`: updated safe user. (Client merges its own `updates`, never the response, into state.)

### `PUT /auth/password` — Customer
Body (snake_case): `{ "current_password", "password", "password_confirmation" }`.
Response `data`: `{ "success": true }` (or any 2xx). Status **422** if `current_password` wrong / weak
password (file 04).

---

## B. Products (public)

### `GET /products` — Public
Used for the full catalogue **and** search. Query the client sends:
- `?search=<query>` (from `products.search`)
- *(listing page sends no params today — it fetches all and filters client-side; file 00 §11)*

Response `data`: **array** of product objects (full shape, file 01 §5 — including the pricing fields
`priceType`, `unitType`, `minQty`, `priceTiers`, display flags, `special`). Return the **full active
set** (the storefront filters `isActive` client-side; admin uses `/admin/products`).

### `GET /products/{id}` — Public
Response `data`: one product. Used as a legacy/numeric fallback by the product page.

### `GET /products/slug/{slug}` — Public
Response `data`: one product (canonical PDP lookup). **404** if no such slug.

### `GET /products/featured?limit=<n>` — Public
Response `data`: array of featured products (≤ `limit`, default 10).

### `GET /products/special?limit=<n>` — Public
Response `data`: array of **Special Products** — products with `special === true` (≤ `limit`, default
12). Drives the home-page Special Products band and the `/special-offers` collection page. These items
also appear in their normal category listings (the flag is additive).

### `GET /products/trending?limit=<n>` — Public
Response `data`: array of trending products (≤ `limit`, default 10).

### `GET /products/category/{categoryId}` — Public
Response `data`: array of products in that category.

### `GET /products/{productId}/reviews` — Public
Response `data`: array of **approved** reviews for the product (file 01 §8).

> **No dedicated endpoint** for "related" / "frequently bought together": `products.getRelated` and
> `getFrequentlyBoughtTogether` call `products.getAll()` and resolve ids client-side. Just ensure
> `/products` returns `relatedProductIds`/`frequentlyBoughtTogetherIds` and the full catalogue.

---

## C. Categories (public)

| Method | Path | Auth | Response `data` |
| --- | --- | --- | --- |
| GET | `/categories` | Public | array of categories (may include inactive; client filters, sorts & applies parent-includes-children scoping) |
| GET | `/categories/{id}` | Public | one category |
| GET | `/categories/slug/{slug}` | Public | one category (404 if absent) |

---

## D. Banners (public)

| Method | Path | Auth | Response `data` |
| --- | --- | --- | --- |
| GET | `/banners` | Public | array of banners (empty array is tolerated → UI defaults) |

---

## E. Enquiry List (customer) — the persisted "cart"

The client mirrors the local Enquiry List → server as a **full replace** (delete each existing row,
POST each line). **Quantities only — no totals, no money math.**

| Method | Path | Auth | Body / Notes | Response `data` |
| --- | --- | --- | --- | --- |
| GET | `/cart` | Customer | current user's lines | array of Enquiry List rows |
| POST | `/cart` | Customer | `{ productId, variantId, variantName, name, image, price?, comparePrice?, priceType?, unitType?, currency?, quantity, stock?, userId }` | created row (with `id`) |
| PATCH | `/cart/{id}` | Customer | partial updates (e.g. `{ quantity }`) | updated row |
| DELETE | `/cart/{id}` | Customer | — | 200 (or `{}`) |
| DELETE | `/cart` | Customer | clears the user's list | 200 |

> Scope every row to the authenticated user (derive `userId` from the token; don't trust the body).
> `price` may be null/absent for tiered / on-enquiry items. The endpoint paths remain `/cart` in code;
> in NEBM this is the **Enquiry List**.

---

## F. Enquiries (customer)

### `POST /enquiries` — Public/Customer  ✦ (server owns `enquiryNumber`, `status`, timestamps, `statusHistory`)
The storefront's **Submit Enquiry** action (`Checkout.js` → `OrderContext.createOrder` →
`orders.create`). A **pure enquiry payload** — contact + items + note + `status:"New"`, and **nothing
that implies money** (no subtotal/discount/coupon/shipping/tax/total/store-credit/payment/address):

```jsonc
{
  "type": "enquiry",                              // explicit flag; the server must NOT run any
                                                  //   payment/coupon/wallet side effects
  "userId": 3,                                    // ✦ null for a guest; derive from token when present
  "enquiryNumber": "ENQ-…",                       // ✦ IGNORE client value; server generates its own
  "status": "New",                                // ✦ server sets
  "items": [
    { "productId": 1, "variantId": null, "name": "WPC Louver Panel 3D Charcoal",
      "image": "…", "sku": "NEBM-1-001", "quantity": 20,
      "priceType": "tiered", "unitType": "piece", "price": null }   // price only for "exact" items
  ],
  "contact": { "name": "Bappi Das", "phone": "+91 9707112233", "email": "mail4bappidas@gmail.com" },
  "notes": "Need project rate for a facade job.",
  "statusHistory": [ { "at": "…", "by": "Bappi Das", "action": "Enquiry submitted" } ]  // ✦ server seeds
}
```

**Server must:** generate `enquiryNumber` (`ENQ-YYYYMMDD-NNNN`), force `status:"New"`, seed
`statusHistory` with the "Enquiry submitted" entry (actor = the contact's name), stamp
`createdAt`/`updatedAt`, and persist `userId` (nullable). It must **not** create a payment, redeem a
coupon, move a wallet, compute a total, or write to any retired collection (file 03 §2).
Response `data`: the saved enquiry (with server `id`, `enquiryNumber`, timestamps). Status **201/200**.

### `GET /enquiries` — Customer
Response `data`: array of the **authenticated user's** enquiries (newest-first is fine; the client
re-sorts). Drives **My Enquiries**. *(Mock filters by `?userId=`; scope to the token in Laravel.)*

### `GET /enquiries/{id}` — Customer
Response `data`: one enquiry (must belong to the user).

### `GET /enquiries/number/{enquiryNumber}` — Customer (also used by the Enquiry success screen)
Response `data`: one enquiry by its `enquiryNumber`. **404** if not found.

> There is **no** customer enquiry-cancel/edit endpoint in the NEBM flow — an enquiry is a submitted
> lead. (The dormant `orders.cancel` → `POST /orders/{id}/cancel` is not part of this contract.)

---

## G. Reviews

### `GET /products/{productId}/reviews` — Public *(also listed in §B)*
Approved reviews for a product (the live PDP path).

### `GET /reviews/mine` — Customer · `POST /products/{productId}/reviews` — Customer
Present in the API layer (`reviews.getMine`, `reviews.submit`) but **not wired to any storefront UI in
NEBM** — with no purchase path there is no customer review-submission screen. If you implement them:
`getMine` returns the user's own reviews in all statuses; `submit` creates/updates one review per
(user, product) and re-enters `status:"pending"`. Server sets `userId`, `userName`, `status`,
timestamps. The **live** review paths are the public read above and **admin moderation** (§P).

---

## H. Wishlist (customer)

| Method | Path | Auth | Body / Notes | Response `data` |
| --- | --- | --- | --- | --- |
| GET | `/wishlist` | Customer | the user's wishlist | array of rows (return product nested as `product` — file 01 §9) |
| POST | `/wishlist` | Customer | flat snapshot incl. `productId`, `userId` (file 01 §9) | created row (with `id`) |
| DELETE | `/wishlist/{id}` | Customer | — | 200 |

---

## I. Settings (public read)

| Method | Path | Auth | Response `data` |
| --- | --- | --- | --- |
| GET | `/settings` | Public | the settings object — `store` / `notifications` / `seo` / `social` (file 01 §11). Storefront reads store contact info, logo, SEO & social links. |

---

## J. Leads (public)

| Method | Path | Auth | Body | Server sets |
| --- | --- | --- | --- | --- |
| POST | `/leads/contact` | Public | `{ name, email, phone?, orderNumber?, category?, subject?, message }` | `type:"contact"`, `status:"new"`, `notes:""` |
| POST | `/leads/newsletter` | Public | `{ email }` | `type:"newsletter"`, `status:"subscribed"`, other fields null |

Response `data`: the created lead.

---

## K. Admin — Auth & Dashboard

### `POST /admin/auth/login` — Public
Body: `{ "email", "password" }`. Response `data`: `{ "token": "<opaque, admin-scoped>", "admin": {
…admin minus password… } }`. The client stores `data.token` in `sessionStorage.adminToken` and
`data.admin`. **401/422** on bad credentials.

### `POST /admin/auth/logout` — Admin
Revoke the admin token. Any 2xx.

### `GET /admin/dashboard/stats` — Admin
Response `data` — the **8 enquiry-centric keys** (mock computes these; reproduce them, file 03 §6):
```json
{ "totalProducts": 70, "totalEnquiries": 11, "newEnquiries": 1, "openEnquiries": 3,
  "convertedEnquiries": 2, "totalLeads": 4, "totalUsers": 3, "lowStockProducts": 0 }
```
Definitions: `totalProducts`/`totalEnquiries`/`totalLeads`/`totalUsers` = row counts;
`newEnquiries` = enquiries with `status==="New"` (a missing status counts as New);
`openEnquiries` = enquiries with `status ∈ (New, Contacted, In Discussion, Quotation Sent)`;
`convertedEnquiries` = `status==="Converted"`;
`lowStockProducts` = products with `stock ≤ (lowStockThreshold ?? 10)`.

---

## L. Admin — Products

| Method | Path | Auth | Body / Notes | Response |
| --- | --- | --- | --- | --- |
| GET | `/admin/products` | Admin | optional query params | array (all products incl. inactive) |
| GET | `/admin/products/{id}` | Admin | — | one product |
| POST | `/admin/products` | Admin | full product payload (below) | created product |
| PUT | `/admin/products/{id}` | Admin | full product payload | updated product |
| DELETE | `/admin/products/{id}` | Admin | — | 200 / 404 |

Product create/update payload fields: `name, slug, sku, shortDescription, description, categoryId|null,
brand, price, comparePrice, costPrice, stock, lowStockThreshold, weight, dimensions{length,width,height},
variants[{id,name,price,stock,sku,attributes?,swatchHex?}], images[], tags[], featured, trending, hot,
isActive, metaTitle, metaDescription,` **`priceType, unitType, minQty, priceTiers[{minQty,price}],
showExactPrice, showTieredPricing, cardPriceMode, special`**. Server sets/owns `createdAt`/`updatedAt`
(and may keep `rating`/`totalReviews` aggregates).

---

## M. Admin — Categories

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/admin/categories` | Admin | — | array (incl. inactive) |
| POST | `/admin/categories` | Admin | `{ name, slug, description, image, parentId|null, isActive, sortOrder, showInMainMenu, menuOrder }` | created |
| PUT | `/admin/categories/{id}` | Admin | same fields | updated |
| DELETE | `/admin/categories/{id}` | Admin | — | **200** if free; **409** `CATEGORY_IN_USE` if it has child categories or products (file 03 §5) |

---

## N. Admin — Enquiries

| Method | Path | Auth | Body / Notes |
| --- | --- | --- | --- |
| GET | `/admin/enquiries` | Admin | optional `?userId=` / `?status=`. Each row includes computed `customerName`/`customerEmail` (from `contact`, falling back to the joined user) |
| GET | `/admin/enquiries/{id}` | Admin | one enquiry |
| PATCH | `/admin/enquiries/{id}` | Admin | partial updates + optional `event` |

**`PATCH /admin/enquiries/{id}`** — `updates` are enquiry fields the admin edits, primarily
`{ status, adminNotes }`. Optional **`event: { action, note? }`** → the server appends
`{ at, by, action, note? }` to `statusHistory` (`by` derived from the admin token). The client's
`updateEnquiryStatus(id, status)` helper sends `{ status }` with `event: { action: "Status → <status>" }`.

```jsonc
// e.g. advance an enquiry
PATCH /admin/enquiries/7
{ "status": "Quotation Sent",
  "adminNotes": "Sent project rate for 200 panels; awaiting confirmation.",
  "event": { "action": "Status → Quotation Sent" } }
```

Response `data`: the updated enquiry. **This path never touches payment/shipping/coupon fields** — no
ex-commerce cascade can fire from an enquiry update (file 03 §2–§3). Allowed status values and
transitions: file 03 §3.

---

## O. Admin — Users

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin | optional `?…` | array |
| GET | `/admin/users/{id}` | Admin | — | one user |
| PATCH | `/admin/users/{id}` | Admin | partial, e.g. `{ isActive }` | updated user |

*(AdminUsers may also call `GET /admin/enquiries?userId=<id>` to show a user's enquiries.)*

---

## P. Admin — Reviews

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| GET | `/admin/reviews` | Admin | — (all statuses) |
| POST | `/admin/reviews` | Admin | `{ productId, userName, rating, title, body, isVerifiedPurchase, status }` → server sets `userId:null`, `source:"admin"`, default `status:"approved"`, `helpfulCount:0` |
| PATCH | `/admin/reviews/{id}` | Admin | partial, e.g. `{ status: "approved"|"rejected"|"pending" }` |
| DELETE | `/admin/reviews/{id}` | Admin | — |

---

## Q. Admin — Leads

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| GET | `/admin/leads` | Admin | — | array |
| GET | `/admin/leads/{id}` | Admin | — | one lead |
| PATCH | `/admin/leads/{id}` | Admin | `{ status, notes }` | updated lead |
| DELETE | `/admin/leads/{id}` | Admin | — | 200 |

---

## R. Admin — Settings

| Method | Path | Auth | Body / Notes |
| --- | --- | --- | --- |
| GET | `/admin/settings` | Admin | — | whole settings object |
| PATCH | `/admin/settings/{section}` | Admin | just that section's fields (shallow-merge) → returns whole settings object. `section ∈ store\|notifications\|seo\|social` |

---

## Z. Endpoint coverage table (every live `apiService.*` method → endpoint)

**Customer / public**

| `apiService` method | Endpoint |
| --- | --- |
| `auth.login` | `POST /auth/login` |
| `auth.register` | `POST /auth/register` |
| `auth.logout` | `POST /auth/logout` |
| `auth.getUser` | `GET /auth/user` |
| `auth.updateUser` | `PUT /auth/user` |
| `auth.changePassword` | `PUT /auth/password` |
| `products.getAll` | `GET /products` |
| `products.getById` | `GET /products/{id}` |
| `products.getBySlug` | `GET /products/slug/{slug}` |
| `products.getFeatured` | `GET /products/featured?limit=` |
| `products.getSpecial` | `GET /products/special?limit=` |
| `products.getTrending` | `GET /products/trending?limit=` |
| `products.getByCategory` | `GET /products/category/{categoryId}` |
| `products.search` | `GET /products?search=` |
| `products.getReviews` | `GET /products/{productId}/reviews` |
| `products.getRelated` | *(client-side; uses `GET /products`)* |
| `products.getFrequentlyBoughtTogether` | *(client-side; uses `GET /products`)* |
| `categories.getAll` | `GET /categories` |
| `categories.getById` | `GET /categories/{id}` |
| `categories.getBySlug` | `GET /categories/slug/{slug}` |
| `banners.getAll` | `GET /banners` |
| `cart.getCart` | `GET /cart` |
| `cart.addToCart` | `POST /cart` |
| `cart.updateCartItem` | `PATCH /cart/{id}` |
| `cart.removeFromCart` | `DELETE /cart/{id}` |
| `cart.clearCart` | `DELETE /cart` |
| `orders.create` | `POST /enquiries` |
| `orders.getByUserId` | `GET /enquiries` |
| `orders.getById` | `GET /enquiries/{id}` |
| `orders.getByOrderNumber` | `GET /enquiries/number/{enquiryNumber}` |
| `reviews.getMine` | `GET /reviews/mine` *(not surfaced in NEBM UI)* |
| `reviews.submit` | `POST /products/{productId}/reviews` *(not surfaced in NEBM UI)* |
| `wishlist.get` | `GET /wishlist` |
| `wishlist.add` | `POST /wishlist` |
| `wishlist.remove` | `DELETE /wishlist/{id}` |
| `settings.get` | `GET /settings` |
| `leads.createContact` (`createContactLead`) | `POST /leads/contact` |
| `leads.createNewsletter` (`createNewsletterLead`) | `POST /leads/newsletter` |

**Admin**

| `apiService.admin` method | Endpoint |
| --- | --- |
| `login` | `POST /admin/auth/login` |
| `logout` | `POST /admin/auth/logout` |
| `getDashboardStats` | `GET /admin/dashboard/stats` |
| `getProducts` | `GET /admin/products` |
| `getProduct` | `GET /admin/products/{id}` |
| `createProduct` | `POST /admin/products` |
| `updateProduct` | `PUT /admin/products/{id}` |
| `deleteProduct` | `DELETE /admin/products/{id}` |
| `getCategories` | `GET /admin/categories` |
| `createCategory` | `POST /admin/categories` |
| `updateCategory` | `PUT /admin/categories/{id}` |
| `deleteCategory` | `DELETE /admin/categories/{id}` |
| `getEnquiries` | `GET /admin/enquiries` |
| `getEnquiry` | `GET /admin/enquiries/{id}` |
| `updateEnquiry` / `updateEnquiryStatus` | `PATCH /admin/enquiries/{id}` |
| `getReviews` | `GET /admin/reviews` |
| `createReview` | `POST /admin/reviews` |
| `updateReview` | `PATCH /admin/reviews/{id}` |
| `deleteReview` | `DELETE /admin/reviews/{id}` |
| `getUsers` | `GET /admin/users` |
| `getUser` | `GET /admin/users/{id}` |
| `updateUser` | `PATCH /admin/users/{id}` |
| `getLeads` | `GET /admin/leads` |
| `getLead` | `GET /admin/leads/{id}` |
| `updateLead` | `PATCH /admin/leads/{id}` |
| `deleteLead` | `DELETE /admin/leads/{id}` |
| `getSettings` | `GET /admin/settings` |
| `updateSettings` | `PATCH /admin/settings/{section}` |

> **Retired (not part of the NEBM contract, no backend work):** the dormant customer namespaces
> `wallet.*`, `returns.*`, `coupons.*`, `shipping.getMethods`, `deals.getConfig`, and the dormant admin
> methods for orders/payments/refunds/returns/shipping/coupons/deals (`getOrders`, `updateOrder`,
> `cancelOrder`, `initiateOrderRefund`, `getPayments`, `issueRefund`, `getReturns`, `createReturn`,
> `getShippingMethods`, `getCoupons`, `getDealsConfig`, …). They remain in `api.js` only so imports
> resolve; they hit now-empty collections and no live screen calls them.
