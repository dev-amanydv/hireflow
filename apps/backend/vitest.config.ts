import { defineConfig } from "vitest/config";
import { configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    exclude: [...configDefaults.exclude, "src/services/ats/rules.test.ts"],
  },
});
