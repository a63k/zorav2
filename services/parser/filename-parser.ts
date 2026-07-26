export interface ParsedFilename {
  rawFilename: string;
  relativePath?: string;
  cleanTitle: string;
  mediaType: 'movie' | 'tv';
  year?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  resolution?: string;
  sourceQuality?: string;
  videoCodec?: string;
  audioCodec?: string;
  isProper?: boolean;
  isRemux?: boolean;
  extension?: string;
}

const RESOLUTION_REGEX = /\b(2160p|1080p|720p|480p|4k|uhd)\b/i;
const QUALITY_REGEX = /\b(bluray|bdrip|brrip|webrip|web-dl|web|hdrip|dvdrip|hdtv)\b/i;
const VIDEO_CODEC_REGEX = /\b(x264|x265|h264|h265|hevc|avc)\b/i;
const AUDIO_CODEC_REGEX = /\b(aac|dts|truehd|ac3|eac3|flac|mp3|5\.1|7\.1)\b/i;
const TAGS_REGEX = /\b(proper|repack|remux|multi|vostfr|truefrench|french|subfrench|unrated|extended|directors\.cut)\b/gi;

// TV Episode patterns
const SXXEXX_REGEX = /\bS(\d{1,2})[_.\s]?E(\d{1,3})\b/i;
const NXNN_REGEX = /\b(\d{1,2})x(\d{1,3})\b/i;
const SEASON_EPISODE_TEXT_REGEX = /\bSeason\s?(\d{1,2})\s?Episode\s?(\d{1,3})\b/i;
const ONLY_EPISODE_REGEX = /\b(?:Episode|Ep|E)\s?(\d{1,3})\b/i;
const NUMBER_FILENAME_REGEX = /^(\d{1,3})$/;

// Year pattern (1900-2099)
const YEAR_REGEX = /\b(19\d{2}|20\d{2})\b/;

// Folder pattern recognizers
const FOLDER_SEASON_REGEX = /\b(?:S|Saison|Season)\s?(\d{1,2})\b/i;

