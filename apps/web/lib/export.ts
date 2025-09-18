import type { SiteEvent } from "../types";

export function exportJson(username: string, events: SiteEvent[]) {
  const payload = { username, events };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(username: string, events: SiteEvent[]) {
  const header = `user=${username}\n`;
  const rows = [["platform", "status", "url"]];
  for (const e of events) {
    if (e.type === "site_result") {
      rows.push([e.id, e.status, e.url ?? ""]);
    }
  }
  const csv =
    header +
    rows
      .map((r) =>
        r
          .map((c) => {
            const esc = String(c).replace(/"/g, '""');
            return `"${esc}"`;
          })
          .join(",")
      )
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

