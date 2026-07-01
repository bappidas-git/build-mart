# 02d — Spec ↔ Checklist Reconciliation (2026-07-01)

> **Prompt‑02 verification deliverable.** Where `prompts/02c-requirement-map-anchor-verification-2026-07-01.md` proved the checklist's `file:line` anchors reproduce at source, this note proves the complementary direction: that the checklist `prompts/02b-requirement-mapping-checklist-2026-07-01.md` **faithfully and completely covers the spec** `prompts/02-requirement-mapping.md` — every terminology row, status, module decision, acceptance criterion and data/API rule in the spec has a home in the checklist, and the checklist invents nothing the spec doesn't mandate. Bottom line: **complete two‑way coverage — zero gaps, zero phantom items.** The four checklist anchors `02c` did **not** cover (dual‑mode, safe DELETE, category helpers, the 7 docs) were re‑opened at source here and all reproduce. Two non‑defect nuances are recorded in §5.
>
> **Analysis‑only.** No application code, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

---

## 1. Method

`02c` verified anchors → tree (do the cited coordinates hold?). This note verifies spec → checklist (is every spec requirement represented?) and checklist → spec (does the checklist add nothing the spec doesn't authorise?). Each spec element was walked individually and matched to a checklist section; a requirement counts as **covered** only when the checklist carries the same decision with the same target behaviour — not merely a related mention. The four checklist anchors outside `02c`'s scope were then re‑read at source.

---

## 2. Spec → checklist coverage — complete

| Spec (`02`) element | Checklist (`02b`) location | Match |
|---|---|---|
| §5 terminology map — 9 rows | §B — all 9 verbatim | ✅ |
| §8 enquiry statuses — 7 values | §C — all 7 verbatim | ✅ |
| §8 module table — **27 module rows** | §D1–D5 — every row mapped, one action each | ✅ |
| §7 admin KEEP/REMOVE + capture fields | §G | ✅ |
| §5 Users CAN / CANNOT | §H | ✅ |
| §6 data & API rules (orders→enquiries shape, no side effects, dual‑mode) | §F | ✅ |
| §4 removal strategy (routes/nav/pages/dormant helpers/dashboard/notif) | §E — more granular than the spec | ✅ |
| §9 acceptance criteria — 6 items | §I self‑check — all 6 | ✅ |

All **27** rows of the spec's module‑by‑module table (`02` §8, lines 78–104) resolve to exactly one `02b` §D bucket entry with a matching action and target:

- **KEEP** (§D1): Dual‑mode API · Safe DELETE · Auth · `categories.js` helpers · Wishlist · Profile · Reviews · Users.
- **EXTEND / RE‑SKIN** (§D2): Theme · Logo/meta · `products`+PriceBlock · Settings.
- **RENAME / REPURPOSE** (§D3): `categories` data · Cart→Enquiry List · Checkout→Submit Enquiry · OrderConfirmation→Enquiry success · `orders`+AdminOrders→Enquiries · OrderHistory · Leads.
- **REMOVE / RETIRE** (§D4): Buy Now · Payments · Shipping · Coupons · Returns · Special Offers (admin) · Wallet.
- **KEEP / RE‑WORD & REWRITE** (§D5): Policy pages · Docs (7 `.md`).

Reverse direction: the checklist introduces **no module absent from the spec** — every §D item traces back to a spec table row.

---

## 3. Checklist anchors outside `02c`'s scope — verified at source

`02c` verified the `orders.create` side effects, `AdminLayout.menuItems`, the notification poll, the `App.js` admin routes, the 14 page files and the `db.json` collections. It did **not** touch the four anchors below — now confirmed:

| Checklist anchor | Source | Match |
|---|---|---|
| Dual‑mode `api.js:67‑72` (`extractData`) | [`api.js:67`](src/services/api.js) `export const extractData = (response) => {` | ✅ |
| Safe DELETE (`server.js`) | [`server.js:76`](server.js) `server.delete("/:resource/:id", …)`, under the "Safe, non‑cascading DELETE" header (`:71`) + cascade‑disable defense block (`:61‑65`) | ✅ |
| Category helpers (`categories.js`) | [`categories.js:72`](src/utils/categories.js) `getCategoryScopeIds`; slug/param helpers `categoryParam` (26), `resolveCategory` (35), `getDescendantIds` (49) | ✅ |
| 7 REWRITE docs (§D5) | all 7 named files exist at repo root (see §4) | ✅ |

Bonus: every prompt number the checklist §D cites (03, 04, 05, 06, 11, 14–22, 24, 25, 27–31, 34) resolves to a real file — prompts `00`→`35` are complete on disk (`00`, `00b`, `01`, `02`, `02b`, `02c`, and `03`–`35`).

---

## 4. Root‑docs inventory (7 REWRITE targets + 1 excluded)

Checklist §D5 enumerates exactly these **7** docs, all present at repo root: `00_BACKEND_README_AND_CONVENTIONS.md` · `01_DATABASE_SCHEMA.md` · `02_API_ENDPOINTS.md` · `03_BUSINESS_LOGIC_AND_CASCADES.md` · `04_AUTH_ERRORS_AND_EDGE_CASES.md` · `README.md` · `STOREFRONT_UX_GUIDELINES.md`. → matches spec `02` §8 row 104 ("Docs (7 `.md`)") exactly. An **8th** root `.md`, `MASTER_PROMPT.md`, exists but is deliberately out of scope (see §5.2).

---

## 5. Reconciliation — two nuances, no defects

1. **`server.js` safe‑DELETE anchor start line is slightly loose.** `02b` §D1 cites `server.js:67‑95`, but the handler itself begins at `:76` (`:71` is the section header; `:67` falls inside the preceding comment block). The range *does* enclose the handler — a tighter anchor would read `:71‑95`. Cosmetic only; the DELETE override is real and non‑cascading as described.
2. **`MASTER_PROMPT.md` is intentionally outside the docs‑REWRITE scope.** The repo root holds **8** `.md` files, but both the spec (§8 row 104, "7 `.md`") and the checklist (§D5, seven named files) scope the REWRITE to product documentation only, excluding `MASTER_PROMPT.md` (the build‑prompt orchestrator, not shipped docs). The 8‑vs‑7 difference is by design — flagged only so it isn't mistaken for an omission later.

---

*Reconciliation complete against the live tree (2026‑07‑01). `02b` is a complete, faithful expansion of `02`, and every anchor across `02b`/`02c` — including the four `02c` left unchecked — reproduces at source. No `src/`, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`. Prompts `03`–`35` execute the `02b` §D checkboxes against the anchors confirmed here and in `02c`.*
