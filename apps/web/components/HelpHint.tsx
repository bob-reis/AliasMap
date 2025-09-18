"use client";

import * as React from "react";
import { Stack, Tooltip, Typography } from "@mui/material";
import { Info } from "lucide-react";

export default function HelpHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip arrow title={<span style={{ fontSize: 12 }}>{children}</span>}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary", cursor: "help" }}>
        <Info size={18} />
        <Typography variant="caption">Ajuda</Typography>
      </Stack>
    </Tooltip>
  );
}

