import { DateTime } from "luxon";
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
    weekday: "long",
    month: "long",
    day: "numeric",
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
