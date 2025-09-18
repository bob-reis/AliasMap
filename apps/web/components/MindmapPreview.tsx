"use client";

import * as React from "react";
import { ExternalLink, Info, Dot, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Box,
  Stack,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import type { MindmapPreviewProps, EdgeProps, SiteEvent } from "../types";
import LegendChip from "@/components/LegendChip";
import { STATUS_COLORS, colorFor, isSafeHttpUrl } from "@/lib/ui";
import { exportCsv, exportJson } from "@/lib/export";

const NODE_R = 20;
const CORE_R = 34;

function truncate(s: string, max = 12) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function useMeasure<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [rect, setRect] = React.useState<{ width: number; height: number }>({ width: 640, height: 420 });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setRect({ width: Math.max(320, cr.width), height: Math.max(280, cr.height) });
      }
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setRect({ width: Math.max(320, r.width), height: Math.max(280, r.height) });
    return () => ro.disconnect();
  }, []);

  return { ref, rect };
}

export function MindmapPreview({
  username,
  items,
  width,
  height,
  radius = 150,
  className,
  maxLabel = 12,
  events,
  exportData = true,
}: MindmapPreviewProps) {
  const theme = useTheme();
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const { ref, rect } = useMeasure<HTMLDivElement>();
  const idPrefix = React.useId();
  const W = width ?? rect.width;
  const H = height ?? rect.height;
  const cx = W / 2;
  const cy = H / 2;
  const effectiveRadius = Math.max(80, Math.min(radius, Math.min(W, H) * 0.42 - 10));
  const nodes = React.useMemo(() => {
    const N = Math.max(1, items.length);
    return items.map((it, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + effectiveRadius * Math.cos(angle);
      const y = cy + effectiveRadius * Math.sin(angle);
      return { ...it, x, y, angle, safeUrl: isSafeHttpUrl(it.url) ? it.url : undefined };
    });
  }, [items, cx, cy, effectiveRadius]);

  const gradCoreId = `${idPrefix}-mm-core`;
  const shadowId = `${idPrefix}-mm-shadow`;
  const ariaLabel = `Mapa de evidências para ${username || "alvo"} com ${items.length} plataformas`;


  if (!items || items.length === 0) {
    return (
      <Card className={className} sx={{ border: "none", backgroundColor: "transparent" }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36 }}
              >
                <ShieldCheck size={18} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Mapa de Evidências
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="caption" color="text.secondary">
              Sem dados para exibir
            </Typography>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      className={className}
      sx={{
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "hidden",
        backdropFilter: "blur(4px)",
        backgroundColor: "transparent",
        border: "none",
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36 }}>
              <ShieldCheck size={18} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} lineHeight={1.25}>
                Mapa de Evidências
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {username || "alvo"} — {items.length} plataformas
              </Typography>
            </Box>
          </Stack>
        }
        action={
          <Tooltip
            arrow
            title={
              <Box sx={{ fontSize: 12, maxWidth: 300 }}>
                Cada nó representa uma plataforma. Cores indicam o status. Tracejado = heurístico. Clique/Enter abre a
                URL quando disponível.
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
          {Array.from(new Set(items.map((i) => i.status))).map((s) => {
            if (s === "found") return <LegendChip key={s} label="Encontrado" color={STATUS_COLORS.found} />;
            if (s === "inconclusive") return <LegendChip key={s} label="Inconclusivo" color={STATUS_COLORS.inconclusive} />;
            if (s === "not_found") return <LegendChip key={s} label="Não encontrado" color={STATUS_COLORS.not_found} />;
            if (s === "error") return <LegendChip key={s} label="Erro" color={STATUS_COLORS.error} />;
            return null;
          })}
        </Stack>
        <Box ref={ref} sx={{ width: "100%", height: { xs: 320, sm: 380, md: 420 }, position: "relative" }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            aria-label={ariaLabel}
            style={{ userSelect: "none", display: "block" }}
          >
            <title>{ariaLabel}</title>
            <desc>Visual de nós por plataforma conectados ao identificador central.</desc>

            <defs>
              <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.18" />
              </filter>

              <radialGradient id={gradCoreId} cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.18" />
                <stop offset="100%" stopColor={theme.palette.background.paper} stopOpacity="1" />
              </radialGradient>
            </defs>

            <circle
              cx={cx}
              cy={cy}
              r={effectiveRadius + 24}
              fill="none"
              stroke={`url(#${gradCoreId})`}
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />

            <g filter={`url(#${shadowId})`}>
              <circle cx={cx} cy={cy} r={CORE_R} fill={`url(#${gradCoreId})`} stroke="#2563EB" strokeWidth={1.5} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#F9FAFB">
                {truncate(username || "alvo", 18)}
              </text>
            </g>

            {nodes.map((n, idx) => (
              <Edge
                key={`edge-${idx}-${n.platform}`}
                idx={idx}
                x1={cx}
                y1={cy}
                x2={n.x}
                y2={n.y}
                animate={!prefersReduced}
                prefix={idPrefix}
              />
            ))}

            {/* nós */}
            {nodes.map((n, idx) => {
              const stroke = colorFor(n.status);
              const isHeuristic = Boolean(n.heuristic);
              const label = truncate(n.platform, maxLabel);

              const group = (
                <g
                  key={`node-${idx}-${n.platform}`}
                  filter={`url(#${shadowId})`}
                  tabIndex={n.safeUrl ? 0 : -1}
                  role={n.safeUrl ? "link" : "group"}
                  aria-label={`${n.platform}: ${n.rawStatus ?? n.status}${isHeuristic ? " (heurístico)" : ""}`}
                  onKeyDown={(e) => {
                    if (!n.safeUrl) return;
                    if (e.key === "Enter" || e.key === " ") {
                      window.open(n.safeUrl, "_blank", "noopener,noreferrer");
                      e.preventDefault();
                    }
                  }}
                >
                  <title>
                    {`${n.platform} — ${n.rawStatus ?? n.status}${isHeuristic ? " (heurístico)" : ""}${
                      n.safeUrl ? ` — ${n.safeUrl}` : ""
                    }`}
                  </title>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={NODE_R}
                    fill={theme.palette.background.paper}
                    stroke={stroke}
                    strokeWidth={2}
                    strokeDasharray={isHeuristic ? "4 3" : undefined}
                  />
                  <text
                    x={n.x}
                    y={n.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={theme.palette.text.primary}
                  >
                    {label}
                  </text>
                  {isHeuristic && (
                    <text x={n.x} y={n.y + 16} textAnchor="middle" fontSize={9} fill="#6B7280">
                      heurístico
                    </text>
                  )}
                </g>
              );

              if (!n.safeUrl) return group;

              return (
                <Tooltip
                  key={`tt-${idx}-${n.platform}`}
                  arrow
                  enterDelay={80}
                  componentsProps={{ tooltip: { sx: { p: 1.5, maxWidth: 320 } } }}
                  title={
                    <Stack spacing={0.5} fontSize={12}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Dot size={16} style={{ color: stroke }} />
                        <Typography fontWeight={600} component="span">
                          {n.platform}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={n.rawStatus ?? n.status}
                          sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 10 } }}
                        />
                        {isHeuristic && (
                          <Chip
                            size="small"
                            color="secondary"
                            variant="outlined"
                            label="heurístico"
                            sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: 10 } }}
                          />
                        )}
                      </Stack>
                      <Typography color="text.secondary" noWrap>
                        {n.safeUrl}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} color="primary.main">
                        <ExternalLink size={14} />
                        <Typography component="span">Abrir</Typography>
                      </Stack>
                    </Stack>
                  }
                >
                  <a href={n.safeUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                    {group}
                  </a>
                </Tooltip>
              );
            })}
          </svg>
        </Box>
        {exportData && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!events.length}
              onClick={() => exportCsv(username, events)}
            >
              CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!events.length}
              onClick={() => exportJson(username, events)}
            >
              JSON
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function Edge({ idx, x1, y1, x2, y2, animate, prefix }: EdgeProps) {
  const gradId = `${prefix}-edge-grad-${idx}`;
  return (
    <g>
      <linearGradient id={gradId}>
        <stop offset="0%" stopColor="#D1D5DB" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#D1D5DB" stopOpacity="0.15" />
      </linearGradient>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${gradId})`} strokeWidth={1.25}>
        {animate ? (
          <animate attributeName="stroke-opacity" values="0.35;0.75;0.35" dur="2.4s" repeatCount="indefinite" />
        ) : null}
      </line>
    </g>
  );
}

