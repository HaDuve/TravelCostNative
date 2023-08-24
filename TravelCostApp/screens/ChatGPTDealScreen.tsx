import { StyleSheet, Text, View, ScrollView, Alert } from "react-native";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import FlatButton from "../components/UI/FlatButton";
import axios from "axios";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import {
  getChatGPT_Response,
  GPT_RequestType,
  GPT_getGoodDeal,
} from "../util/chatGPTrequest";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { GlobalStyles } from "../constants/styles";
import { Image } from "react-native";
import InfoButton from "../components/UI/InfoButton";

const GPTDealScreen = ({ route, navigation }) => {
  const { price, currency, country, product } = route.params;

  // useState isFetching
  const [isFetching, setIsFetching] = React.useState(true);
  const [answer, setAnswer] = React.useState("- no answer yet -");

  useEffect(() => {
    async function getGoodDeal() {
      setIsFetching(true);
      try {
        const goodDeal: GPT_getGoodDeal = {
          requestType: GPT_RequestType.getGoodDeal,
          product: product,
          price: price,
          currency: currency,
          country: country,
        };
        const response = await getChatGPT_Response(goodDeal);
        if (response) setAnswer(response.content);
      } catch (error) {
        console.error(error);
        setAnswer("Error: " + error);
      }
      setIsFetching(false);
    }
    getGoodDeal();
    console.log("GPTDealScreen ~ product:", product);
    console.log("GPTDealScreen ~ country:", country);
    console.log("GPTDealScreen ~ currency:", currency);
    console.log("GPTDealScreen ~ price:", price);
  }, [country, currency, price, product]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={[styles.image, GlobalStyles.shadowGlowPrimary]}>
          <Image
            source={require("../assets/chatgpt-logo.jpeg")}
            style={{ width: 40, height: 40 }}
          />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.titleText}>{i18n.t("askChatGptTitle")}</Text>
          <InfoButton
            onPress={() =>
              Alert.alert(i18n.t("gptInfoTitle"), i18n.t("gptInfoText"))
            }
          ></InfoButton>
        </View>
      </View>

      <View style={[styles.answerContainer, GlobalStyles.strongShadow]}>
        <ScrollView>
          {isFetching && (
            <LoadingBarOverlay
              customText={i18n.t("askingChatGpt")}
            ></LoadingBarOverlay>
          )}
          {!isFetching && <Text style={[styles.answerText]}>{answer}</Text>}
        </ScrollView>
      </View>
      <View style={styles.buttonContainer}>
        <FlatButton onPress={() => navigation.pop()}>
          {i18n.t("back")}
        </FlatButton>
      </View>
    </View>
  );
};

export default GPTDealScreen;

GPTDealScreen.propTypes = {
  route: PropTypes.object,
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    paddingTop: 8,
  },
  headerContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
  answerContainer: {
    flex: 4,
    margin: 20,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
  },
  titleText: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
  },
  answerText: {
    fontSize: 16,
    fontWeight: "300",
    fontStyle: "italic",
    marginHorizontal: 20,
    color: GlobalStyles.colors.primaryGrayed,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
});
