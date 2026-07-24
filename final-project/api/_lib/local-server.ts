// Local development only. In production on Vercel, api/index.ts exports the
// Express app directly and Vercel invokes it per-request — nothing calls
// .listen() there. This file exists so `pnpm dev` and `pnpm dev:api` have a
// real server to talk to on localhost while developing.
import app from "./app";

const port = Number(process.env.API_PORT ?? 8787);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] local dev server listening on http://localhost:${port}`);
});
