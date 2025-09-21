import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Modal from "react-native-modal";
import * as Haptics from "expo-haptics";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

import PropTypes from "prop-types";
import GradientButton from "../UI/GradientButton";
import FlatButton from "../UI/FlatButton";
import { GlobalStyles } from "../../constants/styles";
import { UserContext } from "../../store/user-context";
import { storeFeedback, FeedbackData } from "../../util/http";
import { dynamicScale, constantScale } from "../../util/scalingUtil";
import safeLogError from "../../util/error";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";

interface FeedbackFormProps {
  isVisible: boolean;
  onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ isVisible, onClose }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userCtx = useContext(UserContext);

  const handleSubmit = async () => {
    if (isSubmitting || !feedbackText.trim()) {
      return;
    }

    if (!feedbackText.trim()) {
      Alert.alert(i18n.t("feedbackEmptyTitle"), i18n.t("feedbackEmptyMessage"));
      return;
    }

    if (feedbackText.length > 1000) {
      Alert.alert(
        i18n.t("feedbackTooLongTitle"),
        i18n.t("feedbackTooLongMessage")
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const feedbackData: FeedbackData = {
        uid: userCtx.userName || "anonymous",
        feedbackString: feedbackText.trim(),
        date: new Date().toISOString(),
        timestamp: Date.now(),
        userAgent: Platform.OS,
        version: Constants.expoConfig?.version || "unknown",
      };

      await storeFeedback(feedbackData);

      Toast.show({
        type: "success",
        text1: i18n.t("feedbackSuccessTitle"),
        text2: i18n.t("feedbackSuccessMessage"),
        position: "bottom",
      });

      setFeedbackText("");
      onClose();
    } catch (error) {
      safeLogError(error);
      Toast.show({
        type: "error",
        text1: i18n.t("feedbackErrorTitle"),
        text2: i18n.t("feedbackErrorMessage"),
        position: "bottom",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackText("");
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t("feedbackTitle")}</Text>
            <Text style={styles.subtitle}>{i18n.t("feedbackSubtitle")}</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={i18n.t("feedbackPlaceholder")}
              placeholderTextColor={GlobalStyles.colors.gray600}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Text style={styles.characterCount}>
              {feedbackText.length}/1000
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <View style={styles.cancelButton}>
              <FlatButton
                onPress={handleClose}
                textStyle={styles.cancelButtonText}
              >
                {i18n.t("cancel")}
              </FlatButton>
            </View>

            <GradientButton
              onPress={handleSubmit}
              style={styles.submitButton}
              buttonStyle={[
                styles.submitButtonStyle,
                (isSubmitting || !feedbackText.trim()) && styles.disabledButton,
              ]}
            >
              {isSubmitting ? i18n.t("submitting") : i18n.t("submit")}
            </GradientButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

FeedbackForm.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderTopLeftRadius: constantScale(20),
    borderTopRightRadius: constantScale(20),
    padding: constantScale(20),
    maxHeight: "80%",
  },
  header: {
    marginBottom: constantScale(20),
  },
  title: {
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginBottom: constantScale(8),
  },
  subtitle: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.gray600,
    lineHeight: dynamicScale(22, false, 0.5),
  },
  inputContainer: {
    marginBottom: constantScale(20),
  },
  textInput: {
    backgroundColor: GlobalStyles.colors.gray300,
    borderRadius: constantScale(12),
    padding: constantScale(16),
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    minHeight: dynamicScale(120, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
  },
  characterCount: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.gray500,
    textAlign: "right",
    marginTop: constantScale(4),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: constantScale(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: constantScale(12),
  },
  cancelButtonText: {
    textAlign: "center",
  },
  submitButton: {
    flex: 1,
  },
  submitButtonStyle: {
    paddingVertical: constantScale(12),
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default FeedbackForm;
