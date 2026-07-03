import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  MenuItem,
  Skeleton,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import apiService from "../../services/api";

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Supported currencies. Selecting one fills in the matching symbol (still
// editable, for currencies/variants not listed here). North East Build Mart
// prices in INR (₹), which is the default.
const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
];

// North East Build Mart contact facts — used to prefill an empty singleton so a
// fresh install already reads the brand's real store details.
const NEBM_STORE_DEFAULTS = {
  name: "North East Build Mart",
  tagline: "Deals in all kinds of building materials for interior and exterior use.",
  email: "",
  phone: "+91 86385 43526",
  phoneSecondary: "+91 88762 89972",
  address: "Lawkhuwa Road, Nagaon, Assam – 782002",
  currency: "INR",
  currencySymbol: "₹",
};

const CATEGORIES_TAB = 4;

const AdminSettings = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryCount, setCategoryCount] = useState(null);

  // One form per settings section (backed by db.json `settings.{store,seo,social,notifications}`).
  const [storeForm, setStoreForm] = useState({ ...NEBM_STORE_DEFAULTS });
  const [seoForm, setSeoForm] = useState({
    metaTitle: "",
    metaDescription: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
  });
  const [socialForm, setSocialForm] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    whatsapp: "",
  });
  const [notifForm, setNotifForm] = useState({
    adminNewOrderEmail: true,
    adminEmail: "",
    lowStockAlert: true,
    lowStockEmail: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settings, cats] = await Promise.all([
        apiService.admin.getSettings(),
        apiService.admin.getCategories().catch(() => []),
      ]);
      const store = settings?.store || {};
      const seo = settings?.seo || {};
      const social = settings?.social || {};
      const notifications = settings?.notifications || {};
      setStoreForm({
        name: store.name || NEBM_STORE_DEFAULTS.name,
        tagline: store.tagline || NEBM_STORE_DEFAULTS.tagline,
        email: store.email || NEBM_STORE_DEFAULTS.email,
        phone: store.phone || NEBM_STORE_DEFAULTS.phone,
        phoneSecondary: store.phoneSecondary || NEBM_STORE_DEFAULTS.phoneSecondary,
        address: store.address || NEBM_STORE_DEFAULTS.address,
        currency: store.currency || NEBM_STORE_DEFAULTS.currency,
        currencySymbol: store.currencySymbol || NEBM_STORE_DEFAULTS.currencySymbol,
      });
      setSeoForm({
        metaTitle: seo.metaTitle || "",
        metaDescription: seo.metaDescription || "",
        googleAnalyticsId: seo.googleAnalyticsId || "",
        facebookPixelId: seo.facebookPixelId || "",
      });
      setSocialForm({
        facebook: social.facebook || "",
        instagram: social.instagram || "",
        twitter: social.twitter || "",
        youtube: social.youtube || "",
        whatsapp: social.whatsapp || "",
      });
      setNotifForm({
        adminNewOrderEmail: notifications.adminNewOrderEmail !== false,
        adminEmail: notifications.adminEmail || "",
        lowStockAlert: notifications.lowStockAlert !== false,
        lowStockEmail: notifications.lowStockEmail || "",
      });
      setCategoryCount(Array.isArray(cats) ? cats.length : 0);
    } catch (error) {
      console.error("Error loading settings:", error);
      setSnackbar({ open: true, message: "Failed to load settings", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleStoreChange = (field, value) =>
    setStoreForm((prev) => ({ ...prev, [field]: value }));
  const handleSeoChange = (field, value) =>
    setSeoForm((prev) => ({ ...prev, [field]: value }));
  const handleSocialChange = (field, value) =>
    setSocialForm((prev) => ({ ...prev, [field]: value }));
  const handleNotifChange = (field, value) =>
    setNotifForm((prev) => ({ ...prev, [field]: value }));

  const handleCurrencyChange = (code) => {
    const found = CURRENCIES.find((c) => c.code === code);
    setStoreForm((prev) => ({
      ...prev,
      currency: code,
      currencySymbol: found ? found.symbol : prev.currencySymbol,
    }));
  };

  const handleSave = async () => {
    if (!storeForm.name.trim()) {
      setActiveTab(0);
      setSnackbar({ open: true, message: "Store name is required", severity: "error" });
      return;
    }

    try {
      setSaving(true);
      // Four sections, persisted in sequence. The mock branch re-reads the
      // settings singleton between calls, so each PATCH merges onto the
      // previous save rather than clobbering it — never Promise.all these.
      await apiService.admin.updateSettings("store", {
        name: storeForm.name.trim(),
        tagline: storeForm.tagline.trim(),
        email: storeForm.email.trim(),
        phone: storeForm.phone.trim(),
        phoneSecondary: storeForm.phoneSecondary.trim(),
        address: storeForm.address.trim(),
        currency: storeForm.currency,
        currencySymbol: storeForm.currencySymbol,
      });
      await apiService.admin.updateSettings("seo", {
        metaTitle: seoForm.metaTitle.trim(),
        metaDescription: seoForm.metaDescription.trim(),
        googleAnalyticsId: seoForm.googleAnalyticsId.trim(),
        facebookPixelId: seoForm.facebookPixelId.trim(),
      });
      await apiService.admin.updateSettings("social", {
        facebook: socialForm.facebook.trim(),
        instagram: socialForm.instagram.trim(),
        twitter: socialForm.twitter.trim(),
        youtube: socialForm.youtube.trim(),
        whatsapp: socialForm.whatsapp.trim(),
      });
      await apiService.admin.updateSettings("notifications", {
        adminNewOrderEmail: notifForm.adminNewOrderEmail,
        adminEmail: notifForm.adminEmail.trim(),
        lowStockAlert: notifForm.lowStockAlert,
        lowStockEmail: notifForm.lowStockEmail.trim(),
      });
      setSnackbar({ open: true, message: "Settings saved successfully", severity: "success" });
      // Reload so the forms reflect exactly what was persisted.
      loadSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || "Failed to save settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const sectionCardSx = { height: "100%" };

  const renderGeneralSkeleton = () => (
    <Grid container spacing={3}>
      {[0, 1].map((i) => (
        <Grid item xs={12} md={6} key={i}>
          <Card sx={sectionCardSx}>
            <CardContent>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} variant="rounded" height={48} sx={{ mb: 2 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCardSkeleton = () => (
    <Card sx={sectionCardSx}>
      <CardContent>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        {[...Array(4)].map((_, j) => (
          <Skeleton key={j} variant="rounded" height={48} sx={{ mb: 2 }} />
        ))}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography color="text.secondary">
          Store configuration that powers your storefront and enquiries
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
          }}
        >
          <Tab icon={<Icon icon="mdi:cog" style={{ fontSize: 20 }} />} iconPosition="start" label="General" />
          <Tab icon={<Icon icon="mdi:magnify" style={{ fontSize: 20 }} />} iconPosition="start" label="SEO" />
          <Tab icon={<Icon icon="mdi:share-variant" style={{ fontSize: 20 }} />} iconPosition="start" label="Social" />
          <Tab icon={<Icon icon="mdi:bell-outline" style={{ fontSize: 20 }} />} iconPosition="start" label="Notifications" />
          <Tab icon={<Icon icon="mdi:folder-multiple" style={{ fontSize: 20 }} />} iconPosition="start" label="Categories" />
        </Tabs>
      </Paper>

      {/* Save action bar — shown on every editable tab, hidden on the Categories redirect */}
      {!loading && activeTab !== CATEGORIES_TAB && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            These values are saved to your store settings and read by the storefront and enquiries.
          </Typography>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:content-save" />}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      )}

      {/* General Tab — Store Information + Currency */}
      <TabPanel value={activeTab} index={0}>
        {loading ? (
          renderGeneralSkeleton()
        ) : (
          <Grid container spacing={3}>
            {/* Store Information */}
            <Grid item xs={12} md={6}>
              <Card sx={sectionCardSx}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Icon icon="mdi:store" style={{ fontSize: 24, marginRight: 8 }} />
                    <Typography variant="h6">Store Information</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Store Name" value={storeForm.name} onChange={(e) => handleStoreChange("name", e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Tagline" value={storeForm.tagline} onChange={(e) => handleStoreChange("tagline", e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Email" type="email" value={storeForm.email} onChange={(e) => handleStoreChange("email", e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Phone" value={storeForm.phone} onChange={(e) => handleStoreChange("phone", e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Phone (alternate)" value={storeForm.phoneSecondary} onChange={(e) => handleStoreChange("phoneSecondary", e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Address" value={storeForm.address} onChange={(e) => handleStoreChange("address", e.target.value)} multiline rows={2} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Currency */}
            <Grid item xs={12} md={6}>
              <Card sx={sectionCardSx}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Icon icon="mdi:currency-inr" style={{ fontSize: 24, marginRight: 8 }} />
                    <Typography variant="h6">Currency</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField select fullWidth size="small" label="Currency" value={storeForm.currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                        {CURRENCIES.map((c) => (
                          <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Currency Symbol" value={storeForm.currencySymbol} onChange={(e) => handleStoreChange("currencySymbol", e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        The symbol shown across product prices and enquiry line items throughout the storefront and admin.
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* SEO Tab */}
      <TabPanel value={activeTab} index={1}>
        {loading ? (
          renderCardSkeleton()
        ) : (
          <Card sx={sectionCardSx}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Icon icon="mdi:magnify" style={{ fontSize: 24, marginRight: 8 }} />
                <Typography variant="h6">Search &amp; Analytics</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Meta Title" value={seoForm.metaTitle} onChange={(e) => handleSeoChange("metaTitle", e.target.value)} helperText="Shown in browser tabs and search results" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Meta Description" value={seoForm.metaDescription} onChange={(e) => handleSeoChange("metaDescription", e.target.value)} multiline rows={3} helperText="A short summary search engines display under the title" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Google Analytics ID" value={seoForm.googleAnalyticsId} onChange={(e) => handleSeoChange("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Facebook Pixel ID" value={seoForm.facebookPixelId} onChange={(e) => handleSeoChange("facebookPixelId", e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Social Tab */}
      <TabPanel value={activeTab} index={2}>
        {loading ? (
          renderCardSkeleton()
        ) : (
          <Card sx={sectionCardSx}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Icon icon="mdi:share-variant" style={{ fontSize: 24, marginRight: 8 }} />
                <Typography variant="h6">Social Profiles</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Facebook" value={socialForm.facebook} onChange={(e) => handleSocialChange("facebook", e.target.value)} placeholder="https://facebook.com/…" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Instagram" value={socialForm.instagram} onChange={(e) => handleSocialChange("instagram", e.target.value)} placeholder="https://instagram.com/…" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Twitter / X" value={socialForm.twitter} onChange={(e) => handleSocialChange("twitter", e.target.value)} placeholder="https://x.com/…" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="YouTube" value={socialForm.youtube} onChange={(e) => handleSocialChange("youtube", e.target.value)} placeholder="https://youtube.com/@…" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="WhatsApp" value={socialForm.whatsapp} onChange={(e) => handleSocialChange("whatsapp", e.target.value)} placeholder="+91 86385 43526" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={activeTab} index={3}>
        {loading ? (
          renderCardSkeleton()
        ) : (
          <Card sx={sectionCardSx}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Icon icon="mdi:bell-outline" style={{ fontSize: 24, marginRight: 8 }} />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Admin Email" type="email" value={notifForm.adminEmail} onChange={(e) => handleNotifChange("adminEmail", e.target.value)} helperText="Where operational alerts are sent" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Low Stock Email" type="email" value={notifForm.lowStockEmail} onChange={(e) => handleNotifChange("lowStockEmail", e.target.value)} disabled={!notifForm.lowStockAlert} helperText="Recipient for low-stock alerts" />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={notifForm.adminNewOrderEmail} onChange={(e) => handleNotifChange("adminNewOrderEmail", e.target.checked)} />}
                    label="New enquiry email — notify the admin when a customer submits an enquiry"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={notifForm.lowStockAlert} onChange={(e) => handleNotifChange("lowStockAlert", e.target.checked)} />}
                    label="Low stock alerts — email when a product runs low on inventory"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Categories Tab — reconciled: one canonical manager lives at /admin/categories */}
      <TabPanel value={activeTab} index={4}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Box sx={{ maxWidth: 520, mx: "auto", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <Icon icon="mdi:folder-multiple" style={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Manage categories in one place
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Category management lives in the dedicated <strong>Categories</strong> manager — image,
              slug, parent hierarchy, sort order and status — so the storefront and admin never
              diverge.
            </Typography>
            {categoryCount !== null && (
              <Chip
                icon={<Icon icon="mdi:shape-outline" />}
                label={`${categoryCount} ${categoryCount === 1 ? "category" : "categories"} configured`}
                sx={{ mb: 3 }}
              />
            )}
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Icon icon="mdi:folder-cog" />}
                onClick={() => navigate("/admin/categories")}
              >
                Open Category Manager
              </Button>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default AdminSettings;
