# 03 — Brand System & Theme

## 1. Objective

Re‑skin the entire application from the boilerplate's purple/indigo palette to the **North East Build Mart (NEBM)** brand: **Primary Blue `#1885d8`** (with tints/shades and subtle gradients) and **Accent Gold/Orange `#fa9c4c`** (highlights only, used sparingly). Establish a premium, minimal, **Apple‑style** design system — clean Inter type scale, disciplined spacing, gentle radii, soft shadows — while **preserving the token architecture** (CSS custom properties consumed by CSS Modules; `colors.js` consumed by MUI) and the **storefront ↔ admin palette separation**. This prompt gives concrete before→after hex swaps.

## 2. Context / background

NEBM — *"Deals in all kinds of building materials for interior and exterior use."* Lawkhuwa Road, Nagaon, Assam – 782002. Brand Blue `#1885d8`, Accent Gold/Orange `#fa9c4c`. Aesthetic: generous white space, clean typography, soft shadows, rounded cards, professional product grids, minimal elegant animation, mobile‑first, fast — **not** overloaded or overly colourful. Design references (inspiration only, never copy): hindware.com, petradoor.com, infra.market, ibo.com.

Theming architecture (verified, from `prompts/00-analysis-and-requirement-map.md`):
- **Storefront** reads colours/spacing/radius/shadows/type from **CSS custom properties** in `src/theme/storefront-tokens.css` (`--sf-*`), imported via `src/index.css`. Light mode = `:root`; dark mode = `body.dark` (toggled by `ThemeContext`). A JS mirror of structural tokens lives in `src/theme/tokens.js` (`TOKENS`).
- **MUI layer** (admin + the few MUI‑based storefront bits) reads `src/theme/colors.js` (`LIGHT`/`DARK`). The **admin has its own palette** in `src/theme/adminTheme.js` (restrained indigo/slate) and is **intentionally separate** from the storefront brand.
- Legacy global styles live in `src/App.css` and `src/index.css` (scrollbars, glass/neon effects, SweetAlert2 theming). Inter is already loaded via Google Fonts in `index.css` and `public/index.html`.

Current brand hex to replace: `#667eea` (primary), `#764ba2` (gradient partner), `#f093fb` (secondary), and the dark‑mode `#a855f7`/`#ec4899`.

## 3. Files & folders to inspect

- `src/theme/colors.js` — MUI `LIGHT`/`DARK` (primary/secondary/gradient).
- `src/theme/storefront-tokens.css` — `--sf-*` custom properties; `:root` (light) + `body.dark` (dark).
- `src/theme/tokens.js` — `TOKENS` (radius/space/breakpoints); `STOREFRONT_CONFIG`.
- `src/theme/adminTheme.js` — MUI admin theme (keep its slate/indigo identity; only align neutrals if needed).
- `src/index.css` — Inter `@import`, storefront‑tokens `@import`, SweetAlert2 z‑index.
- `src/App.css` — `:root` legacy gradient vars, scrollbars, glass/neon, SweetAlert2 colour blocks, `.gradient-text`, `.loading-spinner`.
- Consumers to spot‑check after: `src/components/Header/Header.module.css`, `src/components/Footer/Footer.module.css`, `src/components/storefront/*.module.css`, `src/context/ThemeContext.js` (writes body background inline), `public/index.html` (theme-color + loader gradient — coordinate with `prompts/04`).

## 4. Step-by-step implementation instructions

