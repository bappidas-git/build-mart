import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useCurrency } from "../../context/SettingsContext";
import apiService from "../../services/api";
import {
  categoryParam,
  resolveCategory,
  getCategoryScopeIds,
  orderCategoriesHierarchically,
} from "../../utils/categories";
import { getProductMinPrice, getDeviceType } from "../../utils/helpers";
import ProductCard from "../../components/storefront/ProductCard";
import EmptyState from "../../components/EmptyState/EmptyState";
import styles from "./Products.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Avg. Customer Rating" },
  { value: "popularity", label: "Popularity" },
];

// Accept common sort aliases from deep links (e.g. ?sort=price_asc) and map them
// to canonical option values; anything unrecognised falls back to "relevance".
const SORT_ALIASES = {
  price_asc: "price-low",
  "price-asc": "price-low",
  price_low: "price-low",
  lowtohigh: "price-low",
  price_desc: "price-high",
  "price-desc": "price-high",
  price_high: "price-high",
  hightolow: "price-high",
  latest: "newest",
  new: "newest",
  popular: "popularity",
  "best-rated": "rating",
};

const normalizeSort = (raw) => {
  if (!raw) return "relevance";
  const v = String(raw).toLowerCase();
  if (SORT_OPTIONS.some((o) => o.value === v)) return v;
  return SORT_ALIASES[v] || "relevance";
};

// Building-material price bands (wide spread: a cement bag vs. a designer door).
// The band edges are deliberately generic \u2014 the substantive requirement is honest
// onEnquiry handling (see getFilterPrice), not the exact bounds \u2014 so the label
// symbol simply follows the active store currency (built at render via
// priceRangeLabel) rather than being pinned to \u20b9.
const PRICE_RANGES = [
  { min: 0, max: 500 },
  { min: 500, max: 2000 },
  { min: 2000, max: 10000 },
  { min: 10000, max: Infinity },
];

// "Under $500" / "$500 \u2013 $2,000" / "Above $10,000", in the store currency symbol.
const priceRangeLabel = (range, symbol) => {
  const money = (n) => `${symbol}${n.toLocaleString("en-US")}`;
  if (range.min === 0) return `Under ${money(range.max)}`;
  if (range.max === Infinity) return `Above ${money(range.min)}`;
  return `${money(range.min)} \u2013 ${money(range.max)}`;
};

const RATING_OPTIONS = [4, 3, 2, 1];
const DISCOUNT_OPTIONS = [50, 30, 20, 10];
const PER_PAGE_OPTIONS = [12, 24, 48];

// Human labels for the unitType attribute facet (\u00a74.6). Values not listed fall
// back to a capitalized form, so a newly-seeded unit still renders sensibly.
const UNIT_TYPE_LABELS = {
  piece: "Piece",
  sheet: "Sheet",
  kg: "Kg",
  bag: "Bag",
  box: "Box",
  set: "Set",
  pack: "Pack",
  sqft: "Sq. ft",
  running_ft: "Running ft",
};

const unitTypeLabel = (u) =>
  UNIT_TYPE_LABELS[u] || (u ? u.charAt(0).toUpperCase() + u.slice(1) : u);

// ---------------------------------------------------------------------------
// Representative numeric price for range-filtering and price sorting under the
// NEBM pricing model:
//   \u2022 exact   \u2192 the product's own `price`
//   \u2022 tiered  \u2192 the LOWEST tier price (what "from \u20b9X" advertises)
//   \u2022 onEnquiry \u2192 null \u2014 there is NO comparable number, so the caller must
//     EXCLUDE these when a price bound is active and never coerce them to \u20b90
//     (that would wrongly match "Under \u20b9500"). Legacy/variant products with no
//     priceType fall back to getProductMinPrice so nothing regresses.
// ---------------------------------------------------------------------------
const getFilterPrice = (product) => {
  if (!product) return null;
  if (product.priceType === "onEnquiry") return null;
  if (product.priceType === "tiered") {
    const tiers = Array.isArray(product.priceTiers)
      ? product.priceTiers.map((t) => Number(t.price)).filter((n) => !isNaN(n) && n > 0)
      : [];
    if (tiers.length) return Math.min(...tiers);
  }
  const direct = Number(product.price);
  if (!isNaN(direct) && direct > 0) return direct;
  const min = getProductMinPrice(product).sellingPrice;
  return min > 0 ? min : null;
};

