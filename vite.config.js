// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    target: ["es2015"],
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "dist",
      fileName: "index",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "@tanstack/react-query",
        "date-fns",
        "react-dom",
        "react-use",
        "crypto",
      ],
    },
  },
  plugins: [dts(), react()],
});
