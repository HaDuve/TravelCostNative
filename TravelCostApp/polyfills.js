// Required for Expo runtime (not test-only): load before `expo` so winter/runtime.native has FormData.
import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";

polyfillGlobal(
  "FormData",
  () => require("react-native/Libraries/Network/FormData").default,
);
