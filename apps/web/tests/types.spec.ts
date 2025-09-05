import { describe, it, expect } from 'vitest';
import type { Tier, SiteNorm, SiteProfileSpec, SiteSpec, Evidence, SiteResult } from '../lib/types';

describe('Types Module', () => {
  describe('Tier type', () => {
    it('should accept valid tier values', () => {
      const tiers: Tier[] = ['fundamental', 'core', 'optional', 'all'];
      
      tiers.forEach(tier => {
        expect(['fundamental', 'core', 'optional', 'all']).toContain(tier);
      });
    });
  });

  describe('SiteNorm interface', () => {
    it('should create valid SiteNorm objects', () => {
      const norm1: SiteNorm = {
        caseSensitive: true,
        allowed: '^[a-zA-Z0-9_]+$'
      };

      const norm2: SiteNorm = {
        caseSensitive: false
      };

      const norm3: SiteNorm = {
        allowed: '^[a-z]+$'
      };

      const norm4: SiteNorm = {};

      expect(norm1.caseSensitive).toBe(true);
      expect(norm1.allowed).toBe('^[a-zA-Z0-9_]+$');
      expect(norm2.caseSensitive).toBe(false);
      expect(norm3.allowed).toBe('^[a-z]+$');
      expect(typeof norm4).toBe('object');
    });
  });

  describe('SiteProfileSpec interface', () => {
    it('should create valid SiteProfileSpec objects', () => {
      const profile1: SiteProfileSpec = {
        url: 'https://github.com/{username}',
        successPatterns: ['<title>.*{username}.*</title>'],
        notFoundPatterns: ['<title>Page not found</title>'],
        timeoutMs: 3000
      };

      const profile2: SiteProfileSpec = {
        url: 'https://twitter.com/{username}',
        successPatterns: ['<meta property="og:title".*{username}.*"']
      };

      expect(profile1.url).toBe('https://github.com/{username}');
      expect(profile1.successPatterns).toHaveLength(1);
      expect(profile1.notFoundPatterns).toHaveLength(1);
      expect(profile1.timeoutMs).toBe(3000);

      expect(profile2.url).toBe('https://twitter.com/{username}');
      expect(profile2.successPatterns).toHaveLength(1);
      expect(profile2.notFoundPatterns).toBeUndefined();
      expect(profile2.timeoutMs).toBeUndefined();
    });
  });

  describe('SiteSpec interface', () => {
    it('should create valid SiteSpec objects with all properties', () => {
      const site: SiteSpec = {
        id: 'github',
        tier: 'fundamental',
        norm: {
          caseSensitive: false,
          allowed: '^[a-zA-Z0-9_-]+$'
        },
        profile: {
          url: 'https://github.com/{username}',
          successPatterns: ['<title>.*{username}.*</title>'],
          notFoundPatterns: ['<title>Page not found</title>'],
          timeoutMs: 3000
        },
        recovery: {
          enabled: true,
          risk: 'green',
          endpoint: 'https://api.github.com/users/{username}',
          method: 'GET',
          parsePatterns: ['login.*{username}'],
          notes: 'GitHub API endpoint'
        }
      };

      expect(site.id).toBe('github');
      expect(site.tier).toBe('fundamental');
      expect(site.norm?.caseSensitive).toBe(false);
      expect(site.profile.url).toBe('https://github.com/{username}');
      expect(site.recovery?.enabled).toBe(true);
      expect(site.recovery?.risk).toBe('green');
      expect(site.recovery?.method).toBe('GET');
    });

    it('should create minimal SiteSpec objects', () => {
      const site: SiteSpec = {
        id: 'simple-site',
        tier: 'optional',
        profile: {
          url: 'https://simple.com/{username}',
          successPatterns: ['User found']
        }
      };

      expect(site.id).toBe('simple-site');
      expect(site.tier).toBe('optional');
      expect(site.norm).toBeUndefined();
      expect(site.recovery).toBeUndefined();
    });

    it('should support all risk levels', () => {
      const risks: Array<'green' | 'amber' | 'red'> = ['green', 'amber', 'red'];
      
      risks.forEach(risk => {
        const site: SiteSpec = {
          id: 'test',
          tier: 'core',
          profile: {
            url: 'https://test.com/{username}',
            successPatterns: ['found']
          },
          recovery: {
            enabled: true,
            risk: risk
          }
        };

        expect(site.recovery?.risk).toBe(risk);
      });
    });
  });

  describe('Evidence interface', () => {
    it('should create evidence with all valid kinds', () => {
      const evidenceKinds: Evidence['kind'][] = [
        'pattern',
        'canonical',
        'og:url',
        'final_url',
        'username-text',
        'validation_canonical',
        'validation_og_title',
        'validation_og_url',
        'validation_profile_image',
        'validation_schema',
        'validation_username_mentions',
        'validation_head_200',
        'validation_head_404',
        'validation_redirect_notfound',
        'validation_redirect_username',
        'validation_content_type',
        'validation_server',
        'validation_cache',
        'validation_json_api'
      ];

      evidenceKinds.forEach(kind => {
        const evidence: Evidence = {
          kind,
          value: `test value for ${kind}`
        };

        expect(evidence.kind).toBe(kind);
        expect(evidence.value).toBe(`test value for ${kind}`);
      });
    });

    it('should create evidence arrays', () => {
      const evidenceArray: Evidence[] = [
        { kind: 'pattern', value: 'Username pattern matched' },
        { kind: 'canonical', value: 'https://github.com/testuser' },
        { kind: 'validation_json_api', value: 'API confirmed user exists' }
      ];

      expect(evidenceArray).toHaveLength(3);
      expect(evidenceArray[0].kind).toBe('pattern');
      expect(evidenceArray[1].kind).toBe('canonical');
      expect(evidenceArray[2].kind).toBe('validation_json_api');
    });
  });

  describe('SiteResult interface', () => {
    it('should create complete SiteResult objects', () => {
      const result: SiteResult = {
        id: 'github',
        status: 'found',
        url: 'https://github.com/testuser',
        latencyMs: 150,
        reason: 'Profile successfully found',
        evidence: [
          { kind: 'pattern', value: 'Username pattern matched' },
          { kind: 'canonical', value: 'https://github.com/testuser' }
        ]
      };

      expect(result.id).toBe('github');
      expect(result.status).toBe('found');
      expect(result.url).toBe('https://github.com/testuser');
      expect(result.latencyMs).toBe(150);
      expect(result.reason).toBe('Profile successfully found');
      expect(result.evidence).toHaveLength(2);
    });

    it('should create minimal SiteResult objects', () => {
      const result: SiteResult = {
        id: 'twitter',
        status: 'not_found',
        url: 'https://twitter.com/testuser',
        latencyMs: 200
      };

      expect(result.id).toBe('twitter');
      expect(result.status).toBe('not_found');
      expect(result.url).toBe('https://twitter.com/testuser');
      expect(result.latencyMs).toBe(200);
      expect(result.reason).toBeUndefined();
      expect(result.evidence).toBeUndefined();
    });

    it('should support all status values', () => {
      const statuses: SiteResult['status'][] = ['found', 'not_found', 'inconclusive', 'error'];
      
      statuses.forEach(status => {
        const result: SiteResult = {
          id: 'test',
          status,
          url: 'https://test.com/user',
          latencyMs: 100
        };

        expect(result.status).toBe(status);
      });
    });

    it('should handle error results with reasons', () => {
      const errorResult: SiteResult = {
        id: 'failing-site',
        status: 'error',
        url: 'https://failing-site.com/user',
        latencyMs: 5000,
        reason: 'Connection timeout after 5 seconds'
      };

      expect(errorResult.status).toBe('error');
      expect(errorResult.reason).toBe('Connection timeout after 5 seconds');
      expect(errorResult.latencyMs).toBe(5000);
    });

    it('should handle inconclusive results', () => {
      const inconclusiveResult: SiteResult = {
        id: 'ambiguous-site',
        status: 'inconclusive',
        url: 'https://ambiguous-site.com/user',
        latencyMs: 300,
        reason: 'Could not determine if profile exists',
        evidence: [
          { kind: 'validation_head_200', value: 'Page responded with 200' },
          { kind: 'pattern', value: 'No clear success or failure pattern' }
        ]
      };

      expect(inconclusiveResult.status).toBe('inconclusive');
      expect(inconclusiveResult.reason).toBe('Could not determine if profile exists');
      expect(inconclusiveResult.evidence).toHaveLength(2);
    });
  });

  describe('Type compatibility', () => {
    it('should work with arrays and collections', () => {
      const sites: SiteSpec[] = [
        {
          id: 'site1',
          tier: 'fundamental',
          profile: {
            url: 'https://site1.com/{username}',
            successPatterns: ['found']
          }
        },
        {
          id: 'site2',
          tier: 'core',
          profile: {
            url: 'https://site2.com/{username}',
            successPatterns: ['user exists']
          }
        }
      ];

      const results: SiteResult[] = [
        {
          id: 'site1',
          status: 'found',
          url: 'https://site1.com/testuser',
          latencyMs: 100
        },
        {
          id: 'site2',
          status: 'not_found',
          url: 'https://site2.com/testuser',
          latencyMs: 200
        }
      ];

      expect(sites).toHaveLength(2);
      expect(results).toHaveLength(2);
      expect(sites[0].tier).toBe('fundamental');
      expect(results[0].status).toBe('found');
    });

    it('should work with Maps and other collections', () => {
      const siteMap = new Map<string, SiteSpec>();
      const resultMap = new Map<string, SiteResult>();

      const site: SiteSpec = {
        id: 'test',
        tier: 'optional',
        profile: {
          url: 'https://test.com/{username}',
          successPatterns: ['test']
        }
      };

      const result: SiteResult = {
        id: 'test',
        status: 'found',
        url: 'https://test.com/user',
        latencyMs: 150
      };

      siteMap.set('test', site);
      resultMap.set('test', result);

      expect(siteMap.get('test')).toBe(site);
      expect(resultMap.get('test')).toBe(result);
    });
  });
});