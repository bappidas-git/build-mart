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

const SettingsContext = createContext({
  store: {},
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

export const SettingsProvider = ({ children }) => {
  const [store, setStore] = useState({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const settings = await apiService.settings.get();
      if (mountedRef.current) setStore(settings?.store || {});
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
