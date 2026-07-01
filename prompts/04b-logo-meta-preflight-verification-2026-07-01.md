# 04b — Prompt-04 Logo/Meta Pre-flight Verification (2026-07-01)

> **Prompt‑04 pre‑flight deliverable — the verification chain moves from the theme re‑skin to the brand‑asset wiring.** `03c` closed the loop on the first execution prompt (theme re‑skin `441d8b6`) and handed forward exactly one live surface: **`public/index.html` still holds the old purple/pink palette** (`03c §5.3`), the one known remaining old‑brand artifact. `prompts/04-logo-and-icon-integration.md` is the prompt that finally touches it — NEBM logo/icon across Header, Footer, admin `AdminLayout`/`AdminLogin`, plus `public/index.html` head/splash/pre‑mount and `public/manifest.json`. This note applies the same source‑verification discipline `03b` used for Prompt‑03: does every **before** state Prompt‑04 promises to transform actually exist at the cited anchor in the *current* tree? Bottom line: **every Prompt‑04 before‑state anchor reproduces verbatim; the loading‑screen mechanism, local icon fallbacks and admin palette Prompt‑04 must preserve all have real referents; and Prompt‑04 closes the `03c §5.3` `public/index.html` carry‑forward.** Two *substantive* findings — the splash recolor surface is far broader than Prompt‑04 §2 states, and `APP_NAME` is `.env`‑derived so editing `constants.js` alone is insufficient — plus two nuances are recorded in §5 with exact coordinates.
>
> **Analysis‑only.** No application code, `db.json`, `server.js`, `public/`, root docs or config were modified by *this note* — only this file was added under `prompts/`. Prompt‑04 has **not** executed (git tree clean; `public/index.html` unchanged since `441d8b6`).
>
> **Prime directive (unchanged):** *analyze → reuse → refactor → rename → redesign → extend*. Never rewrite from scratch; never break the dual‑mode API layer, auth, routing, slug/category rules or the safe non‑cascading DELETE.

---

## 1. Method — verify Prompt‑04's before‑image before it executes

`03b` verified Prompt‑03's before‑image; `03c` verified its landed after‑image. Prompt‑04 is next and **not yet executed**, so this is a pre‑flight pass in the `03b` mould: a Prompt‑04 anchor counts as **verified** only when the cited file holds the cited construct **verbatim now** — the current title string, the current `theme-color` hex, the current placeholder `LOGO` URL, the current inline‑icon logo block — not a same‑named token "somewhere in the file." Every file Prompt‑04 §3 lists was re‑opened (`public/index.html`, `public/manifest.json`, `Header.js`, `Footer.js`, `AdminLayout.js`, `AdminLogin.js`, `constants.js`), the `.env` override was read, the three local icon fallbacks were stat‑checked, and `public/index.html`'s palette was swept two ways (hex **and** `rgba()`) — because `03b §5.1`/`03c §5.2` established that a hex‑only sweep under‑counts residue.

---

## 2. Prompt‑04 before‑state anchors — reproduced at source

Every current value Prompt‑04 §2/§4 names as the "before" resolves exactly:

