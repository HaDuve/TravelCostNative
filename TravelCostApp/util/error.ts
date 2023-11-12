// Note: Error handling utilities
/**
 * Logs an error message to the console, including the file name and line number where the error occurred.
 * @param error - The error object to log.
 * @param fileName - The name of the file where the error occurred.
 * @param lineNumber - The line number where the error occurred.
 * @returns The error message that was logged.
 */
export default function safeLogError(
  error: unknown,
  fileName = "",
  lineNumber = 0
) {
  if (!error) return;
  const message = getErrorMessage(error);
  console.log(
    `~~ error ${fileName ? "in:" : ""} ${fileName ? "fn: " + fileName : ""} ${
      lineNumber ? "ln: " + lineNumber : ""
    } ~~\n${message || "Unknown error"}`
  );
  return message;
}

/**
 * Returns the error message from an error object, string, or JSON object.
 * @param error - The error object, string, or JSON object.
 * @returns The error message as a string, or undefined if the error is falsy.
 */
export function getErrorMessage(error: unknown) {
  if (!error) return;
  let message: string;
  if (error instanceof Error) {
    message = error.message;
    // get line number and filename
    const stack = error.stack;
    if (stack) {
      const stackLines = stack.split("\n");
      if (stackLines?.length > 1) {
        const line = stackLines[1];
        const lineParts = line.split(":");
        if (lineParts?.length > 1) {
          const lineNumber = lineParts[lineParts.length - 2];
          const fileName = lineParts[lineParts.length - 3];
          message += ` (in ${fileName} at line ${lineNumber})`;
        }
      }
    }
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    message = JSON.stringify(error);
  } else {
    message = "Unknown error";
  }
  return message;
}
