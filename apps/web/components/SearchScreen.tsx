"use client";

import * as React from "react";
import { Stack, TextField, Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { SearchScreenProps } from "../types";

export default function SearchScreen({ onStart, loading = false }: SearchScreenProps) {
  const [username, setUsername] = React.useState("");
  const trimmed = username.trim();
  const isValid = trimmed.length >= 3 && /^[a-zA-Z0-9._-]{3,32}$/.test(trimmed);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ border: "none", boxShadow: "none" }}
    >
      <TextField
        fullWidth
        placeholder="Digite um username"
        size="small"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && isValid) onStart(trimmed);
        }}
        inputProps={{ "aria-label": "username" }}
      />

      {/* Container do botão: 100% no mobile, auto no desktop */}
      <Stack
        direction="row"
        spacing={1}
        flexShrink={0}
        justifyContent={{ xs: "center", sm: "flex-end" }}
        sx={{ width: { xs: "100%", sm: "auto" }, mt: { xs: 0, sm: 0 } }}
      >
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={() => onStart(trimmed)}
          disabled={!isValid || loading}
          aria-disabled={!isValid || loading}
          // Botão ocupa a linha toda no mobile; no desktop fica no tamanho natural
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Iniciar
        </Button>
      </Stack>
    </Stack>
  );
}
