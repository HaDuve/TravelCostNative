import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { sendOfflineQueue } from "../util/offline-queue";
import safeLogError from "../util/error";
import { getMMKVObject } from "../store/mmkv";

const BACKGROUND_FETCH_TASK = "background-offline-queue-task";

// const sendOfflineQueueAsBGTask = async () =>
//   await sendOfflineQueue(null, null, true);

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   const offlineQueueBefore = getMMKVObject("offlineQueue") || [];
//   if (!offlineQueueBefore || offlineQueueBefore.length === 0) {
//     return BackgroundFetch.BackgroundFetchResult.NoData;
//   }
//   try {
//     await sendOfflineQueueAsBGTask();
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   } catch (error) {
//     safeLogError(error);
//     return BackgroundFetch.BackgroundFetchResult.Failed;
//   }
// });

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function registerBackgroundFetchAsync() {
  return;
  // return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  //   minimumInterval: 60 * 15, // 15 minutes
  //   stopOnTerminate: false, // android only,
  //   startOnBoot: true, // android only
  // });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export default function BackgroundFetchScreen() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    checkStatusAsync();
  }, []);

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background fetch status:{" "}
          <Text style={styles.boldText}>
            {status && BackgroundFetch.BackgroundFetchStatus[status]}
          </Text>
        </Text>
        <Text>
          Background fetch task name:{" "}
          <Text style={styles.boldText}>
            {isRegistered ? BACKGROUND_FETCH_TASK : "Not registered yet!"}
          </Text>
        </Text>
      </View>
      <View style={styles.textContainer}></View>
      <Button
        title={
          isRegistered
            ? "Unregister BackgroundFetch task"
            : "Register BackgroundFetch task"
        }
        onPress={toggleFetchTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
});
