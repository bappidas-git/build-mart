import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useStoreContact } from "../../context/SettingsContext";
import { FAQ_ITEMS } from "../../utils/constants";
import styles from "./HelpCenter.module.css";

const HelpCenter = () => {
  const { isDarkMode } = useTheme();
  // Support email and phone follow admin Settings → General.
  const { email: supportEmail, phone: supportPhone, telHref } = useStoreContact();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const helpTopics = [
    { icon: "&#128230;", title: "Browse & Enquire", desc: "Find products and send an enquiry for pricing", link: "/products" },
    { icon: "&#128203;", title: "Your Enquiries", desc: "View the enquiries you've submitted", link: "/orders" },
    { icon: "&#127991;", title: "Pricing & Bulk Quotes", desc: "Tiered pricing, quotes and \"Price on Enquiry\"", link: "/products" },
    { icon: "&#128100;", title: "Account & Settings", desc: "Profile, password, login issues", link: "/profile" },
    { icon: "&#128666;", title: "Delivery & Coverage", desc: "Where and how we deliver across the North East", link: "/about" },
    { icon: "&#128274;", title: "Privacy & Security", desc: "Data protection, account security", link: "/privacy" },
  ];

  const filteredFaqs = searchQuery
    ? FAQ_ITEMS.filter((f) => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : FAQ_ITEMS;

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Help Center</span></div>

      <motion.div className={styles.header} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1>Help Center</h1>
        <p>Find answers to common questions or reach out to our support team.</p>
        <div className={styles.searchBox}>
          <input type="text" placeholder="Search for help..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </motion.div>

      <motion.section className={styles.topics} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2>Browse Help Topics</h2>
        <div className={styles.topicGrid}>
          {helpTopics.map((topic, i) => (
            <Link to={topic.link} key={i} className={styles.topicCard}>
              <span className={styles.topicIcon} dangerouslySetInnerHTML={{ __html: topic.icon }} />
              <h3>{topic.title}</h3>
              <p>{topic.desc}</p>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.section className={styles.faqSection} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <p className={styles.noResults}>No FAQs match your search. <Link to="/support">Contact us</Link> for help.</p>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`help-faq-answer-${faq.id}`}
                    id={`help-faq-question-${faq.id}`}
                  >
                    <span>{faq.question}</span>
                    <span className={styles.faqToggle} aria-hidden="true" />
                  </button>
                  <div
                    className={styles.faqAnswer}
                    id={`help-faq-answer-${faq.id}`}
                    role="region"
                    aria-labelledby={`help-faq-question-${faq.id}`}
                    aria-hidden={!isOpen}
                  >
                    <div className={styles.faqAnswerInner}><p>{faq.answer}</p></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      <div className={styles.contactBanner}>
        <h3>Still need help?</h3>
        <p>Our support team is available Mon-Sat, 9am-8pm IST</p>
        <div className={styles.contactMeta}>
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <span aria-hidden="true">•</span>
          <a href={telHref(supportPhone)}>{supportPhone}</a>
        </div>
        <div className={styles.contactActions}>
          <Link to="/support" className={styles.primaryBtn}>Contact Support</Link>
          <a href={`mailto:${supportEmail}`} className={styles.secondaryBtn}>Email Us</a>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
