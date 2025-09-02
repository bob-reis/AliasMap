import { CORE_SITES } from './sites.core';
import type { SiteResult, SiteSpec } from './types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function compilePattern(pattern: string, username: string, flags: string) {
  // Avoid String.prototype.replaceAll to support ES2020 target
  const replaced = pattern.split('{username}').join(username);
  return new RegExp(replaced, flags);
}

function normalizeUsername(username: string, site: SiteSpec): string | null {
  let u = username;
  if (!site.norm?.caseSensitive) u = u.toLowerCase();
  if (site.norm?.allowed) {
    const re = new RegExp(`^${site.norm.allowed}$`);
    if (!re.test(u)) return null;
  }
  return u;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function checkSite(site: SiteSpec, username: string): Promise<SiteResult> {
  const start = Date.now();
  const u = normalizeUsername(username, site);
  const url = site.profile.url.replace('{username}', u ?? username);
  if (!u) {
    return { id: site.id, status: 'inconclusive', url, latencyMs: Date.now() - start, reason: 'username not allowed by site rules' };
  }

  try {
    const timeout = site.profile.timeoutMs ?? 3500;
    const res = await fetchWithTimeout(url, timeout);
    const status = res.status;
    if (status === 404) {
      return { id: site.id, status: 'not_found', url, latencyMs: Date.now() - start };
    }
    const body = await res.text();
    const flags = site.norm?.caseSensitive ? 'm' : 'mi';
    // Prefer patterns that include the username to reduce false positives
    const successOrdered = [...site.profile.successPatterns].sort((a, b) => {
      const au = a.includes('{username}') ? 0 : 1;
      const bu = b.includes('{username}') ? 0 : 1;
      return au - bu;
    });
    let matchedSuccess: string | undefined;
    let matchedNotFound: string | undefined;
    for (const p of successOrdered) {
      if (compilePattern(p, u, flags).test(body)) { matchedSuccess = p; break; }
    }
    for (const p of (site.profile.notFoundPatterns ?? [])) {
      if (compilePattern(p, u, flags).test(body)) { matchedNotFound = p; break; }
    }

    // Extra guard: if success pattern doesn't include username, also require body to contain username
    const hasUsernameText = (u ?? username);
    const usernameOk = matchedSuccess?.includes('{username}') ? true : new RegExp(hasUsernameText, flags).test(body);
    if (matchedSuccess && !matchedNotFound && usernameOk) {
      return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence: [{ kind: 'pattern', value: matchedSuccess }] };
    }
    if (matchedNotFound) {
      return { id: site.id, status: 'not_found', url, latencyMs: Date.now() - start, evidence: [{ kind: 'pattern', value: matchedNotFound }] };
    }
    return { id: site.id, status: 'inconclusive', url, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { id: site.id, status: 'error', url, latencyMs: Date.now() - start, reason: err?.message || 'error' };
  }
}

export interface ScanOptions {
  username: string;
  tier?: 'fundamental' | 'core' | 'optional';
  concurrency?: number;
}

export async function* runScan(opts: ScanOptions) {
  const tier = opts.tier ?? 'fundamental';
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 6, 10));
  const sites = CORE_SITES.filter(s => s.tier === tier);

  yield { type: 'progress', done: 0, total: sites.length } as const;
  let done = 0;
  for (let i = 0; i < sites.length; i += concurrency) {
    const batch = sites.slice(i, i + concurrency);
    for (const s of batch) yield { type: 'site_start', id: s.id } as const;
    const results = await Promise.all(batch.map(s => checkSite(s, opts.username)));
    for (const r of results) {
      yield { type: 'site_result', id: r.id, status: r.status, url: r.url, latencyMs: r.latencyMs, reason: r.reason, evidence: r.evidence } as const;
      done += 1;
      yield { type: 'progress', done, total: sites.length } as const;
      await sleep(10);
    }
  }
  yield { type: 'done', summary: { done, total: sites.length } } as const;
}

// Test helper: allows injecting sites for unit tests
export async function* runScanWithSites(sites: SiteSpec[], opts: { username: string; concurrency?: number }) {
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 6, 10));
  yield { type: 'progress', done: 0, total: sites.length } as const;
  let done = 0;
  for (let i = 0; i < sites.length; i += concurrency) {
    const batch = sites.slice(i, i + concurrency);
    for (const s of batch) yield { type: 'site_start', id: s.id } as const;
    const results = await Promise.all(batch.map(s => checkSite(s, opts.username)));
    for (const r of results) {
      yield { type: 'site_result', id: r.id, status: r.status, url: r.url, latencyMs: r.latencyMs, reason: r.reason, evidence: r.evidence } as const;
      done += 1;
      yield { type: 'progress', done, total: sites.length } as const;
    }
  }
  yield { type: 'done', summary: { done, total: sites.length } } as const;
}
