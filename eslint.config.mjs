import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Existing client hydration flows read browser storage after mount.
      // Keep these visible in CI without blocking production builds while they are migrated.
      "react-hooks/set-state-in-effect": "warn",
      // Legacy admin helpers still contain broad Prisma/JSON adapter types.
      // TypeScript build remains strict; keep explicit-any visible as migration debt.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
