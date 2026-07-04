import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import {
  HomeOutlined,
  GridViewOutlined,
  Search as SearchIcon,
  RequestQuoteOutlined,
  PersonOutline,
} from "@mui/icons-material";
import SearchModal from "../SearchModal/SearchModal";
import SidebarMenu from "../SidebarMenu/SidebarMenu";
import styles from "./BottomNav.module.css";

// Enquiry-first mobile tab bar. Parity with the header:
//   • Categories  → opens the slide-in category drawer (SidebarMenu)
//   • Enquiry List → opens the enquiry-list drawer (CartDrawer, via shared
//     CartContext) with a live item count — never "Cart".
// No purchase/cart wording anywhere.
const NAV_ITEMS = [
  { key: "home", label: "Home", Icon: HomeOutlined },
  { key: "categories", label: "Categories", Icon: GridViewOutlined },
  { key: "search", label: "Search", Icon: SearchIcon },
  { key: "enquiry", label: "Enquiry List", Icon: RequestQuoteOutlined },
  { key: "account", label: "Account", Icon: PersonOutline },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  // Shared enquiry-list state — setIsCartOpen(true) opens the CartDrawer mounted
  // in the Header; getCartItemCount() is the enquiry-list item count.
  const { getCartItemCount, setIsCartOpen } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const enquiryCount = getCartItemCount();

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/products" || path.startsWith("/products/") || path === "/categories") return "categories";
    if (path === "/profile" || path === "/account") return "account";
    return "";
  };

  const activeKey = getActiveKey();

  const handleNavClick = (item) => {
    switch (item.key) {
      case "home":
        navigate("/");
        break;
      case "categories":
        // Parity with the header hamburger — open the category drawer.
        setSidebarOpen(true);
        break;
      case "search":
        setSearchOpen(true);
        break;
      case "enquiry":
        setIsCartOpen(true);
        break;
      case "account":
        // Guests can't view a profile — send them to the login modal instead
        // of the /profile route, which would just bounce them back home.
        if (isAuthenticated) {
          navigate("/profile");
        } else {
          openAuthModal("login");
        }
        break;
      default:
        break;
    }
  };

  const themeClass = isDarkMode ? styles.dark : styles.light;

  return (
    <>
      <nav
        className={`${styles.bottomNav} ${themeClass} ${
          visible ? styles.visible : styles.hidden
        }`}
      >
        <div className={styles.navItems}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.Icon;
            const showBadge = item.key === "enquiry" && enquiryCount > 0;
            return (
              <button
                key={item.key}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => handleNavClick(item)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={styles.iconWrap}>
                  <Icon className={styles.icon} />
                  {showBadge && (
                    <span className={styles.badge}>
                      {enquiryCount > 99 ? "99+" : enquiryCount}
                    </span>
                  )}
                </span>
                <span className={styles.label}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAuth={() => openAuthModal("login")}
      />
    </>
  );
};

export default BottomNav;
