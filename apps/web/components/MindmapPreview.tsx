import React, { useMemo } from 'react';

type Item = {
  platform: string;
  status: 'found' | 'not_found' | 'inconclusive' | string;
  rawStatus?: 'found' | 'not_found' | 'inconclusive' | string;
};

export function MindmapPreview({ username, items }: { username: string; items: Item[] }) {
  const width = 600;
  const height = 420;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 140;

  const nodes = useMemo(() => {
    const N = Math.max(1, items.length);
    return items.map((it, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { ...it, x, y };
    });
  }, [items, cx, cy, radius]);

  const colorFor = (status: string) => {
    if (status === 'found') return '#10B981'; // green
    if (status === 'inconclusive') return '#F59E0B'; // amber
    if (status === 'not_found') return '#9CA3AF'; // gray
    return '#EF4444'; // red for errors/unknown
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mindmap preview">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Root node */}
        <circle cx={cx} cy={cy} r={34} fill="#111827" stroke="#2563EB" strokeWidth={2} filter="url(#shadow)" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#F9FAFB" fontSize={12}>
          {username || 'alvo'}
        </text>

        {/* Edges */}
        {nodes.map((n) => (
          <line key={`edge-${n.platform}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#D1D5DB" strokeWidth={1} />
        ))}

        {/* Platform nodes */}
        {nodes.map((n) => (
          <g key={n.platform}>
            <circle cx={n.x} cy={n.y} r={20} fill="#FFFFFF" stroke={colorFor(n.rawStatus ?? n.status)} strokeWidth={2} filter="url(#shadow)" />
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fill="#111827" fontSize={11}>
              {n.platform}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
