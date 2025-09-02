import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'AliasMap',
  description: 'OSINT username mapping with ethical, public-only collection.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial' }}>
        <header style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/">AliasMap</Link>
            <Link href="/ethics">Aviso e Uso Ético</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 880, margin: '0 auto', padding: 16 }}>{children}</main>
        <footer style={{ padding: 16, borderTop: '1px solid #e5e7eb', marginTop: 24 }}>
          <small>
            © {new Date().getFullYear()} AliasMap — Coleta apenas de dados públicos. Consulte{' '}
            <Link href="/ethics">Aviso e Uso Ético</Link>.
          </small>
        </footer>
      </body>
    </html>
  );
}