// Comparator for the price sorts. onEnquiry items (null price) always sink to
// the END in BOTH directions, so a price sort never claims a fake ordering for
// products that have no comparable price.
const priceComparator = (dir) => (a, b) => {
  const pa = getFilterPrice(a);
  const pb = getFilterPrice(b);
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  return dir === "asc" ? pa - pb : pb - pa;
};

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
  <div className={styles.card}>
    <div className={`${styles.cardImageWrap} ${styles.skeleton} ${styles.skeletonImage}`} />
    <div className={styles.cardBody}>
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "75%" }} />
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "50%", height: 14 }} />
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: "40%", height: 22, marginTop: 8 }} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Star icons (inline SVG so we don't depend on icon libraries)
// ---------------------------------------------------------------------------
const StarIcon = ({ filled, half }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
    {half ? (
      <>
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="url(#halfStar)"
        />
      </>
    ) : (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    )}
  </svg>
);

const RatingStars = ({ value = 0, count }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(value)) stars.push(<StarIcon key={i} filled />);
    else if (i - 0.5 <= value) stars.push(<StarIcon key={i} half />);
    else stars.push(<StarIcon key={i} />);
  }
  return (
    <span className={styles.stars}>
      {stars}
      {count !== undefined && <span className={styles.reviewCount}>({count.toLocaleString()})</span>}
    </span>
  );
};

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <rect x="3" y="16" width="18" height="4" rx="1" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currencySymbol } = useCurrency();

  // ---- Data state ---
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ---- UI state ----
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ---- Refs ----
  const mainRef = useRef(null); // top of results region, for page-change scroll
  const mobileTriggerRef = useRef(null); // restore focus here when the sheet closes
  const sheetCloseRef = useRef(null); // focus this when the sheet opens
  const pendingScrollRef = useRef(false); // set by pagination, consumed post-commit

  // ---- Read URL params ----
  const urlCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";
  const urlSort = normalizeSort(searchParams.get("sort"));
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;
  const urlPerPage = parseInt(searchParams.get("per_page"), 10);
  const urlMinPrice = searchParams.get("min_price") || "";
  const urlMaxPrice = searchParams.get("max_price") || "";

  // ---- Filter state (local, synced to URL) ----
  const [selectedCategories, setSelectedCategories] = useState(() => (urlCategory ? urlCategory.split(",") : []));
  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const [minRating, setMinRating] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [specialOnly, setSpecialOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedUnitTypes, setSelectedUnitTypes] = useState([]);
  const [sortBy, setSortBy] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [perPage, setPerPage] = useState(() =>
    PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12
  );

  // ---- Fetch data on mount (retryable from the error state) ----
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiService.products.getAll(),
        apiService.categories.getAll(),
      ]);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAllProducts([]);
      setCategories([]);
      // Distinguish "couldn't load" from "no matches" — the grid renders a
      // retryable error panel instead of the misleading empty state.
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // ---- Keep filter state in sync with the URL (the URL is the source of truth) ----
  // Re-derive every URL-backed filter whenever the query string (or the loaded
  // categories) changes. This fires not only on first mount / a deep link, but
  // ALSO when a header, main-menu, sidebar, homepage or breadcrumb link is
  // clicked while we are already on this page: React Router keeps <Products>
  // mounted on a query-only change, so without this the listing would never
  // react to the new category (the long-standing "URL changes but nothing
  // re-renders / the checkbox stays stuck" bug). Category tokens are normalized
  // to their canonical slug, and a legacy numeric-id deep link (?category=3) is
  // rewritten to the slug form in place. Every setter is guarded against its
  // current value, so re-applying a value we just pushed to the URL can't loop.
  useEffect(() => {
    const tokens = urlCategory ? urlCategory.split(",").filter(Boolean) : [];
    const normalized = categories.length
      ? tokens.map((t) => {
          const cat = resolveCategory(t, categories);
          return cat ? cat.slug : t;
        })
      : tokens;

    setSelectedCategories((prev) =>
      prev.join(",") === normalized.join(",") ? prev : normalized
    );
    // Canonicalize a legacy ?category=<id> link to its slug form in the URL.
    if (categories.length && normalized.join(",") !== tokens.join(",")) {
      syncUrlParams({
        category: normalized,
        search: urlSearch,
        sort: urlSort,
        page: urlPage,
        per_page: PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12,
        min_price: urlMinPrice,
        max_price: urlMaxPrice,
      });
    }

    setMinPrice((prev) => (prev === urlMinPrice ? prev : urlMinPrice));
    setMaxPrice((prev) => (prev === urlMaxPrice ? prev : urlMaxPrice));
    setSortBy((prev) => (prev === urlSort ? prev : urlSort));
    setCurrentPage((prev) => (prev === urlPage ? prev : urlPage));
    setPerPage((prev) => {
      const next = PER_PAGE_OPTIONS.includes(urlPerPage) ? urlPerPage : 12;
      return prev === next ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, urlSearch, urlSort, urlPage, urlPerPage, urlMinPrice, urlMaxPrice, categories]);

  // ---- Sync URL params when filters change ----
  // NOTE: any param mutated in the same handler MUST be passed as an override —
  // the closure below still holds this render's (pre-update) state values.
  const syncUrlParams = useCallback(
    (overrides = {}) => {
      const merged = {
        category: overrides.category !== undefined ? overrides.category : selectedCategories,
        search: overrides.search !== undefined ? overrides.search : urlSearch,
        sort: overrides.sort !== undefined ? overrides.sort : sortBy,
        page: overrides.page !== undefined ? overrides.page : currentPage,
        per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
        min_price: overrides.min_price !== undefined ? overrides.min_price : minPrice,
        max_price: overrides.max_price !== undefined ? overrides.max_price : maxPrice,
      };
      const params = new URLSearchParams();
      if (merged.category && merged.category.length) params.set("category", Array.isArray(merged.category) ? merged.category.join(",") : merged.category);
      if (merged.search) params.set("search", merged.search);
      if (merged.sort && merged.sort !== "relevance") params.set("sort", merged.sort);
      if (merged.page > 1) params.set("page", String(merged.page));
      if (merged.per_page && Number(merged.per_page) !== 12) params.set("per_page", String(merged.per_page));
      if (merged.min_price) params.set("min_price", merged.min_price);
      if (merged.max_price) params.set("max_price", merged.max_price);
      setSearchParams(params, { replace: true });
    },
    [selectedCategories, urlSearch, sortBy, currentPage, perPage, minPrice, maxPrice, setSearchParams]
  );

  // Reset to page 1 and drop the stale page param from the URL. Use this for the
  // session-only filters (rating/discount/in-stock/brand) that are not URL params
  // themselves — they only need the page reset reflected in the URL.
  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
    syncUrlParams({ page: 1 });
  }, [syncUrlParams]);

  // ---- Derived: brands extracted from loaded products ----
  const availableBrands = useMemo(() => {
    const brands = new Set();
    allProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [allProducts]);

  // ---- Derived: unit types (a real building-material attribute) for the
  // lightweight attribute facet. Ordered by frequency so the common units
  // (Piece/Box) surface first; derived from the data so it never invents a
  // unit that isn't seeded. ----
  const availableUnitTypes = useMemo(() => {
    const counts = new Map();
    allProducts.forEach((p) => {
      if (p.unitType) counts.set(p.unitType, (counts.get(p.unitType) || 0) + 1);
    });
    return Array.from(counts.keys()).sort(
      (a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b)
    );
  }, [allProducts]);

  // ---- Derived: does the catalogue contain onEnquiry / special items? Used to
  // conditionally show the "onEnquiry hidden" price note and the Special facet. ----
  const hasOnEnquiryItems = useMemo(
    () => allProducts.some((p) => p.priceType === "onEnquiry"),
    [allProducts]
  );
  const hasSpecialItems = useMemo(
    () => allProducts.some((p) => p.special === true),
    [allProducts]
  );

  // ---- Derived: product count per category id ----
  // Counts honour the parent-includes-children rule: a category's count is the
  // number of products in that category PLUS all of its descendants — i.e. the
  // exact result set you get by selecting it. (A parent therefore shows an
  // aggregate that overlaps its children's counts, which is the standard,
  // expected behaviour.)
  const categoryCounts = useMemo(() => {
    const direct = new Map();
    allProducts.forEach((p) => {
      const key = String(p.categoryId);
      direct.set(key, (direct.get(key) || 0) + 1);
    });
    const counts = new Map();
    categories.forEach((cat) => {
      let total = 0;
      getCategoryScopeIds(cat.id, categories).forEach((id) => {
        total += direct.get(String(id)) || 0;
      });
      counts.set(String(cat.id), total);
    });
    return counts;
  }, [allProducts, categories]);

  // ---- Derived: categories ordered for the filter list (parents → children) ----
  const orderedCategories = useMemo(
    () => orderCategoriesHierarchically(categories),
    [categories]
  );

  // ---- Filtering + Sorting (client-side) ----
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search
    if (urlSearch) {
      const q = urlSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Categories — products carry a numeric `categoryId`; the selected tokens
    // are canonical slugs (legacy ids still resolve). Each selected category is
    // expanded to its own id PLUS all descendant ids, so selecting a PARENT
    // includes its children's products (parent-includes-children rule): picking
    // "Electronics" returns Laptops/Audio/Smartphones items too, and picking
    // "Women's Ethnic Wear" — which has no products of its own — returns its
    // Sarees/Kurtas items. Picking a leaf category returns just that category.
    if (selectedCategories.length > 0) {
      const wantedIds = new Set();
      selectedCategories.forEach((token) => {
        const cat = resolveCategory(token, categories);
        if (!cat) return;
        getCategoryScopeIds(cat.id, categories).forEach((id) => wantedIds.add(id));
      });
      if (wantedIds.size > 0) {
        result = result.filter((p) => wantedIds.has(String(p.categoryId)));
      }
    }

    // Price range — ranged on a representative numeric price per pricing model
    // (see getFilterPrice). onEnquiry products have NO comparable number, so
    // they are EXCLUDED whenever a bound is active and INCLUDED when no bound is
    // set — never matched as ₹0. A single pass keeps the two bounds consistent.
    const pMin = parseFloat(minPrice);
    const pMax = parseFloat(maxPrice);
    const hasMin = !isNaN(pMin) && pMin > 0;
    const hasMax = !isNaN(pMax) && pMax > 0;
    if (hasMin || hasMax) {
      result = result.filter((p) => {
        const price = getFilterPrice(p);
        if (price == null) return false; // onEnquiry / unpriceable → hidden while bounded
        if (hasMin && price < pMin) return false;
        if (hasMax && price > pMax) return false;
        return true;
      });
    }

    // Special Products — the additive curated facet (a badge, NOT a category
    // scope): filters to products flagged special === true.
    if (specialOnly) {
      result = result.filter((p) => p.special === true);
    }

    // Unit type — lightweight building-material attribute facet (Piece/Box/…).
    if (selectedUnitTypes.length > 0) {
      result = result.filter((p) => selectedUnitTypes.includes(p.unitType));
    }

    // Rating
    if (minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= minRating);
    }

    // Discount
    if (minDiscount > 0) {
      result = result.filter((p) => getProductMinPrice(p).discount >= minDiscount);
    }

    // In stock
    if (inStockOnly) {
      result = result.filter((p) => (p.stock === undefined ? true : p.stock > 0));
    }

    // Brands
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort(priceComparator("asc"));
        break;
      case "price-high":
        result.sort(priceComparator("desc"));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "popularity":
        result.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, categories, urlSearch, selectedCategories, minPrice, maxPrice, specialOnly, selectedUnitTypes, minRating, minDiscount, inStockOnly, selectedBrands, sortBy]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((safePage - 1) * perPage, safePage * perPage),
    [filteredProducts, safePage, perPage]
  );

  // Keep currentPage within range whenever the result set shrinks (e.g. filters
  // applied, or a deep-linked page that no longer exists). The value guard
  // (currentPage !== safePage) terminates after one correction, so adding
  // syncUrlParams to the deps cannot loop.
  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
      syncUrlParams({ page: safePage });
    }
  }, [safePage, currentPage, syncUrlParams]);

  // Scroll the results back to the top after a pagination/per-page change. Runs
  // post-commit (so the new page's layout is settled and the smooth scroll isn't
  // cancelled by the re-render), and only when a pager action requested it — not
  // on every filter change. Offset clears the fixed header (varies by device).
  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const offsetByDevice = { mobile: 70, tablet: 114, desktop: 150 };
    const offset = offsetByDevice[getDeviceType()] || 0;
    const el = mainRef.current;
    const y = el ? el.getBoundingClientRect().top + window.scrollY - offset : 0;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [safePage, perPage]);

  // ---- Mobile filter sheet: lock body scroll, close on Escape, manage focus ----
  useEffect(() => {
    if (!mobileFiltersOpen) return undefined;
    // The trigger button is persistently mounted, so capturing it here is safe
    // and keeps the effect-cleanup ref-stability lint rule happy.
    const trigger = mobileTriggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = setTimeout(() => sheetCloseRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(focusTimer);
      // Return focus to the trigger so keyboard users aren't dropped at <body>.
      trigger?.focus();
    };
  }, [mobileFiltersOpen]);

  // ---- Helpers ----
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    specialOnly ||
    selectedUnitTypes.length > 0 ||
    minRating > 0 ||
    minDiscount > 0 ||
    inStockOnly ||
    selectedBrands.length > 0;

  // A price bound is active when either input holds a value — used to gate the
  // subtle "Price-on-Enquiry items are hidden" note in the price filter.
  const priceBoundActive = minPrice !== "" || maxPrice !== "";

  // Whether anything is constraining the result set — includes the search query
  // (set from the header), so the empty state always offers a way out.
  const hasAnyConstraint = hasActiveFilters || Boolean(urlSearch);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setSpecialOnly(false);
    setSelectedUnitTypes([]);
    setMinRating(0);
    setMinDiscount(0);
    setInStockOnly(false);
    setSelectedBrands([]);
    setSortBy("relevance");
    setCurrentPage(1);
    // Pass every reset value as an explicit override so no stale param survives.
    // per_page is intentionally preserved (it's a view preference, not a filter).
    syncUrlParams({
      category: [],
      search: "",
      sort: "relevance",
      min_price: "",
      max_price: "",
      page: 1,
    });
  }, [syncUrlParams]);

  const handleCategoryToggle = useCallback(
    (slug) => {
      setSelectedCategories((prev) => {
        const next = prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug];
        setCurrentPage(1);
        syncUrlParams({ category: next, page: 1 });
        return next;
      });
    },
    [syncUrlParams]
  );

  const handlePriceRangeClick = useCallback(
    (range) => {
      const newMin = String(range.min);
      const newMax = range.max === Infinity ? "" : String(range.max);
      setMinPrice(newMin);
      setMaxPrice(newMax);
      setCurrentPage(1);
      syncUrlParams({ min_price: newMin, max_price: newMax, page: 1 });
    },
    [syncUrlParams]
  );

  const handlePriceApply = useCallback(() => {
    // Sanitize: ignore NaN / non-positive values, and swap only when BOTH bounds
    // are valid finite numbers and inverted. An empty max means "no upper bound"
    // and must not be coerced to 0.
    const lo = parseFloat(minPrice);
    const hi = parseFloat(maxPrice);
    const loValid = !isNaN(lo) && lo > 0;
    const hiValid = !isNaN(hi) && hi > 0;
    let nextMin = loValid ? lo : "";
    let nextMax = hiValid ? hi : "";
    if (loValid && hiValid && lo > hi) {
      nextMin = hi;
      nextMax = lo;
    }
    const minStr = nextMin === "" ? "" : String(nextMin);
    const maxStr = nextMax === "" ? "" : String(nextMax);
    setMinPrice(minStr);
    setMaxPrice(maxStr);
    setCurrentPage(1);
    syncUrlParams({ min_price: minStr, max_price: maxStr, page: 1 });
  }, [minPrice, maxPrice, syncUrlParams]);

  const handleSortChange = useCallback(
    (value) => {
      setSortBy(value);
      setCurrentPage(1);
      syncUrlParams({ sort: value, page: 1 });
    },
    [syncUrlParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      const p = Math.max(1, Math.min(page, totalPages));
      pendingScrollRef.current = true; // scroll handled post-commit (see effect)
      setCurrentPage(p);
      syncUrlParams({ page: p });
    },
    [totalPages, syncUrlParams]
  );

  const handlePerPageChange = useCallback(
    (value) => {
      pendingScrollRef.current = true;
      setPerPage(value);
      setCurrentPage(1);
      syncUrlParams({ per_page: value, page: 1 });
    },
    [syncUrlParams]
  );

  // Enquiry-list quick-add. The shared ProductCard hands back a fully-built cart
  // line (buildCartItem — same id scheme the PDP uses), so a listing quick-add
  // merges with a detail-page add instead of creating a duplicate. NEBM is an
  // enquiry platform, so this is the ONLY card action (no cart/buy path).
  const handleAddToEnquiry = useCallback(
    (cartItem) => addToCart(cartItem, 1),
    [addToCart]
  );

  // Select semantics (value, or 0 to clear). onChange handles keyboard + click;
  // a paired onClick clears when the already-selected radio is re-clicked.
  const handleRatingChange = useCallback(
    (value) => {
      setMinRating(value);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleDiscountChange = useCallback(
    (value) => {
      setMinDiscount(value);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleInStockToggle = useCallback(() => {
    setInStockOnly((v) => !v);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleSpecialToggle = useCallback(() => {
    setSpecialOnly((v) => !v);
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleBrandToggle = useCallback(
    (brand) => {
      setSelectedBrands((prev) =>
        prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
      );
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const handleUnitTypeToggle = useCallback(
    (unit) => {
      setSelectedUnitTypes((prev) =>
        prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]
      );
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  // ---- Category name helper ----
  const getCategoryName = useCallback(
    (slug) => {
      const cat = categories.find(
        (c) => c.slug === slug || String(c.id) === String(slug)
      );
      return cat ? cat.name : slug;
    },
    [categories]
  );

  // ---- Breadcrumb ----
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: "Home", path: "/" },
      { label: "Products", path: "/products" },
    ];
    if (selectedCategories.length === 1) {
      items.push({ label: getCategoryName(selectedCategories[0]) });
    }
    return items;
  }, [selectedCategories, getCategoryName]);

  // ---- Pagination range ----
  const paginationRange = useMemo(() => {
    const range = [];
    const delta = 2;
    const left = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [safePage, totalPages]);

  // ---- Filter Sidebar JSX (reused for desktop + mobile) ----
  const renderFilters = (isMobile = false) => (
    <div className={`${styles.filterContent} ${isMobile ? styles.filterContentMobile : ""}`}>
      {/* Categories */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Categories</h4>
        <div className={styles.filterList}>
          {orderedCategories.ordered.map((cat) => (
            <label
              key={cat.id || cat.slug}
              className={styles.checkboxLabel}
              style={orderedCategories.depthOf(cat.id) ? { paddingLeft: orderedCategories.depthOf(cat.id) * 16 } : undefined}
            >
              <input
                type="checkbox"
                checked={selectedCategories.some(
                  (t) => t === cat.slug || String(t) === String(cat.id)
                )}
                onChange={() => handleCategoryToggle(categoryParam(cat))}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>{cat.name}</span>
              <span className={styles.filterCount}>
                ({categoryCounts.get(String(cat.id)) || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Special Products — additive curated facet (a badge, not a category) */}
      {hasSpecialItems && (
        <div className={styles.filterSection}>
          <h4 className={styles.filterTitle}>Collections</h4>
          <label className={styles.toggleLabel}>
            <span className={styles.checkboxText}>Special Products</span>
            <button
              className={`${styles.toggle} ${specialOnly ? styles.toggleOn : ""}`}
              onClick={handleSpecialToggle}
              type="button"
              role="switch"
              aria-checked={specialOnly}
              aria-label="Show only Special Products"
            >
              <span className={styles.toggleThumb} />
            </button>
          </label>
        </div>
      )}

      {/* Price Range */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Price Range</h4>
        <div className={styles.priceInputRow}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={styles.priceInput}
          />
          <span className={styles.priceSeparator}>to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={styles.priceInput}
          />
          <button className={styles.priceGoBtn} onClick={handlePriceApply}>
            Go
          </button>
        </div>
        <div className={styles.quickRanges}>
          {PRICE_RANGES.map((range) => {
            const label = priceRangeLabel(range, currencySymbol);
            return (
              <button
                key={`${range.min}-${range.max}`}
                className={styles.quickRangeBtn}
                onClick={() => handlePriceRangeClick(range)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {priceBoundActive && hasOnEnquiryItems && (
          <p className={styles.priceNote}>
            Price-on-Enquiry items are hidden while a price range is applied.
          </p>
        )}
      </div>

      {/* Rating */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Customer Rating</h4>
        <div className={styles.filterList}>
          {RATING_OPTIONS.map((r) => (
            <label key={r} className={styles.radioLabel}>
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => handleRatingChange(r)}
                onClick={() => { if (minRating === r) handleRatingChange(0); }}
                className={styles.radio}
              />
              <span className={styles.ratingOption}>
                <RatingStars value={r} /> <span className={styles.ratingPlus}>{r}+ & up</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Discount</h4>
        <div className={styles.filterList}>
          {DISCOUNT_OPTIONS.map((d) => (
            <label key={d} className={styles.radioLabel}>
              <input
                type="radio"
                name="discount"
                checked={minDiscount === d}
                onChange={() => handleDiscountChange(d)}
                onClick={() => { if (minDiscount === d) handleDiscountChange(0); }}
                className={styles.radio}
              />
              <span className={styles.checkboxText}>{d}% or more</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Availability</h4>
        <label className={styles.toggleLabel}>
          <span className={styles.checkboxText}>In Stock Only</span>
          <button
            className={`${styles.toggle} ${inStockOnly ? styles.toggleOn : ""}`}
            onClick={handleInStockToggle}
            type="button"
            role="switch"
            aria-checked={inStockOnly}
          >
            <span className={styles.toggleThumb} />
          </button>
        </label>
      </div>

      {/* Brand */}
      {availableBrands.length > 0 && (
        <div className={styles.filterSection}>
          <h4 className={styles.filterTitle}>Brand</h4>
          <div className={styles.filterList}>
            {availableBrands.map((brand) => (
              <label key={brand} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Unit type — lightweight building-material attribute facet */}
      {availableUnitTypes.length > 0 && (
        <div className={styles.filterSection}>
          <h4 className={styles.filterTitle}>Unit Type</h4>
          <div className={styles.filterList}>
            {availableUnitTypes.map((unit) => (
              <label key={unit} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedUnitTypes.includes(unit)}
                  onChange={() => handleUnitTypeToggle(unit)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{unitTypeLabel(unit)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Clear All */}
      {hasActiveFilters && (
        <button className={styles.clearAllBtn} onClick={clearAllFilters}>
          Clear All Filters
        </button>
      )}
    </div>
  );

  // ---- Product card ----
  // Delegates to the ONE canonical storefront ProductCard (single source of
  // truth) — the merchandising badges (Featured/Trending/Special + honest
  // discount, via showBadges), the icon-only "Add to Enquiry List" action and
  // the clean PriceBlock price all live there, so the listing looks and behaves
  // identically to every other product surface. `layout` switches the card
  // between the grid and horizontal-list presentations.
  const renderProductCard = (product, index) => (
    <motion.div
      key={product.id}
      className={`${styles.cardWrap} ${viewMode === "list" ? styles.cardWrapList : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <ProductCard
        product={product}
        layout={viewMode === "list" ? "list" : "grid"}
        onAddToEnquiry={handleAddToEnquiry}
        onToggleWishlist={toggleWishlist}
        isWishlisted={isInWishlist(product.id)}
        showBadges
      />
    </motion.div>
  );

  // ============================
  // RENDER
  // ============================
  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        {breadcrumbItems.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className={styles.breadcrumbSep}>&gt;</span>}
            {item.path ? (
              <a href={item.path} className={styles.breadcrumbLink} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>
                {item.label}
              </a>
            ) : (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className={styles.layout}>
        {/* ===== Desktop filter sidebar ===== */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Filters</h3>
            {hasActiveFilters && (
              <button className={styles.clearLink} onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>
          {renderFilters(false)}
        </aside>

        {/* ===== Main content ===== */}
        <main className={styles.main} ref={mainRef}>
          {/* Sort bar */}
          <div className={styles.sortBar}>
            <div className={styles.sortBarLeft}>
              {/* Mobile filter trigger */}
              <button
                className={styles.mobileFilterBtn}
                onClick={() => setMobileFiltersOpen(true)}
                ref={mobileTriggerRef}
                aria-haspopup="dialog"
                aria-expanded={mobileFiltersOpen}
              >
                <FilterIcon />
                <span>Filters</span>
                {hasActiveFilters && <span className={styles.filterBadge} />}
              </button>

              <span className={styles.resultsCount}>
                {loading ? (
                  "Loading products…"
                ) : fetchError ? (
                  "Couldn't load products"
                ) : filteredProducts.length === 0 ? (
                  "No products found"
                ) : filteredProducts.length > perPage ? (
                  <>
                    Showing{" "}
                    <strong>
                      {(safePage - 1) * perPage + 1}&ndash;
                      {Math.min(safePage * perPage, filteredProducts.length)}
                    </strong>{" "}
                    of <strong>{filteredProducts.length}</strong> products
                  </>
                ) : (
                  <>
                    Showing <strong>{filteredProducts.length}</strong>{" "}
                    {filteredProducts.length === 1 ? "product" : "products"}
                  </>
                )}
              </span>
            </div>

            <div className={styles.sortBarRight}>
              <label className={styles.sortLabel}>
                Sort by:
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className={styles.sortSelect}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <GridIcon />
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <ListIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Product grid / list */}
          {loading ? (
            <div className={`${styles.grid} ${viewMode === "list" ? styles.gridList : ""}`}>
              {Array.from({ length: perPage }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : fetchError ? (
            /* Fetch failed — never masquerade as "No products found" */
            <div className={styles.emptyState}>
              <div className={styles.errorIcon}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Couldn't load products</h3>
              <p className={styles.emptyText}>
                Something went wrong while fetching the catalogue. Please check
                your connection and try again.
              </p>
              <button className={styles.emptyBtn} onClick={fetchCatalog}>
                Try Again
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className={`${styles.grid} ${viewMode === "list" ? styles.gridList : ""}`}>
              {paginatedProducts.map((product, index) => renderProductCard(product, index))}
            </div>
          ) : (
            <EmptyState
              icon="mdi:package-variant-closed"
              title={urlSearch ? "No products match your search" : "No products found"}
              description={
                urlSearch ? (
                  <>
                    We could not find any products matching{" "}
                    <strong>&ldquo;{urlSearch}&rdquo;</strong>. Try a different
                    keyword or clear your filters.
                  </>
                ) : (
                  "We could not find any products matching your criteria. Try adjusting your filters."
                )
              }
              action={
                hasAnyConstraint
                  ? { label: "Clear filters", onClick: clearAllFilters }
                  : undefined
              }
            />
          )}

          {/* Pagination */}
          {!loading && filteredProducts.length > perPage && (
            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                <label className={styles.perPageLabel}>
                  Items per page:
                  <select
                    value={perPage}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className={styles.perPageSelect}
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.paginationCenter}>
                <button
                  className={styles.pageBtn}
                  disabled={safePage <= 1}
                  onClick={() => handlePageChange(safePage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                  <span className={styles.pageBtnText}>Prev</span>
                </button>

                {paginationRange.map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`${styles.pageBtn} ${safePage === item ? styles.pageBtnActive : ""}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  className={styles.pageBtn}
                  disabled={safePage >= totalPages}
                  onClick={() => handlePageChange(safePage + 1)}
                  aria-label="Next page"
                >
                  <span className={styles.pageBtnText}>Next</span>
                  <ChevronRight />
                </button>
              </div>

              <div className={styles.paginationRight}>
                <span className={styles.pageInfo}>
                  Page {safePage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== Mobile filter bottom sheet ===== */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className={styles.overlay}
            onClick={() => setMobileFiltersOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={styles.bottomSheet}
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.bottomSheetHeader}>
                <h3 className={styles.bottomSheetTitle}>Filters</h3>
                <button
                  className={styles.bottomSheetClose}
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  ref={sheetCloseRef}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className={styles.bottomSheetBody}>{renderFilters(true)}</div>
              <div className={styles.bottomSheetFooter}>
                <button
                  className={styles.bottomSheetClearBtn}
                  onClick={clearAllFilters}
                  disabled={!hasAnyConstraint}
                >
                  Clear All
                </button>
                <button
                  className={styles.bottomSheetApplyBtn}
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Show {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "Result" : "Results"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
