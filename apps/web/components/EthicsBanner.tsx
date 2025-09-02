import Link from 'next/link';

export function EthicsBanner() {
  return (
    <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: 8, borderRadius: 6, margin: '12px 0' }}>
      Coleta apenas de dados públicos. Use de forma ética e responsável. Leia o <Link href="/ethics">Aviso e Uso Ético</Link>.
    </div>
  );
}

