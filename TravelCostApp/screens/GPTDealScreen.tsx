import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import FlatButton from "../components/UI/FlatButton";
import axios from "axios";
import { chatGPT_getGoodDeal } from "../util/chatGPTrequest";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { GlobalStyles } from "../constants/styles";

const GPTDealScreen = ({ route, navigation }) => {
  const { price, currency, country, product } = route.params;

  // useState isFetching
  const [isFetching, setIsFetching] = React.useState(true);
  const [answer, setAnswer] = React.useState("- no answer yet -");

  useEffect(() => {
    async function getGoodDeal() {
      setIsFetching(true);
      try {
        const response = await axios.request(
          chatGPT_getGoodDeal(product, price, currency, country)
        );
        console.log(response.data);
        if (response.data.choices[0].message.content) {
          console.log(response.data.choices[0].message.content);
          setAnswer(response.data.choices[0].message.content);
        }
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
        <Text style={styles.titleText}>Ask ChatGPT</Text>
      </View>
      <View style={[styles.answerContainer, GlobalStyles.strongShadow]}>
        {isFetching && (
          <LoadingBarOverlay customText="Asking ChatGPT for a good deal..."></LoadingBarOverlay>
        )}
        {!isFetching && <Text style={[styles.answerText]}>{answer}</Text>}
      </View>
      <View style={styles.buttonContainer}>
        <FlatButton onPress={() => navigation.pop()}>Back</FlatButton>
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
    fontSize: 20,
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
