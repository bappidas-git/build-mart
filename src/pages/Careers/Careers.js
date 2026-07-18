import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import careersApi, { WORK_MODES, EMPLOYMENT_TYPES } from "../../services/careersApi";
import JobCard from "../../components/careers/JobCard";
import EmptyState from "../../components/EmptyState/EmptyState";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import useDocumentMeta from "./useDocumentMeta";
import styles from "./Careers.module.css";

// =============================================================================
// Careers — the storefront hiring landing page.
//
// Every section renders from the admin-managed `careersPage` config (Admin →
// Careers Page); nothing textual is hardcoded. Sections the admin disables
// disappear entirely. Openings are live `careerJobs` records with full
// search / filter / sort.
// =============================================================================

// Shared section reveal — plays once as each section scrolls into view.
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const EXPERIENCE_FILTERS = [
  { value: "", label: "Any experience" },
  { value: "fresher", label: "Freshers welcome" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "featured", label: "Featured first" },
  { value: "urgent", label: "Urgent hiring first" },
  { value: "closing", label: "Closing soon" },
];

const matchesExperience = (job, filterValue) => {
  const min = Number(job.experienceMin) || 0;
  const max = Number(job.experienceMax) || min;
  switch (filterValue) {
    case "fresher":
      return min === 0;
    case "1-3":
      return min <= 3 && max >= 1;
    case "3-5":
      return min <= 5 && max >= 3;
    case "5+":
      return max >= 5;
    default:
      return true;
  }
};

