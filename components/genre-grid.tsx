'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ChevronRight } from 'lucide-react';

const GENRES = [
  { id: 28, name: 'Action', gradient: 'from-rose-900/40 via-purple-900/30 to-zora-card' },
  { id: 12, name: 'Aventure', gradient: 'from-amber-900/40 via-purple-900/30 to-zora-card' },
  { id: 16, name: 'Animation', gradient: 'from-indigo-900/40 via-purple-900/30 to-zora-card' },
  { id: 35, name: 'Comédie', gradient: 'from-yellow-900/40 via-purple-900/30 to-zora-card' },
  { id: 80, name: 'Crime', gradient: 'from-red-950/50 via-purple-950/30 to-zora-card' },
  { id: 99, name: 'Documentaire', gradient: 'from-emerald-900/40 via-purple-900/30 to-zora-card' },
  { id: 18, name: 'Drame', gradient: 'from-blue-900/40 via-purple-900/30 to-zora-card' },
  { id: 10751, name: 'Familial', gradient: 'from-teal-900/40 via-purple-900/30 to-zora-card' },
  { id: 14, name: 'Fantastique', gradient: 'from-purple-900/50 via-indigo-900/40 to-zora-card' },
  { id: 36, name: 'Histoire', gradient: 'from-amber-950/40 via-purple-950/30 to-zora-card' },
  { id: 27, name: 'Horreur', gradient: 'from-rose-950/60 via-purple-950/40 to-zora-card' },
  { id: 10402, name: 'Musique', gradient: 'from-violet-900/40 via-purple-900/30 to-zora-card' },
  { id: 9648, name: 'Mystère', gradient: 'from-cyan-900/40 via-purple-900/30 to-zora-card' },
  { id: 10749, name: 'Romance', gradient: 'from-pink-900/40 via-purple-900/30 to-zora-card' },
  { id: 878, name: 'Science-Fiction', gradient: 'from-sky-900/40 via-purple-900/30 to-zora-card' },
  { id: 53, name: 'Thriller', gradient: 'from-fuchsia-900/40 via-purple-900/30 to-zora-card' },
];

export default function GenreGrid() {
  return (
    <section className="space-y-6 my-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Explorez par Genre</h2>
            <p className="text-xs text-gray-400">Parcourez l'intégralité du catalogue selon vos préférences</p>
          </div>
        </div>
      </div>

      {/* Grid Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {GENRES.map((genre) => (
          <div
            key={genre.id}
            className={`group relative p-5 rounded-2xl bg-gradient-to-br ${genre.gradient} border border-white/10 hover:border-purple-500/50 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between min-h-[90px] overflow-hidden`}
          >
            {/* Ambient Corner Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />

            <div>
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                {genre.name}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300/70 group-hover:text-purple-200">
                Explorer
              </span>
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-purple-600 transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
