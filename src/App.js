import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatePresence, MotionConfig } from "framer-motion";

// Context Providers
import { ThemeContextProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { AdminProvider } from "./context/AdminContext";
import { WishlistProvider } from "./context/WishlistContext";
import { DealsConfigProvider } from "./context/DealsConfigContext";

// Layout Components
import Header from "./components/Header/Header";
import BottomNav from "./components/BottomNav/BottomNav";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import AdminLayout from "./components/AdminLayout/AdminLayout";

// Storefront Pages
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import EnquiryList from "./pages/EnquiryList/EnquiryList";
import SubmitEnquiry from "./pages/Checkout/Checkout";
import EnquiryConfirmation from "./pages/OrderConfirmation/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory/OrderHistory";
import Profile from "./pages/Profile/Profile";
import HelpCenter from "./pages/HelpCenter/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy/CookiePolicy";
import RefundPolicy from "./pages/RefundPolicy/RefundPolicy";
import Contact from "./pages/Support/Support";
import AboutUs from "./pages/AboutUs/AboutUs";
import SpecialOffers from "./pages/SpecialOffers/SpecialOffers";
import Wishlist from "./pages/Wishlist/Wishlist";

// Admin Pages
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminCategories from "./pages/Admin/AdminCategories";
import AdminEnquiries from "./pages/Admin/AdminEnquiries";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminReviews from "./pages/Admin/AdminReviews";
import AdminLeads from "./pages/Admin/AdminLeads";
import AdminSettings from "./pages/Admin/AdminSettings";

import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import "./App.css";

// Redirect the legacy /order-confirmation/:orderNumber path to the canonical
// enquiry-confirmation URL, preserving the reference so bookmarks never 404.
function LegacyOrderConfirmationRedirect() {
  const { orderNumber } = useParams();
  return <Navigate to={`/enquiry-confirmation/${orderNumber}`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
    {/* reducedMotion="user" makes every framer-motion animation (drawers,
        bottom sheets, card springs) honour the OS "reduce motion" setting,
        complementing the CSS-token zeroing in storefront-tokens.css. */}
    <MotionConfig reducedMotion="user">
    <ThemeContextProvider>
      <AuthProvider>
        <AdminProvider>
          <WishlistProvider>
            <CartProvider>
              <OrderProvider>
                <Router>
                  <ScrollToTop />
                  <CssBaseline />
                  <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin">
                      <Route index element={<AdminLogin />} />
                      <Route element={<AdminLayout />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="enquiries" element={<AdminEnquiries />} />
                        {/* Old bookmarks: /admin/orders → /admin/enquiries */}
                        <Route path="orders" element={<Navigate to="/admin/enquiries" replace />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="leads" element={<AdminLeads />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>
                    </Route>

                    {/* Storefront Routes */}
                    <Route
                      path="/*"
                      element={
                        <DealsConfigProvider>
                        <div className="App">
                          <Header />
                          <main className="main-content">
                            <AnimatePresence mode="wait">
                              <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/products" element={<Products />} />
                                {/* Product detail resolves by human-readable slug;
                                    legacy numeric /products/:id still resolves and
                                    redirects to the canonical slug URL. */}
                                <Route path="/products/:slug" element={<ProductDetails />} />
                                <Route path="/enquiry-list" element={<EnquiryList />} />
                                <Route path="/checkout" element={<SubmitEnquiry />} />
                                <Route path="/enquiry-confirmation/:enquiryNumber" element={<EnquiryConfirmation />} />
                                {/* Legacy path kept alive so old bookmarks/links
                                    canonicalize to the enquiry-confirmation URL. */}
                                <Route path="/order-confirmation/:orderNumber" element={<LegacyOrderConfirmationRedirect />} />
                                <Route path="/orders" element={<OrderHistory />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/wishlist" element={<Wishlist />} />
                                <Route path="/special-offers" element={<SpecialOffers />} />
                                <Route path="/help" element={<HelpCenter />} />
                                <Route path="/support" element={<Contact />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/about" element={<AboutUs />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/cookies" element={<CookiePolicy />} />
                                <Route path="/refund" element={<RefundPolicy />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </AnimatePresence>
                          </main>
                          <Footer />
                          <BottomNav />
                        </div>
                        </DealsConfigProvider>
                      }
                    />
                  </Routes>
                </Router>
              </OrderProvider>
            </CartProvider>
          </WishlistProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeContextProvider>
    </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
