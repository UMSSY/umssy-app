import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import tailwind from "eslint-plugin-tailwindcss";

const tailwindConfig = tailwind.configs["flat/recommended"] || tailwind.configs.recommended;
const tailwindConfigArray = Array.isArray(tailwindConfig) ? tailwindConfig : [tailwindConfig];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwindConfigArray,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    settings: {
      tailwindcss: {
        config: "src/app/globals.css",
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "check-file": checkFile,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "tailwindcss/no-custom-classname": "warn",
      "tailwindcss/classnames-order": "error",
      "@typescript-eslint/no-deprecated": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@radix-ui/*"],
              message: "UI Standard: Use encapsulated components from @/components/ui/ instead of importing Radix directly.",
            },
          ],
        },
      ],
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/!(__tests__)": "NEXT_JS_APP_ROUTER_CASE" },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/[\\u2600-\\u27BF\\uD83C-\\uDBFF\\uDC00-\\uDFFF]/]",
          message: "Standard 2.1: Emojis are not allowed in code or the user interface.",
        },
        {
          selector: "JSXText[value=/[\\u2600-\\u27BF\\uD83C-\\uDBFF\\uDC00-\\uDFFF]/]",
          message: "Standard 2.1: Emojis are not allowed in the user interface.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "UI Standard: Use the shadcn <Button> component (@/components/ui/button) instead of the native <button> tag.",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "UI Standard: Use the shadcn <Input> component (@/components/ui/input) instead of the native <input> tag.",
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/services/*", "@/app/*"],
              message: "Architecture: UI components must be pure and visual. Do not import business logic or modules here.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/index.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: ":matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, VariableDeclaration, ClassDeclaration, JSXElement, JSXFragment)",
          message: "Standard 2.4: Index files can only act as re-exporting hubs. Including logic or UI is prohibited.",
        },
      ],
    },
  },
]);

export default eslintConfig;