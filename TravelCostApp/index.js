import { registerRootComponent } from "expo";
import { Text, TextInput } from "react-native";
import App from "./App";

// this could disable FontScaling alltogether, but would be bad for accessability
// TODO: work around this by using  maxFontSizeMultiplier prop on Text and TextInput
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
// Text.defaultProps.maxFontSizeMultiplier = 1.1;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
// TextInput.defaultProps.maxFontSizeMultiplier = 1.1;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
