/* istanbul ignore file */
"use client";

import * as React from "react";
import { Stack, Typography } from "@mui/material";
import type { MindmapItem } from "../types";
import SideMindmapItem from "@/components/SideMindmapItem";

type GroupLike = {
  key: string;
  label: string;
  items: MindmapItem[];
  color: string;
  dashed?: boolean;
  muted?: boolean;
  refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
};

export default function GroupSections({ groups }: { groups: GroupLike[] }) {
  return (
    <Stack spacing={1.25}>
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <React.Fragment key={g.key}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, color: g.color }}>
              {g.label}
            </Typography>
            {g.items.map((i, idx) => (
              <div key={`${g.key}-${i.platform}`} ref={(el) => (g.refs.current[idx] = el)}>
                <SideMindmapItem item={i} color={g.color} dashed={g.dashed} muted={g.muted} />
              </div>
            ))}
          </React.Fragment>
        ))}
    </Stack>
  );
}
