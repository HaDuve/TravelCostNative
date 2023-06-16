import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Pressable,
} from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { ActivityIndicator } from "react-native-paper";

import Purchases from "react-native-purchases";
import { GlobalStyles } from "../../constants/styles";
import PackageItem from "../Premium/PackageItem";
import BackgroundGradient from "../UI/BackgroundGradient";
import FlatButton from "../UI/FlatButton";
import PropTypes from "prop-types";
import IconButton from "../UI/IconButton";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import ExpensesOutput from "../ExpensesOutput/ExpensesOutput";

const PaywallScreen = ({ navigation }) => {
  // - State for all available package
  const [packages, setPackages] = useState([]);

  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);

  // state for show EULA
  const [showEULA, setShowEULA] = useState(false);

  useEffect(() => {
    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
          // log available packages duration
          console.log(
            offerings.current.availablePackages[0].product.subscriptionPeriod
          );
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        Alert.alert("Error getting offers", e.message);
      }
    };

    getPackages();
  }, []);

  const header = () => (
    <View>
      <FlatButton
        textStyle={styles.backButtonTextStyle}
        onPress={() => navigation.pop()}
      >
        Back
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
            GlobalStyles.shadowPrimary,
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
      <Text style={styles.headerTitleText}>{i18n.t("paywallTitle")}</Text>
      <Text style={styles.headerSubtitleText}>
        {i18n.t("paywallSubtitle") +
          "\n\n" +
          i18n.t("paywallFeature1") +
          "\n" +
          i18n.t("paywallFeature2") +
          "\n" +
          i18n.t("paywallFeature3") +
          "\n" +
          i18n.t("paywallFeature4") +
          "\n" +
          i18n.t("paywallFeature5") +
          "\n\n" +
          i18n.t("paywallFeature6")}
      </Text>
    </View>
  );

  const footer = () => {
    // console.warn(
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
            onPress={() =>
              Linking.openURL(
                "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              )
            }
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
          keyExtractor={(item) => item.identifier}
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

PaywallScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  headerFooterContainer: {
    paddingVertical: 20,
  },
  headerTitleText: {
    fontSize: 32,
    // paddingHorizontal: "4%",
    marginTop: "-5%",
    marginBottom: "6%",
    fontWeight: "bold",
    textAlign: "center",
    color: GlobalStyles.colors.primary700,
  },
  headerSubtitleText: {
    fontSize: 18,
    fontWeight: "300",
    textAlign: "center",
    paddingHorizontal: "4%",
    marginBottom: "12%",
  },
  footerText: {
    // center text
    textAlign: "center",
    // text color
    color: GlobalStyles.colors.primary700,
    // text size
    fontSize: 12,
  },
  backButtonTextStyle: {
    color: GlobalStyles.colors.accent250,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
