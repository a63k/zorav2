import { NextResponse } from 'next/server';
import { verifyAdminServerRequest } from '@/lib/admin-auth';
import { BunnyStreamService } from '@/services/bunny/bunny-stream';
import { getAllMediaLinks } from '@/lib/store';

const IS_TV_EPISODE_REGEX = /\b(s\d{1,2}[_.\s]?e\d{1,3}|\d{1,2}x\d{1,3}|season|saison|episode|épisode)\b/i;

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

    // Get all already imported links in Zora database/store
    const existingLinks = await getAllMediaLinks();

    // 1. Filter out TV series episodes (since auto-importer is strictly for Movies)
    // 2. Filter out videos that are already imported in Zora
    const unimportedMovies = remoteVideos.filter((vid) => {
      const title = vid.title || '';

      // Filter out TV Series Episodes (s1_e1, s1_e2, S01E02, etc.)
      if (IS_TV_EPISODE_REGEX.test(title)) {
        return false;
      }

      // Filter out already imported videos by GUID or URL match
      const isAlreadyImported = existingLinks.some(
        (link) => (link.mp4_url && link.mp4_url.includes(vid.guid)) || (link as any).bunny_video_id === vid.guid
      );

      return !isAlreadyImported;
    });

    if (unimportedMovies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tous les films de votre bibliothèque Bunny Stream sont déjà importés dans Zora !',
        syncedCount: 0,
        videos: [],
      });
    }

    const formattedVideos = unimportedMovies.map((vid) => ({
      filename: vid.title || `BunnyVideo_${vid.guid}.mp4`,
      fileSize: 0,
      guid: vid.guid,
    }));

    return NextResponse.json({
      success: true,
      message: `${formattedVideos.length} nouveau(x) film(s) Bunny Stream prêt(s) à être importé(s) !`,
      syncedCount: formattedVideos.length,
      videos: formattedVideos,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
