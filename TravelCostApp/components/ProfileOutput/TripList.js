import { FlatList, View } from "react-native";
import TripHistoryItem from "./TripHistoryItem";
import React from "react";
import TripItem from "./TripItem";
import { GlobalStyles } from "../../constants/styles";
import LoadingOverlay from "../UI/LoadingOverlay";

function TripList({ trips, refreshControl, setRefreshing }) {
  if (!trips || trips.length < 1) return <LoadingOverlay></LoadingOverlay>;

  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (typeof itemData.item === "string" || itemData.item instanceof String) {
      return (
        <TripHistoryItem
          setRefreshing={setRefreshing}
          {...{ tripid: itemData.item, trips: trips }}
        />
      );
    }
    return <TripItem {...itemData.item} {...{ trips: trips }} />;
  }
  return (
    <View
      style={{
        flex: 1,
        minHeight: "90%",
        zIndex: -10,
      }}
    >
      <FlatList
        data={trips}
        refreshControl={refreshControl}
        ListFooterComponent={<View style={{ height: 300 }}></View>}
        renderItem={renderTripItem}
        keyExtractor={(item) => {
          if (typeof item === "string" || item instanceof String) return item;
          return item.tripid + item.tripName;
        }}
      />
    </View>
  );
}

export default TripList;
