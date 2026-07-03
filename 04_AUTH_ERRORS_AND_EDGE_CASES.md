# 04 — Auth, Errors & Edge Cases

Full authentication flows, the complete error catalogue (every failure the frontend handles, with its
status code and exact JSON), validation rules, a consolidated edge-case/pitfall list, and the
**frontend-parity test checklist** to run after building each module — all for **North East Build Mart**.

---

## 1. Authentication (Laravel Sanctum, token-based)

Two **independent** sessions live side-by-side, possibly in the same browser tab — never let one wipe
the other.

### 1.1 Token mechanics (from `api.js` interceptors + `authStorage` + contexts)

- **Bearer header:** the request interceptor attaches `Authorization: Bearer <token>` to every
  request. If the request URL **contains `/admin/`**, it uses the **admin** token
  (`sessionStorage.adminToken`); otherwise the **customer** token (`authStorage.get("token")`).
- **Customer token storage:** `authStorage` writes to **sessionStorage by default**, or
  **localStorage** when the user checked **"Remember me"** (`remember:true` sent on login). Reads check
  sessionStorage first. So customer sessions are per-tab unless remembered.
- **Admin token storage:** always **sessionStorage** (`adminToken`), never localStorage. Admin session
  is per-tab and ends when the tab closes.
- **Session restore on load:** the app restores a session only when **both** the stored user/admin
  **and** its token exist. So every login path must return a token.
