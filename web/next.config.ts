import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function loadRootEnvFallbackForLocalDev(): void {
  if (process.env.VERCEL === "1" || process.env.REZOOOOME_SKIP_PARENT_ENV === "1") {
    return;
  }
  const parentEnvPath = path.resolve(process.cwd(), "..", ".env");
  if (!fs.existsSync(parentEnvPath)) {
    return;
  }
  const contents = fs.readFileSync(parentEnvPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) {
      continue;
    }
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnvFallbackForLocalDev();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
