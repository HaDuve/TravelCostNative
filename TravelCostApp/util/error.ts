/**
 * Logs an error message to the console in a safe way.
 *
 * @param error - The error to log. Can be an Error object, a string, or any other object.
 * @returns The error message that was logged.
 */
export default function safeLogError(error: unknown) {
  if (!error) return;
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    message = JSON.stringify(error);
  }
  console.log(message);
  return message;
}
