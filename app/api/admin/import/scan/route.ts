import { NextResponse } from 'next/server';
import { verifyAdminServerRequest } from '@/lib/admin-auth';
import { ImportQueueService } from '@/services/queue/import-queue';

export async function POST(req: Request) {
  const isAuth = verifyAdminServerRequest(req);
  if (!isAuth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier valide fourni' }, { status: 400 });
    }

    const createdJobs = ImportQueueService.addJobs(
      files.map((f: { filename: string; fileSize?: number }) => ({
        filename: f.filename,
        fileSize: f.fileSize || 0,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `${createdJobs.length} fichier(s) ajouté(s) à la file d'attente d'importation`,
      jobsCount: createdJobs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors du scan' }, { status: 500 });
  }
}
