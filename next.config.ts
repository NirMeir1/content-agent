import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@libsql/client"],
  outputFileTracingIncludes: { "/*": ["node_modules/@libsql/win32-x64-msvc/**/*"] },
};
export default config;
