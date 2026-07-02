import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import ProductCard from "../storefront/ProductCard";
import styles from "./FeaturedProducts.module.css";

// =============================================================================
// FeaturedProducts — reusable storefront product band
// =============================================================================
// A titled grid with an optional "View All" link that renders the ONE canonical
// storefront ProductCard for every item — the enquiry icon-button ("Add to
// Enquiry List"), the gold "Special" badge, and the clean single price all come
// from that shared card, so this band looks and behaves identically to every
// other product surface. No local card, no "Add to Cart", no "% off" urgency
// (NEBM is an enquiry platform). Renders nothing when there are no products.
// =============================================================================
const FeaturedProducts = ({
  products = [],
  title = "Featured Products",
  subtitle,
  viewAllText = "View All",
  viewAllLink = "/products",
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // The shared card hands back a fully-built cart line (buildCartItem), so a band
  // quick-add merges with PDP adds and the localStorage "cart" key is unchanged.
  const handleAddToEnquiry = useCallback(
    (cartItem) => addToCart(cartItem, 1),
    [addToCart]
  );

  if (!products.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className={styles.viewAll}>
              {viewAllText} &rarr;
            </Link>
          )}
        </div>

        <div className={styles.grid}>
          {products.map((product, i) => (
            <motion.div
              key={product.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.35 }}
            >
              <ProductCard
                product={product}
                onAddToCart={handleAddToEnquiry}
                onToggleWishlist={toggleWishlist}
                isWishlisted={isInWishlist(product.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
