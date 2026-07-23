'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchMediaDetails, fetchSeasonDetails, TMDBItem, TMDBEpisodeInfo, getTMDBImageUrl } from '@/lib/tmdb';
import { getMediaLink } from '@/lib/store';
import { getWatchHistory, saveWatchProgress } from '@/lib/history';
import VideoPlayer from '@/components/video-player';
import AdsterraAd from '@/components/adsterra-ad';
import { Star, Calendar, Film, Tv, Play, ChevronRight, Info, Layers } from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const mediaType = (params.type as 'movie' | 'tv') || 'movie';
  const tmdbId = Number(params.id);

  const [media, setMedia] = useState<TMDBItem | null>(null);
  const [loading, setLoading] = useState(true);

  // TV Series states
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisodeInfo[]>([]);
  const [mp4Url, setMp4Url] = useState<string | null>(null);

  // Fetch TMDB media details
  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      const data = await fetchMediaDetails(tmdbId, mediaType);
      setMedia(data);
      setLoading(false);
    }
    if (tmdbId) loadDetails();
  }, [tmdbId, mediaType]);

  // Auto register media in watch history when opened
  useEffect(() => {
    if (media) {
      const rawTitle = media.title || media.name || 'Titre inconnu';
      const s = selectedSeason || 1;
      const e = selectedEpisode || 1;
      const targetId = `${tmdbId}_${mediaType}_${mediaType === 'tv' ? `${s}_${e}` : '0'}`;
      const allHistory = getWatchHistory();
      const existing = allHistory.find((h) => h.id === targetId);

      saveWatchProgress({
        tmdbId,
        mediaType,
        season: mediaType === 'tv' ? s : null,
        episode: mediaType === 'tv' ? e : null,
        title: rawTitle,
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
        currentTime: existing ? existing.currentTime : 0,
        duration: existing && existing.duration > 0 ? existing.duration : 100,
      });
    }
  }, [media, tmdbId, mediaType, selectedSeason, selectedEpisode]);

  // Fetch episodes when TV season changes
  useEffect(() => {
    async function loadSeason() {
      if (mediaType === 'tv' && tmdbId) {
        const seasonData = await fetchSeasonDetails(tmdbId, selectedSeason);
        if (seasonData && seasonData.episodes) {
          setEpisodes(seasonData.episodes);
        } else {
          setEpisodes([]);
        }
      }
    }
    loadSeason();
  }, [tmdbId, mediaType, selectedSeason]);

  // Fetch hosted MP4 stream link from store/Supabase for this target
  useEffect(() => {
    async function checkStream() {
      const link = await getMediaLink(
        tmdbId,
        mediaType,
        mediaType === 'tv' ? selectedSeason : null,
        mediaType === 'tv' ? selectedEpisode : null
      );
      if (link && link.mp4_url) {
        setMp4Url(link.mp4_url);
      } else {
        setMp4Url(null);
      }
    }
    if (tmdbId) checkStream();
  }, [tmdbId, mediaType, selectedSeason, selectedEpisode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-sm text-gray-400">Chargement des données TMDB...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Titre introuvable</h2>
        <p className="text-sm text-gray-400">Impossible d'obtenir les détails pour cet identifiant TMDB ({tmdbId}).</p>
      </div>
    );
  }

  const title = media.title || media.name || 'Titre inconnu';
  const date = media.release_date || media.first_air_date;
  const year = date ? date.split('-')[0] : '';
  const totalSeasons = media.number_of_seasons || 1;

  return (
    <div className="py-6 space-y-8">
      
      {/* Top Banner Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Main Player & Stream Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              {title}
              {mediaType === 'tv' && (
                <span className="text-sm font-semibold text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
                  Saison {selectedSeason} - Épisode {selectedEpisode}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Video Player */}
        <VideoPlayer
          tmdbId={tmdbId}
          mediaType={mediaType}
          season={mediaType === 'tv' ? selectedSeason : null}
          episode={mediaType === 'tv' ? selectedEpisode : null}
          title={title}
          mp4Url={mp4Url}
          posterPath={media.poster_path}
          backdropPath={media.backdrop_path}
        />
      </div>

      {/* TV Series Season & Episode Picker Grid */}
      {mediaType === 'tv' && (
        <div className="bg-zora-card border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Saisons & Épisodes
            </h3>

            {/* Season Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((seasonNum) => (
                <button
                  key={seasonNum}
                  onClick={() => {
                    setSelectedSeason(seasonNum);
                    setSelectedEpisode(1);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedSeason === seasonNum
                      ? 'bg-zora-gradient text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Saison {seasonNum}
                </button>
              ))}
            </div>
          </div>

          {/* Episodes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {episodes.length > 0 ? (
              episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEpisode(ep.episode_number)}
                  className={`p-3 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                    selectedEpisode === ep.episode_number
                      ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/50'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-purple-300">
                      Épisode {ep.episode_number}
                    </span>
                    <Play className={`w-3.5 h-3.5 ${selectedEpisode === ep.episode_number ? 'text-purple-400 fill-purple-400' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                  <span className="text-[11px] text-gray-300 font-medium line-clamp-1">
                    {ep.name || `Épisode ${ep.episode_number}`}
                  </span>
                </button>
              ))
            ) : (
              /* Fallback default episode pills if season details loading */
              Array.from({ length: 12 }, (_, i) => i + 1).map((epNum) => (
                <button
                  key={epNum}
                  onClick={() => setSelectedEpisode(epNum)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedEpisode === epNum
                      ? 'bg-purple-950/60 border-purple-500'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-bold text-white">Épisode {epNum}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Details & Ad Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Media Details */}
        <div className="lg:col-span-2 bg-zora-card border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            
            {/* Poster */}
            <div className="w-36 h-52 rounded-2xl overflow-hidden bg-gray-900 flex-shrink-0 border border-white/10 shadow-xl">
              <img
                src={getTMDBImageUrl(media.poster_path, 'w500')}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-2xl font-black text-white">{title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="uppercase font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {mediaType === 'movie' ? 'Film' : 'Série TV'}
                  </span>
                  {year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {year}
                    </span>
                  )}
                  {media.vote_average > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {media.vote_average.toFixed(1)} / 10
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Synopsis</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {media.overview || "Aucune description disponible pour ce titre."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Adsterra Sidebar Ad */}
        <div className="space-y-6">
          <div className="bg-zora-card border border-white/10 rounded-3xl p-6 text-center">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Sponsor Officiel</h4>
            <AdsterraAd type="banner_300x250" />
          </div>
        </div>

      </div>

    </div>
  );
}
