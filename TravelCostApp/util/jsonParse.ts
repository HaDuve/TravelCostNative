import safeLogError from "./error";

export function safelyParseJSON(json: string) {
  // exception to eslint rule, because we cannot know the type of the parsed object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    safeLogError(e);
  }
  return parsed;
}
