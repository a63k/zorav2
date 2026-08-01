const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '3fd2be6f0cd70a21d37334d77d6f5f4f';
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeasonInfo[];
  original_language?: string;
  spoken_languages?: { iso_639_1: string; name: string }[];
}

export interface TMDBSeasonInfo {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
}

export interface TMDBEpisodeInfo {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export function getTMDBImageUrl(path: string | null, size: 'w500' | 'original' | 'w1280' = 'w500'): string {
  if (!path) return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export async function fetchTrending(mediaType: 'all' | 'movie' | 'tv' = 'all'): Promise<TMDBItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error('Failed to fetch trending');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB fetchTrending error:', error);
    return getFallbackMedia();
  }
}

export async function fetchPopularMovies(): Promise<TMDBItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error('Failed to fetch popular movies');
    const data = await res.json();
    return (data.results || []).map((item: any) => ({ ...item, media_type: 'movie' as const }));
  } catch (error) {
    console.error('TMDB fetchPopularMovies error:', error);
    return getFallbackMedia().filter(m => m.media_type === 'movie');
  }
}

export async function fetchPopularTVShows(): Promise<TMDBItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error('Failed to fetch popular TV');
    const data = await res.json();
    return (data.results || []).map((item: any) => ({ ...item, media_type: 'tv' as const }));
  } catch (error) {
    console.error('TMDB fetchPopularTVShows error:', error);
    return getFallbackMedia().filter(m => m.media_type === 'tv');
  }
}

export async function fetchMediaDetails(id: number | string, mediaType: 'movie' | 'tv'): Promise<TMDBItem | null> {
  try {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${mediaType} details`);
    const data = await res.json();
    return { ...data, media_type: mediaType };
  } catch (error) {
    console.error('TMDB fetchMediaDetails error:', error);
    return null;
  }
}

export async function fetchSeasonDetails(tvId: number | string, seasonNumber: number): Promise<{ episodes: TMDBEpisodeInfo[] } | null> {
  try {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=fr-FR`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch season details');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('TMDB fetchSeasonDetails error:', error);
    return null;
  }
}

export function getLanguageBadge(item: TMDBItem): 'VF' | 'VOSTFR' | 'VO' {
  const origLang = item.original_language;
  if (origLang === 'fr') return 'VF';
  const spoken = item.spoken_languages;
  if (spoken && spoken.some(l => l.iso_639_1 === 'fr')) return 'VF';
  // For popular international content, French subtitles are almost always available
  return 'VOSTFR';
}

export async function fetchFrenchContent(): Promise<TMDBItem[]> {
  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&with_original_language=fr&sort_by=popularity.desc&vote_count.gte=50`, {
        next: { revalidate: 3600 }
      }),
      fetch(`${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=fr-FR&with_original_language=fr&sort_by=popularity.desc&vote_count.gte=20`, {
        next: { revalidate: 3600 }
      }),
    ]);

    const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
    const tvData = tvRes.ok ? await tvRes.json() : { results: [] };

    const movies = (moviesData.results || []).map((item: any) => ({ ...item, media_type: 'movie' as const, original_language: 'fr' }));
    const tvShows = (tvData.results || []).map((item: any) => ({ ...item, media_type: 'tv' as const, original_language: 'fr' }));

    // Merge and sort by popularity (vote_average * vote_count approximation)
    const merged = [...movies, ...tvShows].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
    return merged.slice(0, 20);
  } catch (error) {
    console.error('TMDB fetchFrenchContent error:', error);
    return [];
  }
}

export async function searchMedia(query: string): Promise<TMDBItem[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return (data.results || []).filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
}

function getFallbackMedia(): TMDBItem[] {
  return [
    {
      id: 550,
      title: "Fight Club",
      overview: "Un employé de bureau insomniaque et un fabricant de savon insouciant forment un club de combat clandestin qui évolue vers quelque chose de beaucoup plus grand.",
      poster_path: "/pB8O2CYJjyqMjebXqW9vFhKMmK.jpg",
      backdrop_path: "/hZkgoQY85XMjCV0gTFzW3sY3vjD.jpg",
      vote_average: 8.4,
      release_date: "1999-10-15",
      media_type: "movie"
    },
    {
      id: 1399,
      name: "Game of Thrones",
      overview: "Neuf familles nobles se battent pour le contrôle des terres mythiques de Westeros, tandis qu'un ancien ennemi revient après avoir été en sommeil pendant des millénaires.",
      poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      backdrop_path: "/suopoW26UdW2zUvhYvrDGlHftvW.jpg",
      vote_average: 8.4,
      first_air_date: "2011-04-17",
      media_type: "tv"
    },
    {
      id: 157336,
      title: "Interstellar",
      overview: "Une équipe d'explorateurs voyage à travers un trou de ver dans l'espace afin de garantir la survie de l'humanité.",
      poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdrop_path: "/xJHokMbljvjADYdit5fK5VQsX2f.jpg",
      vote_average: 8.4,
      release_date: "2014-11-05",
      media_type: "movie"
    }
  ];
}
