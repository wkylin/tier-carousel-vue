import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue", "**/*.ts"],
    languageOptions: {
      parser: vueParser,
      globals: {
        document: "readonly",
        HTMLElement: "readonly",
        Image: "readonly",
        KeyboardEvent: "readonly",
        PointerEvent: "readonly",
        ResizeObserver: "readonly",
        TransitionEvent: "readonly",
        window: "readonly",
      },
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  eslintConfigPrettier,
];
