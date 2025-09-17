import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import visualizer from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    define: {
      'process.env': env
    }
  };
});
