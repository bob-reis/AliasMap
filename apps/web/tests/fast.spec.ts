import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runFastRecon } from '../lib/fast';

describe('runFastRecon (status-only fast mode)', () => {
  const urls = [
    'https://example.com/u/{username}',
    'https://example.com/missing/{username}',
    'https://example.com/blocked/{username}',
    'https://example.com/error/{username}'
  ];

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    // @ts-expect-error - override global
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/u/')) {
        return { status: 200 } as any;
      }
      if (url.includes('/missing/')) {
        return { status: 404 } as any;
      }
      if (url.includes('/blocked/')) {
        return { status: 403 } as any;
      }
      if (url.includes('/error/')) {
        throw new Error('boom');
      }
      return { status: 418 } as any; // default inconclusive
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    // @ts-expect-error - restore
    global.fetch = originalFetch;
  });

  it('classifies status codes into fast statuses', async () => {
    const res = await runFastRecon({ username: 'alice', urls, concurrency: 2, timeoutMs: 100 });
    expect(res).toHaveLength(4);

    const byUrl = Object.fromEntries(res.map(r => [r.url, r]));

    expect(byUrl['https://example.com/u/alice'].status).toBe('found');
    expect(byUrl['https://example.com/missing/alice'].status).toBe('not_found');
    expect(byUrl['https://example.com/blocked/alice'].status).toBe('inconclusive');
    expect(byUrl['https://example.com/error/alice'].status).toBe('error');
  });
});

