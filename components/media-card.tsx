import React from 'react';
import Link from 'next/link';
import { Play, Star, Film, Tv } from 'lucide-react';
import { TMDBItem, getTMDBImageUrl } from '@/lib/tmdb';

interface MediaCardProps {
  item: TMDBItem;
  hasCustomStream?: boolean;
}

export default function MediaCard({ item, hasCustomStream }: MediaCardProps) {
  const title = item.title || item.name || 'Titre inconnu';
  const date = item.release_date || item.first_air_date;
  const year = date ? date.split('-')[0] : '';
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const isVF = item.original_language === 'fr';

  return (
    <Link
      href={`/watch/${mediaType}/${item.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-zora-card border border-white/10 zora-card-glow cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
        <img
          src={getTMDBImageUrl(item.poster_path, 'w500')}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* Hover Gradient & Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-zora-bg via-purple-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-zora-gradient p-0.5 shadow-xl shadow-purple-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-zora-bg flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-400 fill-purple-400 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10">
            {mediaType === 'movie' ? 'Film' : 'Série'}
          </span>
          {isVF && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-600/90 text-white shadow border border-blue-400/30">
              🇫🇷 VF
            </span>
          )}
        </div>

        {item.vote_average > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[11px] font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            {item.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>{year || 'Récent'}</span>
            <span className={`text-[10px] font-semibold uppercase ${isVF ? 'text-blue-400' : 'text-purple-400'}`}>
              {isVF ? 'VF' : 'VOSTFR'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
