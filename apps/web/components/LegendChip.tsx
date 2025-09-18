"use client";

import * as React from "react";
import { Chip, Stack, Box } from "@mui/material";
import type { LegendProps } from "../types";

export default function LegendChip({ label, color }: LegendProps) {
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

