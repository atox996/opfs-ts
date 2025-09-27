import dts from "unplugin-dts/vite";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      provider: "playwright", // or 'webdriverio'
      enabled: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
    },
  },
  build: {
    lib: {
      entry: "src/index",
      name: "OPFS",
      fileName: "index",
    },
  },
  plugins: [
    dts({
      entryRoot: "src",
      bundleTypes: true,
    }),
  ],
}) satisfies ViteUserConfig as ViteUserConfig;
