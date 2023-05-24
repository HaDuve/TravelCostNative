import { FlatList, View } from "react-native";
import TripHistoryItem from "./TripHistoryItem";
import React from "react";
import TripItem from "./TripItem";
import { GlobalStyles } from "../../constants/styles";
import LoadingOverlay from "../UI/LoadingOverlay";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";

function TripList({ trips, refreshControl, setRefreshing }) {
  if (!trips || trips.length < 1) return <LoadingOverlay></LoadingOverlay>;
  const uniqTrips = uniqBy(trips, "tripid");

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
        data={uniqTrips}
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

TripList.propTypes = {
  trips: PropTypes.array,
  refreshControl: PropTypes.object,
  setRefreshing: PropTypes.func,
};
