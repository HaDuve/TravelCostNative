import { useState, useContext } from "react";
import {
  Alert,
  View,
  Text,
  Modal,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
} from "react-native";
import { DateTime } from "luxon";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { NetworkContext } from "../../store/network-context";
import { SettingsContext } from "../../store/settings-context";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import ActionRow from "../UI/ActionRow";
import ActionRowStack from "../UI/ActionRowStack";
import PropTypes from "prop-types";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import { i18n } from "../../i18n/i18n";
import { getFormattedDate } from "../../util/date";
import { countryLabelForPicker } from "../../util/expense-form-inputs";
import { buildProfileLocalPriceGptParams } from "../../util/profile-local-price-submit";
import CurrencyPicker from "../Currency/CurrencyPicker";
import CountryPicker from "../Currency/CountryPicker";
import DatePickerContainer from "../UI/DatePickerContainer";
import DatePickerModal from "../UI/DatePickerModal";

const GetLocalPriceButton = ({ navigation, style }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const { settings } = useContext(SettingsContext);
  const isConnected = netCtx.isConnected;

  const defaultCountry = userCtx.lastCountry || "Germany";
  const defaultCurrency =
    userCtx.lastCurrency || tripCtx.tripCurrency || "EUR";
  const today = getFormattedDate(DateTime.now());

  const [showLocalPriceModal, setShowLocalPriceModal] = useState(false);
  const [productInput, setProductInput] = useState("");
  const [hideAdvanced, setHideAdvanced] = useState(true);
  const [currencyPickerValue, setCurrencyPickerValue] =
    useState(defaultCurrency);
  const [countryPickerValue, setCountryPickerValue] = useState(() =>
    countryLabelForPicker(defaultCountry),
  );
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);

  const resetModalState = () => {
    setProductInput("");
    setHideAdvanced(true);
    setCurrencyPickerValue(defaultCurrency);
    setCountryPickerValue(countryLabelForPicker(defaultCountry));
    setStartDate(today);
    setEndDate(today);
    setShowDatePickerRange(false);
  };

  const handleGetLocalPrice = () => {
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    setShowLocalPriceModal(true);
  };

  const toggleAdvancedHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHideAdvanced((current) => !current);
  };

  const openDatePickerRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };

  const onCancelRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  };

  const onConfirmRange = (expenseOut) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
    const rangeStart = DateTime.fromJSDate(expenseOut.startDate).toJSDate();
    const rangeEnd = DateTime.fromJSDate(expenseOut.endDate).toJSDate();
    setStartDate(getFormattedDate(rangeStart));
    setEndDate(getFormattedDate(rangeEnd));
  };

  const handleLocalPriceSubmit = () => {
    if (!productInput.trim()) {
      Alert.alert(i18n.t("alertError"), i18n.t("getLocalPriceError"));
      return;
    }

    const params = buildProfileLocalPriceGptParams(
      productInput,
      { country: defaultCountry, currency: defaultCurrency },
      {
        countryPickerValue,
        currencyPickerValue,
        startDate,
        endDate,
      },
      !hideAdvanced,
    );

    trackEvent(VexoEvents.GET_LOCAL_PRICE_PROFILE_PRESSED, {
      product: params.product,
      currency: params.currency,
      country: params.country,
      inclusiveDayCount: params.inclusiveDayCount,
    });

    setShowLocalPriceModal(false);
    resetModalState();
    navigation.navigate("GPTDeal", params);
  };

  const handleModalClose = () => {
    setShowLocalPriceModal(false);
    resetModalState();
  };

  let dateIsRanged =
    startDate?.toString().slice(0, 10) !== endDate?.toString().slice(0, 10);
  if (!startDate || !endDate) {
    dateIsRanged = false;
  }

  if (!settings.askAiForGoodPrices) {
    return null;
  }

  return (
    <>
      <ActionRow
        testID="profile-get-local-price"
        tier="gradient"
        label={i18n.t("getLocalPriceTitle")}
        hint={i18n.t("getLocalPriceHint")}
        imageIconSource={require("../../assets/chatgpt-logo.jpeg")}
        onPress={handleGetLocalPrice}
        showChevron={false}
        style={style}
      />

      <Modal
        visible={showLocalPriceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={styles.modalContainer}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Image
                  source={require("../../assets/chatgpt-logo.jpeg")}
                  style={styles.modalIcon}
                />
                <Text style={styles.modalTitle}>
                  {i18n.t("getLocalPriceModalTitle")}
                </Text>
              </View>

              <Text style={styles.modalSubtitle}>
                {i18n.t("getLocalPriceModalSubtitle")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={productInput}
                onChangeText={setProductInput}
                placeholder={i18n.t("getLocalPricePlaceholder")}
                placeholderTextColor={GlobalStyles.colors.gray700}
                autoFocus={true}
                multiline={false}
                returnKeyType="done"
                onSubmitEditing={handleLocalPriceSubmit}
              />

              <Pressable
                testID="get-local-price-advanced-toggle"
                onPress={toggleAdvancedHandler}
              >
                <View style={styles.advancedRow}>
                  <Ionicons
                    name={
                      hideAdvanced
                        ? "arrow-down-circle-outline"
                        : "arrow-forward-circle-outline"
                    }
                    size={dynamicScale(28, false, 0.5)}
                    color={GlobalStyles.colors.primary500}
                  />
                  <Text style={styles.advancedText}>
                    {hideAdvanced
                      ? i18n.t("showMoreOptions")
                      : i18n.t("showLessOptions")}
                  </Text>
                </View>
              </Pressable>

              {!hideAdvanced && (
                <View testID="get-local-price-advanced-options">
                  <View style={styles.currencyContainer}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t("currencyLabel")}
                    </Text>
                    <CurrencyPicker
                      countryValue={currencyPickerValue}
                      setCountryValue={setCurrencyPickerValue}
                      placeholder={defaultCurrency}
                    />
                  </View>

                  <View style={styles.countryContainer}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t("countryLabel")}
                    </Text>
                    <CountryPicker
                      countryValue={countryPickerValue}
                      setCountryValue={setCountryPickerValue}
                      placeholder={countryLabelForPicker(defaultCountry)}
                    />
                  </View>

                  <View style={styles.dateContainer}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t("dateLabel")}
                    </Text>
                    {DatePickerContainer({
                      openDatePickerRange,
                      startDate,
                      endDate,
                      dateIsRanged,
                      hideBottomBorder: true,
                      narrow: true,
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <ActionRowStack
              showChevron={false}
              actions={[
                {
                  testID: "get-local-price-submit",
                  tier: "gradient",
                  label: i18n.t("getLocalPriceTitle"),
                  onPress: handleLocalPriceSubmit,
                  disabled: !productInput.trim(),
                },
                {
                  testID: "get-local-price-cancel",
                  tier: "secondary",
                  label: i18n.t("cancel"),
                  onPress: handleModalClose,
                },
              ]}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {DatePickerModal({
        showDatePickerRange,
        onCancelRange,
        onConfirmRange,
      })}
    </>
  );
};

GetLocalPriceButton.propTypes = {
  navigation: PropTypes.object.isRequired,
  style: PropTypes.object,
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
    maxHeight: "85%",
    ...GlobalStyles.strongShadow,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(16, true),
  },
  modalIcon: {
    width: dynamicScale(24, false, 0.5),
    height: dynamicScale(24, false, 0.5),
    marginRight: 8,
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
  textInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: dynamicScale(12, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    fontSize: dynamicScale(16, false, 0.3),
    color: GlobalStyles.colors.textColor,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    marginBottom: dynamicScale(12, true),
    minHeight: dynamicScale(50, true),
    ...GlobalStyles.strongShadow,
  },
  advancedRow: {
    marginBottom: dynamicScale(12, true),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  advancedText: {
    marginLeft: dynamicScale(8, false, 0.3),
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.textColor,
  },
  currencyContainer: {
    maxWidth: "100%",
    marginBottom: dynamicScale(8, true),
  },
  countryContainer: {
    maxWidth: "100%",
    marginBottom: dynamicScale(8, true),
  },
  dateContainer: {
    marginBottom: dynamicScale(16, true),
  },
  fieldLabel: {
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.textColor,
    marginLeft: dynamicScale(4, false, 0.3),
    marginBottom: dynamicScale(4, true),
  },
});

export default GetLocalPriceButton;
