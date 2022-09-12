export function getFormattedDate(date) {
  return date.toISOString().slice(0, 10);
}

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
