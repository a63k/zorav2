'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lock, ShieldAlert, Sparkles, FastForward } from 'lucide-react';
import { verifyStreamToken } from '@/lib/stream-token';
import { saveWatchProgress } from '@/lib/history';
import RewardedAdModal from './rewarded-ad-modal';

interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export default function VideoPlayer({
  tmdbId,
  mediaType,
  season,
  episode,
  title,
  posterPath,
  backdropPath,
  onNextEpisode,
  hasNextEpisode,
}: VideoPlayerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Generate the embed URL using our local proxy (/embed/ → vidsrc-embed.ru)
  // ds_lang=fr → French subtitles by default
  const embedUrl = useMemo(() => {
    const base = '/embed';
    if (mediaType === 'movie') {
      return `${base}/movie?tmdb=${tmdbId}&ds_lang=fr&autoplay=1`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      return `${base}/tv?tmdb=${tmdbId}&season=${s}&episode=${e}&ds_lang=fr&autoplay=1&autonext=1`;
    }
  }, [tmdbId, mediaType, season, episode]);

  // Listen to postMessage events from the iframe player for progress & events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        let data = event.data;
        if (typeof data === 'string') {
          if (data.startsWith('{') || data.startsWith('[')) {
            data = JSON.parse(data);
          } else {
            return;
          }
        }
        
        const curr = 
          data.currentTime ?? 
          data.detail?.currentTime ?? 
          data.data?.currentTime ?? 
          data.value?.currentTime ??
          data.time ?? 
          data.seconds;

        const dur = 
          data.duration ?? 
          data.detail?.duration ?? 
          data.data?.duration ?? 
          data.value?.duration ??
          data.totalTime;

        if (typeof curr === 'number' && !isNaN(curr)) {
          setCurrentTime(curr);
        }
        if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }

        if (typeof curr === 'number' && typeof dur === 'number' && dur > 5) {
          if (Math.abs(curr - lastSaveTimeRef.current) >= 3) {
            lastSaveTimeRef.current = curr;
            saveWatchProgress({
              tmdbId,
              mediaType,
              season,
              episode,
              title,
              posterPath,
              backdropPath,
              currentTime: curr,
              duration: dur,
            });
          }
        }

        const evt = data.event || data.type || data.action;
        if (evt === 'ended' || (typeof dur === 'number' && typeof curr === 'number' && dur > 10 && curr >= dur - 1)) {
          if (onNextEpisode && hasNextEpisode) {
            onNextEpisode();
          }
        }
      } catch (err) {
        // Ignore unparseable non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, season, episode, title, posterPath, backdropPath, onNextEpisode, hasNextEpisode]);

  // Check saved session token on load or when season/episode changes
  useEffect(() => {
    const storageKey = `zora_token_${tmdbId}_${mediaType}_${season || 1}_${episode || 1}`;
    const savedToken = sessionStorage.getItem(storageKey);
    
    if (savedToken) {
      const isValid = verifyStreamToken(savedToken, { tmdbId, mediaType, season, episode });
      if (isValid) {
        setToken(savedToken);
        setIsUnlocked(true);
        return;
      }
    }

    setToken(null);
    setIsUnlocked(false);
  }, [tmdbId, mediaType, season, episode]);

  const handleUnlocked = (newToken: string) => {
    const storageKey = `zora_token_${tmdbId}_${mediaType}_${season || 1}_${episode || 1}`;
    sessionStorage.setItem(storageKey, newToken);
    setToken(newToken);
    setIsUnlocked(true);
    setShowAdModal(false);
  };

  const remainingTime = duration > 0 ? duration - currentTime : 0;
  // Button displays automatically during last 36 seconds or on hover when next episode exists
  const isNearEnd = duration > 0 ? (remainingTime <= 36 && remainingTime >= 0) : false;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
      
      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        isOpen={showAdModal}
        tmdbId={tmdbId}
        mediaType={mediaType}
        season={season}
        episode={episode}
        title={title}
        onUnlocked={handleUnlocked}
      />

      {/* Locked Overlay Screen if Token not present or invalid */}
      {!isUnlocked ? (
        <div className="relative w-full aspect-video bg-zora-dark flex flex-col items-center justify-center p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-zora-gradient p-0.5 shadow-2xl shadow-purple-500/40 animate-pulse">
            <div className="w-full h-full bg-zora-bg rounded-[22px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="space-y-1 max-w-md">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Protection Rewarded Ad Zora
            </span>
            <h3 className="text-xl font-black text-white">Lecture Déverrouillée</h3>
            <p className="text-xs text-gray-400">
              Ce contenu nécessite de compléter une publicité Rewarded pour débloquer le lecteur vidéo et obtenir votre clé d'accès unique.
            </p>
          </div>

          <button
            onClick={() => setShowAdModal(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Débloquer le Lecteur HD</span>
          </button>
        </div>
      ) : (
        /* Vidsrc Embed Player via local proxy (/embed/ → vidsrc-embed.ru) */
        <div ref={containerRef} className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group/player">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
          />

          {/* Floating "Prochain Épisode" Button (Displays automatically at <= 36s remaining or on hover) */}
          {hasNextEpisode && onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className={`absolute bottom-6 right-6 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 ${
                isNearEnd
                  ? 'opacity-100 animate-pulse scale-105'
                  : 'opacity-0 group-hover/player:opacity-100'
              }`}
              title="Passer à l'épisode suivant"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Prochain épisode</span>
              </div>
              {isNearEnd && remainingTime > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-purple-200 border border-white/10">
                  {Math.ceil(remainingTime)}s
                </span>
              )}
              <FastForward className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      )}

    </div>
  );
}
