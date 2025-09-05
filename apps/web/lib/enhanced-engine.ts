import { CORE_SITES } from './sites.core';
import type { SiteResult, SiteSpec, Evidence, Tier } from './types';
import { INFOOOZE_URLS } from './sites.infoooze';
import { canonicalPlatformIdFromUrl } from './platforms';
import { ValidationEngine } from './validation-engine';
import { PrecisionTracker } from './precision-metrics';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Instâncias globais para tracking de métricas
const validationEngine = new ValidationEngine();
const precisionTracker = new PrecisionTracker();

// Security-enhanced utility functions implementing Builder Pattern
interface EvidenceBuilderParams {
  canonicalOk?: boolean;
  ogOk?: boolean;
  finalUrlOk?: boolean;
  canonical?: string;
  ogUrl?: string;
  responseUrl?: string;
  matchedPattern?: string;
  defaultFallback?: string;
}

/**
 * Secure evidence builder implementing Builder Pattern
 * Eliminates code duplication and provides consistent evidence construction
 * 
 * @param params - Evidence building parameters
 * @returns Array of evidence objects with consistent structure
 * 
 * @example
 * const evidence = buildEvidence({
 *   canonicalOk: true,
 *   canonical: 'https://example.com/user',
 *   matchedPattern: 'User profile found'
 * });
 */
function buildEvidence(params: EvidenceBuilderParams): Evidence[] {
  const evidence: Evidence[] = [];
  
  // Strategy Pattern: Different evidence types handled by their specific logic
  const evidenceStrategies = [
    () => params.matchedPattern && evidence.push({ kind: 'pattern', value: params.matchedPattern }),
    () => params.canonicalOk && params.canonical && evidence.push({ kind: 'canonical', value: params.canonical }),
    () => params.ogOk && params.ogUrl && evidence.push({ kind: 'og:url', value: params.ogUrl }),
    () => params.finalUrlOk && params.responseUrl && evidence.push({ kind: 'final_url', value: params.responseUrl })
  ];
  
  // Execute all evidence strategies
  evidenceStrategies.forEach(strategy => strategy());
  
  // Fallback strategy if no evidence found
  if (!evidence.length && params.defaultFallback) {
    evidence.push({ kind: 'username-text', value: params.defaultFallback });
  }
  
  return evidence;
}

/**
 * Factory Pattern implementation for creating SiteResult objects
 * Ensures consistent structure and validation across all result creation
 * 
 * @param siteId - Unique identifier for the site
 * @param status - Result status following domain-specific values
 * @param url - Target URL that was scanned
 * @param start - Start timestamp for latency calculation
 * @param evidence - Optional evidence array supporting the result
 * @param reason - Optional human-readable reason for the result
 * @returns Properly structured SiteResult object
 * 
 * @example
 * const result = createSiteResult('twitter', 'found', 'https://twitter.com/user', startTime, evidence);
 */
function createSiteResult(
  siteId: string,
  status: 'found' | 'not_found' | 'inconclusive' | 'error',
  url: string,
  start: number,
  evidence?: Evidence[],
  reason?: string
): SiteResult {
  // Factory Pattern: Centralized creation with validation
  const baseResult: SiteResult = {
    id: siteId,
    status,
    url,
    latencyMs: Date.now() - start
  };
  
  // Optional properties added only when meaningful data exists
  if (evidence && evidence.length > 0) {
    baseResult.evidence = evidence;
  }
  
  if (reason) {
    baseResult.reason = reason;
  }
  
  return baseResult;
}

/**
 * Compiles a pattern string with username substitution
 * Single Responsibility: Pattern compilation only
 * 
 * @param pattern - Pattern string containing {username} placeholder
 * @param username - Username to substitute in the pattern
 * @param flags - RegExp flags to apply
 * @returns Compiled RegExp with username substituted
 */
function compilePattern(pattern: string, username: string, flags: string): RegExp {
  const replaced = pattern.split('{username}').join(username);
  return new RegExp(replaced, flags);
}

/**
 * Normalizes username according to site-specific rules
 * Single Responsibility: Username normalization and validation
 * 
 * @param username - Raw username input
 * @param site - Site specification with normalization rules
 * @returns Normalized username or null if invalid
 */
