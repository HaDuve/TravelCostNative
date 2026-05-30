import { DateTime } from "luxon";

import { i18n } from "../i18n/i18n";
import { EasUpdateInfo } from "./easUpdateInfo";

export function formatPublishTime(iso: string | null) {
  if (!iso) return "—";
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATETIME_MED);
}

export type VersionDisplayLines = {
  currentLine: string | null;
  latestLine: string | null;
  updatesDisabled: boolean;
};

export function buildVersionDisplayLines(
  info: EasUpdateInfo | null
): VersionDisplayLines {
  if (info?.updatesEnabled === false) {
    return {
      currentLine: null,
      latestLine: null,
      updatesDisabled: true,
    };
  }

  const currentLine = i18n.t("settingsCurrentVersionLine", {
    createdAt: formatPublishTime(info?.runningUpdateCreatedAt ?? null),
  });

  const latestLine = info?.newerUpdateAvailable
    ? i18n.t("settingsLatestVersionLine", {
        createdAt: formatPublishTime(info.newerUpdateCreatedAt),
      })
    : null;

  return {
    currentLine,
    latestLine,
    updatesDisabled: false,
  };
}
