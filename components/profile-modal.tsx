'use client';

import React, { useEffect } from 'react';
import { X, User, Crown, Mail, Calendar, ShieldCheck, LogOut, Sparkles } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
  onLogout?: () => void;
}

export default function ProfileModal({ isOpen, onClose, user, onLogout }: ProfileModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-zora-card/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl transition-all">
        
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">Mon Profil</h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Avatar & Display Name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1 flex items-center justify-center shadow-xl shadow-purple-600/30">
                <div className="w-full h-full bg-zora-bg rounded-full flex items-center justify-center text-white text-2xl font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-400 border-2 border-zora-bg flex items-center justify-center text-black shadow-md">
                <Crown className="w-3.5 h-3.5 fill-black" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <span>{user.name}</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h4>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Membre Premium HD</span>
            </div>
          </div>

          {/* Profile Details List */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-purple-400" /> Nom d'utilisateur
              </span>
              <span className="font-semibold text-white">{user.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> Adresse Email
              </span>
              <span className="font-semibold text-white">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-gray-400 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Statut Compte
              </span>
              <span className="font-bold text-amber-400">Accès VIP Illimité</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Plateforme
              </span>
              <span className="font-semibold text-gray-200">Zora Streaming HD</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Se déconnecter</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold transition-all"
            >
              Fermer
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
