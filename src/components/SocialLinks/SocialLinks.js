import React from "react";
import {
  Facebook,
  Instagram,
  X as XIcon,
  YouTube,
  WhatsApp,
} from "@mui/icons-material";
import { useSocialLinks } from "../../context/SettingsContext";
import styles from "./SocialLinks.module.css";

// Brand → MUI icon. Keys match the admin Settings → Social fields (and the
// db.json `settings.social` object). `X` is the modern Twitter/X glyph; the
// field is still labelled "Twitter / X" in admin for familiarity.
const ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: XIcon,
  youtube: YouTube,
  whatsapp: WhatsApp,
};

// Shared social-icon strip. Reads the admin-managed links from SettingsContext
// (via useSocialLinks) so a change in Settings → Social reaches every surface —
// today the footer and the hamburger menu. Renders nothing when the admin hasn't
// set any link, so no empty row is left behind.
//
// `variant` picks the palette: "footer" sits on the always-dark footer surface;
// "sidebar" inherits the drawer's light/dark theme tokens.
const SocialLinks = ({ variant = "footer", className = "", size = 20 }) => {
  const links = useSocialLinks();
  if (links.length === 0) return null;

  const variantClass = styles[variant] || "";

  return (
    <ul className={`${styles.list} ${variantClass} ${className}`.trim()}>
      {links.map(({ key, label, href }) => {
        const Icon = ICONS[key];
        if (!Icon) return null;
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label={label}
              title={label}
            >
              <Icon style={{ fontSize: size }} />
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SocialLinks;
