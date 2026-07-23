import { MediaLink, AdsterraConfig, supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'zora_media_links_v1';

// Initial high quality sample streams for testing out of the box
const INITIAL_DEMO_LINKS: MediaLink[] = [
  {
    id: 'demo-1',
    tmdb_id: 550,
    media_type: 'movie',
    title: 'Fight Club',
    mp4_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster_path: '/pB8O2CYJjyqMjebXqW9vFhKMmK.jpg',
    backdrop_path: '/hZkgoQY85XMjCV0gTFzW3sY3vjD.jpg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    tmdb_id: 1399,
    media_type: 'tv',
    season_number: 1,
    episode_number: 1,
    title: 'Game of Thrones - S1E1',
    mp4_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    backdrop_path: '/suopoW26UdW2zUvhYvrDGlHftvW.jpg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    tmdb_id: 157336,
    media_type: 'movie',
    title: 'Interstellar',
    mp4_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsX2f.jpg',
    created_at: new Date().toISOString()
  }
];

function isRealSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && url.startsWith('https://') && !url.includes('your-project-id') && !url.includes('demo-zora-project'));
}

export async function getAllMediaLinks(): Promise<MediaLink[]> {
  let dbLinks: MediaLink[] = [];
  let isDbSuccess = false;

  // 1. Try fetching from Supabase database
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('media_links').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('⚠️ Supabase media_links query error:', error.message, error.hint || '');
      } else if (data) {
        dbLinks = data;
        isDbSuccess = true;
      }
    } catch (err) {
      console.error('⚠️ Supabase fetch exception:', err);
    }
  }

  // 2. Load fallback / cached links from localStorage
  let localLinks: MediaLink[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        localLinks = JSON.parse(raw);
      }
    } catch (e) {
      localLinks = [];
    }
  }

  // 3. Return database links if available, merged with any local links
  if (isDbSuccess && dbLinks.length > 0) {
    // Merge local links that might not be in dbLinks yet
    const dbMap = new Set(dbLinks.map(l => `${l.tmdb_id}_${l.media_type}_${l.season_number || 1}_${l.episode_number || 1}`));
    const uniqueLocal = localLinks.filter(l => !dbMap.has(`${l.tmdb_id}_${l.media_type}_${l.season_number || 1}_${l.episode_number || 1}`));
    return [...dbLinks, ...uniqueLocal];
  }

  if (localLinks.length > 0) {
    return localLinks;
  }

  // Seed default demo links if empty
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_LINKS));
    } catch (e) {}
  }
  return INITIAL_DEMO_LINKS;
}

export async function getMediaLink(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season?: number | null,
  episode?: number | null
): Promise<MediaLink | null> {
  const links = await getAllMediaLinks();

  return links.find(item => {
    if (item.tmdb_id !== Number(tmdbId) || item.media_type !== mediaType) {
      return false;
    }
    if (mediaType === 'tv') {
      const s = season ?? 1;
      const e = episode ?? 1;
      return (item.season_number ?? 1) === Number(s) && (item.episode_number ?? 1) === Number(e);
    }
    return true;
  }) || null;
}

export async function saveMediaLink(link: Omit<MediaLink, 'id' | 'created_at'>): Promise<MediaLink> {
  const newEntry: MediaLink = {
    ...link,
    season_number: link.media_type === 'tv' ? (link.season_number || 1) : null,
    episode_number: link.media_type === 'tv' ? (link.episode_number || 1) : null,
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save to Supabase if real project URL configured
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('media_links').upsert(
        {
          tmdb_id: newEntry.tmdb_id,
          media_type: newEntry.media_type,
          season_number: newEntry.season_number,
          episode_number: newEntry.episode_number,
          title: newEntry.title,
          poster_path: newEntry.poster_path,
          backdrop_path: newEntry.backdrop_path,
          mp4_url: newEntry.mp4_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tmdb_id,media_type,season_number,episode_number' }
      ).select().single();

      if (error) {
        console.error('❌ Error saving link to Supabase:', error.message, error);
      } else if (data) {
        console.log('✅ Link saved to Supabase successfully:', data);
        newEntry.id = data.id;
      }
    } catch (err) {
      console.error('❌ Supabase save exception:', err);
    }
  }

  // 2. Always sync with LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const links = await getAllMediaLinks();
      const existingIdx = links.findIndex(item => 
        item.tmdb_id === newEntry.tmdb_id &&
        item.media_type === newEntry.media_type &&
        (newEntry.media_type === 'movie' || (item.season_number === newEntry.season_number && item.episode_number === newEntry.episode_number))
      );

      if (existingIdx >= 0) {
        links[existingIdx] = { ...links[existingIdx], ...newEntry };
      } else {
        links.unshift(newEntry);
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  return newEntry;
}

export async function deleteMediaLink(id: string): Promise<boolean> {
  if (isRealSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('media_links').delete().eq('id', id);
      if (error) {
        console.error('❌ Supabase delete error:', error.message);
      }
    } catch (err) {
      console.error('❌ Supabase delete exception:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const links = await getAllMediaLinks();
      const updated = links.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('LocalStorage delete error:', e);
    }
  }

  return true;
}

const ADSTERRA_STORAGE_KEY = 'zora_adsterra_config_v1';

export async function getAdsterraConfig(): Promise<AdsterraConfig> {
  // 1. Try fetching from Supabase database
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'adsterra_config')
        .single();
      
      if (!error && data && data.value) {
        return data.value as AdsterraConfig;
      }
    } catch (err) {
      console.error('⚠️ Supabase adsterra_config fetch exception:', err);
    }
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ADSTERRA_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
  }

  return {
    banner_728x90: '',
    banner_300x250: '',
    popunder: '',
    enabled: true,
  };
}

export async function saveAdsterraConfig(config: AdsterraConfig): Promise<boolean> {
  let isSaved = false;

  // 1. Save to Supabase
  if (isRealSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: 'adsterra_config',
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) {
        console.error('❌ Error saving Adsterra config to Supabase:', error.message);
      } else {
        console.log('✅ Adsterra config saved to Supabase');
        isSaved = true;
      }
    } catch (err) {
      console.error('❌ Supabase save exception for Adsterra config:', err);
    }
  }

  // 2. Always sync with LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADSTERRA_STORAGE_KEY, JSON.stringify(config));
      isSaved = true;
    } catch (e) {
      console.error('LocalStorage write error for Adsterra config:', e);
    }
  }

  return isSaved;
}

