import { describe, it, expect } from 'vitest';
import { validator, tracker } from '../lib/type-check';
import { ValidationEngine } from '../lib/validation-engine';
import { PrecisionTracker } from '../lib/precision-metrics';

describe('Type Check Module', () => {
  describe('Exported instances', () => {
    it('should export a ValidationEngine instance', () => {
      expect(validator).toBeInstanceOf(ValidationEngine);
    });

    it('should export a PrecisionTracker instance', () => {
      expect(tracker).toBeInstanceOf(PrecisionTracker);
    });
  });

  describe('Type validation', () => {
    it('should validate that all imports work correctly', () => {
      // This test ensures that the type-check module can be imported
      // and all its dependencies are properly resolved
      expect(typeof validator).toBe('object');
      expect(typeof tracker).toBe('object');
    });

    it('should have proper method signatures on ValidationEngine', () => {
      expect(typeof validator.validateResult).toBe('function');
    });

    it('should have proper method signatures on PrecisionTracker', () => {
      expect(typeof tracker.calculateMetrics).toBe('function');
      expect(typeof tracker.updateSiteMetrics).toBe('function');
      expect(typeof tracker.recordScan).toBe('function');
    });
  });

  describe('Instance functionality', () => {
    it('should allow ValidationEngine methods to be called', async () => {
      const mockSite = {
        id: 'test',
        tier: 'fundamental' as const,
        profile: {
          url: 'https://test.com/{username}',
          successPatterns: ['test'],
          notFoundPatterns: ['404'],
          timeoutMs: 3000
        },
        recovery: { enabled: false, risk: 'green' as const }
      };

      const mockResult = {
        id: 'test',
        status: 'found' as const,
        url: 'https://test.com/user',
        latencyMs: 100
      };

      // This should not throw
      const result = await validator.validateResult(mockSite, 'testuser', mockResult);
      expect(result).toBeDefined();
      expect(result.primary).toBe(mockResult);
    });

    it('should allow PrecisionTracker methods to be called', () => {
      const mockResults = [
        {
          id: 'test',
          status: 'found' as const,
          url: 'https://test.com/user',
          latencyMs: 100
        }
      ];

      // This should not throw
      const metrics = tracker.calculateMetrics(mockResults);
      expect(metrics).toBeDefined();
      expect(metrics.totalScanned).toBe(1);
    });
  });
});