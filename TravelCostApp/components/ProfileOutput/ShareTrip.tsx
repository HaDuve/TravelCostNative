import React, {
  Share,
  View,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
} from "react-native";
import axios from "axios";
import { i18n } from "../../i18n/i18n";

import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import safeLogError from "../../util/error";
import { loadKeys } from "../Premium/PremiumConstants";
import { GlobalStyles } from "../../constants/styles";
import GradientButton from "../UI/GradientButton";
import IconButton from "../UI/IconButton";
import { dynamicScale } from "../../util/scalingUtil";

export async function onShare(shareId, navigation) {
  // Branch.io removed - using simple fallback sharing
  let shareURL = i18n.t("inviteLink");

  // Simple fallback URL with trip ID
  shareURL = `${shareURL}?trip=${shareId}`;

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // const link = Linking.createURL("join/" + shareId);
  // const link = "exp://192.168.100.102:19000/--/join/" + shareId;
  try {
    const result = await Share.share({
      message: i18n.t("inviteMessage"),
      url: shareURL,
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
  navigation.goBack();
}

const ShareTripButton = ({ route, navigation }) => {
  const shareId = route.params?.tripId;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-back-outline"
            size={24}
            color={GlobalStyles.colors.primary500}
            onPress={() => navigation.goBack()}
            style={GlobalStyles.backButton}
          />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={[GlobalStyles.titleText, styles.title]}>
            {i18n.t("inviteTraveller")}
          </Text>

          <Text style={[GlobalStyles.secondaryText, styles.description]}>
            {i18n.t("shareTripDescription")}
          </Text>

          <View style={styles.buttonContainer}>
            <GradientButton
              onPress={() => onShare(shareId, navigation)}
              style={styles.shareButton}
            >
              {i18n.t("inviteTraveller")}
            </GradientButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ShareTripButton;

ShareTripButton.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: dynamicScale(20, true),
    paddingHorizontal: dynamicScale(20, false),
    paddingBottom: dynamicScale(10, true),
  },
  content: {
    flex: 1,
    paddingHorizontal: dynamicScale(20, false),
    paddingTop: dynamicScale(20, true),
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: dynamicScale(20, true),
  },
  description: {
    textAlign: "center",
    marginBottom: dynamicScale(40, true),
    lineHeight: dynamicScale(20, true),
    paddingHorizontal: dynamicScale(20, false),
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: dynamicScale(40, true),
  },
  shareButton: {
    width: "80%",
    minWidth: dynamicScale(200, false),
  },
});
