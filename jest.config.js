module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  transform: {
    "^.+\\.(ts|js|html)$": "jest-preset-angular",
  },
  moduleNameMapper: {
    "^@ngx-content/(.*)$": "<rootDir>/projects/ngx-content/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
};
