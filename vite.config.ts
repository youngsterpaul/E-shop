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
    ...(mode === "production"
      ? [
          viteCompression({
            algorithm: "gzip",
            threshold: 10240,
            ext: ".gz",
          }),
          viteCompression({
            algorithm: "brotliCompress",
            threshold: 10240,
            ext: ".br",
          }),
        ]
      : []),
  ].filter(Boolean),
    resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-*",
    ],
    exclude: ["lovable-tagger"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    force: true,
  },
  build: {
    target: ["es2020", "safari14"],
    cssCodeSplit: true,
    cssMinify: "esbuild",
    sourcemap: mode !== "production",
    assetsInlineLimit: 2048,
    rollupOptions: {
      treeshake: true,
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".");
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? ""))
            return `assets/images/[name]-[hash][extname]`;
          if (/css/i.test(ext ?? ""))
            return `assets/css/[name]-[hash][extname]`;
          if (/woff2?|ttf|otf|eot/i.test(ext ?? ""))
            return `assets/fonts/[name]-[hash][extname]`;
          if (/mp4|webm|ogg|mp3|wav|flac|aac/i.test(ext ?? ""))
            return `assets/media/[name]-[hash][extname]`;
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("@radix-ui")) return "radix-vendor";
            if (id.includes("recharts") || id.includes("d3"))
              return "chart-vendor";
            if (
              id.includes("lodash") ||
              id.includes("@supabase") ||
              id.includes("@tanstack")
            )
              return "libs-vendor";
            return "vendor";
          }
        },
      },
    },
    manifest: true,
    chunkSizeWarningLimit: 500,
    minify: "esbuild",
  },
  esbuild: {
    target: "es2020",
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
