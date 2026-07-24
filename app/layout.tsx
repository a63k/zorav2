import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import AnnounceBanner from '@/components/announce-banner';

export const metadata: Metadata = {
  title: 'Zora - Streaming Films & Séries HD',
  description: 'Regardez vos films et séries préférés en haute définition gratuitement sur Zora.',
  keywords: ['zora', 'streaming', 'films', 'series', 'tmdb', 'hd', 'gratuit', 'nakastream'],
  authors: [{ name: 'Zora Streaming' }],
  metadataBase: new URL('https://www.zorastream.best'),
  openGraph: {
    title: 'Zora - Streaming Films & Séries HD',
    description: 'Regardez vos films et séries préférés en haute définition gratuitement sur Zora.',
    url: 'https://www.zorastream.best',
    siteName: 'Zora Streaming',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zora - Streaming Films & Séries HD',
    description: 'Regardez vos films et séries préférés en haute définition gratuitement sur Zora.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0718',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
      </head>
      <body className="bg-zora-bg text-gray-100 min-h-screen flex flex-col antialiased selection:bg-purple-500 selection:text-white">
        <AnnounceBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
