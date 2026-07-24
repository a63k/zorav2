import React from 'react';
import HeroCarousel from '@/components/hero-carousel';
import ContinueWatchingCarousel from '@/components/continue-watching-carousel';
import MediaGrid from '@/components/media-grid';
import AdsterraAd from '@/components/adsterra-ad';
import TopTenSection from '@/components/top-ten-section';
import GenreGrid from '@/components/genre-grid';
import VipPromoBanner from '@/components/vip-promo-banner';
import { fetchTrending, fetchPopularMovies, fetchPopularTVShows } from '@/lib/tmdb';
import { getAllMediaLinks } from '@/lib/store';

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
    <div className="space-y-12 py-4">
      {/* Top Banner Adsterra Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Hero Carousel */}
      <HeroCarousel items={trending.slice(0, 8)} />

      {/* Continue Watching Carousel (Renders ONLY if unfinished videos exist) */}
      <ContinueWatchingCarousel />

      {/* Nakastream-style TOP 10 Ranking Section with Giant Numbers */}
      <TopTenSection items={trending} />

      {/* Zora VIP Promo Section */}
      <VipPromoBanner />

      {/* Trending Media Catalog Section */}
      <div id="trending">
        <MediaGrid
          title="Tendances de la semaine"
          items={trending}
          customStreamIds={customStreamIds}
        />
      </div>

      {/* Middle Banner Adsterra Ad */}
      <AdsterraAd type="banner_728x90" />

      {/* Nakastream-style Category Tiles Grid */}
      <div id="genres">
        <GenreGrid />
      </div>

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
