import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { APP_NAME, SUPPORT_EMAIL, POLICY_LAST_UPDATED } from "../../utils/constants";
import styles from "./TermsOfService.module.css";

const TermsOfService = () => {
  const { isDarkMode } = useTheme();

  const sections = [
    { title: "Acceptance of Terms", content: `By accessing or using ${APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.` },
    { title: "Account Registration", content: "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use our services." },
    { title: "Enquiries & Pricing", content: "Prices shown are indicative and in Indian Rupees (INR). Final pricing, availability and any applicable taxes are confirmed in the quotation we provide in response to your enquiry. We reserve the right to update prices without prior notice." },
    { title: "Quotations & Orders", content: "North East Build Mart operates on an enquiry model. Submitting an Enquiry List is a request for a quote — not a purchase — and no payment is taken on this website. Any order is confirmed directly with our team and is subject to acceptance and stock availability." },
    { title: "Delivery", content: "We arrange delivery across Nagaon and the wider North East region. Timelines and charges are quoted with your order and are estimates that may vary with location, quantity and availability. We are not responsible for delays caused by circumstances beyond our reasonable control." },
    { title: "Product Quality & Replacements", content: "We supply materials from trusted brands and check them before dispatch. If goods arrive damaged, defective or not as agreed in your quote, contact us promptly and we will arrange a replacement or a fair resolution for the affected items." },
    { title: "Intellectual Property", content: `All content on ${APP_NAME}, including text, images, logos, and software, is our property or licensed to us. You may not reproduce, distribute, or create derivative works without written permission.` },
    { title: "Limitation of Liability", content: `${APP_NAME} is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from your use of our platform.` },
    { title: "Governing Law", content: "These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Mumbai, Maharashtra." },
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Terms of Service</span></div>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.subtitle}>Last updated: {POLICY_LAST_UPDATED}</p>
        <p className={styles.intro}>Please read these terms carefully before using {APP_NAME}.</p>
      </motion.div>
      <div className={styles.sections}>
        {sections.map((section, i) => (
          <motion.div key={i} className={styles.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <h2>{i + 1}. {section.title}</h2>
            <p>{section.content}</p>
          </motion.div>
        ))}
      </div>
      <div className={styles.contact}><p>Questions? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p></div>
    </div>
  );
};

export default TermsOfService;
