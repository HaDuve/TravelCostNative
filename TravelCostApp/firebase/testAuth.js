import { getDatabase, ref, onValue, set } from "firebase/database";
import getFirebaseDatabase from "./getFirebaseDatabase";
import initializeFirebaseApp from "./initializeFirebaseApp";

export function storeHighScore(userId, score = 10) {
  const app = initializeFirebaseApp();
  const db = getFirebaseDatabase(app);
  const reference = ref(db, "users/" + userId);
  set(reference, {
    highscore: score,
    userName: "Hannes",
  });
}

export function setupHighscoreListener(userId) {
  const app = initializeFirebaseApp();
  const db = getFirebaseDatabase(app);
  const reference = ref(db, "users/" + userId);
  onValue(reference, (snapshot) => {
    const highscore = snapshot.val().highscore;
    console.log("New high score: " + highscore);
  });
}
