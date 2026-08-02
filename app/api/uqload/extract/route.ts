import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts Uqload file code from various link/iframe formats:
 * - <iframe src="https://uqload.is/e/yy70z5uh9jeg?..." ...>
 * - https://uqload.is/e/yy70z5uh9jeg
 * - https://uqload.is/embed-yy70z5uh9jeg.html
 * - https://uqload.is/yy70z5uh9jeg.html
 */
function extractFileCode(rawInput: string): string | null {
  let text = rawInput.trim();

  // If full HTML iframe tag is passed, extract src URL first
  const iframeMatch = text.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
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
  const formData = new URLSearchParams({
    op: 'embed',
    file_code: fileCode,
    auto: '1',
    referer: '',
  });

  const response = await fetch(dlUrl, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://uqload.is/e/${fileCode}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
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
  const evalMatch = html.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]*?)'\.split\('\|'\)\)\)/);

  if (evalMatch) {
    const [, , , , kStr] = evalMatch;
    const k = kStr.split('|');

    const serverWord = k.find((x) => x.startsWith('strm')) || 'strm4';
    const hlsWord = k.find((x) => x.startsWith('hls')) || 'hls2';
    const fileIdL = k.find((x) => x.includes('_l')) || '';
    const tokenT = k.find((x) => x.length > 25 && !x.startsWith('http')) || '';
    const paramS = k.find((x) => x.length === 10 && !isNaN(Number(x)) && Number(x) > 1600000000) || '';
    const paramE = k.find((x) => x === '43200') || '43200';
    const paramV = k.find((x) => x.length === 6 && !isNaN(Number(x))) || '185745';
    const folder1 = k.find((x) => x.length === 2 && !isNaN(Number(x))) || '02';
    const folder2 = k.find((x) => x.length === 5 && !isNaN(Number(x))) || '';

    if (serverWord && fileIdL && tokenT && paramS) {
      const constructed = `https://${serverWord}.uqload.is/${hlsWord}/${folder1}/${folder2}/${fileIdL}/master.m3u8?t=${tokenT}&s=${paramS}&e=${paramE}&v=${paramV}&i=0.0&sp=0&fr=${fileCode}`;
      return constructed;
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
      { success: false, error: 'Paramètre "url" requis (ex: /api/uqload/extract?url=https://uqload.is/e/xxx)' },
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

async function processExtraction(rawUrl: string) {
  // If the raw input is already a direct master.m3u8 or mp4 stream, return it directly!
  if (rawUrl.includes('.m3u8') || (rawUrl.includes('.mp4') && !rawUrl.includes('player_blank'))) {
    return NextResponse.json({
      success: true,
      streamUrl: rawUrl,
      isHls: rawUrl.includes('.m3u8'),
      originalUrl: rawUrl,
    });
  }

  const fileCode = extractFileCode(rawUrl);

  if (!fileCode) {
    return NextResponse.json(
      { success: false, error: 'Code de fichier Uqload introuvable dans le lien fourni.' },
      { status: 400 }
    );
  }

  try {
    const streamUrl = await fetchAndExtractFromUqload(fileCode);

    if (!streamUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le fichier Uqload a expiré ou le flux vidéo est introuvable.',
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
        error: `Erreur lors de l'extraction Uqload : ${err.message || 'Erreur réseau'}`,
      },
      { status: 500 }
    );
  }
}
