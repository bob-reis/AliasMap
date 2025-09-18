import type { ReactNode } from "react";

export type NodeProps = Readonly<{ children: ReactNode }>;

export type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export type CustomLoadingProps = Readonly<{
  width?: number;
  barHeight?: number;
  ariaLabel?: string;
}>;

export type LoadingProps = Readonly<{
  progress: { done: number; total: number };
  error?: string;
}>;

export type LegendProps = Readonly<{ label: string; color: string }>;

export type EdgeProps = Readonly<{
  idx: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  animate?: boolean;
  prefix: string;
}>;

export type Status = "found" | "not_found" | "inconclusive" | "error";

export type MindmapItem = Readonly<{
  platform: string;
  status: Status;
  rawStatus?: string;
  heuristic?: boolean;
  url?: string;
  metadata?: { image?: string; title?: string; description?: string };
}>;

export type MindmapPreviewProps = Readonly<{
  username: string;
  items: MindmapItem[];
  width?: number;
  height?: number;
  radius?: number;
  className?: string;
  maxLabel?: number;
  events: SiteEvent[];
  exportData?: boolean;
  showPreviews?: boolean;
}>;

export type SiteEvent =
  | { type: "site_start"; id: string }
  | {
      type: "site_result";
      id: string;
      status: string;
      url?: string;
      latencyMs?: number;
      reason?: string;
      heuristic?: boolean;
      metadata?: { image?: string; title?: string; description?: string };
    }
  | { type: "site_error"; id: string; reason: string }
  | { type: "progress"; done: number; total: number }
  | { type: "done"; summary: { done: number; total: number } };

export type ResultsFilter = "focus" | "all" | "found" | "inconclusive" | "not_found" | "error";

export type ResultsScreenProps = Readonly<{
  events: SiteEvent[];
  trimmed: string;
  itemsFocus: MindmapItem[];
  itemsAll: MindmapItem[];
}>;

export type SearchScreenProps = Readonly<{
  onStart: (username: string) => void;
  loading?: boolean;
}>;
