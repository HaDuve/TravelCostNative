import axios from "axios";
import qs from "qs";

export async function revokeAppleToken(refreshToken) {
  //   const client_secret = makeJWT(); // Assuming you have the makeJWT function in your project

  const data = {
    token: refreshToken,
    client_id: "YOUR CLIENT ID",
    // client_secret: client_secret,
    token_type_hint: "refresh_token",
  };

  try {
    const response = await axios.post(
      "https://appleid.apple.com/auth/revoke",
      qs.stringify(data),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(response?.data);
  } catch (error) {
    console.error(error);
  }
}
