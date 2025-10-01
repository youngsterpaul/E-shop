import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "child_process";

export default defineConfig(({ mode }) => {
  // ✅ Get version info (from package.json or Git commit)
  const packageVersion = process.env.npm_package_version || "1.0.0";
  const gitHash = (() => {
    try {
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return "unknown";
    }
  })();

  const appVersion = `${packageVersion}-${gitHash}`;

  return {
    server: {
      host: "::",
      port: 8080,
      open: false,
    },

    plugins: [
      react(),
      // Only include tagger in dev mode
      mode === "development" && componentTagger(),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    define: {
      // ✅ Inject version info into client build
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
      "import.meta.env.VITE_BUILD_MODE": JSON.stringify(mode),
    },

    build: {
      // ✅ Target modern browsers (and Safari 11+)
      target: ["es2015", "safari11"],

      // ✅ Control chunk naming for cache-safety
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split(".");
            const ext = info?.[info.length - 1] ?? "";

            // Images go to /assets/images
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }

            // CSS goes to /assets/css
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }

            // Everything else stays in /assets
            return `assets/[name]-[hash][extname]`;
          },
        },
      },

      // ✅ Include manifest.json for SSR or deployment platforms
      manifest: true,

      // ✅ Performance tuning
      chunkSizeWarningLimit: 500,
      sourcemap: mode !== "production",
      assetsInlineLimit: 0, // Always separate assets for better caching

      // ✅ Safari/iOS & legacy compatibility
      polyfillDynamicImport: false,
    },

    esbuild: {
      target: "es2015",
    },

    // ✅ Recommended cache control for local dev only
    // (Production caching handled by Vercel)
    optimizeDeps: {
      include: [],
    },
  };
});
