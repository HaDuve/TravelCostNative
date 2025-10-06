import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//Localization

import { ActivityIndicator } from "react-native-paper";
import Purchases from "react-native-purchases";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { constantScale } from "../../util/scalingUtil";
import { trackEvent, VexoEvents } from "../../util/vexo-tracking";
import PackageItem from "../Premium/PackageItem";
import BackgroundGradient from "../UI/BackgroundGradient";
import FlatButton from "../UI/FlatButton";
import IconButton from "../UI/IconButton";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";

const PaywallScreen = ({ navigation }) => {
  // - State for all available package
  const [packages, setPackages] = useState([]);

  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);

  // state for show EULA
  const [showEULA, setShowEULA] = useState(false);

  useEffect(() => {
    // Track paywall viewed
    trackEvent(VexoEvents.PAYWALL_VIEWED);

    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages?.length !== 0
        ) {
          // log available packages duration
          // console.log(
          //   offerings.current.availablePackages[0].product.subscriptionPeriod
          // );
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        Alert.alert(i18n.t("errorGetOffers"), i18n.t("errorGetOffersText"));
      }
    };

    getPackages();
  }, []);

  const header = () => (
    <View>
      {/* <BackButton></BackButton> */}
      <FlatButton
        textStyle={styles.backButtonTextStyle}
        onPress={() => navigation.pop()}
      >
        {i18n.t("back")}
      </FlatButton>
      <View
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          margin: "2%",
          // marginBottom: "-28%",
        }}
      >
        {/* Image of icon2.png scaled to 10% of screenheight */}
        {/* <Image
          source={require("../../assets/icon2.png")}
          style={[
            {
              width: "40%",
              height: "40%",
              resizeMode: "contain",
              margin: "2%",
              marginTop: "-4%",
            },
            { overflow: "visible" },
          ]}
        /> */}
        {isPurchasing && (
          <ActivityIndicator
            size={"large"}
            color={GlobalStyles.colors.backgroundColor}
          />
        )}
      </View>
      <Text style={[styles.headerTitleText, GlobalStyles.shadow]}>
        {i18n.t("paywallTitle")}
      </Text>
      <Text style={styles.headerSubtitleText}>
        {`${i18n.t("paywallSubtitle")}\n\n`}
      </Text>
      <View style={styles.featureContainer}>
        <Text style={styles.featureText}>
          {`${i18n.t("paywallFeature0")}\n${i18n.t(
            "paywallFeature1"
          )}\n${i18n.t("paywallFeature2")}\n${
            // i18n.t("paywallFeature3") +
            // "\n" +
            // i18n.t("paywallFeature4") +
            // "\n" +
            i18n.t("paywallFeature5")
          }`}
        </Text>
        {/*  +
          "\n\n" +
        i18n.t("paywallFeature6")} */}
      </View>
      {packages.length === 0 && (
        <LoadingBarOverlay
          containerStyle={{ backgroundColor: "transparent" }}
        ></LoadingBarOverlay>
      )}
    </View>
  );

  const footer = () => {
    // // console.log(
    //   "Modify this value to reflect your app's Privacy Policy and Terms & Conditions agreements. Required to make it through App Review."
    // );
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          {/* <Text style={styles.footerText}>
            By purchasing, you agree to the{" "}
          </Text> */}
          <TouchableOpacity
            onPress={async () => {
              Linking.openURL(
                "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              );
            }}
          >
            <Text style={[styles.footerText, { color: "blue" }]}>
              {i18n.t("paywallToS")}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>{"&  "}</Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://foodfornomads.com/budget-for-nomads_privacy-policy/"
              )
            }
          >
            <Text style={[styles.footerText, { color: "blue" }]}>
              {i18n.t("paywallPP")}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <Pressable
            onPress={() => setShowEULA(!showEULA)}
            style={{ marginTop: 10 }}
          >
            <IconButton
              icon={showEULA ? "chevron-up" : "chevron-down"}
              onPress={() => setShowEULA(!showEULA)}
            ></IconButton>
            {showEULA && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={{ borderWidth: 1, padding: "4%", margin: "4%" }}
              >
                <Text>{i18n.t("paywallLegal1")}</Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <>
      <BackgroundGradient
        colors={GlobalStyles.gradientColors}
        style={styles.container}
      >
        <FlatList
          data={packages}
          renderItem={({ item }) => (
            <PackageItem
              purchasePackage={item}
              setIsPurchasing={setIsPurchasing}
              navigation={navigation}
            />
          )}
          keyExtractor={item => item.identifier}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={styles.headerFooterContainer}
          ListFooterComponent={footer}
          ListFooterComponentStyle={styles.headerFooterContainer}
        />

        {isPurchasing && <View style={styles.overlay} />}
      </BackgroundGradient>
    </>
  );
};

export default PaywallScreen;

const styles = StyleSheet.create({
  backButtonTextStyle: {
    color: GlobalStyles.colors.accent250,
    fontSize: constantScale(16, 0.5),
    fontWeight: "bold",
    textAlign: "left",
  },
  container: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    justifyContent: "center",
    overflow: "visible",
  },
  featureContainer: {
    // paddingHorizontal: "4%",
    marginBottom: "6%",
    // paddingVertical: "1%",
    // borderWidth: 1,
    // borderColor: GlobalStyles.colors.primary700,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    overflow: "visible",
  },
  featureText: {
    fontSize: constantScale(18, 0.5),
    fontWeight: "300",
    paddingHorizontal: "4%",
    textAlign: "center",
    // marginBottom: "6%",
  },
  footerText: {
    // center text
    textAlign: "center",
    // text color
    color: GlobalStyles.colors.primary700,
    // text size
    fontSize: constantScale(12, 0.5),
  },
  headerFooterContainer: {
    paddingVertical: constantScale(20, 0.5),
  },
  headerSubtitleText: {
    fontSize: constantScale(18, 0.5),
    fontWeight: "300",
    paddingHorizontal: "4%",
    textAlign: "center",
    // marginBottom: "6%",
  },
  headerTitleText: {
    fontSize: constantScale(32, 0.5),
    // paddingHorizontal: "4%",
    marginTop: "-5%",
    marginBottom: "6%",
    fontWeight: "bold",
    textAlign: "center",
    color: GlobalStyles.colors.primary700,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  text: {
    fontSize: constantScale(20, 0.5),
    margin: constantScale(10, 0.5),
    textAlign: "center",
  },
});
