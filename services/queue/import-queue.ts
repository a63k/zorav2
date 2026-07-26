import { ParsedFilename } from '../parser/filename-parser';
import { SmartMatchResponse } from '../tmdb/tmdb-matcher';
import { BunnyVideoMetadata } from '../bunny/bunny-stream';
import { TMDBItem } from '@/lib/tmdb';

export type JobStatus =
  | 'pending'
  | 'hashing'
  | 'tmdb_lookup'
  | 'awaiting_confirmation'
  | 'uploading'
  | 'encoding'
  | 'completed'
  | 'failed'
  | 'paused';

export interface ImportJob {
  id: string;
  filename: string;
  fileSize: number;
  rawFile?: File | Blob;
  guid?: string;
  mediaType?: 'movie' | 'tv';
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  status: JobStatus;
  progress: number;
  stepMessage: string;
  parsedInfo?: ParsedFilename;
  tmdbMatchResult?: SmartMatchResponse;
  selectedTmdbItem?: TMDBItem;
  fileHash?: string;
  bunnyMeta?: BunnyVideoMetadata;
  error?: string;
  retryCount: number;
  addedAt: string;
  completedAt?: string;
}

const STORAGE_KEY = 'zora_import_jobs_v2';

export class ImportQueueService {
  private static jobs: ImportJob[] = [];
  private static isPaused: boolean = false;
  private static concurrency: number = 2;
  private static activeWorkersCount: number = 0;
  private static listeners: ((jobs: ImportJob[], isPaused: boolean) => void)[] = [];
  private static processorFn?: (job: ImportJob) => Promise<void>;
  private static isInitialized: boolean = false;

  private static initFromStorage() {
    if (this.isInitialized || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.jobs = JSON.parse(raw);
      }
    } catch (e) {}
    this.isInitialized = true;
  }

  private static saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const serializableJobs = this.jobs.map(({ rawFile, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableJobs));
    } catch (e) {}
  }

  public static setProcessor(fn: (job: ImportJob) => Promise<void>) {
    this.processorFn = fn;
    this.initFromStorage();
    this.processNext();
  }

  public static addJobs(
    files: {
      filename: string;
      fileSize: number;
      rawFile?: File | Blob;
      guid?: string;
      mediaType?: 'movie' | 'tv';
      seriesTitle?: string;
      seasonNumber?: number;
      episodeNumber?: number;
    }[]
  ): ImportJob[] {
    this.initFromStorage();
    const newJobs: ImportJob[] = files.map((f) => ({
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename: f.filename,
      fileSize: f.fileSize,
      rawFile: f.rawFile,
      guid: f.guid,
      mediaType: f.mediaType,
      seriesTitle: f.seriesTitle,
      seasonNumber: f.seasonNumber,
      episodeNumber: f.episodeNumber,
      status: 'pending',
      progress: 0,
      stepMessage: 'Initialisé dans la file d\'attente',
      retryCount: 0,
      addedAt: new Date().toISOString(),
    }));

    this.jobs.push(...newJobs);
    this.saveToStorage();
    this.notify();
    this.processNext();
    return newJobs;
  }

  public static updateJob(jobId: string, updates: Partial<ImportJob>) {
    this.initFromStorage();
    const idx = this.jobs.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      this.jobs[idx] = { ...this.jobs[idx], ...updates };
      this.saveToStorage();
      this.notify();
    }
  }

  public static pauseQueue() {
    this.isPaused = true;
    this.notify();
  }

  public static resumeQueue() {
    this.isPaused = false;
    this.notify();
    this.processNext();
  }

  public static retryFailedJobs() {
    this.initFromStorage();
    this.jobs.forEach((job) => {
      if (job.status === 'failed') {
        job.status = 'pending';
        job.progress = 0;
        job.error = undefined;
        job.stepMessage = 'En attente de nouvelle tentative...';
      }
    });
    this.isPaused = false;
    this.saveToStorage();
    this.notify();
    this.processNext();
  }

  public static cancelJob(jobId: string) {
    this.initFromStorage();
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
    this.saveToStorage();
    this.notify();
  }

  public static clearCompleted() {
    this.initFromStorage();
    this.jobs = this.jobs.filter((j) => j.status !== 'completed');
    this.saveToStorage();
    this.notify();
  }

  public static manualSelectTmdb(jobId: string, tmdbItem: TMDBItem) {
    this.initFromStorage();
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.selectedTmdbItem = tmdbItem;
      job.status = 'pending';
      job.stepMessage = `Titre TMDB validé (${tmdbItem.title || tmdbItem.name}). Reprise...`;
      this.saveToStorage();
      this.notify();
      this.processNext();
    }
  }

  public static getJobs(): ImportJob[] {
    this.initFromStorage();
    return [...this.jobs];
  }

  public static subscribe(listener: (jobs: ImportJob[], isPaused: boolean) => void) {
    this.initFromStorage();
    this.listeners.push(listener);
    listener([...this.jobs], this.isPaused);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l([...this.jobs], this.isPaused));
  }

  private static async processNext() {
    if (this.isPaused || !this.processorFn) return;

    while (this.activeWorkersCount < this.concurrency) {
      const nextJob = this.jobs.find((j) => j.status === 'pending');
      if (!nextJob) break;

      this.activeWorkersCount++;
      (async () => {
        try {
          if (this.processorFn) {
            await this.processorFn(nextJob);
          }
        } catch (err: any) {
          nextJob.status = 'failed';
          nextJob.error = err.message || 'Erreur inattendue durant l\'importation';
          nextJob.stepMessage = 'Échec du traitement';
          this.notify();
        } finally {
          this.activeWorkersCount--;
          this.processNext();
        }
      })();
    }
  }
}
