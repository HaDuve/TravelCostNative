export function getFormattedDate(date) {
  return date.toISOString().slice(0, 10);
}

export const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

export function toShortFormat(date) {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let day = date.getDate();

  let monthIndex = date.getMonth();
  let monthName = monthNames[monthIndex];

  let year = date.getFullYear();

  return `${day} ${monthName}, ${year}`;
}

export function toDayMonthString(date) {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let day = date.getDate();

  let monthIndex = date.getMonth();
  let monthName = monthNames[monthIndex];

  let year = date.getFullYear();

  return `${day} ${monthName}`;
}

export function toDayMonthString2(date1, date2) {
  let monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let day1 = date1.getDate();
  if (day1.toString().length < 2) day1 = `${day1.toString()} `;

  let monthIndex1 = date1.getMonth();
  let monthName1 = monthNames[monthIndex1];

  let year1 = date1.getFullYear();

  let day2 = date2.getDate();
  if (day2.toString().length < 2) day2 = `${day2.toString()} `;

  let monthIndex2 = date2.getMonth();
  let monthName2 = monthNames[monthIndex2];

  let year2 = date2.getFullYear();

  return `${day1} ${monthName1}. - ${day2} ${monthName2}.`;
}

export function toMonthString(date) {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let monthIndex = date.getMonth();
  let monthName = monthNames[monthIndex];
  return monthName;
}

export function getDateMinusDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

export function daysBetween(date_1, date_2) {
  let difference = date_1.getTime() - date_2.getTime();
  let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return TotalDays;
}

export function getDatePlusDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getPreviousMondayDate(date) {
  let prevMonday = date;
  prevMonday = new Date(
    prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7))
  );
  // sets the date object to last Monday, if the current day is Monday,
  // set it to the current date

  prevMonday = new Date(prevMonday.setHours(0, 0, 0)); // sets hours, mins, secs to 0
  return prevMonday;
}
