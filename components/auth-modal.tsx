'use client';

import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (user: { name: string; email: string }) => void;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Veuillez remplir tous les champs.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const displayName = email.split('@')[0] || 'Utilisateur';
        const userObj = { name: displayName, email };
        if (typeof window !== 'undefined') {
          localStorage.setItem('zora_user_session', JSON.stringify(userObj));
        }
        setSuccessMsg('Connexion réussie ! Bienvenue sur ZORA.');
        if (onSuccess) onSuccess(userObj);
        setTimeout(() => {
          onClose();
        }, 1200);
      }, 800);
    } else {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setErrorMsg('Veuillez remplir tous les champs.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (!acceptTerms) {
        setErrorMsg('Veuillez accepter les conditions d\'utilisation.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const userObj = { name: username, email };
        if (typeof window !== 'undefined') {
          localStorage.setItem('zora_user_session', JSON.stringify(userObj));
        }
        setSuccessMsg('Compte créé avec succès ! Vos identifiants sont enregistrés.');
        if (onSuccess) onSuccess(userObj);
        setTimeout(() => {
          onClose();
        }, 1200);
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-zora-card/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl transition-all">
        
        {/* Top Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zora-gradient p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-zora-bg rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                {mode === 'login' ? 'Connexion' : 'Créer un compte'}
              </h3>
              <p className="text-xs text-purple-300/70">Zora Streaming Premium</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setMode('login')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se connecter</span>
            </button>
            <button
              onClick={() => setMode('register')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'register'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer un compte</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Nom d'utilisateur</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: AlexStream"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                {mode === 'login' ? 'Email ou Pseudo' : 'Adresse Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'login' ? (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-purple-400 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
            ) : (
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500"
                  />
                  <span>J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 transition-all duration-200 flex items-center justify-center gap-2 border border-purple-400/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="text-center pt-2 border-t border-white/5 text-xs text-gray-400">
            {mode === 'login' ? (
              <p>
                Vous n'avez pas encore de compte ?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-purple-400 font-semibold hover:underline ml-1"
                >
                  S'inscrire gratuitement
                </button>
              </p>
            ) : (
              <p>
                Vous avez déjà un compte ?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-purple-400 font-semibold hover:underline ml-1"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
