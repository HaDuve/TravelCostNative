import { DateTime } from "luxon";
import {
  _toMonthString,
  _getDateMinusDays,
  _daysBetween,
  _getDatePlusDays,
  _getFormattedDate,
  _isToday,
  _toShortFormat,
  _toDayMonthString,
  _getPreviousMondayDate,
} from "./dateTime";

// for every function, if typeof date is DateTime, return _functionName(date,...args)
// this will call the equivalent function in dateTime.ts

export type DateOrDateTime = Date | DateTime;

export function getFormattedDate(date: DateOrDateTime) {
  if (!date || date?.toString()?.length < 1) return "";
  if (date instanceof DateTime) {
    return _getFormattedDate(date);
  }
  if (date instanceof Date) {
    return _getFormattedDate(DateTime.fromJSDate(date));
  }
}

export const isToday = (someDate: DateOrDateTime) => {
  if (someDate instanceof DateTime) {
    return _isToday(someDate);
  }
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

export function toShortFormat(date: DateOrDateTime) {
  if (date instanceof DateTime) {
    return _toShortFormat(date);
  }
  return _toShortFormat(DateTime.fromJSDate(date));
}

export function toDayMonthString(date: DateOrDateTime) {
  if (date instanceof DateTime) {
    return _toDayMonthString(date);
  } else {
    return _toDayMonthString(DateTime.fromJSDate(date));
  }
  // const monthNames = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];

  // const day = date.getDate();

  // const monthIndex = date.getMonth();
  // const monthName = monthNames[monthIndex];

  // // const year = date.getFullYear();

  // return `${day} ${monthName}`;
}

export function toDayMonthString2(
  date1: DateOrDateTime,
  date2: DateOrDateTime
) {
  if (date1 instanceof DateTime) date1 = date1.toJSDate();
  if (date2 instanceof DateTime) date2 = date2.toJSDate();
  const monthNames = [
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

  let day1 = date1.getDate().toString();
  if (day1?.length < 2) day1 = `${day1.toString()} `;

  const monthIndex1 = date1.getMonth();
  const monthName1 = monthNames[monthIndex1];

  let day2 = date2.getDate().toString();
  if (day2?.length < 2) day2 = `${day2.toString()} `;

  const monthIndex2 = date2.getMonth();
  const monthName2 = monthNames[monthIndex2];

  return `${day1} ${monthName1}. - ${day2} ${monthName2}.`;
}

export function toMonthString(date: DateOrDateTime) {
  if (date instanceof DateTime) return _toMonthString(date);
  else {
    return _toMonthString(DateTime.fromJSDate(date));
  }
  // const monthNames = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];

  // const monthIndex = date.getMonth();
  // const monthName = monthNames[monthIndex];
  // return monthName;
}

export function getDateMinusDays(date: DateOrDateTime, days: number) {
  if (date instanceof DateTime) return _getDateMinusDays(date, days);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

export function daysBetween(date_1: DateOrDateTime, date_2: DateOrDateTime) {
  if (date_1 instanceof DateTime && date_2 instanceof DateTime)
    return _daysBetween(date_1, date_2);
  if (date_1 instanceof DateTime) date_1 = date_1.toJSDate();
  if (date_2 instanceof DateTime) date_2 = date_2.toJSDate();
  const difference = date_1.getTime() - date_2.getTime();
  const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return TotalDays;
}

export function getDatePlusDays(date: DateOrDateTime, days) {
  if (date instanceof DateTime) return _getDatePlusDays(date, days);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getPreviousMondayDate(date: DateOrDateTime) {
  if (date instanceof DateTime) return _getPreviousMondayDate(date);
  let prevMonday = date;
  prevMonday = new Date(
    prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7))
  );
  // sets the date object to last Monday, if the current day is Monday,
  // set it to the current date

  prevMonday = new Date(prevMonday.setHours(0, 0, 0)); // sets hours, mins, secs to 0
  return prevMonday;
}

export const getLocaleDateFormat = (separator = "-") => {
  // A fake date and with each part different to be able to identify later
  const fakeDate = new Date();
  fakeDate.setDate(22);
  fakeDate.setMonth(10); // index
  fakeDate.setFullYear(1999);

  const format = new Intl.DateTimeFormat(navigator.language)
    .format(fakeDate)
    .replace(fakeDate.getDate().toString(), "DD")
    // also consider the month as an index
    .replace((fakeDate.getMonth() + 1).toString(), "MM")
    .replace(fakeDate.getFullYear().toString(), "YYYY");

  return format.replace(/\W/g, separator);
};
