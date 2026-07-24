import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Crown, MessageSquare, Send, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-zora-dark/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-zora-gradient p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-zora-bg rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-purple-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black zora-text-gradient tracking-wider uppercase">ZORA</span>
                <span className="text-[8px] text-purple-400 -mt-1 font-bold tracking-widest">STREAMING</span>
              </div>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
              Zora est une plateforme de streaming haute définition entièrement gratuite. Profitez de milliers de films et séries en illimité sans abonnement requis.
            </p>

            {/* Social Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discord</span>
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>X / Twitter</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-medium">
              <li>
                <Link href="/" className="hover:text-purple-400 transition-colors">Catalogue Général</Link>
              </li>
              <li>
                <a href="#trending" className="hover:text-purple-400 transition-colors">Tendances de la semaine</a>
              </li>
              <li>
                <a href="#genres" className="hover:text-purple-400 transition-colors">Explorer par Genre</a>
              </li>
              <li>
                <a href="#vip" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Zora VIP</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / DMCA Notice */}
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Mentions & DMCA</span>
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Ce site ne héberge aucun fichier vidéo directement sur ses serveurs. Tous les contenus sont fournis par des tiers indépendants via l'API TMDB.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-3 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Zora Streaming. Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-400 transition-colors">Conditions</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">Confidentialité</Link>
            <Link href="/admin" className="hover:text-purple-400 transition-colors">Administration</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
