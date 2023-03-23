import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Purchases from "react-native-purchases";
import { useNavigation } from "@react-navigation/native";
import { ENTITLEMENT_ID } from "../Premium/PremiumConstants";
import { GlobalStyles } from "../../constants/styles";

const PackageItem = ({ purchasePackage, setIsPurchasing }) => {
  const {
    product: { title, description, priceString },
  } = purchasePackage;

  const navigation = useNavigation();

  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { purchaserInfo } = await Purchases.purchasePackage(
        purchasePackage
      );

      if (
        typeof purchaserInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        navigation.goBack();
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Error purchasing package", e.message);
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
