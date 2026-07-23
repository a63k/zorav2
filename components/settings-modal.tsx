'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, User, Tv, Volume2, Shield, Check, Trash2, Sparkles, Monitor, Bell } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
  onUpdateUser?: (updated: { name: string; email: string }) => void;
}

export default function SettingsModal({ isOpen, onClose, user, onUpdateUser }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'playback' | 'subtitles' | 'privacy'>('account');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [quality, setQuality] = useState('1080p');
  const [autoNext, setAutoNext] = useState(true);
  const [audioLang, setAudioLang] = useState('vostfr');
  const [subSize, setSubSize] = useState('medium');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && onUpdateUser) {
      const updated = { name, email };
      onUpdateUser(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('zora_user_session', JSON.stringify(updated));
      }
    }
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1200);
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zora_watch_history');
      alert('Historique de lecture effacé avec succès.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zora-card/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl transition-all">
        
        {/* Header Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500" />

        {/* Modal Top Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Paramètres</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ZORA VIP
                </span>
              </h3>
              <p className="text-xs text-gray-400">Gérez vos préférences de compte et de lecture streaming</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Container with Sidebar Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px]">
          
          {/* Sidebar Tabs */}
          <div className="p-3 border-r border-white/5 space-y-1 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                activeTab === 'account'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Compte</span>
            </button>

            <button
              onClick={() => setActiveTab('playback')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                activeTab === 'playback'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Lecteur HD</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                activeTab === 'subtitles'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio & Subs</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                activeTab === 'privacy'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Confidentialité</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between">
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Tab 1: Account */}
              {activeTab === 'account' && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Informations du compte</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom d'affichage</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Adresse Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between">
                    <span>Statut de l'abonnement</span>
                    <span className="font-bold text-purple-400">Accès Premium Illimité</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Playback */}
              {activeTab === 'playback' && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Préférences du Lecteur Video</h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Qualité de streaming par défaut</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zora-card border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="auto">Automatique (Adaptatif)</option>
                      <option value="1080p">1080p Full HD (Recommandé)</option>
                      <option value="4k">4K Ultra HD (Connexion haute vitesse)</option>
                      <option value="720p">720p HD (Économie de données)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <div>
                      <div className="text-xs font-medium text-white">Lecture automatique</div>
                      <div className="text-[11px] text-gray-400">Lancer automatiquement l'épisode suivant</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoNext}
                      onChange={(e) => setAutoNext(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Audio & Subs */}
              {activeTab === 'subtitles' && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Langues et Sous-titres</h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Langue préférée</label>
                    <select
                      value={audioLang}
                      onChange={(e) => setAudioLang(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zora-card border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="vostfr">VOSTFR (Version Originale Sous-Titrée Français)</option>
                      <option value="vf">VF (Version Française)</option>
                      <option value="vo">VO (Version Originale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Taille des sous-titres</label>
                    <select
                      value={subSize}
                      onChange={(e) => setSubSize(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zora-card border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="small">Petits</option>
                      <option value="medium">Moyens (Par défaut)</option>
                      <option value="large">Grands</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 4: Privacy */}
              {activeTab === 'privacy' && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Confidentialité & Cache</h4>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">Historique de visionnage</div>
                        <div className="text-[11px] text-gray-400">Effacer tous les films et séries récents</div>
                      </div>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Effacer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Footer Button */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                {savedMsg && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Paramètres enregistrés !
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
