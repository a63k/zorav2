import { NextRequest, NextResponse } from 'next/server';

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
 * Extracts file code from Uqload links, HTML snippets, or iframe tags
 */
function extractFileCode(rawInput: string): string | null {
  let text = rawInput.trim();

  // If full HTML iframe tag is passed, extract src URL first
  const iframeMatch = text.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch && iframeMatch[1] && !iframeMatch[1].startsWith('blob:')) {
    text = iframeMatch[1];
  }

  // Look for file code patterns (8 to 16 alphanumeric characters)
  const codeMatch = text.match(/(?:\/e\/|\/embed-|\/)([a-zA-Z0-9]{8,16})(?:\.html)?/);
  if (codeMatch && codeMatch[1]) {
    const code = codeMatch[1];
    if (!['uqload', 'embed', 'watch', 'movie', 'tv'].includes(code.toLowerCase())) {
      return code;
    }
  }

  const codeSub = text.match(/(?:\/e\/|\/embed-)([a-zA-Z0-9]{8,16})/);
  if (codeSub && codeSub[1]) {
    return codeSub[1];
  }

  return null;
}

/**
 * Bulletproof extraction by making POST request to Uqload /dl endpoint
 */
async function fetchAndExtractFromUqload(fileCode: string): Promise<string | null> {
  const dlUrl = 'https://uqload.is/dl';

  const response = await fetch(dlUrl, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://uqload.is/e/${fileCode}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    body: new URLSearchParams({
      op: 'embed',
      file_code: fileCode,
      auto: '1',
      referer: '',
    }),
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const html = await response.text();

  if (html.includes('File is no longer available') || html.includes('expired or has been deleted')) {
    return null;
  }

  // 1. Check for direct master.m3u8 or mp4 in response HTML
  const m3u8Direct = html.match(/https?:\/\/[a-zA-Z0-9\.\-]*uqload\.[a-zA-Z0-9]+\/hls[0-9]*\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
  if (m3u8Direct) return m3u8Direct[0];

  const mp4Direct = html.match(/https?:\/\/[a-zA-Z0-9\.\-]*uqload\.[a-zA-Z0-9]+\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
  if (mp4Direct) return mp4Direct[0];

  // 2. Parse Dean Edwards packed script eval(function(p,a,c,k,e,d)...)
  const evalMatch = html.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\(([\s\S]*?)\)\)/);

  if (evalMatch) {
    const argsStr = evalMatch[1];
    const argsMatch = argsStr.match(/['"]([\s\S]*?)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([\s\S]*?)['"]\.split\(['"]\|['"]\)/);

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
      } catch (err) {
        // Fallback below
      }

      const serverWord = k.find((x) => x.startsWith('strm')) || 'strm4';
      const hlsWord = k.find((x) => x.startsWith('hls')) || 'hls2';
      const fileIdL = k.find((x) => x.endsWith('_l')) || `${fileCode}_l`;
      const realCode = fileIdL.replace('_l', '');

      // Search from the end of array k for the master HLS token
      const tokenT =
        k
          .slice()
          .reverse()
          .find(
            (x) =>
              x.length >= 25 &&
              !x.startsWith('http') &&
              !x.startsWith('0') &&
              !x.startsWith('1') &&
              !['fullscreenOrientationLock', 'setCurrentAudioTrack', 'playbackRateControls'].includes(x)
          ) || '';

      const paramS = k.find((x) => x.length === 10 && !isNaN(Number(x)) && Number(x) > 1600000000) || '';
      const paramE = k.find((x) => x === '43200') || '43200';
      const paramV = k.find((x) => x.length === 6 && !isNaN(Number(x))) || '185745';

      // Extract image folder path
      const imgMatch = html.match(/strm\d+\.uqload\.is\/i\/(\d+)\/(\d+)\//);
      const folder1 = imgMatch ? imgMatch[1] : (k.find((x) => x.length === 2 && !isNaN(Number(x))) || '02');
      const folder2 = imgMatch ? imgMatch[2] : (k.find((x) => x.length === 5 && !isNaN(Number(x))) || '');

      if (serverWord && fileIdL && tokenT && paramS) {
        const constructed = `https://${serverWord}.uqload.is/${hlsWord}/${folder1}/${folder2}/${fileIdL}/master.m3u8?t=${tokenT}&s=${paramS}&e=${paramE}&v=${paramV}&i=0.0&sp=0&fr=${realCode}`;
        return constructed;
      }
    }
  }

  // 3. Fallback generic match
  const genericM3u8 = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
  if (genericM3u8) return genericM3u8[0];

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'Paramètre "url" requis' },
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
      return NextResponse.json({ success: false, error: 'Propriété "url" requise dans le corps JSON' }, { status: 400 });
    }

    return processExtraction(targetUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Requête invalide' }, { status: 400 });
  }
}

async function processExtraction(rawInput: string) {
  let rawUrl = rawInput.trim();

  // If raw HTML containing an m3u8 or mp4 link was pasted directly
  const embeddedM3u8 = rawUrl.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
  if (embeddedM3u8 && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return NextResponse.json({
      success: true,
      streamUrl: embeddedM3u8[0],
      isHls: true,
      originalUrl: rawUrl,
    });
  }

  // Extract src if full HTML iframe tag was pasted
  const iframeMatch = rawUrl.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch && iframeMatch[1] && !iframeMatch[1].startsWith('blob:')) {
    rawUrl = iframeMatch[1];
  }

  // 1. Direct stream URL (.m3u8 or .mp4)
  if (rawUrl.includes('.m3u8') || (rawUrl.includes('.mp4') && !rawUrl.includes('player_blank'))) {
    return NextResponse.json({
      success: true,
      streamUrl: rawUrl,
      isHls: rawUrl.includes('.m3u8'),
      originalUrl: rawUrl,
    });
  }

  // 2. Uqload links
  const fileCode = extractFileCode(rawUrl);

  if (!fileCode) {
    return NextResponse.json(
      { success: false, error: 'Lien vidéo non reconnu (Uqload ou lien vidéo direct requis).' },
      { status: 400 }
    );
  }

  try {
    const streamUrl = await fetchAndExtractFromUqload(fileCode);

    if (!streamUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le fichier vidéo a expiré ou le flux est introuvable.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      streamUrl,
      fileCode,
      isHls: streamUrl.includes('.m3u8'),
      originalUrl: rawUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de l'extraction vidéo : ${err.message || 'Erreur réseau'}`,
      },
      { status: 500 }
    );
  }
}
