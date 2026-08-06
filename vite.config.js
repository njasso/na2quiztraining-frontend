// vite.config.js — VERSION SIMPLIFIÉE ET STABLE
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [
      react({
        // ✅ Configuration simple et efficace
        jsxRuntime: "automatic",
        fastRefresh: !isProd,
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
        manifest: {
          name: "NA2 Quiz",
          short_name: "NA2 Quiz",
          description: "Plateforme de quiz intelligente propulsée par l'IA",
          theme_color: "#6366f1",
          background_color: "#05071a",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/uploads\//,
            /^\/health$/,
            /^\/auth\//,
          ],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\..*\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],

    define: {
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || "1.0.0",
      ),
      __DEV__: !isProd,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-router-dom",
        "@tanstack/react-query",
        "@tanstack/react-query-devtools",
        "framer-motion",
        "lucide-react",
        "recharts",
        "axios",
        "react-hot-toast",
        "jspdf",
        "jspdf-autotable",
        "html2canvas",
        "xlsx",
        "idb",
      ],
      force: true,
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@contexts": path.resolve(__dirname, "./src/contexts"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@data": path.resolve(__dirname, "./src/data"),
      },
      dedupe: ["react", "react-dom", "react-router-dom"],
      extensions: [".js", ".jsx", ".json", ".css"],
    },

    server: {
      port: 5173,
      strictPort: false,
      host: "localhost", // ✅ Changé de 0.0.0.0 à localhost
      open: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 5173,
        overlay: true,
        timeout: 60000,
        clientPort: 5173,
      },
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/uploads": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
      cors: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },

    build: {
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProd,
      minify: isProd ? "esbuild" : false,
      cssMinify: isProd,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": ["framer-motion", "lucide-react", "react-hot-toast"],
            "vendor-charts": ["recharts"],
            "vendor-pdf": ["jspdf", "jspdf-autotable", "html2canvas"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-utils": ["axios", "lodash", "dayjs", "uuid"],
            "vendor-export": ["xlsx", "file-saver"],
          },
        },
      },
    },

    preview: {
      port: 4173,
      host: "localhost",
      open: true,
    },

    css: {
      modules: {
        localsConvention: "camelCase",
        generateScopedName: isProd
          ? "[hash:base64:8]"
          : "[name]__[local]__[hash:base64:5]",
      },
      devSourcemap: !isProd,
    },

    logLevel: isProd ? "warn" : "info",
    clearScreen: false,
  };
});
