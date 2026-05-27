/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!.*(jest-)?react-native|.*@react-native|.*@react-navigation|.*expo(nent)?|.*@expo(nent)?|.*@unimodules|.*unimodules|.*react-native-safe-area-context|.*react-native-gesture-handler|.*react-native-reanimated|.*react-native-svg)",
  ],
};

