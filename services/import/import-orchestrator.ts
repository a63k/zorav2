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
      progress: 15,
      stepMessage: 'Analyse du nom de fichier & titre...',
    });

    const parsed = parseFilename(job.filename);
    ImportLoggerService.info(
      `Nom analysé: "${parsed.cleanTitle}" (${parsed.mediaType}${
        parsed.seasonNumber ? ` S${parsed.seasonNumber}E${parsed.episodeNumber}` : ''
      })`,
      job.id
    );
    ImportQueueService.updateJob(job.id, { parsedInfo: parsed });

    // 2. STEP 2: GENERATE HASH & CHECK DUPLICATE (if local raw file exists)
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
            `Fichier en double détecté (Hash SHA-256 existant: ${fileHash.slice(0, 8)}...). Annulation.`,
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
        progress: 40,
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
          progress: 50,
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

    // 4. STEP 4: BUNNY STREAM HANDLING
    let bunnyVidId: string;
    let bunnyLibId: string;

    if (job.guid) {
      // Video is ALREADY uploaded on Bunny Stream!
      bunnyVidId = job.guid;
      bunnyLibId = process.env.BUNNY_STREAM_LIBRARY_ID || '713081';
      ImportQueueService.updateJob(job.id, {
        status: 'encoding',
        progress: 80,
        stepMessage: 'Vidéo Bunny Stream détectée, vérification du flux...',
      });
    } else {
      // Video needs to be created & uploaded to Bunny Stream
      ImportQueueService.updateJob(job.id, {
        status: 'uploading',
        progress: 55,
        stepMessage: 'Création de la vidéo sur Bunny Stream...',
      });

      const titleForBunny = `${selectedTmdbItem.title || selectedTmdbItem.name}${
        parsed.seasonNumber ? ` S${parsed.seasonNumber}E${parsed.episodeNumber}` : ''
      }`;

      const bunnyVid = await this.bunnyService.createVideo(titleForBunny);
      bunnyVidId = bunnyVid.videoId;
      bunnyLibId = bunnyVid.libraryId;

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
            const currentTotalProgress = Math.round(55 + (uploadPct * 0.35)); // 55% -> 90%
            ImportQueueService.updateJob(job.id, {
              progress: currentTotalProgress,
              stepMessage: `Upload vers Bunny Stream: ${uploadPct}%`,
            });
          }
        );
      }
    }

    // 5. STEP 5: SAVE TO DB & COMPLETE
    ImportQueueService.updateJob(job.id, {
      status: 'encoding',
      progress: 90,
      stepMessage: 'Enregistrement dans la base de données Zora...',
    });

    const bunnyMeta = await this.bunnyService.checkVideoStatus(bunnyLibId, bunnyVidId);

    // Save/Update in Database Repository
    await this.dbRepo.upsertMediaRecord({
      tmdbId: selectedTmdbItem.id,
      mediaType: parsed.mediaType,
      seasonNumber: parsed.seasonNumber,
      episodeNumber: parsed.episodeNumber,
      title: selectedTmdbItem.title || selectedTmdbItem.name || parsed.cleanTitle,
      posterPath: selectedTmdbItem.poster_path,
      backdropPath: selectedTmdbItem.backdrop_path,
      mp4Url: bunnyMeta.playbackUrl || bunnyMeta.directMp4Url,
      fileHash,
      bunnyLibraryId: bunnyLibId,
      bunnyVideoId: bunnyVidId,
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
