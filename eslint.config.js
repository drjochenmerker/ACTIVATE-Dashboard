import { defineConfig } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig([
  {
    files: ["**/*.ts", "**/*.vue"],
    parser: tsParser,
    parserOptions: {
      project: true,
      tsconfigRootDir: __dirname,
      extraFileExtensions: [".vue"],
      sourceType: "module",
    },
    plugins: {
      vue: pluginVue,
      "@typescript-eslint": tsPlugin,
    },
    extends: [
      ...pluginVue.configs.essential.extends || [],
      ...tsPlugin.configs.recommended.extends || [],
    ],
    rules: {
      "@typescript-eslint/complexity": ["warn", { max: 10 }],
      "vue/max-depth": ["warn", { max: 5 }],
      "no-unused-vars": "off",
    },
  },
]);
