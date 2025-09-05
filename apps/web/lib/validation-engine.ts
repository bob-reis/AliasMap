import type { SiteResult, SiteSpec, Evidence } from './types';

interface ValidationResult {
  confidence: number; // 0-1 score
  reasons: string[];
  evidence: Evidence[];
}

interface MultiCheckResult {
  primary: SiteResult;
  validation: ValidationResult;
  finalStatus: 'found' | 'not_found' | 'inconclusive' | 'error';
}

/**
 * Sistema de validação múltipla inspirado no Sherlock, SocialScan e Infoooze
 * para reduzir inconclusivos através de verificações cruzadas
 */
export class ValidationEngine {
  /**
   * Executa verificações múltiplas para validar resultado primário
   */
  async validateResult(
    site: SiteSpec, 
    username: string, 
    primaryResult: SiteResult
  ): Promise<MultiCheckResult> {
    if (primaryResult.status === 'error' || primaryResult.status === 'not_found') {
      return {
        primary: primaryResult,
        validation: { confidence: 1.0, reasons: ['Primary check definitive'], evidence: [] },
        finalStatus: primaryResult.status
      };
    }

    const validation = await this.performMultipleChecks(site, username, primaryResult);
    const finalStatus = this.determineFinalStatus(primaryResult, validation);

    return {
      primary: primaryResult,
      validation,
      finalStatus
    };
  }

  private async performMultipleChecks(
    site: SiteSpec,
    username: string,
    primaryResult: SiteResult
  ): Promise<ValidationResult> {
    const checks = [
      () => this.checkCanonicalUrl(site, username, primaryResult),
      () => this.checkMetaTags(site, username, primaryResult),
      () => this.checkUsernameInContent(site, username, primaryResult),
      () => this.checkStatusCodeConsistency(site, username, primaryResult),
      () => this.checkRedirectPatterns(site, username, primaryResult),
      () => this.checkResponseHeaders(site, username, primaryResult),
      () => this.checkJsonApiEndpoint(site, username, primaryResult)
    ];

    const results = await Promise.allSettled(
      checks.map(check => check())
    );

    const validations = results
      .filter((r): r is PromiseFulfilledResult<ValidationResult> => r.status === 'fulfilled')
      .map(r => r.value);

    return this.aggregateValidations(validations);
  }

  private async checkCanonicalUrl(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    if (!result.evidence?.some(e => e.kind === 'canonical')) {
      return { confidence: 0.3, reasons: ['No canonical URL found'], evidence: [] };
    }

    const canonical = result.evidence.find(e => e.kind === 'canonical')?.value;
    if (!canonical) {
      return { confidence: 0.3, reasons: ['Canonical URL empty'], evidence: [] };
    }

    try {
      const expectedUrl = site.profile.url.replace('{username}', username.toLowerCase());
      const canonicalUrl = new URL(canonical);
      const expectedUrlParsed = new URL(expectedUrl);
      
      const hostMatch = canonicalUrl.host.toLowerCase() === expectedUrlParsed.host.toLowerCase();
      const pathContainsUsername = canonicalUrl.pathname.toLowerCase().includes(username.toLowerCase());
      
      if (hostMatch && pathContainsUsername) {
        return { 
          confidence: 0.9, 
          reasons: ['Canonical URL confirms profile exists'],
          evidence: [{ kind: 'validation_canonical', value: canonical }]
        };
      }
      
      return { 
        confidence: 0.2, 
        reasons: ['Canonical URL does not match expected pattern'],
        evidence: []
      };
    } catch {
      return { confidence: 0.1, reasons: ['Invalid canonical URL'], evidence: [] };
    }
  }

