import React from 'react';
import HeroCarousel from '@/components/hero-carousel';
import ContinueWatchingCarousel from '@/components/continue-watching-carousel';
import MediaGrid from '@/components/media-grid';
import AdsterraAd from '@/components/adsterra-ad';
import { fetchTrending, fetchPopularMovies, fetchPopularTVShows } from '@/lib/tmdb';
import { getAllMediaLinks } from '@/lib/store';
import { Sparkles, Flame, Film, Tv } from 'lucide-react';

export const revalidate = 1800; // revalidate every 30 minutes

export default async function HomePage() {
  const [trending, movies, tvShows, customLinks] = await Promise.all([
    fetchTrending('all'),
    fetchPopularMovies(),
    fetchPopularTVShows(),
    getAllMediaLinks(),
  ]);

  const customStreamIds = new Set(customLinks.map((l) => l.tmdb_id));

  return (
    <div className="space-y-10 py-4">
      {/* Top Banner Adsterra Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Hero Carousel */}
      <HeroCarousel items={trending.slice(0, 8)} />

      {/* Continue Watching Carousel (Renders ONLY if unfinished videos exist) */}
      <ContinueWatchingCarousel />

      {/* Media Catalog Section */}
      <MediaGrid
        title="Tendances de la semaine"
        items={trending}
        customStreamIds={customStreamIds}
      />

      {/* Middle Banner Adsterra Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Popular Movies Section */}
      <MediaGrid
        title="Films Populaires"
        items={movies}
        customStreamIds={customStreamIds}
      />

      {/* Popular TV Shows Section */}
      <MediaGrid
        title="Séries à Succès"
        items={tvShows}
        customStreamIds={customStreamIds}
      />

      {/* Bottom Native Adsterra Ad */}
      <AdsterraAd type="native" />
    </div>
  );
}
