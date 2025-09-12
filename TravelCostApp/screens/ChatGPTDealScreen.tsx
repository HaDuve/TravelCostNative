import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  ViewStyle,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Markdown, { MarkdownProps } from "react-native-markdown-display";
import React, { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import FlatButton from "../components/UI/FlatButton";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import {
  getChatGPT_Response,
  GPT_RequestType,
  GPT_getGoodDeal,
  GPT_getPrice,
} from "../util/chatGPTrequest";
import { GlobalStyles } from "../constants/styles";
import { Image } from "react-native";
import InfoButton from "../components/UI/InfoButton";
import GradientButton from "../components/UI/GradientButton";
import { dynamicScale } from "../util/scalingUtil";
import { NetworkContext } from "../store/network-context";
import Toast from "react-native-toast-message";

const GPTDealScreen = ({ route, navigation }) => {
  const { price, currency, country, product } = route.params;

  const markdownStyles: MarkdownProps["style"] = {
    body: {
      color: GlobalStyles.colors.textColor,
      fontSize: dynamicScale(14, false, 0.3),
      fontWeight: "300",
      lineHeight: dynamicScale(20, true),
    },
    heading1: {
      fontSize: dynamicScale(18, false, 0.3),
      fontWeight: "bold",
      marginBottom: dynamicScale(4, true),
      color: GlobalStyles.colors.textColor,
    },
    heading2: {
      fontSize: dynamicScale(16, false, 0.3),
      fontWeight: "bold",
      marginBottom: dynamicScale(4, true),
      color: GlobalStyles.colors.textColor,
    },
    strong: {
      fontWeight: "bold",
      color: GlobalStyles.colors.textColor,
    },
    em: {
      fontStyle: "italic",
      color: GlobalStyles.colors.textColor,
    },
    s: {
      textDecorationLine: "line-through",
      color: GlobalStyles.colors.gray700,
    },
    list_item: {
      marginBottom: dynamicScale(2, true),
    },
    bullet_list: {
      marginBottom: dynamicScale(4, true),
    },
    ordered_list: {
      marginBottom: dynamicScale(4, true),
    },
    blockquote: {
      backgroundColor: GlobalStyles.colors.gray500,
      borderLeftWidth: 3,
      borderLeftColor: GlobalStyles.colors.primary500,
      paddingLeft: dynamicScale(8, false, 0.5),
      marginLeft: dynamicScale(4, false, 0.5),
      fontStyle: "italic",
    },
    table: {
      borderWidth: 1,
      borderColor: GlobalStyles.colors.primaryGrayed,
      marginVertical: dynamicScale(4, true),
    },
    th: {
      backgroundColor: GlobalStyles.colors.gray500,
      fontWeight: "bold",
      padding: dynamicScale(4, false, 0.5),
    },
    td: {
      padding: dynamicScale(4, false, 0.5),
    },
    hr: {
      backgroundColor: GlobalStyles.colors.primaryGrayed,
      height: 1,
      marginVertical: dynamicScale(8, true),
    },
    link: {
      color: GlobalStyles.colors.primary500,
      textDecorationLine: "underline",
    },
  };

  // useState isFetching
  const [isFetching, setIsFetching] = React.useState(true);
  const [answer, setAnswer] = React.useState("- no answer yet -");
  const [streamingBubbles, setStreamingBubbles] = React.useState([]);
  const [currentStreamIndex, setCurrentStreamIndex] = React.useState(0);
  const [isStreaming, setIsStreaming] = React.useState(false);
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
          if (response) {
            setAnswer(response.content);
            startStreaming(response.content);
          }
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
        if (response && response.content) {
          setAnswer(response.content);
          startStreaming(response.content);
        }
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

  const startStreaming = (content) => {
    console.log("startStreaming ~ content:", content);
    // Split content into logical sections by double newlines or major headings
    const sections = content.split(/\n\s*\n/).filter((section) => {
      const trimmed = section.trim();
      // Filter out empty sections, sections with only punctuation, or very short content
      return (
        trimmed !== "" && trimmed.length > 3 && !/^[.,!?;:\s-]+$/.test(trimmed)
      );
    });
    setStreamingBubbles([]);
    setCurrentStreamIndex(0);
    setIsStreaming(true);

    sections.forEach((section, index) => {
      setTimeout(() => {
        setStreamingBubbles((prev) => [...prev, section.trim()]);
        if (index === sections.length - 1) {
          setIsStreaming(false);
        }
      }, index * 2000); // 2 second delay between sections
    });
  };

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
      if (response) {
        setAnswer(response.content);
        startStreaming(response.content);
      }
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
          <Text style={styles.titleText}>{i18n.t("getLocalPriceTitle")}</Text>
          <InfoButton
            containerStyle={{ marginLeft: dynamicScale(4, false, 0.5) }}
            onPress={() =>
              Alert.alert(i18n.t("gptInfoTitle"), i18n.t("gptInfoText"))
            }
          ></InfoButton>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={[styles.answerContainer, GlobalStyles.strongShadow]}>
          <ScrollView contentContainerStyle={styles.chatContainer}>
            {/* User Query Bubble - Always Show */}
            <View style={styles.userBubbleContainer}>
              <View style={[styles.userBubble, GlobalStyles.shadowGlowPrimary]}>
                <Text style={styles.userBubbleText}>
                  {price && price !== "" && !isNaN(Number(price))
                    ? `Is ${price} ${currency} a good deal for "${product.trim()}" in ${country}?`
                    : `Get local price for "${product.trim()}" in ${country}`}
                </Text>
              </View>
            </View>

            {/* Streaming AI Response Bubbles */}
            {streamingBubbles.map((line, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.aiBubbleContainer,
                  index === streamingBubbles.length - 1 && {
                    marginBottom: dynamicScale(30, true),
                  },
                ]}
                entering={FadeInUp.delay(200).duration(500)}
              >
                <Image
                  source={require("../assets/chatgpt-logo.jpeg")}
                  style={styles.aiAvatar}
                />
                <View style={[styles.aiBubble, GlobalStyles.strongShadow]}>
                  <Markdown style={markdownStyles}>{line}</Markdown>
                </View>
              </Animated.View>
            ))}

            {/* Typing Indicator */}
            {isFetching && (
              <View style={styles.aiBubbleContainer}>
                <Image
                  source={require("../assets/chatgpt-logo.jpeg")}
                  style={styles.aiAvatar}
                />
                <View style={[styles.typingBubble, GlobalStyles.strongShadow]}>
                  <Text style={styles.typingText}>●●●</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
        <View style={styles.buttonContainer}>
          <FlatButton
            onPress={() => navigation.pop()}
            textStyle={{ fontSize: 16 }}
          >
            {i18n.t("back")}
          </FlatButton>
          {!isFetching && (
            <GradientButton
              style={[
                Platform.OS == "ios" && { paddingHorizontal: 20 },
                { elevation: 0 },
              ]}
              onPress={handleRegenerate}
              buttonStyle={{ padding: 8, paddingHorizontal: 12 }}
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
    margin: dynamicScale(4, false, 0.5),
    paddingTop: dynamicScale(4, false, 0.5),
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
    flex: 6,
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
  chatContainer: {
    padding: dynamicScale(8, false, 0.5),
    paddingVertical: dynamicScale(4, true),
    paddingBottom: dynamicScale(80, true), // Add extra padding at bottom for button container
    flexGrow: 1,
  },
  userBubbleContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: dynamicScale(12, true),
  },
  userBubble: {
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: dynamicScale(20, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(12, true),
    maxWidth: "80%",
    borderBottomRightRadius: dynamicScale(4, false, 0.5),
  },
  userBubbleText: {
    color: GlobalStyles.colors.backgroundColor,
    fontSize: dynamicScale(14, false, 0.3),
    fontWeight: "400",
  },
  aiBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: dynamicScale(12, true),
  },
  aiAvatar: {
    width: dynamicScale(24, false, 0.5),
    height: dynamicScale(24, false, 0.5),
    borderRadius: dynamicScale(12, false, 0.5),
    marginRight: dynamicScale(8, false, 0.5),
    marginTop: dynamicScale(4, true),
  },
  aiBubble: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(12, true),
    maxWidth: "80%",
    borderBottomLeftRadius: dynamicScale(4, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
  },
  aiBubbleText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(14, false, 0.3),
    fontWeight: "300",
    lineHeight: dynamicScale(20, true),
  },
  typingBubble: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(12, true),
    maxWidth: "80%",
    borderBottomLeftRadius: dynamicScale(4, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
  },
  typingText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(16, false, 0.3),
    fontWeight: "300",
    textAlign: "center",
  },
});
