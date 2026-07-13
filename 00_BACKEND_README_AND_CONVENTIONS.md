# 00 — Backend README & Global Conventions

> **Audience:** the backend developer who will build the real **Laravel + MySQL** API for the
> **North East Build Mart (NEBM)** React (Create-React-App) storefront + admin. You do **not** need to
> read the React code. These five documents are the complete, authoritative contract. Where this doc
> and the React code ever disagree, **the code in this repository is the source of truth** — but it has
> been transcribed here field-for-field.

> **What NEBM is:** an **enquiry** platform, not a shop. Customers browse building materials, build an
> **Enquiry List** (quantities, no totals) and **Submit an Enquiry** (contact + note). There is **no
> cart total, checkout, payment, shipping, coupon, returns or wallet.** The commerce boilerplate this
> was refactored from has had those modules **removed**; a few dormant helpers remain in the code but
> are **not part of this contract** (see §13).

---

## 1. The goal (the one hard guarantee)

The frontend already runs today against a **JSON Server** mock backend (`server.js` + `db.json`).
When your Laravel API is ready, the frontend switches to it by editing **two** environment
variables and nothing else:

```dotenv
REACT_APP_API_URL=https://your-laravel-api.com/api/v1
REACT_APP_USE_MOCK_API=false
```

After that swap **every storefront page and every admin module must work exactly as it does today** —
no errors, no missing data, no behavioural differences. Your job is to build an API that satisfies
that guarantee on the first attempt.

You are **documenting the API the frontend already expects** — you are *not* free to invent a
"nicer" shape. Every path, field name, type, enum, status code and behaviour below is what the
frontend actually calls or reads.

### How the contract was derived

`src/services/api.js` is a **dual-mode** service layer. Every method looks like:

```js
if (IS_MOCK_API) { /* talks to JSON Server (db.json) */ }
else { /* talks to the real Laravel API */ }
```

The **`else` (non-mock) branch is the authoritative spec** of each Laravel endpoint — its path, verb,
request body and how the response is consumed. The **mock branch** reveals the data shapes and the
business intent.

---

## 2. The single integration point (audited)

**`apiService` (`src/services/api.js`) is the ONLY place the app talks to a backend.** A repo-wide
search for `fetch(` and `axios` outside that file returns **nothing** — confirmed. There are no
stray API calls anywhere in `src/`. This is what makes the swap-base-URL guarantee real: satisfy
`apiService`'s Laravel branch and the whole app works.

> **Action item for the team (not code to change):** keep it that way. Any future direct `fetch`/
> `axios` call added outside `apiService` would be an integration point this contract does not cover.

---

## 3. Base URL & the environment switch

| Var | Dev (today) | Production (Laravel) |
| --- | --- | --- |
| `REACT_APP_API_URL` | `http://localhost:4000` | `https://…/api/v1` |
| `REACT_APP_USE_MOCK_API` | `true` | `false` |

- `src/services/baseURL.js` sets `BASE_URL = REACT_APP_API_URL` and `IS_MOCK_API = false` once
  `REACT_APP_USE_MOCK_API !== "true"`.
- **The `/api/v1` prefix is part of `REACT_APP_API_URL`.** Axios is created with `baseURL = BASE_URL`,
  so every path in file `02` is **relative to `https://…/api/v1`**. Example: documented `POST /auth/login`
  → `POST https://your-host/api/v1/auth/login`.
- Axios client config (`src/services/api.js`): `Content-Type: application/json`, `Accept:
  application/json`, **30 s timeout**. Your API must accept and return JSON and respond within 30 s.

---

## 4. Response envelope (every endpoint)

The frontend's `extractData()` unwraps responses:

```js
// returns response.data.data when the body has a `success` key, else response.data
if (response.data && typeof response.data === "object" && "success" in response.data)
  return response.data.data;
return response.data;
```

So **every success response must be wrapped**:

```json
{ "success": true, "data": <payload>, "meta": { } }
```

- **Single resource** → `data` is the object: `{ "success": true, "data": { "id": 1, … } }`
- **Collection** → `data` is the array: `{ "success": true, "data": [ {…}, {…} ] }`
- `meta` is optional and read **only** by `extractMeta()` (`response.data.meta`) for pagination —
  see §11.

> Lists today are consumed as **plain arrays** and paginated/filtered client-side. If you choose to
> paginate server-side later, you must still return the **full working set the screen needs** in
> `data` (or implement §11 fully). Returning a truncated page without `meta` would break listings.

---

## 5. Authentication summary (full detail in file 04)

