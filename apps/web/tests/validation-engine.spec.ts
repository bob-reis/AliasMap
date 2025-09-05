import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ValidationEngine } from '../lib/validation-engine';
import type { SiteSpec, SiteResult, Evidence } from '../lib/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  
  const mockSite: SiteSpec = {
    id: 'github',
    tier: 'fundamental',
    profile: {
      url: 'https://github.com/{username}',
      successPatterns: ['<title>.*{username}.*</title>'],
      notFoundPatterns: ['<title>Page not found</title>'],
      timeoutMs: 3000
    },
    recovery: { enabled: false, risk: 'green' }
  };

  beforeEach(() => {
    validationEngine = new ValidationEngine();
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateResult', () => {
    it('should return primary result for error status without validation', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'error',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        reason: 'Network error'
      };

      const result = await validationEngine.validateResult(mockSite, 'testuser', primaryResult);

      expect(result.primary).toBe(primaryResult);
      expect(result.finalStatus).toBe('error');
      expect(result.validation.confidence).toBe(1.0);
      expect(result.validation.reasons).toContain('Primary check definitive');
    });

    it('should return primary result for not_found status without validation', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'not_found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      const result = await validationEngine.validateResult(mockSite, 'testuser', primaryResult);

      expect(result.primary).toBe(primaryResult);
      expect(result.finalStatus).toBe('not_found');
      expect(result.validation.confidence).toBe(1.0);
    });

    it('should perform multiple checks for found/inconclusive results', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: [
          { kind: 'canonical', value: 'https://github.com/testuser' },
          { kind: 'og:url', value: 'https://github.com/testuser' }
        ]
      };

      // Mock fetch responses for validation checks
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ username: 'testuser', exists: true }),
            headers: new Map([['content-type', 'application/json']])
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => `
            <html>
              <title>testuser - GitHub</title>
              <link rel="canonical" href="https://github.com/testuser">
              <meta property="og:url" content="https://github.com/testuser">
              <meta property="og:title" content="testuser GitHub Profile">
              <body>Username: testuser</body>
            </html>
          `,
          url: 'https://github.com/testuser',
          headers: new Map([
            ['content-type', 'text/html'],
            ['x-frame-options', 'DENY']
          ])
        });
      });

      const result = await validationEngine.validateResult(mockSite, 'testuser', primaryResult);

      expect(result.primary).toBe(primaryResult);
      expect(result.validation.confidence).toBeGreaterThan(0.5);
      expect(result.finalStatus).toBe('found');
    });

    it('should handle validation failures gracefully', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'inconclusive',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      // Mock all validation requests to fail
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const result = await validationEngine.validateResult(mockSite, 'testuser', primaryResult);

      expect(result.primary).toBe(primaryResult);
      expect(result.validation.confidence).toBeLessThan(0.5);
      expect(['inconclusive', 'not_found']).toContain(result.finalStatus);
    });
  });

  describe('checkCanonicalUrl', () => {
    it('should return low confidence when no canonical URL found', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: []
      };

      // Access private method through reflection for testing
      const validationResult = await (validationEngine as any).checkCanonicalUrl(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBe(0.3);
      expect(validationResult.reasons).toContain('No canonical URL found');
    });

    it('should return high confidence for valid canonical URL', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: [
          { kind: 'canonical', value: 'https://github.com/testuser' }
        ]
      };

      const validationResult = await (validationEngine as any).checkCanonicalUrl(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBe(0.9);
      expect(validationResult.reasons).toContain('Canonical URL confirms profile exists');
      expect(validationResult.evidence).toHaveLength(1);
      expect(validationResult.evidence[0].kind).toBe('validation_canonical');
    });

    it('should handle invalid canonical URLs', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: [
          { kind: 'canonical', value: 'not-a-valid-url' }
        ]
      };

      const validationResult = await (validationEngine as any).checkCanonicalUrl(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBe(0.2);
      expect(validationResult.reasons).toContain('Invalid canonical URL format');
    });
  });

  describe('checkMetaTags', () => {
    it('should validate og:url meta tags', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100,
        evidence: [
          { kind: 'og:url', value: 'https://github.com/testuser' }
        ]
      };

      const validationResult = await (validationEngine as any).checkMetaTags(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBeGreaterThan(0.6);
      expect(validationResult.reasons).toContain('Meta tags confirm profile exists');
    });
  });

  describe('checkUsernameInContent', () => {
    it('should make additional request to verify username in content', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '<body>Welcome testuser to GitHub!</body>',
        headers: new Map([['content-type', 'text/html']])
      });

      const validationResult = await (validationEngine as any).checkUsernameInContent(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBeGreaterThan(0.6);
      expect(validationResult.reasons).toContain('Username found in page content');
      expect(mockFetch).toHaveBeenCalledWith('https://github.com/testuser', expect.any(Object));
    });

    it('should handle fetch failures gracefully', async () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const validationResult = await (validationEngine as any).checkUsernameInContent(mockSite, 'testuser', result);
      
      expect(validationResult.confidence).toBe(0.3);
      expect(validationResult.reasons).toContain('Could not verify username in content');
    });
  });

  describe('checkJsonApiEndpoint', () => {
    it('should check JSON API endpoints when available', async () => {
      const siteWithApi: SiteSpec = {
        ...mockSite,
        profile: {
          ...mockSite.profile,
          apiEndpoint: 'https://api.github.com/users/{username}'
        }
      };

      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          login: 'testuser',
          id: 12345,
          type: 'User'
        }),
        headers: new Map([['content-type', 'application/json']])
      });

      const validationResult = await (validationEngine as any).checkJsonApiEndpoint(siteWithApi, 'testuser', result);
      
      expect(validationResult.confidence).toBeGreaterThan(0.8);
      expect(validationResult.reasons).toContain('API endpoint confirms user exists');
    });

    it('should handle API 404 responses', async () => {
      const siteWithApi: SiteSpec = {
        ...mockSite,
        profile: {
          ...mockSite.profile,
          apiEndpoint: 'https://api.github.com/users/{username}'
        }
      };

      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
        headers: new Map([['content-type', 'application/json']])
      });

      const validationResult = await (validationEngine as any).checkJsonApiEndpoint(siteWithApi, 'testuser', result);
      
      expect(validationResult.confidence).toBe(0.1);
      expect(validationResult.reasons).toContain('API endpoint indicates user does not exist');
    });
  });

  describe('aggregateValidations', () => {
    it('should properly aggregate multiple validation results', async () => {
      const validations = [
        {
          confidence: 0.9,
          reasons: ['Strong evidence 1'],
          evidence: [{ kind: 'test1', value: 'value1' }]
        },
        {
          confidence: 0.7,
          reasons: ['Moderate evidence 2'],
          evidence: [{ kind: 'test2', value: 'value2' }]
        },
        {
          confidence: 0.5,
          reasons: ['Weak evidence 3'],
          evidence: []
        }
      ];

      const aggregated = (validationEngine as any).aggregateValidations(validations);

      expect(aggregated.confidence).toBeCloseTo(0.7); // Weighted average
      expect(aggregated.reasons).toHaveLength(3);
      expect(aggregated.evidence).toHaveLength(2);
    });

    it('should handle empty validation array', async () => {
      const aggregated = (validationEngine as any).aggregateValidations([]);

      expect(aggregated.confidence).toBe(0.3);
      expect(aggregated.reasons).toContain('No validations completed');
      expect(aggregated.evidence).toHaveLength(0);
    });
  });

  describe('determineFinalStatus', () => {
    it('should upgrade inconclusive to found with high confidence', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'inconclusive',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      const validation = {
        confidence: 0.9,
        reasons: ['High confidence validation'],
        evidence: []
      };

      const finalStatus = (validationEngine as any).determineFinalStatus(primaryResult, validation);

      expect(finalStatus).toBe('found');
    });

    it('should downgrade found to inconclusive with low confidence', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      const validation = {
        confidence: 0.2,
        reasons: ['Low confidence validation'],
        evidence: []
      };

      const finalStatus = (validationEngine as any).determineFinalStatus(primaryResult, validation);

      expect(finalStatus).toBe('inconclusive');
    });

    it('should maintain found status with medium-high confidence', async () => {
      const primaryResult: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 100
      };

      const validation = {
        confidence: 0.6,
        reasons: ['Medium confidence validation'],
        evidence: []
      };

      const finalStatus = (validationEngine as any).determineFinalStatus(primaryResult, validation);

      expect(finalStatus).toBe('found');
    });
  });
});