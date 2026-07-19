import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import StarRating from "../storefront/StarRating";
import VideoEmbed from "./VideoEmbed";
import { sanitizeMediaUrl } from "../../services/testimonialsApi";
import { formatDate } from "../../utils/helpers";
import styles from "./TestimonialCard.module.css";

// =============================================================================
// TestimonialCard — the one card for every testimonial type
// =============================================================================
// Renders text, photo and video testimonials from the shared record shape.
// Purely presentational: it shows exactly the (already published) record it is
// handed and never invents ratings or badges. All media URLs pass through the
// service-layer sanitizers before touching the DOM.
//
// Props:
//   testimonial    record from testimonialsApi
//   productLookup  optional (id) => {name, slug}|null — renders "on <product>"
//                  chips linking to the PDP when it resolves
//   clampBody      lines to clamp the body to before "Read more" (0 = never)
// =============================================================================

const BODY_CLAMP_THRESHOLD = 220; // chars — below this we never show the toggle

const Avatar = ({ testimonial }) => {
  const [failed, setFailed] = useState(false);
  const src = sanitizeMediaUrl(testimonial.avatarUrl);
  if (src && !failed) {
    return (
      <img
        className={styles.avatar}
        src={src}
        alt=""
        loading="lazy"
        width={44}
        height={44}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={styles.avatarFallback} aria-hidden="true">
      {(testimonial.customerName || "C").charAt(0).toUpperCase()}
    </span>
  );
};

const TestimonialCard = ({ testimonial, productLookup, clampBody = 5 }) => {
  const [expanded, setExpanded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const t = testimonial;
  if (!t) return null;

  const photoUrl = t.type === "photo" ? sanitizeMediaUrl(t.media?.url) : "";
  const subtitle = [t.designation, t.company].filter(Boolean).join(", ");
  const clampable = clampBody > 0 && (t.body || "").length > BODY_CLAMP_THRESHOLD;

  const products = (t.productIds || [])
    .map((id) => (productLookup ? productLookup(id) : null))
    .filter(Boolean);

  return (
    <article className={styles.card}>
      {t.featured === true && (
        <span className={styles.featuredBadge}>
          <Icon icon="mdi:star" aria-hidden="true" />
          Featured
        </span>
      )}

      <Icon icon="mdi:format-quote-open" className={styles.quoteMark} aria-hidden="true" />

      <header className={styles.head}>
        <Avatar testimonial={t} />
        <div className={styles.who}>
          <span className={styles.name}>
            {t.customerName || "A customer"}
            {t.verified === true && (
              <span className={styles.verified} title="Verified customer">
                <Icon icon="mdi:check-decagram" aria-hidden="true" />
                <span className={styles.verifiedText}>Verified</span>
              </span>
            )}
          </span>
          {subtitle && <span className={styles.role}>{subtitle}</span>}
        </div>
      </header>

      {Number(t.rating) > 0 && (
        <div className={styles.rating}>
          <StarRating rating={Number(t.rating)} size={15} />
        </div>
      )}

      {t.title && <h3 className={styles.title}>{t.title}</h3>}

      {t.body && (
        <>
          <p
            className={`${styles.body} ${clampable && !expanded ? styles.bodyClamped : ""}`}
            style={clampable && !expanded ? { WebkitLineClamp: clampBody } : undefined}
          >
            {t.body}
          </p>
          {clampable && (
            <button
              type="button"
              className={styles.readMore}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </>
      )}

      {photoUrl && !photoFailed && (
        <figure className={styles.photoFigure}>
          <img
            className={styles.photo}
            src={photoUrl}
            alt={t.media?.caption || `Project photo shared by ${t.customerName}`}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
          {t.media?.caption && (
            <figcaption className={styles.caption}>{t.media.caption}</figcaption>
          )}
        </figure>
      )}

      {t.type === "video" && t.media?.url && (
        <VideoEmbed
          url={t.media.url}
          poster={t.media.poster}
          title={t.title || `Video testimonial from ${t.customerName}`}
        />
      )}

      <footer className={styles.foot}>
        {products.length > 0 && (
          <span className={styles.products}>
            {products.map((p) => (
              <Link key={p.slug} to={`/products/${p.slug}`} className={styles.productChip}>
                <Icon icon="mdi:package-variant-closed" aria-hidden="true" />
                {p.name}
              </Link>
            ))}
          </span>
        )}
        {t.reviewDate && (
          <time className={styles.date} dateTime={t.reviewDate}>
            {formatDate(t.reviewDate, "short")}
          </time>
        )}
      </footer>
    </article>
  );
};

export default TestimonialCard;
