import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import styles from "./CTASection.module.css";

const CTASection = ({
  title = "Building something? Let's talk materials.",
  subtitle = "Get bulk pricing and the right products for your interior & exterior projects — send us an enquiry.",
  buttonText = "Browse Products",
  link = "/products",
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <section className={`${styles.cta} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <button onClick={() => navigate(link)} className={styles.ctaBtn}>{buttonText}</button>
      </div>
    </section>
  );
};

export default CTASection;
