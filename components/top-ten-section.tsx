'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, TrendingUp, Star } from 'lucide-react';
import { TMDBItem, getTMDBImageUrl } from '@/lib/tmdb';

interface TopTenSectionProps {
  items: TMDBItem[];
  title?: string;
}

export default function TopTenSection({ items, title = "TOP 10 de la Semaine" }: TopTenSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  const topTenItems = items.slice(0, 10);

  return (
    <section className="space-y-4 my-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Tendance
              </span>
            </h2>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top 10 Horizontal Scroll Track */}
      <div
        ref={carouselRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-4 px-1 scroll-smooth"
      >
        {topTenItems.map((item, index) => {
          const rank = index + 1;
          const mediaType = item.title ? 'movie' : 'tv';
          const titleText = item.title || item.name || 'Titre inconnu';

          return (
            <Link
              key={item.id}
              href={`/watch/${mediaType}/${item.id}`}
              className="group relative flex-shrink-0 flex items-end select-none cursor-pointer"
            >
              {/* Giant Rank Number */}
              <span
                className="font-black text-8xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-purple-400/40 via-purple-600/20 to-transparent select-none -mr-6 sm:-mr-8 z-0 font-serif leading-none transition-transform group-hover:scale-105"
                style={{
                  WebkitTextStroke: '2px rgba(168, 85, 247, 0.4)',
                }}
              >
                {rank}
              </span>

              {/* Poster Card */}
              <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-zora-card border border-white/10 shadow-xl z-10 group-hover:scale-105 group-hover:border-purple-500/50 transition-all duration-300">
                <img
                  src={getTMDBImageUrl(item.poster_path, 'w500')}
                  alt={titleText}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Rating badge */}
                {item.vote_average > 0 && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/75 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Bottom Title Info */}
                <div className="absolute bottom-0 inset-x-0 p-3 space-y-0.5">
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 inline-block">
                    {mediaType === 'movie' ? 'Film' : 'Série'}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {titleText}
                  </h4>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
