import * as React from "react";
import { FlatList, View } from "react-native";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";

// Test-only scroll shell: production profile uses ProfileScreen's root FlatList + TripListRow.
import TripListRow from "./TripListRow";
import LoadingOverlay from "../UI/LoadingOverlay";
import { TripData } from "../../store/trip-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { useTripListLeave } from "./use-trip-list-leave";

function TripList({ trips }) {
  const { canLeave, closeRow, onLeavePress, setRowRef } = useTripListLeave(trips);

  if (!trips || trips?.length < 1) return <LoadingOverlay></LoadingOverlay>;

  const uniqTrips: TripData[] = uniqBy(trips);

  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (!(typeof itemData.item === "string" || itemData.item instanceof String)) {
      return <></>;
    }
    const tripid = itemData.item as string;
    const index = itemData.index;

    return (
      <TripListRow
        tripid={tripid}
        trips={trips}
        index={index}
        canLeave={canLeave}
        onLeavePress={onLeavePress}
        onSwipeableOpen={closeRow}
        setRowRef={setRowRef}
      />
    );
  }

  return (
    <View
      testID="trip-list-wrapper"
      style={{
        flex: 1,
        minHeight: dynamicScale(120, true),
      }}
    >
      <FlatList
        data={uniqTrips}
        scrollEnabled={true}
        style={{ flex: 1 }}
        ListFooterComponent={
          <View style={{ height: constantScale(150), width: "100%" }}></View>
        }
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
