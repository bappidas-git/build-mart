import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import {
  ProductGallery,
  SocialProof,
  PriceBlock,
  VariantSelector,
  QuantityStepper,
  TrustBadges,
  AddToCartBar,
  ReviewsSection,
  RelatedProducts,
} from "../../components/storefront";
import styles from "./ProductDetails.module.css";

// =============================================================================
// Product Detail Page (PDP) — North East Build Mart (ENQUIRY model)
// =============================================================================
// Assembled entirely from the reusable, themeable, domain-agnostic storefront
// component library (src/components/storefront). This page owns DATA (loading,
// variant/stock derivation, the reviews blend, enquiry-list wiring); the
// components own PRESENTATION. Everything here is API/db.json-driven — no
// hardcoded business content — and every persuasive element is bound to real
// data (see the ethics notes in STOREFRONT_UX_GUIDELINES.md).
//
// NEBM is an enquiry platform: customers browse and ENQUIRE — they never buy,
// pay, check out, ship or return. So the primary action is an icon "Add to
// Enquiry List" button (no "Buy Now"), the trust panel carries only honest
// capability signals + store contact (no shipping/COD/returns), and pricing
// delegates to <PriceBlock/> (the priceType-aware exact/tiered/on-enquiry
// display is layered on by prompt 15).
// =============================================================================

// ─── Loading Skeleton ───────────────────────────────────────────────────────
const Skeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonBreadcrumb} />
    <div className={styles.skeletonLayout}>
      <div className={styles.skeletonMainImage} />
      <div className={styles.skeletonRight}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonRating} />
        <div className={styles.skeletonPrice} />
        <div className={styles.skeletonDesc} />
        <div className={styles.skeletonDesc} />
        <div className={styles.skeletonButtons} />
      </div>
    </div>
  </div>
);

