/**
 * Best-effort read of the EAS `--message` from a client update manifest.
 * EAS does not always expose this on-device; callers should fall back to changelog.
 */
export function readEasUpdateMessageFromManifest(
  manifest: unknown
): string | null {
  if (!manifest || typeof manifest !== "object") {
    return null;
  }

  const record = manifest as {
    metadata?: Record<string, unknown>;
    extra?: {
      message?: unknown;
      expoClient?: { extra?: { message?: unknown } };
    };
  };

  const candidates = [
    record.metadata?.updateMessage,
    record.metadata?.message,
    record.extra?.message,
    record.extra?.expoClient?.extra?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}
