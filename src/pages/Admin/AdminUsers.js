import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Tooltip, Skeleton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import apiService from "../../services/api";

// Mirror the enquiry status hues used by the Enquiries manager so the chip in
// this panel reads the same everywhere.
const ENQUIRY_STATUS_COLOR = {
  New: "info",
  Contacted: "primary",
  "In Discussion": "secondary",
  "Quotation Sent": "warning",
  Converted: "success",
  Closed: "default",
  Lost: "error",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [userEnquiries, setUserEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.admin.getUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
    // Clear the previous user's enquiries so the dialog never flashes stale data,
    // and track failure separately — "couldn't load" must not read as "no enquiries".
    setUserEnquiries([]);
    setEnquiriesError(false);
    setEnquiriesLoading(true);
    try {
      const enquiries = await apiService.admin.getEnquiries({ userId: user.id });
      setUserEnquiries(enquiries || []);
    } catch {
      setEnquiriesError(true);
    } finally {
      setEnquiriesLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const result = await Swal.fire({
      title: newStatus ? "Activate user?" : "Deactivate user?",
      text: `${user.firstName} ${user.lastName} will be ${newStatus ? "activated" : "deactivated"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
    });
    if (!result.isConfirmed) return;
    try {
      await apiService.admin.updateUser(user.id, { isActive: newStatus });
      Swal.fire({ icon: "success", title: "Updated", toast: true, position: "bottom-end", showConfirmButton: false, timer: 2000 });
      loadUsers();
      if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, isActive: newStatus });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage customer accounts</Typography>
        </Box>
        <Chip label={`${users.length} total`} sx={{ bgcolor: "primary.main", color: "#fff" }} />
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 320 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
        </Box>
        {/* Desktop / tablet: full table. Below md we render stacked cards instead. */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (<TableRow key={i}><TableCell colSpan={5}><Skeleton height={52} /></TableCell></TableRow>))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No users found</Typography></TableCell></TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar src={user.avatar || undefined} sx={{ width: 40, height: 40, bgcolor: "primary.main", fontSize: "0.9rem", fontWeight: 600 }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{user.firstName} {user.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2">{user.phone || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{formatDate(user.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Chip label={user.isActive !== false ? "Active" : "Inactive"} size="small" color={user.isActive !== false ? "success" : "default"} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(user)} sx={{ minWidth: 44, minHeight: 44 }}><Icon icon="mdi:eye-outline" /></IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive !== false ? "Deactivate" : "Activate"}>
                          <IconButton size="small" onClick={() => handleToggleStatus(user)} sx={{ minWidth: 44, minHeight: 44 }}>
                            <Icon icon={user.isActive !== false ? "mdi:account-off-outline" : "mdi:account-check-outline"} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile: stacked cards — same fields and row handlers as the table. */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Box key={i} sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Skeleton height={64} />
              </Box>
            ))
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}><Typography color="text.secondary">No users found</Typography></Box>
          ) : (
            filtered.map((user) => (
              <Box key={user.id} sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: "none" } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Avatar src={user.avatar || undefined} sx={{ width: 40, height: 40, bgcolor: "primary.main", fontSize: "0.9rem", fontWeight: 600, flexShrink: 0 }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{user.firstName} {user.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
                      <Chip label={user.isActive !== false ? "Active" : "Inactive"} size="small" color={user.isActive !== false ? "success" : "default"} />
                      <Typography variant="caption" color="text.secondary">{user.phone || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">Joined {formatDate(user.createdAt)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => openDetail(user)} sx={{ minWidth: 44, minHeight: 44 }}><Icon icon="mdi:eye-outline" /></IconButton>
                    </Tooltip>
                    <Tooltip title={user.isActive !== false ? "Deactivate" : "Activate"}>
                      <IconButton size="small" onClick={() => handleToggleStatus(user)} sx={{ minWidth: 44, minHeight: 44 }}>
                        <Icon icon={user.isActive !== false ? "mdi:account-off-outline" : "mdi:account-check-outline"} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontWeight: "bold" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar src={selectedUser.avatar || undefined} sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 600 }}>
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">{selectedUser.firstName} {selectedUser.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedUser.email}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                {[
                  { label: "Phone", value: selectedUser.phone || "—" },
                  { label: "Status", value: selectedUser.isActive !== false ? "Active" : "Inactive" },
                  { label: "Joined", value: formatDate(selectedUser.createdAt) },
                  { label: "Addresses", value: `${selectedUser.addresses?.length || 0} saved` },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Recent Enquiries{!enquiriesLoading && !enquiriesError ? ` (${userEnquiries.length})` : ""}
              </Typography>
              {enquiriesLoading ? (
                <Box>
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                </Box>
              ) : enquiriesError ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                  <Typography variant="body2" color="error.main">
                    Couldn't load this user's enquiries.
                  </Typography>
                  <Button size="small" onClick={() => openDetail(selectedUser)}>Retry</Button>
                </Box>
              ) : userEnquiries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No enquiries yet</Typography>
              ) : (
                userEnquiries.slice(0, 5).map((enquiry) => (
                  <Box key={enquiry.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>#{enquiry.enquiryNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(enquiry.createdAt)} · {enquiry.items?.length || 0} items</Typography>
                    </Box>
                    <Chip label={enquiry.status || "New"} size="small" color={ENQUIRY_STATUS_COLOR[enquiry.status] || "default"} sx={{ fontSize: "0.7rem", height: 20 }} />
                  </Box>
                ))
              )}
              {!enquiriesLoading && !enquiriesError && userEnquiries.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Total enquiries: <strong>{userEnquiries.length}</strong></Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              <Button variant="outlined" color={selectedUser.isActive !== false ? "error" : "success"} onClick={() => handleToggleStatus(selectedUser)}>
                {selectedUser.isActive !== false ? "Deactivate Account" : "Activate Account"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
