import { api, extractData, extractList, getErrorMessage } from "./api";
import BASE_URL, { IS_MOCK_API } from "./baseURL";

// =============================================================================
// Careers API — the complete service layer for the Career Module
// =============================================================================
//
// Self-contained on purpose: nothing in apiService is modified, so the career
// module can be added or removed without touching existing domains. It reuses
// the shared axios client (auth interceptors, base URL) and response helpers
// from services/api.js, and follows the same dual-mode convention:
//
//   JSON Server (dev)      Laravel (production)
//   /careerJobs        →   /careers/jobs, /admin/careers/jobs
//   /careerApplications →  /careers/applications, /admin/careers/applications
//   /careersPage       →   /careers/page, /admin/careers/page
//
// Switching to production is the same one-line .env change as the rest of the
// app (REACT_APP_USE_MOCK_API=false) — no code changes here.
// =============================================================================

// -----------------------------------------------------------------------------
// Domain vocabulary — single source of truth for labels/colours across the
// storefront and admin. Never re-declare these in components.
// -----------------------------------------------------------------------------

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export const WORK_MODES = [
  { value: "onsite", label: "On-site", icon: "mdi:office-building-outline" },
  { value: "hybrid", label: "Hybrid", icon: "mdi:home-city-outline" },
  { value: "remote", label: "Remote", icon: "mdi:laptop" },
];

export const JOB_STATUSES = [
  { value: "open", label: "Open", color: "success" },
  { value: "draft", label: "Draft", color: "default" },
  { value: "closed", label: "Closed", color: "warning" },
  { value: "archived", label: "Archived", color: "default" },
];

// The applicant pipeline, in order. `final` stages end the journey.
export const APPLICATION_STATUSES = [
  { value: "new", label: "New", color: "info" },
  { value: "shortlisted", label: "Shortlisted", color: "primary" },
  { value: "interview", label: "Interview", color: "secondary" },
  { value: "offered", label: "Offered", color: "warning" },
  { value: "hired", label: "Hired", color: "success", final: true },
  { value: "rejected", label: "Rejected", color: "error", final: true },
];

// Field types the dynamic form renderer + admin builder both understand.
export const FIELD_TYPES = [
  { value: "text", label: "Text", icon: "mdi:form-textbox" },
  { value: "email", label: "Email", icon: "mdi:email-outline" },
  { value: "phone", label: "Phone", icon: "mdi:phone-outline" },
  { value: "number", label: "Number", icon: "mdi:numeric" },
  { value: "date", label: "Date", icon: "mdi:calendar-outline" },
  { value: "url", label: "URL", icon: "mdi:link-variant" },
  { value: "textarea", label: "Paragraph", icon: "mdi:text-long" },
  { value: "select", label: "Dropdown", icon: "mdi:form-dropdown" },
  { value: "multiselect", label: "Multi-select", icon: "mdi:format-list-checks" },
  { value: "radio", label: "Radio", icon: "mdi:radiobox-marked" },
  { value: "checkbox", label: "Checkbox", icon: "mdi:checkbox-marked-outline" },
  { value: "file", label: "File Upload", icon: "mdi:paperclip" },
];

export const RESUME_ACCEPT = ".pdf,.doc,.docx";
export const RESUME_MAX_BYTES = 10 * 1024 * 1024; // keep in sync with server.js
const RESUME_EXTENSIONS = ["pdf", "doc", "docx"];

// The standard application fields every new job starts from. The admin form
// builder toggles/edits/reorders these and appends custom fields per vacancy.
// `locked` fields are the minimum viable application and can't be disabled.
const stdField = (key, type, label, opts = {}) => ({
  id: `std_${key}`,
  key,
  type,
  label,
  standard: true,
  enabled: opts.enabled !== false,
  required: opts.required === true,
  locked: opts.locked === true,
  placeholder: opts.placeholder || "",
  helpText: opts.helpText || "",
  options: opts.options || [],
  maxLength: opts.maxLength || null,
  showIf: null,
});

