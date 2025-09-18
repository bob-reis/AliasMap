import { describe, it, expect } from 'vitest';
import { buildCsv, buildJson } from '../lib/export';
import type { SiteEvent } from '../types';

const events: SiteEvent[] = [
  { type: 'site_result', id: 'github', status: 'found', url: 'https://github.com/user' },
  { type: 'site_result', id: 'x', status: 'error', reason: 'timeout' },
  { type: 'progress', done: 1, total: 2 },
  { type: 'done', summary: { done: 2, total: 2 } },
];

describe('export helpers', () => {
  it('builds CSV with escaping', () => {
    const csv = buildCsv('alice', events);
    expect(csv.startsWith('user=alice')).toBe(true);
    expect(csv).toContain('"platform","status","url"');
    expect(csv).toContain('"github","found","https://github.com/user"');
    // no quotes breaking
    const csv2 = buildCsv('a', [{ type: 'site_result', id: 'q', status: 'found', url: 'https://ex.com/?a="b"' } as any]);
    expect(csv2).toContain('"https://ex.com/?a=""b"""');
  });

  it('builds JSON string with expected shape', () => {
    const json = buildJson('alice', events);
    const parsed = JSON.parse(json);
    expect(parsed.username).toBe('alice');
    expect(Array.isArray(parsed.events)).toBe(true);
    expect(parsed.events.length).toBe(events.length);
  });
});

