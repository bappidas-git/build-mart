import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Card,
  CardContent,
  MenuItem,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  Skeleton,
  CircularProgress,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import apiService from "../../services/api";
import {
  normalizeHeroConfig,
  makeBlankSlide,
  makeBlankGalleryItem,
  genSlideId,
  resolveVideoSource,
  DEFAULT_HERO_CONFIG,
  HERO_SLIDE_TYPES,
  HERO_MEDIA_TYPES,
  HERO_ALIGN_OPTIONS,
  HERO_BADGE_PRESETS,
} from "../../utils/heroConfig";

// =============================================================================
// HeroSettings — admin editor for the storefront hero carousel
// =============================================================================
// Rendered as the "Hero Section" tab of Admin → Settings. Gives the admin FULL
// control of every slide: add / duplicate / delete / reorder, choose an image
// OR a video background (direct file or a YouTube / Vimeo link), a badge (New
// Launch, Today's Offer, Daily Deals…), headline + sub-copy, up to two CTAs, and
// a cluster of thumbnail cards. Persists the whole `heroConfig` singleton in one
// PUT (mirrors how Settings / Special Offers are saved), the same record the
// storefront HeroSection reads. Fully responsive (single-column on phones).
// =============================================================================

// A compact preview of a slide's background media for the summary row / media
// section — image or video poster, else a labelled placeholder.
const MediaThumb = ({ media, width = 72, height = 48 }) => {
  const url = media?.url || "";
  const poster = media?.poster || "";
  const isVideo = media?.type === "video";
  const src = isVideo ? poster : url;
  const base = {
    width,
    height,
    borderRadius: 1,
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "action.hover",
    color: "text.disabled",
    border: "1px solid",
    borderColor: "divider",
  };
  if (src) {
    return (
      <Box sx={{ ...base, position: "relative" }}>
        <Box
          component="img"
          src={src}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {isVideo && (
          <Icon
            icon="mdi:play-circle"
            style={{
              position: "absolute",
              fontSize: 22,
              color: "#fff",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))",
            }}
          />
        )}
      </Box>
    );
  }
  return (
    <Box sx={base}>
      <Icon icon={isVideo ? "mdi:video-outline" : "mdi:image-outline"} style={{ fontSize: 22 }} />
    </Box>
  );
};

// The saved payload — what actually gets persisted and compared for the
// "unsaved changes" indicator (id/order-independent of local React keys).
const serializeConfig = (c) =>
  JSON.stringify({ enabled: c.enabled, autoplayMs: c.autoplayMs, slides: c.slides });

const HeroSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(() => normalizeHeroConfig(null));
  const [expanded, setExpanded] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Which visibility switch is mid-save ("hero" | slide.id | null), so we can
  // disable just that one control while its instant save is in flight.
  const [toggleBusy, setToggleBusy] = useState(null);

  // Snapshot of the last-persisted config. Anything the admin edits AFTER this
  // (copy, media, CTAs, slide order…) is "unsaved" until they press Save; the
  // visibility switches persist themselves, so they never leave the panel dirty.
  // Computed inline (not memoised) so it re-reads the ref on every render — a
  // memo keyed on `config` would miss the ref update a self-saving toggle makes.
  const savedJsonRef = useRef("");
  const dirty = !loading && serializeConfig(config) !== savedJsonRef.current;

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await apiService.admin.getHeroConfig();
      const normalized = normalizeHeroConfig(raw);
      setConfig(normalized);
      savedJsonRef.current = serializeConfig(normalized);
    } catch (error) {
      console.error("Error loading hero config:", error);
      notify("Failed to load hero settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Single writer for the heroConfig record. Persists exactly what will be
  // compared against for the dirty state, so a successful write always clears
  // "unsaved changes".
  const persist = useCallback(async (cfg) => {
    await apiService.admin.updateHeroConfig({
      enabled: cfg.enabled,
      autoplayMs: cfg.autoplayMs,
      slides: cfg.slides,
    });
    savedJsonRef.current = serializeConfig(cfg);
  }, []);

  // Publish a self-saving change immediately, WITHOUT flushing any unsaved
  // content edits. Used by the visibility toggles AND the Duplicate action: we
  // derive the payload from the last-saved baseline (the snapshot in
  // savedJsonRef) and mutate only what the action touches, so a half-typed
  // headline never goes live because someone hid — or duplicated — a different
  // slide. Local state updates optimistically for instant feedback; unrelated
  // pending edits stay pending (the "Unsaved changes" chip / Save button still
  // reflect them).
  const persistFromSaved = useCallback(async (mutateSaved) => {
    const base = savedJsonRef.current ? JSON.parse(savedJsonRef.current) : null;
    const nextSaved = mutateSaved(base);
    await persist(nextSaved);
  }, [persist]);

  // Master show/hide — saves instantly (optimistic, with rollback) so the hero
  // appears/disappears on the storefront right away, matching what a switch
  // implies.
  const handleToggleHero = async (enabled) => {
    setConfig((c) => ({ ...c, enabled })); // optimistic, keeps pending edits
    setToggleBusy("hero");
    try {
      await persistFromSaved((base) => ({
        ...(base || { autoplayMs: config.autoplayMs, slides: config.slides }),
        enabled,
      }));
      notify(enabled ? "Hero is now live on the storefront" : "Hero hidden from the storefront");
    } catch (error) {
      console.error("Toggle hero error:", error);
      setConfig((c) => ({ ...c, enabled: !enabled })); // roll back
      notify("Couldn't update the hero — please try again", "error");
    } finally {
      setToggleBusy(null);
    }
  };

  // Per-slide show/hide — same instant, surgical behaviour as the master toggle.
  const handleToggleSlide = async (index, enabled) => {
    const slide = config.slides[index];
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) => (i === index ? { ...s, enabled } : s)),
    })); // optimistic
    setToggleBusy(slide.id);
    try {
      await persistFromSaved((base) => {
        const savedHasSlide =
          base && base.slides.some((s) => String(s.id) === String(slide.id));
        // A never-saved slide isn't in the baseline yet, so there's nothing to
        // surgically patch — publish the current slide set so the toggle sticks.
        if (!savedHasSlide) {
          return {
            enabled: config.enabled,
            autoplayMs: config.autoplayMs,
            slides: config.slides.map((s, i) => (i === index ? { ...s, enabled } : s)),
          };
        }
        return {
          ...base,
          slides: base.slides.map((s) =>
            String(s.id) === String(slide.id) ? { ...s, enabled } : s
          ),
        };
      });
      notify(enabled ? "Slide shown on the storefront" : "Slide hidden from the storefront");
    } catch (error) {
      console.error("Toggle slide error:", error);
      setConfig((c) => ({
        ...c,
        slides: c.slides.map((s, i) => (i === index ? { ...s, enabled: !enabled } : s)),
      })); // roll back
      notify("Couldn't update the slide — please try again", "error");
    } finally {
      setToggleBusy(null);
    }
  };

  // --- Immutable update helpers ---------------------------------------------
  const patchConfig = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const patchSlide = (index, patch) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const patchSlideMedia = (index, patch) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === index ? { ...s, media: { ...s.media, ...patch } } : s
      ),
    }));

  const patchSlideCta = (index, key, patch) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === index ? { ...s, [key]: { ...s[key], ...patch } } : s
      ),
    }));

  const addSlide = (type) => {
    const slide = makeBlankSlide(type);
    setConfig((c) => ({ ...c, slides: [...c.slides, slide] }));
    setExpanded(slide.id);
    notify(`${type === "brand" ? "Brand" : "Showcase"} slide added`);
  };

  // Duplicate a slide and PUBLISH it instantly (optimistic, with rollback), the
  // same self-saving behaviour as the visibility toggles. Previously this only
  // mutated local state, so the copy sat "unsaved" until the admin remembered to
  // press Save — and a subsequent instant-saving toggle, which writes from the
  // saved baseline, could silently drop the still-unsaved copy entirely. Making
  // Duplicate persist itself means the new slide reaches the storefront right
  // away (on its next focus/refresh), matching what clicking "Duplicate" implies.
  const duplicateSlide = async (index) => {
    const original = config.slides[index];
    if (!original) return;
    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: genSlideId(),
      title: original.title ? `${original.title} (copy)` : "",
    };

    // Insert the copy right after the original for instant on-screen feedback.
    const insertAfterId = (slides) => {
      const at = slides.findIndex((s) => String(s.id) === String(original.id));
      const next = [...slides];
      next.splice((at < 0 ? index : at) + 1, 0, copy);
      return next;
    };

    setConfig((c) => ({ ...c, slides: insertAfterId(c.slides) })); // optimistic
    setToggleBusy(copy.id);
    try {
      await persistFromSaved((base) => {
        const savedHasOriginal =
          base && base.slides.some((s) => String(s.id) === String(original.id));
        // If the original itself hasn't been saved yet there's no baseline slot
        // to insert after — publish the current slide set (with the copy) so the
        // duplicate sticks. Mirrors the per-slide toggle's never-saved fallback.
        if (!base || !savedHasOriginal) {
          return {
            enabled: config.enabled,
            autoplayMs: config.autoplayMs,
            slides: insertAfterId(config.slides),
          };
        }
        // Surgically drop the copy into the saved baseline so unrelated pending
        // content edits in other slides stay pending, not pushed live.
        return { ...base, slides: insertAfterId(base.slides) };
      });
      notify("Slide duplicated");
    } catch (error) {
      console.error("Duplicate slide error:", error);
      setConfig((c) => ({
        ...c,
        slides: c.slides.filter((s) => String(s.id) !== String(copy.id)),
      })); // roll back the optimistic copy
      notify("Couldn't duplicate the slide — please try again", "error");
    } finally {
      setToggleBusy(null);
    }
  };

  const removeSlide = async (index) => {
    const slide = config.slides[index];
    const result = await Swal.fire({
      title: "Delete this slide?",
      text: slide.title ? `"${slide.title}" will be removed from the hero.` : "This slide will be removed from the hero.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setConfig((c) => ({ ...c, slides: c.slides.filter((_, i) => i !== index) }));
    notify("Slide deleted");
  };

  const moveSlide = (index, dir) =>
    setConfig((c) => {
      const target = index + dir;
      if (target < 0 || target >= c.slides.length) return c;
      const slides = [...c.slides];
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...c, slides };
    });

  // --- Gallery helpers -------------------------------------------------------
  const addGalleryItem = (index) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === index ? { ...s, gallery: [...s.gallery, makeBlankGalleryItem()] } : s
      ),
    }));

  const patchGalleryItem = (index, itemIndex, patch) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === index
          ? {
              ...s,
              gallery: s.gallery.map((g, gi) =>
                gi === itemIndex ? { ...g, ...patch } : g
              ),
            }
          : s
      ),
    }));

  const removeGalleryItem = (index, itemIndex) =>
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s, i) =>
        i === index
          ? { ...s, gallery: s.gallery.filter((_, gi) => gi !== itemIndex) }
          : s
      ),
    }));

  const restoreDefaults = async () => {
    const result = await Swal.fire({
      title: "Restore default slides?",
      text: "This replaces the current slides with the built-in defaults. It only takes effect after you Save.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setConfig(normalizeHeroConfig(DEFAULT_HERO_CONFIG));
    notify("Default slides restored — remember to Save");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await persist(config);
      notify("Hero section saved successfully");
    } catch (error) {
      console.error("Error saving hero config:", error);
      notify(error.response?.data?.message || error.message || "Failed to save hero settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const autoplaySeconds = Math.round((config.autoplayMs || 6000) / 1000);

  // --- Render helpers (plain functions so text fields keep focus) ------------
  const renderSaveBar = (position) => {
    const isTop = position === "top";
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          flexWrap: "wrap",
          gap: { xs: 1.25, sm: 2 },
          ...(isTop
            ? {
                // Keep Save reachable while scrolling a long list of slides.
                position: "sticky",
                top: 0,
                zIndex: 5,
                py: 1.5,
                mb: 2,
                bgcolor: "background.default",
                borderBottom: "1px solid",
                borderColor: dirty ? "warning.main" : "transparent",
                transition: "border-color 0.2s ease",
              }
            : { mt: 3 }),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary">
            Visibility toggles apply instantly. Content edits go live when you save.
          </Typography>
          {dirty && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<Icon icon="mdi:circle-medium" />}
              label="Unsaved changes"
            />
          )}
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !dirty}
          fullWidth={isMobile}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:content-save" />}
        >
          {saving ? "Saving..." : dirty ? "Save Hero Section" : "All changes saved"}
        </Button>
      </Box>
    );
  };

  const renderGallery = (slide, index) => (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Icon icon="mdi:view-grid-outline" /> Thumbnail cards
          <Typography component="span" variant="caption" color="text.secondary">
            ({slide.gallery.length})
          </Typography>
        </Typography>
        <Button size="small" startIcon={<Icon icon="mdi:plus" />} onClick={() => addGalleryItem(index)}>
          Add card
        </Button>
      </Box>
      {slide.gallery.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Optional cluster of linked image cards shown beside the copy (e.g. sub-categories or featured picks).
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {slide.gallery.map((item, gi) => (
            <Box
              key={gi}
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
                p: 1.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <MediaThumb media={{ type: "image", url: item.image }} width={56} height={56} />
              <Grid container spacing={1.5} sx={{ flex: 1 }}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Label" value={item.label} onChange={(e) => patchGalleryItem(index, gi, { label: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Image URL" value={item.image} onChange={(e) => patchGalleryItem(index, gi, { image: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Link" placeholder="/products?category=tiles" value={item.to} onChange={(e) => patchGalleryItem(index, gi, { to: e.target.value })} />
                </Grid>
              </Grid>
              <Tooltip title="Remove card">
                <IconButton size="small" color="error" onClick={() => removeGalleryItem(index, gi)}>
                  <Icon icon="mdi:trash-can-outline" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );

  const renderSlide = (slide, index) => {
    const isBrand = slide.type === "brand";
    const isVideo = slide.media?.type === "video";
    const videoKind = isVideo ? resolveVideoSource(slide.media.url).kind : null;

    return (
      <Accordion
        key={slide.id}
        expanded={expanded === slide.id}
        onChange={(_, isExp) => setExpanded(isExp ? slide.id : null)}
        disableGutters
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          mb: 1.5,
          "&:before": { display: "none" },
          opacity: slide.enabled ? 1 : 0.62,
        }}
      >
        <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.5 }, width: "100%", pr: { xs: 0, sm: 1 } }}>
            {/* Reorder */}
            <Box sx={{ display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" disabled={index === 0} onClick={() => moveSlide(index, -1)} aria-label="Move up" sx={{ p: 0.25 }}>
                <Icon icon="mdi:chevron-up" />
              </IconButton>
              <IconButton size="small" disabled={index === config.slides.length - 1} onClick={() => moveSlide(index, 1)} aria-label="Move down" sx={{ p: 0.25 }}>
                <Icon icon="mdi:chevron-down" />
              </IconButton>
            </Box>

            {/* Thumbnail is dropped on phones to give the title/chips room. */}
            {!isMobile && <MediaThumb media={slide.media} />}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={isBrand ? "Brand" : "Showcase"}
                  color={isBrand ? "secondary" : "default"}
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.68rem" }}
                />
                {!slide.enabled && (
                  <Chip
                    size="small"
                    icon={<Icon icon="mdi:eye-off-outline" />}
                    label="Hidden"
                    sx={{ height: 20, fontSize: "0.68rem" }}
                  />
                )}
                {slide.eyebrow && (
                  <Chip size="small" label={slide.eyebrow} sx={{ height: 20, fontSize: "0.68rem", bgcolor: slide.eyebrowColor || undefined, color: slide.eyebrowColor ? "#fff" : undefined }} />
                )}
                {isVideo && (
                  <Chip size="small" icon={<Icon icon="mdi:video" />} label={videoKind === "embed" ? "Embed" : "Video"} variant="outlined" sx={{ height: 20, fontSize: "0.68rem" }} />
                )}
              </Box>
              <Typography variant="subtitle2" noWrap sx={{ mt: 0.25 }}>
                {slide.title || <em style={{ color: "var(--mui-palette-text-disabled)" }}>Untitled slide</em>}
              </Typography>
            </Box>

            {/* Quick actions */}
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <Tooltip title={slide.enabled ? "Visible — click to hide" : "Hidden — click to show"}>
                <Switch
                  size="small"
                  checked={slide.enabled}
                  onChange={(e) => handleToggleSlide(index, e.target.checked)}
                  disabled={toggleBusy === slide.id}
                  inputProps={{ "aria-label": `${slide.enabled ? "Hide" : "Show"} ${slide.title || "slide"}` }}
                />
              </Tooltip>
              <Tooltip title="Duplicate">
                {/* span wrapper keeps the tooltip working while the button is
                    briefly disabled during its instant save. */}
                <span style={{ display: "inline-flex" }}>
                  <IconButton
                    size="small"
                    onClick={() => duplicateSlide(index)}
                    disabled={!!toggleBusy}
                    aria-label={`Duplicate ${slide.title || "slide"}`}
                  >
                    <Icon icon="mdi:content-copy" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => removeSlide(index)}>
                  <Icon icon="mdi:trash-can-outline" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Type / alignment */}
            <Grid item xs={12} sm={isBrand ? 12 : 6}>
              <TextField select fullWidth size="small" label="Slide type" value={slide.type} onChange={(e) => patchSlide(index, { type: e.target.value })} helperText="Brand = logo + tagline hero. Showcase = headline + media.">
                {HERO_SLIDE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {!isBrand && (
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Text alignment" value={slide.align} onChange={(e) => patchSlide(index, { align: e.target.value })}>
                  {HERO_ALIGN_OPTIONS.map((a) => (
                    <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Badge */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">BADGE / LABEL — flag an offer, launch or deal</Typography>
              </Divider>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <TextField fullWidth size="small" label="Badge text" placeholder="e.g. Today's Offer" value={slide.eyebrow} onChange={(e) => patchSlide(index, { eyebrow: e.target.value })} />
                </Grid>
                <Grid item xs={8} sm={3}>
                  <TextField fullWidth size="small" label="Badge colour" placeholder="#f59e0b" value={slide.eyebrowColor} onChange={(e) => patchSlide(index, { eyebrowColor: e.target.value })} />
                </Grid>
                <Grid item xs={4} sm={2}>
                  <Box
                    sx={{
                      height: 40,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: slide.eyebrowColor || "var(--sf-color-accent, #f6c343)",
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {HERO_BADGE_PRESETS.map((p) => (
                      <Chip
                        key={p.label}
                        size="small"
                        label={p.label}
                        onClick={() => patchSlide(index, { eyebrow: p.label, eyebrowColor: p.color })}
                        sx={{ bgcolor: p.color, color: "#fff", cursor: "pointer", "&:hover": { opacity: 0.9 } }}
                      />
                    ))}
                    {slide.eyebrow && (
                      <Chip size="small" variant="outlined" label="Clear" onClick={() => patchSlide(index, { eyebrow: "", eyebrowColor: "" })} onDelete={() => patchSlide(index, { eyebrow: "", eyebrowColor: "" })} />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Copy */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">CONTENT</Typography>
              </Divider>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Title" value={slide.title} onChange={(e) => patchSlide(index, { title: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Subtitle" value={slide.subtitle} onChange={(e) => patchSlide(index, { subtitle: e.target.value })} multiline rows={2} />
                </Grid>
                {isBrand && (
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Logo URL" value={slide.logo} onChange={(e) => patchSlide(index, { logo: e.target.value })} helperText="Shown above the title on the brand slide." />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Media */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">BACKGROUND MEDIA — image or video</Typography>
              </Divider>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} sm={3}>
                  <TextField select fullWidth size="small" label="Media type" value={slide.media.type} onChange={(e) => patchSlideMedia(index, { type: e.target.value })}>
                    {HERO_MEDIA_TYPES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={isVideo ? 5 : 9}>
                  <TextField
                    fullWidth
                    size="small"
                    label={isVideo ? "Video URL" : "Image URL"}
                    placeholder={isVideo ? "https://youtu.be/… , Vimeo, or a .mp4 file" : "https://…/photo.jpg"}
                    value={slide.media.url}
                    onChange={(e) => patchSlideMedia(index, { url: e.target.value })}
                    helperText={
                      isVideo
                        ? videoKind === "embed"
                          ? "YouTube / Vimeo link detected — embedded, muted & looped."
                          : "Direct video file — plays muted & looped as a background."
                        : "Full-bleed background photo (wide images look best)."
                    }
                  />
                </Grid>
                {isVideo && (
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Poster image URL" value={slide.media.poster} onChange={(e) => patchSlideMedia(index, { poster: e.target.value })} helperText="Shown before the video plays / under reduced-motion." />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <MediaThumb media={slide.media} width={120} height={68} />
                    <Typography variant="caption" color="text.secondary">
                      Preview. A broken or empty background falls back to the branded scrim, so the slide is never bare.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* CTAs */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">CALL-TO-ACTION BUTTONS</Typography>
              </Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Primary label" placeholder="Explore Products" value={slide.primaryCta.label} onChange={(e) => patchSlideCta(index, "primaryCta", { label: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Primary link" placeholder="/products" value={slide.primaryCta.to} onChange={(e) => patchSlideCta(index, "primaryCta", { to: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Secondary label" placeholder="Enquire Now" value={slide.secondaryCta.label} onChange={(e) => patchSlideCta(index, "secondaryCta", { label: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Secondary link" placeholder="tel:+91… or https://…" value={slide.secondaryCta.to} onChange={(e) => patchSlideCta(index, "secondaryCta", { to: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Use an in-app path like <code>/products?category=tiles</code>, or a full URL / <code>tel:</code> / <code>mailto:</code> link. Leave a button's fields blank to hide it.
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Gallery (showcase only) */}
            {!isBrand && (
              <Grid item xs={12}>
                <Divider textAlign="left" sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">THUMBNAIL CARDS</Typography>
                </Divider>
                {renderGallery(slide, index)}
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {renderSaveBar("top")}

      {/* Master controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Icon icon="mdi:view-carousel-outline" style={{ fontSize: 24, marginRight: 8 }} />
            <Typography variant="h6">Hero Carousel</Typography>
          </Box>
          <Divider sx={{ mb: 2.5 }} />
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <FormControlLabel
                  sx={{ mr: 0.5 }}
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => handleToggleHero(e.target.checked)}
                      disabled={toggleBusy === "hero" || loading}
                    />
                  }
                  label="Show the hero on the storefront"
                />
                <Chip
                  size="small"
                  color={config.enabled ? "success" : "default"}
                  variant={config.enabled ? "filled" : "outlined"}
                  icon={<Icon icon={config.enabled ? "mdi:check-circle" : "mdi:eye-off-outline"} />}
                  label={config.enabled ? "Live" : "Hidden"}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, ml: 0.25 }}>
                Applied to the storefront instantly.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Auto-advance every (seconds)"
                value={autoplaySeconds}
                onChange={(e) => {
                  const secs = Math.max(1, Number(e.target.value) || 1);
                  patchConfig({ autoplayMs: secs * 1000 });
                }}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Chip
                icon={<Icon icon="mdi:layers-outline" />}
                label={`${config.slides.length} slide${config.slides.length === 1 ? "" : "s"}`}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Add / restore actions */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <Button variant="contained" startIcon={<Icon icon="mdi:image-plus" />} onClick={() => addSlide("showcase")}>
          Add showcase slide
        </Button>
        <Button variant="outlined" startIcon={<Icon icon="mdi:star-plus-outline" />} onClick={() => addSlide("brand")}>
          Add brand slide
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button color="inherit" startIcon={<Icon icon="mdi:backup-restore" />} onClick={restoreDefaults}>
          Restore defaults
        </Button>
      </Box>

      {/* Slides */}
      {config.slides.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}>
          <Icon icon="mdi:image-multiple-outline" style={{ fontSize: 48, opacity: 0.4 }} />
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No slides yet. Add a showcase or brand slide to build your hero.
          </Typography>
        </Paper>
      ) : (
        <Box>{config.slides.map((slide, index) => renderSlide(slide, index))}</Box>
      )}

      {renderSaveBar("bottom")}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HeroSettings;