export const buildStandardFields = () => [
  stdField("fullName", "text", "Full Name", { required: true, locked: true, placeholder: "Your full name", maxLength: 80 }),
  stdField("email", "email", "Email Address", { required: true, locked: true, placeholder: "you@example.com" }),
  stdField("phone", "phone", "Mobile Number", { required: true, locked: true, placeholder: "+91 XXXXX XXXXX" }),
  stdField("altPhone", "phone", "Alternate Mobile", { enabled: false }),
  stdField("city", "text", "Current City", { required: true }),
  stdField("state", "text", "State", {}),
  stdField("country", "text", "Country", { enabled: false }),
  stdField("currentCompany", "text", "Current Company", {}),
  stdField("currentDesignation", "text", "Current Designation", {}),
  stdField("experienceYears", "number", "Years of Experience", { required: true }),
  stdField("currentSalary", "text", "Current Salary (Monthly)", { enabled: false }),
  stdField("expectedSalary", "text", "Expected Salary (Monthly)", {}),
  stdField("noticePeriod", "select", "Notice Period", {
    options: ["Immediate", "Up to 15 days", "1 month", "2 months", "3+ months"],
  }),
  stdField("portfolioUrl", "url", "Portfolio URL", { enabled: false }),
  stdField("linkedinUrl", "url", "LinkedIn Profile", { enabled: false }),
  stdField("githubUrl", "url", "GitHub Profile", { enabled: false }),
  stdField("coverLetter", "textarea", "Cover Letter", { maxLength: 2000 }),
  stdField("resume", "file", "Resume / CV", {
    required: true,
    locked: true,
    helpText: "PDF, DOC or DOCX — up to 10 MB",
  }),
];

// -----------------------------------------------------------------------------
// Formatting + status helpers (shared by storefront and admin)
// -----------------------------------------------------------------------------

export const employmentTypeLabel = (value) =>
  EMPLOYMENT_TYPES.find((t) => t.value === value)?.label || value || "—";

export const workModeMeta = (value) =>
  WORK_MODES.find((m) => m.value === value) || { label: value || "—", icon: "mdi:map-marker-outline" };

export const experienceLabel = (job) => {
  const min = Number(job?.experienceMin) || 0;
  const max = Number(job?.experienceMax) || 0;
  if (!min && !max) return "Freshers welcome";
  if (!min) return `Up to ${max} yr${max > 1 ? "s" : ""}`;
  if (!max || max === min) return `${min}+ yrs`;
  return `${min}–${max} yrs`;
};

export const salaryLabel = (job, currencySymbol = "₹") => {
  if (job?.showSalary === false) return "Competitive";
  const fmt = (n) => new Intl.NumberFormat("en-IN").format(Number(n));
  const period = job?.salaryPeriod === "year" ? "yr" : "mo";
  if (job?.salaryMin && job?.salaryMax)
    return `${currencySymbol}${fmt(job.salaryMin)} – ${currencySymbol}${fmt(job.salaryMax)}/${period}`;
  if (job?.salaryMin) return `From ${currencySymbol}${fmt(job.salaryMin)}/${period}`;
  if (job?.salaryMax) return `Up to ${currencySymbol}${fmt(job.salaryMax)}/${period}`;
  return "Competitive";
};

// A job past its last date is expired even if the admin hasn't flipped the
// status yet — the storefront treats expiry and "closed" identically.
export const isJobExpired = (job) => {
  if (!job?.lastDateToApply) return false;
  const deadline = new Date(job.lastDateToApply);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
};

export const isJobAccepting = (job) =>
  !!job && job.status === "open" && job.isActive !== false && !isJobExpired(job);

// Storefront listing shows open jobs only (drafts/archived never leak).
export const isJobListed = (job) =>
  !!job && job.status === "open" && job.isActive !== false;

export const daysLeftToApply = (job) => {
  if (!job?.lastDateToApply) return null;
  const deadline = new Date(job.lastDateToApply);
  deadline.setHours(23, 59, 59, 999);
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000);
};

export const timeAgo = (dateString) => {
  if (!dateString) return "";
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
};

/** Absolute URL for a stored resume (mock server serves /uploads statically). */
export const resumeDownloadUrl = (resume) => {
  if (!resume?.url) return null;
  return /^https?:/i.test(resume.url) ? resume.url : `${BASE_URL}${resume.url}`;
};

// Human-checkable, collision-safe enough for the mock tier: time component in
// base36 + random suffix. The Laravel branch generates its own server-side.
export const generateApplicationId = () => {
  const year = new Date().getFullYear();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31])
    .join("");
  const tick = Date.now().toString(36).slice(-2).toUpperCase();
  return `APP-${year}-${tick}${rand}`;
};

// -----------------------------------------------------------------------------
// Validation layer — one place both the modal and (defensively) submit use
// -----------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+]?[\d\s\-()]{7,17}$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]{2,}$/i;

/** Field visibility under conditional logic ({ key, equals }). */
export const isFieldVisible = (field, values) => {
  if (!field?.showIf?.key) return true;
  const actual = values?.[field.showIf.key];
  const expected = field.showIf.equals;
  if (Array.isArray(actual)) return actual.includes(expected);
  return String(actual ?? "") === String(expected ?? "");
};

