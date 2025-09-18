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
  const csv = header + rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aliasmap-${username || "resultado"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SideMindmap({ username, items, className, events, exportData = true }: MindmapPreviewProps) {
  const theme = useTheme();
  const found = items.filter((i) => i.status === "found");
  const inconclusive = items.filter((i) => i.status === "inconclusive");
  const notFound = items.filter((i) => i.status === "not_found");
  const errors = items.filter((i) => i.status === "error");

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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2, alignItems: "start" }}>
          {/* Coluna esquerda: Encontrado */}
          <Stack spacing={1.25} sx={{ order: { xs: 2, md: 1 } }}>
            {found.length > 0 && (
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 0.5 }}>
                Encontrado
              </Typography>
            )}
            {found.map((i) => (
              <Item key={i.platform} item={i} color={STATUS_COLORS.found} />
            ))}
          </Stack>

          {/* Coluna central: núcleo (username) */}
          <Box sx={{ order: { xs: 1, md: 2 }, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
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
            {inconclusive.map((i) => (
              <Item key={i.platform} item={i} color={STATUS_COLORS.inconclusive} dashed />
            ))}

            {notFound.length > 0 && (
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: STATUS_COLORS.not_found }}>
                Não encontrado
              </Typography>
            )}
            {notFound.map((i) => (
              <Item key={i.platform} item={i} color={STATUS_COLORS.not_found} muted />
            ))}

            {errors.length > 0 && (
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: STATUS_COLORS.error }}>
                Erro
              </Typography>
            )}
            {errors.map((i) => (
              <Item key={i.platform} item={i} color={STATUS_COLORS.error} />
            ))}
          </Stack>
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

