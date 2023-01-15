import { FlatList } from "react-native";
import TripHistoryItem from "./TripHistoryItem";
import React from "react";
import TripItem from "./TripItem";

function TripList({ trips, refreshControl, setRefreshing }) {
  if (!trips) return <></>;

  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (typeof itemData.item === "string" || itemData.item instanceof String) {
      return (
        <TripHistoryItem
          setRefreshing={setRefreshing}
          {...{ tripid: itemData.item }}
        />
      );
    }
    return <TripItem {...itemData.item} />;
  }
  return (
    <FlatList
      data={trips}
      refreshControl={refreshControl}
      renderItem={renderTripItem}
      keyExtractor={(item) => {
        if (typeof item === "string" || item instanceof String) return item;
        return item.tripid + item.tripName;
      }}
    />
  );
}

export default TripList;
