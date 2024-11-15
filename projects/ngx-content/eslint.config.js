// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../../eslint.config.js");

module.exports = tseslint.config(
  ...rootConfig,
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          prefix: "ngx",
          style: "camelCase",
          type: "attribute",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          prefix: "ngx",
          style: "kebab-case",
          type: "element",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
);
