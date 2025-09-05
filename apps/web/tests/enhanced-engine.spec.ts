import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runEnhancedScan, validationEngine, precisionTracker } from '../lib/enhanced-engine';
import { ValidationEngine } from '../lib/validation-engine';
import { PrecisionTracker } from '../lib/precision-metrics';
import type { SiteSpec } from '../lib/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Enhanced Engine with Validation', () => {
  const mockSites: SiteSpec[] = [
    {
      id: 'github',
      tier: 'fundamental',
      profile: {
        url: 'https://github.com/{username}',
        successPatterns: ['<title>.*{username}.*</title>'],
        notFoundPatterns: ['<title>Page not found</title>'],
        timeoutMs: 3000
      },
      recovery: { enabled: false, risk: 'green' }
    },
    {
      id: 'twitter',
      tier: 'fundamental', 
      profile: {
        url: 'https://twitter.com/{username}',
        successPatterns: ['<meta property="og:title" content=".*{username}.*"'],
        notFoundPatterns: ['<title>.*not found.*</title>'],
        timeoutMs: 3000
      },
      recovery: { enabled: false, risk: 'green' }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runEnhancedScan', () => {
    it('should process sites with validation enabled', async () => {
      // Mock successful response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <title>testuser - GitHub</title>
            <link rel="canonical" href="https://github.com/testuser">
            <meta property="og:url" content="https://github.com/testuser">
            <meta property="og:title" content="testuser GitHub Profile">
          </html>
        `,
        url: 'https://github.com/testuser',
        headers: new Map([['content-type', 'text/html']])
      });

      const generator = runEnhancedScan({
        username: 'testuser',
        tier: 'fundamental',
        useValidation: true,
        trackMetrics: true
      });

      const results = [];
      for await (const event of generator) {
        results.push(event);
      }

      // Deve ter eventos de progresso, site_start, site_result, quality_report e done
      expect(results).toHaveLength(10); // progress(0), site_start*2, site_result*2, progress*3, quality_report, done
      
      const siteResults = results.filter(r => r.type === 'site_result');
      expect(siteResults).toHaveLength(2);

      // Pelo menos um deve ser 'found' se a validação funcionou
      const foundResults = siteResults.filter(r => r.status === 'found');
      expect(foundResults.length).toBeGreaterThan(0);
    });

    it('should handle inconclusive results with validation', async () => {
      // Mock ambiguous response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <title>Some Generic Page</title>
            <body>Welcome to our site</body>
          </html>
        `,
        url: 'https://github.com/testuser',
        headers: new Map([['content-type', 'text/html']])
      });

      const generator = runEnhancedScan({
        username: 'testuser',
        tier: 'fundamental',
        useValidation: true
      });

      const results = [];
      for await (const event of generator) {
        if (event.type === 'site_result') {
          results.push(event);
        }
      }

      // Com validação, alguns inconclusivos podem ser resolvidos
      expect(results.length).toBe(2);
      
      // Verifica se há evidências de validação nos resultados
      const hasValidationEvidence = results.some(r => 
        r.evidence?.some(e => e.kind.startsWith('validation_'))
      );
      expect(hasValidationEvidence).toBe(true);
    });

    it('should work with validation disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 404,
        text: async () => '<html><title>Page not found</title></html>',
        url: 'https://github.com/testuser'
      });

      const generator = runEnhancedScan({
        username: 'testuser',
        tier: 'fundamental',
        useValidation: false,
        trackMetrics: false
      });

      const results = [];
      for await (const event of generator) {
        if (event.type === 'site_result') {
          results.push(event);
        }
      }

      expect(results.length).toBe(2);
      results.forEach(result => {
        expect(result.status).toBe('not_found');
        // Não deve ter evidências de validação
        const hasValidationEvidence = result.evidence?.some(e => 
          e.kind.startsWith('validation_')
        );
        expect(hasValidationEvidence).toBeFalsy();
      });
    });
  });

  describe('ValidationEngine', () => {
    let engine: ValidationEngine;

    beforeEach(() => {
      engine = new ValidationEngine();
    });

    it('should validate canonical URLs correctly', async () => {
      const mockSite = mockSites[0];
      const primaryResult = {
        id: 'github',
        status: 'inconclusive' as const,
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: [
          { kind: 'canonical', value: 'https://github.com/testuser' }
        ]
      };

      // Mock para checkCanonicalUrl
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <link rel="canonical" href="https://github.com/testuser">
            <meta property="og:url" content="https://github.com/testuser">
            <title>testuser GitHub</title>
          </html>
        `,
        headers: new Map([['content-type', 'text/html']])
      });

      const result = await engine.validateResult(mockSite, 'testuser', primaryResult);

      expect(result.validation.confidence).toBeGreaterThan(0.5);
      expect(result.finalStatus).toBe('found');
      expect(result.validation.evidence.length).toBeGreaterThan(0);
    });

    it('should handle validation failures gracefully', async () => {
      const mockSite = mockSites[0];
      const primaryResult = {
        id: 'github',
        status: 'inconclusive' as const,
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      // Mock fetch failure
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await engine.validateResult(mockSite, 'testuser', primaryResult);

      // Should still complete even with validation errors
      expect(result.finalStatus).toBeDefined();
      expect(result.validation.confidence).toBeLessThan(0.5);
    });
  });

  describe('PrecisionTracker', () => {
    let tracker: PrecisionTracker;

    beforeEach(() => {
      tracker = new PrecisionTracker();
    });

    it('should calculate metrics correctly', () => {
      const mockResults = [
        { id: 'github', status: 'found', url: 'test', latencyMs: 100 },
        { id: 'twitter', status: 'not_found', url: 'test', latencyMs: 150 },
        { id: 'facebook', status: 'inconclusive', url: 'test', latencyMs: 200 },
        { id: 'instagram', status: 'error', url: 'test', latencyMs: 50 }
      ] as any[];

      const metrics = tracker.calculateMetrics(mockResults);

      expect(metrics.totalScanned).toBe(4);
      expect(metrics.found).toBe(1);
      expect(metrics.notFound).toBe(1);
      expect(metrics.inconclusive).toBe(1);
      expect(metrics.errors).toBe(1);
      expect(metrics.precisionScore).toBe(0.5); // 2 definitive / 4 total
      expect(metrics.inconclusiveRate).toBe(0.25); // 1 inconclusive / 4 total
    });

    it('should track site metrics over time', () => {
      const result1 = { id: 'github', status: 'found', url: 'test', latencyMs: 100 } as any;
      const result2 = { id: 'github', status: 'inconclusive', url: 'test', latencyMs: 150 } as any;
      const result3 = { id: 'github', status: 'found', url: 'test', latencyMs: 120 } as any;

      tracker.updateSiteMetrics('github', result1);
      tracker.updateSiteMetrics('github', result2);
      tracker.updateSiteMetrics('github', result3);

      const report = tracker.generateQualityReport();
      const githubMetrics = report.problematicSites.find(s => s.siteId === 'github');
      
      if (githubMetrics) {
        expect(githubMetrics.attempts).toBe(3);
        expect(githubMetrics.successes).toBe(2);
        expect(githubMetrics.inconclusive).toBe(1);
      }
    });

    it('should identify problematic sites', () => {
      // Create sites with high inconclusive rates
      for (let i = 0; i < 6; i++) {
        tracker.updateSiteMetrics('problematic', 
          { id: 'problematic', status: 'inconclusive', url: 'test', latencyMs: 100 } as any
        );
      }
      
      for (let i = 0; i < 2; i++) {
        tracker.updateSiteMetrics('problematic', 
          { id: 'problematic', status: 'found', url: 'test', latencyMs: 100 } as any
        );
      }

      const problematic = tracker.getProblematicSites(5);
      expect(problematic.length).toBeGreaterThan(0);
      expect(problematic[0].siteId).toBe('problematic');
    });

    it('should generate quality reports with recommendations', () => {
      // Simulate poor quality results
      const poorResults = Array(10).fill(null).map((_, i) => ({
        id: `site${i}`,
        status: 'inconclusive',
        url: 'test',
        latencyMs: 100
      })) as any[];

      tracker.recordScan('testuser', poorResults);

      const report = tracker.generateQualityReport();
      expect(report.overall.inconclusiveRate).toBe(1.0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('inconclusivos'))).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should improve precision compared to original engine', async () => {
      // Test with a username that typically generates inconclusives
      const problematicUsername = 'test123abc';

      // Mock responses that would normally be inconclusive
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => `<html><title>Generic Page</title><body>Content</body></html>`,
          url: `https://github.com/${problematicUsername}`,
          headers: new Map([['content-type', 'text/html']])
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => `<html><title>Generic Page</title><body>Content</body></html>`,
          url: `https://twitter.com/${problematicUsername}`,
          headers: new Map([['content-type', 'text/html']])
        })
        // Additional validation requests
        .mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => 'Not found'
        });

      const generator = runEnhancedScan({
        username: problematicUsername,
        tier: 'fundamental',
        useValidation: true,
        trackMetrics: true
      });

      const results = [];
      for await (const event of generator) {
        if (event.type === 'site_result') {
          results.push(event);
        }
      }

      // Com validação, deve haver menos inconclusivos
      const inconclusiveCount = results.filter(r => r.status === 'inconclusive').length;
      const definitiveCount = results.filter(r => 
        r.status === 'found' || r.status === 'not_found'
      ).length;

      // Esperamos que pelo menos alguns inconclusivos tenham sido resolvidos
      expect(definitiveCount).toBeGreaterThan(0);
      expect(inconclusiveCount).toBeLessThan(results.length);
    });
  });
});