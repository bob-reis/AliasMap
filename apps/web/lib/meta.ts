export type ExtractedMeta = { image?: string; title?: string; description?: string };

export function resolveUrlMaybe(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined;
  try {
    return new URL(src, base).href;
  } catch {
    return undefined;
  }
}

export function extractMeta(html: string, baseUrl: string): ExtractedMeta {
  const m = {} as ExtractedMeta;
  const get = (re: RegExp) => {
    const match = html.match(re);
    return match?.[1];
  };

  // Image candidates: og:image:secure_url, og:image, twitter:image, JSON-LD image
  const ogImageSecure = get(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)/i);
  const ogImage = get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
  const twImage = get(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i);
  const ldJsonMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ldJsonMatch) {
    try {
      const data = JSON.parse(ldJsonMatch[1]);
      if (typeof data === 'object' && data) {
        const img = (Array.isArray((data as any).image) ? (data as any).image[0] : (data as any).image) as
          | string
          | undefined;
        if (!m.image && typeof img === 'string') m.image = resolveUrlMaybe(img, baseUrl);
        const name = (data as any).name;
        if (!m.title && typeof name === 'string') m.title = name;
      }
    } catch {
      // ignore JSON-LD parse errors
    }
  }
  if (!m.image) m.image = resolveUrlMaybe(ogImageSecure || ogImage || twImage, baseUrl);
  if (!m.image) {
    // Fallback to link rel="image_src" (rare)
    const linkImage = get(/<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)/i);
    if (linkImage) m.image = resolveUrlMaybe(linkImage, baseUrl);
  }

  // Title candidates
  const ogTitle = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
  const titleTag = get(/<title[^>]*>([^<]+)<\/title>/i);
  m.title = m.title || ogTitle || titleTag;

  // Description
  const ogDesc = get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
  const metaDesc = get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  m.description = ogDesc || metaDesc;

  return m;
}
