/* istanbul ignore file */
"use client";

import * as React from "react";
import { Box, Card, CardContent, CardHeader, Divider, Stack, Typography, useTheme } from "@mui/material";
import type { MindmapPreviewProps, MindmapItem, Status } from "../types";
import LegendChip from "@/components/LegendChip";
import HelpHint from "@/components/HelpHint";
import ExportButtons from "@/components/ExportButtons";
import { STATUS_COLORS } from "@/lib/ui";
import GroupSections from "@/components/GroupSections";
import ConnectionsOverlay, { type Conn as OverlayConn } from "@/components/ConnectionsOverlay";











type Conn = OverlayConn;
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

export function SideMindmap({ username, items, className, events, exportData = true, showPreviews }: MindmapPreviewProps) {
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
            <ConnectionsOverlay width={dims.w} height={dims.h} conns={conns} />
          </Box>

          {/* Content grid over the overlay */}
          <Box sx={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, gap: 2, alignItems: "start" }}>
          {/* Coluna esquerda: grupos à esquerda */}
          <Box sx={{ order: { xs: 2, md: 1 } }}>
            <GroupSections groups={groups.filter((g) => g.side === "left")} showPreviews={showPreviews} />
          </Box>

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
          <Box sx={{ order: { xs: 3, md: 3 } }}>
            <GroupSections groups={groups.filter((g) => g.side === "right")} showPreviews={showPreviews} />
          </Box>
          </Box>
        </Box>

        {exportData && <ExportButtons username={username} events={events} sx={{ mt: 2 }} />}
      </CardContent>
    </Card>
  );
}

// Item moved to separate component to reduce duplication
