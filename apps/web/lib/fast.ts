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

  // helpers locais
  const execOne = (re: RegExp, s: string): string | undefined => {
    re.lastIndex = 0;
    return re.exec(s)?.[1];
  };

  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(async (url) => {
        const start = Date.now();
        try {
          const res = await fetchWithTimeout(url, timeoutMs);
          const code = res.status;

          // mapeamento direto por status
          if (code === 404 || code === 410) {
            return { url, status: 'not_found', statusCode: code, latencyMs: Date.now() - start } as FastResult;
          }
          if (code === 0) {
            return { url, status: 'error', statusCode: code, latencyMs: Date.now() - start } as FastResult;
          }
          if (code === 403) {
            return { url, status: 'inconclusive', statusCode: code, latencyMs: Date.now() - start } as FastResult;
          }

          // 2xx/3xx/401/429/etc → heurística leve com canonical/og:url contendo o username no host esperado
          let body = '';
          try {
            body = await res.text();
          } catch {
            // ignore
          }

          const finalUrl = (res as any).url || url;
          const expectedHost = (() => {
            try { return new URL(url).host.toLowerCase(); } catch { return ''; }
          })();
          const usernameLower = opts.username.toLowerCase();

          const finalOk = (() => {
            try {
              const p = new URL(finalUrl);
              return p.host.toLowerCase().includes(expectedHost) &&
                     p.href.toLowerCase().includes(usernameLower);
            } catch {
              return false;
            }
          })();

          // usa RegExp.exec() (S6594)
          const canonical = execOne(
            /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i,
            body
          );
          const ogUrl = execOne(
            /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i,
            body
          );

          const profileOk = (val?: string) => {
            if (!val) return false;
            try {
              const p = new URL(val, finalUrl);
              return p.host.toLowerCase().includes(expectedHost) &&
                     p.href.toLowerCase().includes(usernameLower);
            } catch {
              return false;
            }
          };

          const status: FastStatus =
            finalOk || profileOk(canonical) || profileOk(ogUrl) ? 'found' : 'inconclusive';

          return { url, status, statusCode: code, latencyMs: Date.now() - start } as FastResult;
        } catch (e: any) {
          return {
            url,
            status: 'error',
            latencyMs: Date.now() - start,
            error: e?.message || 'error'
          } as FastResult;
        }
      })
    );

    out.push(...results);
  }

  return out;
}
