import { saveMediaLink, getAllMediaLinks } from '@/lib/store';
import { MediaLink, supabase } from '@/lib/supabase';

export interface ImportMediaRecord {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  mp4Url: string;
  fileHash?: string;
  bunnyLibraryId?: string;
  bunnyVideoId?: string;
}

export class ImportRepositoryService {
  /**
   * Check if video with identical SHA-256 hash already exists in database
   */
  public async findByHash(fileHash: string): Promise<MediaLink | null> {
    if (!fileHash) return null;
    
    try {
      const { data, error } = await supabase
        .from('media_links')
        .select('*')
        .eq('file_hash', fileHash)
        .maybeSingle();

      if (!error && data) {
        return data as MediaLink;
      }
    } catch (e) {
      console.warn('Hash check query warning:', e);
    }
    return null;
  }

  /**
   * Upsert movie or episode stream link to DB
   */
  public async upsertMediaRecord(record: ImportMediaRecord): Promise<MediaLink> {
    const saved = await saveMediaLink({
      tmdb_id: record.tmdbId,
      media_type: record.mediaType,
      season_number: record.seasonNumber || null,
      episode_number: record.episodeNumber || null,
      title: record.title,
      poster_path: record.posterPath || null,
      backdrop_path: record.backdropPath || null,
      mp4_url: record.mp4Url,
    });

    // If fileHash or Bunny parameters exist, update record in Supabase
    if (record.fileHash || record.bunnyVideoId) {
      try {
        await supabase
          .from('media_links')
          .update({
            file_hash: record.fileHash,
            bunny_library_id: record.bunnyLibraryId,
            bunny_video_id: record.bunnyVideoId,
          })
          .eq('id', saved.id);
      } catch (e) {
        // Fallback gracefully if extra column migration is not executed yet
      }
    }

    return saved;
  }

  /**
   * Get total imported count statistics
   */
  public async getStatistics(): Promise<{ totalMovies: number; totalEpisodes: number }> {
    const all = await getAllMediaLinks();
    const totalMovies = all.filter((m) => m.media_type === 'movie').length;
    const totalEpisodes = all.filter((m) => m.media_type === 'tv').length;
    return { totalMovies, totalEpisodes };
  }
}
