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

function appendUniqueTraveller(
  roster: Traveller[],
  traveller: Traveller,
  seenUids: Set<string>,
  seenNames: Set<string>
): void {
  if (traveller.uid) {
    if (seenUids.has(traveller.uid)) return;
    seenUids.add(traveller.uid);
  } else if (seenNames.has(traveller.userName)) {
    return;
  }
  seenNames.add(traveller.userName);
  roster.push(traveller);
}

export function normalizeTravellers(raw: unknown): Traveller[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return [];
    }
    const roster: Traveller[] = [];
    const seenUids = new Set<string>();
    const seenNames = new Set<string>();

    for (const entry of raw) {
      const traveller = normalizeTravellerEntry(entry);
      if (!traveller) continue;
      appendUniqueTraveller(roster, traveller, seenUids, seenNames);
    }

    return roster;
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
      appendUniqueTraveller(roster, traveller, seenUids, seenNames);
    }

    return roster;
  }

  return [];
}

export function travellerUserNames(travellers: Traveller[]): string[] {
  return travellers.map((traveller) => traveller.userName);
}
