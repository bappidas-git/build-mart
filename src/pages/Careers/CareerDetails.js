import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import careersApi, {
  employmentTypeLabel,
  workModeMeta,
  experienceLabel,
  salaryLabel,
  timeAgo,
  daysLeftToApply,
  isJobAccepting,
} from "../../services/careersApi";
import { useStoreContact } from "../../context/SettingsContext";
import { APP_NAME } from "../../utils/constants";
import JobCard from "../../components/careers/JobCard";
import ApplyJobModal from "../../components/careers/ApplyJobModal";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import EmptyState from "../../components/EmptyState/EmptyState";
import useDocumentMeta from "./useDocumentMeta";
import styles from "./CareerDetails.module.css";

// =============================================================================
// CareerDetails — one vacancy's dedicated page (/careers/:slug).
//
// Open roles get the full premium treatment (description, skills, sidebar
// facts, share, related roles, sticky mobile Apply). Closed/expired roles keep
// resolving — with a clear "no longer accepting" state — so shared links never
// dead-end. Drafts and archived roles 404 into the not-found state.
// =============================================================================

const CareerDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { address, phones } = useStoreContact();

  const [job, setJob] = useState(null);
  const [pageConfig, setPageConfig] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setJob(null);
        const [jobData, pageData, deptData] = await Promise.all([
          careersApi.getJobBySlug(slug),
          careersApi.getPage(),
          careersApi.getDepartments(),
        ]);
        if (cancelled) return;
        if (!jobData) {
          setNotFound(true);
          return;
        }
        setJob(jobData);
        setPageConfig(pageData);
        setDepartments(deptData);
        careersApi.getRelatedJobs(jobData, 3).then((r) => !cancelled && setRelated(r));
      } catch (e) {
        console.error("Career details load failed:", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const departmentName = useMemo(
    () => departments.find((d) => String(d.id) === String(job?.departmentId))?.name || "",
    [departments, job]
  );

  useDocumentMeta(
    job ? `${job.title} — Careers at ${APP_NAME}` : undefined,
    job?.summary
  );

  // Google Jobs structured data (JobPosting) for open roles.
  useEffect(() => {
    if (!job || !isJobAccepting(job)) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.postedAt,
      ...(job.lastDateToApply ? { validThrough: job.lastDateToApply } : {}),
      employmentType: (job.employmentType || "full_time").toUpperCase(),
      hiringOrganization: { "@type": "Organization", name: APP_NAME },
      jobLocation: {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" },
      },
      ...(job.showSalary !== false && job.salaryMin
        ? {
            baseSalary: {
              "@type": "MonetaryAmount",
              currency: "INR",
              value: {
                "@type": "QuantitativeValue",
                minValue: job.salaryMin,
                maxValue: job.salaryMax || job.salaryMin,
                unitText: job.salaryPeriod === "year" ? "YEAR" : "MONTH",
              },
            },
          }
        : {}),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [job]);

  const accepting = job ? isJobAccepting(job) : false;
  const daysLeft = job ? daysLeftToApply(job) : null;

  const shareUrl = window.location.href;
  const shareText = job ? `${job.title} at ${APP_NAME} — apply here:` : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, text: shareText, url: shareUrl });
        return;
      } catch {
        /* user dismissed the sheet — fall through to copy */
      }
    }
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      Swal.fire({ icon: "success", title: "Link copied", toast: true, position: "bottom-end", showConfirmButton: false, timer: 2000 });
    } catch {
      Swal.fire({ icon: "info", title: "Copy this link", text: shareUrl });
    }
  };

  const handleApplySuccess = (application) => {
    setApplyOpen(false);
    navigate(`/careers/thank-you/${application.applicationId}`, {
      state: { application, responseTime: pageConfig?.thankYou?.responseTime },
    });
  };

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonMain} />
            <div className={styles.skeletonSide} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <EmptyState
            icon="mdi:briefcase-search-outline"
            title="This vacancy doesn't exist"
            description="It may have been filled or removed. Browse our current openings instead."
            action={{ label: "View Open Positions", to: "/careers#openings" }}
          />
        </div>
      </div>
    );
  }

  const mode = workModeMeta(job.workMode);
  const paragraphs = (job.description || "").split(/\n{2,}/).filter(Boolean);
  const hiringSteps = pageConfig?.hiringProcess?.steps || [];

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* ---- Header band ---- */}
      <header className={styles.headerBand}>
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Careers", link: "/careers" }, { label: job.title }]} />
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <div className={styles.badgeRow}>
                {departmentName && <span className={styles.deptChip}>{departmentName}</span>}
                {job.featured && (
                  <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                    <Icon icon="mdi:star" aria-hidden="true" /> Featured
                  </span>
                )}
                {job.urgent && accepting && (
                  <span className={`${styles.badge} ${styles.badgeUrgent}`}>
                    <Icon icon="mdi:lightning-bolt" aria-hidden="true" /> Urgent Hiring
                  </span>
                )}
                {!accepting && (
                  <span className={`${styles.badge} ${styles.badgeClosed}`}>
                    <Icon icon="mdi:lock-outline" aria-hidden="true" /> No longer accepting applications
                  </span>
                )}
              </div>
              <h1 className={styles.title}>{job.title}</h1>
              <ul className={styles.metaRow}>
                <li><Icon icon="mdi:map-marker-outline" aria-hidden="true" />{job.location}</li>
                <li><Icon icon="mdi:briefcase-outline" aria-hidden="true" />{employmentTypeLabel(job.employmentType)}</li>
                <li><Icon icon={mode.icon} aria-hidden="true" />{mode.label}</li>
                <li><Icon icon="mdi:clock-outline" aria-hidden="true" />Posted {timeAgo(job.postedAt)}</li>
              </ul>
            </div>
            <div className={styles.headerActions}>
              {accepting ? (
                <>
                  <button type="button" className={styles.applyBtn} onClick={() => setApplyOpen(true)}>
                    Apply Now
                    <Icon icon="mdi:arrow-right" aria-hidden="true" />
                  </button>
                  {daysLeft !== null && daysLeft >= 0 && (
                    <span className={styles.deadlineNote}>
                      <Icon icon="mdi:calendar-clock" aria-hidden="true" />
                      {daysLeft === 0 ? "Applications close today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to apply`}
                    </span>
                  )}
                </>
              ) : (
                <Link to="/careers#openings" className={styles.browseBtn}>
                  Browse Open Roles
                </Link>
              )}
              <button type="button" className={styles.shareBtn} onClick={handleShare}>
                <Icon icon="mdi:share-variant-outline" aria-hidden="true" /> Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`${styles.container} ${styles.layout}`}>
        {/* ---- Main column ---- */}
        <main className={styles.main}>
          {!accepting && (
            <div className={styles.closedNotice} role="status">
              <Icon icon="mdi:information-outline" aria-hidden="true" />
              <div>
                <strong>This position is closed.</strong> Applications are no longer being
                accepted{job.lastDateToApply ? ` (deadline was ${new Date(job.lastDateToApply).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })})` : ""}.
                Explore our <Link to="/careers#openings">current openings</Link>.
              </div>
            </div>
          )}

          <section className={styles.block} aria-labelledby="jd-about">
            <h2 id="jd-about">About the role</h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
            <section className={styles.block} aria-labelledby="jd-resp">
              <h2 id="jd-resp">What you'll do</h2>
              <ul className={styles.checkList}>
                {job.responsibilities.map((item) => (
                  <li key={item}>
                    <Icon icon="mdi:check-circle-outline" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.qualifications) && job.qualifications.length > 0 && (
            <section className={styles.block} aria-labelledby="jd-qual">
              <h2 id="jd-qual">What we're looking for</h2>
              <ul className={styles.checkList}>
                {job.qualifications.map((item) => (
                  <li key={item}>
                    <Icon icon="mdi:account-check-outline" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.skills) && job.skills.length > 0 && (
            <section className={styles.block} aria-labelledby="jd-skills">
              <h2 id="jd-skills">Skills</h2>
              <div className={styles.skillChips}>
                {job.skills.map((skill) => (
                  <span key={skill} className={styles.skillChip}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {Array.isArray(job.benefits) && job.benefits.length > 0 && (
            <section className={styles.block} aria-labelledby="jd-benefits">
              <h2 id="jd-benefits">Benefits</h2>
              <ul className={styles.checkList}>
                {job.benefits.map((item) => (
                  <li key={item}>
                    <Icon icon="mdi:gift-outline" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hiringSteps.length > 0 && accepting && (
            <section className={styles.block} aria-labelledby="jd-timeline">
              <h2 id="jd-timeline">Hiring timeline</h2>
              <ol className={styles.timeline}>
                {hiringSteps.map((step, i) => (
                  <li key={step.title}>
                    <span className={styles.timelineDot} aria-hidden="true">{i + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        {/* ---- Sidebar ---- */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3>Job overview</h3>
            <dl className={styles.factList}>
              <div><dt><Icon icon="mdi:cash-multiple" aria-hidden="true" />Salary</dt><dd>{salaryLabel(job)}</dd></div>
              <div><dt><Icon icon="mdi:chart-timeline-variant" aria-hidden="true" />Experience</dt><dd>{experienceLabel(job)}</dd></div>
              <div><dt><Icon icon="mdi:account-multiple-outline" aria-hidden="true" />Open positions</dt><dd>{job.openings || 1}</dd></div>
              <div><dt><Icon icon="mdi:briefcase-outline" aria-hidden="true" />Employment type</dt><dd>{employmentTypeLabel(job.employmentType)}</dd></div>
              <div><dt><Icon icon={mode.icon} aria-hidden="true" />Work mode</dt><dd>{mode.label}</dd></div>
              <div><dt><Icon icon="mdi:map-marker-outline" aria-hidden="true" />Location</dt><dd>{job.location}</dd></div>
              {job.lastDateToApply && (
                <div>
                  <dt><Icon icon="mdi:calendar-clock" aria-hidden="true" />Apply by</dt>
                  <dd>{new Date(job.lastDateToApply).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
                </div>
              )}
            </dl>
            {accepting && (
              <button type="button" className={styles.sideApplyBtn} onClick={() => setApplyOpen(true)}>
                Apply Now
              </button>
            )}
          </div>

          <div className={styles.sideCard}>
            <h3>About {APP_NAME}</h3>
            <p className={styles.companyText}>
              A growing building-materials supplier serving builders, contractors and
              homeowners across the North East — now bringing the trade online.
            </p>
            <ul className={styles.companyFacts}>
              <li><Icon icon="mdi:map-marker-outline" aria-hidden="true" />{address}</li>
              {phones?.[0] && <li><Icon icon="mdi:phone-outline" aria-hidden="true" />{phones[0]}</li>}
            </ul>
            <Link to="/about" className={styles.companyLink}>
              Learn more about us <Icon icon="mdi:arrow-right" aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.sideCard}>
            <h3>Share this job</h3>
            <div className={styles.shareRow}>
              <a
                className={styles.shareIcon}
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
              >
                <Icon icon="mdi:whatsapp" />
              </a>
              <a
                className={styles.shareIcon}
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
              >
                <Icon icon="mdi:linkedin" />
              </a>
              <a
                className={styles.shareIcon}
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
              >
                <Icon icon="mdi:twitter" />
              </a>
              <button type="button" className={styles.shareIcon} onClick={handleCopyLink} aria-label="Copy link">
                <Icon icon="mdi:link-variant" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ---- Related roles ---- */}
      {related.length > 0 && (
        <section className={`${styles.container} ${styles.relatedSection}`} aria-labelledby="jd-related">
          <h2 id="jd-related">Other open roles</h2>
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <JobCard
                key={r.id}
                job={r}
                compact
                departmentName={departments.find((d) => String(d.id) === String(r.departmentId))?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Sticky mobile apply bar ---- */}
      {accepting && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyInfo}>
            <strong>{job.title}</strong>
            <span>{salaryLabel(job)}</span>
          </div>
          <button type="button" className={styles.applyBtn} onClick={() => setApplyOpen(true)}>
            Apply Now
          </button>
        </div>
      )}

      <ApplyJobModal
        open={applyOpen}
        job={job}
        departmentName={departmentName}
        pageConfig={pageConfig}
        onClose={() => setApplyOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </motion.div>
  );
};

export default CareerDetails;
