# 15c — Pricing Display Logic Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over the committed Prompt-15 work (`016e34e`) *and* its `15b` post-execution note.** Following the `06c`–`14c` precedent: **re-derive every claim in `15b` and in the Prompt-15 spec's §9/§11 independently from live source, seed data and a fresh build — twice (Prompt-15 and its parent)** — rather than trusting the note. Every material assertion was re-checked by re-reading the four changed files at their line anchors, re-running the git/grep checks, re-inspecting the seeded `db.json` pricing fields, and re-building from scratch. **No application code, tokens, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **all nine §9 acceptance criteria reproduce, and all `15b` claims hold** — one shared `PriceBlock` renders exact / tiered / onEnquiry from real product fields in a compact card form and a full details form; the legacy `{ price, comparePrice, currency, size, showSavings, taxNote }` contract is byte-for-byte intact; every discount is derived from real numbers; the honest media `% OFF` chip is gated to exact-priced cards. Two fresh `CI=true react-scripts build`s compile cleanly — **HEAD JS 384.15 kB / CSS 46.08 kB gzip**, **parent `550a26a` JS 383.14 kB / CSS 45.67 kB** — so Prompt-15's true bundle delta is **+1.01 kB JS / +0.41 kB CSS** (≈ +1034 B / +420 B). The exec diff's **351 ins / 27 del** across 4 files reproduces exactly.
>
> **Companion, not a rewrite.** Following `06c`–`14c`, this note verifies the committed work alongside it and edits nothing — the committed `PriceBlock.*`, `ProductCard.js` and `ProductDetails.js` are left byte-identical; the findings in §7 are recorded for the owning prompts.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Prompt-15 was **extend**: keep the honest-pricing core and the legacy contract, add the priceType-aware display + the two layouts. This pass only re-reads, re-greps, re-inspects the seed, re-builds and re-asserts.

---

## 1. Method — re-execute, don't trust

`15b` asserts a two-way verification: a clean build (+ a parent build for the delta) **and** a live Chromium runtime probe (all three modes in both layouts; the tiered PDP table 1–4/5–19/20+ = ₹340/₹320/₹299 at 0/6/12%; the exact PDP struck compare + savings; the onEnquiry pill with the tax note suppressed; brand tokens; dark-mode legibility; the legacy-numeric slug redirect; console error-free). Rather than accept those, this pass re-derived them:

1. **Diff footprint** — `git show 016e34e --numstat` (blast radius) + `git status --porcelain` (clean tree) + lineage.
2. **Source re-read** — every value the spec §9/§11 and `15b` assert read straight out of the **written** `PriceBlock.js` / `.module.css`, `ProductCard.js`, `ProductDetails.js`.
3. **Contract check** — the consumed surfaces re-read at source (`getProductMinPrice`, `formatCurrency` in `utils/helpers.js`; `--sf-*` palette in `theme/storefront-tokens.css`; the two call sites) to confirm every symbol/prop resolves and is unchanged.
4. **Seed re-inspection** — `db.json` re-counted for the `priceType`/`unitType`/`cardPriceMode`/tier shapes that drive the rendered modes.
5. **Grep** — a fresh sweep for a fabricated-discount path and for hardcoded `₹`/hex.
6. **Build** — a fresh `CI=true npm run build` from the current tree, **and** a second build of the parent `550a26a` to reproduce the true bundle delta.

Every result below is the actual output of those runs — the browser-only observations in `15b` are re-grounded from source + build + seed where not re-executed (see §8), consistent with how `06c`–`14c` re-ran build/seed rather than the UI.

---

## 2. Diff footprint & lineage — reproduce exactly

- **Footprint.** `git show 016e34e --numstat` → exactly **four** files: `PriceBlock.js` (**210/18**), `PriceBlock.module.css` (**118/0**), `ProductCard.js` (**15/5**), `ProductDetails.js` (**8/4**) — total **351 ins / 27 del**. Routes, providers, `db.json`, `utils/*`, `categories`, `PriceBlock` consumers other than the two call sites, and the admin palette are **absent from the diff**. A separate `ebaa98f` adds only `.claude/launch.json` (a `web` preview config; dev tooling, not the feature).
- **Lineage.** `016e34e^` = `550a26a` (Prompt-14 `14c` re-grounding note, no code change) → `0f65425` (`14b`) → `ce35213` (Prompt-14 impl). So Prompt-15 sits directly on the committed, twice-verified Prompt-14 tree — the correct baseline for the bundle delta.
- **Clean tree.** `git status --porcelain` is **empty** after both rebuilds and after the parent checkout was reverted (`build/` is gitignored); HEAD is on `analysis/regrounding-verification-note` (this pass ran atop the `15b` note commit `a02d1d5`) — the verification left the tracked tree byte-identical.