**Laravel Sanctum, token-based, opaque Bearer tokens** is the documented default.

- The request interceptor attaches `Authorization: Bearer <token>` automatically. **Admin** requests
  (any URL containing `/admin/`) use the **admin token**; all other requests use the **customer token**.
- **Customer token:** returned by `POST /auth/login` as `data.token`; stored via `authStorage`
  (sessionStorage by default, or localStorage when `remember:true` was sent). User object is
  `data.user`.
- **Admin token:** returned by `POST /admin/auth/login` as `data.token`; stored in
  `sessionStorage.adminToken`. Admin object is `data.admin`.
- **Logout must revoke the token server-side** (`POST /auth/logout`, `POST /admin/auth/logout`) so it
  is invalidated in `personal_access_tokens`.
- Use Sanctum **token abilities/scopes (or separate guards)** so a customer token can never reach an
  `/admin/*` route and vice-versa. All `/admin/*` routes require an **admin-scoped** token.
- **401 behaviour:** on any `401` *except* `POST /auth/login`, the frontend drops the matching session
  (admin 401 → clears admin session; customer 401 → clears customer session). Return `401` for
  missing/invalid/expired/wrong-scope tokens.
- JWT is acceptable **only** if it meets this exact contract (opaque Bearer string in `data.token`,
  identical endpoints/bodies/envelope, server-side revocation on logout). **Sanctum is the default.**

> **Enquiries can be submitted by guests.** `POST /enquiries` is reachable without a token; when a
> customer *is* logged in the client sends their `userId` (also derive it from the token when present).
> `userId` is **nullable** on an enquiry.

---

## 6. IDs

- **Top-level resource primary keys are JSON numbers**: `products`, `categories`, `enquiries`,
  `users`, `reviews`, `leads`, `banners`, `wishlist`, `cart`. The frontend treats these as numeric.
  Use MySQL `BIGINT UNSIGNED AUTO_INCREMENT` and serialize as numbers (not quoted strings).
- **`products.variants[].id` are short strings** (e.g. `"v1"`, `"v2"`) and **must stay strings** —
  they are matched with `===` against strings throughout (Enquiry List lines, enquiry items).
- The frontend frequently compares ids **type-tolerantly** (`String(a) === String(b)`), so a numeric
  id received as a number is always correct; never return top-level ids as strings.
- **`slug` is unique** for `products` and `categories` (used by `/products/slug/{slug}` and
  `/categories/slug/{slug}`).
- Nested **`addresses[].id`** (inside a user), **`priceTiers[]`** and **`variants[]`** rows, and
  **`statusHistory[]`** entries are local structures inside their parent JSON — they need only be
  consistent within that parent (see file 01).

---

## 7. Human-readable numbers (server-owned)

| Field | Resource | Seed format | Generator |
| --- | --- | --- | --- |
| `enquiryNumber` | enquiries | `ENQ-20260115-0001` (`ENQ-YYYYMMDD-NNNN`) | server |

**The server generates and owns `enquiryNumber` and returns the canonical value in the create
response.**

> ⚠️ **Flag:** the mock generates `enquiryNumber` **client-side** (`OrderContext.createOrder` →
> `generateEnquiryNumber()`) and sends it in the `POST /enquiries` body. **Your Laravel
> `POST /enquiries` must ignore any client-sent `enquiryNumber` and generate its own**, returning it on
> the saved enquiry (the frontend then reads `result.order.enquiryNumber`). Prefer the seed's
> `ENQ-YYYYMMDD-NNNN` sequential format.

---

## 8. Dates

**All timestamps are ISO-8601 UTC strings with milliseconds and a trailing `Z`**, e.g.
`2026-01-15T10:30:00.000Z`. The frontend parses them with `new Date(...)`. Serialize every MySQL
`TIMESTAMP`/`DATETIME` in **exactly** this format (UTC, 3-digit ms, `Z`). Configure Laravel's date
serialization accordingly (e.g. a base model `serializeDate()` returning
`$date->toISOString()` / `->format('Y-m-d\TH:i:s.v\Z')`).

Almost every resource carries **`createdAt`** and **`updatedAt`** (camelCase). The enquiry timeline
(`statusHistory[].at`) uses the same format. See each table in file 01.

---

## 9. Money & prices (display only — there is no money math)

NEBM never charges anyone, so **there is no order total, tax, discount, shipping or refund arithmetic
anywhere in the app.** The only money in the system is the **catalogue price on a product**, shown for
reference:

