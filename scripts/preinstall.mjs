import { unlinkSync } from "node:fs";
import { resolve } from "node:path";

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  try {
    unlinkSync(resolve(process.cwd(), lockfile));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

if (!process.env.npm_config_user_agent?.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exitCode = 1;
}
