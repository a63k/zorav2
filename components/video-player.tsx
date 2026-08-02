'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Lock,
  Sparkles,
  FastForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Hls from 'hls.js';
import { verifyStreamToken } from '@/lib/stream-token';
import { saveWatchProgress } from '@/lib/history';
import { getMediaLink } from '@/lib/store';
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
  customUrl?: string; // Optional direct Uqload link passed from parent
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
  customUrl,
}: VideoPlayerProps) {
  // Token & Unlock states
  const [token, setToken] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  // Uqload Extraction & Stream States
  const [uqloadInput, setUqloadInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [extractedSourceType, setExtractedSourceType] = useState<'uqload' | 'direct' | 'embed'>('embed');

  // Video Native Player States
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showLinkInputModal, setShowLinkInputModal] = useState(false);
  const [manualLinkSuccess, setManualLinkSuccess] = useState(false);

  // Generate fallback vidsrc embed URL
  const fallbackEmbedUrl = useMemo(() => {
    const base = '/embed';
    if (mediaType === 'movie') {
      return `${base}/movie?tmdb=${tmdbId}&ds_lang=fr&autoplay=1`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      return `${base}/tv?tmdb=${tmdbId}&season=${s}&episode=${e}&ds_lang=fr&autoplay=1&autonext=1`;
    }
  }, [tmdbId, mediaType, season, episode]);

  // Load configured media link or extract Uqload stream
  useEffect(() => {
    async function loadStreamSource() {
      setIsExtracting(true);
      setExtractError(null);

      let targetLink = customUrl;

      // Check if saved in local store / DB
      if (!targetLink) {
        const stored = await getMediaLink(tmdbId, mediaType, season, episode);
        if (stored && stored.mp4_url) {
          targetLink = stored.mp4_url;
        }
      }

      if (!targetLink) {
        setIsExtracting(false);
        setActiveStreamUrl(null);
        setExtractedSourceType('embed');
        return;
      }

      // Extract Uqload link or play direct stream
      try {
        const res = await fetch(`/api/uqload/extract?url=${encodeURIComponent(targetLink)}`);
        const data = await res.json();

        if (data.success && data.streamUrl) {
          setActiveStreamUrl(data.streamUrl);
          setExtractedSourceType(targetLink.includes('uqload') ? 'uqload' : 'direct');
        } else {
          // If extraction fails or target is direct MP4/stream
          if (targetLink.includes('.mp4') || targetLink.includes('.m3u8')) {
            setActiveStreamUrl(targetLink);
            setExtractedSourceType('direct');
          } else {
            setExtractError(data.error || 'Extraction du flux Uqload impossible');
            setActiveStreamUrl(null);
            setExtractedSourceType('embed');
          }
        }
      } catch (err: any) {
        setExtractError('Erreur réseau lors de la récupération du flux Uqload');
        setActiveStreamUrl(null);
        setExtractedSourceType('embed');
      } finally {
        setIsExtracting(false);
      }
    }

    loadStreamSource();
  }, [tmdbId, mediaType, season, episode, customUrl]);

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

  // Initialize HLS.js for native video player when stream URL is ready
  useEffect(() => {
    if (!activeStreamUrl || !videoRef.current || !isUnlocked) return;

    const video = videoRef.current;

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Determine stream proxy URL if it's an Uqload m3u8 stream to prevent CORS issues
    const finalStreamUrl =
      activeStreamUrl.includes('.m3u8') && activeStreamUrl.includes('uqload')
        ? `/api/uqload/proxy?url=${encodeURIComponent(activeStreamUrl)}`
        : activeStreamUrl;

    if (activeStreamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(finalStreamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support for Safari / iOS
        video.src = finalStreamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        });
      }
    } else {
      // Direct MP4 video file
      video.src = activeStreamUrl;
      video.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl, isUnlocked]);

  // Video progress & duration update handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;

    setCurrentTime(curr);
    if (dur > 0) setDuration(dur);

    // Buffer progress
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(bufferedEnd);
    }

    // Save watch history every 3 seconds
    if (dur > 5 && Math.abs(curr - lastSaveTimeRef.current) >= 3) {
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

    // Ended handler for TV autonext
    if (dur > 10 && curr >= dur - 0.5) {
      if (onNextEpisode && hasNextEpisode) {
        onNextEpisode();
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleManualExtract = async () => {
    if (!uqloadInput.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setManualLinkSuccess(false);

    try {
      const targetUrl = uqloadInput.trim();
      const res = await fetch(`/api/uqload/extract?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (data.success && data.streamUrl) {
        setActiveStreamUrl(data.streamUrl);
        setExtractedSourceType('uqload');
        setManualLinkSuccess(true);
        setShowLinkInputModal(false);

        // Auto save to local store / DB so it persists for this title
        saveMediaLink({
          tmdb_id: tmdbId,
          media_type: mediaType,
          season_number: mediaType === 'tv' ? (season || 1) : null,
          episode_number: mediaType === 'tv' ? (episode || 1) : null,
          title,
          poster_path: posterPath || null,
          backdrop_path: backdropPath || null,
          mp4_url: targetUrl,
        }).catch(() => {});
      } else {
        setExtractError(data.error || 'Erreur lors de l\'extraction du flux.');
      }
    } catch (err: any) {
      setExtractError('Erreur réseau');
    } finally {
      setIsExtracting(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingTime = duration > 0 ? duration - currentTime : 0;
  const isNearEnd = duration > 0 ? remainingTime <= 36 && remainingTime >= 0 : false;

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

      {/* Manual Link Input Modal */}
      {showLinkInputModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zora-card border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-400" />
                <span>Extraire un Lien Uqload</span>
              </h3>
              <button
                onClick={() => setShowLinkInputModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Collez un lien Uqload (ex: <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">https://uqload.is/embed-xxx.html</code>) pour lire la vidéo directement dans le lecteur Zora sans aucune publicité.
            </p>

            <div className="space-y-2">
              <input
                type="url"
                value={uqloadInput}
                onChange={(e) => setUqloadInput(e.target.value)}
                placeholder="https://uqload.is/embed-yil2pu24ols0.html"
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            {extractError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{extractError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLinkInputModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleManualExtract}
                disabled={isExtracting || !uqloadInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-zora-gradient hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-purple-500/30 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extraction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer le flux Uqload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
      ) : activeStreamUrl ? (
        /* NATIVE ZORA VIDEO PLAYER (Ad-Free Uqload Stream) */
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group/player select-none"
        >
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              if (onNextEpisode && hasNextEpisode) onNextEpisode();
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />

          {/* Top Source Badge Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/70 border border-purple-500/40 text-purple-300 text-[11px] font-extrabold backdrop-blur-md shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FLUX DIRECT UQLOAD HD · SANS PUB</span>
            </div>
            <button
              onClick={() => setShowLinkInputModal(true)}
              className="p-1.5 rounded-xl bg-black/70 border border-white/10 hover:border-purple-500 text-gray-300 hover:text-white backdrop-blur-md transition-all"
              title="Changer le lien Uqload"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Play/Pause Overlay Indicator on Video Center Click */}
          <div
            onClick={togglePlay}
            className={`absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-opacity cursor-pointer ${
              !isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
          >
            <button className="w-16 h-16 rounded-full bg-zora-gradient/90 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xl shadow-purple-600/50 border border-white/20">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white fill-white" />
              ) : (
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              )}
            </button>
          </div>

          {/* Bottom Player Custom Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-8 space-y-2 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
            {/* Timeline Seekbar */}
            <div className="relative w-full flex items-center group/seekbar">
              {/* Buffer Progress bar */}
              <div
                className="absolute left-0 h-1.5 bg-white/20 rounded-full transition-all"
                style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
              />
              {/* Played Progress bar */}
              <div
                className="absolute left-0 h-1.5 bg-zora-gradient rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer focus:outline-none z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>

            {/* Controls Buttons Row */}
            <div className="flex items-center justify-between text-white text-xs font-semibold">
              {/* Left Controls: Play, Volume, Time */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-purple-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 appearance-none rounded-full cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
                  />
                </div>

                <div className="text-[11px] font-mono text-gray-300">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Speed, Fullscreen */}
              <div className="flex items-center gap-2">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold transition-all"
                  >
                    {playbackRate}x
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-10 right-0 z-30 bg-zora-card border border-white/10 rounded-xl p-1.5 shadow-2xl space-y-1 w-24">
                      {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changeSpeed(rate)}
                          className={`w-full text-left px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                            playbackRate === rate ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Floating "Prochain Épisode" Button */}
          {hasNextEpisode && onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className={`absolute bottom-16 right-6 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 ${
                isNearEnd ? 'opacity-100 animate-pulse scale-105' : 'opacity-0 group-hover/player:opacity-100'
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
      ) : (
        /* Fallback iframe player with option to add Uqload link */
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group/player"
        >
          <iframe
            src={fallbackEmbedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
          />

          {/* Prominent Overlay Bar to Add/Load Uqload Link when fallback stream fails or is unavailable */}
          <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/80 border border-white/10 text-gray-300 text-[11px] font-bold backdrop-blur-md shadow-xl pointer-events-auto">
              <span>Lecteur Externe (Lecteur #1)</span>
            </div>

            <button
              onClick={() => setShowLinkInputModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zora-gradient text-white text-xs font-black shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all border border-white/20 pointer-events-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Charger via Uqload (Sans Pub)</span>
            </button>
          </div>

          {/* Floating "Prochain Épisode" Button */}
          {hasNextEpisode && onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className={`absolute bottom-6 right-6 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 ${
                isNearEnd ? 'opacity-100 animate-pulse scale-105' : 'opacity-0 group-hover/player:opacity-100'
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
