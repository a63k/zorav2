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

    const [remoteVideos, collections] = await Promise.all([
      bunny.listLibraryVideos(),
      bunny.listCollections(),
    ]);

    if (!remoteVideos || remoteVideos.length === 0) {
      return NextResponse.json(
        { message: 'Aucune vidéo trouvée dans votre bibliothèque Bunny Stream.', syncedCount: 0, videos: [] }
      );
    }

    const collectionsMap = new Map<string, string>();
    (collections || []).forEach((c) => collectionsMap.set(c.guid, c.name));

    // Get all already imported links in Zora database/store
    const existingLinks = await getAllMediaLinks();

    // Categorize videos into Movies (Collection 'Films') and Series Episodes (Collection = Series Name)
    const unimportedVideos = remoteVideos
      .map((vid) => {
        const title = vid.title || '';
        const collectionName = vid.collectionId ? collectionsMap.get(vid.collectionId) || '' : '';
        const isFilmsCollection = collectionName.toLowerCase() === 'films';

        const SXXEXX_MATCH = title.match(/\bS(\d{1,2})[_.\s]?E(\d{1,3})\b/i);

        let mediaType: 'movie' | 'tv' = 'movie';
        let seriesTitle: string | undefined = undefined;
        let seasonNumber: number | undefined = undefined;
        let episodeNumber: number | undefined = undefined;

        // If video belongs to a Series Collection (NOT 'Films') or title has s1_e1 episode format:
        if (!isFilmsCollection && (collectionName || SXXEXX_MATCH)) {
          mediaType = 'tv';
          seriesTitle = collectionName || title.replace(/\bS\d{1,2}[_.\s]?E\d{1,3}\b/i, '').trim();
          if (SXXEXX_MATCH) {
            seasonNumber = parseInt(SXXEXX_MATCH[1], 10);
            episodeNumber = parseInt(SXXEXX_MATCH[2], 10);
          } else {
            seasonNumber = 1;
            episodeNumber = 1;
          }
        }

        // Check if video is already imported in Zora
        const isAlreadyImported = existingLinks.some((link) => {
          if (link.mp4_url && link.mp4_url.includes(vid.guid)) return true;
          if ((link as any).bunny_video_id === vid.guid) return true;
          if (mediaType === 'tv' && seriesTitle && seasonNumber && episodeNumber) {
            return (
              link.media_type === 'tv' &&
              link.season_number === seasonNumber &&
              link.episode_number === episodeNumber &&
              link.title?.toLowerCase().includes(seriesTitle.toLowerCase())
            );
          }
          return false;
        });

        if (isAlreadyImported) return null;

        return {
          filename: mediaType === 'tv' && seriesTitle
            ? `${seriesTitle} - S${seasonNumber}E${episodeNumber}`
            : title || `BunnyVideo_${vid.guid}.mp4`,
          fileSize: 0,
          guid: vid.guid,
          mediaType,
          seriesTitle,
          seasonNumber,
          episodeNumber,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    if (unimportedVideos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Toutes les vidéos de votre bibliothèque Bunny Stream sont déjà importées dans Zora !',
        syncedCount: 0,
        videos: [],
      });
    }

    return NextResponse.json({
      success: true,
      message: `${unimportedVideos.length} nouvelle(s) vidéo(s) Bunny Stream prête(s) à être synchronisée(s) !`,
      syncedCount: unimportedVideos.length,
      videos: unimportedVideos,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
