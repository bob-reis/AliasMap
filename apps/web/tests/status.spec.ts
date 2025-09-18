import { describe, it, expect } from 'vitest';
import { normalizeStatus } from '../lib/status';

describe('normalizeStatus (table-driven)', () => {
  const cases: Array<[input: string, output: string]> = [
    ['found', 'found'],
    ['200', 'found'],
    ['not_found', 'not_found'],
    ['404', 'not_found'],
    ['timeout', 'error'],
    ['error', 'error'],
    ['403', 'inconclusive'],
    ['blocked', 'inconclusive'],
    ['weird', 'inconclusive'],
  ];

  it('normalizes statuses correctly', () => {
    for (const [input, output] of cases) {
      expect(normalizeStatus(input)).toBe(output);
    }
  });
});