1. **`src/theme/colors.js` — `LIGHT`:** set `primary` `{ main: "#1885d8", light: "#4ea3e3", dark: "#1069b0" }`; `secondary` `{ main: "#fa9c4c", light: "#fcb576", dark: "#e07f2b" }`; keep `background`/`text` neutrals (optionally warm‑neutralise `background.default` to `#f4f7fb`). Gradients: `primary: "linear-gradient(135deg, #1885d8 0%, #1069b0 100%)"`, `primaryReverse: "linear-gradient(135deg, #1069b0 0%, #1885d8 100%)"`, `hero: "linear-gradient(135deg, #1885d8 0%, #1069b0 55%, #4ea3e3 100%)"`; `bodyBackground: "linear-gradient(135deg, #f4f7fb 0%, #ffffff 100%)"`.
2. **`src/theme/colors.js` — `DARK`:** set `primary` `{ main: "#4ea3e3", light: "#7bbced", dark: "#1885d8" }` (lift the blue for contrast on dark surfaces); `secondary` `{ main: "#fa9c4c", light: "#fcb576", dark: "#e07f2b" }`; gradients use the blue pair; keep dark backgrounds but consider a deep navy (`#0b1a2e` / `#122238`) that reads as "blue brand dark" rather than purple.
3. **`src/theme/storefront-tokens.css` — `:root` (light):** swap `--sf-color-primary: #1885d8`; `--sf-color-primary-dark: #1069b0`; `--sf-color-primary-light: #4ea3e3`; `--sf-color-primary-soft: rgba(24, 133, 216, 0.10)`; `--sf-color-secondary: #fa9c4c`; `--sf-color-accent: #fa9c4c`; `--sf-gradient-primary: linear-gradient(135deg, #1885d8 0%, #1069b0 100%)`; `--sf-gradient-primary-hover: linear-gradient(135deg, #1069b0 0%, #1885d8 100%)`; `--sf-shadow-focus: 0 0 0 3px rgba(24, 133, 216, 0.45)`. Keep semantic tokens (success/warning/danger/info) unless they clash. Set `--sf-color-badge-bg: rgba(24, 133, 216, 0.08)`.
4. **`src/theme/storefront-tokens.css` — `body.dark`:** keep the dark‑mode block; swap `--sf-color-primary: #4ea3e3`; `--sf-color-primary-dark: #1885d8`; `--sf-color-primary-light: #7bbced`; `--sf-color-primary-soft: rgba(78, 163, 227, 0.16)`; `--sf-color-secondary: #fa9c4c`; `--sf-color-accent: #fa9c4c`; blue gradients; `--sf-shadow-focus: 0 0 0 3px rgba(78, 163, 227, 0.5)`. **Do not remove the `body.dark` mechanism.**
5. **`src/theme/tokens.js`:** `TOKENS` is structural (radius/space/breakpoints) — keep. Confirm the radius scale (`sm:6, md:10, lg:16, xl:22, pill:999`) and spacing (4px base) match the tokens CSS; adjust only if you also change the CSS so JS and CSS stay in sync.
6. **`src/theme/adminTheme.js`:** the admin stays on its own slate/indigo system by design. Leave the indigo primary as‑is **unless** the brief for a given batch says to blue‑align it; if aligning, change only `palette.primary` to the blue family and keep the flat 6/8px radii, hairline borders and uppercase table headers. Storefront/admin separation must remain intact.
7. **`src/App.css`:** update the legacy `:root` gradient vars and effects to brand blue: `--primary-gradient: linear-gradient(135deg, #1885d8 0%, #1069b0 100%)`; retire/repoint the pink `--secondary-gradient` to a blue→gold accent only where used; scrollbars (`::-webkit-scrollbar-thumb`, `body.light`/`body.dark` variants) to the blue gradient; `.gradient-text` and `.loading-spinner` to blue; glass/neon `rgba(102,126,234,…)` → `rgba(24,133,216,…)` and `rgba(168,85,247,…)` (dark) → the dark blue tint. Keep the admin scrollbar/slate blocks unchanged.
8. **`src/App.css` SweetAlert2 blocks:** swap `--swal2-confirm-button-background-color` and focus/timer colours from `#667eea`/`#a855f7` to `#1885d8` (light) and `#4ea3e3` (dark). Leave the `body.admin-area` SweetAlert blocks on the admin palette. Per‑call `confirmButtonColor` (destructive reds) must still win.
9. **`src/context/ThemeContext.js`:** it writes an inline body background before/after mount — update those two gradients to the blue light/dark pair so the first paint matches (coordinate the identical inline gradient in `public/index.html`, handled in `prompts/04`).
10. **Type scale, spacing, radius, shadows (Apple‑minimal).** Confirm the Inter family is the base font everywhere. Keep the `--sf-text-*` scale (xs .75 → 3xl 2.25rem) and weights (400–700); favour 400/500 body, 600/700 headings, `-0.01em` heading letter‑spacing (already in `adminTheme.js`). Keep radii soft (cards `--sf-radius-lg:16px`, controls `--sf-radius-md:10px`) and shadows soft/low‑spread (`--sf-shadow-sm/md/lg`). Prefer generous white space and restraint — gold `#fa9c4c` only on hover/active accents, badges, small icons, CTAs; never large fills.
11. **Sweep for stragglers.** Grep the storefront CSS Modules and any inline styles for the old hexes and replace with `var(--sf-*)` tokens (not hardcoded new hex): `#667eea`, `#764ba2`, `#f093fb`, `#8b9af3`, `#4c5ed0`, `#a855f7`, `#ec4899`, `#c084fc`, `#f472b6`. Leave genuinely neutral greys.

