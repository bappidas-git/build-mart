# 02e — KEEP-Invariant Behaviour Verification (2026-07-01)

> **Prompt‑02 verification deliverable.** The next pass in the Prompt‑02 chain. Where `prompts/02c-requirement-map-anchor-verification-2026-07-01.md` proved the checklist's `file:line` anchors *exist* (the cited coordinates hold) and `prompts/02d-spec-checklist-reconciliation-2026-07-01.md` proved the checklist *completely covers the spec both ways* (zero gaps, zero phantoms), this note proves the layer the **prime directive** actually cares about: that the six named KEEP guardrails **behave** as the checklist trusts them to — not merely that a line is present, but that the line *does the job the map relies on*. Bottom line: **all six invariants behave exactly as `02b` describes — the crown jewels are real, not just cited.** Two non‑defect nuances are recorded in §5.
>
> **Analysis‑only.** No application code, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

---

## 1. Method — a third verification axis

The chain now checks the map from three independent directions:

| Note | Axis | Question answered |
|---|---|---|
| `02c` | **Coordinate** | Does line *L* hold construct *C*? (anchors reproduce) |
| `02d` | **Coverage** | Does every spec requirement have a checklist home, and vice‑versa? (two‑way, no phantoms) |
| **`02e`** | **Behaviour** | Does construct *C* actually **enforce** the invariant *I* the map cites it to protect? |

`02c` could confirm `server.js:76` holds a `server.delete(...)` line without confirming that handler is *non‑cascading*; `02e` reads the handler body and confirms the cascade is genuinely absent. Each of the six guardrails the prime directive enumerates — **dual‑mode API · auth · routing/provider nesting · slug/category rules · safe non‑cascading DELETE** — plus the **negative** invariant ("enquiry submit fires no payment/coupon/wallet side effect") was re‑read at source and its *behaviour* verified. A guardrail counts as **behaviourally verified** only when the code path visibly implements the described contract — not when a same‑named symbol merely exists.

---

## 2. The six prime‑directive invariants — behaviour verified at source

| # | Invariant (prime directive) | Source | Behaviour holds |
|---|---|---|---|
| 1 | Dual‑mode API layer | [`api.js:67‑72`](src/services/api.js) + pervasive `IS_MOCK_API` branching | ✅ |
| 2 | Auth (never leak `password`; scoped 401) | [`api.js:774`](src/services/api.js), `:804`, `:42‑55` | ✅ |
| 3 | Slug / category rules (parent‑includes‑children) | [`categories.js:72‑76`](src/utils/categories.js), `:26‑42` + [`App.js:112`](src/App.js) | ✅ |
| 4 | Safe non‑cascading DELETE | [`server.js:76‑95`](server.js) + `:67‑69`; client mirror [`api.js:737‑751`](src/services/api.js) | ✅ |
| 5 | Routing + provider nesting order | [`App.js:66‑73`](src/App.js) + `:101` | ✅ |
| 6 | No side effect from the enquiry path (negative) | [`api.js:1159‑1168`](src/services/api.js) → helpers `277 / 319 / 419‑450` | ✅ (see §3) |

### 2.1 Dual‑mode API — `extractData()` really normalises both shapes

[`api.js:67‑72`](src/services/api.js): `extractData` tests `"success" in response.data` — the Laravel envelope marker — and unwraps `response.data.data` when present, else returns the raw `response.data` that JSON Server sends. So the **same** component code consumes both back‑ends; the branch is behavioural, not decorative. `IS_MOCK_API` (imported `:2` from `baseURL.js`) then forks the request side wherever the two servers diverge — e.g. `auth.login` (`:765`), `products.getBySlug` (`:889`), `categories.getAll` active‑filter/sort (`:1031‑1039`), `orders.create` payload seeding (`:1143` / `:1157`). → `02b` §D1/§F "`IS_MOCK_API` + `extractData()` preserved everywhere" is a live contract, confirmed.

### 2.2 Auth — the password never escapes, and a bad login logs nobody out

- **Never leak `password`.** Mock login destructures it away before returning: `const { password, confirmPassword, ...safeUser } = user;` ([`api.js:774`](src/services/api.js)) → only `safeUser` reaches component state/storage (`:775`). Mock register does the same: `const { password, ...safeUser } = response.data;` (`:804`). → `02b` §D1 "never leak `users[].password`" holds behaviourally.
- **Scoped 401.** The response interceptor (`:42‑55`) drops a session on 401 **only** when the URL is *not* `/auth/login` (`:46`) — so a wrong password can't log anyone out — and clears *only* the matching realm (admin `sessionStorage` vs user `authStorage`, `:47‑53`). The request interceptor attaches the correct bearer per‑realm (`:24‑34`). → "auth preserved" is real guard logic, not a label.

### 2.3 Slug / category rules — parent‑includes‑children actually walks the tree

- `getCategoryScopeIds(categoryId)` ([`categories.js:72‑76`](src/utils/categories.js)) returns `getDescendantIds(...) ∪ {categoryId}` as a **string** Set — selecting a parent returns the parent's own products *plus* every descendant's, exactly the rule `02b` §F names. `getDescendantIds` (`:49‑62`) iteratively walks `parentId` links, so arbitrary depth is covered.
- The canonical URL scheme is **slug**: `categoryParam` (`:26‑29`) emits `slug` and only falls back to numeric `id` when no slug exists; `resolveCategory` (`:35‑42`) accepts **either** a slug **or** a legacy numeric id (`c.slug === token || String(c.id) === String(token)`) — the backward‑compat path. The product‑detail route is slug‑based with a legacy‑numeric redirect ([`App.js:112`](src/App.js), comment `:109‑111`). → the slug/category invariant behaves as mapped.

