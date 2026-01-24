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
        ...globals.node,      // if you have any node-like code
        PIXI: "readonly",     // prevents "PIXI is not defined" complaints
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

  // If using TypeScript → add typescript-eslint
  // (install: npm i -D typescript-eslint)
  // ...ts.configs.recommended,
];