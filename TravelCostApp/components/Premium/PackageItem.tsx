import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Purchases from "react-native-purchases";
import { useNavigation } from "@react-navigation/native";
import { ENTITLEMENT_ID } from "../Premium/PremiumConstants";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import Toast from "react-native-toast-message";

const PackageItem = ({ purchasePackage, setIsPurchasing, navigation }) => {
  const {
    product: { title, description, priceString },
  } = purchasePackage;

  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { customerInfo, productIdentifier } =
        await Purchases.purchasePackage(purchasePackage);

      console.log(
        "onSelection ~ purchased productIdentifier:",
        productIdentifier
      );

      if (
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        navigation.pop();
        Toast.show({
          type: "success",
          text1: "Purchase successful",
          text2: "You are now a premium Nomad member",
        });
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert(
          "Error purchasing package",
          e.message + " Please restart the app and try again."
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Pressable
      onPress={onSelection}
      style={({ pressed }) => [
        pressed && GlobalStyles.pressed,
        styles.container,
        GlobalStyles.strongShadow,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.terms}>{description}</Text>
      <Text style={styles.title}>{priceString}</Text>
    </Pressable>
  );
};

export default PackageItem;

PackageItem.propTypes = {
  purchasePackage: PropTypes.object.isRequired,
  setIsPurchasing: PropTypes.func.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    margin: "2%",
  },
  title: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    fontWeight: "bold",
  },
  terms: {
    color: "darkgrey",
  },
});
