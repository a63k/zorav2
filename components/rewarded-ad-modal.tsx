'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Lock, ExternalLink, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { generateStreamToken } from '@/lib/stream-token';
import AdsterraAd from './adsterra-ad';

interface RewardedAdModalProps {
  isOpen: boolean;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
  title: string;
  onUnlocked: (token: string) => void;
  onClose?: () => void;
}

export default function RewardedAdModal({
  isOpen,
  tmdbId,
  mediaType,
  season,
  episode,
  title,
  onUnlocked,
  onClose,
}: RewardedAdModalProps) {
  const [countdown, setCountdown] = useState(8);
  const [isCompleted, setIsCompleted] = useState(false);
  const [adClicked, setAdClicked] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(8);
      setIsCompleted(false);
      setAdClicked(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = () => {
    // Generate secure cryptographically signed token locked to tmdbId + mediaType + season + episode
    const token = generateStreamToken({
      tmdbId,
      mediaType,
      season,
      episode,
    });
    onUnlocked(token);
  };

  const episodeLabel = mediaType === 'tv' ? `S${season || 1} E${episode || 1}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zora-card border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 space-y-6 overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl" />

        {/* Modal Header */}
        <div className="relative flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-zora-gradient p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <div className="w-full h-full bg-zora-bg rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Pass Vidéo Requis
              </span>
              {episodeLabel && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                  {episodeLabel}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5 line-clamp-1">
              Débloquer {title}
            </h3>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-sm text-gray-300 leading-relaxed">
            Pour maintenir le service gratuit et haute vitesse, veuillez patienter durant le sponsor ou cliquer sur l'annonce ci-dessous pour débloquer immédiatement votre flux vidéo HD.
          </p>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-medium bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span>Le Pass est sécurisé et valide uniquement pour ce contenu.</span>
          </div>
        </div>

        {/* Ad Placement & Interactive Banner */}
        <div 
          onClick={() => setAdClicked(true)}
          className="relative group cursor-pointer"
        >
          <AdsterraAd type="banner_300x250" />
          <div className="absolute inset-0 bg-transparent group-hover:bg-purple-500/5 transition-colors rounded-xl flex items-end justify-center pb-2">
            <span className="text-[11px] text-purple-300 bg-black/70 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
              Cliquer pour ouvrir le partenaire Adsterra
            </span>
          </div>
        </div>

        {/* Timer / Action Area */}
        <div className="pt-2">
          {!isCompleted ? (
            <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Patientez {countdown} seconde{countdown > 1 ? 's' : ''}...</span>
              </div>
              <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zora-gradient transition-all duration-1000 ease-linear"
                  style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleUnlock}
              className="w-full py-4 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-purple-500/40 flex items-center justify-center gap-2 animate-bounce transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Accéder à la vidéo maintenant</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
