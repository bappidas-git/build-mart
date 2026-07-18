import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, TextField, FormControlLabel, Switch,
  Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip,
  Skeleton, Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import careersApi from "../../services/careersApi";

// =============================================================================
// AdminCareerPage — every block of the storefront Careers landing page is
// edited here: hero, why-join-us, culture, benefits, growth, life gallery,
// hiring process, FAQs, CTA, thank-you copy and notification settings.
// The page holds the whole careersPage singleton and saves it in one PUT
// (same convention as Settings / heroConfig).
// =============================================================================

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, ...(text ? { text } : {}), toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500 });

const AdminCareerPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await careersApi.admin.getPage();
        setConfig(data);
      } catch (e) {
        toast("error", "Couldn't load the careers page config", careersApi.getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Patch helpers — set() replaces a top-level section; merge() patches inside one.
  const set = useCallback((section, value) => {
    setConfig((c) => ({ ...c, [section]: value }));
    setDirty(true);
  }, []);
  const merge = useCallback((section, patch) => {
    setConfig((c) => ({ ...c, [section]: { ...(c?.[section] || {}), ...patch } }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await careersApi.admin.updatePage(config);
      setConfig(saved);
      setDirty(false);
      toast("success", "Careers page saved", "The storefront reflects your changes immediately.");
    } catch (e) {
      toast("error", "Save failed", careersApi.getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <Box>
        <Skeleton height={48} width={280} sx={{ mb: 2 }} />
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={64} sx={{ mb: 1 }} />)}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Careers Page</Typography>
          <Typography variant="body2" color="text.secondary">Everything visitors see on /careers — no code required</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={config.enabled !== false} onChange={(e) => set("enabled", e.target.checked)} />}
            label="Page enabled"
          />
          <Button variant="contained" onClick={handleSave} disabled={saving || !dirty} startIcon={<Icon icon="mdi:content-save-outline" />}>
            {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
          </Button>
        </Box>
      </Box>

      {/* ---- SEO ---- */}
      <Section title="SEO" icon="mdi:magnify" subtitle="Search-engine title & description">
        <TextField label="Meta Title" fullWidth size="small" value={config.seo?.title || ""} onChange={(e) => merge("seo", { title: e.target.value })} sx={{ mb: 2 }} />
        <TextField label="Meta Description" fullWidth size="small" multiline rows={2} value={config.seo?.description || ""} onChange={(e) => merge("seo", { description: e.target.value })} />
      </Section>

      {/* ---- Hero ---- */}
      <Section title="Hero" icon="mdi:image-text" subtitle="Headline, background image, CTAs and stats">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField label="Eyebrow" size="small" value={config.hero?.eyebrow || ""} onChange={(e) => merge("hero", { eyebrow: e.target.value })} />
          <TextField label="Background Image URL" size="small" value={config.hero?.image || ""} onChange={(e) => merge("hero", { image: e.target.value })} placeholder="https://…" />
          <TextField label="Title" size="small" value={config.hero?.title || ""} onChange={(e) => merge("hero", { title: e.target.value })} />
          <TextField label="Highlighted words" size="small" value={config.hero?.highlight || ""} onChange={(e) => merge("hero", { highlight: e.target.value })} helperText="Rendered in the gold gradient after the title" />
          <TextField label="Subtitle" size="small" multiline rows={2} value={config.hero?.subtitle || ""} onChange={(e) => merge("hero", { subtitle: e.target.value })} sx={{ gridColumn: "1 / -1" }} />
          <TextField label="Primary CTA label" size="small" value={config.hero?.primaryCtaLabel || ""} onChange={(e) => merge("hero", { primaryCtaLabel: e.target.value })} />
          <TextField label="Secondary CTA label" size="small" value={config.hero?.secondaryCtaLabel || ""} onChange={(e) => merge("hero", { secondaryCtaLabel: e.target.value })} />
        </Box>
        <ItemListEditor
          label="Stats"
          items={config.hero?.stats || []}
          spec={[{ key: "value", label: "Value" }, { key: "label", label: "Label" }]}
          onChange={(stats) => merge("hero", { stats })}
        />
      </Section>

      <IconCardsSection title="Why Join Us" icon="mdi:hand-heart-outline" sectionKey="whyJoinUs" config={config} merge={merge} itemsKey="items" />

      {/* ---- Culture ---- */}
      <Section
        title="Company Culture" icon="mdi:account-group-outline" subtitle="Values + side image"
        enabled={config.culture?.enabled !== false}
        onToggle={(v) => merge("culture", { enabled: v })}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField label="Title" size="small" value={config.culture?.title || ""} onChange={(e) => merge("culture", { title: e.target.value })} />
          <TextField label="Subtitle" size="small" value={config.culture?.subtitle || ""} onChange={(e) => merge("culture", { subtitle: e.target.value })} />
          <TextField label="Image URL" size="small" value={config.culture?.image || ""} onChange={(e) => merge("culture", { image: e.target.value })} sx={{ gridColumn: "1 / -1" }} placeholder="https://…" />
        </Box>
        <ItemListEditor
          label="Values"
          items={config.culture?.values || []}
          spec={[{ key: "icon", label: "Icon (mdi:*)", width: 180 }, { key: "title", label: "Title" }, { key: "text", label: "Text", multiline: true }]}
          onChange={(values) => merge("culture", { values })}
        />
      </Section>

      <IconCardsSection title="Employee Benefits" icon="mdi:gift-outline" sectionKey="benefits" config={config} merge={merge} itemsKey="items" />
      <IconCardsSection title="Growth Opportunities" icon="mdi:trending-up" sectionKey="growth" config={config} merge={merge} itemsKey="items" />

      {/* ---- Life gallery ---- */}
      <Section
        title="Life at the Company" icon="mdi:image-multiple-outline" subtitle="Photo gallery"
        enabled={config.life?.enabled !== false}
        onToggle={(v) => merge("life", { enabled: v })}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField label="Title" size="small" value={config.life?.title || ""} onChange={(e) => merge("life", { title: e.target.value })} />
          <TextField label="Subtitle" size="small" value={config.life?.subtitle || ""} onChange={(e) => merge("life", { subtitle: e.target.value })} />
        </Box>
        <ItemListEditor
          label="Photos"
          items={config.life?.images || []}
          spec={[{ key: "url", label: "Image URL" }, { key: "caption", label: "Caption", width: 200 }]}
          onChange={(images) => merge("life", { images })}
        />
      </Section>

      {/* ---- Hiring process ---- */}
      <Section
        title="Hiring Process" icon="mdi:timeline-check-outline" subtitle="The steps shown on the page and on each job's timeline"
        enabled={config.hiringProcess?.enabled !== false}
        onToggle={(v) => merge("hiringProcess", { enabled: v })}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField label="Title" size="small" value={config.hiringProcess?.title || ""} onChange={(e) => merge("hiringProcess", { title: e.target.value })} />
          <TextField label="Subtitle" size="small" value={config.hiringProcess?.subtitle || ""} onChange={(e) => merge("hiringProcess", { subtitle: e.target.value })} />
        </Box>
        <ItemListEditor
          label="Steps"
          items={config.hiringProcess?.steps || []}
          spec={[{ key: "icon", label: "Icon (mdi:*)", width: 180 }, { key: "title", label: "Title" }, { key: "text", label: "Text", multiline: true }]}
          onChange={(steps) => merge("hiringProcess", { steps })}
        />
      </Section>

      {/* ---- FAQs ---- */}
      <Section
        title="FAQs" icon="mdi:frequently-asked-questions" subtitle="Questions applicants ask"
        enabled={config.faqs?.enabled !== false}
        onToggle={(v) => merge("faqs", { enabled: v })}
      >
        <TextField label="Title" size="small" fullWidth value={config.faqs?.title || ""} onChange={(e) => merge("faqs", { title: e.target.value })} sx={{ mb: 2 }} />
        <ItemListEditor
          label="Questions"
          items={config.faqs?.items || []}
          spec={[{ key: "question", label: "Question" }, { key: "answer", label: "Answer", multiline: true }]}
          onChange={(items) =>
            merge("faqs", { items: items.map((item, i) => ({ id: item.id ?? i + 1, ...item })) })
          }
        />
      </Section>

      {/* ---- CTA ---- */}
      <Section
        title="Bottom CTA" icon="mdi:bullhorn-outline" subtitle='The "don’t see the right role?" band'
        enabled={config.cta?.enabled !== false}
        onToggle={(v) => merge("cta", { enabled: v })}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Title" size="small" value={config.cta?.title || ""} onChange={(e) => merge("cta", { title: e.target.value })} />
          <TextField label="Button label" size="small" value={config.cta?.buttonLabel || ""} onChange={(e) => merge("cta", { buttonLabel: e.target.value })} />
          <TextField label="Subtitle" size="small" multiline rows={2} value={config.cta?.subtitle || ""} onChange={(e) => merge("cta", { subtitle: e.target.value })} sx={{ gridColumn: "1 / -1" }} />
        </Box>
      </Section>

      {/* ---- Openings copy + Thank-you + Notifications ---- */}
      <Section title="Openings Section & Thank-You Page" icon="mdi:text-box-check-outline">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Openings title" size="small" value={config.openings?.title || ""} onChange={(e) => merge("openings", { title: e.target.value })} />
          <TextField label="Openings subtitle" size="small" value={config.openings?.subtitle || ""} onChange={(e) => merge("openings", { subtitle: e.target.value })} />
          <TextField label="Expected response time" size="small" value={config.thankYou?.responseTime || ""} onChange={(e) => merge("thankYou", { responseTime: e.target.value })} helperText='Shown on the thank-you page, e.g. "2–3 working days"' />
          <TextField label="Thank-you message" size="small" multiline rows={2} value={config.thankYou?.message || ""} onChange={(e) => merge("thankYou", { message: e.target.value })} />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Notifications</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Recruiter email" size="small" value={config.notifications?.recruiterEmail || ""} onChange={(e) => merge("notifications", { recruiterEmail: e.target.value })} helperText="Receives new-application alerts (live API)" />
          <TextField label="WhatsApp webhook URL (optional)" size="small" value={config.notifications?.whatsappWebhook || ""} onChange={(e) => merge("notifications", { whatsappWebhook: e.target.value })} placeholder="https://…" />
          <FormControlLabel control={<Switch checked={config.notifications?.sendApplicantEmail !== false} onChange={(e) => merge("notifications", { sendApplicantEmail: e.target.checked })} />} label="Email confirmation to applicant" />
          <FormControlLabel control={<Switch checked={config.notifications?.sendAdminEmail !== false} onChange={(e) => merge("notifications", { sendAdminEmail: e.target.checked })} />} label="Email alert to admin" />
        </Box>
      </Section>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button variant="contained" size="large" onClick={handleSave} disabled={saving || !dirty} startIcon={<Icon icon="mdi:content-save-outline" />}>
          {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
        </Button>
      </Box>
    </Box>
  );
};

// -----------------------------------------------------------------------------
// Section — accordion wrapper with an optional show/hide toggle in the header.
// -----------------------------------------------------------------------------
const Section = ({ title, icon, subtitle, enabled, onToggle, children }) => (
  <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 1, "&:before": { display: "none" } }}>
    <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
        <Icon icon={icon} style={{ fontSize: 20, opacity: 0.7 }} />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {onToggle && (
          <FormControlLabel
            onClick={(e) => e.stopPropagation()}
            control={<Switch size="small" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />}
            label={<Typography variant="caption">{enabled ? "Visible" : "Hidden"}</Typography>}
            sx={{ mr: 1 }}
          />
        )}
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

// Shared shape for the icon/title/text card sections (why-join-us, benefits, growth).
const IconCardsSection = ({ title, icon, sectionKey, itemsKey, config, merge }) => {
  const section = config[sectionKey] || {};
  return (
    <Section
      title={title} icon={icon}
      enabled={section.enabled !== false}
      onToggle={(v) => merge(sectionKey, { enabled: v })}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
        <TextField label="Title" size="small" value={section.title || ""} onChange={(e) => merge(sectionKey, { title: e.target.value })} />
        <TextField label="Subtitle" size="small" value={section.subtitle || ""} onChange={(e) => merge(sectionKey, { subtitle: e.target.value })} />
      </Box>
      <ItemListEditor
        label="Cards"
        items={section[itemsKey] || []}
        spec={[{ key: "icon", label: "Icon (mdi:*)", width: 180 }, { key: "title", label: "Title" }, { key: "text", label: "Text", multiline: true }]}
        onChange={(items) => merge(sectionKey, { [itemsKey]: items })}
      />
    </Section>
  );
};

// -----------------------------------------------------------------------------
// ItemListEditor — generic repeatable-row editor with add / remove / reorder.
// `spec` describes the editable columns of each row.
// -----------------------------------------------------------------------------
const ItemListEditor = ({ label, items, spec, onChange }) => {
  const move = (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const update = (index, key, value) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  const add = () =>
    onChange([...items, Object.fromEntries(spec.map((s) => [s.key, ""]))]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      {items.map((item, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1, display: "flex", gap: 1.5, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {spec.map((column) => (
            <TextField
              key={column.key}
              label={column.label}
              size="small"
              value={item[column.key] || ""}
              onChange={(e) => update(index, column.key, e.target.value)}
              multiline={column.multiline}
              rows={column.multiline ? 2 : undefined}
              sx={{ width: column.width || "100%", flexShrink: column.width ? 0 : 1 }}
            />
          ))}
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <Tooltip title="Move up"><span><IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}><Icon icon="mdi:arrow-up" /></IconButton></span></Tooltip>
            <Tooltip title="Move down"><span><IconButton size="small" disabled={index === items.length - 1} onClick={() => move(index, 1)}><Icon icon="mdi:arrow-down" /></IconButton></span></Tooltip>
            <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => onChange(items.filter((_, i) => i !== index))}><Icon icon="mdi:delete-outline" /></IconButton></Tooltip>
          </Box>
        </Paper>
      ))}
      <Button size="small" startIcon={<Icon icon="mdi:plus" />} onClick={add}>
        Add {label.replace(/s$/, "").toLowerCase()}
      </Button>
    </Box>
  );
};

export default AdminCareerPage;
