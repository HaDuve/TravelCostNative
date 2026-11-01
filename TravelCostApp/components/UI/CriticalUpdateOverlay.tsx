import React from "react";
import {
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { dynamicScale } from "../../util/scalingUtil";
import ActionRow from "./ActionRow";

type CriticalUpdateOverlayProps = {
  visible: boolean;
  onReload: () => void;
};

/**
 * Branded full-screen hard block for critical OTAs.
 * No dismiss path — primary action reloads into the fetched update.
 */
const CriticalUpdateOverlay = ({
  visible,
  onReload,
}: CriticalUpdateOverlayProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        // Hard block: Android back must not return to the old JS bundle.
      }}
    >
      <View
        style={styles.root}
        testID="critical-update-overlay"
        accessibilityViewIsModal
      >
        <ImageBackground
          source={require("../../assets/launch2.png")}
          resizeMode="cover"
          style={[
            styles.background,
            {
              paddingTop: insets.top + dynamicScale(24, true, 0.5),
              paddingBottom: insets.bottom + dynamicScale(24, true, 0.5),
            },
          ]}
        >
          <View style={styles.copyPanel}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.6}
            >
              {i18n.t("criticalUpdateOverlayTitle")}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.6}>
              {i18n.t("criticalUpdateOverlayBody")}
            </Text>
            <ActionRow
              tier="primary"
              label={i18n.t("criticalUpdateOverlayReload")}
              icon="refresh-outline"
              showChevron={false}
              onPress={onReload}
              style={styles.action}
            />
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
};

export default CriticalUpdateOverlay;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  background: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: dynamicScale(24, false, 0.5),
  },
  copyPanel: {
    marginBottom: dynamicScale(8, true, 0.5),
    gap: dynamicScale(12, true, 0.5),
    padding: dynamicScale(20, false, 0.5),
    borderRadius: dynamicScale(16, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  title: {
    color: GlobalStyles.colors.primary800,
    fontSize: dynamicScale(28, false, 0.5),
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    lineHeight: dynamicScale(22, false, 0.5),
    textAlign: "center",
  },
  action: {
    marginTop: dynamicScale(4, true, 0.5),
  },
});
