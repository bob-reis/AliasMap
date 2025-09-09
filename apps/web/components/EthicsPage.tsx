import { Container, Paper, Typography, Box, Alert, useTheme } from "@mui/material";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { disclaimerPt } from "../lib/constants";

export const metadata = { title: "Aviso e Uso Ético — AliasMap" };

export default function EthicsPage() {
  const theme = useTheme();
  return (
    <Container>
      <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2, background: "transparent" }}>
        <Typography variant="body2" fontWeight="medium">
          Leia atentamente todos os termos antes de utilizar nossos serviços
        </Typography>
      </Alert>
      <Paper
        elevation={1}
        sx={{
          p: 3,
          backgroundColor: "transparent",
          borderRadius: 2,
          border: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Info size={20} color={theme.palette.text.primary} style={{ marginRight: "8px" }} />
          <Typography variant="h6" color={theme.palette.text.primary} fontWeight="medium">
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
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <CheckCircle size={24} color="#4caf50" style={{ marginRight: "8px" }} />
          <Typography variant="body2" color="success.main" fontWeight="medium">
            Ao utilizar nossos serviços, você concorda com estes termos
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
