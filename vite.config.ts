import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    port: 8002,
  },
  esbuild: {
    jsxFactory: "createElement",
    jsxInject: "import { createElement } from '@/core/compile'",
    jsxFragment: "createFragment",
    jsx: "transform",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
