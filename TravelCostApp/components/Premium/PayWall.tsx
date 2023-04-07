import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import Purchases from "react-native-purchases";
import { GlobalStyles } from "../../constants/styles";
import PackageItem from "../Premium/PackageItem";
import BackgroundGradient from "../UI/BackgroundGradient";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";
import LoadingOverlay from "../UI/LoadingOverlay";
import PropTypes from "prop-types";

const PaywallScreen = ({ navigation }) => {
  // - State for all available package
  const [packages, setPackages] = useState([]);

  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
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
          justifyContent: "center",
          margin: "2%",
        }}
      >
        {/* Image of icon2.png scaled to 10% of screenheight */}
        <Image
          source={require("../../assets/icon2.png")}
          style={[
            {
              width: "40%",
              height: "40%",
              resizeMode: "contain",
              margin: "2%",
            },
            GlobalStyles.shadowPrimary,
            { overflow: "visible" },
          ]}
        />
        {isPurchasing && (
          <ActivityIndicator
            size={"large"}
            color={GlobalStyles.colors.backgroundColor}
          />
        )}
      </View>
      <Text style={styles.headerTitleText}>Go Pro!</Text>
      <Text style={styles.headerSubtitleText}>
        Enjoy customizable Categories, Alerts, personalized budgeting Advice and
        advanced Reports and Analytics.
      </Text>
    </View>
  );

  const footer = () => {
    // console.warn(
    //   "Modify this value to reflect your app's Privacy Policy and Terms & Conditions agreements. Required to make it through App Review."
    // );
    return (
      <View>
        <View style={{ margin: "2%", marginBottom: "4%" }}>
          <Text style={styles.footerText}>
            By purchasing, you agree to the Terms of Use and Privacy Policy.
          </Text>
        </View>
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
    fontSize: 64,
    padding: "2%",
    fontWeight: "bold",
    textAlign: "center",
    color: GlobalStyles.colors.primary700,
  },
  headerSubtitleText: {
    fontSize: 22,
    fontWeight: "300",
    textAlign: "center",
    paddingHorizontal: 24,
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
