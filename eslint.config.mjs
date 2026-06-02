import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrades explicit 'any' from an error to a warning
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Downgrades unused variables from an error to a warning
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;