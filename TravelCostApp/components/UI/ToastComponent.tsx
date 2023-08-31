import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import React from "react";
import { View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import LoadingBarOverlay from "./LoadingBarOverlay";

const CONTENTCONTAINERSTYLE = { paddingLeft: 10 };
const MINHEIGHT = 80;
const toastConfig = {
  /*
      Overwrite 'success' type,
      by modifying the existing `BaseToast` component
    */
  success: (props) => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: GlobalStyles.colors.primary500,
          minHeight: MINHEIGHT,
        },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
  error: (props) => (
    <ErrorToast
      {...props}
      style={[
        { borderLeftColor: GlobalStyles.colors.error500, minHeight: MINHEIGHT },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.

      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
  loading: ({ progress, size, ...props }) => (
    // props.progress - is a number from 0 to 1 or -1 (indeterminate)
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: GlobalStyles.colors.cat8,
          backgroundColor: GlobalStyles.colors.backgroundColor,
          minHeight: MINHEIGHT,
        },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      renderTrailingIcon={() => (
        <View
          style={{
            flex: 1,
            maxHeight: 55,
            maxWidth: 55,
            padding: 20,
            marginRight: 20,
          }}
        >
          <LoadingBarOverlay
            progress={Number(progress)}
            size={size}
          ></LoadingBarOverlay>
        </View>
      )}
      onPress={() => Toast.hide()}
    />
  ),
  // call loading like this:
  // Toast.show({
  //   type: 'loading',
  //   // And I can pass any custom props I want
  //   props: { uuid: 'bba1a7d0-6ab2-4a0a-a76e-ebbe05ae6d70' }
  // });
};

const ToastComponent = () => {
  return <Toast topOffset={100} config={toastConfig} position={"bottom"} />;
};

export default ToastComponent;