- Currency is **INR**; product prices are **whole rupees stored as integers** (e.g. `price: 340`).
  There are no sub-rupee/paise values.
- **Return money as JSON numbers, never strings.** `formatCurrency()` on the client calls
  `Intl.NumberFormat` on the raw number.
- A product's price display is governed by its **pricing model** (file 01 §5): `priceType` is
  `"exact"` (fixed `price`), `"tiered"` (a `priceTiers[]` quantity-break table), or `"onEnquiry"`
  (no price — quoted by the team). `unitType`, `minQty` and the `showExactPrice` / `showTieredPricing`
  / `cardPriceMode` flags control presentation.
- **Enquiries carry no money.** An enquiry item snapshots `price` **only** for an `exact`-priced
  product (for reference); `tiered` and `onEnquiry` items carry `price: null`. There is no line
  subtotal, no enquiry total. Do **not** add or trust any total/tax/discount/payment field on an
  enquiry (§14, file 03 §1).

---

## 10. JSON-shape fidelity (the most important rule)

Your **storage design is your choice** (JSON columns vs normalized child tables), but **the serialized
API response must match the existing JSON shape field-for-field** — same key names (**camelCase**),
same nesting, same types — because the frontend reads those exact shapes. Use **API Resources /
transformers** to guarantee the output shape regardless of storage.

Nested/JSON structures that must round-trip exactly (documented in file 01):

- `products.variants[]`, `products.images[]`, `products.dimensions{}`, `products.tags[]`,
  `products.priceTiers[]`, `products.frequentlyBoughtTogetherIds[]`, `products.relatedProductIds[]`
- `enquiries.items[]`, `enquiries.contact{}`, `enquiries.statusHistory[]`
- `users.addresses[]`
- `settings.*` sections

> **camelCase everywhere in responses.** The only snake_case the frontend ever sends is three request
> fields: `password_confirmation`, `current_password`, `password` (auth). Everything else — request and
> response — is camelCase.

---

## 11. Pagination

**Today the storefront product listing and all admin tables filter/sort/paginate _client-side_** off
the full array `data`. `Products.js` calls `apiService.products.getAll()` with **no pagination params**
and does category/price/search/sort/paging in the browser; URL params (`page`, `category`, `search`,
`sort`, …) drive UI state only, **not** the API call.

Therefore, for parity on day one, **list endpoints must return the full working set in `data`.**

`extractMeta()` (`response.data.meta`) exists for a **future** server-side pagination pass. If/when you
paginate server-side, return:

```json
{ "success": true,
  "data": [ … ],
  "meta": { "current_page": 1, "last_page": 5, "per_page": 12, "total": 56 } }
```

so the UI can render "Showing X–Y of N / Page A of B". Until the frontend is updated to send paging
params and read `meta`, **do not truncate list responses**.

---

## 12. Error format (full catalogue in file 04)

`getErrorMessage()` reads `error.response.data.message` first, then the first entry of
`error.response.data.errors`. Use Laravel's standard envelope:

```json
{ "message": "The given data was invalid.",
  "errors": { "email": ["An account with this email already exists."] } }
```

- **422** — validation failures (also: duplicate email on register).
- **401** — unauthenticated / invalid token (see §5).
- **404** — not found (also: a `DELETE` whose row is already gone returns 404 → treated as success,
  see §13).
- **409 (recommended)** — deleting a **category still in use** (`CATEGORY_IN_USE`); the frontend shows
  whatever `message` you return. See file 03 §5 / file 04.

Each known failure's exact status + JSON is enumerated in file 04.

---

## 13. Mock-only scaffolding to IGNORE (with the real requirement)

These exist purely to make JSON Server behave. **Implement the _intent_, not the mechanism.**

