import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import {
  BRAND_TAGLINE,
  BRAND_ADDRESS,
  BRAND_PHONE_1,
  BRAND_PHONE_2,
  LOGO_URL,
} from "../../utils/constants";
import styles from "./AboutUs.module.css";

// North East Build Mart — the business name is embedded verbatim so this page
// stays self-contained and never reintroduces the generic placeholder branding
// that other surfaces are migrating away from.
const BUSINESS_NAME = "North East Build Mart";

// Honest, non-numeric highlights — no fabricated customer/uptime metrics.
const HIGHLIGHTS = [
  { icon: "mdi:shape-outline", label: "11+ material categories" },
  { icon: "mdi:home-city-outline", label: "Interior & exterior use" },
  { icon: "mdi:map-marker-outline", label: "Based in Nagaon, Assam" },
];

// Top-level catalogue categories. Icons mirror the storefront category-icon
// mapping (SidebarMenu) so the same glyph represents a category everywhere.
// Each tile deep-links into the product listing via the canonical ?category=slug
// scheme; Special Products carries a gold badge.
const CATEGORIES = [
  { name: "WPC Louvers", slug: "wpc-louvers", icon: "mdi:view-day-outline" },
  { name: "Polycarbonate Sheets", slug: "polycarbonate-sheets", icon: "mdi:window-shutter" },
  { name: "FRP Sheets", slug: "frp-sheets", icon: "mdi:sine-wave" },
  { name: "Waterproofing Products", slug: "waterproofing-products", icon: "mdi:water-off-outline" },
  { name: "Tiles", slug: "tiles", icon: "mdi:view-grid-outline" },
  { name: "Doors", slug: "doors", icon: "mdi:door" },
  { name: "Hardware", slug: "hardware", icon: "mdi:tools" },
  { name: "Plumbing", slug: "plumbing", icon: "mdi:pipe" },
  { name: "Bath Fittings", slug: "bath-fittings", icon: "mdi:shower-head" },
  { name: "Cement", slug: "cement", icon: "mdi:sack" },
  { name: "Steel Rods", slug: "steel-rods", icon: "mdi:view-week-outline" },
  {
    name: "Special Products",
    slug: "special-products",
    icon: "mdi:star-four-points-outline",
    special: true,
  },
];

// Truthful value props for the enquiry model — no delivery, refund or uptime claims.
const WHY_NEBM = [
  {
    icon: "mdi:warehouse",
    title: "Wide Range of Materials",
    text: "Interior and exterior building materials — sheets, tiles, doors, hardware, plumbing and more, under one roof.",
  },
  {
    icon: "mdi:map-marker-check-outline",
    title: "Trusted Local Supplier",
    text: "A dependable building-materials partner based in Nagaon, Assam, serving builders and homeowners across the North East.",
  },
  {
    icon: "mdi:check-decagram-outline",
    title: "Quality Brands",
    text: "Materials from names builders and contractors rely on for lasting results.",
  },
  {
    icon: "mdi:email-fast-outline",
    title: "Enquiry-Based Service",
    text: "Browse the catalogue and send an enquiry — we respond with current pricing and availability.",
  },
  {
    icon: "mdi:account-hard-hat-outline",
    title: "Expert Guidance",
    text: "Practical advice on choosing the right materials for your interior and exterior projects.",
  },
];

// Strip spaces so a formatted phone still yields a valid tel: URI.
const telHref = (phone) => `tel:${phone.replace(/\s+/g, "")}`;

const AboutUs = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link> <span>/</span> <span>About Us</span>
      </div>

      <motion.section
        className={styles.hero}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <img className={styles.heroLogo} src={LOGO_URL} alt={BUSINESS_NAME} />
        <span className={styles.heroEyebrow}>{BRAND_TAGLINE}</span>
        <h1>
          About <span className={styles.brand}>{BUSINESS_NAME}</span>
        </h1>
        <p>
          Your trusted building-materials partner in Nagaon, Assam — supplying
          quality interior and exterior materials across the North East.
        </p>
        <div className={styles.heroRule} aria-hidden="true" />
      </motion.section>

      <motion.section
        className={styles.highlights}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {HIGHLIGHTS.map((item) => (
          <div key={item.label} className={styles.highlightCard}>
            <span className={styles.highlightIcon} aria-hidden="true">
              <Icon icon={item.icon} />
            </span>
            <span className={styles.highlightLabel}>{item.label}</span>
          </div>
        ))}
      </motion.section>

      <motion.section
        className={styles.section}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className={styles.sectionTitle}>Who We Are</h2>
        <div className={styles.story}>
          <p>
            {BUSINESS_NAME} deals in all kinds of building materials for interior
            and exterior use, serving builders, contractors and homeowners across
            Nagaon and the wider North East.
          </p>
          <p>
            Rather than an online checkout, we work on an enquiry model: browse the
            catalogue, add what you need, and send us an enquiry. We follow up with
            current pricing and availability so you get the right materials for
            your project.
          </p>
        </div>
      </motion.section>

      <motion.section
        className={styles.section}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className={styles.sectionTitle}>What We Stock</h2>
        <p className={styles.sectionIntro}>
          A broad catalogue of interior and exterior building materials. Explore a
          category to start browsing.
        </p>
        <div className={styles.catGrid}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className={`${styles.catCard} ${cat.special ? styles.catCardSpecial : ""}`}
            >
              {cat.special && <span className={styles.catBadge}>Special</span>}
              <span className={styles.catIcon} aria-hidden="true">
                <Icon icon={cat.icon} />
              </span>
              <span className={styles.catName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={styles.section}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className={styles.sectionTitle}>Why {BUSINESS_NAME}</h2>
        <div className={styles.whyGrid}>
          {WHY_NEBM.map((item) => (
            <div key={item.title} className={styles.whyCard}>
              <span className={styles.whyIcon} aria-hidden="true">
                <Icon icon={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={styles.cta}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <h2>Have a project in mind?</h2>
        <p>Send us an enquiry or reach us directly.</p>
        <div className={styles.ctaActions}>
          <Link to="/products" className={styles.ctaPrimary}>
            Browse Products
          </Link>
          <Link to="/support" className={styles.ctaSecondary}>
            Contact Us
          </Link>
        </div>
        <div className={styles.contactStrip}>
          <span className={styles.contactItem}>
            <Icon icon="mdi:map-marker-outline" aria-hidden="true" />
            {BRAND_ADDRESS}
          </span>
          <a className={styles.contactItem} href={telHref(BRAND_PHONE_1)}>
            <Icon icon="mdi:phone-outline" aria-hidden="true" />
            {BRAND_PHONE_1}
          </a>
          <a className={styles.contactItem} href={telHref(BRAND_PHONE_2)}>
            <Icon icon="mdi:phone-outline" aria-hidden="true" />
            {BRAND_PHONE_2}
          </a>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;
