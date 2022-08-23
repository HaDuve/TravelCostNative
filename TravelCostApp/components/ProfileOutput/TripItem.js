import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { useContext } from "react";
import { TripContext } from "../../store/trip-context";

function TripItem({ id, description, amount, date }) {
  const navigation = useNavigation();

  // const TripCtx = useContext(TripContext);
  // const tripBudget = Number(TripCtx.totalBudget);
  function tripPressHandler() {
    navigation.navigate("Share", {
      tripId: id,
    });
  }

  return (
    <Pressable
      onPress={tripPressHandler}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.tripItem}>
        <View>
          <Text style={[styles.textBase, styles.description]}>
            {description}
          </Text>
          <Text style={styles.textBase}>{date}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{amount}</Text>
          <Progress.Bar
            color={GlobalStyles.colors.primary500}
            unfilledColor={GlobalStyles.colors.gray600}
            borderWidth={0}
            borderRadius={8}
            progress={0.3}
            height={12}
            width={150}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default TripItem;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  tripItem: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: GlobalStyles.colors.gray500,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 6,
    elevation: 3,
    shadowColor: GlobalStyles.colors.gray500,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.4,
  },
  textBase: {
    color: GlobalStyles.colors.primary500,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "bold",
  },
  amountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: 80,
  },
  amount: {
    color: GlobalStyles.colors.primary500,
    fontWeight: "bold",
  },
});
