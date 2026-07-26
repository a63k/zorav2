'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Lock, ShieldAlert, Sparkles, FastForward } from 'lucide-react';
import { verifyStreamToken } from '@/lib/stream-token';
import { saveWatchProgress } from '@/lib/history';
import RewardedAdModal from './rewarded-ad-modal';

interface VideoPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  title: string;
  mp4Url: string | null;
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
  mp4Url,
  posterPath,
  backdropPath,
  onNextEpisode,
  hasNextEpisode,
}: VideoPlayerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  
  // Video player controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '713081';

  // Determine stream player info (Use Bunny Stream official embed iframe to prevent 403 / 0:01 black screen)
  const streamInfo = React.useMemo(() => {
    if (!mp4Url) return { isIframe: false, iframeSrc: '', isDirectMp4: false };
    const url = mp4Url.trim();

    // Extract GUID pattern (e.g. 7085e7ec-7fb9-4ffc-a337-14ee7bcfe6ef)
    const guidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    let videoId = guidMatch ? guidMatch[1] : null;

    // 1. Bunny Mediadelivery or Pull Zone CDN -> Use Bunny Stream iframe player for reliable HD streaming
    if (url.includes('mediadelivery.net') || url.includes('b-cdn.net') || url.includes('bunnycdn.com')) {
      if (!videoId) {
        const parts = url.split('/');
        videoId = parts.find((p) => p.length >= 20 && !p.includes('.')) || null;
      }
      if (videoId) {
        return {
          isIframe: true,
          iframeSrc: `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=true`,
          isDirectMp4: false,
        };
      }
    }

    // 2. Generic external iframe embeds
    if ((url.includes('/embed/') || url.includes('embed')) && !url.includes('.mp4')) {
      const finalUrl = url.includes('?') ? `${url}&autoplay=true` : `${url}?autoplay=true`;
      return { isIframe: true, iframeSrc: finalUrl, isDirectMp4: false };
    }

    // 3. Direct Playable MP4 Video File URL
    return { isIframe: false, iframeSrc: '', isDirectMp4: true };
  }, [mp4Url, BUNNY_LIBRARY_ID]);

  const isIframeEmbed = streamInfo.isIframe;
  const iframeSrcUrl = streamInfo.iframeSrc;
  const isDirectMp4 = streamInfo.isDirectMp4;

  // Listen to postMessage events from Bunny / iframe player for progress & events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        const curr = data.currentTime ?? data.data?.currentTime ?? data.time ?? data.seconds;
        const dur = data.duration ?? data.data?.duration ?? data.totalTime;

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

        if (data.event === 'ended' || data.type === 'ended') {
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

  // Auto-start playback as soon as stream is unlocked (for direct MP4)
  useEffect(() => {
    if (isUnlocked && videoRef.current && isDirectMp4) {
      videoRef.current.load();
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy fallback
          });
      }
    }
  }, [isUnlocked, isDirectMp4, mp4Url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);
    setDuration(dur);
    setProgress((current / dur) * 100);

    // Save watch progress every 3 seconds
    if (Math.abs(current - lastSaveTimeRef.current) >= 3 && dur > 5) {
      lastSaveTimeRef.current = current;
      saveWatchProgress({
        tmdbId,
        mediaType,
        season,
        episode,
        title,
        posterPath,
        backdropPath,
        currentTime: current,
        duration: dur,
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingTime = duration > 0 ? duration - currentTime : 0;
  const isNearEnd = duration > 15 && remainingTime <= 15 && remainingTime > 0;

  if (!mp4Url) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-zora-card border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Flux MP4 non configuré</h3>
        <p className="text-xs text-gray-400 max-w-md">
          Aucun lien MP4 direct n'a encore été associé à ce titre ({title}). Vous pouvez ajouter le lien MP4 depuis le panneau d'administration <code className="text-purple-400 font-mono">/admin</code>.
        </p>
      </div>
    );
  }

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
      ) : isIframeEmbed ? (
        /* Bunny Stream Official HD Player */
        <div ref={containerRef} className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group/player">
          <iframe
            src={iframeSrcUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
          />

          {/* Floating "Prochain Épisode" Button (Overlayed on player container during last 15s) */}
          {hasNextEpisode && onNextEpisode && isNearEnd && (
            <button
              onClick={onNextEpisode}
              className="absolute bottom-6 right-6 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 animate-pulse scale-105"
              title="Passer à l'épisode suivant"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Prochain épisode</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-purple-200 border border-white/10">
                {Math.ceil(remainingTime)}s
              </span>
              <FastForward className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      ) : (
        /* Custom HTML5 Video Player (Used for Direct MP4s) */
        <div ref={containerRef} className="relative w-full aspect-video bg-black flex items-center justify-center group/player overflow-hidden">
          <video
            ref={videoRef}
            src={mp4Url}
            autoPlay
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              if (onNextEpisode && hasNextEpisode) {
                onNextEpisode();
              }
            }}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Floating "Prochain Épisode" Button */}
          {hasNextEpisode && onNextEpisode && isNearEnd && (
            <button
              onClick={onNextEpisode}
              className="absolute bottom-20 right-6 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 animate-pulse scale-105"
              title="Passer à l'épisode suivant"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Prochain épisode</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-purple-200 border border-white/10">
                {Math.ceil(remainingTime)}s
              </span>
              <FastForward className="w-4 h-4 fill-white" />
            </button>
          )}

          {/* Custom Controls Bar Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-20">
            
            {/* Progress Seek Bar */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
            />

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button onClick={toggleMute} className="text-white hover:text-purple-400 transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <div className="text-xs font-mono text-gray-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Lecteur HD Zora
                </span>
                <button onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
