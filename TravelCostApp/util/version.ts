import VersionCheck from "react-native-version-check-expo";
import { Alert, Linking } from "react-native";
import { getMMKVString, setMMKVString } from "../store/mmkv";

export async function versionCheck() {
  // check Timestamp from last "Later" press
  const versionCheckTimeStamp = getMMKVString("versionCheckTimeStamp");
  console.log("versionCheck ~ versionCheckTimeStamp:", versionCheckTimeStamp);
  if (versionCheckTimeStamp) {
    const timeDiff =
      (new Date().getTime() - new Date(versionCheckTimeStamp).getTime()) / 1000;
    console.log("versionCheck ~ timeDiff:", timeDiff);
    if (timeDiff < 60 * 60 * 24 * 7) {
      // 7 days
      return;
    }
  }
  console.log("versionCheck ~ versionCheck:", versionCheck);
  VersionCheck.needUpdate().then(async (res) => {
    console.log("versionCheck ~ update is needed", res.isNeeded); // true
    if (res.isNeeded) {
      // Alert the user that a new version is available with later and okay options
      Alert.alert(
        "New version available",
        "Please update the app to the latest version to get the fastest and most secure experience.",
        [
          {
            text: "Later",
            onPress: () => {
              console.log("Cancel Pressed");
              setMMKVString("versionCheckTimeStamp", new Date().toISOString());
            },
            style: "cancel",
          },
          { text: "OK", onPress: () => Linking.openURL(res.storeUrl) },
        ],
        { cancelable: false }
      );
    }
  });
}
