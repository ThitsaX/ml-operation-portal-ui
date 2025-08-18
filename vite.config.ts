import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import visualizer from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      '/public': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
      },
      '/secured': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
