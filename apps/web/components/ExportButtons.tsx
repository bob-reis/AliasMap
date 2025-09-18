"use client";

import * as React from "react";
import { Stack, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import type { SiteEvent } from "../types";
import { exportCsv, exportJson } from "@/lib/export";

export default function ExportButtons({ username, events, sx }: { username: string; events: SiteEvent[]; sx?: any }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={sx}>
      <Button variant="contained" startIcon={<DownloadIcon />} disabled={!events.length} onClick={() => exportCsv(username, events)}>
        CSV
      </Button>
      <Button variant="contained" startIcon={<DownloadIcon />} disabled={!events.length} onClick={() => exportJson(username, events)}>
        JSON
      </Button>
    </Stack>
  );
}

