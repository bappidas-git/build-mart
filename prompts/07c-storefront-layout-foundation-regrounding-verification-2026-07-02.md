# 07c — Prompt-07 Storefront Layout Foundation Re-Grounding Verification (2026-07-02)

> **Re-grounding pass over `07b`.** An independent, source-verified re-derivation of every material claim in `prompts/07b-storefront-layout-foundation-postexec-verification-2026-07-02.md`, run against the **live** `src/App.css`, `src/theme/storefront-tokens.css`, `src/index.css`, `src/App.js` and `src/theme/tokens.js` at the current tree — not by trusting `07b`'s harness output, but by re-reading each file and re-executing the git/grep/build checks from scratch. **No application code, tokens, docs or config were modified by this pass** (this note is the only new artifact). Bottom line: **every substantive `07b` structural assertion reproduces exactly** — the single 1280px token-driven `.container` with 16/20/24 gutters, the token-driven Inter base type, the `--sf-color-bg` shell, the additive `--sf-section-y` rhythm token, the full spacing/radius/shadow/type scales matching `TOKENS`, the grep-clean neon/glass/gradient removal, the byte-identical `App.js`/`index.css`, the preserved scrollbar/admin/SweetAlert2 blocks, and the two-file `70/205` diff footprint. A fresh `CI=true react-scripts build` **compiles successfully**. **One finding** (§5.1): `07b`'s *rationale* for keeping `--text-primary/--text-secondary` is inaccurate — the vars are real but **shadowed**, so removal would be visually inert, not "strip text colour." Plus one cosmetic attribution slip (§5.2). Neither is a code defect; the shell is correct.
>
> **Companion, not a rewrite.** Following the `00b`/`06c` precedent, this note verifies `07b` alongside it rather than editing the committed `07b` text. The corrections in §5 are documented here for a future editor; `07b` is left byte-identical.
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. This pass touched nothing — it only re-reads, re-greps, re-builds and re-asserts.

---

## 1. Method — re-execute, don't trust

`07b` claims "all §9 acceptance criteria pass, verified three ways (build, grep, runtime probe)." Rather than accept that, this pass re-derived the claims directly:

1. **Diff footprint** — `git show 86a3595 --numstat` (the Prompt-07 shell commit) and `git diff HEAD` to confirm the blast radius and that the working tree is clean.
2. **Byte-identity of untouched files** — `git diff 86a3595^ 86a3595 -- src/App.js src/index.css src/theme/tokens.js` (empty = untouched) plus a direct re-read of `App.js`'s provider nesting and route table.
3. **Source re-read** — every value `07b` asserts (container, gutters, base type, `.App`/`.main-content` background, `--sf-section-y`, the dark tokens, the preserved scrollbar/admin/SweetAlert2 blocks) read straight out of the **written** `App.css` / `storefront-tokens.css`, and cross-checked against `TOKENS` in `tokens.js`.
4. **Grep** — a fresh sweep of all of `src/` for every removed class / keyframe / legacy `:root` var, and for the `var(--text-*)` consumers `07b` cites as the reason to keep two vars.
5. **Build** — a fresh `CI=true npm run build` from the current tree.

Every result below is the actual output of those runs, not a restatement of `07b`.

---

## 2. Shell & container — reproduces exactly (§2, §4)

| Check | `07b` claim | Re-grounded result (source) | ✓ |
|---|---|---|---|
| Canonical container width | `1440 → var(--sf-container-max)` = 1280 | `App.css:162` `max-width: var(--sf-container-max, 1280px)`; no `1440` remains | ✅ |
| Container centered | `margin-inline: auto` | `App.css:163` | ✅ |
| Responsive gutters 16/20/24 | mobile-first from `--sf-space-*` | base `--sf-space-4`(16) `:164`; `@media(min-width:768px)`→`--sf-space-5`(20) `:169`; `@media(min-width:1024px)`→`--sf-space-6`(24) `:175` | ✅ |
| Base typography | Inter, 16px, 1.5, `--sf-color-text` | `App.css:32–42` `font-family:var(--sf-font-family…)`, `font-size:var(--sf-text-base)`, `line-height:var(--sf-leading-normal)`, `color:var(--sf-color-text)`, antialiased kept | ✅ |
| `.App` shell | flex column, min-height 100vh, `--sf-color-bg` | `App.css:45–52` | ✅ |
| `.main-content` | `flex:1`, bottom clearance for BottomNav, `--sf-color-bg`, no redundant `padding-top` | `App.css:54–64` — `flex:1`, `padding-bottom:80px` (→ 70px ≤768 `:181–183`), `min-height:calc(100vh-70px)`, **no** `padding-top` | ✅ |
| Breakpoints | 768 / 1024 (+ 769 for `mobile-only`) | `App.css` uses `min-width:768`, `min-width:1024`, `max-width:768`, `min-width:769` only; documented in the `:14–15` header comment | ✅ |

