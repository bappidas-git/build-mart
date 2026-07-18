// =============================================================================
// Development mock backend — JSON Server with a SAFE, non-cascading DELETE
// =============================================================================
//
// This replaces the bare `json-server --watch db.json --port 4000` command.
// Everything json-server normally does (GET/POST/PUT/PATCH, filtering, sorting,
// pagination, relationships, /db, static ./public) is preserved — only the
// DELETE handler is made safe.
//
// WHY THIS EXISTS
// ---------------
// json-server's stock DELETE handler (lib/server/router/plural.js -> destroy)
// runs, in order:
//   1. db.get(name).removeById(id)            // drops the row from MEMORY
//   2. db._.getRemovable(db.getState(), opts) // "dependent" cascade scan
// Step 2 walks EVERY foreign-key field (anything ending in `Id`) across the
// WHOLE database and calls lodash-id.getById(value), which executes
// `value.toString()`. Seed/generated rows legitimately carry NULL foreign keys
// (e.g. refunds.returnId, refunds.paymentId, reviews.userId,
// walletTransactions.refundId), so `null.toString()` throws:
//     TypeError: Cannot read properties of null (reading 'toString')
// -> the DELETE returns HTTP 500.
//
// Worse, because step 1 already removed the row from memory but the thrown
// error short-circuits before json-server's write middleware runs, the
// in-memory store and db.json DESYNC: the row is gone from memory yet still on
// disk. The very next GET/PUT/PATCH for that id then returns HTTP 404. That is
// exactly the "delete -> 500, then edit -> 404" pair seen in the admin
// Categories module (and it affected deletes everywhere, not just categories).
//
// We also never want deleting a category to silently cascade-delete the
// products that reference it — referential integrity is enforced in the API
// layer (block the delete while children/products still point at the category).
//
// FIX
// ---
//   * Override DELETE /:resource/:id with a handler that removes ONLY the
//     addressed row (id matched type-tolerantly by lodash-id) and persists,
//     with no cross-collection cascade.
//   * As defense-in-depth, neutralise getRemovable() so no code path can ever
//     hit the null.toString() crash again.
// =============================================================================

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jsonServer = require("json-server");

const DB_FILE = process.env.JSON_SERVER_DB
  ? path.resolve(process.env.JSON_SERVER_DB)
  : path.join(__dirname, "db.json");
// Default port is 4000, NOT 3001. Create React App's dev server wants 3000 and,
// when that is taken by a stale dev server, silently drifts to the next free
// port (3001, 3002…). If the mock API sat on 3001 that drift could put the React
// app ON the API port — every /categories & /products request would then return
// index.html instead of JSON and the storefront would render a silently-empty
// catalog. 4000 is outside that sequential drift range. Keep in sync with .env
// (REACT_APP_API_URL) and src/services/baseURL.js (MOCK_API_URL).
const PORT = process.env.JSON_SERVER_PORT || 4000;

const server = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const middlewares = jsonServer.defaults();

// lowdb instance with json-server's lodash-id + helper mixins attached.
const db = router.db;

server.use(middlewares);

// --- Defense in depth: disable json-server's dependent-delete cascade --------
// getRemovable() is the function that crashes on null foreign keys (and would
// otherwise silently delete dependent rows). Our explicit DELETE route below
// fully supersedes it for known collections; this no-op also covers any
// fall-through path (e.g. a DELETE on an unknown collection) so the crash can
// never recur.
if (db && db._ && typeof db._.mixin === "function") {
  db._.mixin({ getRemovable: () => [] }, { chain: false });
}

