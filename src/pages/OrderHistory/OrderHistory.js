import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../services/api";
import { formatDate, PLACEHOLDER_IMG, onImageError } from "../../utils/helpers";
import PriceBlock from "../../components/storefront/PriceBlock";
import styles from "./OrderHistory.module.css";

// NEBM customers submit ENQUIRIES — they never pay or buy — so this page is a
// lightweight, CRM-style view of the enquiries a customer has sent, with a
// status chip (New → … → Lost) and an item breakdown. It carries NO money,
// tracking, payment, shipping or cancellation affordances.

// Canonical enquiry statuses (the admin sets these; see prompt 28). Each maps to
// a colour-coded chip class defined in the stylesheet.
const ENQUIRY_STATUS = {
  New: { label: "New", className: "statusNew" },
  Contacted: { label: "Contacted", className: "statusContacted" },
  "In Discussion": { label: "In Discussion", className: "statusDiscussion" },
  "Quotation Sent": { label: "Quotation Sent", className: "statusQuotation" },
  Converted: { label: "Converted", className: "statusConverted" },
  Closed: { label: "Closed", className: "statusClosed" },
  Lost: { label: "Lost", className: "statusLost" },
};

const FILTER_OPTIONS = [
  "All",
  "New",
  "In Discussion",
  "Quotation Sent",
  "Converted",
  "Closed",
];
const ENQUIRIES_PER_PAGE = 5;

// Resolve the chip for an enquiry status, tolerating any unknown/legacy value
// by falling back to a neutral "New"-style chip rather than crashing.
const getStatusInfo = (status) =>
  ENQUIRY_STATUS[status] || { label: status || "New", className: "statusNew" };

