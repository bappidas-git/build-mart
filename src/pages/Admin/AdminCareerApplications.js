import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Skeleton, Tooltip, InputAdornment, MenuItem, TablePagination, Rating,
  Divider, Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import careersApi, {
  APPLICATION_STATUSES,
  resumeDownloadUrl,
  employmentTypeLabel,
} from "../../services/careersApi";

// =============================================================================
// AdminCareerApplications — the applicant-tracking dashboard.
// KPI cards, searchable/filterable paginated table, bulk actions, CSV export,
// and a full-detail dialog per applicant: answers snapshot, resume download,
// pipeline moves, rating, recruiter assignment, notes and audit history.
// =============================================================================

const statusMeta = (value) =>
  APPLICATION_STATUSES.find((s) => s.value === value) || APPLICATION_STATUSES[0];

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, ...(text ? { text } : {}), toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

// Acting admin name for audit entries (mirrors services/api.js currentAdminName).
const adminName = () => {
  try {
    const a = JSON.parse(sessionStorage.getItem("admin") || "null");
    if (!a) return "Admin";
    return [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email || "Admin";
  } catch {
    return "Admin";
  }
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const AdminCareerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null); // application being viewed
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [appData, jobData, recData] = await Promise.all([
        careersApi.admin.getApplications(),
        careersApi.admin.getJobs(),
        careersApi.admin.getRecruiters(),
      ]);
      setApplications(Array.isArray(appData) ? appData : []);
      setJobs(Array.isArray(jobData) ? jobData : []);
      setRecruiters(Array.isArray(recData) ? recData : []);
    } catch (e) {
      console.error(e);
      toast("error", "Couldn't load applications", careersApi.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // ---- KPI stats ------------------------------------------------------------

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const created = (a) => new Date(a.createdAt);
    return {
      total: applications.length,
      today: applications.filter((a) => created(a) >= startOfDay).length,
      week: applications.filter((a) => created(a) >= startOfWeek).length,
      month: applications.filter((a) => created(a) >= startOfMonth).length,
      openPositions: jobs.filter((j) => j.status === "open").reduce((sum, j) => sum + (Number(j.openings) || 1), 0),
      closedPositions: jobs.filter((j) => j.status === "closed").length,
      inPipeline: applications.filter((a) => !statusMeta(a.status).final).length,
    };
  }, [applications, jobs]);

  const perVacancy = useMemo(() => {
    const counts = new Map();
    applications.forEach((a) => {
      const title = a.jobSnapshot?.title || `Job #${a.jobId}`;
      counts.set(title, (counts.get(title) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [applications]);

  // ---- Filtering + pagination ----------------------------------------------

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...applications]
      .filter((a) => {
        if (q) {
          const haystack = `${a.applicantName} ${a.email} ${a.phone} ${a.applicationId} ${a.jobSnapshot?.title || ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (jobFilter && String(a.jobId) !== String(jobFilter)) return false;
        if (statusFilter && a.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [applications, search, jobFilter, statusFilter]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => { setPage(0); }, [search, jobFilter, statusFilter]);
  useEffect(() => { setSelected([]); }, [search, jobFilter, statusFilter, applications.length]);

  // ---- Mutations ------------------------------------------------------------

  const applyUpdate = useCallback(async (application, patch, action, note) => {
    try {
      const saved = await careersApi.admin.updateApplication(application, patch, action, note, adminName());
      setApplications((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      setDetail((d) => (d && d.id === saved.id ? saved : d));
      return saved;
    } catch (e) {
      toast("error", "Couldn't update", careersApi.getErrorMessage(e));
      return null;
    }
  }, []);

  const moveStatus = (application, status) => {
    const label = statusMeta(status).label;
    return applyUpdate(application, { status }, `Moved to ${label.toLowerCase()}`);
  };

  const setRating = (application, rating) =>
    applyUpdate(application, { rating }, `Rated ${rating}/5`);

  const assignRecruiter = (application, recruiterId) => {
    const rec = recruiters.find((r) => String(r.id) === String(recruiterId));
    return applyUpdate(
      application,
      { recruiterId: recruiterId || null },
      recruiterId ? `Assigned to ${rec?.name || "recruiter"}` : "Recruiter unassigned"
    );
  };

  const addNote = async () => {
    if (!noteDraft.trim() || !detail) return;
    const note = {
      id: `n_${Date.now().toString(36)}`,
      text: noteDraft.trim(),
      by: adminName(),
      at: new Date().toISOString(),
    };
    const saved = await applyUpdate(detail, { notes: [...(detail.notes || []), note] }, "Note added");
    if (saved) setNoteDraft("");
  };

  const handleDelete = async (application) => {
    const result = await Swal.fire({
      title: "Delete application?",
      text: `${application.applicantName}'s application (${application.applicationId}) will be permanently deleted.`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#d32f2f", confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await careersApi.admin.deleteApplication(application.id);
      setApplications((prev) => prev.filter((a) => a.id !== application.id));
      setDetail(null);
      toast("success", "Application deleted");
    } catch (e) {
      toast("error", "Error", careersApi.getErrorMessage(e));
    }
  };

  // ---- Bulk actions ---------------------------------------------------------

  const bulkMove = async (status) => {
    const label = statusMeta(status).label;
    const targets = applications.filter((a) => selected.includes(a.id));
    const result = await Swal.fire({
      title: `Move ${targets.length} application${targets.length === 1 ? "" : "s"} to "${label}"?`,
      icon: "question", showCancelButton: true, confirmButtonText: `Move to ${label}`,
    });
    if (!result.isConfirmed) return;
    for (const application of targets) {
      // Sequential on purpose: json-server writes db.json per request and
      // parallel PUTs can interleave; a handful of rows is instant anyway.
      // eslint-disable-next-line no-await-in-loop
      await applyUpdate(application, { status }, `Moved to ${label.toLowerCase()} (bulk)`);
    }
    setSelected([]);
    toast("success", `${targets.length} moved to ${label}`);
  };

  // ---- CSV export (UTF-8 BOM so Excel opens it correctly) -------------------

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    // Union of every custom question across the filtered set, so no answer is dropped.
    const fieldKeys = [];
    filtered.forEach((a) =>
      (a.fields || []).forEach((f) => {
        if (!fieldKeys.some((k) => k.key === f.key)) fieldKeys.push({ key: f.key, label: f.label });
      })
    );
    const header = [
      "Application ID", "Applicant", "Email", "Phone", "Vacancy", "Department",
      "Location", "Employment Type", "Applied On", "Status", "Rating", "Recruiter", "Resume URL", "Source",
      ...fieldKeys.map((k) => k.label),
    ];
    const rows = filtered.map((a) => [
      a.applicationId, a.applicantName, a.email, a.phone,
      a.jobSnapshot?.title, a.jobSnapshot?.department,
      a.jobSnapshot?.location, employmentTypeLabel(a.jobSnapshot?.employmentType),
      fmtDate(a.createdAt), statusMeta(a.status).label, a.rating || "",
      recruiters.find((r) => String(r.id) === String(a.recruiterId))?.name || "",
      resumeDownloadUrl(a.resume) || "", a.source,
      ...fieldKeys.map(({ key }) => (a.fields || []).find((f) => f.key === key)?.value || ""),
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------

  const kpis = [
    { label: "Total Applications", value: stats.total, icon: "mdi:account-group-outline" },
    { label: "Today", value: stats.today, icon: "mdi:calendar-today-outline" },
    { label: "This Week", value: stats.week, icon: "mdi:calendar-week-outline" },
    { label: "This Month", value: stats.month, icon: "mdi:calendar-month-outline" },
    { label: "In Pipeline", value: stats.inPipeline, icon: "mdi:account-clock-outline" },
    { label: "Open Positions", value: stats.openPositions, icon: "mdi:briefcase-check-outline" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Job Applications</Typography>
          <Typography variant="body2" color="text.secondary">Review candidates, move them through the pipeline, and export data</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Icon icon="mdi:file-download-outline" />} onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV (Excel-ready)
        </Button>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={6} sm={4} md={2} key={kpi.label}>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, color: "text.secondary" }}>
                <Icon icon={kpi.icon} />
                <Typography variant="caption">{kpi.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {loading ? <Skeleton width={40} /> : kpi.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Per-vacancy summary */}
      {perVacancy.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "divider", display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Applications per vacancy:</Typography>
          {perVacancy.map(([title, count]) => (
            <Chip key={title} label={`${title} · ${count}`} size="small" variant="outlined" />
          ))}
        </Paper>
      )}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search name, email, phone, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 280 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
          <TextField select size="small" label="Vacancy" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">All vacancies</MenuItem>
            {jobs.map((j) => <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}>
            <MenuItem value="">All statuses</MenuItem>
            {APPLICATION_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>

          {selected.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: "auto" }}>
              <Typography variant="body2" color="text.secondary">{selected.length} selected</Typography>
              <Button size="small" variant="outlined" onClick={() => bulkMove("shortlisted")}>Shortlist</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => bulkMove("rejected")}>Reject</Button>
            </Box>
          )}
        </Box>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    indeterminate={selected.length > 0 && selected.length < paged.length}
                    checked={paged.length > 0 && paged.every((a) => selected.includes(a.id))}
                    onChange={(e) =>
                      setSelected(e.target.checked ? [...new Set([...selected, ...paged.map((a) => a.id)])] : selected.filter((id) => !paged.some((a) => a.id === id)))
                    }
                    inputProps={{ "aria-label": "Select all on this page" }}
                  />
                </TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Vacancy</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton height={52} /></TableCell></TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No applications found</Typography></TableCell></TableRow>
              ) : (
                paged.map((application) => {
                  const meta = statusMeta(application.status);
                  const resumeUrl = resumeDownloadUrl(application.resume);
                  return (
                    <TableRow key={application.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.includes(application.id)}
                          onChange={(e) =>
                            setSelected(e.target.checked ? [...selected, application.id] : selected.filter((id) => id !== application.id))
                          }
                          inputProps={{ "aria-label": `Select ${application.applicantName}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{application.applicationId}</Typography>
                        <Typography variant="caption" color="text.secondary">{application.source === "careers_page" ? "Careers page" : application.source}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{application.applicantName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{application.email}</Typography>
                        <Typography variant="caption" color="text.secondary">{application.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{application.jobSnapshot?.title || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">{application.jobSnapshot?.department}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{fmtDate(application.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Rating size="small" value={application.rating || 0} onChange={(_, v) => setRating(application, v || 0)} />
                      </TableCell>
                      <TableCell><Chip label={meta.label} size="small" color={meta.color} /></TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {resumeUrl && (
                          <Tooltip title="Download resume">
                            <IconButton size="small" component="a" href={resumeUrl} target="_blank" rel="noopener noreferrer">
                              <Icon icon="mdi:file-download-outline" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View application">
                          <IconButton size="small" onClick={() => setDetail(application)}>
                            <Icon icon="mdi:eye-outline" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* ---- Applicant detail dialog ---- */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        {detail && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">{detail.applicantName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {detail.jobSnapshot?.title} · <span style={{ fontFamily: "monospace" }}>{detail.applicationId}</span>
                </Typography>
              </Box>
              <Chip label={statusMeta(detail.status).label} color={statusMeta(detail.status).color} />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Left: answers + resume */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Application details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    {(detail.fields || []).map((f) => (
                      <Box key={f.key} sx={{ display: "flex", py: 0.75, borderBottom: "1px dashed", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 180, flexShrink: 0 }}>{f.label}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{f.value}</Typography>
                      </Box>
                    ))}
                  </Paper>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Resume</Typography>
                  {detail.resume ? (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Icon icon="mdi:file-document-outline" style={{ fontSize: 28, opacity: 0.7 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{detail.resume.originalName || detail.resume.fileName}</Typography>
                        <Typography variant="caption" color="text.secondary">{Math.round((detail.resume.size || 0) / 1024)} KB</Typography>
                      </Box>
                      <Button size="small" variant="outlined" component="a" href={resumeDownloadUrl(detail.resume)} target="_blank" rel="noopener noreferrer" startIcon={<Icon icon="mdi:open-in-new" />}>
                        Preview
                      </Button>
                      <Button size="small" variant="contained" component="a" href={resumeDownloadUrl(detail.resume)} download startIcon={<Icon icon="mdi:download" />}>
                        Download
                      </Button>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No resume attached.</Typography>
                  )}

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Notes</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {(detail.notes || []).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No notes yet.</Typography>
                    )}
                    {(detail.notes || []).map((note) => (
                      <Box key={note.id} sx={{ mb: 1.5 }}>
                        <Typography variant="body2">{note.text}</Typography>
                        <Typography variant="caption" color="text.secondary">{note.by} · {fmtDateTime(note.at)}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <TextField
                        size="small" fullWidth placeholder="Add a note…" value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addNote()}
                      />
                      <Button variant="contained" onClick={addNote} disabled={!noteDraft.trim()}>Add</Button>
                    </Box>
                  </Paper>
                </Grid>

                {/* Right: pipeline controls + history */}
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Pipeline</Typography>
                  <TextField
                    select fullWidth size="small" label="Status" value={detail.status}
                    onChange={(e) => moveStatus(detail, e.target.value)} sx={{ mb: 2 }}
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </TextField>

                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <Button size="small" variant="outlined" color="success" fullWidth startIcon={<Icon icon="mdi:account-check-outline" />} onClick={() => moveStatus(detail, "shortlisted")}>
                      Shortlist
                    </Button>
                    <Button size="small" variant="outlined" color="secondary" fullWidth startIcon={<Icon icon="mdi:calendar-account-outline" />} onClick={() => moveStatus(detail, "interview")}>
                      Interview
                    </Button>
                    <Button size="small" variant="outlined" color="error" fullWidth startIcon={<Icon icon="mdi:account-cancel-outline" />} onClick={() => moveStatus(detail, "rejected")}>
                      Reject
                    </Button>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Rating</Typography>
                  <Rating value={detail.rating || 0} onChange={(_, v) => setRating(detail, v || 0)} sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned recruiter</Typography>
                  <TextField
                    select fullWidth size="small" value={detail.recruiterId ?? ""}
                    onChange={(e) => assignRecruiter(detail, e.target.value)} sx={{ mb: 2 }}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {recruiters.filter((r) => r.isActive !== false).map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </TextField>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>History</Typography>
                  {[...(detail.statusHistory || [])].reverse().map((event, i) => (
                    <Box key={`${event.at}-${i}`} sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                      <Icon icon="mdi:circle-small" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Box>
                        <Typography variant="body2">{event.action}{event.note ? ` — ${event.note}` : ""}</Typography>
                        <Typography variant="caption" color="text.secondary">{event.by} · {fmtDateTime(event.at)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
              <Button color="error" startIcon={<Icon icon="mdi:delete-outline" />} onClick={() => handleDelete(detail)}>
                Delete
              </Button>
              <Button variant="contained" onClick={() => setDetail(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminCareerApplications;
