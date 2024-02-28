import { FlatList, View } from "react-native";
import TripHistoryItem from "./TripHistoryItem";
import React from "react";
import LoadingOverlay from "../UI/LoadingOverlay";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";
import { TripData } from "../../store/trip-context";

function TripList({ trips }) {
  if (!trips || trips?.length < 1) return <LoadingOverlay></LoadingOverlay>;
  const uniqTrips: TripData[] = uniqBy(trips);
  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (typeof itemData.item === "string" || itemData.item instanceof String) {
      return <TripHistoryItem {...{ tripid: itemData.item, trips: trips }} />;
    } else return <></>;
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
        data={uniqTrips}
        ListFooterComponent={<View style={{ height: 300 }}></View>}
        renderItem={renderTripItem}
        keyExtractor={(item: TripData) => {
          if (typeof item === "string" || item instanceof String)
            return item as string;
          return item.tripid + item.tripName;
        }}
      />
    </View>
  );
}

export default TripList;

TripList.propTypes = {
  trips: PropTypes.array,
  refreshControl: PropTypes.object,
  setRefreshing: PropTypes.func,
};
