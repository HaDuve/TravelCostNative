import axios from "axios";

export async function getRate(base = "EUR", target = "USD") {
  // TODO: add a cache here, and only call the request again after 1 hour
  var requestURL = "https://api.exchangerate.host/latest?base=" + base;
  try {
    const response = await axios.get(requestURL);
    // TODO: we dont really need to get all possible rates, just the target
    return response.data.rates[target];
  } catch (error) {
    console.log("getRate ~ error");
  }
}
