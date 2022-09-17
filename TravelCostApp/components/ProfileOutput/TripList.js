import { FlatList } from "react-native";

import TripItem from "./TripItem";

function renderTripItem(itemData) {
  return <TripItem {...itemData.item} />;
}

function TripList({ trips }) {
  return (
    <FlatList
      data={trips}
      renderItem={renderTripItem}
      keyExtractor={(item) => item.tripid}
    />
  );
}

export default TripList;
