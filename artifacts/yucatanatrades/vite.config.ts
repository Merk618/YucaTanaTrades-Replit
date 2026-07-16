import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/YucaTanaTrades-Replit/";

function getDevelopmentApiTarget(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const rawTarget = process.env.API_DEV_ORIGIN ?? "http://127.0.0.1:8080";

  let target: URL;
  try {
    target = new URL(rawTarget);
  } catch {
    throw new Error("API_DEV_ORIGIN must be an absolute HTTP(S) origin.");
  }

  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    throw new Error("API_DEV_ORIGIN must be an HTTP(S) origin without credentials, path, query, or hash.");
  }

  return target.origin;
}

const developmentApiTarget = getDevelopmentApiTarget();
const developmentBindHost = process.env.AUTH_BIND_HOST?.trim() || "127.0.0.1";

if (
  process.env.AUTH_EXPOSE_DEV_TOKENS === "true" &&
  developmentBindHost !== "127.0.0.1" &&
  developmentBindHost !== "::1"
) {
  throw new Error(
    "AUTH_EXPOSE_DEV_TOKENS requires the UI dev server to use an exact loopback AUTH_BIND_HOST.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: developmentBindHost,
    allowedHosts: true,
    fs: {
      strict: true,
    },
    ...(developmentApiTarget
      ? {
          proxy: {
            "/api": {
              target: developmentApiTarget,
              changeOrigin: false,
            },
          },
        }
      : {}),
  },
  preview: {
    port,
    host: developmentBindHost,
    allowedHosts: true,
  },
});