  private async checkMetaTags(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(result.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        return { confidence: 0.1, reasons: ['Failed to fetch for meta check'], evidence: [] };
      }

      const html = await response.text();
      const metaChecks = [
        this.extractOgTitle(html, username),
        this.extractOgUrl(html, username),
        this.extractProfileImage(html),
        this.extractSchemaMarkup(html, username)
      ];

      const metaResults = metaChecks.filter((result): result is Evidence => result !== null);
      const confidence = Math.min(0.8, metaResults.length * 0.2);
      
      return {
        confidence,
        reasons: metaResults.length > 0 
          ? [`Found ${metaResults.length} meta tag confirmations`]
          : ['No meta tag confirmations found'],
        evidence: metaResults
      };
    } catch {
      return { confidence: 0.1, reasons: ['Meta check failed'], evidence: [] };
    }
  }

  private extractOgTitle(html: string, username: string): Evidence | null {
    const match = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
    if (match && match[1].toLowerCase().includes(username.toLowerCase())) {
      return { kind: 'validation_og_title', value: match[1] };
    }
    return null;
  }

  private extractOgUrl(html: string, username: string): Evidence | null {
    const match = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
    if (match) {
      try {
        const url = new URL(match[1]);
        if (url.pathname.toLowerCase().includes(username.toLowerCase())) {
          return { kind: 'validation_og_url', value: match[1] };
        }
      } catch {}
    }
    return null;
  }

  private extractProfileImage(html: string): Evidence | null {
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
      /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && !match[1].includes('default') && !match[1].includes('blank')) {
        return { kind: 'validation_profile_image', value: match[1] };
      }
    }
    return null;
  }

  private extractSchemaMarkup(html: string, username: string): Evidence | null {
    const schemaMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
    if (schemaMatch) {
      try {
        const schema = JSON.parse(schemaMatch[1]);
        if (schema['@type'] === 'Person' || schema['@type'] === 'ProfilePage') {
          return { kind: 'validation_schema', value: 'Person/Profile schema found' };
        }
      } catch {}
    }
    return null;
  }

  private async checkUsernameInContent(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(result.url, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        return { confidence: 0.1, reasons: ['Failed to fetch content'], evidence: [] };
      }

      const content = await response.text();
      const usernamePattern = new RegExp(`\\b${username}\\b`, 'gi');
      const matches = content.match(usernamePattern) || [];
      
      // Mais menções = maior confiança (até um limite)
      const mentionCount = matches.length;
      const confidence = Math.min(0.7, mentionCount * 0.15);
      
      if (mentionCount > 2) {
        return {
          confidence,
          reasons: [`Username mentioned ${mentionCount} times in content`],
          evidence: [{ kind: 'validation_username_mentions', value: mentionCount.toString() }]
        };
      }
      
      return { 
        confidence: 0.2, 
        reasons: ['Username mentioned less than 3 times'],
        evidence: []
      };
    } catch {
      return { confidence: 0.1, reasons: ['Content check failed'], evidence: [] };
    }
  }

  private async checkStatusCodeConsistency(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    try {
      // Tenta HEAD request primeiro para economia de bandwidth
      const headResponse = await fetch(result.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000)
      });
      
      if (headResponse.status === 200) {
        return {
          confidence: 0.6,
          reasons: ['HEAD request confirms 200 status'],
          evidence: [{ kind: 'validation_head_200', value: headResponse.status.toString() }]
        };
      }
      
      if (headResponse.status === 404) {
        return {
          confidence: 0.9,
          reasons: ['HEAD request confirms 404 - profile does not exist'],
          evidence: [{ kind: 'validation_head_404', value: headResponse.status.toString() }]
        };
      }
      
      return { confidence: 0.3, reasons: [`HEAD returned ${headResponse.status}`], evidence: [] };
    } catch {
      return { confidence: 0.1, reasons: ['HEAD request failed'], evidence: [] };
    }
  }

  private async checkRedirectPatterns(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(result.url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return { confidence: 0.2, reasons: ['Redirect without location'], evidence: [] };
        }
        
        // Padrões de redirect que indicam perfil não encontrado
        const notFoundPatterns = [
          '/login',
          '/signin',
          '/404',
          '/error',
          '/notfound'
        ];
        
        const isNotFoundRedirect = notFoundPatterns.some(pattern => 
          location.toLowerCase().includes(pattern)
        );
        
        if (isNotFoundRedirect) {
          return {
            confidence: 0.8,
            reasons: ['Redirect indicates profile not found'],
            evidence: [{ kind: 'validation_redirect_notfound', value: location }]
          };
        }
        
        // Se redirect contém username, pode ser válido
        if (location.toLowerCase().includes(username.toLowerCase())) {
          return {
            confidence: 0.7,
            reasons: ['Redirect contains username'],
            evidence: [{ kind: 'validation_redirect_username', value: location }]
          };
        }
      }
      
      return { confidence: 0.4, reasons: ['No significant redirect pattern'], evidence: [] };
    } catch {
      return { confidence: 0.1, reasons: ['Redirect check failed'], evidence: [] };
    }
  }

  private async checkResponseHeaders(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(result.url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000)
      });
      
      const evidence: Evidence[] = [];
      let confidence = 0.3;
      
      // Content-Type check
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        evidence.push({ kind: 'validation_content_type', value: contentType });
        confidence += 0.2;
      }
      
      // Server header analysis
      const server = response.headers.get('server');
      if (server) {
        evidence.push({ kind: 'validation_server', value: server });
      }
      
      // Cache headers (profiles usually have cache headers)
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        evidence.push({ kind: 'validation_cache', value: cacheControl });
        confidence += 0.1;
      }
      
      return {
        confidence: Math.min(confidence, 0.6),
        reasons: [`Found ${evidence.length} header indicators`],
        evidence
      };
    } catch {
      return { confidence: 0.1, reasons: ['Header check failed'], evidence: [] };
    }
  }

  private async checkJsonApiEndpoint(
    site: SiteSpec,
    username: string,
    result: SiteResult
  ): Promise<ValidationResult> {
    // Alguns sites têm endpoints JSON que são mais confiáveis
    const apiPatterns = [
      `${result.url}/api`,
      `${result.url}.json`,
      result.url.replace('/user/', '/api/user/'),
      result.url.replace('/', '/api/v1/')
    ];
    
    for (const apiUrl of apiPatterns) {
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            return {
              confidence: 0.8,
              reasons: ['JSON API endpoint confirms profile'],
              evidence: [{ kind: 'validation_json_api', value: apiUrl }]
            };
          }
        }
      } catch {
        // Ignore API check failures
        continue;
      }
    }
    
    return { confidence: 0.2, reasons: ['No accessible JSON API found'], evidence: [] };
  }

  private aggregateValidations(validations: ValidationResult[]): ValidationResult {
    if (validations.length === 0) {
      return { confidence: 0.1, reasons: ['No validations completed'], evidence: [] };
    }
    
    const totalConfidence = validations.reduce((sum, v) => sum + v.confidence, 0);
    const averageConfidence = totalConfidence / validations.length;
    
    // Bonus por múltiplas validações concordantes
    const highConfidenceCount = validations.filter(v => v.confidence > 0.6).length;
    const bonus = Math.min(0.2, highConfidenceCount * 0.05);
    
    const finalConfidence = Math.min(1.0, averageConfidence + bonus);
    
    const allReasons = validations.flatMap(v => v.reasons);
    const allEvidence = validations.flatMap(v => v.evidence);
    
    return {
      confidence: finalConfidence,
      reasons: allReasons,
      evidence: allEvidence
    };
  }

  private determineFinalStatus(
    primaryResult: SiteResult,
    validation: ValidationResult
  ): 'found' | 'not_found' | 'inconclusive' | 'error' {
    // Se resultado primário é definitivo (404, erro), mantém
    if (primaryResult.status === 'not_found' || primaryResult.status === 'error') {
      return primaryResult.status;
    }
    
    // Para resultados inconclusivos, usa validação para decidir
    if (primaryResult.status === 'inconclusive') {
      if (validation.confidence >= 0.7) {
        return 'found';
      } else if (validation.confidence <= 0.3) {
        return 'not_found';
      }
      return 'inconclusive';
    }
    
    // Para resultados "found", verifica se validação contradiz
    if (primaryResult.status === 'found') {
      if (validation.confidence < 0.4) {
        return 'inconclusive'; // Downgrade to inconclusive if validation is weak
      }
      return 'found';
    }
    
    return primaryResult.status;
  }
}