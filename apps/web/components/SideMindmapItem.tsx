/* istanbul ignore file */
"use client";

import * as React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { ExternalLink } from "lucide-react";
import type { MindmapItem } from "../types";
import { isSafeHttpUrl } from "@/lib/ui";

export default function SideMindmapItem({ item, color, dashed, muted }: { item: MindmapItem; color: string; dashed?: boolean; muted?: boolean }) {
  const safe = isSafeHttpUrl(item.url);
  const chip = (
    <Chip
      variant={muted ? "outlined" : "filled"}
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

  if (!safe) return content;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </a>
  );
}
