// lib/status.ts
export type NormalizedStatus = 'found' | 'not_found' | 'inconclusive' | 'error';

export function normalizeStatus(input: string | number): NormalizedStatus {
  const raw = String(input).trim().toLowerCase();
  const direct: Record<string, NormalizedStatus> = {
    'found': 'found',
    'not_found': 'not_found',
    'timeout': 'error',
    'error': 'error',
    'blocked': 'inconclusive',
    'weird': 'inconclusive',
    'forbidden': 'inconclusive',
    'captcha': 'inconclusive',
    'rate_limited': 'inconclusive',
  };
  if (raw in direct) return direct[raw];
  const code = Number(raw);
  if (Number.isFinite(code)) {
    // 2xx => found
    if (code >= 200 && code < 300) return 'found';
    // 403 => inconclusive (bloqueio/forbidden/captcha)
    if (code === 403) return 'inconclusive';
    // 404 => not_found
    if (code === 404) return 'not_found';
    // 3xx muitas vezes é redirect antes de login/captcha → tratar como inconclusive
    if (code >= 300 && code < 400) return 'inconclusive';
    // 5xx => erro do servidor
    if (code >= 500 && code < 600) return 'error';
    // Outros códigos incomuns → inconclusive
    return 'inconclusive';
  }
  return 'inconclusive';
}
