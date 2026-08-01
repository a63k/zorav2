'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchMediaDetails, fetchSeasonDetails, TMDBItem, TMDBEpisodeInfo, getTMDBImageUrl, getLanguageBadge } from '@/lib/tmdb';

import { getWatchHistory, saveWatchProgress } from '@/lib/history';
import VideoPlayer from '@/components/video-player';
import AdsterraAd from '@/components/adsterra-ad';
import {
  Star,
  Calendar,
  Film,
  Tv,
  Play,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Eye,
  EyeOff,
  Clock,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const mediaType = (params.type as 'movie' | 'tv') || 'movie';
  const tmdbId = Number(params.id);

  const [media, setMedia] = useState<TMDBItem | null>(null);
  const [loading, setLoading] = useState(true);

  // TV Series states
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisodeInfo[]>([]);


  // UI Interactive states
  const [activeTab, setActiveTab] = useState<'episodes' | 'synopsis' | 'trailer'>('synopsis');
  const [showPlayer, setShowPlayer] = useState(false);
  const [antiSpoil, setAntiSpoil] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState(142);
  const [dislikeCount, setDislikeCount] = useState(12);
  const [copiedShare, setCopiedShare] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);

  // Fetch TMDB media details
  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      const data = await fetchMediaDetails(tmdbId, mediaType);
      setMedia(data);
      if (mediaType === 'tv') {
        setActiveTab('episodes');
      } else {
        setActiveTab('synopsis');
        setShowPlayer(true); // Default show player for movies
      }
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



  const handlePlayEpisode = (epNum: number) => {
    setSelectedEpisode(epNum);
    setShowPlayer(true);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const totalSeasons = media?.number_of_seasons || 1;

  const hasNextEpisode = mediaType === 'tv' && (
    selectedEpisode < episodes.length || selectedSeason < totalSeasons
  );

  const handleNextEpisode = () => {
    if (selectedEpisode < episodes.length) {
      setSelectedEpisode((prev) => prev + 1);
    } else if (selectedSeason < totalSeasons) {
      setSelectedSeason((prev) => prev + 1);
      setSelectedEpisode(1);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const toggleLike = (type: 'like' | 'dislike') => {
    if (type === 'like') {
      if (liked === true) {
        setLiked(null);
        setLikeCount((prev) => prev - 1);
      } else {
        if (liked === false) setDislikeCount((prev) => prev - 1);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } else {
      if (liked === false) {
        setLiked(null);
        setDislikeCount((prev) => prev - 1);
      } else {
        if (liked === true) setLikeCount((prev) => prev - 1);
        setLiked(false);
        setDislikeCount((prev) => prev + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Chargement de la fiche Zora...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Titre introuvable</h2>
        <p className="text-sm text-gray-400">Impossible d'obtenir les détails pour cet identifiant TMDB ({tmdbId}).</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const title = media.title || media.name || 'Titre inconnu';
  const date = media.release_date || media.first_air_date;
  const year = date ? date.split('-')[0] : '';
  const totalEpisodes = media.number_of_episodes || (episodes.length > 0 ? episodes.length : null);

  return (
    <div className="py-4 space-y-8">
      
      {/* Top Banner Adsterra Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Nakastream-style Hero Header */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-zora-card border border-white/10 shadow-2xl p-6 sm:p-10">
        
        {/* Fullscreen Backdrop Image */}
        <div className="absolute inset-0 bg-zora-bg">
          <img
            src={getTMDBImageUrl(media.backdrop_path || media.poster_path, 'original')}
            alt={title}
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zora-dark via-zora-dark/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zora-dark via-zora-dark/80 to-transparent" />
        </div>

        <div className="relative z-10 space-y-6">
          
          {/* Top Bar: Back Button & Type Badge */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 text-white text-xs font-extrabold backdrop-blur-md transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold uppercase backdrop-blur-md">
              {mediaType === 'movie' ? (
                <>
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>FILM</span>
                </>
              ) : (
                <>
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>SÉRIE</span>
                </>
              )}
            </span>
          </div>

          {/* Title & Tagline Metadata Section */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {title}
            </h1>

            {/* Subtitle / Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 font-semibold pt-1">
              {media.vote_average > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{media.vote_average.toFixed(1)}</span>
                </div>
              )}

              {year && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{year}</span>
                </span>
              )}

              {mediaType === 'tv' && totalSeasons && (
                <span className="text-purple-300 font-bold">
                  {totalSeasons} saison{totalSeasons > 1 ? 's' : ''} {totalEpisodes ? `· ${totalEpisodes} épisodes` : ''}
                </span>
              )}

              {/* Language Badge */}
              {media && (() => {
                const badge = getLanguageBadge(media);
                if (badge === 'VF') return (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs">
                    🇫🇷 VF
                  </span>
                );
                if (badge === 'VOSTFR') return (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs">
                    VOSTFR
                  </span>
                );
                return (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 font-bold text-xs">
                    VO
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Actions Row Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setShowPlayer(true);
                setTimeout(() => {
                  playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Lecture</span>
            </button>

            {/* Like Counter */}
            <button
              onClick={() => toggleLike('like')}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                liked === true
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-gray-200 backdrop-blur-md'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{likeCount}</span>
            </button>

            {/* Dislike Counter */}
            <button
              onClick={() => toggleLike('dislike')}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                liked === false
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-gray-200 backdrop-blur-md'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{dislikeCount}</span>
            </button>

            {/* Watchlist Button */}
            <button
              onClick={() => setInWatchlist(!inWatchlist)}
              className={`p-3.5 rounded-2xl border transition-all ${
                inWatchlist
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-gray-200 backdrop-blur-md'
              }`}
              title="Ajouter à Ma Liste"
            >
              <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-gray-200 backdrop-blur-md transition-all relative"
              title="Partager le lien"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copiedShare && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold whitespace-nowrap shadow-lg">
                  Lien copié !
                </span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Video Player Section (Expands smoothly on trigger or default movie load) */}
      {showPlayer && (
        <div ref={playerRef} className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Lecteur HD Zora</span>
              {mediaType === 'tv' && (
                <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
                  Saison {selectedSeason} · Épisode {selectedEpisode}
                </span>
              )}
            </h3>
          </div>

          <VideoPlayer
            tmdbId={tmdbId}
            mediaType={mediaType}
            season={mediaType === 'tv' ? selectedSeason : null}
            episode={mediaType === 'tv' ? selectedEpisode : null}
            title={title}
            posterPath={media.poster_path}
            backdropPath={media.backdrop_path}
            onNextEpisode={hasNextEpisode ? handleNextEpisode : undefined}
            hasNextEpisode={hasNextEpisode}
          />
        </div>
      )}

      {/* Nakastream-style Content Tabs */}
      <div className="space-y-6">
        
        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-white/10 text-sm font-bold">
          {mediaType === 'tv' && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'episodes' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>Épisodes</span>
              {activeTab === 'episodes' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zora-gradient rounded-full" />
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('synopsis')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'synopsis' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>Synopsis</span>
            {activeTab === 'synopsis' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zora-gradient rounded-full" />
            )}
          </button>
        </div>

        {/* TAB CONTENT: EPISODES (For TV Series) */}
        {activeTab === 'episodes' && mediaType === 'tv' && (
          <div className="space-y-6">
            
            {/* Seasons Row & Anti-spoil Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Seasons Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((seasonNum) => (
                  <button
                    key={seasonNum}
                    onClick={() => {
                      setSelectedSeason(seasonNum);
                      setSelectedEpisode(1);
                    }}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedSeason === seasonNum
                        ? 'bg-zora-gradient text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    Saison {seasonNum}
                  </button>
                ))}
              </div>

              {/* Anti-spoil Toggle */}
              <button
                onClick={() => setAntiSpoil(!antiSpoil)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  antiSpoil
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                }`}
              >
                {antiSpoil ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>Anti-spoil {antiSpoil ? 'activé' : 'désactivé'}</span>
              </button>

            </div>

            {/* Nakastream Episode Cards List */}
            <div className="space-y-3">
              {episodes.length > 0 ? (
                episodes.map((ep) => {
                  const isSelected = selectedEpisode === ep.episode_number;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => handlePlayEpisode(ep.episode_number)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/60 shadow-xl shadow-purple-950/30'
                          : 'bg-zora-card/80 border-white/10 hover:border-purple-500/40 hover:bg-zora-card'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                        
                        {/* Episode Landscape Thumbnail */}
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border border-white/10">
                          <img
                            src={getTMDBImageUrl(ep.still_path || media.poster_path, 'w500')}
                            alt={ep.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-purple-900/30 transition-colors flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-zora-gradient p-0.5 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-purple-400">
                              E {ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}
                            </span>
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                              {ep.name || `Épisode ${ep.episode_number}`}
                            </h4>
                          </div>

                          <p className={`text-xs text-gray-400 line-clamp-2 leading-relaxed ${antiSpoil ? 'blur-sm select-none' : ''}`}>
                            {ep.overview || "Aucun synopsis disponible pour cet épisode."}
                          </p>
                        </div>

                      </div>

                      {/* Right Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayEpisode(ep.episode_number);
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-zora-gradient text-white shadow-lg shadow-purple-500/30'
                            : 'bg-white/5 hover:bg-purple-600 text-gray-300 hover:text-white border border-white/10'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Regarder</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                /* Fallback loading cards */
                <div className="p-8 text-center text-gray-400 text-xs">
                  Chargement de la liste des épisodes...
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB CONTENT: SYNOPSIS */}
        {activeTab === 'synopsis' && (
          <div className="bg-zora-card border border-white/10 rounded-3xl p-6 space-y-4 max-w-4xl">
            <h3 className="text-base font-extrabold text-white">Résumé du Titre</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {media.overview || "Aucun synopsis disponible pour ce titre."}
            </p>
          </div>
        )}

      </div>

      {/* Sidebar Sponsor Banner */}
      <div className="pt-6">
        <AdsterraAd type="native" />
      </div>

    </div>
  );
}
