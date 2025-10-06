import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import PropTypes from "prop-types";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import BackButton from "../components/UI/BackButton";
import InfoButton from "../components/UI/InfoButton";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { GlobalStyles } from "../constants/styles";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import safeLogError from "../util/error";
import { fetchChangelog } from "../util/http";
import { VersionCheckResponse, versionCheck } from "../util/version";
import { parseChangelog } from "../util/parseChangelog";
import { constantScale } from "../util/scalingUtil";

//Localization

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

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

const ChangelogScreen = ({ navigation }) => {
  const { strongConnection } = useContext(NetworkContext);
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
    formattedTextOld = changelogText.slice(endOfNewIndex + 2);
  } else {
    formattedTextOld = changelogText;
  }
  const parsedNewChanges = parseChangelog(formattedTextNew);
  const parsedOldChanges = parseChangelog(formattedTextOld);

  const setStoredChangelog = useCallback(() => {
    const fallBackChangelog = getMMKVString("changelog.txt");
    if (fallBackChangelog) {
      setChangelogText(fallBackChangelog); //.replaceAll("- ", "\n • "));
    }
    const fallBackVersion = getMMKVString("currentVersion");
    if (fallBackVersion) {
      setCurrentVersion(fallBackVersion);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    async function setNewChangelog() {
      try {
        const newChangelogText = await fetchChangelog();
        setMMKVString("changelog.txt", newChangelogText);
        setChangelogText(newChangelogText); //.replaceAll("- ", "\n • "));
        const versionCheckResponse: VersionCheckResponse = await versionCheck();
        if (versionCheckResponse) {
          setCurrentVersion(versionCheckResponse.currentVersion);
          setMMKVString("currentVersion", versionCheckResponse.currentVersion);
        }
        setIsFetching(false);
      } catch (error) {
        safeLogError(error);
        setStoredChangelog();
      }
    }
    setStoredChangelog();
    if (strongConnection && (!changelogText || changelogText.length < 1)) {
      setNewChangelog();
      return;
    }
  }, [changelogText, strongConnection, navigation, setStoredChangelog]);

  if (isFetching) {
    return (
      <ScrollView style={styles.container}>
        <BackButton style={{ marginTop: -20, marginBottom: 0, padding: 4 }} />
        <LoadingBarOverlay
          customText={i18n.t("loadingChangelog")}
        ></LoadingBarOverlay>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton style={{ padding: constantScale(12, 0.5) }} />
        <Text style={GlobalStyles.titleText}>{i18n.t("appChanges")}</Text>
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
        <Text style={styles.subHeaderText}>{i18n.t("whatsNew")}</Text>
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
        <Text style={styles.subHeaderText}>{i18n.t("otherChanges")}</Text>
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
                containerStyle={{}}
              ></InfoButton>
            </View>
          </View>
        )}
        {showInfo && (
          <Animated.View entering={FadeInUp}>
            <Text style={[{ marginTop: 12 }, styles.changelogText]}>
              The letter after the last dot indicate mini-updates that are
              applied automatically, eg.: {currentVersion}.x
            </Text>
          </Animated.View>
        )}
      </Pressable>
      <View style={{ minHeight: 24 }}></View>
    </ScrollView>
  );
};

export default ChangelogScreen;

ChangelogScreen.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  changelogContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    margin: constantScale(12, 0.5),
    padding: constantScale(24, 0.5),
    paddingBottom: constantScale(12, 0.5),
    paddingTop: constantScale(12, 0.5),
  },
  changelogText: {
    color: GlobalStyles.colors.textColor,
    fontSize: constantScale(18, 0.5),
    fontWeight: "300" as const,
    lineHeight: constantScale(24, 0.5),
  },
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    padding: "4%",
  },
  headerContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginRight: "27.5%",
  },
  subHeaderText: {
    color: GlobalStyles.colors.textColor,
    fontSize: constantScale(18, 0.5),
    fontWeight: "400" as const,
    lineHeight: constantScale(24, 0.5),
    textAlign: "center",
  },
});
