import React, { Share, View, Button, Alert } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import safeLogError from "../../util/error";

export async function onShare(shareId, navigation) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const link = Linking.createURL("join/" + shareId);
  // const link = "exp://192.168.100.102:19000/--/join/" + shareId;
  try {
    const result = await Share.share({
      message: i18n.t("inviteMessage"),
      url: link,
    });
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    safeLogError(error);
    Alert.alert(i18n.t("errorShareTripText"), i18n.t("errorShareTripText"));
  }
  navigation.navigate("Profile");
}

const ShareTripButton = ({ route }) => {
  const shareId = route.params?.tripId;

  return (
    <View style={{ marginTop: 50 }}>
      <Button
        onPress={onShare.bind(this, shareId)}
        title={i18n.t("inviteTraveller")}
      />
    </View>
  );
};

export default ShareTripButton;

ShareTripButton.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};
