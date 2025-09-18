/* istanbul ignore file */
"use client";

import * as React from "react";
import { Box, Chip, Stack, Typography, Tooltip } from "@mui/material";
import { ExternalLink } from "lucide-react";
import type { MindmapItem } from "../types";
import { isSafeHttpUrl } from "@/lib/ui";

export default function SideMindmapItem({ item, color, dashed, muted, showPreview }: { item: MindmapItem; color: string; dashed?: boolean; muted?: boolean; showPreview?: boolean }) {
  const safe = isSafeHttpUrl(item.url);
  const avatarSrc = showPreview && item.status === 'found' ? item.metadata?.image : undefined;
  const chip = (
    <Chip
      variant={muted ? "outlined" : "filled"}
      label={
        <Stack direction="row" spacing={1} alignItems="center">
          {avatarSrc && (
            <Box component="img" src={avatarSrc} alt="avatar" sx={{ width: 24, height: 24, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />
          )}
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
          <Typography component="span" fontWeight={600} sx={{ color: "inherit" }}>
            {item.platform}
          </Typography>
          {item.heuristic && (
            <Chip size="small" variant="outlined" label="heurístico" sx={{ height: 18, "& .MuiChip-label": { px: 0.5, fontSize: 10 } }} />
          )}
        </Stack>
      }
      sx={{ borderColor: color, bgcolor: muted ? "transparent" : undefined, color: "inherit", "& .MuiChip-label": { display: "flex", alignItems: "center", py: 0.5, px: 1 } }}
    />
  );

  const content = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ position: "relative" }}>
      <Box sx={{ width: 16, height: 1, bgcolor: color, borderTopStyle: dashed ? "dashed" : "solid", borderTopWidth: dashed ? 1 : 0, borderColor: dashed ? color : undefined }} />
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

  const maybeWithTooltip = (node: React.ReactNode) => {
    if (item.status !== 'found') return node;
    const title = item.metadata?.title;
    const desc = item.metadata?.description;
    if (!title && !desc) return node;
    return (
      <Tooltip
        arrow
        placement="top"
        componentsProps={{ tooltip: { sx: { p: 1.5, maxWidth: 320 } } }}
        title={
          <Stack spacing={0.5}>
            {title && (
              <Typography variant="body2" fontWeight={700}>
                {title}
              </Typography>
            )}
            {desc && (
              <Typography variant="caption" color="text.secondary">
                {desc}
              </Typography>
            )}
          </Stack>
        }
      >
        <span>{node as any}</span>
      </Tooltip>
    );
  };

  const wrapped = maybeWithTooltip(content);

  if (!safe) return wrapped;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      {wrapped}
    </a>
  );
}
