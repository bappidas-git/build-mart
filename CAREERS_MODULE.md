# Career Module — Architecture & Integration Notes

A fully dynamic, admin-managed recruitment module: premium careers landing page,
per-vacancy detail pages, a configurable application form with secure resume
upload, and a complete applicant-tracking admin suite. Plugs into the existing
app without touching any existing route, API domain, context or component
behaviour.

---

## 1. What was added (file inventory)

### Storefront
| File | Purpose |
|---|---|
| `src/pages/Careers/Careers.js` + `.module.css` | Landing page: hero + stats, why-join-us, culture, benefits, growth, life gallery, hiring process, live openings with search/filter/sort, FAQs, CTA |
| `src/pages/Careers/CareerDetails.js` + `.module.css` | Vacancy detail: description blocks, skills, sidebar facts, share (native/WhatsApp/LinkedIn/X/copy), related roles, sticky mobile Apply bar, JobPosting JSON-LD |
| `src/pages/Careers/CareerThankYou.js` + `.module.css` | Post-submit confirmation: Application ID (copyable), response-time note, confetti (reduced-motion aware) |
| `src/pages/Careers/useDocumentMeta.js` | SPA SEO helper (title + meta description, restored on unmount) |
| `src/components/careers/JobCard.js` + `.module.css` | Shared vacancy card (landing + related roles) |
| `src/components/careers/ApplyJobModal.js` + `.module.css` | The apply popup: dynamic per-vacancy form, conditional fields, validation, resume upload with progress, un-dismissable while submitting; bottom sheet on mobile |

### Admin (`/admin`, section **Recruitment**)
| File | Route | Purpose |
|---|---|---|
| `src/pages/Admin/AdminCareerPage.js` | `/admin/career-page` | Edits every block of the landing page + thank-you copy + notification settings (careersPage singleton) |
| `src/pages/Admin/AdminCareers.js` | `/admin/careers` | Vacancy CRUD, duplicate, publish/draft/close/archive, feature & urgent toggles, department management, **drag-and-drop Form Builder** per vacancy |
| `src/pages/Admin/AdminCareerApplications.js` | `/admin/career-applications` | ATS dashboard: KPI cards, filters, pagination, bulk actions, CSV export (Excel-ready), applicant detail with resume download, pipeline moves, rating, recruiter assignment, notes, audit history |

### Services / backend
| File | Purpose |
|---|---|
| `src/services/careersApi.js` | Complete service layer (public + admin), dual-mode mock/Laravel, shared vocabulary (statuses, field types), validation layer, notification hooks |
| `server.js` (additive) | `POST /careers/uploads` — validating resume upload endpoint (see §4) |
| `db.json` (additive) | 4 new collections + 1 singleton (see §2) |

### Touched (small, additive edits only)
- `src/App.js` — 3 storefront routes, 3 admin routes
- `src/components/AdminLayout/AdminLayout.js` — "Recruitment" sidebar section
- `src/components/Footer/Footer.js` — "Careers" quick link
- `src/components/SidebarMenu/SidebarMenu.js` — "Careers" row in the hamburger menu
- `.gitignore` — excludes `/public/uploads` (applicant documents never get committed)

---

## 2. Data model

json-server auto-exposes each top-level key as a REST collection; the Laravel
production schema maps 1:1 (normalized design below).

| Collection | Contents |
|---|---|
| `careerDepartments` | `{ id, name, slug, icon, description, isActive, sortOrder, timestamps }` |
| `careerJobs` | Vacancy: title, slug, departmentId, location, workMode (`onsite\|hybrid\|remote`), employmentType (`full_time\|part_time\|contract\|internship`), experienceMin/Max, salaryMin/Max + showSalary + salaryPeriod, openings, summary, description, skills[], responsibilities[], qualifications[], benefits[], status (`open\|draft\|closed\|archived`), featured, urgent, postedAt, lastDateToApply, scheduledAt, **applicationForm.fields[]** (the per-vacancy form config), timestamps |
| `careerApplications` | `applicationId` (public `APP-YYYY-XXXXXX`), jobId + **jobSnapshot** (title/department/location/type/mode — auto vacancy-mapping, survives job edits), applicantName/email/phone (top-level for search & dedup), **fields[]** (ordered `{key,label,type,value}` answer snapshot), resume `{url,fileName,originalName,size,type}`, status (`new→shortlisted→interview→offered→hired\|rejected`), rating, recruiterId, notes[], **statusHistory[]** (audit log), source, timestamps |
| `careerRecruiters` | `{ id, name, email, isActive }` |
| `careersPage` (singleton) | Landing content: enabled, seo, hero (+stats), whyJoinUs, culture, benefits, growth, life, hiringProcess, faqs, cta, openings copy, thankYou (responseTime/message), notifications (recruiterEmail, applicant/admin email toggles, WhatsApp webhook) |