// ─── Not Found State ────────────────────────────────────────────────────────
const NotFound = () => (
  <div className={styles.notFound}>
    <div className={styles.notFoundIcon}>404</div>
    <h2>Product Not Found</h2>
    <p>The product you are looking for does not exist or has been removed.</p>
    <Link to="/products" className={styles.notFoundLink}>
      Browse Products
    </Link>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const ProductDetails = () => {
  // Route is /products/:slug (slug canonical; legacy numeric id still resolves).
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const tabsRef = useRef(null);
  const buyBoxRef = useRef(null); // anchor for the sticky mobile Add-to-Cart bar

  // ── State ──────────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [settings, setSettings] = useState(null);

  // ── Fetch product ──────────────────────────────────────────────────────
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const isLegacyId = /^\d+$/.test(String(slug));
      let data = isLegacyId
        ? await apiService.products.getById(slug)
        : await apiService.products.getBySlug(slug);

      if (!data) {
        data = isLegacyId
          ? await apiService.products.getBySlug(slug).catch(() => null)
          : await apiService.products.getById(slug).catch(() => null);
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      // Canonicalise the URL to the slug form so old links never 404.
      if (data.slug && String(slug) !== String(data.slug)) {
        navigate(`/products/${data.slug}`, { replace: true });
      }

      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);

      // Recently viewed (key must match what Home.js reads).
      try {
        const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
        const filtered = viewed.filter((item) => String(item.id) !== String(data.id));
        filtered.unshift({
          id: data.id,
          slug: data.slug,
          name: data.name,
          brand: data.brand,
          image: data.images?.[0] || data.image,
          images: data.images,
          price: data.price,
          comparePrice: data.comparePrice,
          variants: data.variants,
          rating: data.rating,
          totalReviews: data.totalReviews,
          viewedAt: new Date().toISOString(),
        });
        localStorage.setItem("recentlyViewed", JSON.stringify(filtered.slice(0, 20)));
      } catch (e) {
        /* ignore localStorage errors */
      }

      if (data.categoryId) {
        apiService.categories
          .getById(data.categoryId)
          .then(setCategory)
          .catch(() => {});
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  // ── Fetch reviews (approved only — enforced by the API) ─────────────────
  const fetchReviews = useCallback(async () => {
    const productId = product?.id;
    if (!productId) return;
    try {
      setReviewsLoading(true);
      setReviewsError(false);
      const data = await apiService.products.getReviews(productId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  }, [product?.id]);

  // ── Related "you may also like" (AOV) — real catalogue data only ────────
  const fetchAov = useCallback(async () => {
    if (!product) return;
    const cfg = STOREFRONT_CONFIG.aov;
    if (cfg.relatedProducts) {
      apiService.products
        .getRelated(product, cfg.maxRelated)
        .then(setRelatedProducts)
        .catch(() => setRelatedProducts([]));
    }
  }, [product]);

  // ── Public store data for trust signals + store contact ─────────────────
  // (No shipping fetch: NEBM is an enquiry platform — no delivery/COD/returns.)
  useEffect(() => {
    apiService.settings.get().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      fetchAov();
    }
  }, [product, fetchReviews, fetchAov]);

  // ── Derived values ─────────────────────────────────────────────────────
  const images =
    product?.images?.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const comparePrice = product?.comparePrice || 0;
  const discount =
    comparePrice > currentPrice
      ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
      : 0;
  const currentSku = selectedVariant?.sku || product?.sku || "";

  // Stock for the active selection — variant stock, else product stock (never
  // silently 0). Low-stock uses the product's REAL threshold (not a magic 5).
  const currentStock = selectedVariant
    ? typeof selectedVariant.stock === "number"
      ? selectedVariant.stock
      : product?.stock
    : product?.stock;
  const hasStockInfo = typeof currentStock === "number";
  const isOutOfStock = hasStockInfo && currentStock <= 0;
  const lowStockThreshold = Number(product?.lowStockThreshold) || 5;
  const isLowStock = !isOutOfStock && hasStockInfo && currentStock <= lowStockThreshold;
  const STOCK_UNKNOWN_MAX = 10;
  const maxQuantity = hasStockInfo ? Math.max(1, currentStock) : STOCK_UNKNOWN_MAX;

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), maxQuantity));
  }, [maxQuantity]);

  // ── Reviews blend (consistent average across the page) ──────────────────
  const baseRating = Number(product?.rating) || 0;
  const baseCount = Number(product?.totalReviews) || 0;
  const reviewSum = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const totalRatingsCount = baseCount + reviews.length;
  const displayAvg =
    totalRatingsCount > 0
      ? (baseRating * baseCount + reviewSum) / totalRatingsCount
      : baseRating;

  // ── Cart wiring ────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    (options) => {
      if (!product) return;
      if (product.variants?.length > 0 && !selectedVariant) return;

      const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
      const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
      const cartItem = {
        id: selectedVariant ? `${product.id}-${selectedVariant.id}` : String(product.id),
        productId: product.id,
        slug: product.slug || null,
        variantId: selectedVariant?.id || null,
        variantName: selectedVariant?.name || null,
        name: product.name,
        image: product.images?.[0] || product.image || "",
        price: effectivePrice,
        comparePrice: product.comparePrice || 0,
        currency: "INR",
        ...(effectiveStock != null && effectiveStock !== ""
          ? { stock: Number(effectiveStock) }
          : {}),
      };
      return addToCart(cartItem, quantity, options);
    },
    [product, selectedVariant, quantity, addToCart]
  );

  // Primary action: add the current selection to the Enquiry List, with a brief
  // "Added ✓" confirmation (the enquiry toast + drawer also fire from
  // CartContext). NEBM never checks out — there is no Buy Now path.
  const handleAddToEnquiry = useCallback(() => {
    if (isOutOfStock) return;
    handleAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }, [handleAddToCart, isOutOfStock]);

  const scrollToReviews = useCallback(() => {
    setActiveTab("reviews");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return <Skeleton />;
  if (notFound || !product) return <NotFound />;

  const wishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}
    >
      <div className={styles.container}>
        {/* ── Breadcrumb (orientation) ──────────────────────────────────── */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbSep}>&rsaquo;</span>
          {category ? (
            <>
              <Link
                to={`/products?category=${categoryParam(category)}`}
                className={styles.breadcrumbLink}
              >
                {category.name}
              </Link>
              <span className={styles.breadcrumbSep}>&rsaquo;</span>
            </>
          ) : null}
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* ── Above the fold: media + buy box ───────────────────────────── */}
        <div className={styles.mainLayout}>
          <div className={styles.gallerySection}>
            <ProductGallery images={images} alt={product.name} discount={discount} />
          </div>

          <div className={styles.infoSection}>
            {product.brand && <span className={styles.brand}>{product.brand}</span>}
            <h1 className={styles.productName}>{product.name}</h1>

            {/* Social proof — real ratings only, jumps to reviews */}
            <SocialProof
              rating={displayAvg}
              count={totalRatingsCount}
              onReviewsClick={scrollToReviews}
            />

            {/* Price via PriceBlock in details mode (prompt 15): exact → fixed
                price + unit + honest compare/discount/savings; tiered → the full
                quantity-vs-price table with computed per-unit discounts + a
                minQty line; onEnquiry → "Price on Enquiry". The explicit price/
                comparePrice carry the variant-adjusted figure for exact mode; the
                enquiry-safe note replaces the old checkout-implying tax copy. */}
            <PriceBlock
              product={product}
              mode="details"
              price={currentPrice}
              comparePrice={comparePrice}
              currency="INR"
              size="lg"
              taxNote="Indicative price — enquire for the best project rate"
            />

            {currentSku && (
              <div className={styles.skuLine}>
                SKU: <span>{currentSku}</span>
              </div>
            )}

            {product.shortDescription && (
              <p className={styles.shortDescription}>{product.shortDescription}</p>
            )}

            {/* Variant selection — visible swatches/tiles, never a dropdown */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                value={selectedVariant}
                onChange={setSelectedVariant}
                productStock={product.stock}
                currency="INR"
              />
            )}

            {/* Quantity + honest stock status */}
            <div className={styles.purchaseRow}>
              <div className={styles.quantityBlock}>
                <span className={styles.quantityLabel}>Quantity</span>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={maxQuantity}
                  disabled={isOutOfStock}
                />
              </div>
              <div className={styles.stockStatus}>
                {isOutOfStock ? (
                  <span className={styles.stockOut}>Out of Stock</span>
                ) : isLowStock ? (
                  <span className={styles.stockLow}>
                    Only {currentStock} left — order soon!
                  </span>
                ) : hasStockInfo ? (
                  <span className={styles.stockIn}>In Stock</span>
                ) : null}
              </div>
            </div>

            {/* Primary action: icon-only "Add to Enquiry List" (the tooltip +
                aria-label name it — no label text on the face). No "Buy Now":
                NEBM is an enquiry platform and never checks out. The wishlist
                heart sits beside it. */}
            <div className={styles.actionButtons} ref={buyBoxRef}>
              <span
                className={styles.enquiryAction}
                data-tip={isOutOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Enquiry List"}
              >
                <button
                  type="button"
                  className={`${styles.enquiryBtn} ${added ? styles.enquiryDone : ""}`}
                  onClick={handleAddToEnquiry}
                  disabled={isOutOfStock}
                  aria-label="Add to Enquiry List"
                >
                  {added ? (
                    <>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className={styles.enquiryDoneText}>Added ✓</span>
                    </>
                  ) : (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2" />
                      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      <path d="M15 11h4M17 9v4M9 12h3M9 16h3" />
                    </svg>
                  )}
                </button>
              </span>
              <button
                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ""}`}
                onClick={() => toggleWishlist(product)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Honest, enquiry-safe capability signals near the decision point
                (config-driven; no shipping/COD/returns). */}
            <TrustBadges variant="grid" />

            {/* Store contact — real NEBM details from settings; the enquiry-safe
                replacement for the old delivery/returns panel. */}
            {settings?.store && (
              <div className={styles.contactPanel}>
                <h3 className={styles.contactTitle}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                  Enquire with {settings.store.name || "us"}
                </h3>
                <p className={styles.contactLead}>
                  Call or add this item to your Enquiry List for the best project
                  price, bulk quantities and availability.
                </p>
                <ul className={styles.contactList}>
                  {settings.store.phone && (
                    <li className={styles.contactRow}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      <a className={styles.contactLink} href={`tel:${settings.store.phone.replace(/\s+/g, "")}`}>
                        {settings.store.phone}
                      </a>
                      {settings.store.phoneSecondary && (
                        <a className={styles.contactLink} href={`tel:${settings.store.phoneSecondary.replace(/\s+/g, "")}`}>
                          {settings.store.phoneSecondary}
                        </a>
                      )}
                    </li>
                  )}
                  {settings.store.email && (
                    <li className={styles.contactRow}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-10 6L2 7" />
                      </svg>
                      <a className={styles.contactLink} href={`mailto:${settings.store.email}`}>
                        {settings.store.email}
                      </a>
                    </li>
                  )}
                  {settings.store.address && (
                    <li className={styles.contactRow}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className={styles.contactText}>{settings.store.address}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Below the fold: tabs ──────────────────────────────────────── */}
        <div className={styles.tabsSection} ref={tabsRef}>
          <div className={styles.tabNav} role="tablist" aria-label="Product information">
            <button
              role="tab"
              aria-selected={activeTab === "description"}
              className={`${styles.tabButton} ${activeTab === "description" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "reviews"}
              className={`${styles.tabButton} ${activeTab === "reviews" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "description" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={styles.descriptionTab}
              >
                <div className={styles.fullDescription}>
                  <h3>Product Description</h3>
                  <p>{product.description || "No description available."}</p>
                </div>

                <div className={styles.specTable}>
                  <h3>Specifications</h3>
                  <table>
                    <tbody>
                      {product.brand && (
                        <tr>
                          <td className={styles.specLabel}>Brand</td>
                          <td className={styles.specValue}>{product.brand}</td>
                        </tr>
                      )}
                      {currentSku && (
                        <tr>
                          <td className={styles.specLabel}>SKU</td>
                          <td className={styles.specValue}>{currentSku}</td>
                        </tr>
                      )}
                      {product.unitType && (
                        <tr>
                          <td className={styles.specLabel}>Sold by</td>
                          <td className={styles.specValue}>{product.unitType}</td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr>
                          <td className={styles.specLabel}>Weight</td>
                          <td className={styles.specValue}>{product.weight}</td>
                        </tr>
                      )}
                      {product.dimensions && (
                        <tr>
                          <td className={styles.specLabel}>Dimensions</td>
                          <td className={styles.specValue}>
                            {typeof product.dimensions === "object"
                              ? [
                                  product.dimensions.length,
                                  product.dimensions.width,
                                  product.dimensions.height,
                                ]
                                  .filter((v) => v != null && v !== "")
                                  .join(" × ")
                              : product.dimensions}
                          </td>
                        </tr>
                      )}
                      {category?.name && (
                        <tr>
                          <td className={styles.specLabel}>Category</td>
                          <td className={styles.specValue}>{category.name}</td>
                        </tr>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <tr>
                          <td className={styles.specLabel}>Tags</td>
                          <td className={styles.specValue}>{product.tags.join(", ")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ReviewsSection
                  reviews={reviews}
                  displayAvg={displayAvg}
                  totalRatingsCount={totalRatingsCount}
                  loading={reviewsLoading}
                  error={reviewsError}
                  onRetry={fetchReviews}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* ── AOV: similar products (data-driven; enquiry-safe) ─────────── */}
        <RelatedProducts
          title="You may also like"
          products={relatedProducts}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
        />
      </div>

      {/* ── Sticky mobile Add-to-Enquiry (mobile-first) ───────────────────── */}
      <AddToCartBar
        anchorRef={buyBoxRef}
        price={currentPrice}
        comparePrice={comparePrice}
        currency="INR"
        image={product.images?.[0] || product.image}
        name={selectedVariant?.name || product.name}
        disabled={isOutOfStock}
        onAddToCart={handleAddToEnquiry}
      />
    </motion.div>
  );
};

export default ProductDetails;
