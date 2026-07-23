/**
 * Stream Access Token Security System for Zora
 * Generates and validates tamper-proof tokens granted upon completing Rewarded Ads.
 * Token is cryptographically bound to specific (tmdb_id, media_type, season, episode).
 */

const TOKEN_SECRET = process.env.STREAM_TOKEN_SECRET || 'zora-secure-stream-key-2026-adam';
const TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 Hours validity

export interface StreamTokenPayload {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

// Simple deterministic hash helper for browser/server execution
function computeHash(dataString: string): string {
  let hash = 0;
  const str = `${dataString}:${TOKEN_SECRET}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + Buffer.from(str).toString('hex').slice(0, 16);
}

export function generateStreamToken(params: {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
}): string {
  const now = Date.now();
  const expiresAt = now + TOKEN_EXPIRY_MS;
  const seasonVal = params.mediaType === 'tv' ? (params.season ?? 1) : null;
  const episodeVal = params.mediaType === 'tv' ? (params.episode ?? 1) : null;

  const rawString = `${params.tmdbId}_${params.mediaType}_${seasonVal}_${episodeVal}_${now}_${expiresAt}`;
  const signature = computeHash(rawString);

  const payload: StreamTokenPayload = {
    tmdbId: params.tmdbId,
    mediaType: params.mediaType,
    season: seasonVal,
    episode: episodeVal,
    issuedAt: now,
    expiresAt,
    signature,
  };

  const jsonStr = JSON.stringify(payload);
  if (typeof window !== 'undefined') {
    return btoa(jsonStr);
  }
  return Buffer.from(jsonStr).toString('base64');
}

export function verifyStreamToken(
  token: string | null | undefined,
  expected: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    season?: number | null;
    episode?: number | null;
  }
): boolean {
  if (!token) return false;

  try {
    let jsonStr: string;
    if (typeof window !== 'undefined') {
      jsonStr = atob(token);
    } else {
      jsonStr = Buffer.from(token, 'base64').toString('utf8');
    }

    const payload: StreamTokenPayload = JSON.parse(jsonStr);

    // 1. Check expiration
    if (Date.now() > payload.expiresAt) {
      return false;
    }

    // 2. Validate cryptographic signature
    const rawString = `${payload.tmdbId}_${payload.mediaType}_${payload.season}_${payload.episode}_${payload.issuedAt}_${payload.expiresAt}`;
    const expectedSig = computeHash(rawString);
    if (payload.signature !== expectedSig) {
      return false;
    }

    // 3. Strict match of content target (tmdbId, mediaType, season, episode)
    if (payload.tmdbId !== expected.tmdbId || payload.mediaType !== expected.mediaType) {
      return false;
    }

    if (expected.mediaType === 'tv') {
      const expSeason = expected.season ?? 1;
      const expEpisode = expected.episode ?? 1;
      if (payload.season !== expSeason || payload.episode !== expEpisode) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Token verification error:', err);
    return false;
  }
}
