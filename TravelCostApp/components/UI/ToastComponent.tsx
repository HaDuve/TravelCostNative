import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import LoadingBarOverlay from "./LoadingBarOverlay";
import { Text } from "react-native";
import { ProgressBar } from "react-native-paper";
import * as Progress from "react-native-progress";
import BackgroundGradient from "./BackgroundGradient";
import { TouchableOpacity } from "react-native-gesture-handler";
import IconButton from "./IconButton";
import { G } from "react-native-svg";

const CONTENTCONTAINERSTYLE = { paddingLeft: 10 };
const MINHEIGHT = 60;
const toastConfig: ToastConfig = {
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
  loading: (props) => {
    const { progress } = props.props;
    const size = "small";
    const progressValid =
      progress && typeof progress == "number" && progress >= 0 && progress <= 1;
    const MINHEIGHT = 88;
    const barWidth = Dimensions.get("screen").width * 0.83;
    const loadingColor = GlobalStyles.colors.cat8;
    const unfilledColor = GlobalStyles.colors.gray600;
    const loadingBarJSX = progressValid ? (
      <View style={GlobalStyles.strongShadow}>
        <Progress.Bar
          style={{
            marginTop: -22,
            marginLeft: 14,
          }}
          progress={progress}
          color={loadingColor}
          unfilledColor={unfilledColor}
          borderWidth={0}
          borderRadius={8}
          height={14}
          width={barWidth}
        ></Progress.Bar>
      </View>
    ) : (
      <></>
    );
    return (
      // props.progress - is a number from 0 to 1 or -1 (indeterminate)
      <View style={[{ flex: 1 }, GlobalStyles.strongShadow]}>
        <BaseToast
          {...props}
          style={[
            {
              borderLeftColor: GlobalStyles.colors.cat8,
              backgroundColor: GlobalStyles.colors.backgroundColor,
            },
            GlobalStyles.wideStrongShadow,
            progressValid && { minHeight: MINHEIGHT, paddingBottom: 16 },
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
                // maxWidth: 55,
                // padding: 20,
                // marginLeft: -40,
                marginRight: 30,
                marginTop: progressValid ? 18 : 12,
                maxHeight: 20,
                maxWidth: 20,
              }}
            >
              {/* Below is just the spinner, the loading BAR is in loadingBarJSX */}
              <LoadingBarOverlay size={size}></LoadingBarOverlay>
            </View>
          )}
          onPress={() => Toast.hide()}
        />
        {loadingBarJSX}
      </View>
    );
  },
  banner: (props) => (
    <TouchableOpacity
      onPress={() => {
        console.log("Pressed Touchable in Config");
        props.onPress();
      }}
      style={[styles.bannerContainerContainer, GlobalStyles.wideStrongShadow]}
    >
      <BackgroundGradient style={[styles.bannerContainer]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => {
              console.log("Pressed Touchable in Config");
              props.onPress();
            }}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.bannerText1}>{props.text1}</Text>
            </View>
            <Text style={styles.bannerText2}>{props.text2}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log("Pressed X in config");
              Toast.hide();
            }}
          >
            <View style={styles.xCloseContainer}>
              <View style={styles.xCloseButton}>
                <Text style={{ color: GlobalStyles.colors.gray700 }}>X</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    </TouchableOpacity>
  ),
  // call loading like this:
  // Toast.show({
  //   type: 'loading',
  //   // And I can pass any custom props I want
  //   props: { uuid: 'bba1a7d0-6ab2-4a0a-a76e-ebbe05ae6d70' }
  // });
};

const ToastComponent = () => {
  return (
    <Toast
      topOffset={10}
      bottomOffset={40}
      config={toastConfig}
      position={"bottom"}
    />
  );
};

export default ToastComponent;

const styles = StyleSheet.create({
  bannerContainerContainer: {
    // flex: 1,
    borderColor: "black",
    borderRadius: 999,
    alignItems: "center",
  },
  xCloseContainer: {
    marginTop: 18,
    marginLeft: 4,
  },
  xCloseButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "white",
    padding: 4,
    // paddingHorizontal: 8,
    backgroundColor: "white",
  },
  bannerContainer: {
    // flex: 1,
    maxWidth: "95%",
    borderColor: "black",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bannerText1: {
    fontSize: 16,
    fontWeight: "500",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  bannerText2: {
    fontSize: 14,
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
});