**Form field shape** (used by the builder and the renderer):
```js
{ id, key, type, label, standard, enabled, required, locked,
  placeholder, helpText, options[], maxLength, showIf: { key, equals } | null }
```
- Types: text, email, phone, number, date, url, textarea, select, multiselect, radio, checkbox, file.
- `locked` fields (name / email / phone / resume) are the minimum viable application.
- `showIf` is the conditional-logic hook — the renderer only shows (and validates) a field when its condition matches.

**Normalized production schema** (Laravel): `departments`, `jobs` (FK departments), `job_form_fields` (FK jobs — the embedded `applicationForm.fields` normalizes here), `applications` (FK jobs), `application_answers` (FK applications — the embedded `fields[]`), `application_files`, `recruiters`, `application_notes`, `application_status_events` (audit log), `notifications`. The client already reads/writes exactly these shapes, so the API swap is transport-only.

## 3. API surface (`careersApi`)

Mock mode ⇄ production mapping (switching = the existing one-line `.env` change):

| Client call | json-server | Laravel |
|---|---|---|
| `getPage()` | `GET /careersPage` | `GET /careers/page` |
| `getDepartments()` / `getJobs()` / `getJobBySlug()` | `GET /careerDepartments`, `/careerJobs`, `?slug=` | `GET /careers/departments`, `/careers/jobs`, `/careers/jobs/slug/{slug}` |
| `uploadResume(file, onProgress)` | `POST /careers/uploads` (base64 JSON) | `POST /careers/uploads` (multipart) |
| `submitApplication({...})` | `POST /careerApplications` | `POST /careers/applications` |
| `admin.*` (jobs/departments/applications/page CRUD) | plural collections | `/admin/careers/...` |

Visibility rules enforced in the service layer: listings show `open + active`
only; detail resolves open **and** closed (shared links never dead-end, closed
shows a notice); draft/archived return null (no URL guessing). A past
`lastDateToApply` closes applications automatically even before the admin flips
the status.

`submitApplication` pipeline: **revalidate vacancy is still open → duplicate
guard (one application per email per vacancy) → ordered answer snapshot →
persist with audit entry → fire notification hooks**. Notification hooks:
webhook ping in mock mode; applicant confirmation / recruiter alert / admin
alert emails are owned by the production API transactionally (toggles live in
Admin → Careers Page → Notifications).

## 4. Resume upload security (`server.js`)

- Extension allow-list: `.pdf .doc .docx` — the only extensions ever written.
- **Magic-byte sniffing**: `%PDF`, `D0 CF 11 E0`, `PK\x03\x04` — a renamed
  executable is rejected with 422 (verified in testing).
- 10 MB decoded-size cap enforced server-side on actual bytes (plus a 15 MB raw
  body cap with early abort).
- Stored name is `crypto.randomUUID() + ext`; the client filename is display
  metadata only — no path traversal surface.
- Virus-scan hook point marked in the handler for production (ClamAV etc.).
- Files land in `public/uploads/resumes/` (git-ignored), served statically.

Client-side, the same rules run before upload (`validateResumeFile`), with a
progress bar, success indicator, and retry-preserving error states (offline,
oversize, wrong type, closed vacancy, duplicate).

## 5. Conventions honoured

- **Design tokens only** — every storefront style uses `--sf-*` vars: light/dark
  mode and client re-skins work automatically. Admin uses the MUI admin theme.
- Framer-motion with `MotionConfig reducedMotion="user"`; confetti disabled for
  reduced-motion users; WCAG touch targets, labels, aria-invalid/aria-describedby,
  focus management in the modal, `aria-live` result counts.
- sweetalert2 toast conventions, optimistic quick-toggles with rollback,
  raw-string numeric inputs clamped on save, `deleteWithVerify`-safe deletes via
  the existing safe-DELETE server route.
- SEO: per-page titles/descriptions + schema.org **JobPosting** JSON-LD on open
  vacancy pages (Google Jobs eligible).

## 6. Verified end-to-end (dev)

1. Landing page renders all admin-configured sections; filters/search/sort work; closed & draft roles excluded.
2. Detail page: full content, sidebar facts, related roles, share, deadline countdown; closed role shows the closed state; draft slug 404s.
3. Apply flow: dynamic form (incl. custom multiselect/radio), validation, real PDF upload → stored under a UUID name → application persisted with snapshot + audit entry → thank-you page with Application ID.
4. Upload endpoint rejects spoofed PDFs (bad magic bytes) and disallowed extensions.
5. Admin: vacancy table with live application counts; form builder lists all fields with drag reorder + 11 addable types; applications dashboard KPIs correct; detail dialog shows answers/resume links; pipeline move writes an audit entry; careers-page editor saves and the storefront reflects it.
