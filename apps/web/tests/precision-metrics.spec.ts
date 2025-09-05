import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrecisionTracker } from '../lib/precision-metrics';
import type { SiteResult } from '../lib/types';

describe('PrecisionTracker', () => {
  let precisionTracker: PrecisionTracker;

  beforeEach(() => {
    precisionTracker = new PrecisionTracker();
  });

  describe('calculateMetrics', () => {
    it('should calculate correct metrics for mixed results', () => {
      const results: SiteResult[] = [
        { id: 'github', status: 'found', url: 'https://github.com/user1', latencyMs: 100 },
        { id: 'twitter', status: 'found', url: 'https://twitter.com/user1', latencyMs: 150 },
        { id: 'facebook', status: 'not_found', url: 'https://facebook.com/user1', latencyMs: 200 },
        { id: 'instagram', status: 'inconclusive', url: 'https://instagram.com/user1', latencyMs: 250 },
        { id: 'linkedin', status: 'error', url: 'https://linkedin.com/user1', latencyMs: 300 }
      ];

      const metrics = precisionTracker.calculateMetrics(results);

      expect(metrics.totalScanned).toBe(5);
      expect(metrics.found).toBe(2);
      expect(metrics.notFound).toBe(1);
      expect(metrics.inconclusive).toBe(1);
      expect(metrics.errors).toBe(1);
      
      // Precision score: (found + notFound) / total = (2 + 1) / 5 = 0.6
      expect(metrics.precisionScore).toBe(0.6);
      
      // Inconclusive rate: inconclusive / total = 1 / 5 = 0.2
      expect(metrics.inconclusiveRate).toBe(0.2);
      
      expect(metrics.qualityScore).toBeGreaterThan(0);
      expect(metrics.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should handle empty results array', () => {
      const metrics = precisionTracker.calculateMetrics([]);

      expect(metrics.totalScanned).toBe(0);
      expect(metrics.found).toBe(0);
      expect(metrics.notFound).toBe(0);
      expect(metrics.inconclusive).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.precisionScore).toBe(0);
      expect(metrics.inconclusiveRate).toBe(0);
      expect(metrics.qualityScore).toBe(0);
    });

    it('should calculate perfect precision for all definitive results', () => {
      const results: SiteResult[] = [
        { id: 'github', status: 'found', url: 'https://github.com/user1', latencyMs: 100 },
        { id: 'twitter', status: 'not_found', url: 'https://twitter.com/user1', latencyMs: 150 },
        { id: 'facebook', status: 'found', url: 'https://facebook.com/user1', latencyMs: 200 }
      ];

      const metrics = precisionTracker.calculateMetrics(results);

      expect(metrics.precisionScore).toBe(1.0);
      expect(metrics.inconclusiveRate).toBe(0);
      expect(metrics.qualityScore).toBeGreaterThan(0.8);
    });

    it('should handle results with validation evidence', () => {
      const results: SiteResult[] = [
        { 
          id: 'github', 
          status: 'found', 
          url: 'https://github.com/user1', 
          latencyMs: 100,
          evidence: [
            { kind: 'validation_canonical', value: 'https://github.com/user1' },
            { kind: 'pattern', value: 'User profile found' }
          ]
        },
        { 
          id: 'twitter', 
          status: 'found', 
          url: 'https://twitter.com/user1', 
          latencyMs: 150,
          evidence: [
            { kind: 'validation_meta', value: 'Meta tag confirmed' }
          ]
        }
      ];

      const metrics = precisionTracker.calculateMetrics(results);

      expect(metrics.averageConfidence).toBeGreaterThan(0);
      expect(metrics.qualityScore).toBeGreaterThan(0);
    });
  });

  describe('updateSiteMetrics', () => {
    it('should create new site metrics for first attempt', () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 150
      };

      precisionTracker.updateSiteMetrics('github', result);

      const siteMetrics = (precisionTracker as any).siteMetrics.get('github');
      
      expect(siteMetrics).toBeDefined();
      expect(siteMetrics.siteId).toBe('github');
      expect(siteMetrics.attempts).toBe(1);
      expect(siteMetrics.successes).toBe(1);
      expect(siteMetrics.inconclusive).toBe(0);
      expect(siteMetrics.averageLatency).toBe(150);
      expect(siteMetrics.reliabilityScore).toBeGreaterThan(0);
    });

    it('should update existing site metrics', () => {
      const result1: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/user1',
        latencyMs: 100
      };

      const result2: SiteResult = {
        id: 'github',
        status: 'inconclusive',
        url: 'https://github.com/user2',
        latencyMs: 200
      };

      precisionTracker.updateSiteMetrics('github', result1);
      precisionTracker.updateSiteMetrics('github', result2);

      const siteMetrics = (precisionTracker as any).siteMetrics.get('github');
      
      expect(siteMetrics.attempts).toBe(2);
      expect(siteMetrics.successes).toBe(1);
      expect(siteMetrics.inconclusive).toBe(1);
      expect(siteMetrics.averageLatency).toBe(150); // (100 + 200) / 2
    });

    it('should handle error results correctly', () => {
      const result: SiteResult = {
        id: 'github',
        status: 'error',
        url: 'https://github.com/testuser',
        latencyMs: 300,
        reason: 'Network timeout'
      };

      precisionTracker.updateSiteMetrics('github', result);

      const siteMetrics = (precisionTracker as any).siteMetrics.get('github');
      
      expect(siteMetrics.attempts).toBe(1);
      expect(siteMetrics.successes).toBe(0);
      expect(siteMetrics.inconclusive).toBe(0);
      expect(siteMetrics.reliabilityScore).toBe(0);
    });
  });

  describe('recordScan', () => {
    it('should record complete scan session', () => {
      const results: SiteResult[] = [
        { id: 'github', status: 'found', url: 'https://github.com/user1', latencyMs: 100 },
        { id: 'twitter', status: 'not_found', url: 'https://twitter.com/user1', latencyMs: 150 }
      ];

      precisionTracker.recordScan('testuser', results);

      // Verify that site metrics were updated
      const githubMetrics = (precisionTracker as any).siteMetrics.get('github');
      const twitterMetrics = (precisionTracker as any).siteMetrics.get('twitter');
      
      expect(githubMetrics).toBeDefined();
      expect(twitterMetrics).toBeDefined();
      expect(githubMetrics.attempts).toBe(1);
      expect(twitterMetrics.attempts).toBe(1);
    });

    it('should maintain scan history limit', () => {
      // Record multiple sessions
      for (let i = 0; i < 105; i++) { // More than the limit of 100
        const results: SiteResult[] = [
          { id: 'github', status: 'found', url: `https://github.com/user${i}`, latencyMs: 100 }
        ];
        precisionTracker.recordScan(`user${i}`, results);
      }

      const history = (precisionTracker as any).scanHistory;
      expect(history.length).toBeLessThanOrEqual(100); // History limit
      
      // Should keep most recent entries
      expect(history[history.length - 1].username).toBe('user104');
    });
  });

  describe('getProblematicSites', () => {
    it('should identify sites with high inconclusive rates', () => {
      // Add data for multiple sites with different success rates
      const sites = [
        { id: 'reliable_site', inconclusive: 1, total: 10 }, // 10% inconclusive
        { id: 'problematic_site', inconclusive: 4, total: 10 }, // 40% inconclusive
        { id: 'very_problematic', inconclusive: 6, total: 10 } // 60% inconclusive
      ];
      
      sites.forEach(site => {
        for (let i = 0; i < site.total; i++) {
          const result: SiteResult = {
            id: site.id,
            status: i < site.inconclusive ? 'inconclusive' : 'found',
            url: `https://${site.id}.com/user${i}`,
            latencyMs: 100 + i * 10
          };
          precisionTracker.updateSiteMetrics(site.id, result);
        }
      });

      const problematicSites = precisionTracker.getProblematicSites();

      // Should find sites with >30% inconclusive rate
      expect(problematicSites.length).toBe(2);
      
      // Should be sorted by inconclusive rate descending
      expect(problematicSites[0].siteId).toBe('very_problematic');
      expect(problematicSites[1].siteId).toBe('problematic_site');
    });

    it('should filter sites by minimum attempts', () => {
      // Add site with few attempts
      const result: SiteResult = {
        id: 'new_site',
        status: 'inconclusive',
        url: 'https://newsite.com/user',
        latencyMs: 100
      };
      precisionTracker.updateSiteMetrics('new_site', result);

      const problematicSites = precisionTracker.getProblematicSites(5);

      // Should not include sites with < 5 attempts
      expect(problematicSites.find(s => s.siteId === 'new_site')).toBeUndefined();
    });
  });

  describe('getMostReliableSites', () => {
    it('should return sites with highest reliability scores', () => {
      const sites = [
        { id: 'site_a', successRate: 0.9 },
        { id: 'site_b', successRate: 0.8 },
        { id: 'site_c', successRate: 0.95 }
      ];
      
      sites.forEach(site => {
        for (let i = 0; i < 10; i++) {
          const result: SiteResult = {
            id: site.id,
            status: i < site.successRate * 10 ? 'found' : 'error',
            url: `https://${site.id}.com/user${i}`,
            latencyMs: 100
          };
          precisionTracker.updateSiteMetrics(site.id, result);
        }
      });

      const reliableSites = precisionTracker.getMostReliableSites();

      expect(reliableSites.length).toBe(3);
      
      // Should be sorted by reliability score descending
      expect(reliableSites[0].siteId).toBe('site_c');
      expect(reliableSites[1].siteId).toBe('site_a');
      expect(reliableSites[2].siteId).toBe('site_b');
      
      expect(reliableSites[0].reliabilityScore).toBeCloseTo(0.9, 1);
      expect(reliableSites[1].reliabilityScore).toBeCloseTo(0.9, 1);
      expect(reliableSites[2].reliabilityScore).toBeCloseTo(0.8, 1);
    });
  });

  describe('getPrecisionTrend', () => {
    it('should calculate precision improvement trend', () => {
      // Add scan sessions over time with improving quality
      const sessions = [
        { qualityScore: 0.6 },
        { qualityScore: 0.7 },
        { qualityScore: 0.8 }
      ];

      sessions.forEach((session, index) => {
        const results: SiteResult[] = Array.from({ length: 10 }, (_, i) => ({
          id: `site${i % 5}`,
          status: i < session.qualityScore * 10 ? 'found' : 'inconclusive',
          url: `https://site${i % 5}.com/user`,
          latencyMs: 100
        }));
        
        precisionTracker.recordScan(`user${index}`, results);
      });

      const trend = precisionTracker.getPrecisionTrend();

      expect(trend).toBeDefined();
      expect(trend.improving).toBe(true);
      expect(trend.change).toBeGreaterThan(0);
    });

    it('should handle insufficient data for trend analysis', () => {
      const trend = precisionTracker.getPrecisionTrend();

      expect(trend.improving).toBe(false);
      expect(trend.change).toBe(0);
    });
  });

  describe('generateQualityReport', () => {
    it('should generate comprehensive quality report', () => {
      // Add some scan data
      const results: SiteResult[] = [
        { id: 'github', status: 'found', url: 'https://github.com/user', latencyMs: 100 },
        { id: 'twitter', status: 'inconclusive', url: 'https://twitter.com/user', latencyMs: 200 },
        { id: 'facebook', status: 'not_found', url: 'https://facebook.com/user', latencyMs: 150 }
      ];
      
      precisionTracker.recordScan('testuser', results);

      const report = precisionTracker.generateQualityReport();

      expect(report).toBeDefined();
      expect(report.overall).toBeDefined();
      expect(report.trending).toBeDefined();
      expect(report.problematicSites).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should handle empty data gracefully', () => {
      const report = precisionTracker.generateQualityReport();

      expect(report.overall.totalScanned).toBe(0);
      expect(report.trending.improving).toBe(false);
      expect(report.problematicSites).toHaveLength(0);
      expect(report.recommendations).toContain('Realizar mais scans para gerar métricas');
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate quality score correctly for various scenarios', () => {
      // Test different combinations
      const testCases = [
        { precisionScore: 1.0, inconclusiveRate: 0.0, averageConfidence: 0.9, expected: 'high' },
        { precisionScore: 0.5, inconclusiveRate: 0.5, averageConfidence: 0.5, expected: 'medium' },
        { precisionScore: 0.2, inconclusiveRate: 0.8, averageConfidence: 0.2, expected: 'low' }
      ];

      testCases.forEach(testCase => {
        const qualityScore = (precisionTracker as any).calculateQualityScore(
          testCase.precisionScore, 
          testCase.inconclusiveRate, 
          testCase.averageConfidence
        );

        if (testCase.expected === 'high') {
          expect(qualityScore).toBeGreaterThan(0.7);
        } else if (testCase.expected === 'medium') {
          expect(qualityScore).toBeGreaterThan(0.3);
          expect(qualityScore).toBeLessThanOrEqual(0.7);
        } else {
          expect(qualityScore).toBeLessThanOrEqual(0.3);
        }
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined latencyMs gracefully', () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/user',
        latencyMs: undefined as any
      };

      expect(() => {
        precisionTracker.updateSiteMetrics('github', result);
      }).not.toThrow();

      const siteMetrics = precisionTracker.getSiteMetrics('github');
      expect(siteMetrics!.averageLatency).toBe(0);
    });

    it('should handle null/undefined evidence arrays', () => {
      const results: SiteResult[] = [
        { 
          id: 'github', 
          status: 'found', 
          url: 'https://github.com/user', 
          latencyMs: 100,
          evidence: undefined as any
        },
        { 
          id: 'twitter', 
          status: 'found', 
          url: 'https://twitter.com/user', 
          latencyMs: 100,
          evidence: null as any
        }
      ];

      expect(() => {
        const metrics = precisionTracker.calculateMetrics(results);
        expect(metrics.averageConfidence).toBe(0);
      }).not.toThrow();
    });

    it('should handle very large datasets efficiently', () => {
      const largeResults: SiteResult[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `site${i % 50}`, // 50 different sites, 20 attempts each
        status: i % 4 === 0 ? 'found' : i % 4 === 1 ? 'not_found' : i % 4 === 2 ? 'inconclusive' : 'error',
        url: `https://site${i % 50}.com/user${i}`,
        latencyMs: 50 + (i % 200)
      }));

      const startTime = Date.now();
      const metrics = precisionTracker.calculateMetrics(largeResults);
      const endTime = Date.now();

      // Should complete within reasonable time (< 100ms for 1000 results)
      expect(endTime - startTime).toBeLessThan(100);
      
      expect(metrics.totalScanned).toBe(1000);
      expect(metrics.precisionScore).toBeGreaterThan(0);
      expect(metrics.qualityScore).toBeGreaterThanOrEqual(0);
    });
  });
});