/**
 * Critical OTAs append "!" to the version line / EAS message version segment
 * (e.g. "1.3.005n!" or "1.3.005n!: Fix …"). Unmarked versions are never critical.
 */
export function isCriticalOtaVersionMark(versionOrMessage: string): boolean {
  const versionSegment = versionOrMessage.trim().split(":")[0]?.trim() ?? "";
  return /!$/.test(versionSegment);
}
