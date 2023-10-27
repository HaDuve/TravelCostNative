const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push("mjs");
defaultConfig.resolver.assetExts.push("cjs");

module.exports = defaultConfig;
