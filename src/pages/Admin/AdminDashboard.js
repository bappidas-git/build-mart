import React, { useState, useEffect } from "react";
import {
  Box, Grid, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, Skeleton,
  Button,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

// Brand accents (used sparingly on card icons). Everything else reads from
// adminTheme so the dashboard stays inside the admin design system.
const BRAND_BLUE = "#1885d8";
const BRAND_GOLD = "#fa9c4c";

// Enquiry status → MUI chip colour, keyed to adminTheme's soft-badge palette.
// Vocabulary is canonical: New · Contacted · In Discussion · Quotation Sent ·
// Converted · Closed · Lost (mirrors the Enquiries admin/notification surfaces).
const ENQUIRY_STATUS_COLOR = {
  New: "info",
  Contacted: "primary",
  "In Discussion": "warning",
  "Quotation Sent": "secondary",
  Converted: "success",
  Closed: "default",
  Lost: "error",
};

const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5, border: "1px solid", borderColor: "divider",
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { borderColor: color } : {},
        transition: "border-color 0.2s",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h4">{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>{subtitle}</Typography>}
        </Box>
        <Box
          sx={{
            width: 42, height: 42, borderRadius: 1, display: "flex",
            alignItems: "center", justifyContent: "center",
            bgcolor: `${color}1A`, color,
          }}
        >
          <Icon icon={icon} style={{ fontSize: 22 }} />
        </Box>
      </Box>
    </Paper>
  </motion.div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0, totalEnquiries: 0, newEnquiries: 0, openEnquiries: 0,
    convertedEnquiries: 0, totalLeads: 0, totalUsers: 0, lowStockProducts: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashStats, enquiries, products] = await Promise.all([
        apiService.admin.getDashboardStats(),
        apiService.admin.getEnquiries(),
        apiService.admin.getProducts(),
      ]);
      setStats(dashStats);
      // Sort by recency so newly submitted enquiries surface first regardless of source ordering.
      const sortedEnquiries = [...enquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentEnquiries(sortedEnquiries.slice(0, 5));
      setLowStockProducts(
        products
          .filter((p) => p.stock !== undefined && p.stock <= (p.lowStockThreshold || 10))
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  if (loading) return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Welcome back! Here's your enquiry overview.</Typography>
      <Grid container spacing={3}>
        {[1,2,3,4,5,6,7].map((i) => (<Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={130} /></Grid>))}
      </Grid>
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={7}><Skeleton variant="rounded" height={320} /></Grid>
        <Grid item xs={12} lg={5}><Skeleton variant="rounded" height={320} /></Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Welcome back! Here's your enquiry overview.</Typography>

      {/* Primary Stats — enquiry + lead KPIs */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Products" value={stats.totalProducts} icon="mdi:package-variant" color={BRAND_BLUE} subtitle="In catalogue" onClick={() => navigate("/admin/products")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Enquiries" value={stats.totalEnquiries} icon="mdi:clipboard-text-outline" color={BRAND_BLUE} subtitle={`${stats.newEnquiries} new`} onClick={() => navigate("/admin/enquiries")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="New Enquiries" value={stats.newEnquiries} icon="mdi:email-alert-outline" color={BRAND_GOLD} subtitle={`${stats.openEnquiries} open`} onClick={() => navigate("/admin/enquiries")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Converted Enquiries" value={stats.convertedEnquiries} icon="mdi:check-decagram-outline" color="#059669" subtitle="Won leads" onClick={() => navigate("/admin/enquiries")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Leads" value={stats.totalLeads} icon="mdi:account-voice" color={BRAND_GOLD} subtitle="Contacts & signups" onClick={() => navigate("/admin/leads")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Users" value={stats.totalUsers} icon="mdi:account-group-outline" color={BRAND_BLUE} subtitle="Registered accounts" onClick={() => navigate("/admin/users")} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Low-Stock Products" value={stats.lowStockProducts} icon="mdi:alert-circle-outline" color="#d97706" subtitle={stats.lowStockProducts > 0 ? "Restock soon" : "All stocked"} onClick={() => navigate("/admin/products")} />
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        {/* Recent Enquiries */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold">Recent Enquiries</Typography>
              <Button size="small" onClick={() => navigate("/admin/enquiries")} sx={{ textTransform: "none" }}>View All</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Enquiry #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEnquiries.map((enq) => {
                    const chipColor = ENQUIRY_STATUS_COLOR[enq.status] || "default";
                    return (
                    <TableRow key={enq.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate("/admin/enquiries")}>
                      <TableCell><Typography variant="body2" fontWeight={600} noWrap>{enq.enquiryNumber || `#${enq.id}`}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>{enq.contact?.name || enq.customerName || "—"}</Typography>
                        {enq.contact?.phone && <Typography variant="caption" color="text.secondary">{enq.contact.phone}</Typography>}
                      </TableCell>
                      <TableCell align="center"><Typography variant="body2">{enq.items?.length || 0}</Typography></TableCell>
                      <TableCell><Chip label={enq.status || "—"} size="small" color={chipColor} sx={{ height: 22, fontSize: "0.7rem" }} /></TableCell>
                      <TableCell><Typography variant="caption" noWrap>{formatDate(enq.createdAt)}</Typography></TableCell>
                    </TableRow>
                    );
                  })}
                  {recentEnquiries.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No enquiries yet</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold">Low Stock Alert</Typography>
              <Button size="small" onClick={() => navigate("/admin/products")} sx={{ textTransform: "none" }}>Manage</Button>
            </Box>
            <Box sx={{ p: 1 }}>
              {lowStockProducts.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Icon icon="mdi:check-circle-outline" style={{ fontSize: 48, color: "#4caf50" }} />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>All products well stocked</Typography>
                </Box>
              ) : (
                lowStockProducts.map((p, i) => (
                  <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderBottom: i < lowStockProducts.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                    <Avatar src={p.images?.[0]} variant="rounded" sx={{ width: 40, height: 40, bgcolor: "action.hover" }}>
                      <Icon icon="mdi:package-variant" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography>
                    </Box>
                    <Chip
                      label={`${p.stock} left`}
                      size="small"
                      color={p.stock === 0 ? "error" : "warning"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Quick Actions</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
          {[
            { label: "Add Product", icon: "mdi:plus-box", path: "/admin/products" },
            { label: "View Enquiries", icon: "mdi:clipboard-text-outline", path: "/admin/enquiries" },
            { label: "Add Category", icon: "mdi:shape-plus", path: "/admin/categories" },
            { label: "View Leads", icon: "mdi:account-voice", path: "/admin/leads" },
          ].map((qa) => (
            <Button
              key={qa.label} variant="outlined" size="small"
              startIcon={<Icon icon={qa.icon} />}
              onClick={() => navigate(qa.path)}
              sx={{ color: "text.primary" }}
            >
              {qa.label}
            </Button>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
