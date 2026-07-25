'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, Film, Tv, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { ImportJob, ImportQueueService } from '@/services/queue/import-queue';
import { fetchMediaDetails, getTMDBImageUrl, TMDBItem } from '@/lib/tmdb';

interface MatchConfirmationModalProps {
  job: ImportJob | null;
  onClose: () => void;
}

export default function MatchConfirmationModal({ job, onClose }: MatchConfirmationModalProps) {
  const [manualIdInput, setManualIdInput] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [manualSearchResult, setManualSearchResult] = useState<TMDBItem | null>(null);

  if (!job || !job.parsedInfo || !job.tmdbMatchResult) return null;

  const candidates = job.tmdbMatchResult.candidates || [];
  const parsed = job.parsedInfo;

  const handleConfirmCandidate = (item: TMDBItem) => {
    ImportQueueService.manualSelectTmdb(job.id, item);
    onClose();
  };

  const handleManualSearch = async () => {
    if (!manualIdInput.trim()) return;
    setIsSearchingManual(true);
    setManualSearchResult(null);

    const data = await fetchMediaDetails(manualIdInput.trim(), parsed.mediaType);
    setIsSearchingManual(false);

    if (data && (data.title || data.name)) {
      setManualSearchResult(data);
    } else {
      alert(`Impossible de trouver un titre TMDB avec l'ID #${manualIdInput}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zora-card border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Confiance TMDB faible ({job.tmdbMatchResult.bestMatch?.score || 0}%)
            </span>
            <h3 className="text-lg font-black text-white mt-1">
              Validation Manuelle Requise
            </h3>
            <p className="text-xs text-gray-400">
              Fichier source : <code className="text-purple-300 font-mono">{job.filename}</code>
            </p>
          </div>
        </div>

        {/* Parsed File Summary */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-gray-400">Titre analysé :</span>{' '}
            <strong className="text-white">{parsed.cleanTitle}</strong>
          </div>
          {parsed.mediaType === 'tv' && (
            <div className="font-mono text-pink-400 font-bold">
              Saison {parsed.seasonNumber || 1} — Épisode {parsed.episodeNumber || 1}
            </div>
          )}
          {parsed.year && (
            <div className="text-purple-300 font-bold">Année {parsed.year}</div>
          )}
        </div>

        {/* Top Candidate Cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Candidats TMDB Suggerés ({candidates.length})
          </h4>

          {candidates.length > 0 ? (
            candidates.map((cand) => (
              <div
                key={cand.item.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all flex flex-col sm:flex-row items-center gap-4"
              >
                <div className="w-14 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                  <img
                    src={getTMDBImageUrl(cand.item.poster_path, 'w500')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h5 className="text-sm font-black text-white truncate">
                      {cand.item.title || cand.item.name}
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Score: {cand.score}%
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                    {cand.item.overview || 'Aucun résumé disponible.'}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span>Date: {cand.item.release_date || cand.item.first_air_date || 'N/A'}</span>
                    <span>Note TMDB: ⭐ {cand.item.vote_average?.toFixed(1) || 'N/A'}</span>
                    <span>TMDB ID: #{cand.item.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmCandidate(cand.item)}
                  className="px-4 py-2 rounded-xl bg-zora-gradient hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sélectionner</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">Aucun candidat automatique trouvé sur TMDB.</p>
          )}
        </div>

        {/* Manual TMDB ID Input Fallback */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Recherche Manuelle par TMDB ID
          </h4>

          <div className="flex gap-2">
            <input
              type="number"
              value={manualIdInput}
              onChange={(e) => setManualIdInput(e.target.value)}
              placeholder="Entrez le TMDB ID exact (ex: 550)"
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearchingManual}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1"
            >
              {isSearchingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Chercher'}
            </button>
          </div>

          {manualSearchResult && (
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-14 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                  <img
                    src={getTMDBImageUrl(manualSearchResult.poster_path, 'w500')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">
                    {manualSearchResult.title || manualSearchResult.name}
                  </h5>
                  <p className="text-[10px] text-purple-300">TMDB ID #{manualSearchResult.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmCandidate(manualSearchResult)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all"
              >
                Valider cet ID
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs transition-all"
          >
            Fermer sans choisir
          </button>
        </div>

      </div>
    </div>
  );
}
