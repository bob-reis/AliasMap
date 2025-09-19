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
  const decodeJsonUrl = (s?: string) =>
    s
      ? s
          .replace(/\\\//g, "/")
          .replace(/\\u0026/gi, "&")
          .replace(/\\u003c/gi, "<")
          .replace(/\\u003e/gi, ">")
      : s;

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

  // Instagram-specific: parse embedded script JSON (ProfilePage/graphql) to locate user + avatar
  if (!m.image) {
    try {
      const host = new URL(baseUrl).host.toLowerCase();
      if (host.includes('instagram.com')) {
        const pathParts = new URL(baseUrl).pathname.split('/').filter(Boolean);
        const uname = (pathParts[0] || '').toLowerCase();
        const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let sMatch: RegExpExecArray | null;
        outer: while ((sMatch = scriptRe.exec(html))) {
          const content = sMatch[1];
          if (!/ProfilePage|graphql|profile_pic_url/i.test(content)) continue;
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}');
          if (start < 0 || end <= start) continue;
          const blob = content.slice(start, end + 1);
          try {
            const data = JSON.parse(blob);
            const queue: any[] = [data];
            const seen = new Set<any>();
            while (queue.length) {
              const node = queue.shift();
              if (!node || typeof node !== 'object' || seen.has(node)) continue;
              seen.add(node);
              const user = (node as any).user || (node as any).graphql?.user || (node as any).profile?.user;
              if (user && typeof user === 'object') {
                const u = String(user.username || '').toLowerCase();
                const pic = user.profile_pic_url_hd || user.profile_pic_url;
                if (u && u === uname && typeof pic === 'string') {
                  m.image = resolveUrlMaybe(decodeJsonUrl(pic), baseUrl);
                  break outer;
                }
              }
              for (const k of Object.keys(node)) {
                const v: any = (node as any)[k];
                if (v && typeof v === 'object') queue.push(v);
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  // Instagram-specific fallback: scan <img> tags with alt indicating profile picture (localized variants)
  if (!m.image) {
    try {
      const host = new URL(baseUrl).host.toLowerCase();
      if (host.includes('instagram.com')) {
        // Try embedded script JSON first with username confirmation
        const pathParts = new URL(baseUrl).pathname.split('/').filter(Boolean);
        const uname = (pathParts[0] || '').toLowerCase();
        const jsonUser = html.match(/"username"\s*:\s*"([^"]+)"/i)?.[1]?.toLowerCase();
        const picHd = html.match(/"profile_pic_url_hd"\s*:\s*"([^"]+)"/i)?.[1];
        const pic = html.match(/"profile_pic_url"\s*:\s*"([^"]+)"/i)?.[1];
        const decoded = decodeJsonUrl(picHd || pic);
        if (decoded && uname && jsonUser === uname) {
          m.image = resolveUrlMaybe(decoded, baseUrl);
        }
      }
    } catch {}
  }

  if (!m.image) {
    try {
      const host = new URL(baseUrl).host.toLowerCase();
      if (host.includes('instagram.com')) {
        const pathParts = new URL(baseUrl).pathname.split('/').filter(Boolean);
        const uname = (pathParts[0] || '').toLowerCase();
        // Common localized keywords: profile, perfil, profil, foto del perfil, photo de profil
        const imgRe = /<img[^>]+alt=["']([^"']+)["'][^>]*>/gi;
        let match: RegExpExecArray | null;
        while ((match = imgRe.exec(html))) {
          const alt = match[1].toLowerCase();
          if (/(profile|perfil|profil)/i.test(alt) && (!!uname && alt.includes(uname))) {
            const tag = match[0];
            const src = (tag.match(/\s src=["']([^"']+)["']/i)?.[1]) || undefined;
            const srcset = (tag.match(/\s srcset=["']([^"']+)["']/i)?.[1]) || undefined;
            let candidate = src;
            if (!candidate && srcset) {
              // take first URL from srcset
              candidate = srcset.split(',')[0]?.trim().split(' ')[0];
            }
            if (candidate) {
              m.image = resolveUrlMaybe(candidate, baseUrl);
              break;
            }
          }
        }
      }
    } catch {
      // ignore URL parsing errors
    }
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
