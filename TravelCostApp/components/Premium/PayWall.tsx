import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, StyleSheet } from "react-native";
import Purchases from "react-native-purchases";
import { GlobalStyles } from "../../constants/styles";
import PackageItem from "../Premium/PackageItem";
import BackgroundGradient from "../UI/BackgroundGradient";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";

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
      <View>
        <Text style={[styles.text, { padding: 44 }]}>Image Placeholder</Text>
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
        <View style={{ margin: "2%" }}>
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
        colors={["#FEEF60", "#FBF0A8", "#A1D8C1"]}
        style={styles.container}
      >
        <FlatList
          data={packages}
          renderItem={({ item }) => (
            <PackageItem
              purchasePackage={item}
              setIsPurchasing={setIsPurchasing}
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
    padding: 24,
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
