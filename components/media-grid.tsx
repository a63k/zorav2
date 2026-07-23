'use client';

import React, { useState } from 'react';
import MediaCard from './media-card';
import { TMDBItem } from '@/lib/tmdb';
import { Film, Tv, Sparkles, Flame } from 'lucide-react';

interface MediaGridProps {
  title: string;
  items: TMDBItem[];
  customStreamIds?: Set<number>;
}

export default function MediaGrid({ title, items, customStreamIds }: MediaGridProps) {
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredItems = items.filter((item) => {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    if (filter === 'movie') return type === 'movie';
    if (filter === 'tv') return type === 'tv';
    return true;
  });

  return (
    <section className="my-10 space-y-6">
      {/* Header with Title & Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-zora-gradient rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            {title}
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-zora-gradient text-white shadow-md shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'movie'
                ? 'bg-zora-gradient text-white shadow-md shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Films
          </button>
          <button
            onClick={() => setFilter('tv')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'tv'
                ? 'bg-zora-gradient text-white shadow-md shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Séries
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MediaCard
              key={`${item.media_type || 'm'}-${item.id}`}
              item={item}
              hasCustomStream={customStreamIds?.has(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aucun titre disponible dans cette catégorie pour le moment.
        </div>
      )}
    </section>
  );
}
