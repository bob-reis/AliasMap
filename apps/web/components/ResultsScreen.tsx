"use client";

import * as React from "react";
import { Stack, Typography, Alert, ToggleButtonGroup, ToggleButton, Box, Chip } from "@mui/material";
import { MindmapPreview } from "@/components/MindmapPreview";
import { SideMindmap } from "@/components/SideMindmap";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ResultsScreenProps, ResultsFilter, MindmapItem } from "../types";

export default function ResultsScreen({ trimmed, itemsFocus, itemsAll, events }: ResultsScreenProps) {
  const [filter, setFilter] = React.useState<ResultsFilter>("focus");
  const [layout, setLayout] = React.useState<"lateral" | "radial">("lateral");

  const items: MindmapItem[] = React.useMemo(() => {
    switch (filter) {
      case "focus":
        return itemsFocus;
      case "all":
        return itemsAll;
      case "found":
        return itemsAll.filter((i) => i.status === "found");
      case "inconclusive":
        return itemsAll.filter((i) => i.status === "inconclusive");
      case "not_found":
        return itemsAll.filter((i) => i.status === "not_found");
      case "error":
        return itemsAll.filter((i) => i.status === "error");
      default:
        return itemsFocus;
    }
  }, [filter, itemsAll, itemsFocus]);

  const hasData = items.length > 0;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1}>
        <Typography variant="h6">Resultado</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            value={layout}
            exclusive
            onChange={(_, v: "lateral" | "radial" | null) => v && setLayout(v)}
            aria-label="Layout do mapa"
          >
            <ToggleButton value="lateral" aria-label="Mapa lateral">
              Mapa lateral
            </ToggleButton>
            <ToggleButton value="radial" aria-label="Mapa radial">
              Mapa radial
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={(_, v: ResultsFilter | null) => v && setFilter(v)}
            aria-label="Filtro de resultados"
          >
          <ToggleButton value="focus" aria-label="Encontrado e Inconclusivo">
            Foco
          </ToggleButton>
          <ToggleButton value="all" aria-label="Todos">
            Todos
          </ToggleButton>
          <ToggleButton value="found" aria-label="Apenas Encontrado">
            Encontrado
          </ToggleButton>
          <ToggleButton value="inconclusive" aria-label="Apenas Inconclusivo">
            Inconclusivo
          </ToggleButton>
          <ToggleButton value="not_found" aria-label="Apenas Não encontrado">
            Não encontrado
          </ToggleButton>
          <ToggleButton value="error" aria-label="Apenas Erro">
            Erro
          </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {!hasData ? (
        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          Nenhum item para exibir neste filtro.
        </Alert>
      ) : layout === "lateral" ? (
        <SideMindmap username={trimmed} items={items} events={events} />
      ) : (
        <MindmapPreview username={trimmed} items={items} events={events} />
      )}
      <Box>
        <Chip size="small" label={`Total: ${itemsAll.length}`} sx={{ mr: 1 }} />
        <Chip size="small" color="success" label={`Encontrado: ${itemsAll.filter((i) => i.status === "found").length}`} sx={{ mr: 1 }} />
        <Chip size="small" color="warning" label={`Inconclusivo: ${itemsAll.filter((i) => i.status === "inconclusive").length}`} sx={{ mr: 1 }} />
        <Chip size="small" variant="outlined" label={`Não encontrado: ${itemsAll.filter((i) => i.status === "not_found").length}`} sx={{ mr: 1 }} />
        <Chip size="small" color="error" label={`Erro: ${itemsAll.filter((i) => i.status === "error").length}`} />
      </Box>
    </Stack>
  );
}
