import { StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

const Discount = ({ discountPercentage, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.discountText}>
        Save {discountPercentage}% to Monthly!
      </Text>
    </View>
  );
};

export default Discount;

const styles = StyleSheet.create({
  container: {
    borderWidth: 4,
    borderColor: GlobalStyles.colors.cat1,
    borderRadius: 10,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    //rotate
    transform: [{ rotate: "22deg" }],
    padding: 4,
    position: "absolute",
    top: "-40%",
    left: "41%",
  },
  discountText: {
    color: GlobalStyles.colors.cat1,
    fontSize: 20,
    fontWeight: "bold",
  },
});
