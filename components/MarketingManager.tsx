import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';
import { MegaphoneIcon, RocketIcon, SparklesIcon, WhatsAppIcon, SpinnerIcon, LockIcon, CheckCircleIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { generateMarketingMessage } from '../services/geminiService';

interface MarketingManagerProps {
    customers: Customer[];
}

type Segment = 'sleepy' | 'vip' | 'new';

const SEGMENT_LABELS: Record<Segment, string> = {
    sleepy: '💤 Dormidos (Recuperación)',
    vip: '💎 VIP (Fidelización)',
    new: '🆕 Nuevos (Retención)'
};

const SEGMENT_DESCRIPTIONS: Record<Segment, string> = {
    sleepy: 'Clientes que no han visitado en los últimos 30 días.',
    vip: 'El top 20% de tus clientes que más han gastado.',
    new: 'Clientes con solo 1 visita registrada.'
};

export const MarketingManager: React.FC<MarketingManagerProps> = ({ customers }) => {
    const [selectedSegment, setSelectedSegment] = useState<Segment>('sleepy');
    const [offerText, setOfferText] = useState('');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    const segments = useMemo(() => {
        const now = new Date();
        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(now.getDate() - 30);

        const sleepy = customers.filter(c => c.lastVisit && new Date(c.lastVisit) < date30DaysAgo);
        const newCustomers = customers.filter(c => c.visitCount === 1);
        const sortedBySpend = [...customers].filter(c => c.visitCount > 1).sort((a, b) => b.totalSpent - a.totalSpent);
        const vipCount = Math.ceil(sortedBySpend.length * 0.2);
        const vip = sortedBySpend.slice(0, vipCount);

        return { sleepy, vip, new: newCustomers };
    }, [customers]);

    const currentList = segments[selectedSegment];
    const isMessageReady = generatedMessage.trim().length > 0;

    const handleGenerate = async () => {
        if (!offerText) {
            addToast('Escribe una oferta o idea clave.', 'error');
            return;
        }
        setIsGenerating(true);
        try {
            const msg = await generateMarketingMessage(SEGMENT_LABELS[selectedSegment], offerText);
            setGeneratedMessage(msg);
            addToast('¡Mensaje listo! Ahora envíalo a la lista.', 'success');
        } catch (e) {
            addToast('Error al generar mensaje.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const sendWhatsApp = (phone: string, name: string) => {
        if (!isMessageReady) {
            addToast('Primero genera un mensaje.', 'error');
            return;
        }
        const personalizedMsg = generatedMessage.replace(/\[nombre\]/gi, name);
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
        
        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(personalizedMsg)}`, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-[var(--black-bg)]">
            {/* Header Fixed */}
            <div className="flex items-center gap-4 p-4 border-b border-[var(--card-border)] flex-none bg-[var(--card-bg)] z-10 shadow-sm">
                <div className="p-3 bg-gradient-to-br from-pink-600 to-purple-700 rounded-xl text-white shadow-lg shadow-pink-900/30">
                    <MegaphoneIcon className="w-8 h-8"/>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-bangers tracking-wide">Marketing IA</h2>
                    <p className="text-gray-400 text-xs sm:text-base">Automatiza tu fidelización y recupera clientes.</p>
                </div>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-4 p-4 pb-24 lg:pb-4 h-full">
                    
                    {/* LEFT COLUMN: Segments & Editor */}
                    <div className="flex flex-col gap-4 lg:w-1/2 lg:h-full lg:overflow-y-auto custom-scrollbar pr-1">
                        
                        {/* Radar de Clientes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                            {(['sleepy', 'vip', 'new'] as Segment[]).map(seg => (
                                <button 
                                    key={seg}
                                    onClick={() => setSelectedSegment(seg)}
                                    className={`p-3 rounded-xl border transition-all text-left group ${selectedSegment === seg ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-white/5'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm ${selectedSegment === seg ? 'text-white' : 'text-gray-300'}`}>{SEGMENT_LABELS[seg].split(' ')[1]}</h3>
                                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs font-mono text-gray-400">{segments[seg].length}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">{SEGMENT_DESCRIPTIONS[seg]}</p>
                                </button>
                            ))}
                        </div>

                        {/* PASO 1: Panel de IA */}
                        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 flex flex-col shadow-lg relative flex-1 min-h-[450px]">
                            <div className="absolute top-0 right-0 bg-white/5 px-3 py-1 rounded-bl-lg text-xs font-bold text-gray-400">PASO 1: PREPARAR</div>
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <SparklesIcon className="text-purple-400"/> Redactor Creativo
                            </h3>
                            
                            <div className="space-y-3 flex-1 flex flex-col">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">¿Qué quieres ofrecer?</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={offerText}
                                            onChange={e => setOfferText(e.target.value)}
                                            placeholder="Ej: Postre gratis..."
                                            className="flex-1 p-2.5 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        />
                                        <button 
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                        >
                                            {isGenerating ? <SpinnerIcon className="animate-spin"/> : <SparklesIcon />}
                                            <span className="hidden sm:inline">{isGenerating ? '...' : 'Generar'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-black/20 rounded-lg p-3 border border-gray-700 relative flex flex-col min-h-[250px]">
                                    <label className="text-xs text-gray-500 mb-2 block font-semibold uppercase tracking-wider">Mensaje Generado:</label>
                                    <textarea 
                                        value={generatedMessage}
                                        onChange={e => setGeneratedMessage(e.target.value)}
                                        className="w-full flex-1 bg-transparent border-none text-white resize-none focus:ring-0 text-sm overflow-y-auto custom-scrollbar leading-relaxed"
                                        placeholder="Aquí aparecerá el mensaje redactado por la IA. Puedes editarlo antes de enviar."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Send Center */}
                    <div className={`flex flex-col gap-4 lg:w-1/2 lg:h-full ${isMessageReady ? '' : 'opacity-70'}`}>
                        <div className={`bg-[var(--card-bg)] rounded-xl border p-6 flex flex-col shadow-lg overflow-hidden transition-colors flex-1 min-h-[400px] ${isMessageReady ? 'border-emerald-500/50' : 'border-[var(--card-border)]'}`}>
                            <div className="flex justify-between items-center mb-4 flex-none">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <RocketIcon className={isMessageReady ? "text-emerald-400" : "text-gray-500"}/> 
                                        Centro de Campañas
                                    </h3>
                                </div>
                                {isMessageReady ? (
                                    <span className="text-xs bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                                        <CheckCircleIcon className="w-3 h-3"/> LISTO
                                    </span>
                                ) : (
                                    <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        <LockIcon className="w-3 h-3"/> ESPERA
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar relative">
                                {!isMessageReady && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4 rounded-lg border border-white/5">
                                        <SparklesIcon className="w-12 h-12 text-gray-600 mb-2"/>
                                        <p className="text-gray-400 font-bold">Genera un mensaje primero</p>
                                        <p className="text-gray-600 text-xs">El panel se activará cuando la IA termine.</p>
                                    </div>
                                )}

                                {currentList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                        <RocketIcon className="w-12 h-12 mb-2"/>
                                        <p>No hay clientes en este segmento.</p>
                                    </div>
                                ) : (
                                    currentList.map(customer => (
                                        <div key={customer.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                            <div>
                                                <p className="font-bold text-gray-200 text-sm">{customer.name}</p>
                                                <p className="text-xs text-gray-500">{customer.phone}</p>
                                            </div>
                                            <button 
                                                onClick={() => sendWhatsApp(customer.phone, customer.name)}
                                                disabled={!isMessageReady}
                                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border ${isMessageReady ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border-emerald-600/30 cursor-pointer shadow-lg shadow-emerald-900/10' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'}`}
                                            >
                                                <WhatsAppIcon className="w-4 h-4"/> Enviar
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};