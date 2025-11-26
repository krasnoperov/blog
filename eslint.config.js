import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const sharedTypescript = {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  languageOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
};

export default tseslint.config(
  {
    ignores: ["dist", "worker-configuration*.d.ts", ".wrangler", "node_modules"],
  },
  {
    ...sharedTypescript,
    files: ["src/frontend/**/*.{ts,tsx}"],
    languageOptions: {
      ...sharedTypescript.languageOptions,
      globals: globals.browser,
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ...sharedTypescript,
    files: ["src/backend/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}", "scripts/**/*.ts"],
    languageOptions: {
      ...sharedTypescript.languageOptions,
      globals: {
        ...globals.node,
        ...globals.worker,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