export function parseFilename(filePath: string): ParsedFilename {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/').filter(Boolean);
  const baseName = pathParts.pop() || filePath;

  // Extract extension
  const extMatch = baseName.match(/\.([a-z0-9]+)$/i);
  const extension = extMatch ? extMatch[1].toLowerCase() : undefined;
  const nameWithoutExt = extMatch ? baseName.slice(0, -extMatch[0].length) : baseName;

  let seasonNumber: number | undefined;
  let episodeNumber: number | undefined;
  let mediaType: 'movie' | 'tv' = 'movie';
  let showNameFromPath: string | undefined;

  // 1. Inspect Folder Path for 'Shows' / 'Series' vs 'Films' / 'Movies'
  const isShowFolder = pathParts.some((part) => /\b(shows|series|séries|tv)\b/i.test(part));
  const isFilmFolder = pathParts.some((part) => /\b(films|movies|cinema)\b/i.test(part));

  if (isShowFolder) {
    mediaType = 'tv';
  } else if (isFilmFolder) {
    mediaType = 'movie';
  }

  // 2. Extract Season & Show Name from Path (e.g. Shows/Breaking Bad/S1/...)
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const sMatch = part.match(FOLDER_SEASON_REGEX);
    if (sMatch) {
      mediaType = 'tv';
      seasonNumber = parseInt(sMatch[1], 10);
      // The parent folder before the season folder is typically the show name!
      if (i > 0 && !/\b(shows|series|séries|tv|films|movies)\b/i.test(pathParts[i - 1])) {
        showNameFromPath = pathParts[i - 1];
      }
    }
  }

  // 3. Detect TV show Season & Episode in Filename
  const sxxexxMatch = nameWithoutExt.match(SXXEXX_REGEX);
  const nxnnMatch = nameWithoutExt.match(NXNN_REGEX);
  const textMatch = nameWithoutExt.match(SEASON_EPISODE_TEXT_REGEX);
  const epOnlyMatch = nameWithoutExt.match(ONLY_EPISODE_REGEX);
  const numOnlyMatch = nameWithoutExt.match(NUMBER_FILENAME_REGEX);

  if (sxxexxMatch) {
    mediaType = 'tv';
    seasonNumber = parseInt(sxxexxMatch[1], 10);
    episodeNumber = parseInt(sxxexxMatch[2], 10);
  } else if (nxnnMatch) {
    mediaType = 'tv';
    seasonNumber = parseInt(nxnnMatch[1], 10);
    episodeNumber = parseInt(nxnnMatch[2], 10);
  } else if (textMatch) {
    mediaType = 'tv';
    seasonNumber = parseInt(textMatch[1], 10);
    episodeNumber = parseInt(textMatch[2], 10);
  } else if (epOnlyMatch && (mediaType === 'tv' || seasonNumber !== undefined)) {
    episodeNumber = parseInt(epOnlyMatch[1], 10);
  } else if (numOnlyMatch && (mediaType === 'tv' || seasonNumber !== undefined)) {
    episodeNumber = parseInt(numOnlyMatch[1], 10);
  }

  // 4. Extract Resolution, Quality, Codecs, Year
  const resMatch = nameWithoutExt.match(RESOLUTION_REGEX);
  const resolution = resMatch ? resMatch[1].toUpperCase() : undefined;

  const qualityMatch = nameWithoutExt.match(QUALITY_REGEX);
  const sourceQuality = qualityMatch ? qualityMatch[1].toUpperCase() : undefined;

  const vCodecMatch = nameWithoutExt.match(VIDEO_CODEC_REGEX);
  const videoCodec = vCodecMatch ? vCodecMatch[1].toUpperCase() : undefined;

  const aCodecMatch = nameWithoutExt.match(AUDIO_CODEC_REGEX);
  const audioCodec = aCodecMatch ? aCodecMatch[1].toUpperCase() : undefined;

  const yearMatch = nameWithoutExt.match(YEAR_REGEX);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  const isProper = /\b(proper|repack)\b/i.test(nameWithoutExt);
  const isRemux = /\bremux\b/i.test(nameWithoutExt);

  // 5. Clean Title Extraction
  let clean = nameWithoutExt;

  const firstCutIndex = Math.min(
    sxxexxMatch ? sxxexxMatch.index! : Infinity,
    nxnnMatch ? nxnnMatch.index! : Infinity,
    textMatch ? textMatch.index! : Infinity,
    resMatch ? resMatch.index! : Infinity,
    qualityMatch ? qualityMatch.index! : Infinity,
    vCodecMatch ? vCodecMatch.index! : Infinity,
    yearMatch && !sxxexxMatch ? yearMatch.index! : Infinity
  );

  if (firstCutIndex !== Infinity && firstCutIndex > 0) {
    clean = clean.slice(0, firstCutIndex);
  }

  clean = clean
    .replace(/[._]/g, ' ')
    .replace(/[\(\)\[\]\{\}]/g, ' ')
    .replace(TAGS_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[-–—]\s*$/, '')
    .trim();

  // If clean title is generic (e.g. "Episode 1" or empty) and we have a Show Name from Path, use Show Name!
  if ((!clean || /^(episode|ep|\d+)$/i.test(clean)) && showNameFromPath) {
    clean = showNameFromPath;
  }

  return {
    rawFilename: baseName,
    relativePath: normalizedPath,
    cleanTitle: clean || showNameFromPath || baseName,
    mediaType,
    year,
    seasonNumber: seasonNumber || (mediaType === 'tv' ? 1 : undefined),
    episodeNumber: episodeNumber || (mediaType === 'tv' ? 1 : undefined),
    resolution,
    sourceQuality,
    videoCodec,
    audioCodec,
    isProper,
    isRemux,
    extension,
  };
}
