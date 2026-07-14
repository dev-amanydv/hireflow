import { defineConfig } from "vitest/config";
import { configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // rules.test.ts predates this Vitest setup and imports from "bun:test" (per
    // CLAUDE.md conventions it's meant to be run with `bun test`, not Vitest).
    // Excluded here so `vitest run` doesn't fail trying to resolve "bun:test".
    exclude: [...configDefaults.exclude, "src/services/ats/rules.test.ts"],
  },
});
