import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Server-side logic only for now. The route handlers need a database,
    // so the unit suite covers the pure decision functions they call —
    // which is where the send/don't-send correctness actually lives.
    include: ["api/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
