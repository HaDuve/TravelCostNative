import { Linking } from "react-native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import VersionCheck from "react-native-version-check-expo";

import { getMMKVString, setMMKVString } from "../store/mmkv";

export type VersionCheckResponse = {
  latestVersion: string;
  currentVersion: string;
  isNeeded: boolean;
  storeUrl: string;
};
export async function versionCheck() {
  // after testing it seems that the verion check library does not work correctly
  // it always returns true for isNeeded
  // in simulator - test current version is 1.2.673
  // in simulator - test latest version is 1.10
  // we are trying this feature with expo-updates

  try {
    const versionCheckTimeStamp = getMMKVString("versionCheckTimeStamp");

    // console.log("versionCheck ~ versionCheckTimeStamp:", versionCheckTimeStamp);
    if (versionCheckTimeStamp) {
      const timeDiff =
        (new Date().getTime() - new Date(versionCheckTimeStamp).getTime()) /
        1000;
      // console.log("versionCheck ~ timeDiff:", timeDiff);
      if (timeDiff < 60 * 60 * 24 * 1) {
        // 1 day no annoying reminder
        return;
      }
    }

    const updateResponse: VersionCheckResponse =
      await VersionCheck.needUpdate();
    // isNeeded : boolean
    // storeUrl : string
    // currentVersion : string
    // latestVersion : string
    // console.log("versionCheck ~ current version", updateResponse?.currentVersion);
    // console.log("versionCheck ~ latest version", updateResponse?.latestVersion);
    if (updateResponse?.isNeeded && updateResponse?.storeUrl) {
      Toast.show({
        type: "success",
        position: "top",
        text1: "Update Available",
        text2: "Press here to update to the latest version from Store",
        visibilityTime: 7000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
        onPress: async () => {
          await Linking.openURL(updateResponse?.storeUrl);
        },
      });
      setMMKVString("versionCheckTimeStamp", new Date().toISOString());
    }
    // return {latestVersion, currentVersion, isNeeded, storeUrl}
    return updateResponse;
  } catch (error) {
    // Silently handle version check errors to prevent app crashes
    console.log("Version check failed:", error.message);
    return null;
  }
}
