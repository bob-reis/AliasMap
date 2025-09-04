import { describe, it, expect } from 'vitest';
import { canonicalPlatformIdFromUrl, platformLabel } from '../lib/platforms';

describe('platforms utils', () => {
  it('canonicalizes reddit variants', () => {
    expect(canonicalPlatformIdFromUrl('https://old.reddit.com/user/alice')).toBe('reddit');
    expect(canonicalPlatformIdFromUrl('https://www.reddit.com/user/alice')).toBe('reddit');
  });

  it('maps x.com to twitter', () => {
    expect(canonicalPlatformIdFromUrl('https://x.com/alice')).toBe('twitter');
    expect(platformLabel('twitter')).toBe('Twitter');
  });

  it('handles deviantart typo and correct domain', () => {
    expect(canonicalPlatformIdFromUrl('https://alice.devianart.com/')).toBe('deviantart');
    expect(canonicalPlatformIdFromUrl('https://alice.deviantart.com/')).toBe('deviantart');
    expect(platformLabel('deviantart')).toBe('DeviantArt');
  });

  it('collapses tumblr subdomain to tumblr id', () => {
    expect(canonicalPlatformIdFromUrl('https://alice.tumblr.com/')).toBe('tumblr');
    expect(platformLabel('tumblr')).toBe('Tumblr');
  });
});
