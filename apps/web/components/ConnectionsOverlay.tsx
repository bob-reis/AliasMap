"use client";

import * as React from "react";

export type Conn = { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean };

export default function ConnectionsOverlay({ width, height, conns }: { width: number; height: number; conns: Conn[] }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%", height: "100%" }}>
      {conns.map((c, i) => {
        const ctrlX = (c.x1 + c.x2) / 2;
        const d = `M ${c.x1} ${c.y1} Q ${ctrlX} ${c.y1} ${c.x2} ${c.y2}`;
        return <path key={i} d={d} stroke={c.color} strokeWidth={1.25} fill="none" strokeDasharray={c.dashed ? "4 3" : undefined} strokeOpacity={0.5} />;
      })}
    </svg>
  );
}

