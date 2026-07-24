// Vercel serverless entry point.
//
// Vercel invokes this file per-request; it is not a long-running server.
// Express apps are valid (req, res) request handlers, so we hand the
// configured app straight to Vercel's Node.js runtime.
//
// vercel.json rewrites every request under /api/* to this function, and
// req.url still contains the full original path (e.g. "/api/products"),
// which is what app.use("/api", router) in _lib/app.ts expects.
import app from "./_lib/app";

export default app;