| Prompt‑04 target | Source anchor | Current (before) value | Match |
|---|---|---|---|
| Document `<title>` | [`index.html:75`](public/index.html) | `My Store - Shop the Best Products Online` | ✅ |
| `theme-color` | [`index.html:8`](public/index.html) | `#667eea` | ✅ |
| description / keywords / author | [`index.html:9‑17`](public/index.html) | generic "online shopping…" copy; author `My Store` | ✅ |
| Open Graph (type/url/title/desc/image) | [`index.html:20‑30`](public/index.html) | `og:url https://mystore.com/` · `og:title "My Store - Shop…"` · `og:image …/logo512.png` | ✅ |
| Twitter (card/url/title/desc/image) | [`index.html:33‑43`](public/index.html) | `twitter:url https://mystore.com/` · title/desc `My Store` · image `logo512.png` | ✅ |
| favicon / alternate / apple‑touch | [`index.html:5‑6`](public/index.html), [`:45`](public/index.html) | `favicon.svg` · `logo192.png` · apple‑touch `logo192.png` | ✅ |
| Splash wordmark + tagline | [`index.html:439‑440`](public/index.html) | `MY STORE` · `Your Online Shopping Destination` | ✅ |
| Splash inline SVG cube | [`index.html:418‑436`](public/index.html) | 3‑path cube, violet→pink gradient stops | ✅ |
| Splash accent palette | [`index.html:157‑290`](public/index.html) | `#a78bfa`/`#ec4899` + `rgba(139,92,246,…)`/`rgba(236,72,153,…)` (see §5.1) | ✅ |
| Pre‑mount theme script | [`index.html:481‑491`](public/index.html) | `body.dark`/`body.light` + `localStorage("theme")`; dark bg `#0a0e27/#1a1f3a`, light `#f5f7fa/#ffffff` | ✅ |
| `manifest.json` identity | [`manifest.json:2‑27`](public/manifest.json) | `short_name "My Store"` · `name "My Store - Online Shopping"` · `theme_color #667eea` · `background_color #f5f7fa` · icons `favicon.svg`/`logo192.png`/`logo512.png` | ✅ |
| `AdminLayout` `LOGO` placeholder | [`AdminLayout.js:39`](src/components/AdminLayout/AdminLayout.js) | `https://placehold.co/160x40/4f46e5/ffffff?text=LOGO` (drawer `<img>` alt at [`:337`](src/components/AdminLayout/AdminLayout.js)) | ✅ |
| `AdminLogin` `LOGO` placeholder | [`AdminLogin.js:21`](src/pages/Admin/AdminLogin.js) | `https://placehold.co/210x70/4f46e5/ffffff?text=LOGO` (`<img height:56>` at [`:136‑139`](src/pages/Admin/AdminLogin.js)) | ✅ |
| Header logo block (no image) | [`Header.js:206‑215`](src/components/Header/Header.js) | `<Link to="/" className=logoLink>` → `motion` (`whileHover 1.03`/`whileTap 0.97`) → `<ShoppingCart>` in `logoIcon` + `<span logoText>{APP_NAME}</span>`; `isMobile` at [`:70`](src/components/Header/Header.js) | ✅ |
| Footer brand (text) | [`Footer.js:178`](src/components/Footer/Footer.js) | `<h4 className={styles.brandName}>{APP_NAME}</h4>` (also copyright [`:341`](src/components/Footer/Footer.js)) | ✅ |
| `APP_NAME` source | [`constants.js:2`](src/utils/constants.js) | `process.env.REACT_APP_NAME \|\| "My Store"` | ✅ |
| `.env` override | `.env` | `REACT_APP_NAME=My E-Commerce Store` (see §5.2) | ✅ |
| Local icon fallbacks | `public/` | `favicon.svg` · `logo192.png` · `logo512.png` all present on disk | ✅ |

→ Prompt‑04's §9 acceptance targets all have a genuine before‑image to act on: two `placehold.co/4f46e5` `LOGO` constants to replace, a text‑only Header/Footer brand to swap for `<img>`, a `#667eea` `theme-color`/`mystore.com` head to rewrite, and a "MY STORE" purple splash to re‑brand.

---

## 3. Structural invariants Prompt‑04 must preserve — real referents at baseline

Prompt‑04 §11 forbids breaking these; each is verified present **now**, so "preserve" has a real target:

- **Loading‑screen mechanism is intact.** `#loading-screen` ([`index.html:92`](public/index.html)); the `react-loaded` toggle is genuinely set from React at [`src/index.js:45`](src/index.js) (`document.body.classList.add("react-loaded")`) — the class the HTML watches for; the `MutationObserver` fade‑out ([`index.html:515‑526`](public/index.html)); and the **10s safety** `setTimeout(hideLoadingScreen, 10000)` ([`index.html:529`](public/index.html)). All four pieces Prompt‑04 §11 says "do not break" exist.
- **Pre‑mount `body.dark`/`body.light` + `localStorage` logic present.** The IIFE at [`index.html:481‑491`](public/index.html) reads `localStorage.getItem("theme")`, adds `dark`/`light` to `<body>`, and sets `document.body.style.background` — the block Prompt‑04 §8/§11 says to recolor **without removing its class/`localStorage` logic**.
- **Local icon fallbacks present.** `public/favicon.svg`, `public/logo192.png`, `public/logo512.png` all exist — the graceful fallbacks Prompt‑04 §10/§11 says to keep if Cloudinary is unreachable.
- **Admin palette untouched by scope.** Prompt‑04 §7/§11 change only the admin *logo image*, not `adminTheme.js` — which `03c §3` already verified still builds on indigo `#4f46e5`/`#818cf8`. Prompt‑04 leaving it alone preserves the storefront↔admin separation `03c` confirmed.

---

## 4. Hand‑off from `03c` — the six KEEP invariants vs Prompt‑04's blast radius

Prompt‑04 §6 declares data/API scope **N/A** ("this prompt does not call the API") and §11's "do not alter" list is *verbatim* the six invariants `02e` verified: **dual‑mode API · auth · routing/provider nesting · slug/category rules · safe non‑cascading DELETE**. At **file granularity** the hand‑off is clean for five of six — Prompt‑04 never opens `api.js`, `server.js`, `App.js`, `categories.js` or `db.json`.

