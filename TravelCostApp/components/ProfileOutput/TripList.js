import { FlatList, RefreshControl } from "react-native";

import TripItem from "./TripItem";

function renderTripItem(itemData) {
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
