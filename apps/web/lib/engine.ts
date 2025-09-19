import { CORE_SITES } from './sites.core';
import type { SiteResult, SiteSpec, Evidence, Tier } from './types';
import { extractMeta } from './meta';
import { INFOOOZE_URLS } from './sites.infoooze';
import { canonicalPlatformIdFromUrl } from './platforms';

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
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        // Generic desktop UA to reduce variant HTML
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
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

    // Instagram: detect login redirect preserving username in `next` as strong existence signal
    if (site.id === 'instagram') {
      const ctrl0 = new AbortController();
      const id0 = setTimeout(() => ctrl0.abort(), timeout);
      try {
        const res0 = await fetch(url, {
          signal: ctrl0.signal,
          redirect: 'manual',
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
          }
        });
        if (res0.status === 404) {
          return { id: site.id, status: 'not_found', url, latencyMs: Date.now() - start };
        }
        if (res0.status >= 300 && res0.status < 400) {
          const loc = res0.headers.get('location') || '';
          const abs = (() => { try { return new URL(loc, url).href; } catch { return loc; } })();
          const dec = decodeURIComponent(abs.toLowerCase());
          const uname = (u ?? username).toLowerCase();
          if (dec.includes('/accounts/login/') && dec.includes(`/${uname}/`)) {
            return {
              id: site.id,
              status: 'found',
              url,
              latencyMs: Date.now() - start,
              evidence: [{ kind: 'final_url', value: abs }]
            };
          }
        }
        // Fall through to content-based heuristics below
      } catch (_) {
        // ignore and continue to generic flow
      } finally {
        clearTimeout(id0);
      }
    }

    const res = await fetchWithTimeout(url, timeout);
    const status = res.status;
    if (status === 404) {
      return { id: site.id, status: 'not_found', url, latencyMs: Date.now() - start };
    }
    const body = await res.text();
    const flags = site.norm?.caseSensitive ? 'm' : 'mi';
    // Extract canonical and og:url for strong confirmation
    const canonicalMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
    const ogUrlMatch = body.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
    const canonical = canonicalMatch?.[1];
    const ogUrl = ogUrlMatch?.[1];
    const expectedUrl = url;
    const expectedHost = (() => { try { return new URL(expectedUrl).host.toLowerCase(); } catch { return ''; } })();
    const usernameLower = (u ?? username).toLowerCase();
    const matchesProfile = (val?: string) => {
      if (!val) return false;
      try {
        const parsed = new URL(val, expectedUrl);
        const host = parsed.host.toLowerCase();
        const path = parsed.pathname.toLowerCase().replace(/\/+$/,'');
        return host === expectedHost && path.includes(usernameLower);
      } catch {
        return false;
      }
    };
    // Prefer patterns that include the username to reduce false positives
    const successOrdered = [...(site.profile.successPatterns ?? [])].sort((a, b) => {
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
    const canonicalOk = matchesProfile(canonical ?? undefined);
    const ogOk = matchesProfile(ogUrl ?? undefined);
    const finalUrlOk = matchesProfile(res.url);

    // Site-specific tightening: Instagram profile pages often gate content.
    // Strong signals:
    // - canonical/og:url matches the expected profile URL, OR
    // - og:image exists AND the title contains the @username (fallback)
    if (site.id === 'instagram') {
      if (!matchedNotFound) {
        const metadata = extractMeta(body, expectedUrl);
        const uname = (u ?? username).toLowerCase();
        const titleLc = (metadata.title || '').toLowerCase();
        const hasUserInTitle = titleLc.includes(`@${uname}`) || titleLc.includes(uname);
        if (usernameOk && (canonicalOk || ogOk)) {
          const evidence: Evidence[] = [];
          if (canonicalOk && canonical) evidence.push({ kind: 'canonical', value: canonical });
          if (ogOk && ogUrl) evidence.push({ kind: 'og:url', value: ogUrl });
          if (!evidence.length) evidence.push({ kind: 'username-text', value: (u ?? username) });
          return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence, metadata };
        }
        if (metadata.image && hasUserInTitle) {
          const evidence: Evidence[] = [{ kind: 'pattern', value: 'og:image & title match username' }];
          return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence, metadata };
        }
      }
      if (matchedNotFound) {
        return { id: site.id, status: 'not_found', url, latencyMs: Date.now() - start, evidence: [{ kind: 'pattern', value: matchedNotFound }] };
      }
      return { id: site.id, status: 'inconclusive', url, latencyMs: Date.now() - start };
    }

    // Site-specific override: Twitch message "time machine" indicates closed/suspended channel.
    // Treat as exists per investigation context.
    if (site.id === 'twitch') {
      if (matchedNotFound && /time machine/i.test(matchedNotFound)) {
        return {
          id: site.id,
          status: 'found',
          url,
          latencyMs: Date.now() - start,
          evidence: [{ kind: 'pattern', value: matchedNotFound }],
        };
      }
    }

    // Site-specific: Twitter suspended accounts count as present
    if (site.id === 'twitter') {
      const suspended = /suspended/i.test(body);
      if (!matchedNotFound && suspended) {
        const evidence: Evidence[] = [{ kind: 'pattern', value: 'Account suspended' }];
        if (canonicalOk && canonical) evidence.push({ kind: 'canonical', value: canonical });
        const metadata = extractMeta(body, url);
        return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence, metadata };
      }
    }

    // Generic fallback: if site declares no successPatterns, accept canonical/og/final URL evidence
    if ((!site.profile.successPatterns || site.profile.successPatterns.length === 0) && !matchedNotFound && usernameOk && (canonicalOk || ogOk || finalUrlOk)) {
      const evidence: Evidence[] = [];
      if (canonicalOk && canonical) evidence.push({ kind: 'canonical', value: canonical });
      if (ogOk && ogUrl) evidence.push({ kind: 'og:url', value: ogUrl });
      if (finalUrlOk && res.url) evidence.push({ kind: 'final_url', value: res.url });
      if (!evidence.length) evidence.push({ kind: 'username-text', value: (u ?? username) });
      const metadata = extractMeta(body, url);
      return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence, metadata };
    }

    if (matchedSuccess && !matchedNotFound && usernameOk && (canonicalOk || ogOk || finalUrlOk)) {
      const evidence: Evidence[] = [];
      evidence.push({ kind: 'pattern', value: matchedSuccess });
      if (canonicalOk && canonical) evidence.push({ kind: 'canonical', value: canonical });
      if (ogOk && ogUrl) evidence.push({ kind: 'og:url', value: ogUrl });
      if (finalUrlOk && res.url) evidence.push({ kind: 'final_url', value: res.url });
      const metadata = extractMeta(body, url);
      return { id: site.id, status: 'found', url, latencyMs: Date.now() - start, evidence, metadata };
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
  tier?: Tier;
  concurrency?: number;
}

