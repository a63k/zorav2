import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Paramètre "url" manquant', { status: 400 });
  }

  try {
    const parsedTarget = new URL(targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://uqload.is/',
        Accept: '*/*',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Erreur proxy uqload: status ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    // If it's an m3u8 playlist, rewrite relative chunk URLs to pass through proxy
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      const text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewrittenText = text
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

          const proxyUrl = `/api/uqload/proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
          return proxyUrl;
        })
        .join('\n');

      return new NextResponse(rewrittenText, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Binary / TS segment / MP4 data streaming
    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    if (contentType) headers.set('Content-Type', contentType);
    if (targetUrl.includes('.ts')) headers.set('Content-Type', 'video/MP2T');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse(`Erreur proxy: ${err.message || 'Erreur réseau'}`, { status: 500 });
  }
}
