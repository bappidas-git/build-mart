import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, TextField, FormControlLabel, Switch,
  MenuItem, Skeleton, Divider, InputAdornment,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import testimonialsApi, { HOME_LAYOUTS, HOME_SORTS } from "../../services/testimonialsApi";

// =============================================================================
// AdminTestimonialsPage — display settings for the Testimonial module:
// the public /testimonials page (visibility, SEO, hero copy), the homepage
// showcase (layout, sorting, rotation, limits) and the product-page band.
// One singleton (`testimonialsPage`) drives all three surfaces.
// =============================================================================

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, ...(text ? { text } : {}), toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

// Numeric inputs keep the raw string while typing; clamped only on save.
const toInt = (value, fallback, min, max) => {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

const Section = ({ icon, title, subtitle, children }) => (
  <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
      <Icon icon={icon} style={{ fontSize: 20, opacity: 0.7 }} />
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>{subtitle}</Typography>
    {children}
  </Paper>
);

const AdminTestimonialsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await testimonialsApi.admin.getPage();
        setPage(data);
        setForm({
          enabled: data.enabled !== false,
          seoTitle: data.seo?.title || "",
          seoDescription: data.seo?.description || "",
          heroKicker: data.hero?.kicker || "",
          heroTitle: data.hero?.title || "",
          heroSubtitle: data.hero?.subtitle || "",
          pageSize: String(data.page?.pageSize ?? 9),

          homeEnabled: data.home?.enabled !== false,
          homeKicker: data.home?.kicker || "",
          homeTitle: data.home?.title || "",
          homeSubtitle: data.home?.subtitle || "",
          homeLayout: data.home?.layout || "carousel",
          homeSort: data.home?.sort || "order",
          homeMaxItems: String(data.home?.maxItems ?? 6),
          homeFeaturedOnly: data.home?.featuredOnly === true,
          homeAutoRotate: data.home?.autoRotate !== false,
          homeAutoRotateMs: String(data.home?.autoRotateMs ?? 6000),

          productEnabled: data.productPage?.enabled !== false,
          productTitle: data.productPage?.title || "",
          productMaxItems: String(data.productPage?.maxItems ?? 4),
        });
      } catch (e) {
        toast("error", "Couldn't load settings", testimonialsApi.getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await testimonialsApi.admin.updatePage({
        ...page,
        enabled: !!form.enabled,
        seo: { title: form.seoTitle.trim(), description: form.seoDescription.trim() },
        hero: {
          kicker: form.heroKicker.trim(),
          title: form.heroTitle.trim(),
          subtitle: form.heroSubtitle.trim(),
        },
        page: { ...page?.page, pageSize: toInt(form.pageSize, 9, 3, 60) },
        home: {
          enabled: !!form.homeEnabled,
          kicker: form.homeKicker.trim(),
          title: form.homeTitle.trim(),
          subtitle: form.homeSubtitle.trim(),
          layout: form.homeLayout,
          sort: form.homeSort,
          maxItems: toInt(form.homeMaxItems, 6, 1, 24),
          featuredOnly: !!form.homeFeaturedOnly,
          autoRotate: !!form.homeAutoRotate,
          autoRotateMs: toInt(form.homeAutoRotateMs, 6000, 2500, 30000),
        },
        productPage: {
          enabled: !!form.productEnabled,
          title: form.productTitle.trim(),
          maxItems: toInt(form.productMaxItems, 4, 1, 12),
        },
      });
      toast("success", "Display settings saved", "Storefront surfaces update immediately.");
    } catch (e) {
      toast("error", "Couldn't save", testimonialsApi.getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <Box>
        <Skeleton height={44} width={320} />
        {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={180} sx={{ mt: 2 }} />)}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Testimonial Display Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Control the public Testimonials page, the homepage showcase and the product-page band
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<Icon icon="mdi:arrow-left" />} onClick={() => navigate("/admin/testimonials")}>
            Back to Library
          </Button>
          <Button variant="contained" startIcon={<Icon icon="mdi:content-save-outline" />} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Box>

      <Section
        icon="mdi:web"
        title="Testimonials Page"
        subtitle="The dedicated /testimonials page linked from the footer and mobile menu."
      >
        <FormControlLabel
          control={<Switch checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} />}
          label="Page enabled (when off, the page shows a friendly unavailable notice)"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Hero Kicker" value={form.heroKicker} onChange={(e) => set({ heroKicker: e.target.value })} size="small" placeholder="Wall of trust" />
          <TextField
            label="Stories per batch" value={form.pageSize} onChange={(e) => set({ pageSize: e.target.value })} size="small"
            inputProps={{ inputMode: "numeric" }}
            InputProps={{ endAdornment: <InputAdornment position="end">per “Show more”</InputAdornment> }}
          />
          <TextField label="Hero Title" value={form.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} size="small" sx={{ gridColumn: "1 / -1" }} />
          <TextField label="Hero Subtitle" value={form.heroSubtitle} onChange={(e) => set({ heroSubtitle: e.target.value })} size="small" multiline rows={2} sx={{ gridColumn: "1 / -1" }} />
        </Box>
        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>SEO</Typography>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Meta Title" value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} size="small" />
          <TextField label="Meta Description" value={form.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} size="small" multiline rows={2} />
        </Box>
      </Section>

      <Section
        icon="mdi:home-outline"
        title="Homepage Showcase"
        subtitle="The testimonial band on the home page. Individual testimonials also carry their own homepage placement toggle."
      >
        <FormControlLabel
          control={<Switch checked={form.homeEnabled} onChange={(e) => set({ homeEnabled: e.target.checked })} />}
          label="Show the testimonial section on the homepage"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Kicker" value={form.homeKicker} onChange={(e) => set({ homeKicker: e.target.value })} size="small" />
          <TextField label="Section Title" value={form.homeTitle} onChange={(e) => set({ homeTitle: e.target.value })} size="small" />
          <TextField label="Subtitle" value={form.homeSubtitle} onChange={(e) => set({ homeSubtitle: e.target.value })} size="small" sx={{ gridColumn: "1 / -1" }} />
          <TextField select label="Layout" value={form.homeLayout} onChange={(e) => set({ homeLayout: e.target.value })} size="small">
            {HOME_LAYOUTS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
          </TextField>
          <TextField select label="Sorting" value={form.homeSort} onChange={(e) => set({ homeSort: e.target.value })} size="small">
            {HOME_SORTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          <TextField label="Maximum shown" value={form.homeMaxItems} onChange={(e) => set({ homeMaxItems: e.target.value })} size="small" inputProps={{ inputMode: "numeric" }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <FormControlLabel control={<Switch checked={form.homeFeaturedOnly} onChange={(e) => set({ homeFeaturedOnly: e.target.checked })} />} label="Featured only" />
            <FormControlLabel control={<Switch checked={form.homeAutoRotate} onChange={(e) => set({ homeAutoRotate: e.target.checked })} />} label="Auto-rotate carousel" />
          </Box>
          {form.homeAutoRotate && (
            <TextField
              label="Rotation interval" value={form.homeAutoRotateMs} onChange={(e) => set({ homeAutoRotateMs: e.target.value })} size="small"
              inputProps={{ inputMode: "numeric" }}
              InputProps={{ endAdornment: <InputAdornment position="end">ms</InputAdornment> }}
              helperText="Minimum 2500 ms. Paused automatically on hover and for reduced-motion users."
            />
          )}
        </Box>
      </Section>

      <Section
        icon="mdi:package-variant"
        title="Product Page Band"
        subtitle="Shown on a product's page when testimonials are assigned to that product (or its category)."
      >
        <FormControlLabel
          control={<Switch checked={form.productEnabled} onChange={(e) => set({ productEnabled: e.target.checked })} />}
          label="Show assigned testimonials on product pages"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
          <TextField label="Section Title" value={form.productTitle} onChange={(e) => set({ productTitle: e.target.value })} size="small" placeholder="Customer stories with this product" />
          <TextField label="Maximum shown" value={form.productMaxItems} onChange={(e) => set({ productMaxItems: e.target.value })} size="small" inputProps={{ inputMode: "numeric" }} />
        </Box>
      </Section>
    </Box>
  );
};

export default AdminTestimonialsPage;
