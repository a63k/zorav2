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

export class ImportQueueService {
  private static jobs: ImportJob[] = [];
  private static isPaused: boolean = false;
  private static concurrency: number = 2;
  private static activeWorkersCount: number = 0;
  private static listeners: ((jobs: ImportJob[], isPaused: boolean) => void)[] = [];
  private static processorFn?: (job: ImportJob) => Promise<void>;

  public static setProcessor(fn: (job: ImportJob) => Promise<void>) {
    this.processorFn = fn;
  }

  public static addJobs(files: { filename: string; fileSize: number; rawFile?: File | Blob }[]): ImportJob[] {
    const newJobs: ImportJob[] = files.map((f) => ({
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename: f.filename,
      fileSize: f.fileSize,
      rawFile: f.rawFile,
      status: 'pending',
      progress: 0,
      stepMessage: 'Initialisé dans la file d\'attente',
      retryCount: 0,
      addedAt: new Date().toISOString(),
    }));

    this.jobs.push(...newJobs);
    this.notify();
    this.processNext();
    return newJobs;
  }

  public static updateJob(jobId: string, updates: Partial<ImportJob>) {
    const idx = this.jobs.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      this.jobs[idx] = { ...this.jobs[idx], ...updates };
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
    this.jobs.forEach((job) => {
      if (job.status === 'failed') {
        job.status = 'pending';
        job.progress = 0;
        job.error = undefined;
        job.stepMessage = 'En attente de nouvelle tentative...';
      }
    });
    this.isPaused = false;
    this.notify();
    this.processNext();
  }

  public static cancelJob(jobId: string) {
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
    this.notify();
  }

  public static clearCompleted() {
    this.jobs = this.jobs.filter((j) => j.status !== 'completed');
    this.notify();
  }

  public static manualSelectTmdb(jobId: string, tmdbItem: TMDBItem) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.selectedTmdbItem = tmdbItem;
      job.status = 'pending';
      job.stepMessage = `Titre TMDB validé (${tmdbItem.title || tmdbItem.name}). Reprise...`;
      this.notify();
      this.processNext();
    }
  }

  public static getJobs(): ImportJob[] {
    return [...this.jobs];
  }

  public static subscribe(listener: (jobs: ImportJob[], isPaused: boolean) => void) {
    this.listeners.push(listener);
    listener([...this.jobs], this.isPaused);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
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