const Careers = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [page, setPage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experience, setExperience] = useState("");
  const [sort, setSort] = useState("newest");

  useDocumentMeta(page?.seo?.title, page?.seo?.description);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const [pageData, jobData, deptData] = await Promise.all([
          careersApi.getPage(),
          careersApi.getJobs(),
          careersApi.getDepartments(),
        ]);
        if (cancelled) return;
        setPage(pageData);
        setJobs(jobData);
        setDepartments(deptData);
      } catch (e) {
        console.error("Careers page load failed:", e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link support: /careers#openings and /careers#hiring-process scroll
  // to their sections once content is on screen.
  useEffect(() => {
    if (loading || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, location.hash]);

  const departmentName = useCallback(
    (id) => departments.find((d) => String(d.id) === String(id))?.name || "",
    [departments]
  );

  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort(),
    [jobs]
  );

  // Departments that actually have open roles (an empty filter option is noise).
  const activeDepartments = useMemo(
    () => departments.filter((d) => jobs.some((j) => String(j.departmentId) === String(d.id))),
    [departments, jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = jobs.filter((job) => {
      if (q) {
        const haystack = [job.title, job.summary, departmentName(job.departmentId), ...(job.skills || [])]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (department && String(job.departmentId) !== String(department)) return false;
      if (jobLocation && job.location !== jobLocation) return false;
      if (employmentType && job.employmentType !== employmentType) return false;
      if (workMode && job.workMode !== workMode) return false;
      if (experience && !matchesExperience(job, experience)) return false;
      return true;
    });

    const byNewest = (a, b) => new Date(b.postedAt) - new Date(a.postedAt);
    switch (sort) {
      case "featured":
        return list.sort((a, b) => (b.featured === true) - (a.featured === true) || byNewest(a, b));
      case "urgent":
        return list.sort((a, b) => (b.urgent === true) - (a.urgent === true) || byNewest(a, b));
      case "closing":
        return list.sort((a, b) => {
          const da = a.lastDateToApply ? new Date(a.lastDateToApply) : Infinity;
          const db = b.lastDateToApply ? new Date(b.lastDateToApply) : Infinity;
          return da - db;
        });
      default:
        return list.sort(byNewest);
    }
  }, [jobs, search, department, jobLocation, employmentType, workMode, experience, sort, departmentName]);

  const hasActiveFilters =
    !!(search || department || jobLocation || employmentType || workMode || experience);

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
    setJobLocation("");
    setEmploymentType("");
    setWorkMode("");
    setExperience("");
  };

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.skeletonHero} />
          <div className={styles.skeletonGrid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !page || page.enabled === false) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <EmptyState
            icon="mdi:briefcase-off-outline"
            title={loadError ? "Couldn't load the careers page" : "Careers page unavailable"}
            description={
              loadError
                ? "Something went wrong on our side. Please try again in a moment."
                : "We're not listing openings right now — check back soon."
            }
            action={{ label: "Back to Home", to: "/" }}
          />
        </div>
      </div>
    );
  }

  const { hero = {}, whyJoinUs = {}, culture = {}, benefits = {}, growth = {}, life = {}, hiringProcess = {}, faqs = {}, cta = {}, openings = {} } = page;

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ================= Hero ================= */}
      <section className={styles.hero}>
        {hero.image && (
          <div
            className={styles.heroImage}
            style={{ backgroundImage: `url(${hero.image})` }}
            aria-hidden="true"
          />
        )}
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroContent}`}>
          <Breadcrumb items={[{ label: "Careers" }]} />
          <motion.p className={styles.heroEyebrow} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {hero.title} <span className={styles.heroHighlight}>{hero.highlight}</span>
          </motion.h1>
          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            {hero.subtitle}
          </motion.p>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <button type="button" className={styles.primaryBtn} onClick={() => scrollTo("openings")}>
              {hero.primaryCtaLabel || "View Open Positions"}
              <Icon icon="mdi:arrow-down" aria-hidden="true" />
            </button>
            {hiringProcess.enabled !== false && (
              <button type="button" className={styles.ghostBtn} onClick={() => scrollTo("hiring-process")}>
                {hero.secondaryCtaLabel || "How We Hire"}
              </button>
            )}
          </motion.div>

          {Array.isArray(hero.stats) && hero.stats.length > 0 && (
            <motion.dl
              className={styles.heroStats}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
            >
              {hero.stats.map((stat) => (
                <div key={stat.label} className={styles.heroStat}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}
        </div>
      </section>

      {/* ================= Why join us ================= */}
      {whyJoinUs.enabled !== false && (
        <motion.section className={styles.section} {...reveal}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{whyJoinUs.title}</h2>
              {whyJoinUs.subtitle && <p>{whyJoinUs.subtitle}</p>}
            </header>
            <div className={styles.cardGrid}>
              {(whyJoinUs.items || []).map((item) => (
                <div key={item.title} className={styles.infoCard}>
                  <span className={styles.infoIcon} aria-hidden="true">
                    <Icon icon={item.icon || "mdi:star-outline"} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================= Culture ================= */}
      {culture.enabled !== false && (
        <motion.section className={`${styles.section} ${styles.sectionAlt}`} {...reveal}>
          <div className={styles.container}>
            <div className={styles.cultureLayout}>
              <div className={styles.cultureText}>
                <header className={styles.sectionHeader}>
                  <h2>{culture.title}</h2>
                  {culture.subtitle && <p>{culture.subtitle}</p>}
                </header>
                <div className={styles.valueList}>
                  {(culture.values || []).map((value) => (
                    <div key={value.title} className={styles.valueItem}>
                      <span className={styles.valueIcon} aria-hidden="true">
                        <Icon icon={value.icon || "mdi:heart-outline"} />
                      </span>
                      <div>
                        <h3>{value.title}</h3>
                        <p>{value.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {culture.image && (
                <div className={styles.cultureImageWrap}>
                  <img src={culture.image} alt="" loading="lazy" />
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================= Benefits ================= */}
      {benefits.enabled !== false && (
        <motion.section className={styles.section} {...reveal}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{benefits.title}</h2>
              {benefits.subtitle && <p>{benefits.subtitle}</p>}
            </header>
            <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
              {(benefits.items || []).map((item) => (
                <div key={item.title} className={styles.infoCard}>
                  <span className={styles.infoIcon} aria-hidden="true">
                    <Icon icon={item.icon || "mdi:gift-outline"} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================= Growth ================= */}
      {growth.enabled !== false && (
        <motion.section className={`${styles.section} ${styles.sectionAlt}`} {...reveal}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{growth.title}</h2>
              {growth.subtitle && <p>{growth.subtitle}</p>}
            </header>
            <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
              {(growth.items || []).map((item) => (
                <div key={item.title} className={styles.infoCard}>
                  <span className={styles.infoIcon} aria-hidden="true">
                    <Icon icon={item.icon || "mdi:trending-up"} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================= Life gallery ================= */}
      {life.enabled !== false && Array.isArray(life.images) && life.images.length > 0 && (
        <motion.section className={styles.section} {...reveal}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{life.title}</h2>
              {life.subtitle && <p>{life.subtitle}</p>}
            </header>
            <div className={styles.gallery}>
              {life.images.map((img, i) => (
                <figure key={`${img.url}-${i}`} className={styles.galleryItem}>
                  <img src={img.url} alt={img.caption || ""} loading="lazy" />
                  {img.caption && <figcaption>{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================= Hiring process ================= */}
      {hiringProcess.enabled !== false && (
        <motion.section id="hiring-process" className={`${styles.section} ${styles.sectionAlt}`} {...reveal}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>{hiringProcess.title}</h2>
              {hiringProcess.subtitle && <p>{hiringProcess.subtitle}</p>}
            </header>
            <ol className={styles.processTimeline}>
              {(hiringProcess.steps || []).map((step, i) => (
                <li key={step.title} className={styles.processStep}>
                  <span className={styles.processIndex} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.processIcon} aria-hidden="true">
                    <Icon icon={step.icon || "mdi:check"} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>
      )}

      {/* ================= Openings ================= */}
      <section id="openings" className={styles.section}>
        <div className={styles.container}>
          <header className={styles.sectionHeader}>
            <h2>{openings.title || "Current openings"}</h2>
            {openings.subtitle && <p>{openings.subtitle}</p>}
          </header>

          <div className={styles.filterBar} role="search" aria-label="Filter job openings">
            <div className={styles.searchWrap}>
              <Icon icon="mdi:magnify" aria-hidden="true" className={styles.searchIcon} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles, skills…"
                aria-label="Search job openings"
                className={styles.searchInput}
              />
            </div>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filter by department" className={styles.filterSelect}>
              <option value="">All departments</option>
              {activeDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} aria-label="Filter by location" className={styles.filterSelect}>
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} aria-label="Filter by employment type" className={styles.filterSelect}>
              <option value="">All types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} aria-label="Filter by work mode" className={styles.filterSelect}>
              <option value="">All work modes</option>
              {WORK_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} aria-label="Filter by experience" className={styles.filterSelect}>
              {EXPERIENCE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort openings" className={styles.filterSelect}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.resultMeta} aria-live="polite">
            <span>
              {filteredJobs.length} open {filteredJobs.length === 1 ? "position" : "positions"}
              {hasActiveFilters ? " match your filters" : ""}
            </span>
            {hasActiveFilters && (
              <button type="button" className={styles.clearFilters} onClick={clearFilters}>
                <Icon icon="mdi:filter-off-outline" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState
              icon="mdi:briefcase-search-outline"
              title={hasActiveFilters ? "No roles match those filters" : "No open positions right now"}
              description={
                hasActiveFilters
                  ? "Try broadening your search — or clear the filters to see everything."
                  : "New roles open regularly. Check back soon, or send us your resume via the contact page."
              }
              action={
                hasActiveFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : { label: "Contact Us", to: "/support" }
              }
              compact
            />
          ) : (
            <div className={styles.jobGrid}>
              <AnimatePresence>
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} departmentName={departmentName(job.departmentId)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* ================= FAQs ================= */}
      {faqs.enabled !== false && Array.isArray(faqs.items) && faqs.items.length > 0 && (
        <motion.section className={`${styles.section} ${styles.sectionAlt}`} {...reveal}>
          <div className={`${styles.container} ${styles.faqContainer}`}>
            <header className={styles.sectionHeader}>
              <h2>{faqs.title}</h2>
            </header>
            <FaqList items={faqs.items} />
          </div>
        </motion.section>
      )}

      {/* ================= CTA ================= */}
      {cta.enabled !== false && (
        <motion.section className={styles.section} {...reveal}>
          <div className={styles.container}>
            <div className={styles.ctaBand}>
              <h2>{cta.title}</h2>
              <p>{cta.subtitle}</p>
              <button type="button" className={styles.ctaBtn} onClick={() => navigate("/support")}>
                {cta.buttonLabel || "Contact Us"}
                <Icon icon="mdi:arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

// Accessible accordion — one item open at a time, buttons wired with
// aria-expanded/aria-controls like the storefront FAQ component.
const FaqList = ({ items }) => {
  const [openId, setOpenId] = useState(null);
  return (
    <div className={styles.faqList}>
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}>
            <button
              type="button"
              className={styles.faqQuestion}
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              aria-controls={`careers-faq-${faq.id}`}
              id={`careers-faq-q-${faq.id}`}
            >
              <span>{faq.question}</span>
              <Icon icon={isOpen ? "mdi:minus" : "mdi:plus"} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`careers-faq-${faq.id}`}
                  role="region"
                  aria-labelledby={`careers-faq-q-${faq.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={styles.faqAnswer}
                >
                  <p>{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Careers;