const MyEnquiries = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (authLoading) return; // session restore in progress — keep the loader up
    if (isAuthenticated) {
      fetchEnquiries();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const fetchEnquiries = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const response = await apiService.orders.getByUserId(user?.id);
      const data = Array.isArray(response)
        ? response
        : response?.data || response?.enquiries || [];
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setEnquiries(sorted);
    } catch (err) {
      // Keep "No enquiries yet" honest: a failed fetch renders the error state,
      // never the empty state.
      console.error("Failed to fetch enquiries:", err);
      setEnquiries([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesFilter =
      activeFilter === "All" || enquiry.status === activeFilter;
    const matchesSearch =
      !searchQuery ||
      (enquiry.enquiryNumber || enquiry.id || "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEnquiries.length / ENQUIRIES_PER_PAGE);
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * ENQUIRIES_PER_PAGE,
    currentPage * ENQUIRIES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Keep the page in range when the result set shrinks (e.g. after a refresh).
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Not authenticated - show login prompt (only once the session restore has
  // settled, so a reload while logged in doesn't flash this screen)
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <motion.div
            className={styles.loginPrompt}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.loginIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h2 className={styles.loginTitle}>Sign In Required</h2>
            <p className={styles.loginSubtext}>
              Sign in to view your enquiries. Your enquiries are linked to your account.
            </p>
            <div className={styles.loginActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => openAuthModal("login")}
              >
                Log In
              </button>
              <Link to="/" className={styles.linkSecondary}>
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* Page Header */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>My Enquiries</h1>
            {!loading && !fetchError && (
              <span className={styles.orderCount}>
                {filteredEnquiries.length} enquir{filteredEnquiries.length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>
          <button className={styles.btnRefresh} onClick={fetchEnquiries} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? styles.spinning : ""}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          className={styles.filterBar}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by enquiry reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div className={styles.filterTabs}>
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                className={`${styles.filterTab} ${activeFilter === filter ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading your enquiries...</p>
          </div>
        )}

        {/* Error State — fetch failed; never masquerade as "No enquiries yet" */}
        {!loading && fetchError && (
          <motion.div
            className={styles.errorState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>Couldn't Load Your Enquiries</h3>
            <p className={styles.emptySubtext}>
              Something went wrong while fetching your enquiries. Please check your
              connection and try again.
            </p>
            <button className={styles.btnPrimary} onClick={fetchEnquiries}>
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !fetchError && filteredEnquiries.length === 0 && enquiries.length === 0 && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.emptyIcon}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6a2 2 0 012 2v0h1a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1v0a2 2 0 012-2z" />
                <path d="M9 2a2 2 0 00-2 2h10a2 2 0 00-2-2H9z" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="13" y2="15" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No enquiries yet</h3>
            <p className={styles.emptySubtext}>
              Browse our building materials and send us an enquiry.
            </p>
            <button className={styles.btnPrimary} onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </motion.div>
        )}

        {/* No filter results */}
        {!loading && !fetchError && filteredEnquiries.length === 0 && enquiries.length > 0 && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className={styles.emptyTitle}>No matching enquiries</h3>
            <p className={styles.emptySubtext}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              className={styles.btnSecondary}
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("All");
              }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Enquiries List */}
        {!loading && paginatedEnquiries.length > 0 && (
          <div className={styles.ordersList}>
            <AnimatePresence>
              {paginatedEnquiries.map((enquiry, index) => {
                const statusInfo = getStatusInfo(enquiry.status);
                const items = enquiry.items || [];
                const visibleItems = items.slice(0, 3);
                const remainingCount = items.length - 3;
                const reference = enquiry.enquiryNumber || `#${enquiry.id}`;
                const isExpanded = expandedId === (enquiry.id || enquiry.enquiryNumber);
                const history = Array.isArray(enquiry.statusHistory)
                  ? enquiry.statusHistory
                  : [];

                return (
                  <motion.div
                    key={enquiry.id || enquiry.enquiryNumber}
                    className={styles.orderCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Enquiry Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderLeft}>
                        <div className={styles.orderNumberRow}>
                          <span className={styles.orderNumber}>{reference}</span>
                          <button
                            className={styles.btnCopy}
                            onClick={() => handleCopy(reference)}
                            title="Copy enquiry reference"
                          >
                            {copiedId === reference ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <span className={styles.orderDate}>
                          Submitted {formatDate(enquiry.createdAt)}
                        </span>
                      </div>
                      <div className={styles.cardHeaderRight}>
                        <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Product Thumbnails + item count */}
                    <div className={styles.cardBody}>
                      <div className={styles.thumbnailRow}>
                        {visibleItems.map((item, i) => (
                          <div key={i} className={styles.thumbnail}>
                            <img
                              src={item.image || PLACEHOLDER_IMG}
                              alt={item.name || "Product"}
                              onError={onImageError}
                            />
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className={styles.thumbnailMore}>
                            +{remainingCount} more
                          </div>
                        )}
                        <div className={styles.itemsSummary}>
                          <span className={styles.itemsSummaryLabel}>Products</span>
                          <span className={styles.itemsSummaryValue}>
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.cardActions}>
                      <button
                        className={styles.btnOutline}
                        onClick={() =>
                          setExpandedId(
                            isExpanded ? null : enquiry.id || enquiry.enquiryNumber
                          )
                        }
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className={styles.expandedSection}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className={styles.expandedInner}>
                            {/* Full Items List */}
                            <div className={styles.detailBlock}>
                              <h4 className={styles.detailBlockTitle}>Products Enquired</h4>
                              <div className={styles.detailItemsList}>
                                {items.map((item, i) => (
                                  <div key={i} className={styles.detailItem}>
                                    <div className={styles.detailItemImg}>
                                      <img
                                        src={item.image || PLACEHOLDER_IMG}
                                        alt={item.name || "Product"}
                                        onError={onImageError}
                                      />
                                    </div>
                                    <div className={styles.detailItemInfo}>
                                      <span className={styles.detailItemName}>{item.name}</span>
                                      {item.variantName && (
                                        <span className={styles.detailItemVariant}>{item.variantName}</span>
                                      )}
                                      <span className={styles.detailItemQty}>Qty: {item.quantity}</span>
                                    </div>
                                    <div className={styles.detailItemPrice}>
                                      {/* Price-mode via the shared PriceBlock: exact ₹ / unit
                                          when a figure exists, else a calm "Price on Enquiry". */}
                                      <PriceBlock
                                        product={item}
                                        price={item.price}
                                        currency={item.currency || "INR"}
                                        mode="card"
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Your Note */}
                            {enquiry.notes && enquiry.notes.trim() && (
                              <div className={styles.detailBlock}>
                                <h4 className={styles.detailBlockTitle}>Your Note</h4>
                                <div className={styles.detailContent}>
                                  <p className={styles.enquiryNote}>{enquiry.notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Status + timeline */}
                            <div className={styles.detailBlock}>
                              <h4 className={styles.detailBlockTitle}>Status</h4>
                              <div className={styles.detailContent}>
                                <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                                  {statusInfo.label}
                                </span>
                                {history.length > 0 && (
                                  <ul className={styles.timeline}>
                                    {history.map((h, i) => (
                                      <li key={i} className={styles.timelineItem}>
                                        <span className={styles.timelineDot} aria-hidden="true" />
                                        <div className={styles.timelineBody}>
                                          <span className={styles.timelineAction}>{h.action}</span>
                                          <span className={styles.timelineMeta}>
                                            {h.by ? `${h.by} · ` : ""}
                                            {formatDate(h.at, "datetime")}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnquiries;
