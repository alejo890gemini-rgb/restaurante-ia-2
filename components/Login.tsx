

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { RestauranteIAIcon } from './Icons';
import type { PrinterSettings } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
  error: string;
  settings?: PrinterSettings; // Pass settings for branding
}

export const Login: React.FC<LoginProps> = ({ onLogin, error, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
      setIsSupabaseConnected(!!supabase);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const shopName = settings?.shopName || "Restaurante IA Pro";
  const slogan = settings?.shopSlogan || "La Mente Maestra en Tu Cocina";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--black-bg)] p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--primary-red)] blur-[100px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-sm p-8 space-y-8 bg-[var(--card-bg)] rounded-3xl shadow-2xl border border-[var(--card-border)] relative z-10 backdrop-blur-sm">
        <div className="text-center">
            <div className="mb-4 inline-block p-4 bg-black/30 rounded-full border border-gray-700 shadow-inner">
                <RestauranteIAIcon className="w-20 h-20 text-[var(--primary-red)]"/>
            </div>
            <h1 className="text-3xl font-bangers tracking-wider text-white drop-shadow-lg uppercase">
              {shopName}
            </h1>
          <p className="mt-2 text-gray-400 text-sm font-medium tracking-wide">{slogan}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="username" className="sr-only">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-4 py-3.5 border border-gray-700 bg-black/40 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-[var(--primary-red)] transition-all"
                placeholder="Usuario (ej. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-4 py-3.5 border border-gray-700 bg-black/40 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-[var(--primary-red)] transition-all"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200 text-sm animate-shake">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
              </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-black uppercase tracking-wider rounded-xl text-white bg-gradient-to-r from-[var(--primary-red)] to-[var(--dark-red)] hover:from-red-500 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all shadow-lg shadow-red-900/40 transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>

        <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-800">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'}`}></div>
            <span className="text-xs text-gray-500 font-mono">
                {isSupabaseConnected ? 'CONECTADO A NUBE (DB)' : 'MODO LOCAL (OFFLINE)'}
            </span>
        </div>
      </div>
    </div>
  );
};