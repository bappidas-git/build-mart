import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Skeleton, Tooltip, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Grid, Divider,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import apiService from "../../services/api";
import { orderCategoriesHierarchically } from "../../utils/categories";
import AdminEmptyState from "../../components/EmptyState/AdminEmptyState";

// Unit-of-measure options for the pricing block (matches the storefront
// PriceBlock unitType suffix). The current value is prepended in the Select if a
// legacy product carries a unit outside this list, so it's never silently lost.
const UNIT_OPTIONS = ["piece", "box", "sheet", "bundle", "bag", "kg", "meter", "sq ft"];

const emptyProduct = {
  name: "", slug: "", sku: "", shortDescription: "", description: "",
  categoryId: "", brand: "", images: [], price: 0, comparePrice: 0, costPrice: 0,
  stock: 0, lowStockThreshold: 10, weight: 0,
  dimensions: { length: 0, width: 0, height: 0 },
  variants: [],
  // specifications: key/value rows rendered on the storefront product spec table.
  specifications: [],
  // Flexible pricing model (feeds storefront PriceBlock — prompt 15):
  //   priceType  "exact" | "tiered" | "onEnquiry"
  //   priceTiers [{ minQty, price }] quantity bulk-pricing ladder (tiered only)
  //   cardPriceMode  how the CARD surfaces the price — PriceBlock reads
  //     "exact" | "from" | "onEnquiry" (NOT card/details); we keep it consistent
  //     with priceType and only offer a "hide on card → onEnquiry" override.
  priceType: "exact",
  unitType: "piece",
  minQty: 1,
  priceTiers: [],
  showExactPrice: true,
  showTieredPricing: true,
  cardPriceMode: "exact",
  tags: [], featured: false, trending: false, hot: false, isActive: true,
  // special: additive "Special Products" badge (NOT an exclusive category) — feeds
  // the storefront Special Products collection.
  special: false,
  metaTitle: "", metaDescription: "",
};

// Resolve a card-display mode that is always valid for the given price type, so
// the Select never renders an out-of-range value: exact→exact, tiered→from,
// onEnquiry→onEnquiry, while preserving a deliberate "hide on card" (onEnquiry).
const normalizeCardMode = (priceType, cardPriceMode) => {
  if (priceType === "onEnquiry") return "onEnquiry";
  if (cardPriceMode === "onEnquiry") return "onEnquiry";
  return priceType === "tiered" ? "from" : "exact";
};

const slugify = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Keep numeric inputs as non-negative numbers. Empty/NaN falls back (defaults to
// 0, or a caller-supplied value for fields like the low-stock threshold).
const clampNum = (v, { int = false, fallback = 0 } = {}) => {
  const n = int ? parseInt(v, 10) : parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, n);
};

