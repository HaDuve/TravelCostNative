// eslint-disable-next-line no-undef
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier", // Must be last to override other configs
  ],
  overrides: [
    {
      files: ["*.js", "*.jsx"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "no-undef": "off",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "@typescript-eslint", "unused-imports", "prettier"],
  rules: {
    // Console and debugging
    "no-console": "warn",
    "no-debugger": "error",

    // Unused imports (auto-fixable)
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],

    // React specific
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript instead

    // TypeScript specific
    "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // General code quality
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
