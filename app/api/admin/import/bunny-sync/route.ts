import { NextResponse } from 'next/server';
import { checkAdminAuthServer } from '@/lib/admin-auth';
import { BunnyStreamService } from '@/services/bunny/bunny-stream';
import { ImportQueueService } from '@/services/queue/import-queue';

export async function POST() {
  const isAuth = await checkAdminAuthServer();
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
        { message: 'Aucune vidéo trouvée dans votre bibliothèque Bunny Stream.', syncedCount: 0 }
      );
    }

    // Add existing Bunny Stream video titles to the import queue
    const queuedJobs = ImportQueueService.addJobs(
      remoteVideos.map((vid) => ({
        filename: vid.title || `BunnyVideo_${vid.guid}.mp4`,
        fileSize: 0,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `${queuedJobs.length} vidéo(s) Bunny Stream importée(s) et ajoutée(s) à la file d'attente !`,
      syncedCount: queuedJobs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
