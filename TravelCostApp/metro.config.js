const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push("mjs");
defaultConfig.resolver.assetExts.push("cjs");

// Disable package exports enforcement if needed for compatibility with older libraries
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