function normalizeUsername(username: string, site: SiteSpec): string | null {
  let normalizedUsername = username;
  
  // Apply case sensitivity rules
  if (!site.norm?.caseSensitive) {
    normalizedUsername = normalizedUsername.toLowerCase();
  }
  
  // Validate against allowed pattern if specified
  if (site.norm?.allowed) {
    const allowedPattern = new RegExp(`^${site.norm.allowed}$`);
    if (!allowedPattern.test(normalizedUsername)) {
      return null;
    }
  }
  
  return normalizedUsername;
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
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Enhanced site checking with validation and clean code principles
 */
async function checkSiteEnhanced(site: SiteSpec, username: string, useValidation = true): Promise<SiteResult> {
  const context = createScanContext(site, username);
  
  if (!context.isValidUsername) {
    return createSiteResult(
      site.id, 
      'inconclusive', 
      context.targetUrl, 
      context.startTime, 
      undefined, 
      'username not allowed by site rules'
    );
  }

  try {
    // Handle special cases (Instagram, etc.)
    const specialCaseResult = await handleSpecialCases(context);
    if (specialCaseResult) {
      return applyValidationIfEnabled(site, username, specialCaseResult, useValidation);
    }

    // Perform standard HTTP check
    const httpResponse = await performHttpCheck(context);
    if (httpResponse.isDefinitive) {
      return applyValidationIfEnabled(site, username, httpResponse.result, useValidation);
    }

    // Analyze response content and determine result
    const analysisResult = await analyzeResponseContent(context, httpResponse.response!);
    return applyValidationIfEnabled(site, username, analysisResult, useValidation);

  } catch (err: any) {
    const errorResult = createSiteResult(
      site.id,
      'error',
      context.targetUrl,
      context.startTime,
      undefined,
      err?.message || 'error'
    );
    return applyValidationIfEnabled(site, username, errorResult, useValidation);
  }
}

/**
 * Create scanning context with all necessary data
 */
function createScanContext(site: SiteSpec, username: string): ScanContext {
  const startTime = Date.now();
  const normalizedUsername = normalizeUsername(username, site);
  const targetUrl = site.profile.url.replace('{username}', normalizedUsername ?? username);
  const timeout = site.profile.timeoutMs ?? 3500;
  const flags = site.norm?.caseSensitive ? 'm' : 'mi';
  
  return {
    site,
    username,
    normalizedUsername,
    targetUrl,
    startTime,
    timeout,
    flags,
    isValidUsername: Boolean(normalizedUsername)
  };
}

// Type definitions for better code quality
interface ScanContext {
  site: SiteSpec;
  username: string;
  normalizedUsername: string | null;
  targetUrl: string;
  startTime: number;
  timeout: number;
  flags: string;
  isValidUsername: boolean;
}

type HttpCheckResult =
  | {
      isDefinitive: true;
      result: SiteResult;
      response?: Response;
    }
  | {
      isDefinitive: false;
      result?: undefined;
      response: Response;
    };

interface ContentAnalysis {
  structuredData: any;
  canonicalMatch: RegExpMatchArray | null;
  ogUrlMatch: RegExpMatchArray | null;
  patternResults: { matchedSuccess?: string; matchedNotFound?: string };
  usernameOk: boolean;
}

interface ProfileValidation {
  canonical?: string;
  ogUrl?: string;
  canonicalOk: boolean;
  ogOk: boolean;
  finalUrlOk: boolean;
}

/**
 * Handle platform-specific special cases
 */
async function handleSpecialCases(context: ScanContext): Promise<SiteResult | null> {
  if (context.site.id === 'instagram') {
    return await handleInstagramSpecialCase(
      context.site, 
      context.normalizedUsername!, 
      context.username, 
      context.targetUrl, 
      context.timeout, 
      context.startTime
    );
  }
  
  // Future special cases can be added here
  return null;
}

/**
 * Perform HTTP check and return early if result is definitive
 */
async function performHttpCheck(context: ScanContext): Promise<HttpCheckResult> {
  const response = await fetchWithTimeout(context.targetUrl, context.timeout);
  
  if (response.status === 404) {
    return {
      isDefinitive: true,
      result: createSiteResult(context.site.id, 'not_found', context.targetUrl, context.startTime)
    };
  }
  
  return {
    isDefinitive: false,
    response
  };
}

/**
 * Analyze response content to determine site result
 */
async function analyzeResponseContent(context: ScanContext, response: Response): Promise<SiteResult> {
  const body = await response.text();
  const contentAnalysis = analyzeContentElements(body, context);
  const profileValidation = validateProfileIndicators(response, context, contentAnalysis);
  
  // Apply site-specific logic first
  const siteSpecificResult = applySiteSpecificLogic(
    context.site, body, contentAnalysis.patternResults, 
    profileValidation.canonicalOk, profileValidation.ogOk, profileValidation.finalUrlOk, 
    contentAnalysis.usernameOk, profileValidation.canonical, profileValidation.ogUrl, 
    response.url, context.targetUrl, context.startTime
  );

  if (siteSpecificResult) {
    return siteSpecificResult;
  }

  // Apply general logic as fallback
  return applyGeneralLogic(
    context.site, contentAnalysis.patternResults, contentAnalysis.usernameOk,
    profileValidation.canonicalOk, profileValidation.ogOk, profileValidation.finalUrlOk,
    profileValidation.canonical, profileValidation.ogUrl, response.url, 
    context.targetUrl, context.startTime
  );
}

/**
 * Analyze content elements (patterns, structured data, etc.)
 */
function analyzeContentElements(body: string, context: ScanContext): ContentAnalysis {
  const structuredData = extractStructuredData(body);
  const { canonicalMatch, ogUrlMatch } = extractMetaTags(body);
  const patternResults = checkPatterns(context.site, body, context.normalizedUsername!, context.flags);
  
  const usernameOk = patternResults.matchedSuccess?.includes('{username}') 
    ? true 
    : new RegExp(context.normalizedUsername ?? context.username, context.flags).test(body);
  
  return {
    structuredData,
    canonicalMatch,
    ogUrlMatch,
    patternResults,
    usernameOk
  };
}

/**
 * Validate profile indicators (canonical, og:url, final URL)
 */
function validateProfileIndicators(response: Response, context: ScanContext, contentAnalysis: ContentAnalysis): ProfileValidation {
  const canonical = contentAnalysis.canonicalMatch?.[1];
  const ogUrl = contentAnalysis.ogUrlMatch?.[1];
  const expectedHost = getHostFromUrl(context.targetUrl);
  const usernameLower = (context.normalizedUsername ?? context.username).toLowerCase();

  const matchesProfile = createProfileMatcher(context.targetUrl, expectedHost, usernameLower);
  
  return {
    canonical,
    ogUrl,
    canonicalOk: matchesProfile(canonical),
    ogOk: matchesProfile(ogUrl),
    finalUrlOk: matchesProfile(response.url)
  };
}

/**
 * Create a secure profile matching function
 */
function createProfileMatcher(expectedUrl: string, expectedHost: string, usernameLower: string) {
  return (url?: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, expectedUrl);
      const host = parsed.host.toLowerCase();
      // Security fix: Replace vulnerable regex with safe string operations
      const path = parsed.pathname.toLowerCase();
      const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
      return host === expectedHost && normalizedPath.includes(usernameLower);
    } catch {
      return false;
    }
  };
}

