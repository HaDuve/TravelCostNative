import axios from "axios";

/** ACCESS TOKEN */
/** Sets the ACCESS TOKEN for all future http requests */
export function setAxiosAccessToken(token: string) {
  if (!token || token?.length < 2) {
    return;
  }

  // Clear any Authorization header (Firebase RTDB doesn't use it)
  delete axios.defaults.headers.common["Authorization"];
}
