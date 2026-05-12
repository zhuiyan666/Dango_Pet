import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Tauri 需要固定端口进行开发
  server: {
    port: 1420,
    strictPort: true,
    host: "localhost",
  },

  // 前端构建输出目录（由 Tauri 读取）
  build: {
    outDir: "dist",
    // Tauri 在 Windows 上使用 Chromium，目标 es2021 即可
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    // 生产环境不生成 sourcemap，开发环境生成
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // 生产环境压缩代码
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
  },

  // 环境变量前缀
  envPrefix: ["VITE_", "TAURI_ENV_"],
});
