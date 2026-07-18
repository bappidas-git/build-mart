import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import careersApi from "../../services/careersApi";
import EmptyState from "../../components/EmptyState/EmptyState";
import { APP_NAME } from "../../utils/constants";
import useDocumentMeta from "./useDocumentMeta";
import styles from "./CareerThankYou.module.css";

// =============================================================================
// CareerThankYou — post-submission confirmation (/careers/thank-you/:appId).
//
// The application usually arrives via router state (no extra fetch); a page
// refresh or shared link falls back to looking the id up, so the confirmation
// is never a dead URL. Celebration honours prefers-reduced-motion.
// =============================================================================

const CareerThankYou = () => {
  const { applicationId } = useParams();
  const location = useLocation();

  const [application, setApplication] = useState(location.state?.application || null);
  const [responseTime, setResponseTime] = useState(location.state?.responseTime || null);
  const [loading, setLoading] = useState(!location.state?.application);
  const [notFound, setNotFound] = useState(false);

  useDocumentMeta(`Application received — ${APP_NAME}`);

  useEffect(() => {
    if (application) return;
    let cancelled = false;
    (async () => {
      try {
        const [found, page] = await Promise.all([
          careersApi.getApplicationByPublicId(applicationId),
          careersApi.getPage().catch(() => null),
        ]);
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
        } else {
          setApplication(found);
          setResponseTime(page?.thankYou?.responseTime || null);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, application]);

  // One celebratory confetti burst, skipped for reduced-motion users.
  useEffect(() => {
    if (!application) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.35 }, disableForReducedMotion: true });
    }, 350);
    return () => clearTimeout(t);
  }, [application]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(applicationId);
      Swal.fire({ icon: "success", title: "Application ID copied", toast: true, position: "bottom-end", showConfirmButton: false, timer: 2000 });
    } catch {
      /* clipboard unavailable — the id is on screen to copy manually */
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.skeleton} />
        </div>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon="mdi:file-search-outline"
          title="We couldn't find that application"
          description="The confirmation link may be incorrect. If you just applied, check the Application ID we showed you."
          action={{ label: "Browse Open Roles", to: "/careers#openings" }}
        />
      </div>
    );
  }

  const jobTitle = application.jobSnapshot?.title;

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
      >
        <motion.span
          className={styles.checkWrap}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", damping: 12, stiffness: 220 }}
          aria-hidden="true"
        >
          <Icon icon="mdi:check-bold" />
        </motion.span>

        <h1 className={styles.title}>Application received!</h1>
        <p className={styles.subtitle}>
          Thank you for applying{application.applicantName ? `, ${application.applicantName.split(" ")[0]}` : ""}
          {jobTitle ? (
            <>
              {" "}for the <strong>{jobTitle}</strong> position
            </>
          ) : null}
          . We've sent a confirmation to <strong>{application.email}</strong>.
        </p>

        <div className={styles.idBlock}>
          <span className={styles.idLabel}>Your Application ID</span>
          <div className={styles.idRow}>
            <code className={styles.idValue}>{application.applicationId}</code>
            <button type="button" className={styles.copyBtn} onClick={copyId} aria-label="Copy application ID">
              <Icon icon="mdi:content-copy" />
            </button>
          </div>
          <span className={styles.idHint}>Quote this ID in any follow-up about your application.</span>
        </div>

        <div className={styles.timelineNote}>
          <Icon icon="mdi:clock-fast" aria-hidden="true" />
          <p>
            <strong>What happens next?</strong> Our hiring team reviews every application
            personally. Expect a first response within{" "}
            <strong>{responseTime || "2–3 working days"}</strong> if your profile matches.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/" className={styles.homeBtn}>
            <Icon icon="mdi:home-outline" aria-hidden="true" /> Return to Home
          </Link>
          <Link to="/careers#openings" className={styles.jobsBtn}>
            Browse Other Jobs <Icon icon="mdi:arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CareerThankYou;
