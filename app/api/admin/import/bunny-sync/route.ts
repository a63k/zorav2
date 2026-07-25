import { NextResponse } from 'next/server';
import { verifyAdminServerRequest } from '@/lib/admin-auth';
import { BunnyStreamService } from '@/services/bunny/bunny-stream';

export async function POST(req: Request) {
  const isAuth = verifyAdminServerRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const bunny = new BunnyStreamService();
    if (!bunny.isConfigured()) {
      return NextResponse.json(
        { error: 'Les identifiants Bunny Stream (BUNNY_STREAM_API_KEY / BUNNY_STREAM_LIBRARY_ID) ne sont pas configurés dans Vercel / .env.local.' },
        { status: 400 }
      );
    }

    const remoteVideos = await bunny.listLibraryVideos();
    if (!remoteVideos || remoteVideos.length === 0) {
      return NextResponse.json(
        { message: 'Aucune vidéo trouvée dans votre bibliothèque Bunny Stream.', syncedCount: 0, videos: [] }
      );
    }

    const formattedVideos = remoteVideos.map((vid) => ({
      filename: vid.title || `BunnyVideo_${vid.guid}.mp4`,
      fileSize: 0,
      guid: vid.guid,
    }));

    return NextResponse.json({
      success: true,
      message: `${formattedVideos.length} vidéo(s) Bunny Stream trouvée(s) !`,
      syncedCount: formattedVideos.length,
      videos: formattedVideos,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
