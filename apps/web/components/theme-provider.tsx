"use client";

import * as React from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import type { NodeProps } from "../types";

const LIGHT = {
  primary: { 
    main: "#00ff41", 
    light: "#41d165ff",
    dark: "#006118ff"
  },
  secondary: { main: "#16C5C0" },
  background: { default: "#f0f0f0", paper: "#FFFFFF" },
  text: { primary: "#0B1B34", secondary: "#374151" },
  error: { main: "#EF4444" },
  found: "#10B981",
  inconclusive: "#F59E0B",
  not_found: "#6B7280",
  unknown: "#EF4444",
} as const;


const DARK = {
  primary: {
    main: "#00ff41",
    light: "#41d165ff",
    dark: "#006118ff",
  },
  secondary: { main: "#F9FAFB" },
  background: { default: "#000", paper: "#000" },
  text: { primary: "#FFFFFF", secondary: "#9CA3AF" },
  error: { main: "#EF4444" },
  found: "#10B981",
  inconclusive: "#F59E0B",
  not_found: "#9CA3AF",
  unknown: "#EF4444",
} as const;

export function AppThemeProvider({ children }: NodeProps) {
  const [mode, setMode] = React.useState<"light" | "dark">("dark");
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = "matches" in e ? e.matches : mq.matches;
      setMode(isDark ? "dark" : "light");
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
    };
  }, []);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light" ? (LIGHT as any) : (DARK as any)),
        },
        typography: {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial",
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
