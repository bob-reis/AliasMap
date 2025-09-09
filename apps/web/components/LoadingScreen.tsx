"use client";

import * as React from "react";
import { Stack, Typography, LinearProgress, Alert } from "@mui/material";
import CustomLoadingScreen from "./CustomLoading";
import type { LoadingProps } from "../types";

export default function LoadingScreen({ progress, error }: LoadingProps) {
  return (
    <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ textAlign: "center" }}>
      <Typography variant="h6">Varredura em andamento</Typography>

      <LinearProgress
        variant="determinate"
        value={progress.total ? (progress.done / progress.total) * 100 : 0}
        color={error ? "error" : "info"}
        sx={{ width: "60%" }}
      />

      <CustomLoadingScreen width={150} barHeight={10} ariaLabel="Varredura em andamento" />

      {!!error && <Alert severity="warning">{error}</Alert>}
    </Stack>
  );
}