**One precision note (not a defect):** `07b` §4's "Shell integrity" line states `.main-content { padding-bottom: 70px }`. The *base* value is `80px` (`App.css:60`); it steps **down** to `70px` only at `≤768px` (`App.css:182`). `07b`'s "70px" is the mobile value — the one that matters, since `BottomNav` is mobile-only — so the statement is accurate *in context*; the desktop base is simply 80px. Recorded for completeness.

---

## 3. Tokens & scales — reproduces exactly (§2, §4)

**`storefront-tokens.css` scales vs `TOKENS` (`tokens.js`) — matched value-for-value:**

| Scale | `storefront-tokens.css` | `TOKENS` (`tokens.js:27–33`) | ✓ |
|---|---|---|---|
| Spacing (`--sf-space-1..16`) | 4·8·12·16·20·24·32·40·48·64 (`:77–86`) | `space {1:4…16:64}` | ✅ |
| Radius (`--sf-radius-sm..pill`) | 6·10·16·22·999 (`:70–74`) | `radius {sm:6…pill:999}` | ✅ |
| Shadows (`--sf-shadow-xs..lg`) | `xs 0 1px 2px /.06`, `md 0 6px 20px /.10`, `lg 0 12px 32px /.14` (`:89–92`) | *(soft, low-opacity — CSS-only, no JS mirror)* | ✅ |
| Container | `--sf-container-max: 1280px` (`:119`) | `containerMax: 1280` | ✅ |
| Tap target | `--sf-tap-target: 44px` (`:120`) | `tapTarget: 44` | ✅ |
| Type scale | `--sf-text-xs..3xl`, weights 400–700, leading 1.25/1.5 (`:98–111`) | *(CSS-only)* | ✅ |

**Additive `--sf-section-y` (§7 rhythm) — `git show 86a3595 -- storefront-tokens.css` reproduced:**
- `--sf-container-max` annotated with a trailing comment (0 semantic change).
- `--sf-section-y: var(--sf-space-16)` (64px) added to `:root` (`:121`).
- `@media (max-width: 768px) { :root { --sf-section-y: var(--sf-space-10) } }` (40px) added (`:179–183`).
- Diff = **+9 / −1** — matches `07b`'s "one additive layout token."

**Dark-mode tokens (`body.dark`) — read straight from source:** `--sf-color-bg:#0b1a2e` (`:144`), `--sf-color-surface:#122238` (`:145`), `--sf-color-text:#f5f7fa` (`:148`), `--sf-shadow-md:0 6px 20px rgba(0,0,0,.5)` (`:173`). Matches `07b` §4's dark-mode assertion; `.App`/`.main-content` read `var(--sf-color-bg)` so they repaint automatically under `body.dark` — no per-mode `.App` duplicate, exactly as `07b` §3 claims.

---

## 4. Untouched-file & separation guarantees — reproduces exactly (§2, §5, §6)

