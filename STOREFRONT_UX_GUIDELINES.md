# Storefront UX Guidelines

**North East Build Mart (NEBM)** is an **enquiry** storefront, not a shop. Customers browse building
materials, add items to an **Enquiry List**, and **Submit an Enquiry** with a note and contact details.
There is **no cart total, checkout, payment, shipping, coupon or returns** — the storefront's job is to
present the catalogue honestly and make it easy to send a well-formed enquiry.

These are the storefront's baked-in UX/UI defaults. They stay **themeable** (re-skin by token, not
code) while carrying NEBM's brand and enquiry model.

> **The one rule that overrides everything: authenticity > persuasion.**
> Never display false, exaggerated, or fabricated information about reviews, ratings, demand, stock,
> pricing or urgency. Every persuasive element must reflect **real data from the API**. When a principle
> and authenticity conflict, **authenticity wins.** This is enforced structurally (see
> [Ethics](#5-ethics-non-negotiable)), not left to good intentions.

---

## 1. Architecture at a glance

```
src/theme/
  storefront-tokens.css   ← design tokens (CSS custom properties). RE-SKIN HERE.
  tokens.js               ← JS token mirror + STOREFRONT_CONFIG (content config)
  colors.js               ← brand palette for the MUI layer (admin + MUI bits)

src/components/storefront/ ← the reusable storefront component library
  StarRating, PriceBlock, SocialProof, VariantSelector, QuantityStepper,
  TrustBadges, ProductGallery, AddToCartBar, ProductCard,
  RelatedProducts, FrequentlyBoughtTogether, ReviewsSection
  variantUtils.js          ← generic variant/attribute helpers

src/pages/
  Products/                ← the listing (search / category / sort, client-side)
  ProductDetails/          ← the PDP (gallery, PriceBlock, variants, reviews, AOV)
  EnquiryList/             ← the "cart": multi-product list with quantities, NO totals
  Checkout/  (Submit Enquiry / Enquiry Summary)  ← note + contact, then send
  OrderConfirmation/  (Enquiry success)          ← shows the ENQ- reference
```

The **Product Detail Page** owns *data* (loading, variant/stock derivation, the reviews blend, Enquiry
List wiring) while the components own *presentation*. The **listing** and the **Enquiry List** apply
the same `--sf-*` tokens.

### How theming works
- **Colors, spacing, radius, shadows, typography** live as `--sf-*` CSS custom properties in
  `storefront-tokens.css`: light values in `:root`, dark values under `body.dark` (toggled by
  `ThemeContext`). Structural tokens (spacing/radius/shadows/type) are mode-agnostic.
- Storefront CSS Modules consume `var(--sf-*)`. The listing page maps local aliases (`--card-bg`,
  `--accent`, …) onto `--sf-*` so it re-skins from the same source.
- **To re-skin:** edit `storefront-tokens.css` (and keep `colors.js` in sync for the MUI/admin layer).
  No component code changes.

---

## 2. Brand system (NEBM)

- **Primary — Blue `#1885d8`** (`--sf-color-primary`): headers, primary actions, links, the hero
  gradient (`#1885d8 → #1069b0`).
- **Secondary / accent — Gold `#fa9c4c`** (`--sf-color-secondary` / `--sf-color-accent`): highlights,
  badges (incl. the **Special Products** badge), secondary emphasis.
- **Aesthetic — Apple-minimal:** generous whitespace, calm type, restrained motion (framer-motion,
  honouring `prefers-reduced-motion` via `MotionConfig reducedMotion="user"`), no visual noise.
- **Logo** `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png` and **icon**
  `https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889689/icon_bvsukn.png` (also the settings
  `store.logo`/`store.favicon`).
- **Footer credit (required):** *"Designed and Developed by **Assam Digital**"*, where "Assam Digital"
  links to `https://assamdigital.com` with `target="_blank" rel="noopener noreferrer"`.
- **Store facts** are read from the live `settings.store` (name, tagline, both phones, address, email),
  never hardcoded: North East Build Mart · Lawkhuwa Road, Nagaon, Assam – 782002 ·
  +91 86385 43526 / +91 88762 89972 · ₹/INR.

---

## 3. The enquiry-model architecture

### Terminology map (boilerplate → NEBM)
| Boilerplate | NEBM | Notes |
| --- | --- | --- |
| Cart | **Enquiry List** | multi-product + quantities, **no totals/money** |
| Add to Cart | **Add to Enquiry List** | `AddToCartBar` renders an **icon + tooltip** button (`ctaLabel="Add to Enquiry List"`) |
| Buy Now | **Removed** | there is no purchase path anywhere |
| Checkout | **Submit Enquiry / Enquiry Summary** | review the list, add a note + contact, send |
| Order | **Enquiry** | `ENQ-…` reference, workflow status, admin notes |
| Order History | **My Enquiries** | a customer's submitted enquiries + status |

### Pricing display (honest, `priceType`-aware — `PriceBlock`)
Every price is rendered by `PriceBlock` from the product's pricing model — never a hardcoded number:
- **Exact** — a fixed ₹ price with an optional `unitType` suffix (e.g. *₹520 / piece*). If
  `showExactPrice === false`, the number is hidden and it reads **"Price on Enquiry"**.
- **Tiered** — bulk quantity-break pricing: the card shows a compact *"from ₹X / unit"*
  (`cardPriceMode:"from"`); the PDP shows the full break **table** from `priceTiers[{minQty, price}]`.
- **On Enquiry** — a calm **"Price on Enquiry"** pill, no number, on both card and PDP.

Because there is no checkout, prices are **reference and lead-qualification** aids — the real quote
comes from the team after the enquiry.

### The customer journey
Browse / search / filter → **Product details** (gallery, variants, `PriceBlock`, reviews, related &
frequently-bought-together) → **Add to Enquiry List** (with quantity) → **Enquiry List** (adjust /
remove) → **Submit Enquiry** (note + contact: name, phone, optional email) → **Enquiry success**
(the `ENQ-…` reference). No prices are summed, nothing is charged.

---

## 4. The principles and the components that enforce them

| # | Principle | Enforced by | Notes |
|---|-----------|-------------|-------|
| **A** | Visual hierarchy & first-screen clarity | PDP layout, `PriceBlock`, breadcrumb | Title → social proof → price/enquiry state → **Add to Enquiry List**. |
| **B** | Strong, trustworthy media | `ProductGallery` | Multiple angles, thumbnails, hover-zoom, **lazy-loaded**, alt text, keyboard nav, graceful single-image handling. |
| **C** | Variants **without dropdowns** | `VariantSelector` | Visible swatches/tiles; per-variant real availability; ARIA radiogroups. Optional for most building materials (which have no variants). |
| **D** | Authentic social proof | `SocialProof`, `ReviewsSection`, `StarRating` | Real ratings/reviews only; verified badges; UGC photos when present; **honest empty states**. |
| **E** | Honest, transparent pricing | `PriceBlock`, `TrustBadges` | Exact / tiered / on-enquiry shown truthfully; owner-attested policy badges only. |
| **F** | Clear, standard CTA | `AddToCartBar`, `ProductCard` | One primary action — **Add to Enquiry List** (icon + tooltip). **No "Buy Now".** |
| **G** | Micro-interactions that remove hesitation | `QuantityStepper`, "Added ✓" state, toast, skeletons | Immediate, satisfying feedback; never janky/ambiguous. |
| **H** | Helpful discovery | `FrequentlyBoughtTogether`, `RelatedProducts` | Data-driven only; render nothing when there's no real data. |
| **I** | Mobile-first & accessible | `AddToCartBar` (sticky), tokens (`--sf-tap-target`), focus styles, ARIA | Sticky mobile enquiry bar, ≥44px targets, keyboard nav, contrast, focus-visible everywhere. |

---

## 5. Ethics (non-negotiable)

The components are designed so that **fake signals are hard to ship**:

- **`SocialProof` accepts only numbers** — an aggregate `rating` and a `count` of real ratings — never
  free-typed marketing claims. With `count = 0` it shows *"No ratings yet"*, never a hollow `0.0 (0)`.
- **`ReviewsSection` renders only approved reviews.** The API (`products.getReviews`) filters to
  `status: "approved"`, so unmoderated or rejected reviews can't appear. UGC photos render only when a
  real review has them. Empty/error/loading states are honest.
- **Pricing is honest.** `PriceBlock` shows a real fixed price, a real tier table, or an explicit
  **"Price on Enquiry"** — it never invents a number, never fabricates a "discount", and a `comparePrice`
  strike-through appears only when `comparePrice > price`. Tiered pricing shows the actual
  `priceTiers` the merchant set.
- **Urgency/scarcity is real.** "Only N left" (where shown) derives from live stock and the product's
  own `lowStockThreshold` — never a hardcoded or invented number. There are no fake countdowns.
- **Availability is real.** `VariantSelector` disables genuinely impossible combinations and marks
  truly out-of-stock options.
- **No fake delivery/shipping promises.** NEBM has no shipping, so the old delivery/returns/pincode
  widgets are **removed** — the storefront never guesses serviceability or promises a delivery date.
- **"Frequently bought together" is a *curated bundle*, not a fabricated stat** — driven solely by the
  merchant's explicit `frequentlyBoughtTogetherIds`. With none, the module renders nothing.
- **Trust badges are owner-attested *policies*** (genuine product, quality assured) — configurable copy,
  **not** live demand/scarcity signals.

If you add a new persuasive element, bind it to a real data source. If the data isn't there, **show
nothing or an honest empty state.**

---

## 6. The admin panel — kept vs changed

The admin is a separate surface (MUI + `adminTheme.js`), re-skinned to the NEBM blue/gold palette but
otherwise structurally intact. What the enquiry pivot changed:

- **Kept modules:** **Dashboard · Products · Categories · Reviews · Enquiries · Users · Leads ·
  Settings.**
  - *Dashboard* shows enquiry-centric KPIs (total / new / open / converted enquiries, leads, users,
    products, low-stock) and a Recent Enquiries table.
  - *Products* gains the pricing model fields (`priceType`, `unitType`, `minQty`, `priceTiers`, the
    display flags and `special`).
  - *Enquiries* is the CRM: list/search/filter, a detail view (items, quantities, contact, note),
    **admin notes**, and the status pipeline **New → Contacted → In Discussion → Quotation Sent →
    Converted → Closed / Lost**.
  - *Settings* is trimmed to `store` / `notifications` / `seo` / `social`.
- **Removed modules:** **Returns · Payments · Coupons · Special Offers · Shipping** — routes, nav
  entries and page files deleted. There is no money, shipping or discount anywhere in the admin.
  *(The Special Offers merchandising module is superseded by the additive **Special Products**
  collection — products flagged `special: true`.)*

---

<sub>Designed and Developed by <a href="https://assamdigital.com" target="_blank" rel="noopener noreferrer">Assam Digital</a>.</sub>