---

## 3. What changed — reproduced at source

| File | Change re-grounded from the written file | ✓ |
|---|---|---|
| **`PriceBlock.js`** | `product` + `mode` props added; legacy contract preserved (explicit `price`/`comparePrice` win). `normalizeTiers` (numeric, `price>0`, sorted asc, [:59](../src/components/storefront/PriceBlock.js)); `derived = getProductMinPrice(product)` ([:89](../src/components/storefront/PriceBlock.js)); `resolveDisplay()` with a **card-only** `cardPriceMode` override ([:110–116](../src/components/storefront/PriceBlock.js)), a `showExactPrice===false` → onEnquiry guard ([:121](../src/components/storefront/PriceBlock.js)) and an empty-tiers → onEnquiry guard. onEnquiry pill ([:128](../src/components/storefront/PriceBlock.js)); tiered card `From ₹X`+chip / tiered details table (`base = tiers[0].price`, [:157](../src/components/storefront/PriceBlock.js), computed discounts, best-value row, `minQty>1` line, [:181](../src/components/storefront/PriceBlock.js)); exact with `unitType` suffix and `compact = product && mode==="card"` ([:225](../src/components/storefront/PriceBlock.js)). | ✅ |
| **`PriceBlock.module.css`** | `.unit`/`.from` (em-scaled), `.enquiry` pill (`--sf-color-primary-soft`/`--sf-color-primary`, size-scoped, [:57–77](../src/components/storefront/PriceBlock.module.css)), gold `.bulkChip` ([:79](../src/components/storefront/PriceBlock.module.css)), `.tierTable` (blue-soft header, zebra, right-aligned tabular-nums, [:103–141](../src/components/storefront/PriceBlock.module.css)), gold `.bestRow` ([:144](../src/components/storefront/PriceBlock.module.css)), `.minOrder`/`.tierDiscount` (green)/`.tierBase`. All `--sf-*`-driven except the two translucent gold-tint backgrounds — `.bulkChip` `rgba(250,156,76,.16)` ([:84](../src/components/storefront/PriceBlock.module.css)), `.bestRow` `rgba(250,156,76,.13)` ([:145](../src/components/storefront/PriceBlock.module.css)) — inlined as accent literals for want of a gold-soft token; no hardcoded hex (grep → 0 new hexes; the gold tints are `rgba`, not hex). | ✅ |
| **`ProductCard.js`** | `<PriceBlock product={product} mode="card" size="sm" />` ([:165](../src/components/storefront/ProductCard.js)); media chip gated by `showsExactPrice`/`showDiscountBadge` ([:75–77, :103](../src/components/storefront/ProductCard.js)); unused `sellingPrice` destructure dropped ([:63](../src/components/storefront/ProductCard.js)). | ✅ |
| **`ProductDetails.js`** | `<PriceBlock product={product} mode="details" price={currentPrice} comparePrice={comparePrice} size="lg" taxNote=… />` ([:362–370](../src/pages/ProductDetails/ProductDetails.js)) — tier table renders; explicit variant price drives exact mode; enquiry-safe note kept (suppressed on onEnquiry). | ✅ |
| **`helpers.js` / `storefront-tokens.css`** | **UNCHANGED** — not in the diff. `getProductMinPrice` (honest `discount = round((compare−price)/compare)`, [helpers.js:24](../src/utils/helpers.js)), `formatCurrency` (INR/en-IN, [helpers.js:13](../src/utils/helpers.js)); tokens `--sf-color-primary` `#1885d8` / `--sf-color-accent` `#fa9c4c` / `--sf-color-discount` `#15803d` ([tokens:29, 35, 65](../src/theme/storefront-tokens.css)). | ✅ |

---

## 4. The pricing fields & the rendered modes — re-derived from the seed

`15b` claims the three modes are driven by real fields. Re-grounding the counts against `db.json` (the pages read them via `apiService.products.*` → `extractData`):

- **28 exact / 32 tiered / 10 onEnquiry** `priceType` values across 70 products; **70** each of `unitType`/`minQty`/`priceTiers`/`showExactPrice`/`showTieredPricing`/`cardPriceMode`.
- **`cardPriceMode` = `from` (32) / `exact` (28) / `onEnquiry` (10)** — in the seed it tracks `priceType`, so on cards the override and the natural mode agree; the mechanism (a card-only override, [PriceBlock.js:113](../src/components/storefront/PriceBlock.js)) is what's verified, not that they must differ.
- **`unitType` = piece (35) / box (16) / kg (8) / bag (7) / sheet (4)** — the suffixes `15b` observed (`/ piece`, `/ sheet`, `/ kg`, `/ box`) all come from real seeded units; `pluralizeUnit` ([:50](../src/components/storefront/PriceBlock.js)) handles the min-order line (`box → boxes`, `kg` invariant).
- **Tier example id 1** = `[{1,340},{5,320},{20,299}]`, base 340 → discounts 0 / round(5.88)=**6** / round(12.06)=**12**, min tier **299** — exactly the table `15b` rendered (**1–4 ₹340 —**, **5–19 ₹320 6% off**, **20+ ₹299 12% off**). onEnquiry id 8 carries `comparePrice:null` and `priceType:onEnquiry` → the pill, no number.

