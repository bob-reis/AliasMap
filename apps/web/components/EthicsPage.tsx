import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  useTheme,
} from "@mui/material";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { disclaimerPt } from "../lib/constants";

export const metadata = { title: "Aviso e Uso Ético — AliasMap" };

export default function EthicsPage() {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Alerta inicial */}
      <Alert
        severity="warning"
        icon={<AlertTriangle size={20} />}
        sx={{
          borderRadius: 2,
          backgroundColor: theme.palette.warning.light + "20", // leve transparência
          mb: 3,
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          Leia atentamente todos os termos antes de utilizar nossos serviços
        </Typography>
      </Alert>

      {/* Bloco principal */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: "transparent",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Info
            size={20}
            color={theme.palette.text.primary}
            style={{ marginRight: 8 }}
          />
          <Typography variant="h6" fontWeight="medium">
            Aviso e Uso Ético
          </Typography>
        </Box>

        <Typography
          component="div"
          variant="body1"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            color: "text.primary",
            fontSize: "0.95rem",
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          }}
        >
          {disclaimerPt}
        </Typography>
      </Paper>

      {/* Confirmação final */}
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="success"
          icon={<CheckCircle size={20} color="#4caf50" />}
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight="medium">
            Ao utilizar nossos serviços, você concorda com estes termos
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}
