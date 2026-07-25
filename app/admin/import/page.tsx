'use client';

import React, { useEffect, useState } from 'react';
import { checkAdminAuthServer, logoutAdminServer } from '@/lib/admin-auth';
import ImportManager from '@/components/admin/import-manager';
import { RefreshCw, LogOut, Film, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminImportPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifySession() {
      setIsCheckingAuth(true);
      const isOk = await checkAdminAuthServer();
      setIsAuthenticated(isOk);
      setIsCheckingAuth(false);
    }
    verifySession();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="flex items-center gap-3 text-purple-400 font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Vérification de la session administrateur...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 text-center">
        <div className="p-8 rounded-3xl bg-zora-card border border-white/10 space-y-4 max-w-md">
          <h2 className="text-xl font-bold text-white">Accès Réservé</h2>
          <p className="text-xs text-gray-400">
            Vous devez être connecté en tant qu'administrateur pour accéder au gestionnaire d'importation.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zora-gradient text-white font-bold text-xs"
          >
            Se Connecter sur /admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Menu Admin Principal</span>
        </Link>

        <button
          onClick={async () => {
            await logoutAdminServer();
            window.location.href = '/admin';
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      <ImportManager />
    </div>
  );
}
