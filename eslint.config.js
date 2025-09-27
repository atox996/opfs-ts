import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = defineConfig(
  { ignores: ["**/dist/**", "**/docs/**"] },
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  prettierConfig,
  {
    name: "main",
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
);

export default config;
