type Event =
  | { type: 'site_start'; id: string }
  | { type: 'site_result'; id: string; status: string; url?: string; latencyMs?: number }
  | { type: 'site_error'; id: string; reason: string }
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; summary: { done: number; total: number } };

export function buildMindmap(username: string, events: Event[]) {
  const nodes: any[] = [];
  const edges: any[] = [];

  const rootId = `root:${username || 'alvo'}`;
  nodes.push({ id: rootId, type: 'Root', label: username || 'alvo' });

  const seen = new Set<string>();
  for (const e of events) {
    if (e.type === 'site_result') {
      const pid = `platform:${e.id}`;
      if (!seen.has(pid)) {
        nodes.push({ id: pid, type: 'Platform', label: e.id });
        seen.add(pid);
      }
      const status = e.status === 'inconclusive' ? 'found' : e.status;
      edges.push({ from: rootId, to: pid, type: 'scanned', status });
    }
  }

  return { nodes, edges };
}
