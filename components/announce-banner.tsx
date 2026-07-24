'use client';

import React, { useState } from 'react';
import { X, Crown, ArrowRight } from 'lucide-react';

export default function AnnounceBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-purple-950 via-indigo-950 to-pink-950 border-b border-purple-500/20 text-white text-xs py-2 px-4 flex items-center justify-between z-[60] shadow-md">
      <div className="flex-1 flex items-center justify-center gap-2 text-center text-gray-200">
        <span className="inline-flex items-center gap-1 font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 tracking-wider">
          <Crown className="w-3 h-3 text-amber-400" /> NOUVEAU
        </span>
        <span className="font-medium text-gray-300">
          Zora VIP est là — 100 % facultatif, dès 6,99 €/mois. Le gratuit ne change pas.
        </span>
        <a
          href="#vip"
          className="font-bold text-purple-300 hover:text-white underline flex items-center gap-1 transition-colors ml-1"
        >
          <span>En savoir plus</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
        aria-label="Fermer la bannière"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
