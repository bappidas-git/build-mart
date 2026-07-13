import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../context/WishlistContext";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import { categoryParam, getMainMenuCategories } from "../../utils/categories";
import { LOGO_URL, LOGO_ICON_URL, SUPPORT_PHONE } from "../../utils/constants";
import CartDrawer from "../CartDrawer/CartDrawer";
import SidebarMenu from "../SidebarMenu/SidebarMenu";
import AuthModal from "../AuthModal/AuthModal";
import SearchModal from "../SearchModal/SearchModal";
import {
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  FavoriteBorder,
  Search as SearchIcon,
  Phone as PhoneIcon,
  KeyboardArrowDown,
  Person,
  ListAlt,
  Favorite,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd,
  LocalOfferOutlined,
  RequestQuoteOutlined,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import styles from "./Header.module.css";

// Gold count badges (brand accent, used sparingly). Applied to the enquiry-list
// and wishlist counters via MUI's Badge slot.
const badgeSx = {
  "& .MuiBadge-badge": {
    backgroundColor: "var(--sf-color-secondary)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.65rem",
  },
};

const Header = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    user,
    isAuthenticated,
    logout,
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  } = useAuth();
  // getCartItemCount is the enquiry-list item count (localStorage key "cart");
  // isCartOpen/setIsCartOpen drive the enquiry-list drawer (CartDrawer). Only the
  // header's icon/label/semantics change to "Enquiry List" — the data is untouched.
  const { getCartItemCount, isCartOpen, setIsCartOpen } = useCart();
  const { getWishlistCount } = useWishlist();
  // The "Special Products" entry is hidden when the admin turns that page off.
  const { enabled: dealsEnabled } = useDealsConfig();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(max-width:1024px)");

  // Live badge counts (context exposes getters, not raw values)
  const enquiryCount = getCartItemCount();
  const wishlistCount = getWishlistCount();

  const [categories, setCategories] = useState([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fetch categories on mount. Also refetch when the tab regains focus so any
  // change the admin makes (toggling a category into the main menu, reordering
  // it, activating/deactivating it) shows up on the storefront without a hard
  // reload — the menu is fully API-driven from the same categories source the
  // admin edits, and flows through extractData() so it works on JSON Server and
  // Laravel alike.
  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const data = await apiService.categories.getAll();
        if (active) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
    // Refetch when the tab regains focus/visibility or connectivity returns. This
    // both (a) reflects admin category edits without a hard reload and (b) lets
    // the menu recover on its own if the very first load failed because the API
    // wasn't reachable yet — the recurring "empty main menu" symptom. Applies on
    // every breakpoint (the nav bar renders on desktop, tablet and mobile).
    const refetch = () => fetchCategories();
    const onVisibility = () => {
      if (!document.hidden) fetchCategories();
    };
    window.addEventListener("focus", refetch);
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.removeEventListener("focus", refetch);
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Elevate the header with a soft shadow once the page is scrolled a little.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleUserMenuOpen = (e) => {
    if (isAuthenticated) {
      setUserMenuAnchor(e.currentTarget);
    } else {
      openAuthModal("login");
    }
  };

  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleMenuNavigate = (path) => {
    handleUserMenuClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate("/");
  };

  const handleEnquiryClick = () => setIsCartOpen(true);
  const handleSearchClick = () => setSearchModalOpen(true);
  // Opens the slide-in category drawer (SidebarMenu). A single trigger is shown
  // per breakpoint — the mobile header hamburger, or the desktop/tablet
  // "All Categories" nav button — so the menu is never duplicated on screen.
  const handleMenuButtonClick = () => setSidebarOpen(true);

  // Top nav = the admin-curated set (categories flagged "Show in main menu",
  // ordered by their menu order). No hardcoded list — the admin decides which
  // categories appear and in what order. The bar scrolls horizontally when there
  // are more than fit (see CSS), so it renders on EVERY breakpoint — desktop,
  // tablet and mobile — otherwise the admin's Main-Menu toggle would silently do
  // nothing on phones. The full catalogue still lives in the hamburger drawer.
  const menuCategories = getMainMenuCategories(categories);

  const telHref = `tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        {/* ===== TOP BAR (desktop only; tablet/mobile hide it) ===== */}
        {!isTablet && (
          <div className={styles.topBar}>
            <div className={styles.topBarInner}>
              <div className={styles.topBarLeft}>
                Deals in all kinds of building materials for interior &amp; exterior use.
              </div>
              <div className={styles.topBarRight}>
                <a href={telHref} className={styles.topBarLink}>
                  <PhoneIcon className={styles.topBarIcon} />
                  <span>{SUPPORT_PHONE}</span>
                </a>
                <span className={styles.topBarDivider}>|</span>
                <Link to="/support" className={styles.topBarLink}>Help</Link>
                <span className={styles.topBarDivider}>|</span>
                <Link to="/orders" className={styles.topBarLink}>My Enquiries</Link>
                <span className={styles.topBarDivider}>|</span>
                <IconButton
                  size="small"
                  onClick={toggleTheme}
                  className={styles.themeToggleBtn}
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                </IconButton>
              </div>
            </div>
          </div>
        )}

        {/* ===== MAIN HEADER ROW ===== */}
        <div className={styles.mainHeader}>
          <div className={styles.mainHeaderInner}>
            {/* Hamburger — mobile only. It is the category-drawer entry on
                phones, where the nav bar is a compact chip strip with no
                "All Categories" button. On desktop/tablet that labelled nav
                button is the single menu trigger, so an icon here would only
                duplicate it (two stacked menus). */}
            {isMobile && (
              <IconButton
                onClick={handleMenuButtonClick}
                className={styles.hamburger}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo — full wordmark on desktop/tablet, compact icon on mobile.
                The main logo is designed to read on both light and dark headers. */}
            <Link to="/" className={styles.logoLink} aria-label="North East Build Mart">
              <motion.div
                className={styles.logo}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isMobile ? (
                  <img
                    src={LOGO_ICON_URL}
                    alt="North East Build Mart"
                    className={styles.logoIconImg}
                    width={30}
                    height={30}
                  />
                ) : (
                  <img
                    src={LOGO_URL}
                    alt="North East Build Mart"
                    className={styles.logoImg}
                    width={64}
                    height={40}
                  />
                )}
              </motion.div>
            </Link>

            {/* Search entry (desktop/tablet) — opens SearchModal */}
            {!isMobile && (
              <button
                type="button"
                className={styles.searchBar}
                onClick={handleSearchClick}
                aria-label="Search"
              >
                <SearchIcon className={styles.searchIcon} />
                <span className={styles.searchPlaceholder}>
                  Search building materials, brands, categories…
                </span>
              </button>
            )}

            {/* Right actions */}
            <div className={styles.actions}>
              {/* Search icon (mobile) */}
              {isMobile && (
                <IconButton
                  onClick={handleSearchClick}
                  className={styles.actionIcon}
                  aria-label="Search"
                >
                  <SearchIcon />
                </IconButton>
              )}

              {/* Theme toggle (tablet only — keeps it reachable now the top bar is hidden) */}
              {isTablet && !isMobile && (
                <IconButton
                  onClick={toggleTheme}
                  className={styles.actionIcon}
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              )}

              {/* Account (desktop + tablet; on mobile it lives in the bottom nav) */}
              {!isMobile && (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={styles.actionItem}
                >
                  <IconButton
                    onClick={handleUserMenuOpen}
                    className={styles.actionIcon}
                    aria-label="Account"
                  >
                    {isAuthenticated && user ? (
                      <Avatar className={styles.avatar} sx={{ width: 32, height: 32 }}>
                        {(user.firstName || user.name || "U").charAt(0).toUpperCase()}
                      </Avatar>
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                  {!isTablet && (
                    <div className={styles.actionLabel} onClick={handleUserMenuOpen}>
                      <span className={styles.actionLabelSmall}>
                        {isAuthenticated ? `Hello, ${user?.firstName || "User"}` : "Hello, Sign in"}
                      </span>
                      <span className={styles.actionLabelMain}>
                        Account
                        <KeyboardArrowDown fontSize="inherit" />
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Wishlist (desktop + tablet) */}
              {!isMobile && (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={styles.actionItem}
                >
                  <IconButton
                    onClick={() => navigate("/wishlist")}
                    className={styles.actionIcon}
                    aria-label="Wishlist"
                  >
                    <Badge badgeContent={wishlistCount} max={99} sx={badgeSx}>
                      <FavoriteBorder />
                    </Badge>
                  </IconButton>
                  {!isTablet && (
                    <div className={styles.actionLabel} onClick={() => navigate("/wishlist")}>
                      <span className={styles.actionLabelSmall}>Your</span>
                      <span className={styles.actionLabelMain}>Wishlist</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Enquiry List (replaces Cart) — opens the enquiry-list drawer */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={styles.actionItem}
              >
                <IconButton
                  onClick={handleEnquiryClick}
                  className={styles.actionIcon}
                  aria-label="Enquiry List"
                >
                  <Badge badgeContent={enquiryCount} max={99} sx={badgeSx}>
                    <RequestQuoteOutlined />
                  </Badge>
                </IconButton>
                {!isTablet && (
                  <div className={styles.actionLabel} onClick={handleEnquiryClick}>
                    <span className={styles.actionLabelSmall}>Your</span>
                    <span className={styles.actionLabelMain}>Enquiry List</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ===== NAVIGATION BAR (all breakpoints) =====
            Renders on desktop, tablet AND mobile so the admin-curated main menu
            is honoured everywhere. On mobile it collapses to just the scrollable
            category strip — the "All Categories" entry and Special Products link
            are already reachable via the hamburger drawer and the bottom nav, so
            they'd only crowd the narrow bar. The strip is hidden on mobile only
            when nothing is curated, to avoid an empty row. */}
        {(!isMobile || menuCategories.length > 0) && (
          <nav
            className={`${styles.navBar} ${isMobile ? styles.navBarMobile : ""}`}
          >
            <div className={styles.navBarInner}>
              {/* All Categories — opens the same slide-in drawer as the hamburger
                  (desktop/tablet only; mobile uses the hamburger / bottom nav) */}
              {!isMobile && (
                <>
                  <button
                    type="button"
                    className={styles.allCategoriesBtn}
                    onClick={handleMenuButtonClick}
                    aria-label="All categories"
                  >
                    <MenuIcon fontSize="small" />
                    <span>All Categories</span>
                  </button>

                  <span className={styles.navDivider} aria-hidden="true" />
                </>
              )}

              {/* Category links (admin-curated main menu) */}
              <div className={styles.navLinks}>
                {menuCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${categoryParam(cat)}`}
                    className={styles.navLink}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {/* Special Products — desktop/tablet only, hidden when the admin
                  disables that page */}
              {!isMobile && dealsEnabled && (
                <Link to="/special-offers" className={styles.specialLink}>
                  <LocalOfferOutlined fontSize="small" />
                  <span>Special Products</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Spacer to push content below the fixed header.
          Desktop = topBar(36)+main(64)+nav(40); tablet = main(64)+nav(40);
          mobile = main(56) + nav(44) when a curated menu exists, else main(56). */}
      <div
        className={styles.headerSpacer}
        style={{
          height: isMobile
            ? menuCategories.length > 0
              ? 100
              : 60
            : isTablet
            ? 104
            : 140,
        }}
      />

      {/* ===== USER DROPDOWN MENU ===== */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        className={styles.userMenu}
        PaperProps={{ className: styles.userMenuPaper, elevation: 8 }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isAuthenticated ? (
          [
            <div key="greeting" className={styles.menuGreeting}>
              <Avatar className={styles.menuAvatar} sx={{ width: 40, height: 40 }}>
                {(user?.firstName || user?.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Typography variant="subtitle2" className={styles.menuUserName}>
                  {user?.firstName || user?.name || "User"}
                </Typography>
                <Typography variant="caption" className={styles.menuUserEmail}>
                  {user?.email || ""}
                </Typography>
              </div>
            </div>,
            <Divider key="div1" />,
            <MenuItem key="profile" onClick={() => handleMenuNavigate("/profile")} className={styles.menuItem}>
              <Person fontSize="small" className={styles.menuItemIcon} />
              My Profile
            </MenuItem>,
            <MenuItem key="enquiries" onClick={() => handleMenuNavigate("/orders")} className={styles.menuItem}>
              <ListAlt fontSize="small" className={styles.menuItemIcon} />
              My Enquiries
            </MenuItem>,
            <MenuItem key="wishlist" onClick={() => handleMenuNavigate("/wishlist")} className={styles.menuItem}>
              <Favorite fontSize="small" className={styles.menuItemIcon} />
              My Wishlist
            </MenuItem>,
            <Divider key="div2" />,
            <MenuItem key="logout" onClick={handleLogout} className={`${styles.menuItem} ${styles.logoutItem}`}>
              <LogoutIcon fontSize="small" className={styles.menuItemIcon} />
              Logout
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="login" onClick={() => { handleUserMenuClose(); openAuthModal("login"); }} className={styles.menuItem}>
              <LoginIcon fontSize="small" className={styles.menuItemIcon} />
              Login
            </MenuItem>,
            <MenuItem key="register" onClick={() => { handleUserMenuClose(); openAuthModal("signup"); }} className={styles.menuItem}>
              <PersonAdd fontSize="small" className={styles.menuItemIcon} />
              Register
            </MenuItem>,
          ]
        )}
      </Menu>

      {/* ===== MODALS & DRAWERS ===== */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAuth={() => openAuthModal("login")}
      />
      <AuthModal open={authModalOpen} onClose={closeAuthModal} defaultTab={authModalTab} />
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};

export default Header;
