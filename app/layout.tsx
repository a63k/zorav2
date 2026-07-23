import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Zora - Streaming Films & Séries HD',
  description: 'Regardez vos films et séries préférés en haute définition gratuitement sur Zora.',
  keywords: ['zora', 'streaming', 'films', 'series', 'tmdb', 'hd'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-zora-bg text-gray-100 min-h-screen flex flex-col antialiased selection:bg-purple-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
