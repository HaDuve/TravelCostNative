import uniqBy from "lodash.uniqby";
import { useContext } from "react";
import { FlatList, View } from "react-native";

import { OrientationContext } from "../../store/orientation-context";
import { TripData } from "../../store/trip-context";
import { constantScale } from "../../util/scalingUtil";
import LoadingOverlay from "../UI/LoadingOverlay";

import TripHistoryItem from "./TripHistoryItem";

function TripList({ trips }) {
  const { isLandscape } = useContext(OrientationContext);
  if (!trips || trips?.length < 1) return <LoadingOverlay></LoadingOverlay>;

  const uniqTrips: TripData[] = uniqBy(trips);
  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (typeof itemData.item === "string" || itemData.item instanceof String) {
      return <TripHistoryItem {...{ tripid: itemData.item, trips }} />;
    } else return <></>;
  }
  return (
    <View
      style={{
        flex: 1,
        zIndex: -10,
      }}
    >
      <FlatList
        data={uniqTrips}
        scrollEnabled={isLandscape}
        horizontal={isLandscape}
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
