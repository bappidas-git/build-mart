import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Skeleton, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import apiService from "../../services/api";
import AdminEmptyState from "../../components/EmptyState/AdminEmptyState";

// Canonical, ordered enquiry pipeline for North East Build Mart. There are no
// payments/fulfillment here — an enquiry simply moves through a follow-up
// funnel. A row with no `status` (legacy / pre-migration) renders as "New".
const ENQUIRY_STATUS = {
  New:              { label: "New",             color: "info" },
  Contacted:        { label: "Contacted",       color: "primary" },
  "In Discussion":  { label: "In Discussion",   color: "secondary" },
  "Quotation Sent": { label: "Quotation Sent",  color: "warning" },
  Converted:        { label: "Converted",       color: "success" },
  Closed:           { label: "Closed",          color: "default" },
  Lost:             { label: "Lost",            color: "error" },
};

const SORT_OPTIONS = {
  date_desc: { label: "Newest first", cmp: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  date_asc: { label: "Oldest first", cmp: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
};

// Defensive readers — enquiries may be new-shape (contact{}) or legacy order
// rows that still carry billingAddress / customerName / orderNumber.
const statusOf = (e) => e.status || "New";
const numberOf = (e) => e.enquiryNumber || e.orderNumber || e.id;
const nameOf = (e) =>
  e.contact?.name ||
  e.customerName ||
  `${e.billingAddress?.firstName || ""} ${e.billingAddress?.lastName || ""}`.trim() ||
  "—";
const phoneOf = (e) => e.contact?.phone || e.billingAddress?.phone || "";
const emailOf = (e) => e.contact?.email || e.customerEmail || "";

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [selectedEnq, setSelectedEnq] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [statusInput, setStatusInput] = useState("New");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => { loadEnquiries(); }, []);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await apiService.admin.getEnquiries();
      setEnquiries(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openDetail = (enq) => {
    setSelectedEnq(enq);
    setNotesInput(enq.adminNotes || "");
    setStatusInput(statusOf(enq));
    setDialogOpen(true);
  };

  const toast = (title, icon = "success") =>
    Swal.fire({ icon, title, toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

  // Move the enquiry along the pipeline. The internal note rides along so a
  // status change and its context are recorded together, and the optional
  // `event` appends the timeline entry.
  const handleStatusUpdate = async () => {
    if (!selectedEnq || statusInput === statusOf(selectedEnq)) return;
    setActionBusy(true);
    try {
      await apiService.admin.updateEnquiry(
        selectedEnq.id,
        { status: statusInput, adminNotes: notesInput },
        { action: `Status → ${statusInput}`, note: notesInput || undefined }
      );
      toast(`Enquiry marked ${statusInput}`);
      setDialogOpen(false);
      loadEnquiries();
    } catch (e) { Swal.fire({ icon: "error", title: "Error", text: e.message }); }
    finally { setActionBusy(false); }
  };

  // Save the internal note without touching the status.
  const handleNotesSave = async () => {
    if (!selectedEnq) return;
    setActionBusy(true);
    try {
      await apiService.admin.updateEnquiry(
        selectedEnq.id,
        { adminNotes: notesInput },
        { action: "Notes updated" }
      );
      toast("Notes saved");
      setDialogOpen(false);
      loadEnquiries();
    } catch (e) { Swal.fire({ icon: "error", title: "Error", text: e.message }); }
    finally { setActionBusy(false); }
  };

  const fc = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const formatDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // The price the customer saw when they added the item, plus its price type.
  // "On Enquiry" items have no fixed price to show.
  const itemPriceLabel = (item) => {
    if (item.priceType === "onEnquiry") return "On Enquiry";
    const price = item.selectedPrice ?? item.price;
    if (price == null || price === "") return "—";
    const unit = item.unitType ? ` / ${item.unitType}` : "";
    return `${fc(price)}${unit}`;
  };

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const filtered = enquiries.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      String(numberOf(e)).toLowerCase().includes(q) ||
      nameOf(e).toLowerCase().includes(q) ||
      phoneOf(e).toLowerCase().includes(q) ||
      emailOf(e).toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || statusOf(e) === statusFilter;
    const day = (e.createdAt || "").slice(0, 10);
    const matchFrom = !dateFrom || day >= dateFrom;
    const matchTo = !dateTo || day <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const visible = [...filtered].sort((SORT_OPTIONS[sortBy] || SORT_OPTIONS.date_desc).cmp);

  const historyOf = (e) => (e.statusHistory || []).slice().reverse();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Enquiries</Typography>
          <Typography variant="body2" color="text.secondary">Manage customer enquiries and follow-ups</Typography>
        </Box>
        <Chip label={isFiltering ? `${filtered.length} of ${enquiries.length}` : `${enquiries.length} total`} sx={{ bgcolor: "primary.main", color: "#fff" }} />
      </Box>

      {/* Status breakdown — one chip per pipeline stage with live counts */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {Object.entries(ENQUIRY_STATUS).map(([key, val]) => (
          <Chip key={key} label={`${val.label}: ${enquiries.filter((e) => statusOf(e) === key).length}`} size="small" color={val.color} variant="outlined" />
        ))}
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search by enquiry #, name, phone, email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 }, maxWidth: { sm: 380 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160, flex: { xs: 1, sm: "0 1 auto" } }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {Object.entries(ENQUIRY_STATUS).map(([k, v]) => (<MenuItem key={k} value={k}>{v.label}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ width: { xs: "calc(50% - 8px)", sm: 150 } }} />
          <TextField label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ width: { xs: "calc(50% - 8px)", sm: 150 } }} />
          <FormControl size="small" sx={{ minWidth: 150, flex: { xs: 1, sm: "0 1 auto" } }}>
            <InputLabel>Sort</InputLabel>
            <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)}>
              {Object.entries(SORT_OPTIONS).map(([k, v]) => (<MenuItem key={k} value={k}>{v.label}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Enquiry #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (<TableRow key={i}><TableCell colSpan={7}><Skeleton height={52} /></TableCell></TableRow>))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0, borderBottom: "none" }}>
                    <AdminEmptyState
                      icon="mdi:clipboard-text-outline"
                      title="No enquiries yet"
                      description="New enquiries submitted from the storefront will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((enq) => {
                  const sc = ENQUIRY_STATUS[statusOf(enq)] || { label: statusOf(enq), color: "default" };
                  return (
                    <TableRow key={enq.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{numberOf(enq)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{nameOf(enq)}</Typography></TableCell>
                      <TableCell>
                        {phoneOf(enq) && <Typography variant="body2">{phoneOf(enq)}</Typography>}
                        {emailOf(enq) && <Typography variant="caption" color="text.secondary">{emailOf(enq)}</Typography>}
                        {!phoneOf(enq) && !emailOf(enq) && <Typography variant="caption" color="text.secondary">—</Typography>}
                      </TableCell>
                      <TableCell>{enq.items?.length || 0}</TableCell>
                      <TableCell><Chip label={sc.label} size="small" color={sc.color} sx={{ height: 22, fontSize: "0.7rem" }} /></TableCell>
                      <TableCell><Typography variant="caption">{formatDate(enq.createdAt)}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="View & Update"><IconButton size="small" onClick={() => openDetail(enq)} sx={{ minWidth: 44, minHeight: 44 }}><Icon icon="mdi:eye-outline" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Enquiry Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => !actionBusy && setDialogOpen(false)} maxWidth="md" fullWidth disableEnforceFocus>
        {selectedEnq && (() => {
          const sc = ENQUIRY_STATUS[statusOf(selectedEnq)] || { label: statusOf(selectedEnq), color: "default" };
          return (
            <>
              <DialogTitle sx={{ fontWeight: "bold" }}>
                Enquiry {numberOf(selectedEnq)}
                <Chip label={sc.label} size="small" color={sc.color} sx={{ ml: 2, verticalAlign: "middle" }} />
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  {/* Customer contact */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Customer</Typography>
                    <Typography variant="body2">{nameOf(selectedEnq)}</Typography>
                    {phoneOf(selectedEnq) && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                        <Icon icon="mdi:phone-outline" style={{ fontSize: 15 }} /> {phoneOf(selectedEnq)}
                      </Typography>
                    )}
                    {emailOf(selectedEnq) && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                        <Icon icon="mdi:email-outline" style={{ fontSize: 15 }} /> {emailOf(selectedEnq)}
                      </Typography>
                    )}
                  </Grid>

                  {/* Enquiry meta */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Enquiry</Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Submitted</Typography>
                      <Typography variant="body2">{formatDate(selectedEnq.createdAt)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
                      <Typography variant="body2" color="text.secondary">Items</Typography>
                      <Typography variant="body2">{selectedEnq.items?.length || 0}</Typography>
                    </Box>
                  </Grid>

                  {/* User note / message */}
                  {selectedEnq.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Customer Message</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "action.hover" }}>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{selectedEnq.notes}</Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Products & quantities */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Products ({selectedEnq.items?.length || 0})</Typography>
                    {(selectedEnq.items || []).map((item, i) => (
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">SKU: {item.sku || "—"} · Qty: {item.quantity}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: "nowrap", ml: 2 }}>{itemPriceLabel(item)}</Typography>
                      </Box>
                    ))}
                  </Grid>

                  {/* Internal admin notes + status control */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Icon icon="mdi:note-text-outline" style={{ fontSize: 17 }} /> Internal Notes
                    </Typography>
                    <TextField
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      multiline minRows={3} fullWidth size="small"
                      placeholder="Notes for your team (not shown to the customer)…"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Icon icon="mdi:swap-horizontal" style={{ fontSize: 17 }} /> Update Status
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={statusInput} label="Status" onChange={(e) => setStatusInput(e.target.value)}>
                        {Object.entries(ENQUIRY_STATUS).map(([k, v]) => (<MenuItem key={k} value={k}>{v.label}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      Changing the status records a timeline entry. Your internal note is saved with it.
                    </Typography>
                  </Grid>

                  {/* Timeline */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Timeline</Typography>
                    {historyOf(selectedEnq).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No activity recorded yet.</Typography>
                    ) : (
                      historyOf(selectedEnq).map((h, i) => (
                        <Box key={i} sx={{ display: "flex", gap: 1.5, py: 0.75, borderLeft: "2px solid", borderColor: "divider", pl: 2, ml: 0.5 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500}>{h.action}</Typography>
                            {h.note && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{h.note}</Typography>}
                            <Typography variant="caption" color="text.secondary">{h.by} · {formatDate(h.at)}</Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap" }}>
                <Button onClick={() => setDialogOpen(false)} disabled={actionBusy}>Close</Button>
                <Button
                  variant="outlined"
                  startIcon={<Icon icon="mdi:note-text-outline" />}
                  onClick={handleNotesSave}
                  disabled={actionBusy}
                >
                  Save Notes
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Icon icon="mdi:swap-horizontal" />}
                  onClick={handleStatusUpdate}
                  disabled={actionBusy || statusInput === statusOf(selectedEnq)}
                >
                  Update Status
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default AdminEnquiries;