---

## 5. Prompt-15 §9 acceptance — re-derived against source + seed

Every §9 bullet, re-checked (all **PASS**):

- **Three modes from fields** — `resolveDisplay()` maps `priceType` (+ `cardPriceMode`/`showExactPrice`/tier validity) to exact/tiered/onEnquiry; seed carries all three.
- **exact + `unitType` + honest compare/discount/savings; `showExactPrice===false` → onEnquiry** — the original honest render (`hasDiscount = compare > current`) plus the `.unit` suffix; the hide guard at [:121](../src/components/storefront/PriceBlock.js).
- **tiered (details): sorted table, computed discounts vs base, minQty line** — `normalizeTiers` sorts; `base = tiers[0].price`; per-row `round((base−price)/base×100)`; `minQty>1` line ([:181](../src/components/storefront/PriceBlock.js)).
- **tiered (card): compact "From ₹X / unit", no table** — the `mode==="card"` branch renders `From` + min tier + a gold chip only.
- **onEnquiry both modes; empty-tiers fallback** — the pill branch ([:128](../src/components/storefront/PriceBlock.js)); `normalizeTiers([])` → onEnquiry.
- **`cardPriceMode` overrides the card; unset → natural** — applied only under `mode==="card"` ([:113](../src/components/storefront/PriceBlock.js)).
- **`ProductCard` card / `ProductDetails` details** — both call sites confirmed at source.
- **Legacy `price`/`comparePrice` still exact mode** — `product` absent → `compact=false` → the unchanged exact render; `<PriceBlock price={100} comparePrice={150} />` → 33% off by construction.
- **`formatCurrency` INR; `#1885d8`/`#fa9c4c`; dark legible** — every figure via `formatCurrency`; tokens resolve to the brand hexes; the `body.dark` block shifts them (header `#4ea3e3`).

---

## 6. §11 KEEP-invariants — all intact

| Invariant (§11) | Re-grounded result | ✓ |
|---|---|---|
| **Honest-pricing guarantee** | exact from `getProductMinPrice` (`compare−price`); tier from `base−tier`; grep → no author-typed "% off" path | ✅ |
| **Backward compatibility** | legacy contract + `sm`/`md`/`lg` unchanged; only two direct callers; card consumers inherit card mode via `ProductCard` | ✅ |
| **Dual-mode fidelity** | `PriceBlock` never fetches / never branches on `IS_MOCK_API`; same field names both API modes | ✅ |
| **Currency** | always `formatCurrency` (INR/en-IN); no manual `₹` | ✅ |
| **CSS Modules + palette separation** | new styles `--sf-*`-driven except the two gold-tint backgrounds (`.bulkChip`/`.bestRow`) inlined as `rgba(250,156,76,…)` accent literals (no gold-soft token); storefront/admin separation intact, admin palette untouched | ✅ |
| **Price-only** | no cart/buy/checkout wording in `PriceBlock`; enquiry wiring / `cart` key not in the diff | ✅ |

---

## 7. Findings — `15b` claims reconciled; no code defect

### 7.1 — RECONFIRM (12c §5.5 → resolved): the media "% OFF" chip is now consistent with the card price
Re-reading `ProductCard.js` confirms the chip is gated to `priceType==="exact" && showExactPrice !== false` ([:75–77](../src/components/storefront/ProductCard.js)) — so id 1 (tiered, `comparePrice` 420 > 340) shows the Bulk-pricing chip and **no** `% OFF`, while id 2 (exact) shows `20% OFF`. The 12c §5.5 / 15b §5.1 reconciliation holds at source; Prompt-15 §4.6 satisfied.

### 7.2 — RECONFIRM (§4.2/§4.6): the exact CARD stays compact by design
`compact = Boolean(product) && mode==="card"` ([PriceBlock.js:225](../src/components/storefront/PriceBlock.js)) suppresses the inline struck compare/savings on the card (honest via the media chip) and shows the full set on details + legacy. The `?? size==="lg"` savings gate is preserved for legacy callers. Matches `15b` §5.2 — a decision, not a defect.

