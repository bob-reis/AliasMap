"use client";

import * as React from "react";
import Image from "next/image";
import logo from "./icon.svg";
import { Box, Container, Paper, Stack, Typography, IconButton, Tooltip } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import GavelIcon from "@mui/icons-material/Gavel";
import SearchScreen from "@/components/SearchScreen";
import Loading from "@/components/LoadingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import EthicsPage from "@/components/EthicsPage";
import type { SiteEvent, Status, MindmapItem } from "../types";
import { normalizeStatus } from "@/lib/status";

export default function HomeStepsSimple() {
  const [step, setStep] = React.useState<0 | 1 | 2 | 3>(0);
  const [username, setUsername] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<SiteEvent[]>([]);
  const [progress, setProgress] = React.useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const esRef = React.useRef<EventSource | null>(null);

  const latestByPlatform = React.useMemo(() => {
    const latestByPlatform = new Map<string, Extract<SiteEvent, { type: "site_result" }>>();
    for (const e of events) {
      if (e.type === "site_result") latestByPlatform.set(e.id, e);
    }
    return latestByPlatform;
  }, [events]);

  const itemsAll: MindmapItem[] = React.useMemo(() => {
    return Array.from(latestByPlatform.values()).map((e) => ({
      platform: e.id,
      status: normalizeStatus(e.status) as Status,
      rawStatus: e.status,
      heuristic: e.heuristic,
      url: e.url,
    }));
  }, [latestByPlatform]);

  const itemsFocus: MindmapItem[] = React.useMemo(
    () => itemsAll.filter((i) => i.status === "found" || i.status === "inconclusive"),
    [itemsAll]
  );

  const startScan = (name: string) => {
    if (!name) return;
    const isValid = /^[a-zA-Z0-9._-]{3,32}$/.test(name);
    if (!isValid) {
      setError("Username inválido. Use 3–32 caracteres: letras, números, ponto, traço e sublinhado.");
      return;
    }
    const normalizedUsername = name.trim().toLowerCase();
    setUsername(normalizedUsername);

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStep(1);
    setEvents([]);
    setError(null);
    setProgress({ done: 0, total: 0 });
    setRunning(true);

    const es = new EventSource(`/api/scan?username=${encodeURIComponent(normalizedUsername)}&tier=all`);
    esRef.current = es;

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as SiteEvent;
        setEvents((prev) => [...prev, data]);
        if (data.type === "progress") {
          setProgress({ done: data.done, total: data.total });
        }

        if (data.type === "done") {
          es.close();
          esRef.current = null;
          setRunning(false);
          setStep(2);
        }
      } catch (error) {
        console.error("Erro ao processar evento SSE:", error);
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
      setError("Falha na conexão de varredura (SSE). Tente novamente.");
    };
  };

  const resetAll = () => {
    setStep(0);
    setUsername("");
    setEvents([]);
    setError(null);
    setProgress({ done: 0, total: 0 });
    setRunning(false);
  };

  const handleEthicsClick = () => {
    setStep(3);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", p: { xs: 2, md: 3 } }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Image src={logo} alt="AliasMap logo" width={32} height={32} style={{ borderRadius: 6 }} />
            <Typography variant="h5" fontWeight={800}>
              AliasMap
            </Typography>
          </Stack>

          {step > 0 && (
            <Tooltip title="Reiniciar">
              <IconButton onClick={resetAll}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          )}

          {step === 0 && (
            <Tooltip title="Aviso e Uso Ético">
              <IconButton onClick={handleEthicsClick}>
                <GavelIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: "none",
            boxShadow: "none",
            backgroundColor: "transparent",
            width: "100%",
          }}
        >
          {step === 0 && <SearchScreen onStart={startScan} loading={running} />}
          {step === 1 && <Loading progress={progress} error={error || undefined} />}
          {step === 2 && (
            <ResultsScreen trimmed={username.trim()} itemsFocus={itemsFocus} itemsAll={itemsAll} events={events} />
          )}
          {step === 3 && <EthicsPage />}
        </Paper>
      </Container>
    </Box>
  );
}
