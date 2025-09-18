export const STATUS_COLORS = {
  found: "#10B981",
  inconclusive: "#F59E0B",
  not_found: "#9CA3AF",
  error: "#EF4444",
  unknown: "#6B7280",
} as const;

export function colorFor(status: string): string {
  if (status === "found") return STATUS_COLORS.found;
  if (status === "inconclusive") return STATUS_COLORS.inconclusive;
  if (status === "not_found") return STATUS_COLORS.not_found;
  if (status === "error") return STATUS_COLORS.error;
  return STATUS_COLORS.unknown;
}

export function isSafeHttpUrl(u?: string): u is string {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

