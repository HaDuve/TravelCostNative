import { FlatList, RefreshControl } from "react-native";
import TripHistoryItem from "./TripHistoryItem";

import TripItem from "./TripItem";

function renderTripItem(itemData) {
  if (typeof itemData.item === "string" || itemData.item instanceof String) {
    return <TripHistoryItem {...{ tripid: itemData.item }} />;
  }
  return <TripItem {...itemData.item} />;
}

function TripList({ trips, refreshControl }) {
  return (
    <FlatList
      data={trips}
      refreshControl={refreshControl}
      renderItem={renderTripItem}
      keyExtractor={(item) => {
        return item.tripid;
      }}
    />
  );
}

export default TripList;