// --- Career module: secure resume upload -------------------------------------
// POST /careers/uploads accepts a JSON body { fileName, mimeType, size, data }
// (data = base64) and writes the file to ./public/uploads/resumes under a
// crypto-random name. json-server's static middleware (jsonServer.defaults())
// already serves ./public, so the stored file is immediately downloadable at
// the returned URL. Validation is defense-in-depth and server-side:
//   * extension allow-list (.pdf/.doc/.docx) — the ONLY extensions written
//   * decoded size cap (10 MB) enforced on the actual bytes, not the client
//   * magic-byte sniff: %PDF (pdf), D0 CF 11 E0 (doc), PK\x03\x04 (docx) — a
//     renamed .exe or script never passes
//   * stored name is `${uuid}${ext}` — the client-supplied name is used for
//     display only and never touches the filesystem path (no traversal)
// The handler reads the request body manually (chunk accumulation with a hard
// cap) so it needs no body-parser and cannot be affected by parser limits.
const UPLOAD_DIR = path.join(__dirname, "public", "uploads", "resumes");
const RESUME_MAX_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const RESUME_BODY_CAP = 15 * 1024 * 1024; // base64 inflation headroom
const RESUME_TYPES = {
  ".pdf": { mimes: ["application/pdf"], magic: (b) => b.slice(0, 4).toString() === "%PDF" },
  ".doc": {
    mimes: ["application/msword"],
    magic: (b) => b.length > 4 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  },
  ".docx": {
    mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    magic: (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  },
};

server.post("/careers/uploads", (req, res) => {
  const chunks = [];
  let received = 0;
  let aborted = false;

  req.on("data", (chunk) => {
    if (aborted) return;
    received += chunk.length;
    if (received > RESUME_BODY_CAP) {
      aborted = true;
      res.status(413).jsonp({ message: "File is too large. Resumes must be 10 MB or smaller." });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (aborted) return;
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const originalName = String(body.fileName || "resume");
      const ext = path.extname(originalName).toLowerCase();
      const spec = RESUME_TYPES[ext];
      if (!spec) {
        return res.status(422).jsonp({ message: "Unsupported file type. Upload a PDF, DOC or DOCX resume." });
      }
      const buffer = Buffer.from(String(body.data || ""), "base64");
      if (!buffer.length) {
        return res.status(422).jsonp({ message: "The uploaded file is empty." });
      }
      if (buffer.length > RESUME_MAX_BYTES) {
        return res.status(413).jsonp({ message: "File is too large. Resumes must be 10 MB or smaller." });
      }
      if (!spec.magic(buffer)) {
        return res.status(422).jsonp({
          message: "The file's contents don't match its type. Upload a genuine PDF, DOC or DOCX.",
        });
      }
      // Virus-scan hook: plug a scanner (ClamAV etc.) in here before the write
      // when moving beyond the mock backend. Signature kept synchronous-simple.
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const storedName = `${crypto.randomUUID()}${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buffer);
      return res.status(201).jsonp({
        url: `/uploads/resumes/${storedName}`,
        fileName: storedName,
        originalName,
        size: buffer.length,
        type: spec.mimes[0],
      });
    } catch (err) {
      return res.status(400).jsonp({ message: "Upload failed — the request body could not be read." });
    }
  });

  req.on("error", () => {
    aborted = true;
  });
});

// --- Safe, non-cascading DELETE /:resource/:id -------------------------------
// Mirrors json-server's own primitives (db.get(name).removeById(id)) but
// WITHOUT the whole-database getRemovable scan, and writes through to db.json
// so memory and disk stay in sync. Unknown collections fall through to
// json-server (which will 404 them).
server.delete("/:resource/:id", (req, res, next) => {
  try {
    const { resource, id } = req.params;

    // Only handle real top-level collections; let json-server deal with the rest.
    if (!Array.isArray(db.get(resource).value())) return next();

    // lodash-id getById/removeById compare ids as strings, so this matches
    // whether the stored id is a number (16) or a string ("16").
    const existing = db.get(resource).getById(id).value();
    if (!existing) return res.status(404).jsonp({});

    db.get(resource).removeById(id).value();
    db.write(); // persist to db.json (synchronous FileSync adapter)

    return res.status(200).jsonp({});
  } catch (err) {
    return next(err);
  }
});

// All other routes keep json-server's default behaviour.
server.use(router);

server
  .listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  JSON Server (safe-delete) is running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`  Database: ${DB_FILE}\n`);
  })
  .on("error", (err) => {
    // The mock API port is already taken. The overwhelmingly common cause is a
    // JSON Server left running from a previous session — which is HARMLESS: that
    // process is still serving /products & /categories, so the storefront's
    // catalog keeps working. Exit cleanly (0) with a clear note instead of
    // crashing with a stack trace, so `npm start` (which runs this alongside the
    // React dev server via concurrently) isn't torn down by a benign collision.
    // If something OTHER than JSON Server holds the port, extractList() in
    // src/services/api.js still logs a loud, actionable diagnostic on the client.
    if (err.code === "EADDRINUSE") {
      // eslint-disable-next-line no-console
      console.warn(
        `\n  Port ${PORT} is already in use — assuming a JSON Server is already ` +
          `running there, so the mock API is still available.\n` +
          `  If the catalog still looks empty, check what owns ${PORT}: it must ` +
          `serve JSON (open http://localhost:${PORT}/products), not a web page.\n`
      );
      process.exit(0);
    }
    throw err;
  });
