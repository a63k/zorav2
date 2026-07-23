'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, X, ChevronLeft, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import { getUnfinishedWatchHistory, removeFromWatchHistory, WatchHistoryItem } from '@/lib/history';
import { getTMDBImageUrl } from '@/lib/tmdb';

export default function ContinueWatchingCarousel() {
  const [unfinished, setUnfinished] = useState<WatchHistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadUnfinished = () => {
    setUnfinished(getUnfinishedWatchHistory());
  };

  useEffect(() => {
    loadUnfinished();
    const handleUpdate = () => loadUnfinished();
    window.addEventListener('zora_history_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('zora_history_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Hide carousel completely if there are no unfinished movies/series
  if (unfinished.length === 0) {
    return null;
  }

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWatchHistory(id);
    loadUnfinished();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatMinSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <section className="py-6 space-y-4 animate-fadeIn">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Reprendre la lecture</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {unfinished.length} en cours
              </span>
            </h2>
          </div>
        </div>

        {/* Scroll Controls */}
        {unfinished.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
      >
        {unfinished.map((item) => {
          const isTV = item.mediaType === 'tv';
          const watchUrl = `/watch/${item.mediaType}/${item.tmdbId}`;
          const imgUrl = getTMDBImageUrl(item.backdropPath || item.posterPath || null, 'w500');

          return (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-zora-card border border-white/10 shadow-xl group hover:border-purple-500/40 transition-all duration-300"
            >
              {/* Media Backdrop / Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                <img
                  src={imgUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Quick Remove Button */}
                <button
                  onClick={(e) => handleRemove(e, item.id)}
                  title="Retirer de la liste"
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-gray-300 hover:text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Center Play Button Overlay */}
                <Link
                  href={watchUrl}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/50 scale-90 group-hover:scale-100 transition-all">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </Link>

                {/* Progress Bar at Bottom of Image */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-3.5 space-y-1.5 bg-zora-card/90">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="uppercase font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {isTV ? 'Série' : 'Film'}
                  </span>
                  {isTV && item.season && item.episode && (
                    <span className="font-semibold text-purple-300">
                      S{item.season} E{item.episode}
                    </span>
                  )}
                  <span className="font-semibold text-gray-300">
                    {formatMinSec(item.currentTime)} / {formatMinSec(item.duration)}
                  </span>
                </div>

                <Link href={watchUrl} className="block">
                  <h3 className="text-sm font-bold text-white truncate hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
