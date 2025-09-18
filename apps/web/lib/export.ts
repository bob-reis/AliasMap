import type { SiteEvent } from "../types";

export function buildCsv(username: string, events: SiteEvent[]): string {
  const header = `user=${username}\n`;
  const rows = [["platform", "status", "url"]];
  for (const e of events) {
    if (e.type === "site_result") {
      rows.push([e.id, e.status, e.url ?? ""]);
    }
  }
  const body = rows
    .map((r) =>
      r
        .map((c) => {
          const esc = String(c).replace(/"/g, '""');
          return `"${esc}"`;
        })
        .join(",")
    )
    .join("\n");
  return header + body;
}

export function buildJson(username: string, events: SiteEvent[]): string {
  return JSON.stringify({ username, events }, null, 2);
}

export function exportJson(username: string, events: SiteEvent[]) {
  const blob = new Blob([buildJson(username, events)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(username: string, events: SiteEvent[]) {
  const csv = buildCsv(username, events);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
