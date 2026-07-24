'use client';

import React, { useState, useEffect } from 'react';
import { authenticateAdmin, isAdminAuthenticated, logoutAdmin } from '@/lib/admin-auth';
import { fetchMediaDetails, fetchSeasonDetails, getTMDBImageUrl, TMDBItem } from '@/lib/tmdb';
import { getAllMediaLinks, saveMediaLink, deleteMediaLink, getAdsterraConfig, saveAdsterraConfig } from '@/lib/store';
import { MediaLink } from '@/lib/supabase';
import { Shield, Lock, Film, Tv, Plus, Trash2, ExternalLink, Play, CheckCircle2, AlertCircle, RefreshCw, LogOut, Settings } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Form states for adding/editing stream link
  const [tmdbIdInput, setTmdbIdInput] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [seasonNum, setSeasonNum] = useState(1);
  const [episodeNum, setEpisodeNum] = useState(1);
  const [mp4UrlInput, setMp4UrlInput] = useState('');

  // Preview & Status states
  const [tmdbPreview, setTmdbPreview] = useState<TMDBItem | null>(null);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // List of all stream mappings
  const [streamLinks, setStreamLinks] = useState<MediaLink[]>([]);
  const [activeTab, setActiveTab] = useState<'streams' | 'adsterra'>('streams');

  // Adsterra Configuration State
  const [adsterra728, setAdsterra728] = useState('');
  const [adsterra300, setAdsterra300] = useState('');
  const [adsterraPopunder, setAdsterraPopunder] = useState('');
  const [adsterraDirectLink, setAdsterraDirectLink] = useState('');
  const [adsterraSuccess, setAdsterraSuccess] = useState('');
  const [isSavingAdsterra, setIsSavingAdsterra] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLinks();
      loadAdsterra();
    }
  }, [isAuthenticated]);

  async function loadLinks() {
    const data = await getAllMediaLinks();
    setStreamLinks(data);
  }

  async function loadAdsterra() {
    const config = await getAdsterraConfig();
    setAdsterra728(config.banner_728x90 || '');
    setAdsterra300(config.banner_300x250 || '');
    setAdsterraPopunder(config.popunder || '');
    setAdsterraDirectLink(config.directlink || '');
  }

  const handleSaveAdsterra = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdsterra(true);
    setAdsterraSuccess('');

    await saveAdsterraConfig({
      banner_728x90: adsterra728,
      banner_300x250: adsterra300,
      popunder: adsterraPopunder,
      directlink: adsterraDirectLink,
      enabled: true,
    });

    setIsSavingAdsterra(false);
    setAdsterraSuccess('Configuration Adsterra sauvegardée dans Supabase avec succès !');
    setTimeout(() => setAdsterraSuccess(''), 4000);
  };


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (authenticateAdmin(usernameInput, passwordInput)) {
      setIsAuthenticated(true);
    } else {
      setLoginError('Nom d\'utilisateur ou mot de passe incorrect.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
  };

  // Lookup TMDB details when TMDB ID changes
  const handleTmdbLookup = async () => {
    if (!tmdbIdInput.trim()) return;
    setIsFetchingTmdb(true);
    setFetchError('');
    setTmdbPreview(null);

    const data = await fetchMediaDetails(tmdbIdInput.trim(), mediaType);
    setIsFetchingTmdb(false);

    if (data && (data.title || data.name)) {
      setTmdbPreview(data);
    } else {
      setFetchError(`Impossible de trouver un ${mediaType === 'movie' ? 'film' : 'série'} avec le TMDB ID: ${tmdbIdInput}`);
    }
  };

  const handleSaveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');

    if (!tmdbIdInput.trim() || !mp4UrlInput.trim()) {
      alert('Veuillez remplir le TMDB ID et le lien MP4.');
      return;
    }

    const title = tmdbPreview
      ? (tmdbPreview.title || tmdbPreview.name || `TMDB #${tmdbIdInput}`)
      : `TMDB #${tmdbIdInput}`;

    await saveMediaLink({
      tmdb_id: Number(tmdbIdInput.trim()),
      media_type: mediaType,
      season_number: mediaType === 'tv' ? Number(seasonNum) : null,
      episode_number: mediaType === 'tv' ? Number(episodeNum) : null,
      title,
      poster_path: tmdbPreview?.poster_path || null,
      backdrop_path: tmdbPreview?.backdrop_path || null,
      mp4_url: mp4UrlInput.trim(),
    });

    setSaveSuccess(`Flux MP4 pour "${title}" enregistré avec succès!`);
    setMp4UrlInput('');
    setTmdbIdInput('');
    setTmdbPreview(null);
    loadLinks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lien MP4 ?')) {
      await deleteMediaLink(id);
      loadLinks();
    }
  };

  /* Login Screen */
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-zora-card border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zora-gradient p-0.5 shadow-xl shadow-purple-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-zora-bg rounded-[14px] flex items-center justify-center">
                <Shield className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white">Connexion Administrateur</h1>
            <p className="text-xs text-gray-400">
              Accédez au panneau de gestion des liens MP4 et paramètres Zora.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Identifiant admin"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-zora-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-500/30 transition-all"
            >
              Se Connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* Authenticated Admin Dashboard */
  return (
    <div className="py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Panneau d'Administration
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Zora Admin Menu</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('streams')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'streams'
                  ? 'bg-zora-gradient text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Gestion des Liens MP4
            </button>
            <button
              onClick={() => setActiveTab('adsterra')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'adsterra'
                  ? 'bg-zora-gradient text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Publicités Adsterra
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {activeTab === 'streams' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form to Add MP4 Link by TMDB ID */}
          <div className="lg:col-span-1 bg-zora-card border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Ajouter un Lien MP4
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Associez le fichier MP4 de votre hébergeur à l'ID TMDB d'un film ou d'une série.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveStream} className="space-y-4">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Type de Média
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('movie');
                      setTmdbPreview(null);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      mediaType === 'movie'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Film</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('tv');
                      setTmdbPreview(null);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      mediaType === 'tv'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Tv className="w-4 h-4" />
                    <span>Série TV</span>
                  </button>
                </div>
              </div>

              {/* TMDB ID Input with Search/Lookup button */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  TMDB ID du {mediaType === 'movie' ? 'Film' : 'Série'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tmdbIdInput}
                    onChange={(e) => setTmdbIdInput(e.target.value)}
                    placeholder="Ex: 550 (Fight Club)"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleTmdbLookup}
                    disabled={isFetchingTmdb}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1"
                  >
                    {isFetchingTmdb ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Vérifier'}
                  </button>
                </div>
                {fetchError && <p className="text-[11px] text-rose-400 mt-1">{fetchError}</p>}
              </div>

              {/* TMDB Preview Box if lookup succeeded */}
              {tmdbPreview && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3">
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    <img
                      src={getTMDBImageUrl(tmdbPreview.poster_path, 'w500')}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {tmdbPreview.title || tmdbPreview.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                      {tmdbPreview.overview}
                    </p>
                  </div>
                </div>
              )}

              {/* If TV Series: Ask for Season & Episode */}
              {mediaType === 'tv' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                      Saison #
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={seasonNum}
                      onChange={(e) => setSeasonNum(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                      Épisode #
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={episodeNum}
                      onChange={(e) => setEpisodeNum(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* MP4 Host Link Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Lien Fichier MP4 (Host URL)
                </label>
                <input
                  type="url"
                  value={mp4UrlInput}
                  onChange={(e) => setMp4UrlInput(e.target.value)}
                  placeholder="https://mon-hebergeur.com/video.mp4"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-zora-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer le Lien MP4</span>
              </button>

            </form>
          </div>

          {/* Right Column: Table of all added custom MP4 streams */}
          <div className="lg:col-span-2 bg-zora-card border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Flux MP4 Configurés ({streamLinks.length})</h2>
                <p className="text-xs text-gray-400">Liste des correspondances TMDB ID → Fichier MP4</p>
              </div>
              <button
                onClick={loadLinks}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Actualiser la liste"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {streamLinks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px]">
                      <th className="py-3 px-2">Affiche</th>
                      <th className="py-3 px-2">Titre</th>
                      <th className="py-3 px-2">TMDB ID</th>
                      <th className="py-3 px-2">Type / Épisode</th>
                      <th className="py-3 px-2">Lien MP4</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {streamLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-2">
                          <div className="w-8 h-12 rounded overflow-hidden bg-gray-800">
                            <img
                              src={getTMDBImageUrl(link.poster_path || null, 'w500')}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-white max-w-[150px] truncate">
                          {link.title}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-purple-300">
                          {link.tmdb_id}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300 mr-1">
                            {link.media_type === 'movie' ? 'Film' : 'Série'}
                          </span>
                          {link.media_type === 'tv' && (
                            <span className="font-mono text-pink-400 text-[10px]">
                              S{link.season_number || 1}E{link.episode_number || 1}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-gray-400 max-w-[180px] truncate">
                          {link.mp4_url}
                        </td>
                        <td className="py-2.5 px-2 text-right space-x-2">
                          <a
                            href={`/watch/${link.media_type}/${link.tmdb_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 text-[11px] font-bold transition-all"
                          >
                            <Play className="w-3 h-3 fill-purple-300" />
                            <span>Tester</span>
                          </a>
                          <button
                            onClick={() => link.id && handleDelete(link.id)}
                            className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">
                Aucun lien MP4 configuré. Utilisez le formulaire à gauche pour ajouter votre premier flux.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Adsterra Configuration Tab */
        <div className="max-w-3xl mx-auto bg-zora-card border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configuration des Publicités Adsterra
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Insérez vos scripts et codes bannières fournis par Adsterra pour monétiser Zora.
            </p>
          </div>

          {adsterraSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{adsterraSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdsterra} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Bannière Adsterra Header (728x90 HTML/Script)
              </label>
              <textarea
                rows={3}
                value={adsterra728}
                onChange={(e) => setAdsterra728(e.target.value)}
                placeholder='<script type="text/javascript"> ... </script>'
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Bannière Adsterra Rectangulaire (300x250 HTML/Script)
              </label>
              <textarea
                rows={3}
                value={adsterra300}
                onChange={(e) => setAdsterra300(e.target.value)}
                placeholder='<script type="text/javascript"> ... </script>'
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Adsterra Popunder Script Container
              </label>
              <textarea
                rows={3}
                value={adsterraPopunder}
                onChange={(e) => setAdsterraPopunder(e.target.value)}
                placeholder='<script type="text/javascript" src="//pl12345.highcpmgate.com/..."></script>'
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Adsterra SmartLink / DirectLink URL (Pour le Pass Vidéo 2 Étapes)
              </label>
              <input
                type="url"
                value={adsterraDirectLink}
                onChange={(e) => setAdsterraDirectLink(e.target.value)}
                placeholder="https://www.highcpmgate.com/xxxxx..."
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingAdsterra}
              className="py-3 px-6 rounded-xl bg-zora-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-500/30 transition-all flex items-center gap-2"
            >
              {isSavingAdsterra ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer les Paramètres Ads</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
