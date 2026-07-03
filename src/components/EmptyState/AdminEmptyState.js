import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

// =============================================================================
// AdminEmptyState — the shared MUI empty state for admin lists
// =============================================================================
// The admin twin of the storefront <EmptyState>: same idea (muted brand-tinted
// icon in a soft circle, a heading, an optional line and at most one action)
// but themed with MUI tokens so it inherits the admin palette (light + dark).
// Replaces the ad-hoc `<Typography color="text.secondary">No X found</Typography>`
// scattered across the admin tables.
//
// Render it INSIDE the table's empty row so the table structure is preserved:
//   <TableRow><TableCell colSpan={n} sx={{ py: 0 }}>
//     <AdminEmptyState icon="mdi:..." title="No enquiries yet" description="…" />
//   </TableCell></TableRow>
//
// Props:
//   icon         iconify id (default mdi:tray-remove)
//   title        string (required)
//   description  node (optional)
//   action       optional { label, onClick, icon? } — a single outlined button
//   minHeight    number|string — reserve vertical space (default 180)
// =============================================================================
const AdminEmptyState = ({
  icon = "mdi:tray-remove",
  title,
  description,
  action,
  minHeight = 180,
}) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 1,
      py: 5,
      px: 3,
      minHeight,
    }}
  >
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        mb: 0.5,
        color: "primary.main",
        bgcolor: (theme) =>
          alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.18 : 0.1
          ),
      }}
    >
      <Icon icon={icon} style={{ fontSize: 36 }} aria-hidden="true" />
    </Box>

    <Typography variant="subtitle1" fontWeight={600} color="text.primary">
      {title}
    </Typography>

    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {description}
      </Typography>
    )}

    {action && (
      <Button
        variant="outlined"
        size="small"
        onClick={action.onClick}
        startIcon={action.icon ? <Icon icon={action.icon} /> : undefined}
        sx={{ mt: 1 }}
      >
        {action.label}
      </Button>
    )}
  </Box>
);

export default AdminEmptyState;
