import type { Traveller } from "./traveler";

function normalizeTravellerEntry(entry: unknown): Traveller | null {
  if (typeof entry === "string") {
    return entry.length > 0 ? { uid: "", userName: entry } : null;
  }
  if (!entry || typeof entry !== "object" || !("userName" in entry)) {
    return null;
  }
  const { uid, userName } = entry as { uid?: string; userName?: string };
  if (!userName || userName.length === 0) {
    return null;
  }
  return { uid: uid ?? "", userName };
}

export function normalizeTravellers(raw: unknown): Traveller[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return [];
    }
    return raw
      .map((entry) => normalizeTravellerEntry(entry))
      .filter((entry): entry is Traveller => entry !== null);
  }

  if (typeof raw === "object") {
    const roster: Traveller[] = [];
    const seenUids = new Set<string>();
    const seenNames = new Set<string>();

    for (const key of Object.keys(raw)) {
      const traveller = normalizeTravellerEntry(
        (raw as Record<string, unknown>)[key]
      );
      if (!traveller) continue;
      if (traveller.uid) {
        if (seenUids.has(traveller.uid)) continue;
        seenUids.add(traveller.uid);
      } else if (seenNames.has(traveller.userName)) {
        continue;
      }
      seenNames.add(traveller.userName);
      roster.push(traveller);
    }

    return roster;
  }

  return [];
}

export function travellerUserNames(travellers: Traveller[]): string[] {
  return travellers.map((traveller) => traveller.userName);
}
