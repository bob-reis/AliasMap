"use client";

import * as React from "react";
import { Box, Card, CardContent, CardHeader, Chip, Divider, Stack, Tooltip, Typography, Button, useTheme } from "@mui/material";
import { Info, ExternalLink } from "lucide-react";
import DownloadIcon from "@mui/icons-material/Download";
import type { MindmapPreviewProps, MindmapItem, LegendProps, SiteEvent } from "../types";

const STATUS_COLORS = {
  found: "#10B981",
  inconclusive: "#F59E0B",
  not_found: "#9CA3AF",
  error: "#EF4444",
  unknown: "#6B7280",
} as const;

function Legend({ label, color }: LegendProps) {
  return (
    <Chip
      variant="outlined"
      label={
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
          <span>{label}</span>
        </Stack>
      }
      sx={{ "& .MuiChip-label": { display: "flex", alignItems: "center", py: 0.5, px: 1 } }}
    />
  );
}

function isSafeHttpUrl(u?: string): u is string {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function exportJson(username: string, events: SiteEvent[]) {
  const payload = { username, events };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(username: string, events: SiteEvent[]) {
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

type Conn = { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean };

export function SideMindmap({ username, items, className, events, exportData = true }: MindmapPreviewProps) {
  const theme = useTheme();
  const found = items.filter((i) => i.status === "found");
  const inconclusive = items.filter((i) => i.status === "inconclusive");
  const notFound = items.filter((i) => i.status === "not_found");
  const errors = items.filter((i) => i.status === "error");

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const centerRef = React.useRef<HTMLDivElement | null>(null);
  const foundRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const inconclusiveRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const notFoundRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const errorRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [dims, setDims] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [conns, setConns] = React.useState<Conn[]>([]);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setDims({ w: Math.max(320, cr.width), h: Math.max(160, cr.height) });
      }
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setDims({ w: Math.max(320, r.width), h: Math.max(160, r.height) });
    return () => ro.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const root = containerRef.current;
    const center = centerRef.current;
    if (!root || !center) return;
    const rootRect = root.getBoundingClientRect();
    const centerRect = center.getBoundingClientRect();
    const x1 = centerRect.left - rootRect.left + centerRect.width / 2;
    const y1 = centerRect.top - rootRect.top + centerRect.height / 2;

    const acc: Conn[] = [];
    const addRefs = (refArr: (HTMLDivElement | null)[], color: string, side: "left" | "right", dashed?: boolean) => {
      const len = refArr.length;
      for (let i = 0; i < len; i++) {
        const node = refArr[i];
        if (!node) continue;
        const nr = node.getBoundingClientRect();
        const midY = nr.top - rootRect.top + nr.height / 2;
        const x2 = side === "left" ? nr.right - rootRect.left : nr.left - rootRect.left;
        const y2 = midY;
        acc.push({ x1, y1, x2, y2, color, dashed });
      }
    };
    addRefs(foundRefs.current, STATUS_COLORS.found, "left", false);
    addRefs(inconclusiveRefs.current, STATUS_COLORS.inconclusive, "right", true);
    addRefs(notFoundRefs.current, STATUS_COLORS.not_found, "right", false);
    addRefs(errorRefs.current, STATUS_COLORS.error, "right", false);
    setConns(acc);
  }, [dims, found.length, inconclusive.length, notFound.length, errors.length]);

  return (
    <Card className={className} sx={{ border: "none", backgroundColor: "transparent" }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Mapa de Evidências (lateral)
            </Typography>
          </Stack>
        }
        action={
          <Tooltip
            arrow
            title={
              <Box sx={{ fontSize: 12, maxWidth: 320 }}>
                Agrupado por status. Clique para abrir as URLs quando disponível. Heurísticos são marcados.
              </Box>
            }
          >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary", cursor: "help" }}>
              <Info size={18} />
              <Typography variant="caption">Ajuda</Typography>
            </Stack>
          </Tooltip>
        }
        sx={{ pb: 1.5 }}
      />
      <Divider />
      <CardContent sx={{ pt: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {found.length > 0 && <Legend label="Encontrado" color={STATUS_COLORS.found} />}
          {inconclusive.length > 0 && <Legend label="Inconclusivo" color={STATUS_COLORS.inconclusive} />}
          {notFound.length > 0 && <Legend label="Não encontrado" color={STATUS_COLORS.not_found} />}
          {errors.length > 0 && <Legend label="Erro" color={STATUS_COLORS.error} />}
        </Stack>

        <Box ref={containerRef} sx={{ position: "relative" }}>
          {/* Overlay with connections */}
          <Box sx={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <svg width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`}
              style={{ display: "block", width: "100%", height: "100%" }}>
              {conns.map((c, i) => {
                const ctrlX = (c.x1 + c.x2) / 2; // gentle curve
                const d = `M ${c.x1} ${c.y1} Q ${ctrlX} ${c.y1} ${c.x2} ${c.y2}`;
                return (
                  <path key={i} d={d} stroke={c.color} strokeWidth={1.25} fill="none" strokeDasharray={c.dashed ? "4 3" : undefined} strokeOpacity={0.5} />
                );
              })}
            </svg>
          </Box>

          {/* Content grid over the overlay */}
          <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2, alignItems: "start" }}>
          {/* Coluna esquerda: Encontrado */}
          <Stack spacing={1.25} sx={{ order: { xs: 2, md: 1 } }}>
            {found.length > 0 && (
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 0.5 }}>
                Encontrado
              </Typography>
            )}
            {found.map((i, idx) => (
              <div key={i.platform} ref={(el) => (foundRefs.current[idx] = el)}>
                <Item item={i} color={STATUS_COLORS.found} />
              </div>
            ))}
          </Stack>

          {/* Coluna central: núcleo (username) */}
          <Box ref={centerRef} sx={{ order: { xs: 1, md: 2 }, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <Box
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                fontWeight: 700,
              }}
            >
              {username || "alvo"}
            </Box>
          </Box>

          {/* Coluna direita: Inconclusivo / Não encontrado / Erro */}
          <Stack spacing={1.25} sx={{ order: { xs: 3, md: 3 } }}>
            {inconclusive.length > 0 && (
              <Typography variant="subtitle2" color="warning.main" sx={{ mb: 0.5 }}>
                Inconclusivo
              </Typography>
            )}
            {inconclusive.map((i, idx) => (
              <div key={i.platform} ref={(el) => (inconclusiveRefs.current[idx] = el)}>
                <Item item={i} color={STATUS_COLORS.inconclusive} dashed />
              </div>
            ))}

            {notFound.length > 0 && (
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: STATUS_COLORS.not_found }}>
                Não encontrado
              </Typography>
            )}
            {notFound.map((i, idx) => (
              <div key={i.platform} ref={(el) => (notFoundRefs.current[idx] = el)}>
                <Item item={i} color={STATUS_COLORS.not_found} muted />
              </div>
            ))}

            {errors.length > 0 && (
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: STATUS_COLORS.error }}>
                Erro
              </Typography>
            )}
            {errors.map((i, idx) => (
              <div key={i.platform} ref={(el) => (errorRefs.current[idx] = el)}>
                <Item item={i} color={STATUS_COLORS.error} />
              </div>
            ))}
          </Stack>
          </Box>
        </Box>

        {exportData && (
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<DownloadIcon />} disabled={!events.length} onClick={() => exportCsv(username, events)}>
              CSV
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} disabled={!events.length} onClick={() => exportJson(username, events)}>
              JSON
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function Item({ item, color, dashed, muted }: { item: MindmapItem; color: string; dashed?: boolean; muted?: boolean }) {
  const safe = isSafeHttpUrl(item.url);
  const chip = (
    <Chip
      variant={muted ? "outlined" : "filled"}
      color={muted ? undefined : undefined}
      label={
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
          <Typography component="span" fontWeight={600} sx={{ color: "inherit" }}>
            {item.platform}
          </Typography>
          {item.heuristic && (
            <Chip size="small" variant="outlined" label="heurístico" sx={{ height: 18, "& .MuiChip-label": { px: 0.5, fontSize: 10 } }} />
          )}
        </Stack>
      }
      sx={{
        borderColor: color,
        bgcolor: muted ? "transparent" : undefined,
        color: "inherit",
        "& .MuiChip-label": { display: "flex", alignItems: "center", py: 0.5, px: 1 },
      }}
    />
  );

  const content = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ position: "relative" }}>
      <Box
        sx={{
          width: 16,
          height: 1,
          bgcolor: color,
          borderTopStyle: dashed ? "dashed" : "solid",
          borderTopWidth: dashed ? 1 : 0,
          borderColor: dashed ? color : undefined,
        }}
      />
      {chip}
      {safe && (
        <Stack direction="row" alignItems="center" spacing={0.5} color="primary.main">
          <ExternalLink size={14} />
          <Typography component="span" sx={{ fontSize: 12 }}>
            Abrir
          </Typography>
        </Stack>
      )}
    </Stack>
  );

  if (!safe) return content;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </a>
  );
}
