/* eslint-disable no-console */
// Note: Error handling utilities
import { customEvent } from "vexo-analytics";
import { shouldEnableVexo, VexoEvents } from "./vexo-tracking";
/**
 * Logs an error message to the console, including the file name and line number where the error occurred.
 * Also reports the error to Vexo for production tracking.
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
  const logMessage = `${fileName ? "in:" : ""} ${
    fileName ? "fn: " + fileName + " " : ""
  }${lineNumber ? "ln: " + lineNumber : ""}\n${message || "Unknown error"}`;

  console.error(logMessage);

  if (shouldEnableVexo) {
    try {
      customEvent(VexoEvents.ERROR_OCCURRED, {
        error:
          typeof error === "string"
            ? error
            : (error as Error)?.message || "Unknown error",
        fileName,
        lineNumber,
        stack: error instanceof Error ? error.stack : undefined,
      });
    } catch (vexoError) {
      console.log("[Error] Failed to report to Vexo:", vexoError);
    }
  }

  return message;
}

/**
 * Type-safely (string, Error, JSON) returns a string representation of the given error object.
 * @param error - The error object to get the message for.
 * @returns A string representation of the given error object.
 */
export function getErrorMessage(error: unknown) {
  if (!error) return "";
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
