import React, { useState, useEffect } from 'react';
import type { Sale, User, MenuItem } from '../types';
import { getProfeLocoTip, ProfeLocoResponse } from '../services/geminiService';
import { BrainCircuitIcon, RefreshIcon } from './Icons';

interface ProfeLocoProps {
    sales: Sale[];
    users: User[];
    menuItems: MenuItem[];
    currentUser: User;
}

export const ProfeLoco: React.FC<ProfeLocoProps> = ({ sales, users, menuItems, currentUser }) => {
    const [advice, setAdvice] = useState<ProfeLocoResponse>({ tip: '', topWaiter: '' });
    const [isLoading, setIsLoading] = useState(true);

    const fetchAdvice = async () => {
        setIsLoading(true);
        try {
            const response = await getProfeLocoTip(sales, users, menuItems, currentUser);
            setAdvice(response);
        } catch (error) {
            console.error("Failed to fetch Profe Loco advice", error);
            setAdvice({ tip: 'Tuve un corto circuito. ¡Intenta de nuevo!', topWaiter: '?' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvice();
    }, []); // Fetch only on mount to avoid re-fetching on every sales update which can be frequent. User can refresh manually.

    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-6 rounded-xl shadow-lg border border-purple-500/30 relative flex flex-col md:flex-row items-start gap-6">
            <div className="absolute -top-3 -left-3 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-[var(--card-bg)]">
                <BrainCircuitIcon className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="pl-16 md:pl-0 flex-1">
                <h3 className="text-xl font-bold text-white mb-2 font-bangers tracking-wider">
                    <span className="text-purple-300">PROFE</span> <span className="text-sky-300">LOCO</span>
                </h3>
                {isLoading ? (
                    <p className="text-gray-300 italic animate-pulse">Cocinando un nuevo consejo...</p>
                ) : (
                    <p className="text-gray-200 text-lg leading-relaxed">"{advice.tip}"</p>
                )}
            </div>
            <div className="w-full md:w-auto flex md:flex-col items-center gap-4 md:gap-2 self-stretch border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase">Mesero del Día</p>
                    <p className="text-lg font-bold text-amber-400">{advice.topWaiter}</p>
                </div>
                <button
                    onClick={fetchAdvice}
                    disabled={isLoading}
                    className="mt-auto ml-auto md:ml-0 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors disabled:opacity-50"
                    title="Nuevo Consejo"
                >
                    <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
};