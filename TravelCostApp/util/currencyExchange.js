import axios from "axios";

export async function getRate(base = "EUR", target = "USD") {
  var requestURL = "https://api.exchangerate.host/latest?base=" + base;
  const response = await axios.get(requestURL);
  return response.data.rates[target];
}
