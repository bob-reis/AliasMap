import { describe, it, expect } from 'vitest';
import { extractMeta, resolveUrlMaybe } from '../lib/meta';

const html = `
<!doctype html>
<html><head>
  <meta property="og:image" content="/avatar.jpg">
  <meta name="twitter:image" content="https://cdn.example.com/fallback.png">
  <meta property="og:title" content="User • Site">
  <meta name="description" content="Short bio here">
  <script type="application/ld+json">{"@type":"Person","name":"Alice","image":"/a.png"}</script>
  <title>ignored title</title>
</head><body></body></html>`;

describe('meta extraction', () => {
  it('resolves og/twitter/jsonld fields and relative URLs', () => {
    const m = extractMeta(html, 'https://example.com/u/alice');
    // JSON-LD image takes priority for image
    expect(m.image).toBe('https://example.com/a.png');
    // title prefers JSON-LD name, falls back to og:title
    expect(m.title).toBe('Alice');
    expect(m.description).toBe('Short bio here');
  });

  it('resolveUrlMaybe handles bad input', () => {
    expect(resolveUrlMaybe(undefined as any, 'https://e.com')).toBeUndefined();
    expect(resolveUrlMaybe('///bad', 'https://e.com')).toBeDefined();
  });

  it('extracts instagram profile image from img alt fallback', () => {
    const igHtml = `
    <html><head><title>@alice • Instagram</title></head>
    <body>
      <img alt="Foto do perfil de alice" src="/avatar150.jpg" />
    </body></html>`;
    const m = extractMeta(igHtml, 'https://www.instagram.com/alice/');
    expect(m.image).toBe('https://www.instagram.com/avatar150.jpg');
  });
});