### 2.4 Safe non‑cascading DELETE — the cascade is genuinely gone, on both sides

- **Server override** ([`server.js:76‑95`](server.js)): handles only real top‑level array collections (`:81`), 404s a missing row (`:86`), then `removeById(id)` + `db.write()` (`:88‑89`) and returns 200 (`:91`). There is **no** `getRemovable` scan and **no** cross‑collection delete — non‑cascading by construction, matching `02b` §D1/§F.
- **Defence in depth** (`:67‑69`): `getRemovable` is mixed to `() => []`, so even a fall‑through path can never re‑hit the `null.toString()` crash the comment (`:10‑42`) documents.
- **Client mirror** (bonus, §5.2): `deleteWithVerify` ([`api.js:737‑751`](src/services/api.js)) reconciles a stale/bare `json-server` that returns 500 yet actually deleted the row — a GET that 404s proves the delete took, so it resolves normally instead of surfacing a phantom failure. The KEEP is thus guarded on **both** ends.

### 2.5 Routing + provider nesting — the order reproduces exactly

[`App.js:66‑73`](src/App.js) nests the providers in precisely the `02b` §F order:

```
ErrorBoundary → ThemeContextProvider → AuthProvider → AdminProvider
             → WishlistProvider → CartProvider → OrderProvider → Router
```

i.e. **Theme → Auth → Admin → Wishlist → Cart → Order** verbatim, and the storefront branch alone is wrapped in `DealsConfigProvider` (`:101`) — "storefront under `DealsConfigProvider`" confirmed. When later prompts rename Cart→Enquiry‑List and Order contexts, they must keep these positions; this note fixes the baseline they preserve.

---

## 3. The negative invariant — what the three side effects *do*, and why the enquiry path must skip them

`02c` verified the anchor: `orders.create` (mock) currently fires all three — `createPaymentForOrder(saved)` ([`api.js:1159`](src/services/api.js)), `redeemCouponByCode` (`:1160`), `debitWallet` (`:1163‑1168`). That is the **correct current‑state** behaviour for the *order* flow. `02e` adds the behavioural justification for `02b` §F/§E's "the enquiry path must fire none of these / cascade helpers stay dormant": each helper mutates exactly one collection the enquiry model **retires**, so firing it from an enquiry would resurrect a retired module.

| Helper | Def | What it mutates | Retired collection |
|---|---|---|---|
| `createPaymentForOrder` | `:277` | `POST /payments` (`:289`) — records a gateway/COD transaction | `payments` |
| `redeemCouponByCode` | `:319` | `PATCH /coupons/:id` `usedCount + 1` (`:326`) | `coupons` |
| `debitWallet` → `writeWalletTransaction` | `:450` → `:419` | `POST /walletTransactions` debit (`:435`) + `syncUserStoreCredit` (`:441`) | `walletTransactions` (+ `users[].storeCredit`) |

→ The "no side effects" rule is not stylistic: an enquiry that reached any of these would write into `payments` / `coupons` / `walletTransactions` — the very stores `02b` §D4/§E retire. The map's constraint is behaviourally grounded, and the helpers can safely go **dormant** (kept, uninvoked) exactly as §E prescribes.

---

## 4. What this closes

With `02e`, the Prompt‑02 map is verified on all three axes — coordinates (`02c`), coverage (`02d`), and now **behaviour** (`02e`). The six invariants prompts `03`–`35` must never break are confirmed to *work as described* at their anchors, so the executing prompts inherit not just trustworthy coordinates but trustworthy **contracts**: renaming Cart→Enquiry‑List keeps `extractData`; retargeting Orders→Enquiries keeps the scoped‑401 auth and the slug/category resolver; deleting the five admin modules keeps the non‑cascading DELETE; and the enquiry submit path has a source‑proven list of side effects to *not* fire.

---

## 5. Reconciliation — two nuances, no defects

1. **`ErrorBoundary` is an additional outermost wrapper the §F chain doesn't name.** [`App.js:66`](src/App.js) wraps `ThemeContextProvider` in `<ErrorBoundary>`. `02b` §F lists the provider order starting at Theme; `ErrorBoundary` sits *outside* that set and carries no context, so the named order (`Theme→Auth→Admin→Wishlist→Cart→Order`) is still exact. Flagged only so the extra outer node isn't mistaken for drift.
2. **The safe‑DELETE invariant is defended on the client too — a strengthening, not a gap.** `02b` anchors the KEEP to `server.js` only, but `deleteWithVerify` ([`api.js:737‑751`](src/services/api.js)) provides a second, client‑side guarantee for developers running a stale or bare `json-server`. This *exceeds* what the map claims and needs no action; recorded so the executing prompts preserve **both** layers, not just the server override.

---

*Behaviour verification complete against the live tree (2026‑07‑01). All six prime‑directive KEEP invariants — dual‑mode API, auth, routing/provider nesting, slug/category rules, safe non‑cascading DELETE — and the negative "no enquiry‑path side effects" rule behave exactly as `02b` describes at the anchors `02c` located and `02d` reconciled. No `src/`, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`. Prompts `03`–`35` execute the `02b` §D checkboxes against contracts now verified on all three axes.*
