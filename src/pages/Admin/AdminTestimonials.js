import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Skeleton, Tooltip, InputAdornment, MenuItem,
  Tabs, Tab, Menu, Avatar, Autocomplete, Rating, Divider, Stack, Alert,
} from "@mui/material";
import { Reorder } from "framer-motion";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import testimonialsApi, {
  TESTIMONIAL_TYPES, TESTIMONIAL_STATUSES, TESTIMONIAL_SOURCES,
  typeMeta, statusMeta, detectVideoProvider, validateMediaUrl,
  sanitizeMediaUrl, sortTestimonials, explainHomeVisibility,
} from "../../services/testimonialsApi";
import apiService from "../../services/api";
import TestimonialCard from "../../components/testimonials/TestimonialCard";

// =============================================================================
// AdminTestimonials — the centralized testimonial library.
// Full CRUD, publish/draft/archive, feature, duplicate, drag-and-drop
// reordering, filtering, search, bulk actions and a live storefront-accurate
// preview before publishing. Follows the AdminCareers page conventions
// (MUI table + dialog, sweetalert2 toasts, optimistic quick-toggles).
// =============================================================================

const emptyForm = {
  type: "text",
  status: "draft",
  featured: false,
  customerName: "",
  designation: "",
  company: "",
  avatarUrl: "",
  rating: 5,
  title: "",
  body: "",
  reviewDate: "",
  verified: true,
  mediaUrl: "",
  mediaPoster: "",
  mediaCaption: "",
  productIds: [],
  categoryIds: [],
  placements: { home: true, page: true, products: true },
  tagsText: "",
  source: "direct",
};

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, ...(text ? { text } : {}), toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

/** Build the API record from the dialog form (media block per type). */
const formToPayload = (form) => ({
  type: form.type,
  status: form.status,
  featured: !!form.featured,
  customerName: form.customerName.trim(),
  designation: form.designation.trim(),
  company: form.company.trim(),
  avatarUrl: sanitizeMediaUrl(form.avatarUrl),
  rating: Math.max(0, Math.min(5, Number(form.rating) || 0)),
  title: form.title.trim(),
  body: form.body.trim(),
  reviewDate: form.reviewDate || new Date().toISOString().slice(0, 10),
  verified: !!form.verified,
  media:
    form.type === "text"
      ? null
      : {
          url: sanitizeMediaUrl(form.mediaUrl),
          poster: sanitizeMediaUrl(form.mediaPoster),
          caption: form.mediaCaption.trim(),
        },
  productIds: form.productIds,
  categoryIds: form.categoryIds,
  placements: { ...form.placements },
  tags: form.tagsText.split(",").map((s) => s.trim()).filter(Boolean),
  source: form.source,
});

