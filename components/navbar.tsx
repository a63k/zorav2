'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Film, Tv, Sparkles, X, Play, LogIn, UserPlus, User, LogOut, ChevronDown, Bookmark, History, Sliders, Crown } from 'lucide-react';
import { searchMedia, TMDBItem, getTMDBImageUrl } from '@/lib/tmdb';
import AuthModal from '@/components/auth-modal';
import ProfileModal from '@/components/profile-modal';
import HistoryModal from '@/components/history-modal';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  // Profile dropdown, profile modal, and history modal state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check local session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zora_user_session');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zora_user_session');
    }
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    setProfileModalOpen(false);
    setHistoryModalOpen(false);
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        const data = await searchMedia(query);
        setResults(data.slice(0, 6));
        setIsSearching(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-zora-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zora-gradient p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zora-bg rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-wider zora-text-gradient uppercase">ZORA</span>
              <span className="text-[8px] sm:text-[9px] text-purple-400/80 -mt-1 font-semibold tracking-widest">STREAMING</span>
            </div>
          </Link>

          {/* Nakastream-style Center Navigation Menu */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-bold text-gray-300">
            <Link href="/" className="hover:text-purple-300 transition-colors">Catalogue</Link>
            <Link href="/#trending" className="hover:text-purple-300 transition-colors">Extraits</Link>
            <Link href="/#genres" className="hover:text-purple-300 transition-colors">Wishboard</Link>
            <button onClick={() => setHistoryModalOpen(true)} className="hover:text-purple-300 transition-colors">Watchlist</button>
            <Link href="/#genres" className="hover:text-purple-300 transition-colors">Calendrier</Link>
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                placeholder="Rechercher un film, une série..."
                className="w-full pl-10 pr-9 py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zora-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-400">Recherche en cours...</div>
                ) : results.length > 0 ? (
                  <div className="py-2 divide-y divide-white/5">
                    {results.map((item) => {
                      const title = item.title || item.name;
                      const date = item.release_date || item.first_air_date;
                      const year = date ? date.split('-')[0] : '';
                      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                            router.push(`/watch/${mediaType}/${item.id}`);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-purple-600/10 transition-colors text-left group"
                        >
                          <div className="w-10 h-14 relative rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                            <img
                              src={getTMDBImageUrl(item.poster_path, 'w500')}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white group-hover:text-purple-300 truncate">
                              {title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                              <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10">
                                {mediaType === 'movie' ? 'Film' : 'Série'}
                              </span>
                              {year && <span>{year}</span>}
                              {item.vote_average > 0 && (
                                <span className="text-amber-400 font-semibold">★ {item.vote_average.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">Aucun résultat trouvé pour "{query}"</div>
                )}
              </div>
            )}
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {currentUser ? (
              <div className="relative" ref={profileRef}>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 transition-all duration-200 group"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-0.5 flex items-center justify-center shadow-md">
                      <div className="w-full h-full bg-zora-bg rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {/* Online Dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zora-bg" />
                  </div>

                  <span className="max-w-[110px] truncate text-xs font-semibold text-gray-200 group-hover:text-white hidden sm:inline">
                    {currentUser.name}
                  </span>
                  
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-purple-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-purple-400' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2.5 w-64 sm:w-72 bg-zora-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    
                    {/* Header User Card */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-br from-purple-600/10 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                          <div className="w-full h-full bg-zora-bg rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {currentUser.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{currentUser.name}</span>
                            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          </div>
                          <div className="text-xs text-gray-400 truncate">{currentUser.email}</div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Membre VIP HD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="py-2 px-1.5 space-y-0.5 text-xs font-medium text-gray-300">
                      {/* Mon Profil */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-purple-600/15 hover:text-white transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-white">Mon Profil</span>
                        </div>
                        <span className="text-[10px] text-purple-300/80 font-bold px-2 py-0.5 rounded bg-purple-500/20">Voir</span>
                      </button>

                      {/* Ma Liste & Favoris */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          router.push('/#trending');
                        }}
                        className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-white/5 hover:text-white transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bookmark className="w-4 h-4 text-pink-400" />
                          <span>Ma Liste & Favoris</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">TMDB</span>
                      </button>

                      {/* Historique de visionnage */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setHistoryModalOpen(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-white/5 hover:text-white transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <History className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                          <span className="font-semibold text-white">Historique de lecture</span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 font-bold px-2 py-0.5 rounded bg-amber-500/20">Ouvrir</span>
                      </button>

                      {/* Qualité de Flux */}
                      <div className="px-3 py-2 rounded-xl flex items-center justify-between bg-white/[0.03]">
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <span>Qualité vidéo</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          1080p Ultra
                        </span>
                      </div>
                    </div>

                    {/* Footer Logout */}
                    <div className="p-1.5 border-t border-white/10 bg-white/[0.02]">
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Se connecter */}
                <button
                  onClick={() => openAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition-all duration-200 shadow-sm hover:shadow-purple-500/10 group"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  <span>Se connecter</span>
                </button>

                {/* Créer un compte */}
                <button
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/30 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:scale-110 transition-transform" />
                  <span className="hidden xs:inline sm:inline">Créer un compte</span>
                  <span className="inline xs:hidden sm:hidden">Inscription</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={(user) => setCurrentUser(user)}
      />

      {/* Profile Modal Popup */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* History Modal Popup */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </>
  );
}




