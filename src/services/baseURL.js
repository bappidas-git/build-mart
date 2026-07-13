// =============================================================================
// API Base URL Configuration
// =============================================================================
//
// TO SWITCH FROM JSON SERVER TO PRODUCTION LARAVEL API:
// ======================================================
//   1. In .env, set: REACT_APP_API_URL=https://your-laravel-api.com/api/v1
//   2. In .env, set: REACT_APP_USE_MOCK_API=false
//   3. Restart the dev server.
//
// That's it. No other code changes required.
// =============================================================================

// Development / Mock API URL (JSON Server).
//
// Port 4000, NOT 3001, and on purpose: Create React App's dev server wants 3000
// and, if that is taken by a stale dev server, silently drifts to the next free
// port (3001, 3002…). Were the mock API on 3001, that drift would put the React
// app on the API port and every /categories & /products call would return
// index.html instead of JSON — a silently-empty catalog. 4000 is outside that
// sequential drift range. Keep in sync with .env (REACT_APP_API_URL) and
// server.js (JSON_SERVER_PORT default).
export const MOCK_API_URL = "http://localhost:4000";

// Determine which URL to use
const getBaseURL = () => {
  if (process.env.REACT_APP_USE_MOCK_API === "true") {
    return MOCK_API_URL;
  }
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return MOCK_API_URL;
  }
  return process.env.REACT_APP_API_URL || MOCK_API_URL;
};

const BASE_URL = getBaseURL();

// Flag to detect mock API (JSON Server) mode
export const IS_MOCK_API =
  BASE_URL === MOCK_API_URL ||
  process.env.REACT_APP_USE_MOCK_API === "true";

export const API_VERSION = "v1";

if (process.env.NODE_ENV === "development") {
  console.log(`[API] Mode: ${IS_MOCK_API ? "JSON Server (Mock)" : "Production API"}`);
  console.log(`[API] Base URL: ${BASE_URL}`);
} else if (BASE_URL === MOCK_API_URL && !process.env.REACT_APP_API_URL) {
  // A production build with no REACT_APP_API_URL falls back to the local mock
  // server below — an address that only exists on a developer machine, so every
  // catalog request 404s/refuses for real visitors and the storefront renders
  // empty. Surface it loudly rather than shipping a silently-broken build.
  console.warn(
    `[API] No REACT_APP_API_URL is set, so this build points at ${MOCK_API_URL}. ` +
      "That address only exists on a developer machine — set REACT_APP_API_URL to " +
      "your live API (and rebuild) before deploying, or the catalog will be empty " +
      "for visitors."
  );
}

export default BASE_URL;
