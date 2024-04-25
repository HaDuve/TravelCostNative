import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import React, { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import FlatButton from "../components/UI/FlatButton";
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
  GPT_getPrice,
} from "../util/chatGPTrequest";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { GlobalStyles } from "../constants/styles";
import { Image } from "react-native";
import InfoButton from "../components/UI/InfoButton";
import GradientButton from "../components/UI/GradientButton";
import BlurPremium from "../components/Premium/BlurPremium";
import { dynamicScale } from "../util/scalingUtil";
import { NetworkContext } from "../store/network-context";
import Toast from "react-native-toast-message";

const GPTDealScreen = ({ route, navigation }) => {
  const { price, currency, country, product } = route.params;

  // useState isFetching
  const [isFetching, setIsFetching] = React.useState(true);
  const [answer, setAnswer] = React.useState("- no answer yet -");
  const { isConnected, strongConnection } = useContext(NetworkContext);
  const isOnline = isConnected && strongConnection;

  useEffect(() => {
    async function getGPT_Response() {
      setIsFetching(true);
      if (!price || price === "" || isNaN(Number(price))) {
        // console.log("GPTDealScreen ~no price:", price);
        try {
          const getPrice: GPT_getPrice = {
            requestType: GPT_RequestType.getPrice,
            product: product,
            currency: currency,
            country: country,
          };
          const response = await getChatGPT_Response(getPrice);
          if (response) setAnswer(response.content);
        } catch (error) {
          console.error(error);
          Toast.show({
            type: "error",
            text1: "Chat GPT Error",
            text2: error,
          });
          navigation.pop();
        }
        setIsFetching(false);
        return;
      }
      try {
        const goodDeal: GPT_getGoodDeal = {
          requestType: GPT_RequestType.getGoodDeal,
          product: product,
          price: price,
          currency: currency,
          country: country,
        };
        const response = await getChatGPT_Response(goodDeal);
        if (response && response.content) setAnswer(response.content);
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Chat GPT Error",
          text2: error,
        });
        navigation.pop();
      }
      setIsFetching(false);
    }
    if (!isOnline) {
      Toast.show({
        type: "error",
        text1: "Chat GPT Error",
        text2: "No Internet connection. Please try again later",
      });
      navigation.pop();
      return;
    }
    getGPT_Response();
  }, [country, currency, price, product]);

  async function handleRegenerate() {
    // regenerate getGoodDeal and set new answer
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
      Toast.show({
        type: "error",
        text1: "Chat GPT Error",
        text2: error,
      });
      navigation.pop();
    }
    setIsFetching(false);
  }
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={[styles.image, GlobalStyles.shadowGlowPrimary]}>
          <Image
            source={require("../assets/chatgpt-logo.jpeg")}
            style={{
              width: dynamicScale(40, false, 0.5),
              height: dynamicScale(40, false, 0.5),
            }}
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

      <View style={styles.contentContainer}>
        <View style={[styles.answerContainer, GlobalStyles.strongShadow]}>
          <ScrollView>
            {isFetching && (
              <View
                style={[styles.loadingContainer, GlobalStyles.strongShadow]}
              >
                <LoadingBarOverlay
                  customText={i18n.t("askingChatGpt")}
                ></LoadingBarOverlay>
              </View>
            )}
            {!isFetching && <Text style={[styles.answerText]}>{answer}</Text>}
          </ScrollView>
        </View>
        <View style={styles.buttonContainer}>
          <FlatButton onPress={() => navigation.pop()}>
            {i18n.t("back")}
          </FlatButton>
          {!isFetching && (
            <GradientButton
              style={[
                Platform.OS == "ios" && { paddingHorizontal: 20 },
                { elevation: 0 },
              ]}
              onPress={handleRegenerate}
            >
              Regenerate
            </GradientButton>
          )}
        </View>
        {/* <BlurPremium canBack /> */}
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
    width: dynamicScale(60, false, 0.5),
    height: dynamicScale(60, false, 0.5),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(4, false, 0.5),
    paddingTop: dynamicScale(8, false, 0.5),
  },
  headerContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
  answerContainer: {
    flex: 4,
    margin: dynamicScale(20, false, 0.5),
    // padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
  },
  loadingContainer: {
    margin: dynamicScale(20, false, 0.5),
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    marginTop: dynamicScale(4, false, 0.5),
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
  },
  contentContainer: {
    flex: 4,
    marginHorizontal: "2%",
  },
  answerText: {
    padding: dynamicScale(20, false, 0.5),
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    fontStyle: "italic",
    marginHorizontal: dynamicScale(20, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
  },
});