/** Returns an error message string, or null when the value is valid. */
export const validateFieldValue = (field, value) => {
  const empty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim()) ||
    (Array.isArray(value) && value.length === 0) ||
    (field.type === "checkbox" && value !== true);

  if (field.required && empty) {
    return field.type === "file" ? "Please attach your resume" : `${field.label} is required`;
  }
  if (empty) return null;

  const str = typeof value === "string" ? value.trim() : value;
  switch (field.type) {
    case "email":
      if (!EMAIL_RE.test(str)) return "Enter a valid email address";
      break;
    case "phone":
      if (!PHONE_RE.test(str)) return "Enter a valid phone number";
      break;
    case "url":
      if (!URL_RE.test(str)) return "Enter a valid URL starting with http(s)://";
      break;
    case "number":
      if (Number.isNaN(Number(str))) return "Enter a number";
      if (field.min != null && Number(str) < field.min) return `Minimum is ${field.min}`;
      if (field.max != null && Number(str) > field.max) return `Maximum is ${field.max}`;
      break;
    default:
      break;
  }
  if (field.maxLength && typeof str === "string" && str.length > field.maxLength) {
    return `Keep it under ${field.maxLength} characters`;
  }
  return null;
};

/** Client-side resume file validation mirroring the server's rules. */
export const validateResumeFile = (file) => {
  if (!file) return "Please choose a file";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!RESUME_EXTENSIONS.includes(ext)) return "Only PDF, DOC and DOCX files are accepted";
  if (file.size > RESUME_MAX_BYTES) return "The file is larger than 10 MB";
  if (file.size === 0) return "The file is empty";
  return null;
};

// -----------------------------------------------------------------------------
// Notification hooks
// -----------------------------------------------------------------------------
// In production the Laravel API owns applicant/recruiter/admin emails (and the
// optional WhatsApp webhook) transactionally on POST /careers/applications. In
// mock mode there is no mail transport, so this hook only pings the optional
// webhook and logs — the structure is what matters for the API integration.
const fireApplicationNotifications = async (application, pageConfig) => {
  const cfg = pageConfig?.notifications || {};
  try {
    if (cfg.whatsappWebhook) {
      await fetch(cfg.whatsappWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "career_application.created",
          applicationId: application.applicationId,
          applicant: application.applicantName,
          job: application.jobSnapshot?.title,
        }),
      });
    }
  } catch (e) {
    // Notifications must never fail a submission.
    console.warn("[careers] notification webhook failed:", e.message);
  }
};

// -----------------------------------------------------------------------------
// Public (storefront) API
// -----------------------------------------------------------------------------

