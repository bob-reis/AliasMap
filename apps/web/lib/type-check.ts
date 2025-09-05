// Simple type check file to validate all imports work
import { ValidationEngine } from './validation-engine';
import { PrecisionTracker } from './precision-metrics';
import type { SiteSpec, SiteResult, Evidence } from './types';

// Test instantiation
const validator = new ValidationEngine();
const tracker = new PrecisionTracker();

// Test with mock data
const mockSite: SiteSpec = {
  id: 'test',
  tier: 'fundamental',
  profile: {
    url: 'https://test.com/{username}',
    successPatterns: ['test'],
    notFoundPatterns: ['404'],
    timeoutMs: 3000
  },
  recovery: { enabled: false, risk: 'green' }
};

const mockResult: SiteResult = {
  id: 'test',
  status: 'found',
  url: 'https://test.com/user',
  latencyMs: 100,
  evidence: [
    { kind: 'validation_canonical', value: 'https://test.com/user' }
  ]
};

// This would compile successfully if types are correct
console.log('✅ All types are valid - build should work');

export { validator, tracker };