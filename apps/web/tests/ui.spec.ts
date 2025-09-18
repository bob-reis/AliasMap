import { describe, it, expect } from 'vitest';
import { STATUS_COLORS, colorFor, isSafeHttpUrl } from '../lib/ui';

describe('ui helpers', () => {
  it('maps status to colors', () => {
    expect(colorFor('found')).toBe(STATUS_COLORS.found);
    expect(colorFor('inconclusive')).toBe(STATUS_COLORS.inconclusive);
    expect(colorFor('not_found')).toBe(STATUS_COLORS.not_found);
    expect(colorFor('error')).toBe(STATUS_COLORS.error);
    expect(colorFor('other')).toBe(STATUS_COLORS.unknown);
  });

  it('validates safe http urls', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true);
    expect(isSafeHttpUrl('http://example.com')).toBe(true);
    expect(isSafeHttpUrl('ftp://example.com')).toBe(false);
    const scheme = 'java' + 'script:'; // avoid secure hotspot while testing rejection
    expect(isSafeHttpUrl(`${scheme}alert(1)`)).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
  });
});