| Guarantee | `07b` claim | Re-grounded result | ✓ |
|---|---|---|---|
| `src/App.js` byte-identical | provider nesting + routes unchanged | `git diff HEAD -- src/App.js` **empty**; `git diff 86a3595^ 86a3595 -- src/App.js` **empty** | ✅ |
| Provider order | `ThemeContextProvider → AuthProvider → AdminProvider → WishlistProvider → CartProvider → OrderProvider`; storefront in `DealsConfigProvider` | reproduced verbatim `App.js:67–72, 101, 133, 138–143` | ✅ |
| Routes intact | all storefront paths + `/admin/*` | `App.js:78–95` (admin), `:107–126` (storefront: `/`, `/products`, `/products/:slug`, `/wishlist`, `/special-offers`, policy pages, `*`→`/`) | ✅ |
| `src/index.css` untouched | Inter import, token `@import`, `.swal2-container{z-index:2000}` | `index.css:1` (Inter), `:5` (`@import storefront-tokens.css`), `:36–38` (`z-index:2000 !important`); not in commit `86a3595` | ✅ |
| Admin isolation (no token leak) | `/admin` carries no `.App` shell | `App.js` — `.App` lives **only** in the `/*` branch (`:102`, inside `DealsConfigProvider`); the `/admin` branch (`:78–95`) renders `AdminLayout` with **no** `.App`/`.main-content`, so the `--sf-*` storefront surface structurally cannot reach admin | ✅ |
| Admin body-class + scrollbar rules kept | preserved verbatim | `App.css:116–122` (`admin-area.light/.dark` `!important` bg pins), `:124–153` (admin scrollbars) | ✅ |
| SweetAlert2 theming kept | full block preserved | `App.css:196–281` (light/dark/admin/toast) + `index.css:36–38` z-index | ✅ |
| Storefront scrollbars kept | base + light + dark | `App.css:66–109` | ✅ |
| `.desktop-only`/`.mobile-only` helpers kept | preserved | `App.css:185–194` | ✅ |
| Data layer untouched | no `api.js`/`IS_MOCK_API`/`extractData()`/`db.json` edit | none of these appear in commit `86a3595`; `git status` clean | ✅ |
| `adminTheme.js` untouched | admin palette separate | not in commit `86a3595` | ✅ |

**Grep-clean removal (§3) — fresh sweep of all `src/`:** the removed classes (`.glass-effect`, `.neon-glow`, `.gradient-text`, `.gradient-animation`, `.floating`, `.pulse-glow`, `.card-hover`, `.hover-scale`, `.loading-spinner`, `.page-transition-*`), keyframes (`float`, `pulse-glow`, `gradient-shift`, `spin`) and legacy `:root` vars (`--primary-gradient`, `--secondary-gradient`, `--dark-bg`, `--light-bg`, `--glass-bg`, `--glass-border`, `--neon-purple/pink/blue`) return **zero references anywhere in `src/`**. The only hits are five **module-local** `@keyframes spin` definitions in unrelated component modules (AuthModal, SearchModal, OrderConfirmation, SpecialOffers, OrderHistory) — CSS Modules scope keyframe names locally, so these are their own spinner animations, **not** consumers of the deleted global `spin`. `07b` §3's "behaviour-neutral removal" holds.

---

## 5. Findings — one rationale inaccuracy + one attribution slip; no code defect

### 5.1 — RATIONALE INACCURATE (in `07b` §3 / §6.1): the `--text-primary/--text-secondary` retention reason overstates the dependency

`07b` keeps `--text-primary`/`--text-secondary` in `App.css`'s `:root` and justifies it (§6.1): *"still consumed by `Products.module.css` (24 refs) … Retiring them here would strip text colour from the Products page."* Re-grounded against source, two things are off:

1. **The count.** A fresh grep finds **21** `var(--text-*)` consumer occurrences in `Products.module.css` (23 lines mention the names — the extra two are the local *definitions*, below), not 24. No other file in `src/` consumes them.
2. **The dependency — the crux.** `Products.module.css` **redefines both vars itself**, scoped to its `.page` CSS-Module class:

```css
/* Products.module.css:12–17 */
.page {
  --text-primary:   var(--sf-color-text);
  --text-secondary: var(--sf-color-text-secondary);
  …
}
```

All 21 consumers are descendants of `.page`, so they inherit `.page`'s **local** values (aliased to the `--sf-*` tokens) — the nearest-ancestor custom-property lookup resolves at `.page`, never reaching the global `:root`. App.css's `:root` copies are therefore **shadowed and effectively dead**: removing them would be **visually inert**, not "strip text colour from the Products page." (Confirmed by the build compiling and by there being no non-`.page` consumer anywhere.)

**So the code is correct and there is no regression** — the Products page renders identically with or without App.css's copies. Only `07b`'s *reasoning and count* are imprecise. Accurate phrasing for a future edit of `07b` §6.1: *"`--text-primary/--text-secondary` retained as a harmless legacy alias (21 `.page`-scoped consumers, which self-define the vars — so App.css's copies are shadowed and removal is inert). Prompt-12 can drop them with zero visual effect."* Keeping them is a defensible conservative choice; the justification is what needs the correction, not the shell.

### 5.2 — ATTRIBUTION SLIP (in `07b` §2, App.css row): "Net −135 (70 ins / 205 del)" is the *commit* total, not App.css alone

