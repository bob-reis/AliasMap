export type Normalized = "found" | "not_found" | "inconclusive" | "error";

export function normalizeStatus(s: string): Normalized {
  const v = String(s).toLowerCase();
  if (v.includes("found") || v === "200") return "found";
  if (v.includes("not") || v === "404") return "not_found";
  if (v.includes("timeout") || v.includes("error")) return "error";
  if (v === "403" || v.includes("block")) return "inconclusive";
  return "inconclusive";
}

