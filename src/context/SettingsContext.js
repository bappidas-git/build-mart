import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import apiService from "../services/api";
import { formatCurrency } from "../utils/helpers";
import {
  BRAND_ADDRESS,
  BRAND_PHONE_1,
  BRAND_PHONE_2,
  SUPPORT_EMAIL,
} from "../utils/constants";

// =============================================================================
// SettingsContext
// =============================================================================
// Single shared source for the admin-managed store settings on the storefront.
// The one field that MUST agree everywhere is the currency: the admin picks it
// on Settings → General (INR, USD, EUR, …) and every price on the storefront —
// product cards, the product page, variant tiles, the mobile add bar, the
// enquiry list/drawer and the enquiry confirmation — must render in it. Before
// this context each of those surfaces hardcoded "INR", so switching the store
// currency in admin had no effect on the site.
//
// Like the deals/category config, it refetches when the tab regains focus so a
// change the admin makes in one tab appears on the storefront tab without a hard
// reload.
//
// `formatPrice(amount)` is the convenience helper every price surface should use
// — it is `formatCurrency` pre-bound to the store currency, so callers never
// need to know (or hardcode) the active currency again.
// =============================================================================

const DEFAULT_CURRENCY = "INR";
const DEFAULT_SYMBOL = "₹";

// Contact fallbacks — the brand details, used only while settings are loading or
// if the fetch fails, so no contact surface ever renders blank.
const DEFAULT_PHONE = BRAND_PHONE_1;
const DEFAULT_PHONE_SECONDARY = BRAND_PHONE_2;
const DEFAULT_ADDRESS = BRAND_ADDRESS;
const DEFAULT_EMAIL = SUPPORT_EMAIL;

// Strip everything except digits and a leading "+" so a formatted number like
// "+91 86385 43526" becomes a dialable tel: target. Single definition so every
// contact surface (header, footer, home, about, support, checkout, enquiry
// confirmation) builds the same href instead of redefining this locally.
export const telHref = (phone) =>
  `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

// Order the social icons render in, with the human label used for accessibility.
// Keys mirror the admin Settings → Social fields and db.json `settings.social`.
const SOCIAL_LINKS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "Twitter / X" },
  { key: "youtube", label: "YouTube" },
  { key: "whatsapp", label: "WhatsApp" },
];

// Turn a raw admin value into a safe, absolute href. Most fields are already
// full URLs; we only need to (a) make a scheme-less entry absolute so a bare
// "facebook.com/…" never resolves as an in-app route, and (b) accept a plain
// phone number for WhatsApp and turn it into a wa.me link — the WhatsApp field's
// placeholder is a phone number, so admins may type one there.
const normalizeSocialHref = (key, raw) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (key === "whatsapp") {
    const digits = value.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }
  return `https://${value.replace(/^\/+/, "")}`;
};

const SettingsContext = createContext({
  store: {},
  social: {},
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_SYMBOL,
  formatPrice: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
  loading: true,
  refresh: () => {},
});

export const useSettings = () => useContext(SettingsContext);

// Focused hook for the common case: components that only need to render a price.
export const useCurrency = () => {
  const { currency, currencySymbol, formatPrice } = useContext(SettingsContext);
  return { currency, currencySymbol, formatPrice };
};

// Focused hook for the store's contact details — the phone number(s) and address
// the admin edits on Settings → General. Every storefront contact surface (the
// header top bar, footer, the home & about contact strips, the support page, the
// checkout "call us" line and the enquiry confirmation) must render these so a
// change in admin reaches the site; before this they each hardcoded the brand's
// phone/address. Values fall back to the brand constants while settings load.
// `phones` is the de-duplicated list of present numbers, ready to `.map` over.
export const useStoreContact = () => {
  const { store } = useContext(SettingsContext);
  const phone = store.phone || DEFAULT_PHONE;
  const phoneSecondary = store.phoneSecondary || DEFAULT_PHONE_SECONDARY;
  const address = store.address || DEFAULT_ADDRESS;
  const email = store.email || DEFAULT_EMAIL;
  const phones = [phone, phoneSecondary].filter(
    (p, i, all) => p && all.indexOf(p) === i
  );
  return { phone, phoneSecondary, phones, address, email, telHref };
};

// Focused hook for the store's social profiles — the links the admin enters on
// Settings → Social. Returns only the platforms that actually have a link set
// AND are switched on (each field has a show/hide toggle in admin, stored as
// `settings.social.<key>Enabled`), each as `{ key, label, href }` ready to
// render, so the footer and the hamburger menu show the same icons and an unset
// or hidden profile simply doesn't appear. A missing flag counts as visible so
// links saved before the toggles existed keep showing.
export const useSocialLinks = () => {
  const { social } = useContext(SettingsContext);
  return SOCIAL_LINKS.filter(({ key }) => social[`${key}Enabled`] !== false)
    .map(({ key, label }) => ({
      key,
      label,
      href: normalizeSocialHref(key, social[key]),
    }))
    .filter((item) => item.href);
};

export const SettingsProvider = ({ children }) => {
  const [store, setStore] = useState({});
  const [social, setSocial] = useState({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const settings = await apiService.settings.get();
      if (mountedRef.current) {
        setStore(settings?.store || {});
        setSocial(settings?.social || {});
      }
    } catch (error) {
      console.error("Failed to load store settings:", error);
      // Leave the last-known (or default) store in place rather than breaking
      // every price on the page.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const currency = store.currency || DEFAULT_CURRENCY;
  const currencySymbol = store.currencySymbol || DEFAULT_SYMBOL;
  const formatPrice = useCallback(
    (amount) => formatCurrency(amount, currency),
    [currency]
  );

  const value = {
    store,
    social,
    currency,
    currencySymbol,
    formatPrice,
    loading,
    refresh: load,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