### 7.3 — RECONFIRM (build delta): +1.01 kB JS / +0.41 kB CSS vs the true parent
Two fresh builds — parent `550a26a` = **JS 383.14 / CSS 45.67 kB** and HEAD = **JS 384.15 / CSS 46.08 kB** — give the true delta **+1.01 kB JS / +413 B CSS**. The CRA-printed `+1.01 kB / +413 B` in the exec build was, this time, measured against the parent artifacts and so matches exactly. `15b`'s absolute figures reproduce.

### 7.4 — NOTE (carried from 15b §5.4): `showTieredPricing===false` → compact "From ₹X" on details
The details view falls back to the compact `From ₹X / unit` when a merchant hides the table ([PriceBlock.js:139](../src/components/storefront/PriceBlock.js)) — honest, never a blank price. All seeded tiered products set `showTieredPricing:true`, so every current PDP renders the table. Not a defect.

---

## 8. Build & runtime-scope note — reproduce exactly

- **Build (HEAD).** A fresh `CI=true npm run build` → **`Compiled successfully.`** (warnings-as-errors — proving the dropped `sellingPrice` left no orphan), JS **384.15 kB** gzip, CSS **46.08 kB** gzip.
- **Build (parent `550a26a`).** A second build → **`Compiled successfully.`**, JS **383.14 kB** gzip, CSS **45.67 kB** gzip. True Prompt-15 delta **+1.01 kB JS / +413 B CSS**. `build/` is gitignored; the parent checkout was reverted and HEAD returned to the branch, leaving the tracked tree clean.
- **Runtime scope.** `15b`'s *structural* live claims (the three modes in both layouts, the tiered table values, the exact PDP compare/savings, the onEnquiry pill with the tax note suppressed, the tokens, dark mode, the legacy redirect) are re-grounded here **from source + seed + build**. The **browser-only** observations (computed `rgb()`, the exact table cell text, "console error-free") were captured in `15b`'s probe and **not** re-executed this pass; their structural basis is confirmed — the blue/gold/green tokens resolve to `#1885d8`/`#fa9c4c`/`#15803d` in source, every imported symbol resolves, the seed carries the 28/32/10 `priceType` split with the id-1 tier ladder, and the build compiles with no errors.

---

## 9. Conclusion

The committed Prompt-15 pricing display is **faithful to the live repository, its own spec, and the `15b` post-execution note**. All nine §9 acceptance criteria reproduce under an independent re-run — one `PriceBlock` renders exact / tiered / onEnquiry from real fields, compact on the card (`₹X / unit`, `From ₹X / unit` + a gold bulk chip, or a blue "Price on Enquiry" pill) and full on the PDP (honest compare/discount/savings, or a sorted quantity-vs-price table with computed per-unit discounts, a gold best-value row and a minQty line, or the pill); `cardPriceMode` overrides the card only; the legacy `price`/`comparePrice` contract is byte-for-byte intact; every discount is derived from real numbers; the media chip is reconciled to the card price. The §11 KEEP invariants (honest pricing, backward compatibility, dual-mode fidelity with no in-component fetch/`IS_MOCK_API`, `formatCurrency` everywhere, CSS-Module/palette separation, price-only) all hold. Two fresh production builds compile cleanly (HEAD 384.15 / 46.08 kB; parent `550a26a` 383.14 / 45.67 kB → +1.01 kB JS / +0.41 kB CSS), and the diff's 351 ins / 27 del across 4 files reproduces exactly. The four findings are reconfirmations/nuances, not defects. Prompt-15 is enquiry-correct, honest, and behaviourally sound.

---

*Re-grounding complete against the live `storefront/PriceBlock.js`/`.module.css`, `storefront/ProductCard.js`, `pages/ProductDetails/ProductDetails.js` and the consumed `utils/helpers.js`, `theme/storefront-tokens.css`, `db.json` (2026-07-02). No files changed except this note. One PriceBlock, three modes × two layouts · exact `₹X/unit` (+ honest compare/discount/savings on details/legacy) · tiered card `From ₹X/unit` + gold bulk chip · tiered details quantity-vs-price table (base-tier discounts, gold best row, minQty line) · onEnquiry blue "Price on Enquiry" pill (+ empty-tiers & hidden-exact fallback) · cardPriceMode = card-only override · legacy `price`/`comparePrice` contract intact (33% off) · media `% OFF` chip gated to exact cards · seed 28 exact / 32 tiered / 10 onEnquiry, units piece/box/kg/bag/sheet · commit `016e34e` = 4 files, 351/27, parent `550a26a` · `CI=true react-scripts build` → Compiled successfully, HEAD JS 384.15 / CSS 46.08 kB, parent 383.14 / 45.67 → +1.01 kB JS / +413 B CSS · working tree clean. Four reconfirmations/nuances in §7 — no code defect.*
