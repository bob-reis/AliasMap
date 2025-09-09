import { AppThemeProvider } from "@/components/theme-provider";
import type { RootLayoutProps } from "../types";
export const metadata = {
  title: "AliasMap",
  description: "OSINT username mapping with ethical, public-only collection.",
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
