'use client';

import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  Server,
  CloudUpload,
  Film,
  Tv,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ImportJob, ImportQueueService } from '@/services/queue/import-queue';
import { ImportLoggerService, LogEntry } from '@/services/logger/import-logger';
import MatchConfirmationModal from './match-confirmation-modal';

export default function ImportQueueTable() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedJobForModal, setSelectedJobForModal] = useState<ImportJob | null>(null);
  const [showConsole, setShowConsole] = useState<boolean>(true);

  useEffect(() => {
    const unsubQueue = ImportQueueService.subscribe((updatedJobs, paused) => {
      setJobs(updatedJobs);
      setIsPaused(paused);
    });

    const unsubLogger = ImportLoggerService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    return () => {
      unsubQueue();
      unsubLogger();
    };
  }, []);

  const totalCount = jobs.length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const pendingCount = jobs.filter((j) => j.status === 'pending' || j.status === 'uploading' || j.status === 'encoding').length;
  const confirmationCount = jobs.filter((j) => j.status === 'awaiting_confirmation').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Smart Confirmation Modal */}
      <MatchConfirmationModal
        job={selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
      />

      {/* Summary Statistics Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-zora-card border border-white/10 space-y-1">
          <span className="text-[10px] font-bold uppercase text-gray-400">Total Fichiers</span>
          <div className="text-xl font-black text-white">{totalCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zora-card border border-emerald-500/20 space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-400">Terminés</span>
          <div className="text-xl font-black text-emerald-400">{completedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zora-card border border-purple-500/20 space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-400">En cours / Upload</span>
          <div className="text-xl font-black text-purple-400">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zora-card border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-400">À valider</span>
          <div className="text-xl font-black text-amber-400">{confirmationCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-zora-card border border-rose-500/20 space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-400">Échoués</span>
          <div className="text-xl font-black text-rose-400">{failedCount}</div>
        </div>
      </div>

      {/* Global Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zora-card border border-white/10">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">
            File d'Attente Automatisée ({jobs.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPaused ? (
            <button
              onClick={() => ImportQueueService.resumeQueue()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Reprendre</span>
            </button>
          ) : (
            <button
              onClick={() => ImportQueueService.pauseQueue()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Mettre en pause</span>
            </button>
          )}

          {failedCount > 0 && (
            <button
              onClick={() => ImportQueueService.retryFailedJobs()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Relancer les échecs</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={() => ImportQueueService.clearCompleted()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Nettoyer les terminés</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="bg-zora-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px]">
                  <th className="py-3 px-2">Nom de fichier</th>
                  <th className="py-3 px-2">Poids</th>
                  <th className="py-3 px-2">Titre TMDB / Épisode</th>
                  <th className="py-3 px-2">Statut & Progression</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map((job) => {
                  const isConfirmationNeeded = job.status === 'awaiting_confirmation';

                  return (
                    <tr key={job.id} className="hover:bg-white/5 transition-colors">
                      {/* Filename & Info Badges */}
                      <td className="py-3 px-2 max-w-[220px]">
                        <div className="font-bold text-white truncate" title={job.filename}>
                          {job.filename.split(/[/\\]/).pop()}
                        </div>
                        {job.parsedInfo && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                              {job.parsedInfo.mediaType === 'movie' ? 'Film' : 'Série'}
                            </span>
                            {job.parsedInfo.resolution && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                {job.parsedInfo.resolution}
                              </span>
                            )}
                            {job.parsedInfo.sourceQuality && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                                {job.parsedInfo.sourceQuality}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* File Size */}
                      <td className="py-3 px-2 font-mono text-gray-400">
                        {formatBytes(job.fileSize)}
                      </td>

                      {/* TMDB Title Match */}
                      <td className="py-3 px-2 max-w-[200px]">
                        {job.selectedTmdbItem ? (
                          <div>
                            <div className="font-bold text-purple-300 truncate">
                              {job.selectedTmdbItem.title || job.selectedTmdbItem.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              TMDB ID: #{job.selectedTmdbItem.id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">En attente de résolution...</span>
                        )}
                      </td>

                      {/* Status & Progress bar */}
                      <td className="py-3 px-2 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-semibold flex items-center gap-1 ${
                                job.status === 'completed'
                                  ? 'text-emerald-400'
                                  : job.status === 'failed'
                                  ? 'text-rose-400'
                                  : job.status === 'awaiting_confirmation'
                                  ? 'text-amber-400'
                                  : 'text-purple-300'
                              }`}
                            >
                              {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                              {job.status === 'awaiting_confirmation' && <AlertTriangle className="w-3.5 h-3.5" />}
                              <span>{job.stepMessage}</span>
                            </span>
                            <span className="font-mono text-gray-400">{job.progress}%</span>
                          </div>

                          {/* Animated Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                job.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : job.status === 'failed'
                                  ? 'bg-rose-500'
                                  : job.status === 'awaiting_confirmation'
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-zora-gradient animate-pulse'
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right space-x-2">
                        {isConfirmationNeeded && (
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] shadow-lg transition-all animate-bounce"
                          >
                            Valider TMDB
                          </button>
                        )}

                        <button
                          onClick={() => ImportQueueService.cancelJob(job.id)}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors"
                          title="Supprimer la tâche"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400 space-y-2">
            <CloudUpload className="w-8 h-8 text-purple-400 mx-auto" />
            <p>Aucune tâche d'importation en cours.</p>
            <p className="text-xs text-gray-500">
              Glissez-déposez un dossier dans la zone ci-dessus pour lancer l'importer automatique.
            </p>
          </div>
        )}
      </div>

      {/* Live Terminal Logger Console */}
      <div className="bg-black/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div
          onClick={() => setShowConsole(!showConsole)}
          className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Console des Journaux en Direct ({logs.length})</span>
          </div>
          <span className="text-xs text-gray-400">{showConsole ? 'Masquer' : 'Afficher'}</span>
        </div>

        {showConsole && (
          <div className="p-4 max-h-48 overflow-y-auto font-mono text-[11px] space-y-1 text-gray-300">
            {logs.length > 0 ? (
              logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2">
                  <span className="text-gray-500 text-[10px]">{l.timestamp}</span>
                  <span
                    className={`font-bold ${
                      l.level === 'success'
                        ? 'text-emerald-400'
                        : l.level === 'error'
                        ? 'text-rose-400'
                        : l.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-purple-300'
                    }`}
                  >
                    [{l.level.toUpperCase()}]
                  </span>
                  <span className="flex-1">{l.message}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-600 italic">En attente d'événements d'importation...</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
