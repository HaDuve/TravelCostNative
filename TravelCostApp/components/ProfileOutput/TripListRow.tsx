import * as React from "react";
import { Platform } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import TripHistoryItem from "./TripHistoryItem";
import TripSwipeLeaveAction from "./TripSwipeLeaveAction";

export type TripListRowProps = {
  tripid: string;
  trips: string[];
  index: number;
  canLeave: boolean;
  onLeavePress: (tripid: string) => void;
  onSwipeableOpen: (index: number) => void;
  setRowRef: (index: number, ref: Swipeable | null) => void;
};

function TripListRow({
  tripid,
  trips,
  index,
  canLeave,
  onLeavePress,
  onSwipeableOpen,
  setRowRef,
}: TripListRowProps) {
  const card = <TripHistoryItem tripid={tripid} trips={trips} />;

  if (!canLeave) {
    return card;
  }

  const leaveAction = () => (
    <TripSwipeLeaveAction onPress={() => void onLeavePress(tripid)} />
  );

  if (Platform.OS === "android") {
    return (
      <GestureHandlerRootView>
        <Swipeable
          renderLeftActions={leaveAction}
          onSwipeableOpen={() => onSwipeableOpen(index)}
          ref={(ref) => {
            setRowRef(index, ref);
          }}
          overshootFriction={8}
        >
          {card}
        </Swipeable>
      </GestureHandlerRootView>
    );
  }

  return (
    <Swipeable
      renderRightActions={leaveAction}
      onSwipeableOpen={() => onSwipeableOpen(index)}
      ref={(ref) => {
        setRowRef(index, ref);
      }}
      overshootFriction={8}
    >
      {card}
    </Swipeable>
  );
}

export default TripListRow;
