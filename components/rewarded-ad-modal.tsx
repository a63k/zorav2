'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Lock, ShieldCheck, CheckCircle2, AlertTriangle, Crown, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { generateStreamToken } from '@/lib/stream-token';
import { getAdsterraConfig } from '@/lib/store';

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [adClickTime, setAdClickTime] = useState<number | null>(null);
  const [isWaitingForReturn, setIsWaitingForReturn] = useState(false);
  const [directLinkUrl, setDirectLinkUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setAdClickTime(null);
      setIsWaitingForReturn(false);
      return;
    }

    async function loadDirectLink() {
      const config = await getAdsterraConfig();
      if (config.directlink) {
        setDirectLinkUrl(config.directlink);
      } else {
        setDirectLinkUrl('https://www.effectivecpmnetwork.com/');
      }
    }
    loadDirectLink();
  }, [isOpen]);

  // Tab Return Listener (Handles 5-second minimum stay verification)
  useEffect(() => {
    if (!isOpen || !isWaitingForReturn || !adClickTime) return;

    const handleReturn = () => {
      if (document.hidden) return;

      const elapsedMs = Date.now() - adClickTime;
      const elapsedSec = elapsedMs / 1000;

      setIsWaitingForReturn(false);
      setAdClickTime(null);

      if (elapsedSec < 5) {
        alert(
          "⚠️ Vous avez quitté la page publicitaire trop rapidement !\n\nVeuillez rester au moins 5 secondes sur la page sponsor ouverte avant de revenir sur Zora pour valider l'étape."
        );
        return;
      }

      // Valid stay (>= 5 seconds)
      if (currentStep === 1) {
        setCurrentStep(2);
      } else if (currentStep === 2) {
        setCurrentStep(3);
      }
    };

    window.addEventListener('focus', handleReturn);
    document.addEventListener('visibilitychange', handleReturn);

    return () => {
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('visibilitychange', handleReturn);
    };
  }, [isOpen, isWaitingForReturn, adClickTime, currentStep]);

  if (!isOpen) return null;

  const handleOpenAd = () => {
    const url = directLinkUrl || 'https://www.effectivecpmnetwork.com/';
    setAdClickTime(Date.now());
    setIsWaitingForReturn(true);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUnlock = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md bg-zora-card/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/60 space-y-6 overflow-hidden text-center backdrop-blur-2xl">
        
        {/* Top Glow Highlights */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-pink-600/20 rounded-full blur-3xl" />

        {/* Megaphone Header Badge */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3">
            {currentStep === 3 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
            ) : (
              <Megaphone className="w-8 h-8 text-purple-400" />
            )}
          </div>

          <h3 className="text-xl font-black text-white tracking-wide">
            {currentStep === 1 && 'Pub 1 sur 2'}
            {currentStep === 2 && 'Pub 2 sur 2'}
            {currentStep === 3 && 'Pass Débloqué !'}
          </h3>

          {title && (
            <p className="text-xs text-purple-300 font-semibold mt-1 line-clamp-1">
              {title} {episodeLabel && `(${episodeLabel})`}
            </p>
          )}
        </div>

        {/* 2-Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              currentStep >= 1 ? 'bg-zora-gradient shadow-sm shadow-purple-500/50' : 'bg-white/10'
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              currentStep >= 2 ? 'bg-zora-gradient shadow-sm shadow-purple-500/50' : 'bg-white/10'
            }`}
          />
        </div>

        {/* Description Text */}
        <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
          Zora est entièrement gratuit et le restera. Pour que le site continue d'exister, merci d'accéder au sponsor ci-dessous. C'est grâce à vous qu'on peut continuer à proposer du contenu de qualité.
        </p>

        {/* Warning Box */}
        {currentStep < 3 && (
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300 text-left flex items-start gap-2.5 shadow-inner">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold block mb-0.5">Instruction importante :</span>
              Restez au moins 5 secondes sur l'onglet sponsor ouvert, puis fermez-le et revenez ici pour valider l'étape.
            </div>
          </div>
        )}

        {/* Action Button Section */}
        <div className="space-y-3 pt-2">
          {currentStep === 1 && (
            <button
              onClick={handleOpenAd}
              className="w-full py-3.5 px-4 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              {isWaitingForReturn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>En attente de retour (rester 5s)...</span>
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  <span>Regarder la pub 1/2</span>
                </>
              )}
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleOpenAd}
              className="w-full py-3.5 px-4 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              {isWaitingForReturn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>En attente de retour (rester 5s)...</span>
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  <span>Regarder la pub 2/2</span>
                </>
              )}
            </button>
          )}

          {currentStep === 3 && (
            <button
              onClick={handleUnlock}
              className="w-full py-4 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-xl shadow-emerald-500/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] animate-bounce"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Accéder à la vidéo maintenant</span>
            </button>
          )}

          {/* Zora VIP Option Box */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-gray-300">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Marre des pubs ? Passez à zéro pub avec Zora VIP</span>
          </div>
        </div>

        {/* Subtitle Footer */}
        <p className="text-[11px] text-gray-400 pt-1">
          2 pubs par vidéo — aucune coupure pendant le visionnage.
        </p>

      </div>
    </div>
  );
}

