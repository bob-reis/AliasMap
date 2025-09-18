"use client";

import * as React from "react";
import { Box, Card, CardContent, CardHeader, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import { ExternalLink } from "lucide-react";
import type { MindmapPreviewProps, MindmapItem, Status } from "../types";
import LegendChip from "@/components/LegendChip";
import HelpHint from "@/components/HelpHint";
import ExportButtons from "@/components/ExportButtons";
import { STATUS_COLORS, isSafeHttpUrl } from "@/lib/ui";
import { exportCsv, exportJson } from "@/lib/export";











type Conn = { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean };
type GroupKey = Extract<Status, "found" | "inconclusive" | "not_found" | "error">;
type Group = {
  key: GroupKey;
  label: string;
  items: MindmapItem[];
  color: string;
  side: "left" | "right";
  dashed?: boolean;
  muted?: boolean;
  refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
};

export function SideMindmap({ username, items, className, events, exportData = true }: MindmapPreviewProps) {
  const theme = useTheme();
  const found = React.useMemo(() => items.filter((i) => i.status === "found"), [items]);
  const inconclusive = React.useMemo(() => items.filter((i) => i.status === "inconclusive"), [items]);
  const notFound = React.useMemo(() => items.filter((i) => i.status === "not_found"), [items]);
  const errors = React.useMemo(() => items.filter((i) => i.status === "error"), [items]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const centerRef = React.useRef<HTMLDivElement | null>(null);
  const foundRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const inconclusiveRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const notFoundRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const errorRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const groups: Group[] = React.useMemo(
    () => [
      { key: "found", label: "Encontrado", items: found, color: STATUS_COLORS.found, side: "left", refs: foundRefs },
      {
        key: "inconclusive",
        label: "Inconclusivo",
        items: inconclusive,
        color: STATUS_COLORS.inconclusive,
        side: "right",
        dashed: true,
        refs: inconclusiveRefs,
      },
      {
        key: "not_found",
        label: "Não encontrado",
        items: notFound,
        color: STATUS_COLORS.not_found,
        side: "right",
        muted: true,
        refs: notFoundRefs,
      },
      { key: "error", label: "Erro", items: errors, color: STATUS_COLORS.error, side: "right", refs: errorRefs },
    ],
    [found, inconclusive, notFound, errors, foundRefs, inconclusiveRefs, notFoundRefs, errorRefs]
  );

  React.useEffect(() => {
    // keep refs arrays sized to items count to avoid stale entries
    for (const g of groups) {
      g.refs.current.length = g.items.length;
    }
  }, [groups]);
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
    for (const g of groups) {
      const arr = g.refs.current;
      for (let i = 0; i < arr.length; i++) {
        const node = arr[i];
        if (!node) continue;
        const nr = node.getBoundingClientRect();
        const midY = nr.top - rootRect.top + nr.height / 2;
        const x2 = g.side === "left" ? nr.right - rootRect.left : nr.left - rootRect.left;
        const y2 = midY;
        acc.push({ x1, y1, x2, y2, color: g.color, dashed: g.dashed });
      }
    }
    setConns(acc);
  }, [dims, groups]);

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
        action={<HelpHint>Agrupado por status. Clique para abrir as URLs quando disponível. Heurísticos são marcados.</HelpHint>}
        sx={{ pb: 1.5 }}
      />
      <Divider />
      <CardContent sx={{ pt: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {groups.filter((g) => g.items.length > 0).map((g) => (
            <LegendChip key={g.key} label={g.label} color={g.color} />
          ))}
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
          {/* Coluna esquerda: grupos à esquerda */}
          <Stack spacing={1.25} sx={{ order: { xs: 2, md: 1 } }}>
            {groups
              .filter((g) => g.side === "left" && g.items.length > 0)
              .map((g) => (
                <React.Fragment key={`left-${g.key}`}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: g.color }}>
                    {g.label}
                  </Typography>
                  {g.items.map((i, idx) => (
                    <div key={`${g.key}-${i.platform}`} ref={(el) => (g.refs.current[idx] = el)}>
                      <Item item={i} color={g.color} dashed={g.dashed} muted={g.muted} />
                    </div>
                  ))}
                </React.Fragment>
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

          {/* Coluna direita: grupos à direita */}
          <Stack spacing={1.25} sx={{ order: { xs: 3, md: 3 } }}>
            {groups
              .filter((g) => g.side === "right" && g.items.length > 0)
              .map((g) => (
                <React.Fragment key={`right-${g.key}`}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: g.color }}>
                    {g.label}
                  </Typography>
                  {g.items.map((i, idx) => (
                    <div key={`${g.key}-${i.platform}`} ref={(el) => (g.refs.current[idx] = el)}>
                      <Item item={i} color={g.color} dashed={g.dashed} muted={g.muted} />
                    </div>
                  ))}
                </React.Fragment>
              ))}
          </Stack>
          </Box>
        </Box>

        {exportData && <ExportButtons username={username} events={events} sx={{ mt: 2 }} />}
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
