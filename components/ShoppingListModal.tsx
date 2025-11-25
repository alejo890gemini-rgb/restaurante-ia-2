
import React, { useState, useRef, useEffect } from 'react';
import type { InventoryItem, Sale, MenuItem, ShoppingList } from '../types';
import { useToast } from '../hooks/useToast';
import { XIcon, MicIcon, WaveIcon, ShoppingCartIcon, SpinnerIcon, WhatsAppIcon, PrinterIcon } from './Icons';
import { parseShoppingListCommand, generateShoppingList } from '../services/geminiService';

interface ShoppingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryItems: InventoryItem[];
    sales: Sale[];
    menuItems: MenuItem[];
}

type ShoppingListItemFromAI = {
    name: string;
    suggestedQuantity: string;
    justification: string;
};

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, inventoryItems, sales, menuItems }) => {
    const [step, setStep] = useState<'idle' | 'listening' | 'analyzing' | 'results'>('idle');
    const [list, setList] = useState<ShoppingList | null>(null);
    const recognitionRef = useRef<any>(null);
    const { addToast } = useToast();
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('idle');
            setList(null);
        }
    }, [isOpen]);

    const handleGenerateList = async () => {
        setStep('analyzing');
        try {
            const result = await generateShoppingList(inventoryItems, sales, menuItems);
            if (result && Object.keys(result).length > 0) {
                setList(result);
                setStep('results');
            } else if (result) {
                addToast('El inventario parece estar saludable. ¡No se generó una lista!', 'info');
                setStep('idle');
            } else {
                addToast('No se pudo generar la lista.', 'error');
                setStep('idle');
            }
        } catch (error) {
            addToast('Error al contactar la IA.', 'error');
            setStep('idle');
        }
    };

    const toggleListening = () => {
        if (step === 'listening') {
            recognitionRef.current?.stop();
            setStep('idle');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addToast('Reconocimiento de voz no soportado.', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CO';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => setStep('listening');
        recognition.onend = () => {
            if (step === 'listening') setStep('idle');
        };
        recognition.onerror = () => addToast('Error de micrófono.', 'error');
        
        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setStep('analyzing');
            const command = await parseShoppingListCommand(transcript);
            if (command?.action === 'generate_list') {
                await handleGenerateList();
            } else {
                addToast('No entendí. Intenta decir "genera la lista de compras".', 'info');
                setStep('idle');
            }
        };

        recognition.start();
    };

    const formatListForSharing = () => {
        if (!list) return '';
        let text = `🛒 *LISTA DE COMPRAS - LOCO ALITAS*\n_${new Date().toLocaleDateString()}_\n\n`;
        Object.entries(list).forEach(([category, items]) => {
            text += `*${category.toUpperCase()}*\n`;
            // FIX: Cast 'items' to the correct type to resolve 'forEach' does not exist on 'unknown' error.
            (items as ShoppingListItemFromAI[]).forEach(item => {
                text += `- ${item.name} (${item.suggestedQuantity})\n`;
            });
            text += '\n';
        });
        return text;
    };

    const handleCopyToClipboard = () => {
        const textToCopy = formatListForSharing();
        navigator.clipboard.writeText(textToCopy);
        addToast('Lista copiada al portapapeles', 'success');
    };

    const handleSendWhatsApp = () => {
        const text = formatListForSharing();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        const printableContent = listRef.current?.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Lista de Compras</title>');
            printWindow.document.write('<style>body{font-family:sans-serif; line-height:1.4;} h2{border-bottom:2px solid #000; padding-bottom:5px;} h3{margin-top:20px;} ul{list-style:none; padding-left:0;} li{margin-bottom:5px;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printableContent || '');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-6 w-full max-w-2xl h-full max-h-[80vh] flex flex-col border border-blue-500/30">
                <div className="flex justify-between items-center mb-4 flex-none">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingCartIcon /> Asistente de Compras IA</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    {step === 'idle' && (
                        <div className="text-center">
                            <button onClick={toggleListening} className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-transform hover:scale-105">
                                <MicIcon className="w-16 h-16 text-white" />
                            </button>
                            <p className="mt-4 text-gray-300">Presiona y dí "Genera la lista de compras"</p>
                            <button onClick={handleGenerateList} className="mt-2 text-sm text-blue-400 hover:underline">O haz clic aquí para generar</button>
                        </div>
                    )}
                    {step === 'listening' && (
                         <div className="text-center">
                            <button onClick={toggleListening} className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <WaveIcon className="w-16 h-16 text-white" />
                            </button>
                            <p className="mt-4 text-gray-300">Escuchando...</p>
                        </div>
                    )}
                    {step === 'analyzing' && (
                         <div className="text-center">
                            <SpinnerIcon className="w-24 h-24 text-blue-500"/>
                            <p className="mt-4 text-gray-300 text-lg font-semibold">Analizando inventario y ventas...</p>
                            <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
                        </div>
                    )}
                    {step === 'results' && list && (
                        <div className="w-full h-full flex flex-col overflow-hidden">
                            <div ref={listRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
                                <h2 className="text-2xl font-bold text-white">Lista de Compras Sugerida</h2>
                                {Object.entries(list).map(([category, items]) => (
                                    <div key={category}>
                                        <h3 className="text-lg font-bold text-blue-400 border-b-2 border-blue-800 pb-1 mb-2">{category}</h3>
                                        <ul className="space-y-2">
                                            {/* FIX: Cast 'items' to the correct type to resolve 'map' does not exist on 'unknown' error. */}
                                            {(items as ShoppingListItemFromAI[]).map(item => (
                                                <li key={item.name} className="p-3 bg-black/20 rounded-lg">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-white">{item.name}</span>
                                                        <span className="font-bold text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full text-sm">{item.suggestedQuantity}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 italic mt-1">↳ Razón: {item.justification}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-none pt-4 mt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row gap-2">
                                <button onClick={handleCopyToClipboard} className="flex-1 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg">Copiar</button>
                                <button onClick={handleSendWhatsApp} className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</button>
                                <button onClick={handlePrint} className="flex-1 text-sm bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"><PrinterIcon className="w-4 h-4" /> Imprimir</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
