// eslint.config.js
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        PIXI: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // your preferences
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];