/**
 * Apply validation if enabled, otherwise return result as-is
 */
async function applyValidationIfEnabled(
  site: SiteSpec, 
  username: string, 
  result: SiteResult, 
  useValidation: boolean
): Promise<SiteResult> {
  return useValidation ? await applyValidation(site, username, result) : result;
}

/**
 * Aplica validação múltipla se o resultado for inconclusive
 */
async function applyValidation(site: SiteSpec, username: string, result: SiteResult): Promise<SiteResult> {
  try {
    if (result.status !== 'inconclusive') {
      return result; // Só aplica validação em inconclusivos
    }

    const multiCheckResult = await validationEngine.validateResult(site, username, result);
    
    // Adiciona evidências da validação
    const validationEvidence: Evidence[] = multiCheckResult.validation.evidence.map(e => ({
      kind: e.kind,
      value: e.value
    }));

    const allEvidence = [...(result.evidence || []), ...validationEvidence];
    
    return {
      ...result,
      status: multiCheckResult.finalStatus,
      evidence: allEvidence,
      reason: multiCheckResult.validation.reasons.join('; '),
      validationConfidence: multiCheckResult.validation.confidence
    } as SiteResult & { validationConfidence: number };

  } catch (error) {
    // Em caso de erro na validação, retorna o resultado original
    console.warn(`Validation failed for ${site.id}:`, error);
    return result;
  }
}

