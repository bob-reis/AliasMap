export type FastStatus = 'found' | 'not_found' | 'inconclusive' | 'error';

export interface FastResult {
  url: string;
  status: FastStatus;
  statusCode?: number;
  latencyMs: number;
  error?: string;
}

function replaceAllUsername(tpl: string, username: string) {
  return tpl.split('{username}').join(username);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      }
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export interface FastOptions {
  username: string;
  urls: string[];
  timeoutMs?: number;
  concurrency?: number;
}

export async function runFastRecon(opts: FastOptions): Promise<FastResult[]> {
  const timeoutMs = Math.max(1000, opts.timeoutMs ?? 6000);
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 10, 24));
  const targets = opts.urls.map(u => replaceAllUsername(u, opts.username));

  const out: FastResult[] = [];
  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (url) => {
        const start = Date.now();
        try {
          const res = await fetchWithTimeout(url, timeoutMs);
          const code = res.status;
          let status: FastStatus;
          if (code === 200 || (code >= 201 && code < 300)) {
            status = 'found';
          } else if (code === 404 || code === 410) {
            status = 'not_found';
          } else if (code === 0) {
            status = 'error';
          } else {
            // 3xx followed, 401/403/429 and other oddities → inconclusive
            status = 'inconclusive';
          }
          return { url, status, statusCode: code, latencyMs: Date.now() - start } satisfies FastResult;
        } catch (e: any) {
          return { url, status: 'error', latencyMs: Date.now() - start, error: e?.message || 'error' } satisfies FastResult;
        }
      })
    );
    out.push(...results);
  }
  return out;
}

