import { TMDBItem } from '@/lib/tmdb';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '3fd2be6f0cd70a21d37334d77d6f5f4f';
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export interface TMDbMatchResult {
  item: TMDBItem;
  score: number; // 0 to 100
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface SmartMatchResponse {
  queryTitle: string;
  mediaType: 'movie' | 'tv';
  bestMatch?: TMDbMatchResult;
  candidates: TMDbMatchResult[];
  requiresManualReview: boolean;
}

// Levenshtein distance string similarity score (0.0 to 1.0)
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1.0 - distance / maxLen;
}

export async function matchTMDbItem(
  title: string,
  mediaType: 'movie' | 'tv',
  year?: number
): Promise<SmartMatchResponse> {
  const searchEndpoint = `${BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(
    title
  )}${year ? `&year=${year}` : ''}`;

  try {
    const res = await fetch(searchEndpoint);
    if (!res.ok) {
      throw new Error(`TMDb API search failed with status ${res.status}`);
    }

    const data = await res.json();
    const rawResults: any[] = data.results || [];

    const candidates: TMDbMatchResult[] = rawResults.map((item) => {
      const itemTitle = item.title || item.name || '';
      const itemReleaseDate = item.release_date || item.first_air_date || '';
      const itemYear = itemReleaseDate ? parseInt(itemReleaseDate.substring(0, 4), 10) : undefined;

      const reasons: string[] = [];

      // 1. Title Similarity (0 - 60 points)
      const titleSim = calculateStringSimilarity(title, itemTitle);
      let score = titleSim * 60;
      reasons.push(`Title match: ${Math.round(titleSim * 100)}%`);

      // 2. Year Match (0 - 25 points)
      if (year && itemYear) {
        const yearDiff = Math.abs(year - itemYear);
        if (yearDiff === 0) {
          score += 25;
          reasons.push('Exact release year match (+25)');
        } else if (yearDiff === 1) {
          score += 12;
          reasons.push('Release year off by 1 (+12)');
        }
      } else {
        score += 10; // Neutral bonus if no year passed
      }

      // 3. Popularity & Rating Bonus (0 - 15 points)
      const popBonus = Math.min((item.popularity || 0) / 10, 10);
      const ratingBonus = Math.min((item.vote_average || 0) / 2, 5);
      score += popBonus + ratingBonus;
      reasons.push(`Popularity & rating bonus (+${Math.round(popBonus + ratingBonus)})`);

      const finalScore = Math.min(Math.round(score), 100);
      const confidence = finalScore >= 90 ? 'high' : finalScore >= 70 ? 'medium' : 'low';

      const tmdbItem: TMDBItem = {
        id: item.id,
        title: item.title,
        name: item.name,
        overview: item.overview || '',
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        vote_average: item.vote_average || 0,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        media_type: mediaType,
      };

      return {
        item: tmdbItem,
        score: finalScore,
        confidence,
        reasons,
      };
    });

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const bestMatch = candidates.length > 0 ? candidates[0] : undefined;
    const requiresManualReview = !bestMatch || bestMatch.score < 90;

    return {
      queryTitle: title,
      mediaType,
      bestMatch,
      candidates: candidates.slice(0, 5),
      requiresManualReview,
    };
  } catch (error) {
    console.error('TMDb Matcher Error:', error);
    return {
      queryTitle: title,
      mediaType,
      candidates: [],
      requiresManualReview: true,
    };
  }
}
