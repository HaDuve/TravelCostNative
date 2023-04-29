import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Optionally import the services that you want to use
//import {...} from "firebase/auth";
//import {...} from "firebase/database";
//import {...} from "firebase/firestore";
//import {...} from "firebase/functions";
//import {...} from "firebase/storage";

export default function initializeFirebaseApp() {
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE",
    authDomain: "travelcostnative.firebaseapp.com",
    databaseURL:
      "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "travelcostnative",
    storageBucket: "travelcostnative.appspot.com",
    messagingSenderId: "1083718280976",
  };
  const app = initializeApp(firebaseConfig);
  return app;
}

export default function getAuthFirebase() {
  const auth = getAuth(initializeFirebaseApp());
  return auth;
}

