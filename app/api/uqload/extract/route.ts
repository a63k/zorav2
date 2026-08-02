import { NextRequest, NextResponse } from 'next/server';

/**
 * Dean Edwards Packer Unpacker
 * Decompresses eval(function(p,a,c,k,e,d)...) JS blocks used by video hosts
 */
function unpackDeanEdwards(p: string, a: number, c: number, k: string[]): string {
  function eFunc(c: number, a: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return (c < a ? '' : eFunc(Math.floor(c / a), a)) + chars[c % a];
  }

  const mapping: Record<string, string> = {};
  for (let i = 0; i < c; i++) {
    const key = a > 1 ? eFunc(i, a) : i.toString();
    const val = k[i] && k[i].length > 0 ? k[i] : key;
    mapping[key] = val;
  }

  return p.replace(/\b\w+\b/g, (w) => mapping[w] || w);
}

/**
 * Normalizes input URL to Uqload embed URL format if needed
 */
function normalizeUqloadUrl(rawUrl: string): string {
  let url = rawUrl.trim();

  // If user pasted an HTML iframe tag: <iframe src="https://..." ...>
  const iframeSrcMatch = url.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1];
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // If already direct m3u8 or mp4
    if (parsed.pathname.endsWith('.m3u8') || parsed.pathname.endsWith('.mp4')) {
      return url;
    }

    // Support /e/id, /embed-id.html, /id.html
    const fileIdMatch = parsed.pathname.match(/\/(?:embed-|e\/)?([a-zA-Z0-9]+)(?:\.html)?/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      const searchParams = parsed.search || '';
      return `${parsed.protocol}//${parsed.host}/embed-${fileId}.html${searchParams}`;
    }
  } catch (e) {
    // If URL parsing fails, return raw url
  }

  return url;
}

/**
 * Core extraction function for Uqload HTML
 */
function extractStreamFromHtml(html: string, pageUrl: string): string | null {
  // 1. Direct regex match for Uqload HLS master m3u8 stream with tokens
  // Example: https://strm4.uqload.is/hls2/02/05413/yil2pu24ols0_l/master.m3u8?t=...&fr=...
  const uqloadHlsMatch = html.match(/https?:\/\/[a-zA-Z0-9\.\-]*uqload\.[a-zA-Z0-9]+\/hls[0-9]*\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
  if (uqloadHlsMatch) {
    return uqloadHlsMatch[0];
  }

  // 2. Look for sources: ["https://..."] in script tags
  const sourcesMatch = html.match(/sources\s*:\s*\[\s*["']([^"']+)["']/i);
  if (sourcesMatch && sourcesMatch[1]) {
    return sourcesMatch[1];
  }

  // 3. Look for sources: [{file: "https://..."}] or file: "https://..."
  const fileMatch = html.match(/(?:file|src)\s*:\s*["'](https?:\/\/[^"']+)["']/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // 4. Look for Dean Edwards packed JS eval(function(p,a,c,k,e,d)...)
  const evalRegex = /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\(([\s\S]*?)\)\)/g;
  let evalMatch: RegExpExecArray | null;

  while ((evalMatch = evalRegex.exec(html)) !== null) {
    const argsStr = evalMatch[1];
    const argsMatch = argsStr.match(/['"]([\s\S]*?)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]*)['"]\.split\(['"]\|['"]\)/);

    if (argsMatch) {
      const [, p, aStr, cStr, kStr] = argsMatch;
      const a = parseInt(aStr, 10);
      const c = parseInt(cStr, 10);
      const k = kStr.split('|');

      try {
        const unpacked = unpackDeanEdwards(p, a, c, k);

        // Check unpacked JS for stream URLs
        const unpackedHls = unpacked.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
        if (unpackedHls) return unpackedHls[0];

        const unpackedMp4 = unpacked.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
        if (unpackedMp4) return unpackedMp4[0];

        const unpackedSources = unpacked.match(/sources\s*:\s*\[\s*["']([^"']+)["']/i);
        if (unpackedSources && unpackedSources[1]) return unpackedSources[1];
      } catch (err) {
        // Continue checking next eval block if any
      }
    }
  }

  // 5. Fallback generic match for any .m3u8 or .mp4 link in the page
  const genericM3u8 = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
  if (genericM3u8) return genericM3u8[0];

  const genericMp4 = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
  if (genericMp4) return genericMp4[0];

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'Paramètre "url" requis (ex: /api/uqload/extract?url=https://uqload.is/embed-xxx.html)' },
      { status: 400 }
    );
  }

  return processExtraction(targetUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUrl = body.url;

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Propriété "url" requise dans le corps JSON' },
        { status: 400 }
      );
    }

    return processExtraction(targetUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Requête invalide' }, { status: 400 });
  }
}

async function processExtraction(rawUrl: string) {
  // If the raw URL is already a direct master.m3u8 or mp4 stream, return it directly!
  if (rawUrl.includes('.m3u8') || (rawUrl.includes('.mp4') && !rawUrl.includes('player_blank'))) {
    return NextResponse.json({
      success: true,
      streamUrl: rawUrl,
      isHls: rawUrl.includes('.m3u8'),
      originalUrl: rawUrl,
    });
  }

  const embedUrl = normalizeUqloadUrl(rawUrl);

  try {
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://uqload.is/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 0 }, // Do not cache stale tokens
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de contacter le serveur Uqload (HTTP Status ${response.status})`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Check if Uqload states file is expired or deleted
    if (html.includes('File is no longer available') || html.includes('expired or has been deleted')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le fichier vidéo Uqload a expiré ou n\'est plus disponible sur les serveurs Uqload.',
        },
        { status: 404 }
      );
    }

    const streamUrl = extractStreamFromHtml(html, embedUrl);

    if (!streamUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Flux vidéo introuvable dans le code HTML de la page Uqload.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      streamUrl,
      isHls: streamUrl.includes('.m3u8'),
      originalUrl: rawUrl,
      embedUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de l'extraction Uqload : ${err.message || 'Erreur réseau'}`,
      },
      { status: 500 }
    );
  }
}
