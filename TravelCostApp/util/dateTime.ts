import { DateTime } from "luxon";
import { DateOrDateTime } from "./date";
/* *
getFormattedDate
isToday
toShortFormat
toDayMonthString
toDayMonthString2
toMonthString
getDateMinusDays
daysBetween
getDatePlusDays
getPreviousMondayDate
*/
export function _getFormattedDate(dateTime: DateTime): string {
  return dateTime.toISO();
}
export function _isToday(dateTime: DateTime): boolean {
  return dateTime.hasSame(DateTime.now(), "day");
}
export function _toShortFormat(dateTime: DateTime): string {
  return dateTime.toLocaleString({
    // weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
export function _toDayMonthString(dateTime: DateTime): string {
  // return localized day and month string
  return dateTime.toLocaleString({
    // weekday: "short",
    month: "long",
    day: "2-digit",
  });
}
// export function _toDayMonthString2(dateTime: DateTime): string {
//   return dateTime.toFormat("dd MMMM");
// }
export function _toMonthString(dateTime: DateTime): string {
  return dateTime.toLocaleString({
    // weekday: "short",
    month: "long",
  });
}
export function _getDateMinusDays(dateTime: DateTime, days: number): DateTime {
  return dateTime.minus({ days });
}
export function _daysBetween(dateTime1: DateTime, dateTime2: DateTime): number {
  return dateTime1.diff(dateTime2, "days").days;
}
export function _getDatePlusDays(dateTime: DateTime, days: number): DateTime {
  return dateTime.plus({ days });
}
export function _getPreviousMondayDate(dateTime: DateTime): DateTime {
  return dateTime.startOf("week");
}

export function isSameDay(dateTime1: any, dateTime2: any): boolean {
  if (!dateTime1 || !dateTime2) return false;
  if (typeof dateTime1 === "string") dateTime1 = DateTime.fromISO(dateTime1);
  if (typeof dateTime2 === "string") dateTime2 = DateTime.fromISO(dateTime2);
  if (typeof dateTime1 === "number") dateTime1 = DateTime.fromMillis(dateTime1);
  if (typeof dateTime2 === "number") dateTime2 = DateTime.fromMillis(dateTime2);
  if (typeof dateTime1 === typeof Date)
    dateTime1 = DateTime.fromJSDate(dateTime1);
  if (typeof dateTime2 === typeof Date)
    dateTime2 = DateTime.fromJSDate(dateTime2);
  return (
    dateTime1?.toString().slice(0, 10) === dateTime2?.toString().slice(0, 10)
  );
}
