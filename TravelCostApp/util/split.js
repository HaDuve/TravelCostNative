export function calcSplitList(
  splitType,
  amount,
  whoPaid,
  splitTravellers,
  exactList,
  percList
) {
  if (
    !splitType ||
    !amount ||
    Number.isNaN(amount) ||
    !whoPaid ||
    !splitTravellers ||
    splitTravellers.length < 1
  ) {
    console.log("calcSplitlist failed");
    return;
  }
  console.log(
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
  );
  console.log(
    "~~~~~~~~~~~~~ calcSplitList successfully called! ~~~~~~~~~~~~~~~"
  );
  console.log("calcSplitList ~ splitType", splitType);
  console.log("calcSplitList ~ whoPaid", whoPaid);
  console.log("calcSplitList ~ amount", amount);
  console.log("calcSplitList ~ splitTravellers", splitTravellers);
  let splitList = [];
  switch (splitType) {
    case "SELF":
      console.log("SELF");
      return splitList;

    case "EQUAL":
      const splitAmount = amount / (splitTravellers.length + 1);
      console.log("splitAmount", splitAmount);
      splitTravellers.forEach((traveller) => {
        splitList.push({
          userName: traveller,
          amount: splitAmount,
        });
      });
      return splitList;

    case "EXACT":
      console.log("exactList", exactList);
      for (let i = 0; i < splitTravellers.length; i++) {
        const split = { userName: splitTravellers[i], amount: exactList[i] };
        splitList.push(split);
      }
      return splitList;

    case "PERCENT":
      console.log("percList", percList);
      for (let i = 0; i < splitTravellers.length; i++) {
        const percAmount = amount * percList[i];
        const split = { userName: splitTravellers[i], amount: percAmount };
        splitList.push(split);
      }
      return splitList;

    default:
      console.log("[SplitExpense] Wrong splitType :", splitType);
      return [];
  }
}