- **Scopes/abilities:** issue customer tokens and admin tokens with **distinct Sanctum abilities** (or
  use separate guards). A customer token must be rejected (**401**/**403**) on any `/admin/*` route and
  vice-versa. All `/admin/*` routes require a valid **admin-scoped** token.

> **Enquiries are guest-friendly.** `POST /enquiries` (and the public reads) require **no** token; a
> logged-in customer's `userId` is sent (and should be derived from the token when present). Do not
> force auth on the enquiry-submission path.

### 1.2 Customer flows

| Flow | Endpoint | Request | Success `data` | Notes |
| --- | --- | --- | --- | --- |
| Login | `POST /auth/login` | `{ email, password, remember }` | `{ token, user }` | `user` = safe user (no password). 401/422 on bad creds. |
| Register | `POST /auth/register` | `{ firstName, lastName, email, phone?, password, password_confirmation }` | new safe user | snake_case `password_confirmation`. 422 on duplicate email / weak password. Client then prompts login (no auto-login). |
| Logout | `POST /auth/logout` | — | any 2xx | **revoke the current token** (`personal_access_tokens`). Client clears storage regardless. |
| Current user | `GET /auth/user` | — | safe user | |
| Update profile | `PUT /auth/user` | `{ firstName, lastName, phone }` **or** `{ addresses:[…] }` | updated safe user | full-array replace for addresses. |
| Change password | `PUT /auth/password` | `{ current_password, password, password_confirmation }` | `{ success:true }` | 422 if `current_password` wrong / weak new password. |

### 1.3 Admin flows

| Flow | Endpoint | Request | Success `data` | Notes |
| --- | --- | --- | --- | --- |
| Login | `POST /admin/auth/login` | `{ email, password }` | `{ token, admin }` | `admin` = admin row minus password. Token is **admin-scoped**. 401/422 on bad creds. |
| Logout | `POST /admin/auth/logout` | — | any 2xx | revoke the admin token. |

The admin login form sends `{ email, password }` only (email trimmed). On success the client stores
`data.token` → `sessionStorage.adminToken` and `data.admin` → `sessionStorage.admin`, then routes to
`/admin/dashboard`. All `/admin/*` pages assume a valid admin token is attached.

### 1.4 `401` handling (response interceptor)

On any response with status **401**, the client drops **only the matching session** and **never on
`/auth/login`**:

```
if status === 401 and url does NOT include "/auth/login":
    if url includes "/admin/": clear admin session (admin + adminToken)
    else:                       clear customer session (user + token)
```

Therefore:
- Return **401** for missing/invalid/expired/wrong-scope tokens on protected routes → the client
  cleanly logs that session out and the user re-authenticates.
- For a **failed customer login** (wrong password), return **401 or 422** — it is **excluded** from the
  auto-logout, so it only surfaces the error message (no session is dropped).
- A **500** is logged by the client but does not drop the session; reserve 5xx for real server faults.

### 1.5 Token revocation

`POST /auth/logout` and `POST /admin/auth/logout` **must invalidate the presented token** in
`personal_access_tokens` (Sanctum `currentAccessToken()->delete()` or `tokens()->delete()`), so a
logged-out token can never be replayed. A revoked/expired token on any later request → **401**.

> **JWT alternative:** acceptable only if it meets this exact contract — opaque Bearer string in
> `data.token`, the same endpoints/bodies/envelope, customer vs admin separation, and **server-side
> revocation on logout**. **Sanctum is the default.**

### 1.6 Password hygiene (non-negotiable)

`users[].password` / `admins[].password` exist in `db.json` as seed plaintext to hash on import. The
API must **never** serialize `password` into any response, and the frontend must never place it in
state, storage or logs. `GET /auth/user`, login `data.user`, and `data.admin` all return the **safe**
record (every field except `password`).

---

## 2. Error envelope & catalogue

The client's `getErrorMessage()` reads `error.response.data.message` first, then the **first** value of
`error.response.data.errors`:

```json
{ "message": "The given data was invalid.",
  "errors": { "email": ["An account with this email already exists. Please log in instead."] } }
```

Every documented failure the frontend handles:

| # | Case | Endpoint(s) | Status | Body the frontend expects |
| --- | --- | --- | --- | --- |
| 1 | Validation failure (any) | any write | **422** | `{ message, errors: { field: ["…"] } }` |
| 2 | Duplicate email on register | `POST /auth/register` | **422** | `{ message: "An account with this email already exists. Please log in instead." }` (or `errors.email`) |
| 3 | Invalid login credentials | `POST /auth/login`, `POST /admin/auth/login` | **401** (or 422) | `{ message: "Invalid email or password" }` — *not* an auto-logout (login is excluded) |
| 4 | Unauthenticated / expired / wrong-scope token | any protected | **401** | `{ message: "Unauthenticated." }` → client drops the matching session |
| 5 | Not found | `GET /...slug/{}`, `/{id}`, `/enquiries/number/{}` | **404** | `{ message: "Not found" }` |
| 6 | Invalid enquiry (empty items / missing contact / bad quantity) | `POST /enquiries` | **422** | `{ message, errors: { … } }` (see §3) |
| 7 | Category in use on delete | `DELETE /admin/categories/{id}` | **409** | `{ message: "Cannot delete this category — N subcategories and M products still reference it. Reassign or remove them first." }` |
| 8 | DELETE of absent row | any `DELETE` | **404** | `{}` — client treats a confirmed 404 as success (file 00 §13) |
| 9 | Server fault | any | **5xx** | logged by client; does not drop session — reserve for real faults |

> `CATEGORY_IN_USE` (7) is treated by the client as an **expected** outcome (not a console error) as
> long as it is a 4xx with a `message`.

---

## 3. Validation rules

These mirror the client's checks; enforce them server-side (the client cannot be trusted).

| Field | Rule (client) | Server requirement |
| --- | --- | --- |
| `email` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, **unique** on register | `required, email, unique:users,email` → 422 |
| `password` | length ≥ 6 (`isPasswordStrong`) | `required, min:6, confirmed` (register & change-password) → 422 |
| `password_confirmation` | must match | `confirmed` |
| `current_password` | required on change-password | must match the stored hash → 422 |
| `phone` (IN) | `/^(\+91|0)?[6-9]\d{9}$/` after stripping spaces/dashes/parens | validate when present; tolerate stored `"+91 98765 43210"` style |
| address fields | `firstName, lastName, phone, addressLine1, city, state, postalCode` required (profile address book) | validate on profile writes |
| **enquiry `items`** | non-empty; each item has a resolvable `productId` and `quantity ≥ 1` | `required, array, min:1` → 422 |
| **enquiry `contact.name`** | required, trimmed | `required` → 422 |
| **enquiry `contact.phone`** | required, IN phone rule | `required` + phone rule → 422 |
| **enquiry `contact.email`** | optional | `nullable, email` |
| **enquiry `notes`** | optional free text | `nullable` |
| `rating` | 1–5 | `required, integer, between:1,5` (admin review create) |
| review `title` | ≤ 80 chars | optional |
| review `body` | ≤ 1000 chars | optional |
| contact `message` | ≥ 20 chars | validate on `POST /leads/contact` |

---

## 4. Consolidated edge cases & pitfalls

1. **DELETE never cascades; return 404 when absent.** Block category deletes that have dependents
   (**409**) — do not delete the products/subcategories (file 03 §5). The `deleteWithVerify` dance in
   the mock only papers over a json-server bug; your clean 200/404 makes it a no-op.
2. **The enquiry path moves no money.** `POST /enquiries` must **never** create a payment, redeem a
   coupon, move a wallet, deduct stock or compute a total. Enforce the `type:"enquiry"` intent
   server-side (file 03 §2). An enquiry is a pure lead.
3. **Empty Enquiry List.** Submitting with zero items is invalid → **422**; the storefront also blocks
   it in the UI (the Submit Enquiry screen shows an empty state and no submit).
4. **Missing contact phone.** `contact.phone` (and `contact.name`) are required; reject with **422**.
   `contact.email` is optional and may be `null`.
5. **Guest vs logged-in enquiry.** `userId` is **nullable** — a guest may submit. When logged in, the
   client sends `userId`; derive it from the token server-side and don't trust a mismatched body value.
6. **On-enquiry / tiered items carry no price.** An enquiry item's `price` is populated **only** for an
   `exact`-priced product; `tiered` and `onEnquiry` items send `price: null`. Never infer or invent a
   price for them, and never sum item prices into a total.
7. **Server owns `enquiryNumber` and `status`.** Ignore any client-sent `enquiryNumber` on
   `POST /enquiries`; generate the canonical `ENQ-YYYYMMDD-NNNN`. Force `status:"New"` at create; only
   admin `PATCH /admin/enquiries/{id}` changes it thereafter (file 00 §7, §14).
8. **`statusHistory.by` from the token.** The first entry (`"Enquiry submitted"`) records the
   submitting contact's name; admin status changes record the admin's name; system events `"System"`.
   Never accept `by` from the client.
9. **ISO-8601 UTC with ms + `Z`** for every timestamp (`2026-01-15T10:30:00.000Z`). `new Date(...)`
   parses these; a different format mis-renders dates.
10. **Numeric top-level ids; string variant ids.** Don't quote `enquiry.id`; do keep `variants[].id`
    (`"v1"`) a string. The client compares some ids type-tolerantly but expects numeric resource ids.
11. **JSON-shape fidelity.** Every nested structure must serialize with the exact camelCase keys/nesting
    (`items`, `contact`, `statusHistory`, `variants`, `priceTiers`, `addresses`, `dimensions`,
    `settings.*`). Use API Resources.
12. **Pagination meta.** Lists are consumed as plain arrays today — **return the full working set**.
    `extractMeta()` reads `response.data.meta` only; if you paginate later, include
    `{ current_page, last_page, per_page, total }` and don't truncate before the client is updated.
13. **Admin vs storefront list scoping.** Public `/categories` may return all (client filters/sorts);
    admin `/admin/categories` includes inactive. `/admin/enquiries` must add computed
    `customerName`/`customerEmail`. `/admin/products` returns inactive products too.
14. **Empty collections are valid** (`cart`, `wishlist` may be empty; `banners` may be empty → UI uses
    defaults). Return `[]`, not 404. The retired collections (payments/refunds/returns/…) are seeded
    empty and are not read by any live screen.
15. **`weight` is non-integer** (kg); product `dimensions` may be `{}`; `variants`/`priceTiers` arrays
    may be empty (most building-material products have no variants) — tolerate all.
16. **Never leak `password`** (§1.6). And never surface the legacy `users.storeCredit` field as a
    feature — NEBM has no wallet.

---

## 5. Frontend-parity test checklist (run per module after building)

Switch a build to your API (`REACT_APP_USE_MOCK_API=false`, `REACT_APP_API_URL=https://…/api/v1`) and
confirm **identical behaviour to the mock**:

**Auth & session**
- [ ] Customer login (with/without "Remember me"), reload keeps session (remember) or not (session).
- [ ] Register duplicate email → 422 with the documented message; no auto-login.
- [ ] Change password (wrong current → 422; valid → success). `password` never appears in any response.
- [ ] Admin login → `/admin/dashboard`; admin and customer sessions coexist in one tab; a 401 on one
      doesn't log out the other; logout revokes the token (replay → 401).

**Catalogue & storefront**
- [ ] Home (featured / **Special Products** / categories / banners), Products listing
      (category/price/search/sort/paging all work — client-side), PDP by slug, related +
      frequently-bought-together resolve.
- [ ] Pricing displays correctly per product: **exact** (fixed ₹), **tiered** (break table / "from ₹"),
      **on-enquiry** (no price). Category deep-links (`?category=<slug>`) resolve, parent includes
      children.
- [ ] Reviews: only approved show on PDP.

**Enquiry List & submission**
- [ ] Add to Enquiry List (with quantity); adjust/remove lines; list persists for a logged-in user;
      **no totals** shown anywhere.
- [ ] Submit Enquiry with a note + contact (name, phone, optional email) → success screen shows the
      `ENQ-…` reference; the enquiry appears under **My Enquiries** for a logged-in user.
- [ ] Empty list → blocked; missing name/phone → 422; guest submit works (userId null); on-enquiry /
      tiered items send `price: null`.
- [ ] Submitting an enquiry creates **no** payment/coupon/wallet/stock side effect (server-verified).

**Admin — Enquiries**
- [ ] List shows `customerName`/`customerEmail`; detail shows items/quantities/contact/note.
- [ ] Advance status New → Contacted → In Discussion → Quotation Sent → Converted (and Closed/Lost);
      each change appends a `statusHistory` entry attributed to the admin; `adminNotes` save.

**Admin — Products, Categories, Reviews, Users, Leads, Settings, Dashboard**
- [ ] Products CRUD incl. the pricing model (`priceType`, `priceTiers`, `unitType`, `special`, display
      flags).
- [ ] Delete category with products/subcategories → **blocked (409)**; a free category deletes (200).
- [ ] Reviews: admin approve/reject/delete; admin-authored review (`source:"admin"`, `userId:null`,
      approved) appears on the PDP once approved.
- [ ] Users: toggle `isActive`. Leads: contact/newsletter rows list; status/notes update; delete.
- [ ] Settings: `PATCH /admin/settings/{section}` merges one of `store`/`notifications`/`seo`/`social`
      and returns the whole object (no shipping/payment section).
- [ ] `GET /admin/dashboard/stats` returns the **8** enquiry-centric fields with values consistent with
      the data (file 02 §K).
