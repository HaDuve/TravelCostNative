import "dotenv/config";

export default {
  expo: {
    name: "Budget",
    slug: "Travel-Expense",
    scheme: "budgetfornomads",
    version: "1.3.0",
    orientation: "default",
    icon: "./assets/icon2.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/launch2.png",
      resizeMode: "cover",
      backgroundColor: "#000000",
      tabletImage: "./assets/launch2.png",
    },
    updates: {
      url: "https://u.expo.dev/dff7ffc5-6f1e-4ece-bb23-0c50cda19f46",
    },
    newArchEnabled: false,
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.budgetfornomads.app",
      buildNumber: "1.0.1214",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "com.budgetfornomad.app",
      versionCode: 101118,
      adaptiveIcon: {
        foregroundImage: "./assets/icon2.png",
        backgroundColor: "#FFFFFF",
      },
    },
    web: {
      favicon: "./assets/icon2.png",
    },
    extra: {
      eas: {
        projectId: "dff7ffc5-6f1e-4ece-bb23-0c50cda19f46",
      },
    },
    plugins: ["expo-localization", "expo-font"],
    runtimeVersion: {
      policy: "appVersion",
    },
  },
};