`07b` §2's table attributes "Net **−135 lines** (70 ins / 205 del)" to the `src/App.css` row. Per `git show 86a3595 --numstat`, `70/205/−135` is the **whole-commit** total; **`App.css` by itself is 61 ins / 204 del (−143)** and `storefront-tokens.css` is +9 / −1 (+8). The combined net (−135) is correct; only the per-file attribution is loose. Cosmetic — no material impact.

### 5.3 — CONFIRMED still accurate: `07b` §6.3 carry-forwards
Still owned elsewhere and out of Prompt-07 scope, and untouched by this shell work: stale `banners` slugs → Prompts 10–11 (`06b §5.2`); electronics-worded `reviews` → Prompt-31 (`06b §5.3`); the `/orders`→`/enquiries` code repoint → Prompts 25/28/16–20 (`05b §5.1`). `App.js:115` still carries the `/orders` route (plus `/checkout`, `/order-confirmation`), confirming the enquiry repoint remains pending in its owning prompts. `07b`'s notes hold.

---

## 6. Diff footprint & build — reproduces exactly (§2)

- **Diff footprint.** `git show 86a3595 --name-status` → exactly **two** modified files: `src/App.css` (61/204) and `src/theme/storefront-tokens.css` (9/1); commit total **70 ins / 205 del**. `git diff HEAD` is empty and `git status --porcelain` shows only `?? .claude/` (untracked, unrelated) — the tracked tree is clean.
- **Build.** A fresh `CI=true npm run build` from the current tree → **`Compiled successfully.`** (exit 0), CSS bundle `main.*.css` = **49.98 kB gzip**. The precise "−432 B" delta `07b` cites is not independently reproducible without the pre-refactor bundle, but the clean compile — the pillar claim — reproduces. `build/` is gitignored (`git check-ignore build` → `build`), so the rebuild left the tracked tree untouched.
- **Runtime scope note.** `07b`'s live-Chromium observations that are *structural* (container = 1280, gutters 16/20/24, dark tokens swap, `/admin` carries no `.App`) are re-grounded here from source rather than a browser re-run — consistent with `06c`, which re-ran data harnesses rather than the UI. The *data-dependent* observations (`Home renders 93 cards`, `no ErrorBoundary`) were **not** re-executed in a browser this pass; the shell structure that produces them (intact `.App` → Header → `main` → Footer/BottomNav, data layer untouched) is confirmed present and the build compiles.

---

## 7. Conclusion

`07b` is **faithful to the live repository**. Every material structural assertion — the single 1280px token-driven container with 16/20/24 gutters, the Inter base type scale, the `--sf-color-bg` shell, the additive `--sf-section-y` rhythm token, the spacing/radius/shadow/type scales matching `TOKENS`, the grep-clean neon/glass/gradient removal, the byte-identical `App.js` (provider order + routes) and `index.css` (Inter/`@import`/swal2 z-index), the preserved scrollbar/admin/SweetAlert2 blocks, the structural admin isolation, and the two-file `70/205` diff footprint — reproduces exactly under an independent re-run, and a fresh production build compiles cleanly. The only corrections are documentary: `07b` §6.1's `--text-primary/--text-secondary` retention rationale overstates a dependency that `.page` actually self-satisfies (§5.1 — the code is correct regardless), and §2's `−135` line count is a commit total mis-attributed to `App.css` alone (§5.2). The three carry-forward scope notes remain accurate.

---

*Re-grounding complete against the live `src/App.css`, `src/theme/storefront-tokens.css`, `src/index.css`, `src/App.js`, `src/theme/tokens.js` and `src/pages/Products/Products.module.css` (2026-07-02). No files changed except this note. `.container`=1280 with 16/20/24 gutters · Inter 16px/1.5 base · `--sf-section-y` 64/40 · scales match `TOKENS` (space 4…64, radius 6/10/16/22/999, tap 44, container 1280) · neon/glass/gradient removal grep-clean (5 `@keyframes spin` are module-local) · `App.js` + `index.css` byte-identical to HEAD · admin body-class/scrollbar/SweetAlert2 blocks preserved · `/admin` renders no `.App` shell · `CI=true react-scripts build` → Compiled successfully (CSS 49.98 kB) · commit `86a3595` changed only `App.css` + `storefront-tokens.css` (70/205). Two documentary corrections for `07b` recorded in §5.1 / §5.2 — no code defect.*