async function handleInstagramSpecialCase(
  site: SiteSpec, 
  u: string, 
  username: string, 
  url: string, 
  timeout: number, 
  start: number
): Promise<SiteResult | null> {
  const ctrl0 = new AbortController();
  const id0 = setTimeout(() => ctrl0.abort(), timeout);
  
  try {
    const res0 = await fetch(url, {
      signal: ctrl0.signal,
      redirect: 'manual',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    
    if (res0.status === 404) {
      return createSiteResult(site.id, 'not_found', url, start);
    }
    
    if (res0.status >= 300 && res0.status < 400) {
      const loc = res0.headers.get('location') || '';
      const abs = (() => { 
        try { return new URL(loc, url).href; } 
        catch { return loc; } 
      })();
      const dec = decodeURIComponent(abs.toLowerCase());
      const uname = (u ?? username).toLowerCase();
      
      if (dec.includes('/accounts/login/') && dec.includes(`/${uname}/`)) {
        const evidence = buildEvidence({ finalUrlOk: true, responseUrl: abs });
        return createSiteResult(site.id, 'found', url, start, evidence);
      }
    }
    
    return null; // Continue with normal flow
  } catch (_) {
    return null;
  } finally {
    clearTimeout(id0);
  }
}

function extractStructuredData(html: string): any {
  try {
    const schemaMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
    if (schemaMatch) {
      return JSON.parse(schemaMatch[1]);
    }
  } catch {}
  return null;
}

function extractMetaTags(body: string) {
  const canonicalMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
  const ogUrlMatch = body.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
  return { canonicalMatch, ogUrlMatch };
}

function getHostFromUrl(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

function checkPatterns(site: SiteSpec, body: string, username: string, flags: string) {
  const successOrdered = [...(site.profile.successPatterns ?? [])].sort((a, b) => {
    const au = a.includes('{username}') ? 0 : 1;
    const bu = b.includes('{username}') ? 0 : 1;
    return au - bu;
  });

  let matchedSuccess: string | undefined;
  let matchedNotFound: string | undefined;

  for (const p of successOrdered) {
    if (compilePattern(p, username, flags).test(body)) {
      matchedSuccess = p;
      break;
    }
  }

  for (const p of (site.profile.notFoundPatterns ?? [])) {
    if (compilePattern(p, username, flags).test(body)) {
      matchedNotFound = p;
      break;
    }
  }

  return { matchedSuccess, matchedNotFound };
}

function applySiteSpecificLogic(
  site: SiteSpec,
  body: string,
  patternResults: { matchedSuccess?: string; matchedNotFound?: string },
  canonicalOk: boolean,
  ogOk: boolean,
  finalUrlOk: boolean,
  usernameOk: boolean,
  canonical?: string,
  ogUrl?: string,
  responseUrl?: string,
  originalUrl?: string,
  start?: number
): SiteResult | null {
  const { matchedSuccess, matchedNotFound } = patternResults;

  // Instagram específico
  if (site.id === 'instagram') {
    if (!matchedNotFound && usernameOk && (canonicalOk || ogOk)) {
      const evidence = buildEvidence({
        canonicalOk,
        canonical,
        ogOk,
        ogUrl,
        defaultFallback: site.id
      });
      return createSiteResult(site.id, 'found', originalUrl!, start!, evidence);
    }
    if (matchedNotFound) {
      const evidence = buildEvidence({ matchedPattern: matchedNotFound });
      return createSiteResult(site.id, 'not_found', originalUrl!, start!, evidence);
    }
    return createSiteResult(site.id, 'inconclusive', originalUrl!, start!);
  }

  // Twitch específico
  if (site.id === 'twitch') {
    if (matchedNotFound && /time machine/i.test(matchedNotFound)) {
      const evidence = buildEvidence({ matchedPattern: matchedNotFound });
      return createSiteResult(site.id, 'found', originalUrl!, start!, evidence);
    }
  }

  // Twitter específico
  if (site.id === 'twitter') {
    const suspended = /suspended/i.test(body);
    if (!matchedNotFound && suspended) {
      const evidence = buildEvidence({
        matchedPattern: 'Account suspended',
        canonicalOk,
        canonical
      });
      return createSiteResult(site.id, 'found', originalUrl!, start!, evidence);
    }
  }

  return null;
}

function applyGeneralLogic(
  site: SiteSpec,
  patternResults: { matchedSuccess?: string; matchedNotFound?: string },
  usernameOk: boolean,
  canonicalOk: boolean,
  ogOk: boolean,
  finalUrlOk: boolean,
  canonical?: string,
  ogUrl?: string,
  responseUrl?: string,
  originalUrl?: string,
  start?: number
): SiteResult {
  const { matchedSuccess, matchedNotFound } = patternResults;

  // Fallback genérico: se site não declara padrões de sucesso, aceita evidência canonical/og/final URL
  if ((!site.profile.successPatterns || site.profile.successPatterns.length === 0) && 
      !matchedNotFound && usernameOk && (canonicalOk || ogOk || finalUrlOk)) {
    const evidence = buildEvidence({
      canonicalOk,
      canonical,
      ogOk,
      ogUrl,
      finalUrlOk,
      responseUrl,
      defaultFallback: site.id
    });
    return createSiteResult(site.id, 'found', originalUrl!, start!, evidence);
  }

  if (matchedSuccess && !matchedNotFound && usernameOk && (canonicalOk || ogOk || finalUrlOk)) {
    const evidence = buildEvidence({
      matchedPattern: matchedSuccess,
      canonicalOk,
      canonical,
      ogOk,
      ogUrl,
      finalUrlOk,
      responseUrl
    });
    return createSiteResult(site.id, 'found', originalUrl!, start!, evidence);
  }

  if (matchedNotFound) {
    const evidence = buildEvidence({ matchedPattern: matchedNotFound });
    return createSiteResult(site.id, 'not_found', originalUrl!, start!, evidence);
  }

  return createSiteResult(site.id, 'inconclusive', originalUrl!, start!);
}

export interface EnhancedScanOptions {
  username: string;
  tier?: Tier;
  concurrency?: number;
  useValidation?: boolean; // Nova opção para ativar/desativar validação
  trackMetrics?: boolean;  // Nova opção para tracking de métricas
}

export async function* runEnhancedScan(opts: EnhancedScanOptions) {
  const tier = opts.tier ?? 'fundamental';
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 6, 10));
  const useValidation = opts.useValidation ?? true;
  const trackMetrics = opts.trackMetrics ?? true;
  
  let sites: SiteSpec[];
  if (tier === 'all') {
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
  const allResults: SiteResult[] = [];
  
  for (let i = 0; i < sites.length; i += concurrency) {
    const batch = sites.slice(i, i + concurrency);
    for (const s of batch) yield { type: 'site_start', id: s.id } as const;
    
    const results = await Promise.all(
      batch.map(s => checkSiteEnhanced(s, opts.username, useValidation))
    );
    
    for (const r of results) {
      allResults.push(r);
      yield { 
        type: 'site_result', 
        id: r.id, 
        status: r.status, 
        url: r.url, 
        latencyMs: r.latencyMs, 
        reason: r.reason, 
        evidence: r.evidence 
      } as const;
      
      done += 1;
      yield { type: 'progress', done, total: sites.length } as const;
      await sleep(10);
    }
  }

  // Registra métricas se habilitado
  if (trackMetrics) {
    precisionTracker.recordScan(opts.username, allResults);
    
    // Emite relatório de qualidade se houver dados suficientes
    const report = precisionTracker.generateQualityReport();
    yield { 
      type: 'quality_report', 
      report 
    } as const;
  }

  yield { type: 'done', summary: { done, total: sites.length } } as const;
}

// Exporta tracker para uso externo
export { precisionTracker, validationEngine };

// Função para obter métricas atuais
export function getCurrentMetrics() {
  return precisionTracker.exportMetrics();
}

// Função para limpar dados antigos
export function cleanupOldMetrics(daysToKeep = 30) {
  precisionTracker.cleanup(daysToKeep);
}

// Security test functions for validation
export function testRegexSecurity() {
  // Test that the new path normalization is secure and doesn't suffer from ReDoS
  const testCases = [
    'https://example.com/user/',
    'https://example.com/user/////',
    'https://example.com/user' + '/'.repeat(1000), // Potential ReDoS input
    'https://example.com/user' + '/'.repeat(10000), // Extreme ReDoS input
  ];
  
  testCases.forEach(url => {
    const startTime = Date.now();
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.toLowerCase();
      const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 100ms even for extreme inputs)
      if (duration > 100) {
        console.warn(`Potential performance issue with URL: ${url}, took ${duration}ms`);
      }
    } catch (error) {
      console.error(`Error processing URL: ${url}`, error);
    }
  });
}
