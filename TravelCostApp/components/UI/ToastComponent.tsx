import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import React from "react";
import { View, Text } from "react-native";
import { GlobalStyles } from "../../constants/styles";

const toastConfig = {
  /*
      Overwrite 'success' type,
      by modifying the existing `BaseToast` component
    */
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: GlobalStyles.colors.primary500 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
    />
  ),
  /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: GlobalStyles.colors.error500 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
    />
  ),
  /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.

      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
  // tomatoToast: ({ text1, props }) => (
  //   <View style={{ height: 60, width: "100%", backgroundColor: "tomato" }}>
  //     <Text>{text1}</Text>
  //     <Text>{props.uuid}</Text>
  //   </View>
  // ),
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
