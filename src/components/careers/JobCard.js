import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  employmentTypeLabel,
  workModeMeta,
  experienceLabel,
  salaryLabel,
  timeAgo,
  daysLeftToApply,
} from "../../services/careersApi";
import styles from "./JobCard.module.css";

// =============================================================================
// JobCard — one vacancy, everywhere (landing-page openings + related roles).
// Pure presentation: the parent supplies the job and the resolved department
// name. The whole card is a single link-like button (large touch target).
// =============================================================================
const JobCard = ({ job, departmentName, compact = false }) => {
  const navigate = useNavigate();
  const mode = workModeMeta(job.workMode);
  const daysLeft = daysLeftToApply(job);
  const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`${styles.card} ${compact ? styles.compact : ""}`}
    >
      <button
        type="button"
        className={styles.cardButton}
        onClick={() => navigate(`/careers/${job.slug}`)}
        aria-label={`View details for ${job.title}`}
      >
        <div className={styles.topRow}>
          <div className={styles.badges}>
            {departmentName && <span className={styles.deptChip}>{departmentName}</span>}
            {job.featured && (
              <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                <Icon icon="mdi:star" aria-hidden="true" /> Featured
              </span>
            )}
            {job.urgent && (
              <span className={`${styles.badge} ${styles.badgeUrgent}`}>
                <Icon icon="mdi:lightning-bolt" aria-hidden="true" /> Urgent Hiring
              </span>
            )}
            {closingSoon && !job.urgent && (
              <span className={`${styles.badge} ${styles.badgeClosing}`}>
                <Icon icon="mdi:clock-alert-outline" aria-hidden="true" />
                {daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}
              </span>
            )}
          </div>
          <span className={styles.posted}>{timeAgo(job.postedAt)}</span>
        </div>

        <h3 className={styles.title}>{job.title}</h3>
        {!compact && job.summary && <p className={styles.summary}>{job.summary}</p>}

        <ul className={styles.metaList}>
          <li>
            <Icon icon="mdi:map-marker-outline" aria-hidden="true" />
            {job.location}
          </li>
          <li>
            <Icon icon="mdi:briefcase-outline" aria-hidden="true" />
            {employmentTypeLabel(job.employmentType)}
          </li>
          <li>
            <Icon icon={mode.icon} aria-hidden="true" />
            {mode.label}
          </li>
          <li>
            <Icon icon="mdi:chart-timeline-variant" aria-hidden="true" />
            {experienceLabel(job)}
          </li>
          {!compact && (
            <li>
              <Icon icon="mdi:cash-multiple" aria-hidden="true" />
              {salaryLabel(job)}
            </li>
          )}
        </ul>

        <div className={styles.footerRow}>
          <span className={styles.openings}>
            {Number(job.openings) > 1 ? `${job.openings} positions` : "1 position"}
          </span>
          <span className={styles.viewLink}>
            View & Apply
            <Icon icon="mdi:arrow-right" aria-hidden="true" />
          </span>
        </div>
      </button>
    </motion.article>
  );
};

export default JobCard;
