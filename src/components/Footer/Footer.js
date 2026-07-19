import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useStoreContact } from "../../context/SettingsContext";
import apiService from "../../services/api";
import { APP_NAME, LOGO_URL, BRAND_TAGLINE } from "../../utils/constants";
import { isEmailValid } from "../../utils/helpers";
import SocialLinks from "../SocialLinks/SocialLinks";
import styles from "./Footer.module.css";

const Footer = () => {
  const { isDarkMode } = useTheme();
  // Contact details come from admin Settings → General, not hardcoded brand
  // constants, so an admin edit to the phone/address shows up here on every page.
  const { address, phones, telHref } = useStoreContact();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState("idle"); // idle | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = email.trim();
    if (!isEmailValid(trimmed)) {
      setSubscribeStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.leads.createNewsletter(trimmed);
      setSubscribeStatus("success");
      setEmail("");
      // Reset back to the input after a few seconds so visitors can add another.
      setTimeout(() => setSubscribeStatus("idle"), 4000);
    } catch {
      // Surface genuine failures instead of a fake "success". We still don't
      // reveal whether this address was already subscribed — the API returns a
      // uniform response for that — but a network/5xx error must not look like
      // a win, otherwise real failures stay invisible and nothing is recorded.
      setSubscribeStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Every target below resolves to a real route in App.js — no path here hits
  // the catch-all redirect to "/". NEBM is an enquiry platform, so there are no
  // deals / order-tracking / shipping / returns links here.
  const quickLinks = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "About Us", path: "/about" },
    { label: "Testimonials", path: "/testimonials" },
    { label: "Careers", path: "/careers" },
    { label: "Contact Us", path: "/support" },
    { label: "My Enquiries", path: "/orders" },
    { label: "Wishlist", path: "/wishlist" },
  ];

  // Top-level categories deep-linked to the listing page via the canonical
  // `?category=<slug>` scheme (see utils/categories.js). Kept as a static list
  // so the footer is self-contained and never renders before categories load;
  // slugs mirror the seeded top-level categories in db.json.
  const categoryLinks = [
    { label: "WPC Louvers", slug: "wpc-louvers" },
    { label: "Polycarbonate Sheets", slug: "polycarbonate-sheets" },
    { label: "FRP Sheets", slug: "frp-sheets" },
    { label: "Waterproofing Products", slug: "waterproofing-products" },
    { label: "Tiles", slug: "tiles" },
    { label: "Doors", slug: "doors" },
    { label: "Hardware", slug: "hardware" },
    { label: "Plumbing", slug: "plumbing" },
    { label: "Bath Fittings", slug: "bath-fittings" },
    { label: "Cement", slug: "cement" },
    { label: "Steel Rods", slug: "steel-rods" },
    { label: "Special Products", slug: "special-products" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={styles.footer}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      {/* Newsletter Section — updates, not deals (NEBM is an enquiry platform). */}
      <section className={styles.newsletter}>
        <div className={styles.container}>
          <div className={styles.newsletterInner}>
            <div className={styles.newsletterText}>
              <h3 className={styles.newsletterTitle}>
                Stay updated with North East Build Mart
              </h3>
              <p className={styles.newsletterDesc}>
                Get new product and stock updates from North East Build Mart,
                delivered straight to your inbox.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className={styles.newsletterForm} noValidate>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder={
                    subscribeStatus === "success"
                      ? "Subscribed successfully!"
                      : "Enter your email address"
                  }
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subscribeStatus === "error") setSubscribeStatus("idle");
                  }}
                  className={`${styles.emailInput} ${
                    subscribeStatus === "error" ? styles.emailInputError : ""
                  }`}
                  disabled={isSubmitting || subscribeStatus === "success"}
                  aria-label="Email address"
                  aria-invalid={subscribeStatus === "error"}
                />
                <button
                  type="submit"
                  className={styles.subscribeBtn}
                  disabled={isSubmitting || subscribeStatus === "success"}
                >
                  {isSubmitting
                    ? "Subscribing..."
                    : subscribeStatus === "success"
                    ? "Subscribed"
                    : "Subscribe"}
                </button>
              </div>
              {subscribeStatus === "error" && (
                <p className={styles.newsletterError} role="alert">
                  {errorMsg}
                </p>
              )}
              {subscribeStatus === "success" && (
                <p className={styles.newsletterSuccess} role="status">
                  Thanks for subscribing! We'll keep you posted.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Column 1: Brand */}
            <div className={styles.footerCol}>
              {/* Main logo — reads on both the light and dark footer surface. */}
              <img
                src={LOGO_URL}
                alt="North East Build Mart"
                className={styles.brandLogo}
                width={77}
                height={48}
              />
              <p className={styles.aboutText}>{BRAND_TAGLINE}</p>
              {/* Social profiles from admin Settings → Social. Renders nothing
                  until at least one link is set, so the column never shows an
                  empty icon row. */}
              <SocialLinks variant="footer" />
            </div>

            {/* Column 2: Quick Links */}
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Quick Links</h4>
              <ul className={styles.linkList}>
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Categories</h4>
              <ul className={styles.categoryList}>
                {categoryLinks.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className={styles.footerLink}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Contact Us</h4>
              <ul className={styles.contactList}>
                <li className={styles.contactItem}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className={styles.contactIcon}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                  </svg>
                  <span>{address}</span>
                </li>
                {phones.map((phone) => (
                  <li key={phone} className={styles.contactItem}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className={styles.contactIcon}>
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <a href={telHref(phone)} className={styles.contactLink}>
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomBarInner}>
            <div className={styles.bottomLeft}>
              <p className={styles.copyright}>
                &copy; {currentYear} {APP_NAME}. All rights reserved.
              </p>
              <p className={styles.credit}>
                Designed and Developed by{" "}
                <a
                  href="https://assamdigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.creditLink}
                >
                  Assam Digital
                </a>
              </p>
            </div>
            <div className={styles.legalLinks}>
              <Link to="/terms" className={styles.legalLink}>
                Terms of Service
              </Link>
              <Link to="/privacy" className={styles.legalLink}>
                Privacy Policy
              </Link>
              <Link to="/cookies" className={styles.legalLink}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
