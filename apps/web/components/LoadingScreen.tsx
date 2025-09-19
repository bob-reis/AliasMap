"use client";

import * as React from "react";
import { Stack, Typography, LinearProgress, Alert } from "@mui/material";
import CustomLoadingScreen from "./CustomLoading";
import type { LoadingProps } from "../types";

export default function LoadingScreen({ progress, error }: LoadingProps) {
  const percent = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <Stack
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ textAlign: "center", px: 2 }}
    >
      <Typography variant="h6">Varredura em andamento</Typography>

      <LinearProgress
        variant="determinate"
        value={percent}
        color={error ? "error" : "secondary"}
        sx={{ width: { xs: "100%", sm: "60%" }, borderRadius: 1 }}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <CustomLoadingScreen
        width={150}
        barHeight={10}
        ariaLabel="Varredura em andamento"
      />

      {!!error && <Alert severity="warning">{error}</Alert>}
    </Stack>
  );
}
