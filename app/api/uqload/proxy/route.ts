import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Paramètre "url" manquant', { status: 400 });
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Build headers to send upstream to Uqload
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://uqload.is/',
      Accept: '*/*',
    };

    // Forward Range header if requested by video player for fast seeking
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      headers: upstreamHeaders,
    });

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Erreur proxy uqload: status ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    // If it's an m3u8 playlist, rewrite all relative/absolute chunk & URI URLs to pass through proxy
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      const text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // 1. Rewrite any URI="https://..." or URI="relative.m3u8" inside tags (#EXT-X-MEDIA, #EXT-X-MAP, #EXT-X-KEY, etc.)
      let rewrittenText = text.replace(/URI=["']([^"']+)["']/gi, (match, urlAttr) => {
        let fullUrl: string;
        if (urlAttr.startsWith('http://') || urlAttr.startsWith('https://')) {
          fullUrl = urlAttr;
        } else if (urlAttr.startsWith('/')) {
          fullUrl = `${parsedTarget.protocol}//${parsedTarget.host}${urlAttr}`;
        } else {
          fullUrl = `${baseUrl}${urlAttr}`;
        }
        const proxyUrl = `/api/uqload/proxy?url=${encodeURIComponent(fullUrl)}`;
        return `URI="${proxyUrl}"`;
      });

      // 2. Rewrite non-comment segment & playlist URLs
      rewrittenText = rewrittenText
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.length === 0 || trimmed.startsWith('#')) {
            return line;
          }

          let fullSegmentUrl: string;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            fullSegmentUrl = trimmed;
          } else if (trimmed.startsWith('/')) {
            fullSegmentUrl = `${parsedTarget.protocol}//${parsedTarget.host}${trimmed}`;
          } else {
            fullSegmentUrl = `${baseUrl}${trimmed}`;
          }

          return `/api/uqload/proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
        })
        .join('\n');

      return new NextResponse(rewrittenText, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Binary / TS segment / MP4 data streaming with Range support
    const arrayBuffer = await response.arrayBuffer();
    const responseHeaders = new Headers();

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');

    if (contentType) responseHeaders.set('Content-Type', contentType);
    if (targetUrl.includes('.ts')) responseHeaders.set('Content-Type', 'video/MP2T');

    const contentLength = response.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = response.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(arrayBuffer, {
      status: response.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new NextResponse(`Erreur proxy: ${err.message || 'Erreur réseau'}`, { status: 500 });
  }
}
