'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EthicsBanner } from '../components/EthicsBanner';
import { buildMindmap } from '../lib/mindmap';
import { platformLabel } from '../lib/platforms';
import { MindmapPreview } from '../components/MindmapPreview';

type SiteEvent =
  | { type: 'site_start'; id: string }
  | { type: 'site_result'; id: string; status: string; url?: string; latencyMs?: number; reason?: string; evidence?: { kind: string; value: string }[]; heuristic?: boolean }
  | { type: 'site_error'; id: string; reason: string }
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; summary: { done: number; total: number } };

export default function Home() {
  const [username, setUsername] = useState('');
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [running, setRunning] = useState(false);
  // Show only truly found; do not coerce 'inconclusive' to 'found'

  const canStart = useMemo(() => {
    return !running && username.trim().length > 0;
  }, [running, username]);

  const identityStatus = (s: string) => s;

  // Progress is intentionally hidden from the UI per request.

  const latestByPlatform = useMemo(() => {
    type SiteResultEvent = Extract<SiteEvent, { type: 'site_result' }>;
    type UiResult = (SiteResultEvent & { platform: string; rawStatus: SiteResultEvent['status']; heuristic?: boolean }) & {
      status: 'found' | 'not_found' | 'inconclusive' | string;
    };
    const map = new Map<string, UiResult>();
    for (const e of events) {
      if (e.type === 'site_result') {
        const label = platformLabel(e.id);
        map.set(e.id, { ...e, rawStatus: e.status, status: identityStatus(e.status), platform: label });
      }
    }
    return Array.from(map.values());
  }, [events]);

  const startScan = () => {
    if (!username) return;
    setEvents([]);
    setRunning(true);
    const es = new EventSource(`/api/scan?username=${encodeURIComponent(username)}&tier=all`);

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as SiteEvent;
        setEvents(prev => [...prev, data]);
        if (data.type === 'done') {
          es.close();
          setRunning(false);
        }
      } catch (e) {
        // ignore parse errors in stub
      }
    };

    es.onerror = () => {
      es.close();
      setRunning(false);
    };
  };

  const exportJson = () => {
    const mindmap = buildMindmap(username, events);
    const header = {
      tool: 'AliasMap',
      note:
        'Dados coletados de fontes públicas. Uso responsável. Nenhuma persistência no servidor. Consulte o Aviso e Uso Ético.'
    };
    const payload = { header, username, events, mindmap };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aliasmap-${username || 'resultado'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = 'tool=AliasMap;note=Dados coletados de fontes públicas; etica=/ethics\n';
    const rows = [['platform', 'status', 'url', 'latencyMs', 'reason', 'heuristic']];
    for (const e of events) {
      if (e.type === 'site_result') {
        const st = e.status;
        rows.push([
          e.id,
          st,
          e.url ?? '',
          String(e.latencyMs ?? ''),
          e.reason ?? '',
          e.heuristic ? 'yes' : ''
        ]);
      }
    }
    const csv = header + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aliasmap-${username || 'resultado'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <EthicsBanner />
      <h1>AliasMap</h1>
      <p>Mapeie possíveis perfis por username em plataformas públicas. Coleta ética e sem persistência.</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <input
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canStart) startScan(); }}
          disabled={running}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <button onClick={startScan} disabled={!canStart} style={{ padding: '8px 12px' }}>
          {running ? 'Executando…' : 'Iniciar varredura'}
        </button>
        <button onClick={exportCsv} disabled={!events.length} style={{ padding: '8px 12px' }}>
          Exportar CSV
        </button>
        <button onClick={exportJson} disabled={!events.length} style={{ padding: '8px 12px' }}>
          Exportar JSON
        </button>
        <Link href="/ethics" style={{ marginLeft: 'auto' }}>Aviso e Uso Ético</Link>
      </div>

      {/* Progress hidden */}

      {running ? (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden>⏳</span>
          <span>Varredura em andamento…</span>
        </div>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h2>Mindmap (pré-visualização)</h2>
        {/* Filter removed: always showing only found results */}
        <div style={{ marginTop: 12 }}>
          <MindmapPreview
            username={username}
            items={latestByPlatform.filter(e => e.status === 'found')}
          />
        </div>
      </section>
    </div>
  );
}
