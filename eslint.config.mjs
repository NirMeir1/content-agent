import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  globalIgnores([".next/**", ".desktop-build/**", ".desktop-cache/**", ".proxy-build/**", "release/**", "output/**", "test-results/**", "next-env.d.ts"]),
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
]);