const newVariantId = () => `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [imageInput, setImageInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        apiService.admin.getProducts(),
        apiService.admin.getCategories(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({
      ...emptyProduct,
      dimensions: { length: 0, width: 0, height: 0 },
      variants: [],
      specifications: [],
      priceTiers: [],
    });
    setErrors({});
    setImageInput("");
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    const dims = p.dimensions || {};
    const priceType = ["exact", "tiered", "onEnquiry"].includes(p.priceType) ? p.priceType : "exact";
    setForm({
      name: p.name, slug: p.slug, sku: p.sku || "", shortDescription: p.shortDescription || "",
      description: p.description || "", categoryId: p.categoryId ?? "", brand: p.brand || "",
      images: p.images || [], price: p.price || 0, comparePrice: p.comparePrice || 0,
      costPrice: p.costPrice || 0, stock: p.stock || 0, lowStockThreshold: p.lowStockThreshold || 10,
      weight: p.weight || 0,
      dimensions: {
        length: dims.length || 0, width: dims.width || 0, height: dims.height || 0,
      },
      // Clone variants so row edits don't mutate the list's product object.
      variants: Array.isArray(p.variants)
        ? p.variants.map((v) => ({
            id: v.id || newVariantId(),
            name: v.name || "",
            price: v.price || 0,
            stock: v.stock || 0,
            sku: v.sku || "",
          }))
        : [],
      // Clone specification rows for the same reason.
      specifications: Array.isArray(p.specifications)
        ? p.specifications.map((s) => ({ label: s.label || "", value: s.value || "" }))
        : [],
      // Pricing model — safe fallbacks; normalise cardPriceMode so the Select is
      // never fed a value out of range for the product's priceType.
      priceType,
      unitType: p.unitType || "piece",
      minQty: p.minQty ?? 1,
      priceTiers: Array.isArray(p.priceTiers)
        ? p.priceTiers.map((t) => ({ minQty: t.minQty ?? 1, price: t.price ?? 0 }))
        : [],
      showExactPrice: p.showExactPrice !== false,
      showTieredPricing: p.showTieredPricing !== false,
      cardPriceMode: normalizeCardMode(priceType, p.cardPriceMode),
      tags: p.tags || [], featured: !!p.featured,
      trending: !!p.trending, hot: !!p.hot, isActive: p.isActive !== false,
      special: !!p.special,
      metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "",
    });
    setErrors({});
    setImageInput((p.images || []).join("\n"));
    setTagsInput((p.tags || []).join(", "));
    setDialogOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    // Auto-slug only while creating (don't fight a hand-edited slug on edit).
    setForm((f) => ({ ...f, name, slug: !editingProduct ? slugify(name) : f.slug }));
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setDimension = (key, value) =>
    setForm((f) => ({ ...f, dimensions: { ...f.dimensions, [key]: value } }));

  // ── Numeric inputs ─────────────────────────────────────────────────────
  // Numeric <input>s keep the RAW typed string in state while focused, then
  // normalise to a clean non-negative number on blur. Coercing to a Number on
  // every keystroke (the previous behaviour) made the fields impossible to edit:
  // clearing one snapped it straight back to "0", and because the old number was
  // never really cleared, freshly typed digits concatenated onto it (e.g. editing
  // 340 produced 34044). That hit hardest on touch devices with no easy
  // select-all — the "price won't change" bug. handleSave clamps every field
  // again before the payload, so the raw string is only ever transient.
  // setField/setDimension share a (key, value) signature, so one pair of helpers
  // serves both; tier & variant rows (index-keyed) inline the same idea.
  const rawChange = (setter, key) => (e) => setter(key, e.target.value);
  const normBlur = (setter, key, opts) => (e) => setter(key, clampNum(e.target.value, opts));

  // ── Variants ───────────────────────────────────────────────────────────
  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { id: newVariantId(), name: "", price: 0, stock: 0, sku: "" }],
    }));

  const updateVariant = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, [key]: value } : v)),
    }));

  const removeVariant = (idx) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  // ── Specifications ─────────────────────────────────────────────────────
  const addSpec = () =>
    setForm((f) => ({ ...f, specifications: [...f.specifications, { label: "", value: "" }] }));

  const updateSpec = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      specifications: f.specifications.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }));

  const removeSpec = (idx) =>
    setForm((f) => ({ ...f, specifications: f.specifications.filter((_, i) => i !== idx) }));

  // ── Pricing model ──────────────────────────────────────────────────────
  // Switching price type resets cardPriceMode to the new type's NATURAL card
  // display (exact→exact, tiered→from, onEnquiry→onEnquiry). We deliberately
  // don't carry a previous "onEnquiry" card choice across the switch — coming
  // from the onEnquiry type that value was forced, not a deliberate hide, so
  // preserving it would leave a priced product silently hidden on the card. The
  // admin can re-pick "Price on Enquiry" per type via the Card-display Select.
  const setPriceType = (value) =>
    setForm((f) => ({
      ...f,
      priceType: value,
      cardPriceMode: value === "tiered" ? "from" : value === "onEnquiry" ? "onEnquiry" : "exact",
    }));

  // Price tiers mirror the specifications rows (index-keyed, no id — the
  // storefront reads only {minQty, price}). New rows seed minQty one above the
  // last so the ascending rule is satisfied by default.
  const addTier = () =>
    setForm((f) => {
      const last = f.priceTiers[f.priceTiers.length - 1];
      const nextMin = last ? clampNum(last.minQty, { int: true, fallback: 1 }) + 1 : 1;
      return { ...f, priceTiers: [...f.priceTiers, { minQty: nextMin, price: 0 }] };
    });

  const updateTier = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      priceTiers: f.priceTiers.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));

  const removeTier = (idx) =>
    setForm((f) => ({ ...f, priceTiers: f.priceTiers.filter((_, i) => i !== idx) }));

  // Make a URL-safe slug that doesn't collide with another product's slug.
  const makeUniqueSlug = (base) => {
    let slug = slugify(base);
    if (!slug) return slug;
    const taken = new Set(
      products
        .filter((p) => !editingProduct || String(p.id) !== String(editingProduct.id))
        .map((p) => p.slug)
    );
    if (!taken.has(slug)) return slug;
    let n = 2;
    while (taken.has(`${slug}-${n}`)) n += 1;
    return `${slug}-${n}`;
  };

  const handleSave = async () => {
    // Drop entirely-blank variant rows, then keep a clean shape.
    const cleanedVariants = form.variants
      .filter((v) => v.name.trim() || v.sku.trim() || Number(v.price) > 0 || Number(v.stock) > 0)
      .map((v) => ({
        id: v.id || newVariantId(),
        name: v.name.trim(),
        price: clampNum(v.price),
        stock: clampNum(v.stock, { int: true }),
        sku: v.sku.trim(),
      }));

    // Drop rows where both label and value are blank; trim the rest.
    const cleanedSpecs = form.specifications
      .map((s) => ({ label: (s.label || "").trim(), value: (s.value || "").trim() }))
      .filter((s) => s.label || s.value);

    // Coerce tier rows to numbers (fallback 0 for minQty so a blank fails the
    // ≥ 1 check rather than silently becoming 1).
    const cleanedTiers = form.priceTiers.map((t) => ({
      minQty: clampNum(t.minQty, { int: true, fallback: 0 }),
      price: clampNum(t.price),
    }));

    // ── Validation ──────────────────────────────────────────────────────
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Product name is required";

    const slug = makeUniqueSlug(form.slug || form.name);
    if (!slug) nextErrors.slug = "A URL-safe slug is required";

    const price = clampNum(form.price);
    // A selling price (or a variant) is only mandatory for exact pricing; tiered
    // is priced by its ladder and onEnquiry shows no number at all.
    if (form.priceType === "exact" && cleanedVariants.length === 0 && !(price > 0)) {
      nextErrors.price = "Enter a selling price greater than 0 (or add a variant)";
    }

    // Tiered pricing: ≥ 1 tier, each minQty a positive integer + price > 0, and
    // minQty strictly ascending down the table with no duplicates (checked in
    // entry order so an out-of-order row is rejected, not silently sorted away).
    if (form.priceType === "tiered") {
      if (cleanedTiers.length === 0) {
        nextErrors.priceTiers = "Add at least one price tier for tiered pricing";
      } else {
        const tierRowErrors = {};
        const seenMin = new Set();
        let prevMin = -Infinity;
        cleanedTiers.forEach((t, i) => {
          if (!(t.minQty >= 1)) tierRowErrors[i] = "Min qty must be a whole number ≥ 1";
          else if (!(t.price > 0)) tierRowErrors[i] = "Price must be greater than 0";
          else if (seenMin.has(t.minQty)) tierRowErrors[i] = "Duplicate min qty";
          else if (t.minQty <= prevMin) tierRowErrors[i] = "Min qty must increase down the table";
          seenMin.add(t.minQty);
          prevMin = t.minQty;
        });
        if (Object.keys(tierRowErrors).length) nextErrors.tierRows = tierRowErrors;
      }
    }

    const variantRowErrors = {};
    cleanedVariants.forEach((v, i) => {
      if (!v.name) variantRowErrors[i] = "Name required";
    });
    if (Object.keys(variantRowErrors).length) nextErrors.variantRows = variantRowErrors;

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      Swal.fire({
        icon: "warning", title: "Please fix the highlighted fields",
        toast: true, position: "bottom-end", showConfirmButton: false, timer: 3000,
      });
      return;
    }
    setErrors({});

    // Drop an all-zero dimensions object so the storefront spec table doesn't
    // render a meaningless "0 × 0 × 0" row for products without dimensions.
    const dims = {
      length: clampNum(form.dimensions.length),
      width: clampNum(form.dimensions.width),
      height: clampNum(form.dimensions.height),
    };
    const dimensions = dims.length || dims.width || dims.height ? dims : null;

    // ── Payload ─────────────────────────────────────────────────────────
    const editable = {
      name: form.name.trim(),
      slug,
      sku: form.sku.trim(),
      shortDescription: form.shortDescription,
      description: form.description,
      categoryId: form.categoryId === "" ? null : form.categoryId,
      brand: form.brand.trim(),
      images: imageInput.split("\n").map((s) => s.trim()).filter(Boolean),
      price,
      comparePrice: clampNum(form.comparePrice),
      costPrice: clampNum(form.costPrice),
      // Flexible pricing model — identical JSON shape for JSON Server & Laravel.
      priceType: form.priceType,
      unitType: (form.unitType || "piece").trim() || "piece",
      minQty: clampNum(form.minQty, { int: true, fallback: 1 }) || 1,
      priceTiers:
        form.priceType === "tiered"
          ? cleanedTiers
              .map((t) => ({ minQty: clampNum(t.minQty, { int: true, fallback: 1 }) || 1, price: clampNum(t.price) }))
              .sort((a, b) => a.minQty - b.minQty)
          : [],
      showExactPrice: form.priceType === "exact" ? !!form.showExactPrice : false,
      showTieredPricing: form.priceType === "tiered" ? !!form.showTieredPricing : false,
      cardPriceMode: normalizeCardMode(form.priceType, form.cardPriceMode),
      stock: clampNum(form.stock, { int: true }),
      lowStockThreshold: clampNum(form.lowStockThreshold, { int: true, fallback: 10 }),
      weight: clampNum(form.weight),
      dimensions,
      variants: cleanedVariants,
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      featured: form.featured, trending: form.trending, hot: form.hot, isActive: form.isActive,
      // special: additive Special Products badge (see prompt 11 storefront collection).
      special: form.special,
      metaTitle: form.metaTitle, metaDescription: form.metaDescription,
    };
    // Only attach specifications to a create payload when non-empty, keeping fresh
    // records clean. On edit we always send it (below) so clearing all rows sticks.
    if (cleanedSpecs.length) editable.specifications = cleanedSpecs;

    try {
      setSaving(true);
      if (editingProduct) {
        // updateProduct PUTs the full record (mock) — merge over the original so
        // server-managed fields (rating, totalReviews, createdAt) survive the edit.
        // specifications is set explicitly so removing every row overrides the
        // original's stale array rather than being masked by the spread.
        await apiService.admin.updateProduct(editingProduct.id, {
          ...editingProduct,
          ...editable,
          specifications: cleanedSpecs,
        });
      } else {
        await apiService.admin.createProduct(editable);
      }
      setDialogOpen(false);
      Swal.fire({
        icon: "success", title: editingProduct ? "Product updated" : "Product created",
        toast: true, position: "bottom-end", showConfirmButton: false, timer: 2500,
      });
      loadData();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const result = await Swal.fire({
      title: "Delete product?", text: `"${p.name}" will be permanently deleted.`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#d32f2f", confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await apiService.admin.deleteProduct(p.id);
      Swal.fire({ icon: "success", title: "Deleted", toast: true, position: "bottom-end", showConfirmButton: false, timer: 2000 });
      loadData();
    } catch (e) { Swal.fire({ icon: "error", title: "Error", text: e.message }); }
  };

  const getCategoryName = (id) => categories.find((c) => String(c.id) === String(id))?.name || "—";
  const fc = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // Lowest usable tier price for the table's "From ₹X" display (falls back to
  // the product's base price when tiers are absent/invalid).
  const tierMin = (p) => {
    const prices = (Array.isArray(p.priceTiers) ? p.priceTiers : [])
      .map((t) => Number(t.price))
      .filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : p.price;
  };

  // Unit-of-measure options, including any legacy value not in the standard set.
  const unitOptions =
    !form.unitType || UNIT_OPTIONS.includes(form.unitType)
      ? UNIT_OPTIONS
      : [form.unitType, ...UNIT_OPTIONS];

  // Category options ordered as a tree (parent immediately followed by its
  // children, depth-first) with a depth per id, so the Select can visually nest
  // subcategories. Storing/reading still uses the raw categoryId.
  const categoryOptions = useMemo(() => {
    const { ordered, depthOf } = orderCategoriesHierarchically(categories);
    return ordered.map((c) => ({ id: c.id, name: c.name, depth: depthOf(c.id) }));
  }, [categories]);

  // "— " prefix (one per level) makes sub-category depth legible in a flat Select.
  const indentName = (name, depth) => (depth > 0 ? `${"— ".repeat(depth)}${name}` : name);

  // For variant products the product-level stock is rarely the real figure, so
  // show the summed variant stock; the chip colour follows the same total.
  const effectiveStock = (p) =>
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : p.stock;

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || String(p.categoryId) === String(categoryFilter);
    return matchSearch && matchCat;
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Products</Typography>
          <Typography variant="body2" color="text.secondary">Manage your product catalogue</Typography>
        </Box>
        <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}>
          Add Product
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search by name, SKU or brand..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ flex: 1, minWidth: 220, maxWidth: 360 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter} label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              renderValue={(val) => (val === "all" ? "All Categories" : getCategoryName(val))}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c.id} value={String(c.id)} sx={{ pl: 2 + c.depth * 1.5 }}>
                  {indentName(c.name, c.depth)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* Horizontal scroll keeps all 8 columns reachable on small screens. */}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (<TableRow key={i}><TableCell colSpan={8}><Skeleton height={56} /></TableCell></TableRow>))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 0, borderBottom: "none" }}>
                    <AdminEmptyState
                      icon="mdi:package-variant-closed"
                      title="No products found"
                      description="Add products or adjust your filters to see them here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const stock = effectiveStock(p);
                  const hasStock = typeof stock === "number";
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar src={p.images?.[0]} variant="rounded" sx={{ width: 48, height: 48, bgcolor: "action.hover" }}>
                            <Icon icon="mdi:package-variant" style={{ fontSize: 22 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                            {p.brand && <Typography variant="caption" color="text.secondary">{p.brand}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.sku || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{getCategoryName(p.categoryId)}</Typography></TableCell>
                      <TableCell>
                        {p.priceType === "onEnquiry" ? (
                          <Chip
                            label="On Enquiry" size="small" variant="outlined"
                            icon={<Icon icon="mdi:message-question-outline" style={{ fontSize: 13 }} />}
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        ) : p.priceType === "tiered" ? (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>From {fc(tierMin(p))}</Typography>
                            <Chip label="Tiered" size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#1885d8", color: "#fff" }} />
                          </Box>
                        ) : (
                          <>
                            <Typography variant="body2" fontWeight={500}>{fc(p.price)}</Typography>
                            {p.comparePrice > p.price && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>{fc(p.comparePrice)}</Typography>}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hasStock ? stock : "N/A"}
                          size="small"
                          color={!hasStock ? "default" : stock === 0 ? "error" : stock <= (p.lowStockThreshold || 10) ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {p.special && (
                            <Chip
                              label="Special"
                              size="small"
                              icon={<Icon icon="mdi:star-shooting-outline" style={{ fontSize: 13 }} />}
                              sx={{
                                height: 20, fontSize: "0.65rem",
                                bgcolor: "#fa9c4c", color: "#fff",
                                "& .MuiChip-icon": { color: "#fff", ml: 0.5 },
                              }}
                            />
                          )}
                          {p.featured && <Chip label="Featured" size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} />}
                          {p.trending && <Chip label="Trending" size="small" color="secondary" sx={{ height: 20, fontSize: "0.65rem" }} />}
                          {p.hot && <Chip label="Hot" size="small" color="error" sx={{ height: 20, fontSize: "0.65rem" }} />}
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={p.isActive !== false ? "Active" : "Draft"} size="small" color={p.isActive !== false ? "success" : "default"} /></TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)} sx={{ minWidth: 44, minHeight: 44 }}><Icon icon="mdi:pencil-outline" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p)} sx={{ minWidth: 44, minHeight: 44 }}><Icon icon="mdi:delete-outline" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Basic Info */}
            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Basic Information</Typography></Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Product Name *" value={form.name} onChange={handleNameChange}
                fullWidth size="small" error={!!errors.name} helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="SKU" value={form.sku} onChange={(e) => setField("sku", e.target.value)} fullWidth size="small" placeholder="e.g., PRD-001" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Slug" value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                onBlur={(e) => setField("slug", slugify(e.target.value))}
                fullWidth size="small" error={!!errors.slug}
                helperText={errors.slug || "URL-friendly; auto-generated from the name"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Brand" value={form.brand} onChange={(e) => setField("brand", e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.categoryId ?? ""} label="Category"
                  onChange={(e) => setField("categoryId", e.target.value)}
                  renderValue={(val) => (val === "" || val == null ? "None" : getCategoryName(val))}
                >
                  <MenuItem value="">None</MenuItem>
                  {categoryOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id} sx={{ pl: 2 + c.depth * 1.5 }}>
                      {indentName(c.name, c.depth)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Short Description" value={form.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} fullWidth size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Full Description" value={form.description} onChange={(e) => setField("description", e.target.value)} fullWidth size="small" multiline rows={4} />
            </Grid>

            {/* Specifications — key/value rows rendered on the storefront spec table. */}
            <Grid item xs={12}>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    <Icon icon="mdi:format-list-bulleted" style={{ fontSize: 16, verticalAlign: "-2px", marginRight: 4 }} />
                    Specifications (optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Technical details shown on the storefront product page (e.g. Material → WPC, Thickness → 18mm).
                  </Typography>
                </Box>
                <Button size="small" startIcon={<Icon icon="mdi:plus" />} onClick={addSpec} sx={{ flexShrink: 0 }}>
                  Add Specification
                </Button>
              </Box>
            </Grid>
            {form.specifications.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 1, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">No specifications added.</Typography>
                </Box>
              </Grid>
            ) : (
              form.specifications.map((s, idx) => (
                <Grid item xs={12} key={idx}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: { xs: "wrap", md: "nowrap" }, alignItems: "flex-start" }}>
                    <TextField
                      label={`Label ${idx + 1}`} value={s.label}
                      onChange={(e) => updateSpec(idx, "label", e.target.value)}
                      size="small" sx={{ flex: 1, minWidth: 140 }}
                      placeholder="e.g., Material"
                    />
                    <TextField
                      label="Value" value={s.value}
                      onChange={(e) => updateSpec(idx, "value", e.target.value)}
                      size="small" sx={{ flex: 2, minWidth: 160 }}
                      placeholder="e.g., WPC (Wood-Plastic Composite)"
                    />
                    <Tooltip title="Remove specification">
                      <IconButton color="error" onClick={() => removeSpec(idx)} sx={{ mt: 0.25 }}>
                        <Icon icon="mdi:delete-outline" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              ))
            )}

            {/* ── Pricing ──────────────────────────────────────────────────
                Flexible model (feeds storefront PriceBlock — prompt 15):
                exact · tiered · on-enquiry. Only the fields for the chosen
                price type render, keeping the form uncluttered. */}
            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                <Icon icon="mdi:cash-multiple" style={{ fontSize: 16, verticalAlign: "-2px", marginRight: 4 }} />
                Pricing
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Price type
              </Typography>
              <ToggleButtonGroup
                value={form.priceType} exclusive size="small"
                onChange={(_e, val) => val && setPriceType(val)}
                sx={{ flexWrap: "wrap" }}
              >
                <ToggleButton value="exact">
                  <Icon icon="mdi:cash" style={{ fontSize: 16, marginRight: 6 }} />Exact price
                </ToggleButton>
                <ToggleButton value="tiered">
                  <Icon icon="mdi:table" style={{ fontSize: 16, marginRight: 6 }} />Tiered
                </ToggleButton>
                <ToggleButton value="onEnquiry">
                  <Icon icon="mdi:message-question-outline" style={{ fontSize: 16, marginRight: 6 }} />On enquiry
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select value={form.unitType} label="Unit" onChange={(e) => setField("unitType", e.target.value)}>
                  {unitOptions.map((u) => (<MenuItem key={u} value={u}>{u}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Min order qty" type="number" value={form.minQty}
                onChange={rawChange(setField, "minQty")}
                onBlur={normBlur(setField, "minQty", { int: true, fallback: 1 })}
                fullWidth size="small" inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Exact → fixed price + margin fields + card/visibility toggles */}
            {form.priceType === "exact" && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Selling Price (₹) *" type="number" value={form.price}
                    onChange={rawChange(setField, "price")}
                    onBlur={normBlur(setField, "price")}
                    fullWidth size="small" inputProps={{ min: 0 }}
                    error={!!errors.price} helperText={errors.price}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Compare-at Price (₹)" type="number" value={form.comparePrice} onChange={rawChange(setField, "comparePrice")} onBlur={normBlur(setField, "comparePrice")} fullWidth size="small" inputProps={{ min: 0 }} helperText="Strikethrough price" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Cost Price (₹)" type="number" value={form.costPrice} onChange={rawChange(setField, "costPrice")} onBlur={normBlur(setField, "costPrice")} fullWidth size="small" inputProps={{ min: 0 }} helperText="For margin calculation" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.showExactPrice} onChange={(e) => setField("showExactPrice", e.target.checked)} />}
                    label="Show price on storefront"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Card price display</InputLabel>
                    <Select value={form.cardPriceMode} label="Card price display" onChange={(e) => setField("cardPriceMode", e.target.value)}>
                      <MenuItem value="exact">Show exact price on card</MenuItem>
                      <MenuItem value="onEnquiry">Show “Price on Enquiry” on card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Tiered → editable quantity-vs-price ladder */}
            {form.priceType === "tiered" && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={600}>
                      <Icon icon="mdi:table" style={{ fontSize: 16, verticalAlign: "-2px", marginRight: 4, color: "#1885d8" }} />
                      Quantity price tiers
                    </Typography>
                    <Button size="small" startIcon={<Icon icon="mdi:plus" />} onClick={addTier} sx={{ flexShrink: 0 }}>
                      Add tier
                    </Button>
                  </Box>
                </Grid>
                {form.priceTiers.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: "1px dashed", borderColor: errors.priceTiers ? "error.main" : "divider", borderRadius: 1, textAlign: "center" }}>
                      <Typography variant="caption" color={errors.priceTiers ? "error" : "text.secondary"}>
                        {errors.priceTiers || "No tiers yet — add at least one quantity → price row."}
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  form.priceTiers.map((t, idx) => (
                    <Grid item xs={12} key={idx}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: { xs: "wrap", md: "nowrap" }, alignItems: "flex-start" }}>
                        <TextField
                          label={`Min qty ${idx + 1}`} type="number" value={t.minQty}
                          onChange={(e) => updateTier(idx, "minQty", e.target.value)}
                          onBlur={(e) => updateTier(idx, "minQty", clampNum(e.target.value, { int: true, fallback: 1 }))}
                          size="small" sx={{ flex: 1, minWidth: 130 }} inputProps={{ min: 1 }}
                          error={!!errors.tierRows?.[idx]} helperText={errors.tierRows?.[idx]}
                        />
                        <TextField
                          label={`Price / ${form.unitType || "unit"} (₹)`} type="number" value={t.price}
                          onChange={(e) => updateTier(idx, "price", e.target.value)}
                          onBlur={(e) => updateTier(idx, "price", clampNum(e.target.value))}
                          size="small" sx={{ flex: 1, minWidth: 130 }} inputProps={{ min: 0 }}
                        />
                        <Tooltip title="Remove tier">
                          <IconButton color="error" onClick={() => removeTier(idx)} sx={{ mt: 0.25 }}>
                            <Icon icon="mdi:delete-outline" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  ))
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Higher quantities should cost less per unit — min quantities must increase down the table.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.showTieredPricing} onChange={(e) => setField("showTieredPricing", e.target.checked)} />}
                    label="Show price table on storefront"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Card price display</InputLabel>
                    <Select value={form.cardPriceMode} label="Card price display" onChange={(e) => setField("cardPriceMode", e.target.value)}>
                      <MenuItem value="from">Show “From ₹X” on card</MenuItem>
                      <MenuItem value="onEnquiry">Show “Price on Enquiry” on card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* On enquiry → no price shown; display toggles ignored */}
            {form.priceType === "onEnquiry" && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "action.hover", display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Icon icon="mdi:message-question-outline" style={{ fontSize: 22, color: "#1885d8", flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary">
                    The storefront will display <strong>“Price on Enquiry.”</strong> Price, tiers and display toggles are ignored for this product.
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Inventory */}
            <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>Inventory & Dimensions</Typography></Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Stock Quantity" type="number" value={form.stock} onChange={rawChange(setField, "stock")} onBlur={normBlur(setField, "stock", { int: true })} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Low Stock Threshold" type="number" value={form.lowStockThreshold} onChange={rawChange(setField, "lowStockThreshold")} onBlur={normBlur(setField, "lowStockThreshold", { int: true, fallback: 10 })} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Weight (kg)" type="number" value={form.weight} onChange={rawChange(setField, "weight")} onBlur={normBlur(setField, "weight")} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Length (cm)" type="number" value={form.dimensions.length} onChange={rawChange(setDimension, "length")} onBlur={normBlur(setDimension, "length")} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Width (cm)" type="number" value={form.dimensions.width} onChange={rawChange(setDimension, "width")} onBlur={normBlur(setDimension, "width")} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Height (cm)" type="number" value={form.dimensions.height} onChange={rawChange(setDimension, "height")} onBlur={normBlur(setDimension, "height")} fullWidth size="small" inputProps={{ min: 0 }} />
            </Grid>

            {/* Variants */}
            <Grid item xs={12}>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Variants (optional)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add options like size/colour with their own price, stock &amp; SKU. Shown on the product page.
                  </Typography>
                </Box>
                <Button size="small" startIcon={<Icon icon="mdi:plus" />} onClick={addVariant} sx={{ flexShrink: 0 }}>
                  Add Variant
                </Button>
              </Box>
            </Grid>
            {form.variants.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 1, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">No variants — this product is sold as a single option.</Typography>
                </Box>
              </Grid>
            ) : (
              form.variants.map((v, idx) => (
                <Grid item xs={12} key={v.id}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: { xs: "wrap", md: "nowrap" }, alignItems: "flex-start" }}>
                    <TextField
                      label={`Variant ${idx + 1} name`} value={v.name}
                      onChange={(e) => updateVariant(idx, "name", e.target.value)}
                      size="small" sx={{ flex: 2, minWidth: 150 }}
                      error={!!errors.variantRows?.[idx]} helperText={errors.variantRows?.[idx]}
                      placeholder="e.g., 16GB / 512GB"
                    />
                    <TextField
                      label="Price (₹)" type="number" value={v.price}
                      onChange={(e) => updateVariant(idx, "price", e.target.value)}
                      onBlur={(e) => updateVariant(idx, "price", clampNum(e.target.value))}
                      size="small" sx={{ flex: 1, minWidth: 100 }} inputProps={{ min: 0 }}
                    />
                    <TextField
                      label="Stock" type="number" value={v.stock}
                      onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                      onBlur={(e) => updateVariant(idx, "stock", clampNum(e.target.value, { int: true }))}
                      size="small" sx={{ flex: 1, minWidth: 90 }} inputProps={{ min: 0 }}
                    />
                    <TextField
                      label="SKU" value={v.sku}
                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                      size="small" sx={{ flex: 1.5, minWidth: 120 }}
                    />
                    <Tooltip title="Remove variant">
                      <IconButton color="error" onClick={() => removeVariant(idx)} sx={{ mt: 0.25 }}>
                        <Icon icon="mdi:delete-outline" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              ))
            )}

            {/* Media & Tags */}
            <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>Media & Tags</Typography></Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URLs (one per line)"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                fullWidth size="small" multiline rows={3}
                helperText="Enter each image URL on a new line. Invalid/blank lines are ignored."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags (comma separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                fullWidth size="small"
                placeholder="e.g., laptop, gaming, ultrabook"
              />
            </Grid>

            {/* Visibility & Flags */}
            <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>Visibility & Flags</Typography></Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} />} label="Active (visible on store)" />
                <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />} label="Featured" />
                <FormControlLabel control={<Switch checked={form.trending} onChange={(e) => setField("trending", e.target.checked)} />} label="Trending" />
                <FormControlLabel control={<Switch checked={form.hot} onChange={(e) => setField("hot", e.target.checked)} />} label="Hot" />
                <FormControlLabel control={<Switch checked={form.special} onChange={(e) => setField("special", e.target.checked)} />} label="Special Product (badged collection)" />
              </Box>
            </Grid>

            {/* SEO */}
            <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>SEO (Optional)</Typography></Grid>
            <Grid item xs={12}>
              <TextField label="Meta Title" value={form.metaTitle} onChange={(e) => setField("metaTitle", e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Meta Description" value={form.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} fullWidth size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editingProduct ? "Save Changes" : "Create Product"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProducts;
