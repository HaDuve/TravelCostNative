import { DateTime } from "luxon";

// DateOrDateTime type for handling both Date and DateTime objects
export type DateOrDateTime = Date | DateTime;

// Type guard to check if value is a DateTime object
export function isDateTime(value: DateOrDateTime): value is DateTime {
  return (
    value instanceof DateTime ||
    (typeof value === "object" && value !== null && "toISO" in value)
  );
}

// Type guard to check if value is a Date object
export function isDate(value: DateOrDateTime): value is Date {
  return value instanceof Date && !isDateTime(value);
}

// Utility function to convert DateOrDateTime to Date
export function toDate(value: DateOrDateTime): Date {
  if (isDateTime(value)) {
    return value.toJSDate();
  }
  return value;
}

// Utility function to convert DateOrDateTime to DateTime
export function toDateTime(value: DateOrDateTime): DateTime {
  if (isDateTime(value)) {
    return value;
  }
  return DateTime.fromJSDate(value);
}

// Utility function to get date string from DateOrDateTime
export function toDateString(value: DateOrDateTime): string {
  if (isDateTime(value)) {
    return value.toISODate() || value.toString();
  }
  return value.toDateString();
}

// Utility function to get ISO string from DateOrDateTime
export function toISOString(value: DateOrDateTime): string {
  if (isDateTime(value)) {
    return value.toISO() || value.toString();
  }
  return value.toISOString();
}

// Utility function to check if two DateOrDateTime values are equal
export function isDateEqual(a: DateOrDateTime, b: DateOrDateTime): boolean {
  const dateA = toDate(a);
  const dateB = toDate(b);
  return dateA.getTime() === dateB.getTime();
}

// Utility function to add days to DateOrDateTime
export function addDays(value: DateOrDateTime, days: number): DateOrDateTime {
  if (isDateTime(value)) {
    return value.plus({ days });
  }
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

// Utility function to get start of day
export function startOfDay(value: DateOrDateTime): DateOrDateTime {
  if (isDateTime(value)) {
    return value.startOf("day");
  }
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Utility function to get end of day
export function endOfDay(value: DateOrDateTime): DateOrDateTime {
  if (isDateTime(value)) {
    return value.endOf("day");
  }
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}
