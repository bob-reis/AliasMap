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

  // --- helpers ---------------------------------------------------------------
  const getExec = (re: RegExp): string | undefined => {
    re.lastIndex = 0;
    const r = re.exec(html);
    return r?.[1];
  };

  const decodeJsonUrl = (s?: string) =>
    s
      ? s
          .replace(/\\\//g, "/")
          .replace(/\\u0026/gi, "&")
          .replace(/\\u003c/gi, "<")
          .replace(/\\u003e/gi, ">")
      : s;

  const absolutize = (u?: string) => (u ? resolveUrlMaybe(u, baseUrl) : u);

  const safeHost = (): string | undefined => {
    try {
      return new URL(baseUrl).host.toLowerCase();
    } catch {
      return undefined;
    }
  };

  const safePathUser = (): string => {
    try {
      const parts = new URL(baseUrl).pathname.split("/").filter(Boolean);
      return (parts[0] || "").toLowerCase();
    } catch {
      return "";
    }
  };

  // --- 1) OG / Twitter / JSON-LD --------------------------------------------
  const ogImageSecure = getExec(
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)/i
  );
  const ogImage = getExec(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i
  );
  const twImage = getExec(
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i
  );

  // JSON-LD (primeiro bloco apenas)
  {
    const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
    ldRe.lastIndex = 0;
    const ld = ldRe.exec(html);
    if (ld?.[1]) {
      try {
        const data = JSON.parse(ld[1]);
        if (typeof data === "object" && data) {
          const rawImage = Array.isArray((data).image)
            ? (data).image[0]
            : (data).image;
          if (!m.image && typeof rawImage === "string") m.image = absolutize(rawImage);

          const name = (data).name;
          if (!m.title && typeof name === "string") m.title = name;
        }
      } catch {
        // ignora parse falho
      }
    }
  }

  if (!m.image) m.image = absolutize(ogImageSecure || ogImage || twImage);

  if (!m.image) {
    // <link rel="image_src" href="...">
    const linkImage = getExec(
      /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)/i
    );
    if (linkImage) m.image = absolutize(linkImage);
  }

  // --- 2) Instagram: JSON profundo (ProfilePage/graphql) com confirmação -----
  if (!m.image && (safeHost() || "").includes("instagram.com")) {
    const uname = safePathUser();

    try {
      const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      scriptRe.lastIndex = 0;
      let sMatch: RegExpExecArray | null;

      outer: while ((sMatch = scriptRe.exec(html))) {
        const content = sMatch[1] ?? "";
        // checagem rápida
        if (!/ProfilePage|graphql|profile_pic_url/i.test(content)) continue;

        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        if (start < 0 || end <= start) continue;

        const blob = content.slice(start, end + 1);
        try {
          const data = JSON.parse(blob);
          const queue: any[] = [data];
          const seen = new Set<any>();

          while (queue.length) {
            const node = queue.shift();
            if (!node || typeof node !== "object" || seen.has(node)) continue;
            seen.add(node);

            const user =
              (node).user ||
              (node).graphql?.user ||
              (node).profile?.user;

            if (user && typeof user === "object") {
              const u = String(user.username || "").toLowerCase();
              const pic = user.profile_pic_url_hd || user.profile_pic_url;
              if (u && u === uname && typeof pic === "string") {
                m.image = absolutize(decodeJsonUrl(pic));
                break outer;
              }
            }

            for (const k of Object.keys(node)) {
              const v: any = (node)[k];
              if (v && typeof v === "object") queue.push(v);
            }
          }
        } catch {
          // next <script>
        }
      }
    } catch {
      // next
    }
  }

  // --- 3) Instagram: JSON simples (username + profile_pic_url[_hd]) ----------
  if (!m.image && (safeHost() || "").includes("instagram.com")) {
    try {
      const uname = safePathUser();

      const userRe = /"username"\s*:\s*"([^"]+)"/i;
      userRe.lastIndex = 0;
      const jsonUser = userRe.exec(html)?.[1]?.toLowerCase();

      const hdRe = /"profile_pic_url_hd"\s*:\s*"([^"]+)"/i;
      hdRe.lastIndex = 0;
      const picHd = hdRe.exec(html)?.[1];

      const picRe = /"profile_pic_url"\s*:\s*"([^"]+)"/i;
      picRe.lastIndex = 0;
      const pic = picRe.exec(html)?.[1];

      const decoded = decodeJsonUrl(picHd || pic);
      if (decoded && uname && jsonUser === uname) {
        m.image = absolutize(decoded);
      }
    } catch {
      // segue
    }
  }

  // --- 4) Instagram: fallback <img alt="…profile picture…"> -------------------
  if (!m.image && (safeHost() || "").includes("instagram.com")) {
    try {
      const PROFILE_ALT =
        /profile picture|profile photo|foto do perfil|foto de perfil|photo de profil|imagen de perfil/i;

      const imgRe = /<img\b([^>]+)>/gi;
      imgRe.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = imgRe.exec(html))) {
        const attrs = match[1] ?? "";

        // alt
        const altRe = /\balt=["']([^"']+)["']/i;
        altRe.lastIndex = 0;
        const alt = altRe.exec(attrs)?.[1] ?? "";
        if (!PROFILE_ALT.test(alt)) continue;

        // src
        const srcRe = /\bsrc=["']([^"']+)["']/i;
        srcRe.lastIndex = 0;
        let candidate = srcRe.exec(attrs)?.[1];

        // srcset (pega o primeiro URL)
        if (!candidate) {
          const ssRe = /\bsrcset=["']([^"']+)["']/i;
          ssRe.lastIndex = 0;
          const srcset = ssRe.exec(attrs)?.[1];
          if (srcset) {
            // pega token até espaço (URL) do primeiro item
            const first = srcset.split(",")[0]?.trim();
            candidate = first ? first.split(/\s+/)[0] : undefined;
          }
        }

        if (candidate) {
          m.image = absolutize(candidate);
          break;
        }
      }
    } catch {
      // segue
    }
  }

  // --- 5) Título e descrição --------------------------------------------------
  const ogTitle = getExec(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i
  );
  const titleRe = /<title[^>]*>([^<]+)<\/title>/i;
  titleRe.lastIndex = 0;
  const titleTag = titleRe.exec(html)?.[1];

  m.title = m.title || ogTitle || titleTag;

  const ogDesc = getExec(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i
  );
  const metaDesc = getExec(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i
  );
  m.description = ogDesc || metaDesc;

  return m;
}
