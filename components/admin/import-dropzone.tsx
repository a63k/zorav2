'use client';

import React, { useRef, useState } from 'react';
import { FolderPlus, UploadCloud, Film, CheckCircle } from 'lucide-react';
import { ImportQueueService } from '@/services/queue/import-queue';

interface ImportDropzoneProps {
  onFilesQueued?: (count: number) => void;
}

export default function ImportDropzone({ onFilesQueued }: ImportDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastBatchCount, setLastBatchCount] = useState<number | null>(null);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validVideoFiles: { filename: string; fileSize: number; rawFile: File }[] = [];

    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.ts', '.flv'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const filename = file.webkitRelativePath || file.name;
      const lower = filename.toLowerCase();

      if (videoExtensions.some((ext) => lower.endsWith(ext))) {
        validVideoFiles.push({
          filename,
          fileSize: file.size,
          rawFile: file,
        });
      }
    }

    if (validVideoFiles.length > 0) {
      ImportQueueService.addJobs(validVideoFiles);
      setLastBatchCount(validVideoFiles.length);
      if (onFilesQueued) onFilesQueued(validVideoFiles.length);
      setTimeout(() => setLastBatchCount(null), 5000);
    } else {
      alert('Aucun fichier vidéo valide (.mp4, .mkv, .avi, etc.) n\'a été trouvé dans la sélection.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden Native Directory & File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        multiple
        accept="video/*,.mkv"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-4 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-purple-500 bg-purple-950/40 scale-[1.01]'
            : 'border-white/15 bg-zora-card/80 hover:border-purple-500/50 hover:bg-white/5'
        }`}
      >
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl" />

        <div className="w-16 h-16 rounded-2xl bg-zora-gradient p-0.5 shadow-2xl shadow-purple-500/40 animate-pulse">
          <div className="w-full h-full bg-zora-bg rounded-[14px] flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="space-y-1 max-w-md">
          <h3 className="text-xl font-black text-white">
            Glissez-déposez un dossier ou des vidéos ici
          </h3>
          <p className="text-xs text-gray-400">
            Supporte la structure récursive des dossiers (Films & Séries). Formats acceptés : MP4, MKV, AVI, WEBM.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Sélectionner un Dossier Complet</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all"
          >
            <Film className="w-4 h-4 text-purple-400" />
            <span>Choisir des Fichiers Seuls</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/import/bunny-sync', { method: 'POST' });
                const data = await res.json();
                if (data.syncedCount > 0) {
                  setLastBatchCount(data.syncedCount);
                  if (onFilesQueued) onFilesQueued(data.syncedCount);
                  setTimeout(() => setLastBatchCount(null), 5000);
                } else {
                  alert(data.message || data.error || 'Aucune vidéo trouvée.');
                }
              } catch (e: any) {
                alert('Erreur lors de la synchronisation Bunny: ' + e.message);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 font-bold text-xs border border-pink-500/30 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-pink-400" />
            <span>Synchroniser mes Vidéos Déjà sur Bunny Stream</span>
          </button>
        </div>

        {lastBatchCount !== null && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{lastBatchCount} vidéo(s) ajoutée(s) avec succès à la file d'attente automatisée !</span>
          </div>
        )}
      </div>
    </div>
  );
}
