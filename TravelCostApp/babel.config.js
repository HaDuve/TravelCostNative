module.exports = function (api) {
  api.cache(false);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-transform-export-namespace-from",
      "react-native-reanimated/plugin",
      "module:react-native-dotenv",
    ],
  };
};
