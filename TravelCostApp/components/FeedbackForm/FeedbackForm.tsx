import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";

import { i18n } from "../../i18n/i18n";

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
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
        <View style={[styles.modalContainer, GlobalStyles.strongShadow]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{i18n.t("feedbackTitle")}</Text>
          </View>

          <Text style={styles.modalSubtitle}>{i18n.t("feedbackSubtitle")}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, GlobalStyles.strongShadow]}
              placeholder={i18n.t("feedbackPlaceholder")}
              placeholderTextColor={GlobalStyles.colors.gray700}
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

          <View style={styles.modalButtons}>
            <FlatButton onPress={handleClose} textStyle={{ fontSize: 16 }}>
              {i18n.t("cancel")}
            </FlatButton>
            <GradientButton
              style={styles.submitButton}
              colors={GlobalStyles.gradientColorsButton}
              onPress={handleSubmit}
              darkText
              buttonStyle={[
                { padding: 8, paddingHorizontal: 12 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    padding: dynamicScale(24, false, 0.5),
    marginHorizontal: dynamicScale(20, false, 0.5),
    maxWidth: dynamicScale(400, false, 0.5),
    width: "90%",
  },
  modalHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(16, true),
  },
  modalTitle: {
    fontSize: dynamicScale(20, false, 0.3),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
  },
  modalSubtitle: {
    fontSize: dynamicScale(16, false, 0.3),
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
    marginBottom: dynamicScale(20, true),
    lineHeight: dynamicScale(22, true),
  },
  inputContainer: {
    marginBottom: dynamicScale(24, true),
  },
  textInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: dynamicScale(12, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    fontSize: dynamicScale(16, false, 0.3),
    color: GlobalStyles.colors.textColor,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    minHeight: dynamicScale(120, false, 0.5),
  },
  characterCount: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.gray500,
    textAlign: "right",
    marginTop: dynamicScale(4),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submitButton: {
    marginLeft: dynamicScale(16, false, 0.5),
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default FeedbackForm;
