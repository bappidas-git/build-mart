import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useStoreContact } from "../../context/SettingsContext";
import apiService from "../../services/api";
import { isEmailValid, isValidPhone } from "../../utils/helpers";
import styles from "./Support.module.css";

// Minimal line icons keep the "no emojis, consistent iconography" rule — gold
// accent is applied via CSS (.infoIcon color) so the accent stays sparing.
const IconPin = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// Keyless Google Maps embed centered on the store address. No API key required
// (output=embed); the outer card clips it so a blocked iframe can't break the
// layout. Built from the admin-managed address so the map follows Settings too.
const mapSrc = (address) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`;

const Contact = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  // Address and phone(s) come from admin Settings → General, not brand constants.
  const { address, phones, telHref } = useStoreContact();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    category: "general", subject: "", message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pre-fill the email for logged-in users once the auth context resolves,
  // without clobbering anything they may have already typed.
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);

  const categories = [
    { value: "general", label: "General Enquiry" },
    { value: "product", label: "Product Enquiry" },
    { value: "bulk", label: "Bulk / Project Requirement" },
    { value: "feedback", label: "Feedback" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!isEmailValid(formData.email)) newErrors.email = "Invalid email";
    if (formData.phone.trim() && !isValidPhone(formData.phone))
      newErrors.phone = "Enter a valid 10-digit mobile number";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.trim().length < 20) newErrors.message = "At least 20 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await apiService.leads.createContact(formData);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", category: "general", subject: "", message: "" });
    } catch {
      setErrors({ submit: "Failed to send. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
        <motion.div className={styles.successCard} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className={styles.successIcon}>&#10003;</div>
          <h2>Message Sent!</h2>
          <p>Thank you for reaching out — the NEBM team will get back to you soon.</p>
          <button className={styles.primaryBtn} onClick={() => setIsSubmitted(false)}>Send Another</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Contact</span></div>
      <motion.div className={styles.header} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1>Contact Us</h1>
        <p>We're here to help — reach us by phone, visit us, or send a message.</p>
      </motion.div>
      <div className={styles.content}>
        <motion.div className={styles.contactInfo} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}><IconPin /></div>
            <h3>Visit Us</h3>
            <p>{address}</p>
            <span>North East Build Mart</span>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}><IconPhone /></div>
            <h3>Call Us</h3>
            <div className={styles.phoneList}>
              {phones.map((num) => (
                <a key={num} href={telHref(num)} className={styles.phoneLink}>{num}</a>
              ))}
            </div>
            <span>Mon – Sat, 9 AM – 8 PM</span>
          </div>
          <div className={styles.mapCard}>
            <iframe
              title={`North East Build Mart location — ${address}`}
              src={mapSrc(address)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className={styles.quickLinks}>
            <h3>Quick Links</h3>
            <Link to="/products">Browse Products</Link>
            <Link to="/orders">My Enquiries</Link>
            <Link to="/about">About Us</Link>
          </div>
        </motion.div>
        <motion.form className={styles.form} onSubmit={handleSubmit} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2>Send a Message</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" className={errors.name ? styles.inputError : ""} />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={errors.email ? styles.inputError : ""} />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" className={errors.phone ? styles.inputError : ""} />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Subject *</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Brief description" className={errors.subject ? styles.inputError : ""} />
            {errors.subject && <span className={styles.error}>{errors.subject}</span>}
          </div>
          <div className={styles.formGroup}>
            <label>Message *</label>
            <textarea name="message" value={formData.message} onChange={handleChange} placeholder="How can we help?" rows={5} className={errors.message ? styles.inputError : ""} />
            {errors.message && <span className={styles.error}>{errors.message}</span>}
          </div>
          {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}
          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Message"}</button>
        </motion.form>
      </div>
    </div>
  );
};

export default Contact;
