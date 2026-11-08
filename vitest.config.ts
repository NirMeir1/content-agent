import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    maxWorkers: 1,
    env: { DATABASE_URL: "file:./data/unit-test.db" },
  },
});
