import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Scoring logic is pure and framework-agnostic — runs in plain Node.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
