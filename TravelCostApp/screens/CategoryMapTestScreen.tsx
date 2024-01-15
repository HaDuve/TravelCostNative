import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { TextInput } from "react-native-paper";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import axios from "axios";
import { async } from "../util/tourUtil";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import {
  chatGPT_getGoodDeal,
  chatGPT_getKeywords,
  chatGTPoptions,
} from "../util/chatGPTrequest";
import FlatButton from "../components/UI/FlatButton";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";

const CategoryMapTestScreen = () => {
  // usestate for isFetching
  const [isFetching, setIsFetching] = React.useState(false);
  const [text, setText] = React.useState("Pizza");
  const [answer, setAnswer] = React.useState("- no answer yet -");

  async function getKeywords() {
    setIsFetching(true);
    try {
      const response = await axios.request(chatGPT_getKeywords(text));
      // console.log(response.data);
      if (response.data.choices[0].message.content) {
        // console.log(response.data.choices[0].message.content);
        setAnswer(response.data.choices[0].message.content);
      }
    } catch (error) {
      console.error(error);
    }
    setIsFetching(false);
  }
  async function getGoodDeal() {
    setIsFetching(true);
    try {
      const response = await axios.request(
        chatGPT_getGoodDeal(text, "500", "LKR", "Sri Lanka")
      );
      // console.log(response.data);
      if (response.data.choices[0].message.content) {
        // console.log(response.data.choices[0].message.content);
        setAnswer(response.data.choices[0].message.content);
      }
    } catch (error) {
      console.error(error);
    }
    setIsFetching(false);
  }

  return (
    <ScrollView>
      <Text>CategoryMapTestScreen</Text>
      <TextInput
        label="Email"
        value={text}
        onChangeText={(text) => setText(text)}
      ></TextInput>
      <Text>{answer}</Text>
      {isFetching && <LoadingBarOverlay></LoadingBarOverlay>}
      {!isFetching && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <FlatButton onPress={getKeywords}>getKeyWords</FlatButton>
          <FlatButton onPress={getGoodDeal}>getGoodDeal</FlatButton>
        </View>
      )}
    </ScrollView>
  );
};

export default CategoryMapTestScreen;

const styles = StyleSheet.create({});
