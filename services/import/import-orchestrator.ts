import { parseFilename } from '../parser/filename-parser';
import { matchTMDbItem } from '../tmdb/tmdb-matcher';
import { BunnyStreamService } from '../bunny/bunny-stream';
import { VideoHasherService } from '../hash/video-hasher';
import { ImportRepositoryService } from '../database/import-repository';
import { ImportLoggerService } from '../logger/import-logger';
import { ImportQueueService, ImportJob } from '../queue/import-queue';

export class ImportOrchestrator {
  private static bunnyService = new BunnyStreamService();
  private static dbRepo = new ImportRepositoryService();

  public static initialize() {
    ImportQueueService.setProcessor(this.processJob.bind(this));
  }

  public static async processJob(job: ImportJob): Promise<void> {
    ImportLoggerService.info(`Début de l'importation pour : ${job.filename}`, job.id);

    // 1. STEP 1: PARSE FILENAME
    ImportQueueService.updateJob(job.id, {
      status: 'hashing',
      progress: 10,
      stepMessage: 'Analyse du nom de fichier & signatures...',
    });

    const parsed = parseFilename(job.filename);
    ImportLoggerService.info(
      `Nom analysé: "${parsed.cleanTitle}" (${parsed.mediaType}${
        parsed.seasonNumber ? ` S${parsed.seasonNumber}E${parsed.episodeNumber}` : ''
      })`,
      job.id
    );
    ImportQueueService.updateJob(job.id, { parsedInfo: parsed });

    // 2. STEP 2: GENERATE HASH & CHECK DUPLICATE
    let fileHash: string | undefined;
    if (job.rawFile) {
      try {
        const arrayBuffer = await job.rawFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileHash = await VideoHasherService.generateFastSignature(buffer, job.fileSize);
        ImportQueueService.updateJob(job.id, { fileHash });

        const existingRecord = await this.dbRepo.findByHash(fileHash);
        if (existingRecord) {
          ImportLoggerService.warn(
            `Fichier en double détecté (Hash SHA-256 existant: ${fileHash.slice(0, 8)}...). Annulation de l'upload.`,
            job.id
          );
          ImportQueueService.updateJob(job.id, {
            status: 'completed',
            progress: 100,
            stepMessage: `Déjà importé dans Zora ("${existingRecord.title}")`,
            completedAt: new Date().toISOString(),
          });
          return;
        }
      } catch (err: any) {
        ImportLoggerService.warn(`Impossible de générer le hash fichier: ${err.message}`, job.id);
      }
    }

    // 3. STEP 3: TMDB SMART MATCHING
    let selectedTmdbItem = job.selectedTmdbItem;

    if (!selectedTmdbItem) {
      ImportQueueService.updateJob(job.id, {
        status: 'tmdb_lookup',
        progress: 25,
        stepMessage: `Recherche TMDB pour "${parsed.cleanTitle}"...`,
      });

      const tmdbResult = await matchTMDbItem(parsed.cleanTitle, parsed.mediaType, parsed.year);
      ImportQueueService.updateJob(job.id, { tmdbMatchResult: tmdbResult });

      if (tmdbResult.requiresManualReview || !tmdbResult.bestMatch) {
        ImportLoggerService.warn(
          `Confiance TMDB faible (<90%). Confirmation administrateur requise pour "${parsed.cleanTitle}".`,
          job.id
        );
        ImportQueueService.updateJob(job.id, {
          status: 'awaiting_confirmation',
          progress: 35,
          stepMessage: 'En attente de validation manuelle de l\'administrateur',
        });
        return; // Pause until admin validates via manual selection modal
      }

      selectedTmdbItem = tmdbResult.bestMatch.item;
      ImportLoggerService.success(
        `TMDB sélectionné automatiquement: "${selectedTmdbItem.title || selectedTmdbItem.name}" (Score: ${tmdbResult.bestMatch.score}%)`,
        job.id
      );
      ImportQueueService.updateJob(job.id, { selectedTmdbItem });
    }

    // 4. STEP 4: BUNNY STREAM UPLOAD
    ImportQueueService.updateJob(job.id, {
      status: 'uploading',
      progress: 45,
      stepMessage: 'Création de la vidéo sur Bunny Stream...',
    });

    const titleForBunny = `${selectedTmdbItem.title || selectedTmdbItem.name}${
      parsed.seasonNumber ? ` S${parsed.seasonNumber}E${parsed.episodeNumber}` : ''
    }`;

    const bunnyVid = await this.bunnyService.createVideo(titleForBunny);

    if (job.rawFile) {
      ImportQueueService.updateJob(job.id, {
        stepMessage: 'Upload binaire en cours vers le CDN Bunny Stream...',
      });

      const arrayBuffer = await job.rawFile.arrayBuffer();
      await this.bunnyService.uploadVideoBinary(
        bunnyVid.libraryId,
        bunnyVid.videoId,
        arrayBuffer,
        (uploadPct) => {
          const currentTotalProgress = Math.round(45 + (uploadPct * 0.4)); // 45% -> 85%
          ImportQueueService.updateJob(job.id, {
            progress: currentTotalProgress,
            stepMessage: `Upload vers Bunny Stream: ${uploadPct}%`,
          });
        }
      );
    }

    // 5. STEP 5: CHECK ENCODING STATUS & PERSIST TO DB
    ImportQueueService.updateJob(job.id, {
      status: 'encoding',
      progress: 90,
      stepMessage: 'Vérification de l\'encodage vidéo...',
    });

    const bunnyMeta = await this.bunnyService.checkVideoStatus(bunnyVid.libraryId, bunnyVid.videoId);

    // Save/Update in Database Repository
    await this.dbRepo.upsertMediaRecord({
      tmdbId: selectedTmdbItem.id,
      mediaType: parsed.mediaType,
      seasonNumber: parsed.seasonNumber,
      episodeNumber: parsed.episodeNumber,
      title: selectedTmdbItem.title || selectedTmdbItem.name || parsed.cleanTitle,
      posterPath: selectedTmdbItem.poster_path,
      backdropPath: selectedTmdbItem.backdrop_path,
      mp4Url: bunnyMeta.directMp4Url || bunnyMeta.playbackUrl,
      fileHash,
      bunnyLibraryId: bunnyVid.libraryId,
      bunnyVideoId: bunnyVid.videoId,
    });

    ImportLoggerService.success(
      `Importation réussie avec succès pour "${selectedTmdbItem.title || selectedTmdbItem.name}" !`,
      job.id
    );

    ImportQueueService.updateJob(job.id, {
      status: 'completed',
      progress: 100,
      stepMessage: 'Importation terminée avec succès !',
      bunnyMeta,
      completedAt: new Date().toISOString(),
    });
  }
}

// Auto-initialize orchestrator
ImportOrchestrator.initialize();
