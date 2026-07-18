import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Skeleton, Tooltip, InputAdornment, MenuItem,
  Tabs, Tab, Menu, Divider, Collapse, Stack,
} from "@mui/material";
import { Reorder } from "framer-motion";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import careersApi, {
  EMPLOYMENT_TYPES, WORK_MODES, JOB_STATUSES, FIELD_TYPES,
  buildStandardFields, employmentTypeLabel,
} from "../../services/careersApi";

// =============================================================================
// AdminCareers — vacancy management: full CRUD, duplicate, publish/close/
// archive, feature & urgent toggles, plus the per-vacancy drag-and-drop
// application Form Builder. Follows the AdminCategories page conventions
// (MUI table + dialog, sweetalert2 toasts, optimistic quick-toggles).
// =============================================================================

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toLines = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const fromLines = (text) =>
  String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const emptyForm = {
  title: "", slug: "", departmentId: "", location: "Nagaon, Assam",
  workMode: "onsite", employmentType: "full_time",
  experienceMin: "0", experienceMax: "", salaryMin: "", salaryMax: "",
  showSalary: true, salaryPeriod: "month", openings: "1",
  summary: "", description: "", skillsText: "", responsibilitiesText: "",
  qualificationsText: "", benefitsText: "",
  status: "draft", featured: false, urgent: false,
  postedAt: "", lastDateToApply: "", scheduledAt: "",
  fields: [],
};

const statusMeta = (value) => JOB_STATUSES.find((s) => s.value === value) || JOB_STATUSES[0];

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, ...(text ? { text } : {}), toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

