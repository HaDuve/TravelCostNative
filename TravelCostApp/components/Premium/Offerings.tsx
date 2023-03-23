import React, { StyleSheet, Text, View } from "react-native";
import { useEffect, useState, useContext } from "react";
import LoadingOverlay from "../UI/LoadingOverlay";
import Purchases from "react-native-purchases";
import { UserContext } from "../../store/user-context";
import PaywallScreen from "./PayWall";

const Offerings = () => {
  const [isFetching, setIsFetching] = useState(true);
  const [offering, setOffering] = useState(null);
  const userCtx = useContext(UserContext);
  useEffect(() => {
    async function fetchOfferings() {
      setIsFetching(true);
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
          console.log("fetchOfferings ~ offerings.current:", offerings.current);
          setOffering(offerings.current);
        } else {
          console.log("fetchOfferings ~ offerings.current:", offerings.current);
          console.log(
            "fetchOfferings ~ offerings.current.availablePackages.length:",
            offerings.current.availablePackages.length
          );
        }
      } catch (error) {
        console.error(error);
      }
      setIsFetching(false);
    }
    fetchOfferings();
  }, [userCtx.isOnline]);

  if (isFetching) {
    return <LoadingOverlay></LoadingOverlay>;
  }
  return (
    <View style={styles.container}>

      <PaywallScreen></PaywallScreen>
    </View>
  );
};

export default Offerings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
