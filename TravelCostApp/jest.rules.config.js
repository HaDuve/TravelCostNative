/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  rootDir: __dirname,
  roots: ["<rootDir>/rules-tests"],
  testMatch: ["**/*.test.js"],
  transform: {},
  testTimeout: 30000,
};
