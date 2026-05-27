// Must load before `expo` (Expo.fx → winter/runtime.native uses global FormData).
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";

polyfillGlobal(
  "FormData",
  () => require("react-native/Libraries/Network/FormData").default
);
