
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, OrderStatus, Table, Sale, InventoryItem, PrinterSettings } from '../types';
import { useToast } from '../hooks/useToast';
import { generateKitchenPrediction, parseKitchenCommand } from '../services/geminiService';
import { SparklesIcon, RefreshIcon, MicIcon, WaveIcon, SpinnerIcon, CheckCircleIcon } from './Icons';

interface KitchenMonitorProps {
    orders: Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    tables: Table[];
    sales: Sale[];
    inventory: InventoryItem[];
    printerSettings: PrinterSettings;
}

const OrderCard: React.FC<{ 
    order: Order; 
    tables: Table[]; 
    onReady: () => void;
    kitchenTimer: number; 
}> = ({ order, tables, onReady, kitchenTimer }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [remainingTime, setRemainingTime] = useState((kitchenTimer ?? 12) * 60);

    const countdownStartSeconds = useMemo(() => (kitchenTimer ?? 12) * 60, [kitchenTimer]);
    const warningThresholdSeconds = useMemo(() => countdownStartSeconds * 0.4, [countdownStartSeconds]);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const createdAt = new Date(order.createdAt).getTime();
            const elapsed = Math.floor((now - createdAt) / 1000);
            setElapsedTime(elapsed);
            setRemainingTime(countdownStartSeconds - elapsed);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [order.createdAt, countdownStartSeconds]);

    // Elapsed time formatting
    const elapsedMinutes = Math.floor(elapsedTime / 60);
    const elapsedSeconds = elapsedTime % 60;

    // Remaining time formatting
    const isUrgent = remainingTime <= 0;
    const absRemaining = Math.abs(remainingTime);
    const remainingMinutes = Math.floor(absRemaining / 60);
    const remainingSeconds = absRemaining % 60;
    const remainingTimeStr = `${isUrgent ? '+' : ''}${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    
    const isWarning = !isUrgent && remainingTime <= warningThresholdSeconds;

    const cardStyles = useMemo(() => {
        if (isUrgent) {
            return {
                headerBg: 'bg-red-600',
                textColor: 'text-white',
                subTextColor: 'text-red-100',
                pulse: 'animate-pulse shadow-red-500/50 shadow-xl',
                timerBg: 'bg-red-800',
                btnColor: 'bg-red-700 hover:bg-red-800'
            };
        }
        if (isWarning) {
            return {
                headerBg: 'bg-orange-500',
                textColor: 'text-white',
                subTextColor: 'text-orange-100',
                pulse: '',
                timerBg: 'bg-orange-700',
                btnColor: 'bg-orange-600 hover:bg-orange-700'
            };
        }
        return {
            headerBg: 'bg-emerald-600',
            textColor: 'text-white',
            subTextColor: 'text-emerald-100',
            pulse: '',
            timerBg: 'bg-emerald-800',
            btnColor: 'bg-emerald-600 hover:bg-emerald-700'
        };
    }, [isUrgent, isWarning]);


    const getDestination = () => {
        if (order.orderType === 'dine-in') {
            const table = tables.find(t => t.id === order.tableId);
            return table ? table.name : 'Mesa ??';
        }
        if (order.orderType === 'delivery') return `🛵 ${order.deliveryInfo?.name?.split(' ')[0]}`;
        return `🛍️ ${order.toGoName?.split(' ')[0]}`;
    };

    return (
        <div className={`bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden flex flex-col transition-all transform hover:scale-[1.02] ${cardStyles.pulse}`}>
            {/* Cabecera Sólida */}
            <div className={`${cardStyles.headerBg} p-3 flex justify-between items-center`}>
                <div>
                    <h3 className={`text-2xl font-black ${cardStyles.textColor} drop-shadow-md font-bangers tracking-wide`}>{getDestination()}</h3>
                    <p className={`text-xs font-mono font-bold ${cardStyles.subTextColor}`}>#{order.id.slice(-4)}</p>
                </div>
                <div className="text-right">
                     <div className={`text-2xl font-mono font-bold ${cardStyles.textColor} drop-shadow-sm`}>
                        {remainingTimeStr}
                    </div>
                    <div className={`text-[10px] font-bold ${cardStyles.subTextColor} uppercase`}>
                        Tiempo Restante
                    </div>
                </div>
            </div>

            {/* Cuerpo de la Comanda */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto bg-[#1a1a1a]">
                {order.items.map(item => (
                    <div key={item.instanceId} className={`p-2 rounded border-l-4 ${!item.isPrinted ? 'border-amber-500 bg-amber-900/10' : 'border-gray-600 bg-black/20'}`}>
                        <div className="flex items-start justify-between">
                            <p className="font-bold text-gray-100 text-lg leading-tight">
                                <span className="text-[var(--accent-yellow)] mr-1">{item.quantity}x</span> {item.name}
                            </p>
                        </div>
                        <div className="pl-6 text-sm space-y-0.5 mt-1">
                            {item.selectedChoice && <div className="text-gray-400">• {item.selectedChoice}</div>}
                            {item.selectedWingSauces.length > 0 && <div className="text-red-400 font-semibold">• {item.selectedWingSauces.map(s => s.name).join(', ')}</div>}
                            {item.selectedFrySauces.length > 0 && <div className="text-amber-400">• {item.selectedFrySauces.map(s => s.name).join(', ')}</div>}
                            {item.selectedGelatoFlavors.length > 0 && <div className="text-sky-400">• {item.selectedGelatoFlavors.join(', ')}</div>}
                            {item.notes && <div className="font-bold text-amber-300 bg-amber-900/30 p-1 rounded mt-1 text-xs uppercase">⚠️ {item.notes}</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pie de página con Tiempo Total y Botón */}
            <div className="p-3 bg-black/40 border-t border-gray-800">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs text-gray-500">En proceso:</span>
                    <span className="text-xs font-mono text-gray-300 font-bold">{String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')} min</span>
                </div>
                <button onClick={onReady} className={`w-full py-3 ${cardStyles.btnColor} text-white font-black text-xl rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wider`}>
                    <CheckCircleIcon className="w-6 h-6" /> ¡LISTO!
                </button>
            </div>
        </div>
    );
};

export const KitchenMonitor: React.FC<KitchenMonitorProps> = ({ orders, updateOrderStatus, tables, sales, inventory, printerSettings }) => {
    const [aiPrediction, setAiPrediction] = useState('');
    const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { addToast } = useToast();

    const activeOrders = useMemo(() => orders.filter(o => o.status === 'open').sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [orders]);
    const recentCompletedOrders = useMemo(() => orders.filter(o => o.status === 'ready').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [orders]);

    const previousOrdersCount = useRef(activeOrders.length);

    useEffect(() => {
        const sound = document.getElementById('notification-sound') as HTMLAudioElement;
        if (activeOrders.length > previousOrdersCount.current && sound) {
            sound.play().catch(e => console.error("Error playing new order notification:", e));
        }
        previousOrdersCount.current = activeOrders.length;
    }, [activeOrders.length]);

    const handleFetchPrediction = async () => {
        setIsLoadingPrediction(true);
        try {
            const prediction = await generateKitchenPrediction(sales, inventory);
            setAiPrediction(prediction);
        } catch (e) {
            setAiPrediction('Error al obtener predicción de IA.');
        } finally {
            setIsLoadingPrediction(false);
        }
    };

    useEffect(() => {
        // Cargar predicción inicial
        // handleFetchPrediction(); // Descomentar si se quiere automático al inicio
    }, []);

    const playAlertSound = () => {
        const sound = document.getElementById('kitchen-bell-sound') as HTMLAudioElement;
        sound?.play().catch(e => console.error("Error playing sound", e));
        addToast("🔔 ¡OÍDO COCINA!", "info");
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return addToast('Reconocimiento de voz no soportado.', 'error');

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CO';
        recognitionRef.current = recognition;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => addToast('Error de micrófono.', 'error');
        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            addToast(`Procesando: "${transcript}"`, 'info');
            const command = await parseKitchenCommand(transcript, activeOrders.map(o => ({
                id: o.id,
                tableName: tables.find(t => t.id === o.tableId)?.name || o.deliveryInfo?.name || o.toGoName || 'N/A',
                items: o.items.map(i => i.name),
            })));

            if (command?.action === 'ready' && command.orderId) {
                updateOrderStatus(command.orderId, 'ready');
            } else if (command?.action === 'open' && command.orderId) {
                updateOrderStatus(command.orderId, 'open');
            } else {
                addToast(command?.message || 'No entendí el comando.', 'error');
            }
        };
        recognition.start();
    };

    return (
        <div className="h-full flex flex-col gap-6 p-2">
            <div className="flex justify-between items-center flex-wrap gap-4 bg-black/20 p-4 rounded-xl border border-gray-800">
                <h2 className="text-4xl font-bold text-white font-bangers tracking-wide">MONITOR DE COCINA</h2>
                <div className="flex gap-3">
                    <button onClick={playAlertSound} className="px-6 py-3 bg-amber-500 text-black font-black text-sm rounded-xl shadow-lg hover:bg-amber-400 transition-transform hover:scale-105 uppercase tracking-wider flex items-center gap-2">
                        🔔 Timbre
                    </button>
                    <button onClick={toggleListening} className={`px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center gap-2 transition-all ${isListening ? 'bg-red-600 animate-pulse ring-4 ring-red-500/30' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isListening ? <WaveIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        {isListening ? 'ESCUCHANDO...' : 'VOZ'}
                    </button>
                </div>
            </div>

            {aiPrediction && (
                <div className="bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-purple-300 flex items-center gap-2"><SparklesIcon /> Predicción del Chef (IA)</h3>
                        <button onClick={handleFetchPrediction} disabled={isLoadingPrediction} className="text-purple-300 hover:text-white p-1 rounded-full disabled:opacity-50">
                            {isLoadingPrediction ? <SpinnerIcon className="w-4 h-4" /> : <RefreshIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-sm text-purple-200 whitespace-pre-line">{aiPrediction}</p>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeOrders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            tables={tables} 
                            onReady={() => updateOrderStatus(order.id, 'ready')}
                            kitchenTimer={printerSettings.kitchenTimer ?? 12}
                        />
                    ))}
                    {activeOrders.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-600">
                            <CheckCircleIcon className="w-16 h-16 mb-4 opacity-20"/>
                            <p className="text-xl font-bold">Todo en orden, Chef.</p>
                            <p className="text-sm">Esperando nuevas comandas...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-none border-t border-gray-800 pt-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4"/> Historial Reciente
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {recentCompletedOrders.map(order => (
                    <div key={order.id} className="bg-gray-800/50 p-2 rounded-lg text-center border border-gray-700 hover:border-gray-500 transition-colors group">
                        <p className="font-bold text-xs text-white truncate">{tables.find(t=>t.id === order.tableId)?.name || order.deliveryInfo?.name || order.toGoName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">#{order.id.slice(-4)}</p>
                        <button onClick={() => updateOrderStatus(order.id, 'open')} className="mt-1 text-[10px] text-sky-500 hover:text-sky-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            ↺ REABRIR
                        </button>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};
