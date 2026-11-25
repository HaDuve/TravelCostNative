/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  globalSetup: "<rootDir>/jest-global-setup.js",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/fixtures/", "/rules-tests/"],
  transformIgnorePatterns: [
    "node_modules/(?!.*(jest-)?react-native|.*@react-native|.*@react-navigation|.*expo(nent)?|.*@expo(nent)?|.*@unimodules|.*unimodules|.*react-native-safe-area-context|.*react-native-gesture-handler|.*react-native-reanimated|.*react-native-svg|.*react-native-sortables)",
  ],
};

