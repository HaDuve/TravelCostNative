jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
    })
  ),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: "wifi",
  })),
}));

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const MockIcon = (props) =>
    React.createElement(Text, { testID: `icon-${props.name}` }, props.name);
  const iconExports = {
    Ionicons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
    AntDesign: MockIcon,
    Feather: MockIcon,
    Entypo: MockIcon,
  };
  return {
    ...iconExports,
    default: iconExports,
  };
});

jest.mock("react-native-purchases", () => {
  const Purchases = {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    collectDeviceIdentifiers: jest.fn(),
    LOG_LEVEL: { ERROR: "ERROR" },
  };
  return { __esModule: true, default: Purchases };
});

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    WebView: (props) => React.createElement(View, props),
    default: (props) => React.createElement(View, props),
  };
});

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  deleteUser: jest.fn(async () => {}),
  signInWithCustomToken: jest.fn(async () => ({})),
  signOut: jest.fn(async () => {}),
  onAuthStateChanged: jest.fn(() => () => {}),
}));
