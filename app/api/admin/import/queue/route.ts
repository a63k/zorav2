import { NextResponse } from 'next/server';
import { verifyAdminServerRequest } from '@/lib/admin-auth';
import { ImportQueueService } from '@/services/queue/import-queue';
import { ImportLoggerService } from '@/services/logger/import-logger';

export async function GET(req: Request) {
  const isAuth = verifyAdminServerRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  return NextResponse.json({
    jobs: ImportQueueService.getJobs(),
    logs: ImportLoggerService.getLogs(),
  });
}

export async function POST(req: Request) {
  const isAuth = verifyAdminServerRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, jobId, tmdbItem } = body;

    switch (action) {
      case 'pause':
        ImportQueueService.pauseQueue();
        return NextResponse.json({ success: true, message: 'File d\'attente mise en pause' });

      case 'resume':
        ImportQueueService.resumeQueue();
        return NextResponse.json({ success: true, message: 'File d\'attente reprise' });

      case 'retry_failed':
        ImportQueueService.retryFailedJobs();
        return NextResponse.json({ success: true, message: 'Relance des tâches échouées' });

      case 'clear_completed':
        ImportQueueService.clearCompleted();
        return NextResponse.json({ success: true, message: 'Nettoyage des tâches terminées' });

      case 'cancel_job':
        if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 });
        ImportQueueService.cancelJob(jobId);
        return NextResponse.json({ success: true, message: 'Tâche annulée' });

      case 'select_tmdb':
        if (!jobId || !tmdbItem) return NextResponse.json({ error: 'jobId et tmdbItem requis' }, { status: 400 });
        ImportQueueService.manualSelectTmdb(jobId, tmdbItem);
        return NextResponse.json({ success: true, message: 'Match TMDB sélectionné manuellement' });

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