**But note a real scope shift from Prompt‑03.** Prompt‑03 edited only theme/CSS files, so it *structurally could not reach* behaviour. Prompt‑04's edit set includes **behaviour‑bearing components** — `Header.js` (which also hosts `handleLogout` at [`:491`](src/components/Header/Header.js) and the nav/`<Link>` tree), `AdminLogin.js` (the admin auth screen) and `AdminLayout.js` (the admin shell). Prompt‑04's *instructions* touch only the logo node in each (replace the inline `<ShoppingCart>`/`{APP_NAME}`/`placehold.co` with an `<img>`, keep `<Link to="/">` and motion), but the discipline is therefore **surgical**, not **hermetic**: the guarantee is "edit only the logo element," not "these files are outside the blast radius." Recorded so the executor treats the auth/nav wiring in those files as read‑only and does not refactor around the logo swap.

---

## 5. Reconciliation — two findings, two nuances

### 5.1 — FINDING (no current defect): Prompt‑04 §2 under‑states the splash recolor surface

Prompt‑04 §2 characterises the loading splash as rendering "over a purple gradient (`#667eea`/`#764ba2`)," and §6/§9 name only `#667eea` as the `theme-color` to change. A source sweep shows the splash's actual colour surface is **broader and mostly not `#667eea`/`#764ba2`** — that pair appears only in the CSS `body` rule ([`index.html:87`](public/index.html)) and the head `theme-color` ([`:8`](public/index.html)). The splash *itself* is coloured by an entirely different violet/pink set:

| Recolor target | Where (`public/index.html`) | In §2's `#667eea/#764ba2`? |
|---|---|---|
| `#a78bfa` (wordmark, spinner border, spinner‑dot, SVG stops) | `:175`, `:215‑216`, `:241`, `:424/:428/:432` | ❌ |
| `#ec4899` (wordmark, progress bar, SVG stops) | `:175`, `:290`, `:425/:429/:433` | ❌ |
| `rgba(139, 92, 246, …)` (logo‑icon box, spinner track, progress track, `::before` glow) | `:115`, `:157/:159/:161`, `:204`, `:282` | ❌ |
| `rgba(236, 72, 153, …)` (logo‑icon box, spinner inner, `::before` glow) | `:116`, `:157`, `:228‑229` | ❌ |
| `rgba(167, 139, 250, .8)` (spinner‑dot shadow) | `:243` | ❌ |
| `#667eea` / `#764ba2` (CSS `body` gradient) | `:87` | ✅ (only this) |

**Why it's not a current defect:** Prompt‑04 §7 says to "recolour the splash gradients, spinner and progress bar" and §7 explicitly re‑authors the whole splash markup (SVG → `<img>`, wordmark text) — so an executor who **replaces the whole `<style>` block** catches everything. The genuine exposure is an executor who trusts §2/§6's `#667eea`‑centric framing and **greps only `667eea`/`764ba2`**: that would recolor line 87 and the head, and leave the entire violet/pink splash (`#a78bfa`, `#ec4899`, `rgba(139,92,246)`, `rgba(236,72,153)`, `rgba(167,139,250)`) untouched — contradicting §5's "splash uses the logo icon on a brand‑blue gradient." This is precisely the `03b §5.1` lesson (enumerated hexes necessary‑but‑not‑sufficient), and it confirms `03c §5.2`'s generalisation that residue hides in `rgba()` too. **Recommendation:** treat the splash as "replace whole block + grep a superset" — sweep `a78bfa, ec4899, 8b5cf6/rgba(139,92,246), rgba(236,72,153), rgba(167,139,250)` **in addition to** `667eea/764ba2`, and add them to any post‑exec verification grep. (`rgba(59,130,246,…)` at [`:117`](public/index.html) is already blue and may stay.)

### 5.2 — FINDING (derived value, parallel to `03c §5.2`): `APP_NAME` is `.env`‑sourced, so `constants.js` alone is insufficient

Prompt‑04 §4.1 says "Set `APP_NAME = "North East Build Mart"`." But `APP_NAME` is **not a literal** — it is `process.env.REACT_APP_NAME || "My Store"` ([`constants.js:2`](src/utils/constants.js)), and `.env` sets `REACT_APP_NAME=My E-Commerce Store`. Two consequences:

