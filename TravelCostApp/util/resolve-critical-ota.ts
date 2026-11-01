import { isCriticalOtaVersionMark } from "./critical-ota-mark";

type ResolveIsCriticalOtaInput = {
  easMessage?: string | null;
  changelogSource?: string | null;
};

function readNewestChangelogVersionLine(
  changelogSource: string
): string | null {
  const newestMarker = "__Newest Changes:";
  const otherMarker = "__Other Changes:";
  const newestIdx = changelogSource.indexOf(newestMarker);
  const otherIdx = changelogSource.indexOf(otherMarker);
  if (newestIdx === -1 || otherIdx === -1 || otherIdx <= newestIdx) {
    return null;
  }

  const newestBody = changelogSource
    .slice(newestIdx + newestMarker.length, otherIdx)
    .trim();
  const firstLine = newestBody.split("\n")[0]?.trim() ?? "";
  return firstLine || null;
}

/**
 * Critical only when the version segment ends with "!".
 * Prefer the EAS update message when the client exposes it; otherwise use the
 * remote changelog newest version line.
 */
export function resolveIsCriticalOta({
  easMessage,
  changelogSource,
}: ResolveIsCriticalOtaInput): boolean {
  const message = easMessage?.trim();
  if (message) {
    return isCriticalOtaVersionMark(message);
  }

  if (!changelogSource) {
    return false;
  }

  const newestVersion = readNewestChangelogVersionLine(changelogSource);
  if (!newestVersion) {
    return false;
  }

  return isCriticalOtaVersionMark(newestVersion);
}
