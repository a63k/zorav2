'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Info, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TMDBItem, getTMDBImageUrl } from '@/lib/tmdb';

interface HeroCarouselProps {
  items: TMDBItem[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const title = current.title || current.name || 'Titre inconnu';
  const date = current.release_date || current.first_air_date;
  const year = date ? date.split('-')[0] : '';
  const mediaType = current.media_type || (current.title ? 'movie' : 'tv');

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] max-h-[750px] rounded-3xl overflow-hidden shadow-2xl group border border-white/10 my-4">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 bg-zora-bg">
        <img
          src={getTMDBImageUrl(current.backdrop_path || current.poster_path, 'original')}
          alt={title}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out scale-105 group-hover:scale-100 opacity-60"
        />
        {/* Dark Vignette and Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zora-bg via-zora-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zora-bg via-zora-bg/70 to-transparent" />
      </div>

      {/* Hero Details Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-14">
        <div className="max-w-2xl space-y-4">
          
          {/* Badges */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zora-gradient text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Tendances du moment
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10 backdrop-blur-md uppercase">
              {mediaType === 'movie' ? 'Film' : 'Série TV'}
            </span>
            {year && (
              <span className="text-xs text-gray-400 font-medium">{year}</span>
            )}
            {current.vote_average > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {current.vote_average.toFixed(1)}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow">
            {current.overview || "Aucune description disponible pour ce titre."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <Link
              href={`/watch/${mediaType}/${current.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zora-gradient hover:opacity-90 text-white font-bold text-sm shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Regarder Maintenant</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Carousel Navigation Buttons */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-purple-600/80 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 hover:bg-purple-600/80 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 right-6 z-10 flex items-center gap-1.5">
        {items.slice(0, 8).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
