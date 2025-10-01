import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // Gzip
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "gzip",
      ext: ".gz",
    }),

    // Brotli (better)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
    exclude: ["lovable-tagger"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },

  build: {
    target: ["es2015", "safari11"],
    manifest: true,
    sourcemap: mode === "production" ? false : true,
    assetsInlineLimit: 0,
    polyfillDynamicImport: false,
    chunkSizeWarningLimit: 500,
    minify: "esbuild",

    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split(".").pop();
          if (/png|jpe?g|svg|gif|ico/i.test(ext ?? "")) {
            return "assets/images/[name]-[hash][extname]";
          }
          if (/css/i.test(ext ?? "")) {
            return "assets/css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },

        // ✅ React is now always shared globally
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("@radix-ui")) return "radix-vendor";
            if (id.includes("recharts") || id.includes("d3")) return "chart-vendor";
            if (id.includes("lodash") || id.includes("@supabase") || id.includes("@tanstack"))
              return "libs-vendor";
            return "vendor";
          }
        },
      },
    },
  },

  esbuild: {
    target: "es2015",
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
