import globals from "globals";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";

// Scoped ESLint config: only rules that oxlint cannot cover.
// All other linting (TS, react-hooks, refresh-style checks, etc.) is handled by oxlint.
export default tseslint.config(
  {
    ignores: ["dist", "worker-configuration*.d.ts", ".wrangler", "node_modules", "src/frontend-start/routeTree.gen.ts"],
  },
  {
    extends: [tseslint.configs.base],
    files: ["src/frontend/**/*.{ts,tsx}", "src/frontend-start/**/*.{ts,tsx}"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    extends: [tseslint.configs.base],
    files: [
      "src/backend/**/*.{ts,tsx}",
      "src/shared/**/*.{ts,tsx}",
      "src/worker/**/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
      "*.config.ts",
      "*.config.js",
      "vite.start.config.ts",
    ],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.worker,
      },
    },
  },
);
