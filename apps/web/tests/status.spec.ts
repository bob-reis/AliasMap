import { describe, it, expect } from 'vitest';
import { normalizeStatus } from '../lib/status';

describe('normalizeStatus', () => {
  it('classifies found and 200', () => {
    expect(normalizeStatus('found')).toBe('found');
    expect(normalizeStatus('200')).toBe('found');
  });

  it('classifies not found and 404', () => {
    expect(normalizeStatus('not_found')).toBe('not_found');
    expect(normalizeStatus('404')).toBe('not_found');
  });

  it('classifies error and timeout as error', () => {
    expect(normalizeStatus('timeout')).toBe('error');
    expect(normalizeStatus('error')).toBe('error');
  });

  it('classifies 403 and block as inconclusive', () => {
    expect(normalizeStatus('403')).toBe('inconclusive');
    expect(normalizeStatus('blocked')).toBe('inconclusive');
  });

  it('defaults to inconclusive', () => {
    expect(normalizeStatus('weird')).toBe('inconclusive');
  });
});

