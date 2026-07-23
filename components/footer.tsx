import React from 'react';
import Link from 'next/link';
import { Sparkles, Film, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-zora-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zora-gradient p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-zora-bg rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="text-xl font-black zora-text-gradient">ZORA</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Zora est une plateforme de streaming haute qualité intégrant les données TMDB et un lecteur de flux direct sécurisé par des accès Ads.
            </p>
            <div className="text-[11px] text-gray-500">
              © {new Date().getFullYear()} Zora. Tous droits réservés.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/" className="hover:text-purple-400 transition-colors">Accueil</Link>
              </li>
              <li>
                <a href="#trending" className="hover:text-purple-400 transition-colors">Tendances</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">Informations</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Ce site ne héberge aucun fichier directement sur ses serveurs. Tous les liens sont fournis par des tiers indépendants.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
