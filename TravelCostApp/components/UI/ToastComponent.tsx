import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import React from "react";
import { View, Text } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import LoadingBarOverlay from "./LoadingBarOverlay";

const toastConfig = {
  /*
      Overwrite 'success' type,
      by modifying the existing `BaseToast` component
    */
  success: (props) => (
    <BaseToast
      {...props}
      style={[
        { borderLeftColor: GlobalStyles.colors.primary500 },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
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
        { borderLeftColor: GlobalStyles.colors.error500 },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      onPress={() => Toast.hide()}
    />
  ),
  /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.

      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
  loading: (props) => (
    // props.progress - is a number from 0 to 1 or -1 (indeterminate)
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: GlobalStyles.colors.cat8,
          backgroundColor: GlobalStyles.colors.backgroundColor,
        },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      // renderLeadingIcon={() => (
      //   <View style={{ flex: 1, maxHeight: 55, maxWidth: 55 }}>
      //     <LoadingBarOverlay></LoadingBarOverlay>
      //   </View>
      // )}
      renderTrailingIcon={() => (
        <View
          style={{
            flex: 1,
            maxHeight: 55,
            maxWidth: 55,
            padding: 10,
            marginRight: 10,
          }}
        >
          <LoadingBarOverlay></LoadingBarOverlay>
        </View>
      )}
      onPress={() => Toast.hide()}
    />
    // <View
    //   style={[
    //     {
    //       borderLeftColor: GlobalStyles.colors.primary500,
    //       borderLeftWidth: 5,
    //       backgroundColor: GlobalStyles.colors.backgroundColor,
    //     },
    //     GlobalStyles.wideStrongShadow,
    //   ]}
    // >
    //   <Text>{text1}</Text>
    //   <Text>{text2}</Text>
    // </View>
  ),
  // call tomatoToast like this:
  // Toast.show({
  //   type: 'tomatoToast',
  //   // And I can pass any custom props I want
  //   props: { uuid: 'bba1a7d0-6ab2-4a0a-a76e-ebbe05ae6d70' }
  // });
};

const ToastComponent = () => {
  return <Toast topOffset={100} config={toastConfig} position={"bottom"} />;
};

export default ToastComponent;
