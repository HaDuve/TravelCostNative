export function travellerToDropdown(travellers) {
  const listOfLabelValues = [];
  travellers.forEach((traveller) => {
    // TODO: make value uid based and not name based
    listOfLabelValues.push({ label: traveller, value: traveller });
  });
  const response = listOfLabelValues;
  return response;
}
