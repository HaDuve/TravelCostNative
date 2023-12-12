import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import BackButton from "../components/UI/BackButton";
import { GlobalStyles } from "../constants/styles";
import axios from "axios";
import safeLogError from "../util/error";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";

const ChangelogScreen = () => {
  const [isFetching, setIsFetching] = useState(true);
  const [changelogText, setChangelogText] = useState("");
  console.log("ChangelogScreen ~ changelogText:", changelogText);
  const formatStringStart = "__Newest Changes:";
  const formatStringEnd = "__Other Changes:";
  const canBeFormattedIndex = changelogText.indexOf(formatStringStart);
  console.log("ChangelogScreen ~ canBeFormattedIndex:", canBeFormattedIndex);

  let formattedTextNew = "";
  let formattedTextOld = "";
  if (canBeFormattedIndex !== -1) {
    const endOfNewIndex = changelogText.indexOf(formatStringEnd);
    formattedTextNew = changelogText.slice(canBeFormattedIndex, endOfNewIndex);
    console.log("ChangelogScreen ~ formattedTextNew:", formattedTextNew);
    formattedTextOld = changelogText.slice(endOfNewIndex);
    console.log("ChangelogScreen ~ formattedTextOld:", formattedTextOld);
  } else {
    formattedTextOld = changelogText;
  }
  useEffect(() => {
    async function fetchChangelog() {
      try {
        console.log("fetching changelog");
        const response = await axios.get(
          "https://raw.githubusercontent.com/HaDuve/TravelCostNative/main/TravelCostApp/changelog.txt"
        );
        let tempText = "";
        if (response) tempText = response.data;
        setChangelogText(tempText);
        setIsFetching(false);
      } catch (error) {
        safeLogError(error);
      }
    }
    fetchChangelog();
  }, []);

  if (isFetching) {
    return (
      <ScrollView style={styles.container}>
        <BackButton style={{ marginTop: -20, marginBottom: 0, padding: 4 }} />
        <LoadingBarOverlay customText="Loading Changelog"></LoadingBarOverlay>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BackButton style={{ marginTop: -20, marginBottom: 0, padding: 4 }} />
      <Text>{formattedTextNew}</Text>
      <Text>{formattedTextOld}</Text>
    </ScrollView>
  );
};

export default ChangelogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "4%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