| Mock mechanism | Where | The real Laravel requirement |
| --- | --- | --- |
| Safe non-cascading `DELETE` override + `getRemovable` no-op | `server.js` | `DELETE` returns **200** on success, **404** if absent, and **never cascade-deletes dependents**. Enforce referential integrity instead (block the delete) — see §category integrity, file 03 §5. |
| `deleteWithVerify()` (delete → on error, GET to see if it's gone → treat 404 as success) | `api.js` | Just return a clean **200** on delete and **404** when the row doesn't exist. The verify dance only papers over a json-server 500 bug. |
| Client-side filtering via JSON-Server params (`?field=value`, `_sort`, `_order`) | mock branches | Support the **Laravel-branch query params** the frontend actually sends (listed per endpoint in file 02 — mostly `?userId=`, `?search=`, `?limit=`). The `_sort/_order` style is **mock-only** and not sent in production. |
| **Dormant ex-commerce helpers & namespaces** (`wallet`, `returns`, `coupons`, `shipping`, `deals`, and the ex-`orders` admin methods; `createPaymentForOrder`, `redeemCouponByCode`, `debitWallet`, `performCancel`, …) | `api.js` | **Do not implement.** They were retained only so imports don't break during the refactor. Their collections (`payments`, `refunds`, `returns`, `shipping_methods`, `coupons`, `walletTransactions`) are seeded **empty**. The enquiry path **never** calls them (guarded by `type:"enquiry"`, file 03 §2). They are **not part of the NEBM contract**. |

---

## 14. Server-authoritative fields

The mock **trusts the client** (JSON Server just stores what it's POSTed). **The real API must not.**
There is **no money to recompute** (NEBM has no totals), but the server still **owns** these and must
**ignore or reject** client-sent values:

- **Identity & workflow:** every `id`, the `enquiryNumber`, the enquiry `status`, and every
  `createdAt`/`updatedAt`/`statusHistory[].at` timestamp.
- **Audit actor:** `statusHistory[].by` — derive from the bearer token (the admin's name, the customer's
  name, or `"System"`), never trust a client-sent value.
- **Ownership:** an enquiry's `userId` (derive from the token when logged in; null for a guest); a
  review's `userId`/`userName`/`isVerifiedPurchase`/`status`.

> **Required rule:** on `POST /enquiries`, the server generates `enquiryNumber`, sets `status:"New"`,
> seeds `statusHistory` with the "Enquiry submitted" entry, and stamps the timestamps — regardless of
> what the client sent. It must **never** create a payment, redeem a coupon, or move a wallet balance
> (there are none). The enquiry is a **pure lead**.

---

## 15. Index of the other four files

| File | What's in it |
| --- | --- |
| **`01_DATABASE_SCHEMA.md`** | MySQL schema for the NEBM collections: every column (type/nullability/default/keys/indexes), every enum, every FK & relationship, the `settings` singleton, recommended storage for each nested JSON structure, an ER overview, and seed/migration guidance. Documents the retired-empty collections too. |
| **`02_API_ENDPOINTS.md`** | Every endpoint the frontend calls, grouped by domain, with method/path/auth/scope/query-params/request-body/exact-success-JSON/status-codes/example. Plus a **coverage table** mapping every live `apiService.*` method (customer + `admin.*`) to its endpoint. |
| **`03_BUSINESS_LOGIC_AND_CASCADES.md`** | The server-side rules: the enquiry creation flow, enquiry status transitions, category referential integrity, the `settings` singleton — and the explicit statement that **no money/payment/coupon/wallet cascades run**. |
| **`04_AUTH_ERRORS_AND_EDGE_CASES.md`** | Full auth flows (customer + admin, Sanctum, scopes, login/register/logout/password, 401, revocation), the error envelope + every documented failure with status code & JSON, validation rules, enquiry edge cases, and a **frontend-parity test checklist** to run after each module. |

---

## 16. Definition of done (self-verify against this)

- [ ] `REACT_APP_API_URL=https://…/api/v1` + `REACT_APP_USE_MOCK_API=false` is the **only** change needed.
- [ ] Every success response is `{ success:true, data, meta? }`; single=object, list=array.
- [ ] Every error is `{ message, errors? }` with the documented status codes (422/401/404/409).
- [ ] All NEBM collections exist as MySQL tables (or the `settings` singleton) per file 01; every seed field maps.
- [ ] Every live `apiService.*` method in the coverage table (file 02) has a working endpoint.
- [ ] camelCase, ISO-8601 `…Z` dates, numeric top-level ids, string variant ids, INR integer prices.
- [ ] Nested JSON shapes (`variants`, `priceTiers`, `items`, `contact`, `statusHistory`, `addresses`,
      `dimensions`, `settings.*`) round-trip exactly.
- [ ] Sanctum tokens; customer vs admin scoped; logout revokes; 401 on bad/missing token.
- [ ] `POST /enquiries` generates `enquiryNumber`, sets `status:"New"`, seeds `statusHistory`, stamps
      timestamps, and fires **no** payment/coupon/wallet side effects.
- [ ] `DELETE` is non-cascading; category-in-use is **blocked** (not cascaded).
- [ ] Server owns `enquiryNumber`, the enquiry `status`, all timestamps, and `statusHistory[].by`.
- [ ] The frontend-parity checklist in file 04 passes for every module.
