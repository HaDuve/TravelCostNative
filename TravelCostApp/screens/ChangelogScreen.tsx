import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import BackButton from "../components/UI/BackButton";
import { GlobalStyles } from "../constants/styles";
import axios from "axios";
import safeLogError from "../util/error";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import DrawerCollapsedItem from "react-native-paper/lib/typescript/src/components/Drawer/DrawerCollapsedItem";
import Constants from "expo-constants";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { fetchChangelog } from "../util/http";
import { VersionCheckResponse, versionCheck } from "../util/version";
import InfoButton from "../components/UI/InfoButton";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { parseChangelog } from "../util/parseChangelog";
import { TouchableRipple } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

function renderChangelogItem(item) {
  return (
    <View style={[styles.changelogContainer, GlobalStyles.strongShadow]}>
      <Text style={styles.changelogText}>
        {item.item.versionString}
        {item.item.changes} {"\n"}
      </Text>
    </View>
  );
}

const ChangelogScreen = () => {
  const [isFetching, setIsFetching] = useState(true);
  const [changelogText, setChangelogText] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showNewChanges, setShowNewChanges] = useState(true);
  const [showOldChanges, setShowOldChanges] = useState(false);

  const formatStringStart = "__Newest Changes:";
  const formatStringEnd = "__Other Changes:";
  const canBeFormattedIndex = changelogText.indexOf(formatStringStart);

  let formattedTextNew = "";
  let formattedTextOld = "";
  if (canBeFormattedIndex !== -1) {
    const endOfNewIndex = changelogText.indexOf(formatStringEnd);
    formattedTextNew = changelogText.slice(
      canBeFormattedIndex + 2,
      endOfNewIndex
    );
    // const index1 = formattedTextNew.indexOf("\n");
    // const index2 = formattedTextNew.indexOf("\n", formatStringStart.length + 1);
    // const newestVersion = formattedTextNew.slice(index1, index2).trim();
    formattedTextOld = changelogText.slice(endOfNewIndex + 2);
  } else {
    formattedTextOld = changelogText;
  }
  const parsedNewChanges = parseChangelog(formattedTextNew);
  const parsedOldChanges = parseChangelog(formattedTextOld);

  useEffect(() => {
    async function setLog() {
      try {
        const changelogText = await fetchChangelog();
        setMMKVString("changelog.txt", changelogText);
        setChangelogText(changelogText); //.replaceAll("- ", "\n • "));
        const versionCheckResponse: VersionCheckResponse = await versionCheck();
        if (versionCheckResponse)
          setCurrentVersion(versionCheckResponse.currentVersion);
        setIsFetching(false);
      } catch (error) {
        const fallBackChangelog = getMMKVString("changelog.txt");
        if (fallBackChangelog) {
          setChangelogText(changelogText); //.replaceAll("- ", "\n • "));
          setIsFetching(false);
        }
      }
    }
    setLog();
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
      <View style={[styles.headerContainer]}>
        <BackButton style={{ padding: 12 }} />
        <Text style={GlobalStyles.titleText}>Budget for Nomads Changelog</Text>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowNewChanges(!showNewChanges);
        }}
        style={({ pressed }) => [
          styles.changelogContainer,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        <Text style={styles.subHeaderText}>Whats new?</Text>
      </Pressable>
      {showNewChanges && (
        <Animated.FlatList
          entering={FadeInUp}
          data={parsedNewChanges}
          renderItem={renderChangelogItem}
        ></Animated.FlatList>
      )}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowOldChanges(!showOldChanges);
        }}
        style={({ pressed }) => [
          styles.changelogContainer,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        <Text style={styles.subHeaderText}>Other Changes</Text>
      </Pressable>
      {showOldChanges && (
        <Animated.FlatList
          entering={FadeInUp}
          data={parsedOldChanges}
          renderItem={renderChangelogItem}
        ></Animated.FlatList>
      )}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowInfo(!showInfo);
        }}
        style={({ pressed }) => [
          styles.changelogContainer,
          GlobalStyles.shadowGlowPrimary,
          { alignItems: "center", justifyContent: "space-between" },
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        {currentVersion && (
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.subHeaderText}>
              My current version: {currentVersion}
            </Text>
            <View
              style={{
                paddingHorizontal: 14,
              }}
            >
              <InfoButton
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowInfo(!showInfo);
                }}
              ></InfoButton>
            </View>
          </View>
        )}
        {showInfo && (
          <Animated.View entering={FadeInUp}>
            <Text style={[{ marginTop: 12 }, styles.changelogText]}>
              The number after the last dot indicate minipatches that are
              applied automatically, eg.: {currentVersion}.XX
            </Text>
          </Animated.View>
        )}
      </Pressable>
      <View style={{ minHeight: 24 }}></View>
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
  headerContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
  },
  changelogContainer: {
    margin: 12,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
  },
  changelogText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
  },
  subHeaderText: {
    textAlign: "center",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
  },
});