const AdminTestimonials = () => {
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageSettings, setPageSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [productFilter, setProductFilter] = useState(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [selected, setSelected] = useState([]);
  const [statusMenu, setStatusMenu] = useState({ anchor: null, record: null });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState([]);
  const [reorderSaving, setReorderSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [data, productData, categoryData, pageData] = await Promise.all([
        testimonialsApi.admin.getAll(),
        apiService.products.getAll().catch(() => []),
        apiService.categories.getAll().catch(() => []),
        // Display settings drive the homepage-visibility indicator; a failed
        // fetch degrades to defaults rather than blocking the library.
        testimonialsApi.admin.getPage().catch(() => null),
      ]);
      setTestimonials(sortTestimonials(Array.isArray(data) ? data : [], "order"));
      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setPageSettings(pageData || null);
      setSelected([]);
    } catch (e) {
      console.error(e);
      toast("error", "Couldn't load testimonials", testimonialsApi.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const productName = useCallback(
    (id) => products.find((p) => String(p.id) === String(id))?.name || `#${id}`,
    [products]
  );

  const productLookup = useCallback(
    (id) => {
      const p = products.find((prod) => String(prod.id) === String(id));
      return p ? { name: p.name, slug: p.slug } : null;
    },
    [products]
  );

  // ---- Create / edit dialog -------------------------------------------------

  const openCreate = () => {
    setEditing(null);
    setDialogTab(0);
    setForm({ ...emptyForm, reviewDate: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setDialogTab(0);
    setForm({
      type: record.type || "text",
      status: record.status || "draft",
      featured: record.featured === true,
      customerName: record.customerName || "",
      designation: record.designation || "",
      company: record.company || "",
      avatarUrl: record.avatarUrl || "",
      rating: Number(record.rating) || 0,
      title: record.title || "",
      body: record.body || "",
      reviewDate: record.reviewDate || "",
      verified: record.verified !== false,
      mediaUrl: record.media?.url || "",
      mediaPoster: record.media?.poster || "",
      mediaCaption: record.media?.caption || "",
      productIds: record.productIds || [],
      categoryIds: record.categoryIds || [],
      placements: { home: true, page: true, products: true, ...(record.placements || {}) },
      tagsText: (record.tags || []).join(", "),
      source: record.source || "direct",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) return toast("warning", "Customer name is required");
    if (form.type === "text" && !form.body.trim()) {
      return toast("warning", "A text review needs review text");
    }
    const mediaError = validateMediaUrl(form.type, form.mediaUrl);
    if (mediaError) return toast("warning", mediaError);
    if (form.avatarUrl.trim() && !sanitizeMediaUrl(form.avatarUrl)) {
      return toast("warning", "Profile image must be a full http(s):// URL");
    }
    if (form.mediaPoster.trim() && !sanitizeMediaUrl(form.mediaPoster)) {
      return toast("warning", "Poster must be a full http(s):// URL");
    }

    const payload = formToPayload(form);
    try {
      setSaving(true);
      if (editing) {
        await testimonialsApi.admin.update(editing.id, { ...editing, ...payload });
      } else {
        const maxOrder = testimonials.reduce((m, t) => Math.max(m, Number(t.sortOrder) || 0), 0);
        await testimonialsApi.admin.create({ ...payload, sortOrder: maxOrder + 1 });
      }
      setDialogOpen(false);
      toast("success", editing ? "Testimonial updated" : "Testimonial created");
      loadAll();
    } catch (e) {
      toast("error", "Error", testimonialsApi.getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ---- Row quick actions ----------------------------------------------------

  const quickPatch = async (record, patch, successTitle) => {
    setTestimonials((prev) => prev.map((t) => (t.id === record.id ? { ...t, ...patch } : t)));
    try {
      await testimonialsApi.admin.patch(record.id, patch);
      if (successTitle) toast("success", successTitle);
    } catch (e) {
      toast("error", "Couldn't update", testimonialsApi.getErrorMessage(e));
      loadAll(); // roll back to server truth
    }
  };

  const handleDuplicate = async (record) => {
    try {
      await testimonialsApi.admin.duplicate(record, testimonials);
      toast("success", "Testimonial duplicated", "The copy was created as a draft.");
      loadAll();
    } catch (e) {
      toast("error", "Couldn't duplicate", testimonialsApi.getErrorMessage(e));
    }
  };

  const handleDelete = async (record) => {
    const result = await Swal.fire({
      title: "Delete testimonial?",
      text: `The testimonial from "${record.customerName}" will be permanently deleted. Archiving keeps it recoverable.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await testimonialsApi.admin.delete(record.id);
      toast("success", "Testimonial deleted");
      loadAll();
    } catch (e) {
      toast("error", "Error", testimonialsApi.getErrorMessage(e));
    }
  };

  const setStatus = async (record, status) => {
    setStatusMenu({ anchor: null, record: null });
    await quickPatch(record, { status }, `Status: ${statusMeta(status).label}`);
  };

  /**
   * One-click fix for "toggled Homepage showcase but it never shows": new
   * records join at the END of the manual order, beyond the showcase's
   * maxItems window. Moving to the front puts it in the visible slice.
   */
  const promoteToHomeFront = async (record) => {
    const result = await Swal.fire({
      title: "Show on homepage?",
      text: `"${record.customerName}" is beyond the homepage showcase limit. Move it to the front of the manual display order so the showcase picks it up first?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Move to front",
    });
    if (!result.isConfirmed) return;
    try {
      const rest = sortTestimonials(testimonials, "order")
        .map((t) => t.id)
        .filter((id) => id !== record.id);
      await testimonialsApi.admin.reorder([record.id, ...rest]);
      toast("success", "Moved to front", "It now leads the manual display order.");
      loadAll();
    } catch (e) {
      toast("error", "Couldn't reorder", testimonialsApi.getErrorMessage(e));
    }
  };

  // ---- Bulk actions ---------------------------------------------------------

  const bulkApply = async (patch, label) => {
    try {
      await testimonialsApi.admin.bulkPatch(selected, patch);
      toast("success", `${selected.length} testimonial${selected.length === 1 ? "" : "s"} ${label}`);
      loadAll();
    } catch (e) {
      toast("error", "Bulk update failed", testimonialsApi.getErrorMessage(e));
      loadAll();
    }
  };

  const bulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${selected.length} testimonial${selected.length === 1 ? "" : "s"}?`,
      text: "This is permanent. Archiving keeps them recoverable.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      confirmButtonText: "Delete all selected",
    });
    if (!result.isConfirmed) return;
    try {
      for (const id of selected) {
        await testimonialsApi.admin.delete(id);
      }
      toast("success", "Selected testimonials deleted");
      loadAll();
    } catch (e) {
      toast("error", "Error", testimonialsApi.getErrorMessage(e));
      loadAll();
    }
  };

  // ---- Reorder dialog -------------------------------------------------------

  const openReorder = () => {
    setReorderList(sortTestimonials(testimonials, "order"));
    setReorderOpen(true);
  };

  const saveReorder = async () => {
    try {
      setReorderSaving(true);
      await testimonialsApi.admin.reorder(reorderList.map((t) => t.id));
      setReorderOpen(false);
      toast("success", "Display order saved");
      loadAll();
    } catch (e) {
      toast("error", "Couldn't save order", testimonialsApi.getErrorMessage(e));
    } finally {
      setReorderSaving(false);
    }
  };

  // ---- Filtering ------------------------------------------------------------

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testimonials.filter((t) => {
      if (q) {
        const haystack = [
          t.customerName, t.company, t.designation, t.title, t.body,
          ...(t.tags || []),
          ...(t.productIds || []).map(productName),
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter && t.type !== typeFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (ratingFilter && Math.round(Number(t.rating) || 0) !== Number(ratingFilter)) return false;
      if (productFilter && !(t.productIds || []).some((id) => String(id) === String(productFilter.id))) return false;
      if (featuredOnly && t.featured !== true) return false;
      return true;
    });
  }, [testimonials, search, typeFilter, statusFilter, ratingFilter, productFilter, featuredOnly, productName]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((t) => selected.includes(t.id));

  const toggleSelectAll = () => {
    setSelected(allFilteredSelected ? [] : filtered.map((t) => t.id));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const counts = useMemo(
    () => ({
      published: testimonials.filter((t) => t.status === "published").length,
      draft: testimonials.filter((t) => t.status === "draft").length,
      archived: testimonials.filter((t) => t.status === "archived").length,
    }),
    [testimonials]
  );

  // Preview record mirrors exactly what the storefront card would render.
  const previewRecord = useMemo(
    () => ({ id: "preview", ...formToPayload(form), sortOrder: 0 }),
    [form]
  );

  const videoInfo = form.type === "video" ? detectVideoProvider(form.mediaUrl) : null;

  // ---------------------------------------------------------------------------

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Testimonials</Typography>
          <Typography variant="body2" color="text.secondary">
            One central library powering the homepage, the Testimonials page and product pages —{" "}
            {counts.published} published · {counts.draft} draft · {counts.archived} archived
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<Icon icon="mdi:tune-variant" />} onClick={() => navigate("/admin/testimonials-page")}>
            Display Settings
          </Button>
          <Button variant="outlined" startIcon={<Icon icon="mdi:sort" />} onClick={openReorder}>
            Reorder
          </Button>
          <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}>
            Add Testimonial
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {/* Filters */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search customer, review, product, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 280 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
          <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ width: 130 }}>
            <MenuItem value="">All types</MenuItem>
            {TESTIMONIAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 140 }}>
            <MenuItem value="">All statuses</MenuItem>
            {TESTIMONIAL_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Rating" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} sx={{ width: 120 }}>
            <MenuItem value="">Any</MenuItem>
            {[5, 4, 3, 2, 1].map((r) => <MenuItem key={r} value={r}>{r} ★</MenuItem>)}
          </TextField>
          <Autocomplete
            size="small"
            sx={{ width: 220 }}
            options={products}
            getOptionLabel={(p) => p.name || ""}
            value={productFilter}
            onChange={(_, v) => setProductFilter(v)}
            renderInput={(params) => <TextField {...params} label="Product" />}
          />
          <FormControlLabel
            control={<Switch size="small" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />}
            label="Featured only"
          />
        </Box>

        {/* Bulk actions toolbar */}
        {selected.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", bgcolor: "action.hover" }}>
            <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
              {selected.length} selected
            </Typography>
            <Button size="small" startIcon={<Icon icon="mdi:publish" />} onClick={() => bulkApply({ status: "published" }, "published")}>Publish</Button>
            <Button size="small" startIcon={<Icon icon="mdi:file-outline" />} onClick={() => bulkApply({ status: "draft" }, "moved to draft")}>Draft</Button>
            <Button size="small" startIcon={<Icon icon="mdi:archive-outline" />} onClick={() => bulkApply({ status: "archived" }, "archived")}>Archive</Button>
            <Button size="small" startIcon={<Icon icon="mdi:star-outline" />} onClick={() => bulkApply({ featured: true }, "featured")}>Feature</Button>
            <Button size="small" startIcon={<Icon icon="mdi:star-off-outline" />} onClick={() => bulkApply({ featured: false }, "unfeatured")}>Unfeature</Button>
            <Button size="small" color="error" startIcon={<Icon icon="mdi:delete-outline" />} onClick={bulkDelete}>Delete</Button>
          </Box>
        )}

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allFilteredSelected}
                    indeterminate={selected.length > 0 && !allFilteredSelected}
                    onChange={toggleSelectAll}
                    inputProps={{ "aria-label": "Select all testimonials" }}
                  />
                </TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Homepage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={10}><Skeleton height={52} /></TableCell></TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No testimonials found</Typography></TableCell></TableRow>
              ) : (
                filtered.map((t) => {
                  const meta = statusMeta(t.status);
                  const tMeta = typeMeta(t.type);
                  const homeVis = explainHomeVisibility(t, testimonials, pageSettings);
                  return (
                    <TableRow key={t.id} hover selected={selected.includes(t.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.includes(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          inputProps={{ "aria-label": `Select ${t.customerName}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar src={sanitizeMediaUrl(t.avatarUrl) || undefined} sx={{ width: 34, height: 34 }}>
                            {(t.customerName || "C").charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {t.customerName}
                              {t.verified === true && (
                                <Icon icon="mdi:check-decagram" style={{ fontSize: 14, marginLeft: 4, verticalAlign: "-2px", color: "#2e7d32" }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 180 }}>
                              {[t.designation, t.company].filter(Boolean).join(", ")}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap>{t.title || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                          {t.body}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip icon={<Icon icon={tMeta.icon} style={{ fontSize: 15 }} />} label={tMeta.label} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Rating value={Number(t.rating) || 0} size="small" precision={0.5} readOnly />
                      </TableCell>
                      <TableCell>
                        {(t.productIds || []).length > 0 ? (
                          <Tooltip title={(t.productIds || []).map(productName).join(", ")}>
                            <Chip label={`${t.productIds.length} product${t.productIds.length === 1 ? "" : "s"}`} size="small" variant="outlined" color="primary" />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={t.featured === true}
                          onChange={() => quickPatch(t, { featured: !t.featured })}
                          inputProps={{ "aria-label": `Feature testimonial from ${t.customerName}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={homeVis.visible ? "Live in the homepage showcase" : homeVis.reason}>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={homeVis.visible ? "success" : "default"}
                            icon={
                              <Icon
                                icon={homeVis.visible ? "mdi:home-outline" : "mdi:home-off-outline"}
                                style={{ fontSize: 14 }}
                              />
                            }
                            label={homeVis.visible ? "Live" : "Hidden"}
                            onClick={homeVis.canPromote ? () => promoteToHomeFront(t) : undefined}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={meta.label}
                          size="small"
                          color={meta.color}
                          onClick={(e) => setStatusMenu({ anchor: e.currentTarget, record: t })}
                          icon={<Icon icon="mdi:chevron-down" style={{ fontSize: 14 }} />}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><Icon icon="mdi:pencil-outline" /></IconButton></Tooltip>
                        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => handleDuplicate(t)}><Icon icon="mdi:content-copy" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(t)}><Icon icon="mdi:delete-outline" /></IconButton></Tooltip>
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
        onClose={() => setStatusMenu({ anchor: null, record: null })}
      >
        {TESTIMONIAL_STATUSES.map((s) => (
          <MenuItem
            key={s.value}
            selected={statusMenu.record?.status === s.value}
            onClick={() => setStatus(statusMenu.record, s.value)}
          >
            {s.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>
          {editing ? "Edit Testimonial" : "New Testimonial"}
          <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)} sx={{ mt: 1 }} variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Content" />
            <Tab label="Media" />
            <Tab label="Assignment" />
            <Tab label="Preview" icon={<Icon icon="mdi:eye-outline" style={{ fontSize: 16 }} />} iconPosition="start" />
          </Tabs>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 420 }}>
          {dialogTab === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
              <TextField label="Customer Name *" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} size="small" />
              <TextField label="Designation" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} size="small" placeholder="e.g. Site Contractor" />
              <TextField label="Company / City" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} size="small" placeholder="e.g. Bora Constructions, Guwahati" />
              <TextField label="Profile Image URL" value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} size="small" placeholder="https://…" helperText="CDN / cloud storage / any https image URL" />
              <TextField label="Review Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} size="small" sx={{ gridColumn: "1 / -1" }} />
              <TextField
                label={form.type === "text" ? "Review Text *" : "Review Text"}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                size="small" multiline rows={4} sx={{ gridColumn: "1 / -1" }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Star Rating</Typography>
                <Rating value={Number(form.rating) || 0} onChange={(_, v) => setForm((f) => ({ ...f, rating: v || 0 }))} />
              </Box>
              <TextField label="Review Date" type="date" value={form.reviewDate} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} />
              <TextField select label="Source" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} size="small">
                {TESTIMONIAL_SOURCES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
              <TextField label="Tags (comma-separated)" value={form.tagsText} onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))} size="small" />
              <TextField select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} size="small">
                {TESTIMONIAL_STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControlLabel control={<Switch checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />} label="Verified badge" />
                <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />} label="Featured" />
              </Box>
            </Box>
          )}

          {dialogTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField select label="Testimonial Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} size="small" sx={{ maxWidth: 260 }}>
                {TESTIMONIAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>

              {form.type === "text" && (
                <Typography variant="body2" color="text.secondary">
                  Text reviews carry no media. Switch the type to add a customer photo or video.
                </Typography>
              )}

              {form.type === "photo" && (
                <>
                  <TextField label="Photo URL *" value={form.mediaUrl} onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))} size="small" placeholder="https://…" helperText="CDN, cloud storage, website media or any external https image URL — it renders exactly like a local upload" />
                  <TextField label="Caption" value={form.mediaCaption} onChange={(e) => setForm((f) => ({ ...f, mediaCaption: e.target.value }))} size="small" />
                  {sanitizeMediaUrl(form.mediaUrl) && (
                    <Box sx={{ maxWidth: 380 }}>
                      <Typography variant="caption" color="text.secondary">Live preview</Typography>
                      <Box component="img" src={sanitizeMediaUrl(form.mediaUrl)} alt="Photo preview" sx={{ width: "100%", borderRadius: 1, border: "1px solid", borderColor: "divider", display: "block", mt: 0.5 }} />
                    </Box>
                  )}
                </>
              )}

              {form.type === "video" && (
                <>
                  <TextField label="Video URL *" value={form.mediaUrl} onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))} size="small" placeholder="https://www.youtube.com/watch?v=…" helperText="YouTube, Vimeo, Facebook, Instagram, Cloudinary or a direct MP4/WebM link — the player is detected automatically" />
                  <TextField label="Custom Poster / Thumbnail URL" value={form.mediaPoster} onChange={(e) => setForm((f) => ({ ...f, mediaPoster: e.target.value }))} size="small" placeholder="https://… (optional — providers supply one automatically)" />
                  <TextField label="Caption" value={form.mediaCaption} onChange={(e) => setForm((f) => ({ ...f, mediaCaption: e.target.value }))} size="small" />
                  {form.mediaUrl.trim() && (
                    videoInfo ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip icon={<Icon icon="mdi:check-circle" style={{ fontSize: 15 }} />} color="success" size="small" label={`Detected: ${videoInfo.provider === "file" ? "Direct video file" : videoInfo.label}`} />
                        {videoInfo.thumbnailUrl && (
                          <Box component="img" src={videoInfo.thumbnailUrl} alt="Video thumbnail" sx={{ height: 54, borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
                        )}
                      </Stack>
                    ) : (
                      <Chip icon={<Icon icon="mdi:alert-circle-outline" style={{ fontSize: 15 }} />} color="warning" size="small" sx={{ alignSelf: "flex-start" }} label="URL not recognised as a supported video source" />
                    )
                  )}
                </>
              )}
            </Box>
          )}

          {dialogTab === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Where should this testimonial appear?</Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <FormControlLabel control={<Switch checked={form.placements.home !== false} onChange={(e) => setForm((f) => ({ ...f, placements: { ...f.placements, home: e.target.checked } }))} />} label="Homepage showcase" />
                  <FormControlLabel control={<Switch checked={form.placements.page !== false} onChange={(e) => setForm((f) => ({ ...f, placements: { ...f.placements, page: e.target.checked } }))} />} label="Testimonials page" />
                  <FormControlLabel control={<Switch checked={form.placements.products !== false} onChange={(e) => setForm((f) => ({ ...f, placements: { ...f.placements, products: e.target.checked } }))} />} label="Assigned product pages" />
                </Stack>
                {form.placements.home !== false && (() => {
                  // Live verdict for THIS record as currently edited: new
                  // records join at the end of the manual order, which the
                  // showcase's maxItems window may never reach.
                  const nextOrder =
                    testimonials.reduce((m, t) => Math.max(m, Number(t.sortOrder) || 0), 0) + 1;
                  const draft = {
                    id: editing?.id ?? "__new__",
                    ...formToPayload(form),
                    sortOrder: editing?.sortOrder ?? nextOrder,
                  };
                  const among = editing
                    ? testimonials.map((t) => (t.id === editing.id ? draft : t))
                    : [...testimonials, draft];
                  const vis = explainHomeVisibility(draft, among, pageSettings);
                  return (
                    <Alert
                      severity={vis.visible ? "success" : "warning"}
                      icon={<Icon icon={vis.visible ? "mdi:home-outline" : "mdi:home-alert-outline"} />}
                      sx={{ mt: 1.5 }}
                    >
                      {vis.visible
                        ? "This testimonial will be live in the homepage showcase."
                        : vis.reason}
                    </Alert>
                  );
                })()}
              </Box>
              <Divider />
              <Autocomplete
                multiple
                size="small"
                options={products}
                getOptionLabel={(p) => p.name || ""}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                value={products.filter((p) => form.productIds.some((id) => String(id) === String(p.id)))}
                onChange={(_, v) => setForm((f) => ({ ...f, productIds: v.map((p) => p.id) }))}
                renderInput={(params) => (
                  <TextField {...params} label="Assigned Products" helperText="This testimonial appears on each assigned product's page" />
                )}
              />
              <Autocomplete
                multiple
                size="small"
                options={categories}
                getOptionLabel={(c) => c.name || ""}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                value={categories.filter((c) => form.categoryIds.some((id) => String(id) === String(c.id)))}
                onChange={(_, v) => setForm((f) => ({ ...f, categoryIds: v.map((c) => c.id) }))}
                renderInput={(params) => (
                  <TextField {...params} label="Assigned Categories" helperText="Also appears on every product page in these categories" />
                )}
              />
            </Box>
          )}

          {dialogTab === 3 && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Exactly how this testimonial will render on the storefront:
              </Typography>
              <Box sx={{ maxWidth: 420, mx: "auto" }}>
                <TestimonialCard testimonial={previewRecord} clampBody={0} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Testimonial"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drag-and-drop reorder dialog */}
      <Dialog open={reorderOpen} onClose={() => !reorderSaving && setReorderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Display Order</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag to reorder. This manual order is used wherever the sort strategy is set to
            &ldquo;Manual order&rdquo; (homepage and the Testimonials page).
          </Typography>
          <Reorder.Group axis="y" values={reorderList} onReorder={setReorderList} as="div" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {reorderList.map((t, index) => (
              <Reorder.Item key={t.id} value={t} as="div" style={{ listStyle: "none" }}>
                <Paper variant="outlined" sx={{ mb: 1, px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1.5, cursor: "grab" }}>
                  <Icon icon="mdi:drag-vertical" style={{ opacity: 0.5, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ width: 22, textAlign: "center", fontWeight: 700, opacity: 0.6 }}>{index + 1}</Typography>
                  <Avatar src={sanitizeMediaUrl(t.avatarUrl) || undefined} sx={{ width: 28, height: 28 }}>
                    {(t.customerName || "C").charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{t.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{t.title || t.body}</Typography>
                  </Box>
                  <Chip label={typeMeta(t.type).label} size="small" variant="outlined" />
                  {t.status !== "published" && <Chip label={statusMeta(t.status).label} size="small" />}
                </Paper>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReorderOpen(false)} disabled={reorderSaving}>Cancel</Button>
          <Button variant="contained" onClick={saveReorder} disabled={reorderSaving}>
            {reorderSaving ? "Saving..." : "Save Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTestimonials;