## 5. UI/UX requirements

- **Primary Blue `#1885d8`** for buttons, links, active states, focus rings, primary gradients. **Accent Gold/Orange `#fa9c4c`** sparingly — badges, hover/active accents, small icons, CTA highlights.
- Apple‑minimal: clean hierarchy, generous white space, soft shadows, rounded cards, subtle/elegant motion, mobile‑first.
- Keep dark mode fully working via `body.dark`; brand it blue (not purple).
- Maintain WCAG‑adequate contrast: `#1885d8` on white passes for large text/UI; use `dark` shades (`#1069b0`) for text‑on‑light where needed; white text on `#1885d8` fills is fine.

## 6. Data & API requirements

N/A — this is a pure presentation/theme change. No `db.json`, `api.js`, or dual‑mode logic is touched. (Note the `settings.store.logo/favicon` and brand facts are handled in `prompts/04`/`prompts/05`.)

## 7. Admin panel requirements

Admin keeps its **separate** slate/indigo design language (`adminTheme.js`). Do not leak storefront brand colours into the admin unless a batch explicitly asks to blue‑align `palette.primary`; even then, preserve the flat aesthetic (6/8px radii, hairline borders, uppercase table headers, soft chip tones) and the `body.admin-area` overrides in `App.css`.

## 8. Storefront requirements

Every storefront surface (Header, Footer, hero, product grids/cards, PriceBlock, drawers, modals, badges, buttons, links, focus rings, scrollbars) resolves brand colour from `--sf-*` tokens and now renders in Blue `#1885d8` + Gold `#fa9c4c`. No component should hardcode a brand hex — it reads `var(--sf-color-primary)` etc. Dark mode mirrors via `body.dark`.

## 9. Acceptance criteria

- [ ] `colors.js` `LIGHT.primary.main === "#1885d8"`, `secondary.main === "#fa9c4c"`; gradients use the blue pair; `DARK` mirrors with a lifted blue.
- [ ] `storefront-tokens.css` `:root` has `--sf-color-primary: #1885d8` and `body.dark` has a blue primary; both retain the full token set and the `body.dark` mechanism.
- [ ] No `#667eea`, `#764ba2`, `#f093fb`, `#a855f7`, or `#ec4899` remains in storefront theme/CSS files or storefront CSS Modules (admin slate/indigo excepted).
- [ ] `App.css` scrollbars, `.gradient-text`, `.loading-spinner`, glass/neon and storefront SweetAlert2 blocks are blue; admin blocks untouched.
- [ ] Inter type scale, spacing (4px base), soft radii and soft shadows are intact; gold used sparingly.
- [ ] Storefront ↔ admin palette separation preserved; token architecture (CSS vars for CSS Modules, `colors.js` for MUI) unchanged.
- [ ] Light and dark modes both render correctly; no white‑screen.

## 10. Testing / verification steps

1. `npm run dev`; open `http://localhost:3000`. Header, buttons, links, badges and the hero read Blue `#1885d8` with Gold `#fa9c4c` accents.
2. Toggle dark mode (header/theme toggle) — verify `body.dark` swaps to the blue‑brand dark palette with adequate contrast; no purple/pink residue.
3. Hover a primary button and focus an input — hover gradient and focus ring are blue.
4. Trigger a SweetAlert2 confirm on the storefront — confirm button is blue; a destructive confirm (per‑call red) still shows red.
5. Open `/admin` → login → dashboard: admin remains on its own slate/indigo theme (unchanged).
6. Grep the repo for old hexes to confirm the sweep: search `667eea`, `764ba2`, `f093fb`, `a855f7`, `ec4899` and verify only intentional (admin) matches remain.

## 11. Notes on preserving existing functionality

Do **not**:
- Break the **token architecture** — CSS Modules keep consuming `var(--sf-*)`; MUI keeps consuming `colors.js`; keep JS `TOKENS` in sync with the CSS.
- Merge or blur the **storefront ↔ admin palette separation** (`adminTheme.js` stays its own system; `body.admin-area` overrides stay).
- Remove the **dark‑mode `body.dark`** mechanism or the reduced‑motion `@media` block.
- Touch the **dual‑mode API**, **auth**, **routing/provider nesting**, **slug/category rules**, or the **safe non‑cascading DELETE** — none are involved here.
- Hardcode new brand hex into components; reference tokens instead.
- Change `db.json` or any API behaviour. This prompt is presentation‑only.
