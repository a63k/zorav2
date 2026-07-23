export interface WatchHistoryItem {
  id: string; // unique identifier: tmdbId_mediaType_season_episode
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: string;
}

const STORAGE_KEY = 'zora_watch_history_v1';

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getUnfinishedWatchHistory(): WatchHistoryItem[] {
  const all = getWatchHistory();
  // Filter items where percentage is less than 95% (not finished)
  return all.filter((item) => item.percentage < 95);
}

export function saveWatchProgress(item: {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  currentTime: number;
  duration: number;
}): WatchHistoryItem {
  const history = getWatchHistory();
  const s = item.season ?? 1;
  const e = item.episode ?? 1;
  const id = `${item.tmdbId}_${item.mediaType}_${item.mediaType === 'tv' ? `${s}_${e}` : '0'}`;

  const percentage = item.duration > 0 ? Math.min(100, Math.round((item.currentTime / item.duration) * 100)) : 0;

  const newItem: WatchHistoryItem = {
    id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    season: item.mediaType === 'tv' ? s : null,
    episode: item.mediaType === 'tv' ? e : null,
    title: item.title,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    currentTime: Math.round(item.currentTime),
    duration: Math.round(item.duration),
    percentage,
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = history.findIndex((h) => h.id === id);
  if (existingIdx >= 0) {
    history[existingIdx] = newItem;
  } else {
    history.unshift(newItem);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('zora_history_updated'));
  }

  return newItem;
}

export function removeFromWatchHistory(id: string) {
  const history = getWatchHistory();
  const updated = history.filter((h) => h.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('zora_history_updated'));
  }
}

export function clearWatchHistory() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('zora_history_updated'));
  }
}
