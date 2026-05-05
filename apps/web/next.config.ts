import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(dirname, "../..", ".env") });

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(dirname, "../.."),
  reactStrictMode: true
};

export default nextConfig;
