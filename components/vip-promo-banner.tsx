'use client';

import React from 'react';
import { Crown, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function VipPromoBanner() {
  return (
    <section id="vip" className="relative w-full my-12 rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-pink-950 border border-purple-500/30 shadow-2xl p-6 sm:p-10 backdrop-blur-xl">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Side Info */}
        <div className="space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Offre Zora VIP Pass</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            Passez à l'expérience <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">ZÉRO PUBLICITÉ</span>
          </h2>

          <p className="text-sm text-gray-300 leading-relaxed">
            Soutenez le serveur Zora et profitez d'un accès illimité instantané sans aucun Pass Vidéo ni publicité, en qualité Ultra HD 4K.
          </p>

          {/* Features Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Zéro pub & Lancement instantané</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Qualité 1080p & 4K Ultra HD</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Accès sur tous vos écrans</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <Crown className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span>Priorité ajout films/séries</span>
            </div>
          </div>
        </div>

        {/* Right Side Pricing Card */}
        <div className="w-full lg:w-auto min-w-[280px] bg-zora-card/90 border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 backdrop-blur-2xl flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest">
              Pass VIP Mensuel
            </span>
            <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>6,99 €</span>
              <span className="text-xs font-normal text-gray-400">/ mois</span>
            </div>
            <p className="text-[11px] text-gray-400">Sans engagement — Annulable à tout moment</p>
          </div>

          <button
            onClick={() => alert("Option VIP : intégration système d'abonnement en cours.")}
            className="w-full py-3.5 px-6 rounded-2xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Devenir Membre VIP</span>
          </button>

          <p className="text-[10px] text-gray-400">
            100% facultatif — Le site reste totalement gratuit avec pub.
          </p>
        </div>

      </div>

    </section>
  );
}
