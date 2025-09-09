"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { useTheme, alpha, lighten, darken } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import type { CustomLoadingProps } from "../types";

const barAnim = keyframes`
  0% { background-position: left; }
  100% { background-position: right; }
`;
const searchAnim = keyframes`
  0% { transform: translateX(0%) rotate(70deg); }
  100% { transform: translateX(100px) rotate(10deg); }
`;

export default function CustomLoadingScreen({ width = 130, barHeight = 8, ariaLabel = "Carregando" }: CustomLoadingProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light ?? lighten(primary, 0.35);
  const primaryDark = theme.palette.primary.dark ?? darken(primary, 0.3);
  const primarySoft = alpha(primary, 0.22);

  return (
    <Box
      component="output"
      aria-live="polite"
      aria-label={ariaLabel}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: `calc(${barHeight}px * 10)`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width,
          height: "fit-content",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <Box
            component="span"
            sx={{
              width: "100%",
              height: barHeight,
              borderRadius: "10px",
              background: `linear-gradient(to right, ${primaryDark}, ${primaryLight}, ${primaryDark})`,
              backgroundSize: "200% 100%",
              animation: `${barAnim} 3s ease-in-out infinite alternate-reverse`,
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none !important",
              },
            }}
          />
          <Box
            component="span"
            sx={{
              width: "50%",
              height: barHeight,
              borderRadius: "10px",
              background: `linear-gradient(to right, ${primaryDark}, ${primaryLight}, ${primaryDark})`,
              backgroundSize: "200% 100%",
              animation: `${barAnim} 3s ease-in-out infinite alternate-reverse`,
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none !important",
              },
            }}
          />
        </Box>
        <Box
          component="svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 101 114"
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "-25px",
            mt: "18px",
            zIndex: 2,
            width: "70%",
            color: primaryDark,
            animation: `${searchAnim} 3s ease-in-out infinite alternate-reverse`,
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none !important",
            },
            "& circle, & line": {
              stroke: "currentColor",
            },
            "& circle": {
              fill: primarySoft,
            },
          }}
        >
          <circle cx="46.1726" cy="46.1727" r="29.5497" transform="rotate(36.0692 46.1726 46.1727)" strokeWidth={7} />
          <line x1="61.7089" y1="67.7837" x2="97.7088" y2="111.784" strokeWidth={7} />
        </Box>
      </Box>
    </Box>
  );
}