1. **The visible brand today is "My E‑Commerce Store," not "My Store."** The Header ([`Header.js:215`](src/components/Header/Header.js)) and Footer ([`Footer.js:178`](src/components/Footer/Footer.js)) render the `.env` value — so Prompt‑04 §9's acceptance "no 'My Store' text visible anywhere in header/footer" is aimed at a string that is *already not rendered*. The real thing to eliminate is "My E‑Commerce Store."
2. **Editing only the `constants.js` fallback is a no‑op at runtime.** If the executor changes `|| "My Store"` to `|| "North East Build Mart"` but leaves `.env` as `My E-Commerce Store`, the `.env` value still wins and the header/footer keep showing the stale name. **Recommendation:** update `REACT_APP_NAME` in `.env` to `North East Build Mart` **as well as** (or instead of) the fallback — mirroring `03c §5.2`'s "derived‑value ≠ hardcoded‑value" correction. This is the single most likely way Prompt‑04's acceptance passes a grep but fails on screen.

### 5.3 — NUANCE: two different "body‑background gradients" — distinguish the CSS rule from the pre‑mount script

Prompt‑04 §8 says to "update the two inline body‑background gradients (light/dark)." Precisely: those two live in the **pre‑mount script** ([`index.html:489‑490`](public/index.html)) — dark `#0a0e27/#1a1f3a` (navy) and light `#f5f7fa/#ffffff`. These are **not** purple; to "match `prompts/03`" the dark one should become the brand navy `#0b1a2e/#122238` (`colors.js` `DARK.background`). Separately, the CSS `body { background: … #667eea/#764ba2 }` ([`index.html:87`](public/index.html)) **is** the purple gradient — but it is **overridden at runtime** by the script's inline `body.style.background`, so it is effectively never painted. It is still old‑brand residue and should be recolored (or removed), but the executor should not mistake it for §8's "two gradients" — they are the script pair, whose dark value is navy, not purple. Getting this wrong means recoloring the invisible rule and leaving the actual first‑paint gradient stale.

### 5.4 — NUANCE (scope closure): Prompt‑04 is what closes `03c §5.3`; `--neon-purple` (§5.4) is *not* its job

`03c §5.3` flagged `public/index.html` as "the one known remaining old‑brand surface," deferred to Prompt‑04, and warned of a first‑paint purple flash until it lands. Confirmed still true (24 old‑palette occurrences across the file). **Prompt‑04 is exactly the prompt that closes it** — once §6/§7/§8 land, the pre‑mount flash is resolved and the last old‑brand artifact is gone. Conversely, the *other* `03c` carry‑forward — the cosmetic `--neon-purple: #1885d8` name in [`App.css:16`](src/App.css) (`03c §5.4`) — is **out of Prompt‑04's scope** (it is a CSS var in `App.css`, not an asset/meta concern) and should not be conflated into this prompt; it remains a later‑cleanup / Prompt‑35 item. Recorded so the executor closes the right carry‑forward and doesn't scope‑creep the other.

---

## 6. What this opens

`04b` closes the analysis→execution gap for the **second** build prompt and the one that finishes the brand foundation. Prompt‑04's before‑image is confirmed real on every anchor; the loading‑screen mechanism, pre‑mount theme logic, local icon fallbacks and admin palette it must preserve all have verified referents; and at file granularity it stays clear of five of the six KEEP invariants (with a surgical‑discipline caveat for the auth/nav components it edits). The executor inherits from this note two concrete corrections that turn Prompt‑04's own acceptance criteria into something the method actually achieves — (a) recolor the **whole splash palette** (`#a78bfa`/`#ec4899`/`rgba(139,92,246)`/`rgba(236,72,153)`), not just `#667eea`/`#764ba2` (§5.1); (b) update **`.env` `REACT_APP_NAME`**, not just the `constants.js` fallback (§5.2) — plus the two‑gradients distinction (§5.3) and the confirmation that Prompt‑04 closes the `03c §5.3` `public/index.html` carry‑forward while `--neon-purple` (§5.4) stays out of scope.

---

*Pre‑flight verification complete against the live tree (2026‑07‑01). Every Prompt‑04 before‑state anchor reproduces at source; the loading‑screen mechanism (`#loading-screen` + `react-loaded` from `src/index.js` + `MutationObserver` + 10s safety), the pre‑mount `body.dark`/`localStorage` logic, the three local icon fallbacks and the untouched admin palette all have real referents to preserve; and at file granularity Prompt‑04 stays clear of the six prime‑directive KEEP invariants (surgical discipline required for the auth/nav components it edits). Two findings (splash palette broader than §2 states; `APP_NAME` is `.env`‑derived) and two nuances (CSS body rule vs pre‑mount script pair; scope closure of `03c §5.3` and exclusion of `--neon-purple` `§5.4`) are recorded with coordinates in §5. No `src/`, `db.json`, `server.js`, `public/`, root docs or config were modified — only this note was added under `prompts/`. Prompt‑04 executes against a before‑image now verified anchor‑for‑anchor.*