const publicApi = {
  /** Landing-page content singleton. */
  getPage: async () => {
    if (IS_MOCK_API) {
      const response = await api.get("/careersPage");
      return response.data || {};
    }
    const response = await api.get("/careers/page");
    return extractData(response);
  },

  getDepartments: async () => {
    const response = await api.get(IS_MOCK_API ? "/careerDepartments" : "/careers/departments");
    return extractList(response, "careerDepartments").filter((d) => d.isActive !== false);
  },

  /** Publicly listed jobs (open + active only). */
  getJobs: async () => {
    const response = await api.get(IS_MOCK_API ? "/careerJobs" : "/careers/jobs");
    return extractList(response, "careerJobs").filter(isJobListed);
  },

  /**
   * A single job by slug. Open AND closed jobs resolve (a closed vacancy shows
   * a "no longer accepting" page rather than a dead link); drafts/archived
   * return null so unpublished roles can never be reached by URL guessing.
   */
  getJobBySlug: async (slug) => {
    if (IS_MOCK_API) {
      const response = await api.get("/careerJobs", { params: { slug } });
      const jobRecord = extractList(response, "careerJobs")[0] || null;
      if (!jobRecord) return null;
      if (jobRecord.status === "draft" || jobRecord.status === "archived" || jobRecord.isActive === false) return null;
      return jobRecord;
    }
    const response = await api.get(`/careers/jobs/slug/${slug}`);
    return extractData(response);
  },

  /** Other open roles — same department first, newest first. */
  getRelatedJobs: async (currentJob, limit = 3) => {
    const jobs = await publicApi.getJobs();
    return jobs
      .filter((j) => String(j.id) !== String(currentJob.id) && isJobAccepting(j))
      .sort((a, b) => {
        const sameDeptA = String(a.departmentId) === String(currentJob.departmentId) ? 1 : 0;
        const sameDeptB = String(b.departmentId) === String(currentJob.departmentId) ? 1 : 0;
        return sameDeptB - sameDeptA || new Date(b.postedAt) - new Date(a.postedAt);
      })
      .slice(0, limit);
  },

  /**
   * Upload a resume with progress. Reads the file client-side, ships it as
   * base64 JSON to the mock server's validating endpoint (multipart/form-data
   * on the Laravel branch). onProgress receives 0–100.
   */
  uploadResume: async (file, onProgress) => {
    const clientError = validateResumeFile(file);
    if (clientError) {
      const err = new Error(clientError);
      err.isValidation = true;
      throw err;
    }

    if (IS_MOCK_API) {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });
      const response = await api.post(
        "/careers/uploads",
        { fileName: file.name, mimeType: file.type, size: file.size, data },
        {
          timeout: 120000,
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      return response.data; // { url, fileName, originalName, size, type }
    }

    const form = new FormData();
    form.append("resume", file);
    const response = await api.post("/careers/uploads", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return extractData(response);
  },

  /**
   * Submit an application. Handles the full flow:
   *   revalidate vacancy → duplicate guard → build snapshot → persist →
   *   fire notification hooks. Returns the stored application.
   */
  submitApplication: async ({ job, values, resume, pageConfig }) => {
    // The vacancy may have closed while the form was open — re-read the truth.
    const freshJob = IS_MOCK_API
      ? extractData(await api.get(`/careerJobs/${job.id}`))
      : extractData(await api.get(`/careers/jobs/slug/${job.slug}`));
    if (!isJobAccepting(freshJob)) {
      const err = new Error("This vacancy is no longer accepting applications.");
      err.code = "VACANCY_CLOSED";
      throw err;
    }

    const email = String(values.email || "").trim().toLowerCase();

    // One application per candidate per vacancy.
    if (IS_MOCK_API) {
      const dupResponse = await api.get("/careerApplications", {
        params: { jobId: job.id },
      });
      const duplicate = extractList(dupResponse, "careerApplications").some(
        (a) => String(a.email || "").toLowerCase() === email
      );
      if (duplicate) {
        const err = new Error(
          "You've already applied for this position with this email address. Our team will get back to you on your existing application."
        );
        err.code = "DUPLICATE_APPLICATION";
        throw err;
      }
    }

    const department = pageConfig?._departmentName || job.departmentName || "";
    const now = new Date().toISOString();

    // Ordered field snapshot — the admin view and CSV export render from this,
    // so an application stays readable even if the job's form changes later.
    const fields = (job.applicationForm?.fields || [])
      .filter((f) => f.enabled !== false && f.type !== "file")
      .filter((f) => isFieldVisible(f, values))
      .map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        value: Array.isArray(values[f.key])
          ? values[f.key].join(", ")
          : values[f.key] === true
          ? "Yes"
          : String(values[f.key] ?? ""),
      }))
      .filter((f) => f.value !== "");

    const application = {
      applicationId: generateApplicationId(),
      jobId: job.id,
      jobSnapshot: {
        title: job.title,
        slug: job.slug,
        department,
        location: job.location,
        employmentType: job.employmentType,
        workMode: job.workMode,
      },
      source: "careers_page",
      applicantName: String(values.fullName || "").trim(),
      email,
      phone: String(values.phone || "").trim(),
      fields,
      resume: resume || null,
      status: "new",
      rating: 0,
      recruiterId: null,
      notes: [],
      statusHistory: [{ at: now, by: "System", action: "Application received", note: "" }],
      createdAt: now,
      updatedAt: now,
    };

    const response = IS_MOCK_API
      ? await api.post("/careerApplications", application)
      : await api.post("/careers/applications", application);
    const saved = IS_MOCK_API ? response.data : extractData(response);

    fireApplicationNotifications(saved, pageConfig);
    return saved;
  },

  /** Look up an application by its public APP-… id (thank-you page). */
  getApplicationByPublicId: async (applicationId) => {
    if (IS_MOCK_API) {
      const response = await api.get("/careerApplications", { params: { applicationId } });
      return extractList(response, "careerApplications")[0] || null;
    }
    const response = await api.get(`/careers/applications/${applicationId}`);
    return extractData(response);
  },
};

// -----------------------------------------------------------------------------
// Admin API
// -----------------------------------------------------------------------------

const stamp = () => new Date().toISOString();

