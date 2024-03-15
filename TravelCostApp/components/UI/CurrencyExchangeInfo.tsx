import { Alert, AlertButton, StyleSheet, Text } from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { TouchableOpacity } from "react-native-gesture-handler";
import { getRate } from "../../util/currencyExchange";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { NetworkContext } from "../../store/network-context";
import { GlobalStyles } from "../../constants/styles";
import { formatExpenseWithCurrency } from "../../util/string";
import { getMMKVString } from "../../store/mmkv";
import { isPremiumMember } from "../Premium/PremiumConstants";
import { useNavigation } from "@react-navigation/native";

const CurrencyExchangeInfo = () => {
  const [currentRate, setCurrentRate] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected;
  const navigation = useNavigation();

  const getCurrentRate = useCallback(
    async (forceRefresh = false) => {
      const rate = await getRate(
        tripCtx.tripCurrency,
        userCtx.lastCurrency,
        forceRefresh
      );
      setCurrentRate(rate);
    },
    [tripCtx.tripCurrency, userCtx.lastCurrency]
  );

  useEffect(() => {
    if (!isConnected) return;
    getCurrentRate(false);
  }, [getCurrentRate, isConnected, tripCtx.tripCurrency, userCtx.lastCurrency]);
  async function getLastUpdateTime() {
    const lastUpdate = getMMKVString("currencyExchange_lastUpdate");
    // return as a formatted date with hour time
    if (lastUpdate) {
      const date = new Date(lastUpdate);
      return date.toLocaleString();
    }
    return lastUpdate;
  }
  const PressHandler = async () => {
    if (isFetching) return;
    setIsFetching(true);
    const lastUpdate = await getLastUpdateTime();
    if (!lastUpdate) {
      setIsFetching(false);
      return;
    }
    Alert.alert(
      "Last Update",
      `We got the latest currency exchange rate from ${lastUpdate}`,
      [
        {
          text: i18n.t("confirm"),
          onPress: () => setIsFetching(false),
          style: "cancel",
        } as AlertButton,
        {
          text: "Refresh",
          onPress: async () => {
            if (!(await isPremiumMember())) {
              navigation.navigate("Paywall");
              return;
            }
            setIsFetching(false);
            await getCurrentRate(true);
            navigation.pop();
          },
        } as AlertButton,
      ]
    );
  };
  const rateUneqal1 = currentRate && currentRate != 1 && currentRate != -1;
  if (!rateUneqal1) return <></>;
  return (
    <TouchableOpacity disabled={isFetching} onPress={PressHandler}>
      <Text style={[styles.textButton]}>
        {i18n.t("currencyLabel")}:{" "}
        {formatExpenseWithCurrency(1, tripCtx.tripCurrency)} ={" "}
        {formatExpenseWithCurrency(currentRate, userCtx.lastCurrency)}
      </Text>
    </TouchableOpacity>
  );
};

export default CurrencyExchangeInfo;

const styles = StyleSheet.create({
  textButton: {
    marginTop: "8%",
    paddingVertical: "2%",
    paddingHorizontal: "8%",
    borderRadius: 16,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
});