const AdminCareers = () => {
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [statusMenu, setStatusMenu] = useState({ anchor: null, job: null });
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [jobData, deptData, appData] = await Promise.all([
        careersApi.admin.getJobs(),
        careersApi.admin.getDepartments(),
        careersApi.admin.getApplications(),
      ]);
      setJobs(Array.isArray(jobData) ? jobData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setApplications(Array.isArray(appData) ? appData : []);
    } catch (e) {
      console.error(e);
      toast("error", "Couldn't load careers data", careersApi.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const departmentName = useCallback(
    (id) => departments.find((d) => String(d.id) === String(id))?.name || "—",
    [departments]
  );

  const applicationCount = useCallback(
    (jobId) => applications.filter((a) => String(a.jobId) === String(jobId)).length,
    [applications]
  );

  // ---- Create / edit dialog -------------------------------------------------

  const openCreate = () => {
    setEditingJob(null);
    setDialogTab(0);
    setForm({
      ...emptyForm,
      postedAt: new Date().toISOString().slice(0, 10),
      fields: buildStandardFields(),
    });
    setDialogOpen(true);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setDialogTab(0);
    setForm({
      title: job.title || "",
      slug: job.slug || "",
      departmentId: job.departmentId ?? "",
      location: job.location || "",
      workMode: job.workMode || "onsite",
      employmentType: job.employmentType || "full_time",
      experienceMin: String(job.experienceMin ?? "0"),
      experienceMax: String(job.experienceMax ?? ""),
      salaryMin: String(job.salaryMin ?? ""),
      salaryMax: String(job.salaryMax ?? ""),
      showSalary: job.showSalary !== false,
      salaryPeriod: job.salaryPeriod || "month",
      openings: String(job.openings ?? "1"),
      summary: job.summary || "",
      description: job.description || "",
      skillsText: toLines(job.skills),
      responsibilitiesText: toLines(job.responsibilities),
      qualificationsText: toLines(job.qualifications),
      benefitsText: toLines(job.benefits),
      status: job.status || "draft",
      featured: job.featured === true,
      urgent: job.urgent === true,
      postedAt: job.postedAt ? job.postedAt.slice(0, 10) : "",
      lastDateToApply: job.lastDateToApply || "",
      scheduledAt: job.scheduledAt ? job.scheduledAt.slice(0, 16) : "",
      fields: Array.isArray(job.applicationForm?.fields) && job.applicationForm.fields.length
        ? job.applicationForm.fields
        : buildStandardFields(),
    });
    setDialogOpen(true);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: !editingJob ? slugify(title) : f.slug }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast("warning", "Job title is required");
    if (!form.departmentId) return toast("warning", "Choose a department");
    if (!form.location.trim()) return toast("warning", "Location is required");

    const slug = form.slug.trim() || slugify(form.title);
    const clash = jobs.some(
      (j) => j.slug === slug && (!editingJob || String(j.id) !== String(editingJob.id))
    );
    if (clash) return toast("warning", "Slug already in use", "Each vacancy needs a unique slug.");

    // Numeric fields are kept as raw strings while typing; clamp only on save.
    const payload = {
      title: form.title.trim(),
      slug,
      departmentId: Number(form.departmentId),
      location: form.location.trim(),
      workMode: form.workMode,
      employmentType: form.employmentType,
      experienceMin: Math.max(0, Number(form.experienceMin) || 0),
      experienceMax: Math.max(0, Number(form.experienceMax) || 0),
      salaryMin: Math.max(0, Number(form.salaryMin) || 0),
      salaryMax: Math.max(0, Number(form.salaryMax) || 0),
      showSalary: !!form.showSalary,
      salaryPeriod: form.salaryPeriod,
      openings: Math.max(1, Number(form.openings) || 1),
      summary: form.summary.trim(),
      description: form.description,
      skills: fromLines(form.skillsText),
      responsibilities: fromLines(form.responsibilitiesText),
      qualifications: fromLines(form.qualificationsText),
      benefits: fromLines(form.benefitsText),
      status: form.status,
      featured: !!form.featured,
      urgent: !!form.urgent,
      postedAt: form.postedAt ? new Date(form.postedAt).toISOString() : new Date().toISOString(),
      lastDateToApply: form.lastDateToApply || null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      isActive: true,
      applicationForm: { fields: form.fields },
    };

    try {
      setSaving(true);
      if (editingJob) {
        await careersApi.admin.updateJob(editingJob.id, { ...editingJob, ...payload });
      } else {
        await careersApi.admin.createJob(payload);
      }
      setDialogOpen(false);
      toast("success", editingJob ? "Vacancy updated" : "Vacancy created");
      loadAll();
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ---- Row quick actions ----------------------------------------------------

  const quickPatch = async (job, patch, successTitle) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
    try {
      await careersApi.admin.patchJob(job.id, patch);
      if (successTitle) toast("success", successTitle);
    } catch (e) {
      toast("error", "Couldn't update", careersApi.getErrorMessage(e));
      loadAll(); // roll back to server truth
    }
  };

  const handleDuplicate = async (job) => {
    try {
      await careersApi.admin.duplicateJob(job);
      toast("success", "Vacancy duplicated", "The copy was created as a draft.");
      loadAll();
    } catch (e) {
      toast("error", "Couldn't duplicate", careersApi.getErrorMessage(e));
    }
  };

  const handleDelete = async (job) => {
    const count = applicationCount(job.id);
    const result = await Swal.fire({
      title: "Delete vacancy?",
      text: count > 0
        ? `"${job.title}" has ${count} application${count === 1 ? "" : "s"}. Deleting the vacancy keeps the applications but orphans them — archiving is usually better.`
        : `"${job.title}" will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await careersApi.admin.deleteJob(job.id);
      toast("success", "Vacancy deleted");
      loadAll();
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    }
  };

  const setJobStatus = async (job, status) => {
    setStatusMenu({ anchor: null, job: null });
    await quickPatch(job, { status }, `Status: ${statusMeta(status).label}`);
  };

  // ---- Filtering ------------------------------------------------------------

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...jobs]
      .filter((j) => {
        if (q && !`${j.title} ${j.slug} ${departmentName(j.departmentId)}`.toLowerCase().includes(q)) return false;
        if (statusFilter && j.status !== statusFilter) return false;
        if (deptFilter && String(j.departmentId) !== String(deptFilter)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
  }, [jobs, search, statusFilter, deptFilter, departmentName]);

  // ---------------------------------------------------------------------------

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Job Openings</Typography>
          <Typography variant="body2" color="text.secondary">
            Create vacancies, configure each one's application form, and control what the careers page shows
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<Icon icon="mdi:file-tree-outline" />} onClick={() => setDeptDialogOpen(true)}>
            Departments
          </Button>
          <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}>
            Add Vacancy
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search vacancies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 260 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 150 }}>
            <MenuItem value="">All statuses</MenuItem>
            {JOB_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} sx={{ width: 220 }}>
            <MenuItem value="">All departments</MenuItem>
            {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
        </Box>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>Vacancy</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Type / Mode</TableCell>
                <TableCell>Applications</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Urgent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9}><Skeleton height={52} /></TableCell></TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No vacancies found</Typography></TableCell></TableRow>
              ) : (
                filtered.map((job) => {
                  const meta = statusMeta(job.status);
                  const appCount = applicationCount(job.id);
                  return (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{job.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>/{job.slug}</Typography>
                      </TableCell>
                      <TableCell><Chip label={departmentName(job.departmentId)} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Typography variant="body2">{employmentTypeLabel(job.employmentType)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {WORK_MODES.find((m) => m.value === job.workMode)?.label || job.workMode} · {job.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={appCount} size="small" color={appCount > 0 ? "primary" : "default"} variant={appCount > 0 ? "filled" : "outlined"} />
                      </TableCell>
                      <TableCell>
                        {job.lastDateToApply ? (
                          <Typography variant="body2">{new Date(job.lastDateToApply).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch size="small" checked={job.featured === true} onChange={() => quickPatch(job, { featured: !job.featured })} inputProps={{ "aria-label": `Feature ${job.title}` }} />
                      </TableCell>
                      <TableCell>
                        <Switch size="small" checked={job.urgent === true} onChange={() => quickPatch(job, { urgent: !job.urgent })} inputProps={{ "aria-label": `Mark ${job.title} urgent` }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={meta.label}
                          size="small"
                          color={meta.color}
                          onClick={(e) => setStatusMenu({ anchor: e.currentTarget, job })}
                          icon={<Icon icon="mdi:chevron-down" style={{ fontSize: 14 }} />}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(job)}><Icon icon="mdi:pencil-outline" /></IconButton></Tooltip>
                        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => handleDuplicate(job)}><Icon icon="mdi:content-copy" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(job)}><Icon icon="mdi:delete-outline" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Status quick-change menu */}
      <Menu
        anchorEl={statusMenu.anchor}
        open={!!statusMenu.anchor}
        onClose={() => setStatusMenu({ anchor: null, job: null })}
      >
        {JOB_STATUSES.map((s) => (
          <MenuItem
            key={s.value}
            selected={statusMenu.job?.status === s.value}
            onClick={() => setJobStatus(statusMenu.job, s.value)}
          >
            {s.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Create / edit vacancy dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>
          {editingJob ? "Edit Vacancy" : "New Vacancy"}
          <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)} sx={{ mt: 1 }}>
            <Tab label="Details" />
            <Tab label="Description" />
            <Tab label={`Application Form (${form.fields.filter((f) => f.enabled !== false).length})`} />
          </Tabs>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 420 }}>
          {dialogTab === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
              <TextField label="Job Title *" value={form.title} onChange={handleTitleChange} size="small" sx={{ gridColumn: "1 / -1" }} />
              <TextField label="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} size="small" helperText="URL: /careers/<slug>" />
              <TextField select label="Department *" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} size="small">
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField label="Location *" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} size="small" />
              <TextField select label="Work Mode" value={form.workMode} onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value }))} size="small">
                {WORK_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </TextField>
              <TextField select label="Employment Type" value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))} size="small">
                {EMPLOYMENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField label="Open Positions" value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: e.target.value }))} size="small" inputProps={{ inputMode: "numeric" }} />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField label="Min Experience (yrs)" value={form.experienceMin} onChange={(e) => setForm((f) => ({ ...f, experienceMin: e.target.value }))} size="small" inputProps={{ inputMode: "numeric" }} fullWidth />
                <TextField label="Max Experience (yrs)" value={form.experienceMax} onChange={(e) => setForm((f) => ({ ...f, experienceMax: e.target.value }))} size="small" inputProps={{ inputMode: "numeric" }} fullWidth />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField label="Salary Min" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} size="small" inputProps={{ inputMode: "numeric" }} fullWidth />
                <TextField label="Salary Max" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} size="small" inputProps={{ inputMode: "numeric" }} fullWidth />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField select label="Salary Period" value={form.salaryPeriod} onChange={(e) => setForm((f) => ({ ...f, salaryPeriod: e.target.value }))} size="small" sx={{ width: 140 }}>
                  <MenuItem value="month">Per month</MenuItem>
                  <MenuItem value="year">Per year</MenuItem>
                </TextField>
                <FormControlLabel control={<Switch checked={form.showSalary} onChange={(e) => setForm((f) => ({ ...f, showSalary: e.target.checked }))} />} label="Show salary publicly" />
              </Box>
              <TextField label="Posted Date" type="date" value={form.postedAt} onChange={(e) => setForm((f) => ({ ...f, postedAt: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Last Date to Apply" type="date" value={form.lastDateToApply} onChange={(e) => setForm((f) => ({ ...f, lastDateToApply: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} helperText="Applications auto-close after this date" />
              <TextField select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} size="small">
                {JOB_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
              <TextField label="Schedule Publish (optional)" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} helperText="Note for your team — publish by setting status to Open" />
              <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 3 }}>
                <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />} label="Featured" />
                <FormControlLabel control={<Switch checked={form.urgent} onChange={(e) => setForm((f) => ({ ...f, urgent: e.target.checked }))} />} label="Urgent hiring badge" />
              </Box>
              <TextField label="Short Summary" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} size="small" multiline rows={2} sx={{ gridColumn: "1 / -1" }} helperText="Shown on the vacancy card in listings" />
            </Box>
          )}

          {dialogTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label="Full Job Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} multiline rows={6} helperText="Separate paragraphs with a blank line" />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField label="Skills (one per line)" value={form.skillsText} onChange={(e) => setForm((f) => ({ ...f, skillsText: e.target.value }))} multiline rows={5} />
                <TextField label="Responsibilities (one per line)" value={form.responsibilitiesText} onChange={(e) => setForm((f) => ({ ...f, responsibilitiesText: e.target.value }))} multiline rows={5} />
                <TextField label="Qualifications (one per line)" value={form.qualificationsText} onChange={(e) => setForm((f) => ({ ...f, qualificationsText: e.target.value }))} multiline rows={5} />
                <TextField label="Benefits (one per line)" value={form.benefitsText} onChange={(e) => setForm((f) => ({ ...f, benefitsText: e.target.value }))} multiline rows={5} />
              </Box>
            </Box>
          )}

          {dialogTab === 2 && (
            <FormBuilder
              fields={form.fields}
              onChange={(fields) => setForm((f) => ({ ...f, fields }))}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingJob ? "Save Changes" : "Create Vacancy"}
          </Button>
        </DialogActions>
      </Dialog>

      <DepartmentsDialog
        open={deptDialogOpen}
        onClose={() => setDeptDialogOpen(false)}
        departments={departments}
        jobs={jobs}
        onChanged={loadAll}
      />
    </Box>
  );
};

// =============================================================================
// FormBuilder — per-vacancy application form editor.
// Drag rows to reorder (framer-motion Reorder), toggle standard fields on/off,
// edit any field inline, and add custom fields of any supported type. Locked
// fields (name / email / phone / resume) always stay enabled and required.
// =============================================================================
const FormBuilder = ({ fields, onChange }) => {
  const [expandedId, setExpandedId] = useState(null);

  const update = (id, patch) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id) => onChange(fields.filter((f) => f.id !== id));

  const addField = (type) => {
    const id = `cf_${Date.now().toString(36)}`;
    const meta = FIELD_TYPES.find((t) => t.value === type);
    const needsOptions = ["select", "multiselect", "radio"].includes(type);
    onChange([
      ...fields,
      {
        id,
        key: id,
        type,
        label: `New ${meta?.label || "field"}`,
        standard: false,
        enabled: true,
        required: false,
        locked: false,
        placeholder: "",
        helpText: "",
        options: needsOptions ? ["Option 1", "Option 2"] : [],
        maxLength: null,
        showIf: null,
      },
    ]);
    setExpandedId(id);
  };

  // Conditional logic can reference any choice-type field placed anywhere in
  // the form (the renderer only shows a field once its condition matches).
  const conditionSources = (self) =>
    fields.filter(
      (f) => f.id !== self.id && ["select", "radio", "multiselect", "checkbox"].includes(f.type)
    );

  return (
    <Box sx={{ pt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag to reorder. Applicants see enabled fields in this exact order. Locked fields
        (<em>name, email, phone, resume</em>) are the minimum application and can't be disabled.
      </Typography>

      <Reorder.Group axis="y" values={fields} onReorder={onChange} as="div" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {fields.map((field) => {
          const meta = FIELD_TYPES.find((t) => t.value === field.type);
          const expanded = expandedId === field.id;
          const needsOptions = ["select", "multiselect", "radio"].includes(field.type);
          return (
            <Reorder.Item key={field.id} value={field} as="div" style={{ listStyle: "none" }}>
              <Paper
                variant="outlined"
                sx={{ mb: 1, opacity: field.enabled === false ? 0.55 : 1, transition: "opacity 0.2s" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75 }}>
                  <Icon icon="mdi:drag-vertical" style={{ cursor: "grab", flexShrink: 0, opacity: 0.5 }} />
                  <Icon icon={meta?.icon || "mdi:form-textbox"} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {field.label}
                  </Typography>
                  {field.standard ? (
                    <Chip label="Standard" size="small" variant="outlined" />
                  ) : (
                    <Chip label="Custom" size="small" color="primary" variant="outlined" />
                  )}
                  {field.required && <Chip label="Required" size="small" color="warning" variant="outlined" />}
                  {field.showIf?.key && <Tooltip title={`Shown only when "${field.showIf.key}" = "${field.showIf.equals}"`}><Chip label="Conditional" size="small" variant="outlined" icon={<Icon icon="mdi:call-split" style={{ fontSize: 13 }} />} /></Tooltip>}
                  <Tooltip title={field.locked ? "Locked — always shown" : field.enabled !== false ? "Shown to applicants" : "Hidden"}>
                    <span>
                      <Switch
                        size="small"
                        checked={field.enabled !== false}
                        disabled={field.locked}
                        onChange={(e) => update(field.id, { enabled: e.target.checked })}
                        inputProps={{ "aria-label": `Show ${field.label}` }}
                      />
                    </span>
                  </Tooltip>
                  <IconButton size="small" onClick={() => setExpandedId(expanded ? null : field.id)} aria-label={`Edit ${field.label}`}>
                    <Icon icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} />
                  </IconButton>
                  {!field.standard && (
                    <IconButton size="small" color="error" onClick={() => remove(field.id)} aria-label={`Delete ${field.label}`}>
                      <Icon icon="mdi:delete-outline" />
                    </IconButton>
                  )}
                </Box>

                <Collapse in={expanded}>
                  <Divider />
                  <Box sx={{ p: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField label="Label" value={field.label} onChange={(e) => update(field.id, { label: e.target.value })} size="small" />
                    <TextField select label="Type" value={field.type} onChange={(e) => update(field.id, { type: e.target.value })} size="small" disabled={field.standard}>
                      {FIELD_TYPES.filter((t) => t.value !== "file").map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField label="Placeholder" value={field.placeholder || ""} onChange={(e) => update(field.id, { placeholder: e.target.value })} size="small" />
                    <TextField label="Help Text" value={field.helpText || ""} onChange={(e) => update(field.id, { helpText: e.target.value })} size="small" />
                    {needsOptions && (
                      <TextField
                        label="Options (one per line)"
                        value={(field.options || []).join("\n")}
                        onChange={(e) => update(field.id, { options: e.target.value.split("\n") })}
                        onBlur={(e) => update(field.id, { options: fromLines(e.target.value) })}
                        size="small" multiline rows={3} sx={{ gridColumn: "1 / -1" }}
                      />
                    )}
                    {["text", "textarea"].includes(field.type) && (
                      <TextField label="Character Limit" value={field.maxLength ?? ""} onChange={(e) => update(field.id, { maxLength: e.target.value ? Number(e.target.value) || null : null })} size="small" inputProps={{ inputMode: "numeric" }} />
                    )}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={field.required === true}
                            disabled={field.locked}
                            onChange={(e) => update(field.id, { required: e.target.checked })}
                          />
                        }
                        label="Required"
                      />
                    </Box>
                    {/* Conditional logic */}
                    <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <TextField
                        select label="Show only when…" size="small" sx={{ minWidth: 220 }}
                        value={field.showIf?.key || ""}
                        onChange={(e) => update(field.id, { showIf: e.target.value ? { key: e.target.value, equals: "" } : null })}
                      >
                        <MenuItem value="">Always show</MenuItem>
                        {conditionSources(field).map((src) => (
                          <MenuItem key={src.key} value={src.key}>{src.label}</MenuItem>
                        ))}
                      </TextField>
                      {field.showIf?.key && (
                        <TextField
                          select label="…equals" size="small" sx={{ minWidth: 180 }}
                          value={field.showIf?.equals || ""}
                          onChange={(e) => update(field.id, { showIf: { ...field.showIf, equals: e.target.value } })}
                        >
                          {(fields.find((f) => f.key === field.showIf.key)?.options || []).map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                          {fields.find((f) => f.key === field.showIf.key)?.type === "checkbox" && (
                            <MenuItem value="true">Checked</MenuItem>
                          )}
                        </TextField>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Add a custom field</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {FIELD_TYPES.filter((t) => t.value !== "file").map((t) => (
          <Button key={t.value} size="small" variant="outlined" startIcon={<Icon icon={t.icon} />} onClick={() => addField(t.value)}>
            {t.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

// =============================================================================
// DepartmentsDialog — lightweight department CRUD (name/icon/active), with a
// referential guard: a department with vacancies can't be deleted.
// =============================================================================
const DepartmentsDialog = ({ open, onClose, departments, jobs, onChanged }) => {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const jobCount = (deptId) => jobs.filter((j) => String(j.departmentId) === String(deptId)).length;

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      setBusy(true);
      const maxSort = departments.reduce((m, d) => Math.max(m, d.sortOrder || 0), 0);
      await careersApi.admin.createDepartment({
        name: name.trim(),
        slug: slugify(name),
        icon: "mdi:briefcase-outline",
        description: "",
        isActive: true,
        sortOrder: maxSort + 1,
      });
      setName("");
      toast("success", "Department added");
      onChanged();
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (dept) => {
    const { value } = await Swal.fire({
      title: "Rename department",
      input: "text",
      inputValue: dept.name,
      showCancelButton: true,
      confirmButtonText: "Save",
    });
    if (!value || !value.trim() || value === dept.name) return;
    try {
      await careersApi.admin.updateDepartment(dept.id, { ...dept, name: value.trim() });
      toast("success", "Department renamed");
      onChanged();
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    }
  };

  const handleDelete = async (dept) => {
    const count = jobCount(dept.id);
    if (count > 0) {
      Swal.fire({ icon: "info", title: "Department in use", text: `"${dept.name}" has ${count} vacanc${count === 1 ? "y" : "ies"}. Reassign them first.` });
      return;
    }
    const result = await Swal.fire({ title: "Delete department?", text: `"${dept.name}" will be permanently deleted.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#d32f2f", confirmButtonText: "Delete" });
    if (!result.isConfirmed) return;
    try {
      await careersApi.admin.deleteDepartment(dept.id);
      toast("success", "Department deleted");
      onChanged();
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Departments</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            placeholder="New department name" value={name} onChange={(e) => setName(e.target.value)}
            size="small" fullWidth onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button variant="contained" onClick={handleAdd} disabled={busy || !name.trim()}>Add</Button>
        </Box>
        {departments.map((dept) => (
          <Box key={dept.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
            <Icon icon={dept.icon || "mdi:briefcase-outline"} style={{ opacity: 0.6 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>{dept.name}</Typography>
            <Chip label={`${jobCount(dept.id)} jobs`} size="small" variant="outlined" />
            <IconButton size="small" onClick={() => handleRename(dept)} aria-label={`Rename ${dept.name}`}><Icon icon="mdi:pencil-outline" /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(dept)} aria-label={`Delete ${dept.name}`}><Icon icon="mdi:delete-outline" /></IconButton>
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminCareers;