const adminApi = {
  // ---- Jobs ----
  getJobs: async () => {
    const response = await api.get(IS_MOCK_API ? "/careerJobs" : "/admin/careers/jobs");
    return IS_MOCK_API ? extractList(response, "careerJobs") : extractData(response);
  },

  createJob: async (data) => {
    const payload = { ...data, createdAt: stamp(), updatedAt: stamp() };
    const response = await api.post(IS_MOCK_API ? "/careerJobs" : "/admin/careers/jobs", payload);
    return IS_MOCK_API ? response.data : extractData(response);
  },

  updateJob: async (id, data) => {
    const payload = { ...data, updatedAt: stamp() };
    const response = await api.put(
      IS_MOCK_API ? `/careerJobs/${id}` : `/admin/careers/jobs/${id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  /** Partial update for quick toggles (feature, urgent, status…). */
  patchJob: async (id, patch) => {
    const payload = { ...patch, updatedAt: stamp() };
    const response = await api.patch(
      IS_MOCK_API ? `/careerJobs/${id}` : `/admin/careers/jobs/${id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  deleteJob: async (id) => {
    const response = await api.delete(
      IS_MOCK_API ? `/careerJobs/${id}` : `/admin/careers/jobs/${id}`
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  /** Duplicate a vacancy as a fresh draft (unique slug, zeroed history). */
  duplicateJob: async (jobRecord) => {
    const { id, createdAt, updatedAt, ...copy } = jobRecord;
    const suffix = Date.now().toString(36).slice(-4);
    return adminApi.createJob({
      ...copy,
      title: `${copy.title} (Copy)`,
      slug: `${copy.slug}-copy-${suffix}`,
      status: "draft",
      featured: false,
      urgent: false,
      postedAt: stamp(),
    });
  },

  // ---- Departments ----
  getDepartments: async () => {
    const response = await api.get(IS_MOCK_API ? "/careerDepartments" : "/admin/careers/departments");
    return IS_MOCK_API ? extractList(response, "careerDepartments") : extractData(response);
  },

  createDepartment: async (data) => {
    const payload = { ...data, createdAt: stamp(), updatedAt: stamp() };
    const response = await api.post(
      IS_MOCK_API ? "/careerDepartments" : "/admin/careers/departments",
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  updateDepartment: async (id, data) => {
    const payload = { ...data, updatedAt: stamp() };
    const response = await api.put(
      IS_MOCK_API ? `/careerDepartments/${id}` : `/admin/careers/departments/${id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(
      IS_MOCK_API ? `/careerDepartments/${id}` : `/admin/careers/departments/${id}`
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  // ---- Recruiters ----
  getRecruiters: async () => {
    const response = await api.get(IS_MOCK_API ? "/careerRecruiters" : "/admin/careers/recruiters");
    return IS_MOCK_API ? extractList(response, "careerRecruiters") : extractData(response);
  },

  // ---- Applications ----
  getApplications: async () => {
    const response = await api.get(
      IS_MOCK_API ? "/careerApplications" : "/admin/careers/applications"
    );
    return IS_MOCK_API ? extractList(response, "careerApplications") : extractData(response);
  },

  /**
   * Update an application with an audit-trail entry. `action` describes what
   * happened ("Moved to shortlisted", "Note added", …) and lands in
   * statusHistory with the acting admin's name.
   */
  updateApplication: async (applicationRecord, patch, action, note = "", by = "Admin") => {
    const historyEntry = action
      ? [{ at: stamp(), by, action, ...(note ? { note } : {}) }]
      : [];
    const payload = {
      ...applicationRecord,
      ...patch,
      statusHistory: [...(applicationRecord.statusHistory || []), ...historyEntry],
      updatedAt: stamp(),
    };
    const response = await api.put(
      IS_MOCK_API
        ? `/careerApplications/${applicationRecord.id}`
        : `/admin/careers/applications/${applicationRecord.id}`,
      payload
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  deleteApplication: async (id) => {
    const response = await api.delete(
      IS_MOCK_API ? `/careerApplications/${id}` : `/admin/careers/applications/${id}`
    );
    return IS_MOCK_API ? response.data : extractData(response);
  },

  // ---- Landing page content ----
  getPage: async () => {
    const response = await api.get(IS_MOCK_API ? "/careersPage" : "/admin/careers/page");
    return IS_MOCK_API ? response.data || {} : extractData(response);
  },

  updatePage: async (data) => {
    const payload = { ...data, updatedAt: stamp() };
    const response = await api.put(IS_MOCK_API ? "/careersPage" : "/admin/careers/page", payload);
    return IS_MOCK_API ? response.data : extractData(response);
  },
};

const careersApi = { ...publicApi, admin: adminApi, getErrorMessage };

export default careersApi;
