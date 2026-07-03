import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { SUPPORT_EMAIL, POLICY_LAST_UPDATED } from "../../utils/constants";
import styles from "./RefundPolicy.module.css";

// =============================================================================
// Cancellations & Replacements — the enquiry-model equivalent of a returns page
// =============================================================================
// NEBM takes NO payment online: submitting an Enquiry List is a request for a
// quote, not a purchase. So there is no refund/return-window machinery here.
// This page explains how to change or cancel an enquiry and how we handle
// damaged, incorrect or missing goods after a confirmed delivery. Class names
// are reused from the original module so the existing styles still apply.
// =============================================================================
const RefundPolicy = () => {
  const { isDarkMode } = useTheme();

  const covered = [
    "Materials delivered damaged or defective",
    "Wrong product or grade delivered",
    "Items missing from your delivered order",
    "Goods not matching the agreed quotation",
  ];

  const notCovered = [
    "Products used, cut, mixed or altered after delivery",
    "Made-to-order or custom-cut materials",
    "Normal variation in the colour or texture of natural materials",
    "Issues reported long after delivery",
  ];

  const steps = [
    { step: "1", title: "Send an Enquiry", desc: "Add items to your Enquiry List and submit it. This is a request for a quote — no payment is taken." },
    { step: "2", title: "Review Your Quote", desc: "We respond with pricing, availability and delivery. Nothing is committed until you confirm." },
    { step: "3", title: "Confirm or Cancel", desc: "Go ahead with the order, adjust quantities, or cancel at no cost — just let us know." },
    { step: "4", title: "Delivery & Support", desc: "Once delivered, tell us right away if anything is damaged or incorrect and we'll make it right." },
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Cancellations & Replacements</span></div>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className={styles.title}>Cancellations & Replacements</h1>
        <p className={styles.subtitle}>Last updated: {POLICY_LAST_UPDATED}</p>
        <div className={styles.highlight}>
          North East Build Mart runs on an <strong>enquiry model — no payment is taken online</strong>. You can change or
          cancel an enquiry any time before an order is confirmed, and we stand behind the materials we supply.
        </div>
      </motion.div>

      <motion.div className={styles.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2>How It Works</h2>
        <div className={styles.stepsGrid}>
          {steps.map((s, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNumber}>{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className={styles.twoCol}>
        <motion.div className={`${styles.section} ${styles.eligible}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <h2>What We Cover</h2>
          <ul>{covered.map((item, i) => <li key={i}><span className={styles.checkIcon}>&#10003;</span> {item}</li>)}</ul>
        </motion.div>
        <motion.div className={`${styles.section} ${styles.notEligible}`} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2>Not Covered</h2>
          <ul>{notCovered.map((item, i) => <li key={i}><span className={styles.crossIcon}>&#10007;</span> {item}</li>)}</ul>
        </motion.div>
      </div>

      <motion.div className={styles.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
        <h2>Good to Know</h2>
        <div className={styles.refundTable}>
          <div className={styles.refundRow}><span>Online payment</span><span>Not required — no payment is taken on this site</span></div>
          <div className={styles.refundRow}><span>Changing an enquiry</span><span>Free, any time before you confirm an order</span></div>
          <div className={styles.refundRow}><span>Reporting a problem</span><span>Contact us as soon as possible after delivery</span></div>
          <div className={styles.refundRow}><span>Damaged or wrong items</span><span>Replaced, or resolved fairly, for the affected goods</span></div>
        </div>
      </motion.div>

      <div className={styles.contact}>
        <p>Need help with an order or a delivery? <Link to="/support">Contact Support</Link> or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </div>
    </div>
  );
};

export default RefundPolicy;
