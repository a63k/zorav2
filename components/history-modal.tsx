'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Play, Trash2, Film, Tv, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getWatchHistory, removeFromWatchHistory, clearWatchHistory, WatchHistoryItem } from '@/lib/history';
import { getTMDBImageUrl } from '@/lib/tmdb';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  const loadHistory = () => {
    setHistory(getWatchHistory());
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }

    const handleUpdate = () => loadHistory();
    window.addEventListener('zora_history_updated', handleUpdate);
    return () => window.removeEventListener('zora_history_updated', handleUpdate);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRemove = (id: string) => {
    removeFromWatchHistory(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Voulez-vous vraiment effacer tout votre historique de lecture ?')) {
      clearWatchHistory();
      loadHistory();
    }
  };

  const formatMinSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zora-card/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl transition-all">
        
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Historique de lecture</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {history.length} visionnage{history.length > 1 ? 's' : ''}
                </span>
              </h3>
              <p className="text-xs text-gray-400">Retrouvez vos vidéos et reprenez la lecture là où vous vous étiez arrêté</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tout effacer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 max-h-[480px] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center text-gray-500">
                <Clock className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Aucun historique de lecture</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Commencez à regarder des films et séries pour retrouver automatiquement vos lectures en cours ici !
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isTV = item.mediaType === 'tv';
              const watchUrl = `/watch/${item.mediaType}/${item.tmdbId}`;
              const isFinished = item.percentage >= 92;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Media Thumbnail Poster */}
                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 relative border border-white/10">
                      <img
                        src={getTMDBImageUrl(item.posterPath || null, 'w500')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Play Icon Overlay */}
                      <Link
                        href={watchUrl}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-5 h-5 text-white fill-white" />
                      </Link>
                    </div>

                    {/* Media Infos & Progress Bar */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30">
                          {isTV ? 'Série' : 'Film'}
                        </span>
                        {isTV && item.season && item.episode && (
                          <span className="text-[10px] text-purple-300 font-semibold">
                            S{item.season} E{item.episode}
                          </span>
                        )}
                        {isFinished && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Terminé
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h4>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.max(5, item.percentage)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{formatMinSec(item.currentTime)} / {formatMinSec(item.duration)}</span>
                          <span>{item.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={watchUrl}
                      onClick={onClose}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span className="hidden sm:inline">{isFinished ? 'Revoir' : 'Reprendre'}</span>
                    </Link>

                    <button
                      onClick={() => handleRemove(item.id)}
                      title="Supprimer de l'historique"
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
