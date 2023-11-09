// Note: Error handling utilities
/**
 * Logs an error message to the console if an error object is provided.
 * @param error - The error object to log.
 * @returns The error message that was logged.
 */
export default function safeLogError(error: unknown) {
  if (!error) return;
  const message = getError(error);
  console.log(message);
  return message;
}

/**
 * Returns the error message from an error object, string, or JSON object.
 * @param error - The error object, string, or JSON object.
 * @returns The error message as a string, or undefined if the error is falsy.
 */
export function getError(error: unknown) {
  if (!error) return;
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    message = JSON.stringify(error);
  }
  return message;
}
