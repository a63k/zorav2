'use client';

import React, { useEffect } from 'react';
import ImportDropzone from './import-dropzone';
import ImportQueueTable from './import-queue-table';
import { Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';
import { ImportOrchestrator } from '@/services/import/import-orchestrator';

export default function ImportManager() {
  useEffect(() => {
    ImportOrchestrator.initialize();
  }, []);

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zora-card border border-purple-500/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-pink-600/20 rounded-full blur-3xl" />

        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Importeur de Production Zora Enterprise v2.0</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Gestionnaire d'Importation Automatisé
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Importez des milliers de films et épisodes de séries automatiquement. Le système analyse les noms de fichiers, cherche sur TMDB avec score de confiance, évite les doublons via hash SHA-256 et enregistre les flux vidéos directement sans bloquer l'interface.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 z-10 w-full sm:w-auto">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Multi-Thread</span>
            <span className="text-[9px] text-gray-400">Worker en file async</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Anti-Doublons</span>
            <span className="text-[9px] text-gray-400">Empreinte SHA-256</span>
          </div>
        </div>

      </div>

      {/* Drag & Drop Section */}
      <ImportDropzone />

      {/* Realtime Queue & Controls Table */}
      <ImportQueueTable />
    </div>
  );
}
