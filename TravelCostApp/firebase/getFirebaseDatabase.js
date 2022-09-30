import { getDatabase } from "firebase/database";

export default function getFirebaseDatabase(app) {
  // Initialize Realtime Database and get a reference to the service
  const database = getDatabase(app);
  return database;
}
