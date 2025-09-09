"use client";

import * as React from "react";
import { Stack, Typography, Alert } from "@mui/material";
import { MindmapPreview } from "@/components/MindmapPreview";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ResultsScreenProps } from "../types";

export default function ResultsScreen({ hasData, trimmed, foundOnly, events }: ResultsScreenProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Resultado</Typography>
      {!hasData ? (
        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          Nenhuma evidência confirmada.
        </Alert>
      ) : (
        <MindmapPreview username={trimmed} items={foundOnly} events={events} />
      )}
    </Stack>
  );
}