export async function* runScan(opts: ScanOptions) {
  const tier = opts.tier ?? 'fundamental';
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 6, 10));
  let sites: SiteSpec[];
  if (tier === 'all') {
    // Build dynamic sites from infoooze URL templates
    const coreById = new Map(CORE_SITES.map(s => [s.id, s] as const));
    const extra: SiteSpec[] = [];
    const seen = new Set<string>(coreById.keys());
    for (const tpl of INFOOOZE_URLS) {
      const sample = tpl.replace('{username}', 'aliasmap');
      const id = canonicalPlatformIdFromUrl(sample);
      if (seen.has(id)) continue;
      seen.add(id);
      extra.push({
        id,
        tier: 'core',
        profile: {
          url: tpl,
          successPatterns: [],
          notFoundPatterns: ['Not Found', 'not found', 'Page not found', '404'],
          timeoutMs: 3500
        },
        recovery: { enabled: false, risk: 'amber' }
      });
    }
    sites = [...CORE_SITES, ...extra];
  } else {
    sites = CORE_SITES.filter(s => s.tier === tier);
  }

  yield { type: 'progress', done: 0, total: sites.length } as const;
  let done = 0;
  for (let i = 0; i < sites.length; i += concurrency) {
    const batch = sites.slice(i, i + concurrency);
    for (const s of batch) yield { type: 'site_start', id: s.id } as const;
    const results = await Promise.all(batch.map(s => checkSite(s, opts.username)));
    for (const r of results) {
      yield { type: 'site_result', id: r.id, status: r.status, url: r.url, latencyMs: r.latencyMs, reason: r.reason, evidence: r.evidence, metadata: r.metadata } as const;
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
      yield { type: 'site_result', id: r.id, status: r.status, url: r.url, latencyMs: r.latencyMs, reason: r.reason, evidence: r.evidence, metadata: r.metadata } as const;
      done += 1;
      yield { type: 'progress', done, total: sites.length } as const;
    }
  }
  yield { type: 'done', summary: { done, total: sites.length } } as const;
}
