import { Alert, FlatList, Button } from "react-native";

import ExpenseItem from "./ExpenseItem";

import React, { Component } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

function renderExpenseItem(itemData) {
  const renderRightActions = (progress, dragX, onClick) => {
    return (
      <View
        style={{
          margin: 0,
          alignContent: "center",
          justifyContent: "center",
          width: 70,
        }}
      >
        <Button color="red" onPress={onClick} title="DELETE"></Button>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, onClick)
      }
      onSwipeableOpen={() => console.log("onSwipeableOpen")}
      ref={(ref) => ref}
      rightOpenValue={-100}
    >
      <ExpenseItem {...itemData.item} />
    </Swipeable>
  );
}

function onClick({ item, index }) {
  console.log(item, index);
  // let a = listData;
  // a.splice(index, 1);
  // console.log(a);
  // setListData([...a]);
}

function ExpensesList({ expenses }) {
  return (
    <FlatList
      data={expenses}
      renderItem={renderExpenseItem}
      keyExtractor={(item) => item.id}
    />
  );
}

export default ExpensesList;

const styles = StyleSheet.create({
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontSize: 16,
    backgroundColor: "transparent",
    padding: 10,
  },
});
