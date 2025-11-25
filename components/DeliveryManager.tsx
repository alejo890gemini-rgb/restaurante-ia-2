import React, { useState, useEffect } from 'react';
import type { Order, DeliveryStatus, PrinterSettings, DeliveryRate, DeliveryInfo } from '../types';
import { MotorcycleIcon, MapPinIcon, WhatsAppIcon, CheckCircleIcon, SparklesIcon, BookOpenIcon, BurgerIcon, TrashIcon, XIcon } from './Icons';
import { formatPrice } from '../utils/formatPrice';
import { normalizeAddressAI, extractDeliveryCostAI, generateDeliveryMetadata } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import { db } from '../services/db';

interface DeliveryManagerProps {
  orders: Order[];
  updateOrderDeliveryStatus: (orderId: string, status: DeliveryStatus, driverName?: string) => void;
  printerSettings?: PrinterSettings;
  deliveryRates: DeliveryRate[];
  saveDeliveryRate: (rate: Omit<DeliveryRate, 'id'>) => void;
  deleteDeliveryRate: (rateId: string) => void;
}

// --- MODALS ---

const CostParserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (cost: number, time: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAnalyze = async () => {
        if(!text) return;
        setIsProcessing(true);
        const result = await extractDeliveryCostAI(text);
        setIsProcessing(false);
        if (result && result.cost) {
            onConfirm(result.cost, result.time || '30 min');
        } else {
            alert("No se pudo detectar el precio. Ingrésalo manualmente.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] w-full max-w-md">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><SparklesIcon className="text-purple-400"/> Pegar Respuesta del Domiciliario</h3>
                <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    className="w-full bg-black/30 text-white border border-[var(--card-border)] rounded p-2 mb-4"
                    rows={4}
                    placeholder='Ej: "Vale 6mil y demoro 20 minutos"'
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded text-white">Cancelar</button>
                    <button onClick={handleAnalyze} disabled={isProcessing} className="px-4 py-2 bg-purple-600 rounded text-white flex items-center gap-2">
                        {isProcessing ? 'Analizando...' : 'Extraer Datos'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const RateHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    rates: DeliveryRate[];
    onDelete: (id: string) => void;
}> = ({ isOpen, onClose, rates, onDelete }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] w-full max-w-2xl max-h-[80vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpenIcon className="text-amber-400"/> Historial de Tarifas (Memoria)</h3>
                     <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon /></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto">
                     {rates.length === 0 ? (
                         <p className="text-center text-gray-500 py-10">Aún no hay tarifas guardadas. Completa domicilios para aprender.</p>
                     ) : (
                         <table className="w-full text-left text-gray-300">
                             <thead className="text-xs text-gray-500 uppercase border-b border-gray-700">
                                 <tr>
                                     <th className="px-4 py-2">Zona / Palabras Clave</th>
                                     <th className="px-4 py-2">Costo</th>
                                     <th className="px-4 py-2">Tiempo Prom.</th>
                                     <th className="px-4 py-2 text-right">Acción</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {rates.map(rate => (
                                     <tr key={rate.id} className="border-b border-gray-800 hover:bg-white/5">
                                         <td className="px-4 py-3 text-sm">{rate.keywords.join(', ')}</td>
                                         <td className="px-4 py-3 font-bold text-emerald-400">{formatPrice(rate.cost)}</td>
                                         <td className="px-4 py-3 text-sm">{rate.averageTime}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => onDelete(rate.id)} className="text-red-500 hover:text-red-300 p-1">
                                                 <TrashIcon className="w-4 h-4"/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     )}
                 </div>
             </div>
        </div>
    );
}

// --- COMPONENTS ---

const ProgressTracker: React.FC<{ currentStatus: DeliveryStatus }> = ({ currentStatus }) => {
    const steps: { status: DeliveryStatus; label: string }[] = [
        { status: 'quoting', label: 'Cotización' },
        { status: 'kitchen', label: 'Cocina' },
        { status: 'ready', label: 'Listo' },
        { status: 'on-way', label: 'En Ruta' },
        { status: 'delivered', label: 'Entregado' },
    ];

    let currentIndex = steps.findIndex(step => step.status === currentStatus);
    // Group some statuses visually
    if (currentStatus === 'customer_confirmation') currentIndex = 0;
    if (currentStatus === 'on-way') currentIndex = 3;

    return (
        <div className="flex items-center justify-between mt-2">
            {steps.map((step, index) => (
                <React.Fragment key={step.status}>
                    <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full transition-colors ${index <= currentIndex ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                        <div className={`text-[10px] mt-1 ${index <= currentIndex ? 'text-emerald-300 font-bold' : 'text-gray-500'}`}>{step.label}</div>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 transition-colors ${index < currentIndex ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


const DeliveryCard: React.FC<{
    order: Order;
    onUpdateStatus: (status: DeliveryStatus, driver?: string) => void;
    onUpdateCost: (orderId: string, cost: number, time: string) => void;
    onUpdateMetadata: (orderId: string, meta: { normalizedAddress: string, googleMapsLink: string }) => void;
    externalPhone: string;
    deliveryRates: DeliveryRate[];
    saveDeliveryRate: (rate: Omit<DeliveryRate, 'id'>) => void;
}> = ({ order, onUpdateStatus, onUpdateCost, onUpdateMetadata, externalPhone, deliveryRates, saveDeliveryRate }) => {
    const info = order.deliveryInfo;
    if (!info) return null;

    const [isParserOpen, setIsParserOpen] = useState(false);
    const [manualCost, setManualCost] = useState(info.deliveryCost?.toString() || '');
    const [manualTime, setManualTime] = useState(info.estimatedTime || '');
    const [suggestedRate, setSuggestedRate] = useState<DeliveryRate | null>(null);
    const [isAnalyzingAddress, setIsAnalyzingAddress] = useState(false);
    const { addToast } = useToast();

    const deliveryStatus = info.deliveryStatus || 'quoting'; 

    useEffect(() => {
        if (deliveryStatus === 'quoting' && info.address) {
            if (!info.googleMapsLink) {
                generateMetadata();
            } else if (!info.deliveryCost) {
                checkHistory(info.normalizedAddress);
            }
        }
    }, [info.address, deliveryRates]);

    const generateMetadata = async () => {
        setIsAnalyzingAddress(true);
        const meta = await generateDeliveryMetadata(info.address);
        onUpdateMetadata(order.id, meta);
        checkHistory(meta.normalizedAddress);
        setIsAnalyzingAddress(false);
    };

    const checkHistory = (addressToCheck?: string) => {
        if (!addressToCheck) return;
        const match = deliveryRates.find(r => r.keywords.some(k => addressToCheck.includes(k)));
        if (match) setSuggestedRate(match);
    };

    const applySuggestion = () => {
        if (suggestedRate) {
            onUpdateCost(order.id, suggestedRate.cost, suggestedRate.averageTime);
            setManualCost(suggestedRate.cost.toString());
            setManualTime(suggestedRate.averageTime);
            addToast('Tarifa aplicada del historial', 'success');
        }
    };

    const sendToDeliveryCompany = () => {
        const locationStr = info.googleMapsLink ? `\n📍 Ubicación: ${info.googleMapsLink}` : '';
        const msg = `Hola, solicito cotización de domicilio para:\n\n🏠 ${info.normalizedAddress || info.address}${locationStr}\n\nCliente: ${info.name}`;
        window.open(`https://wa.me/${externalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const sendToCustomer = () => {
        const totalFood = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
        const delivery = parseFloat(manualCost) || 0;
        const total = totalFood + delivery;
        const msg = `Hola ${info.name}, tu pedido ha sido cotizado.\n\n🍔 Pedido: ${formatPrice(totalFood)}\n🛵 Domicilio: ${formatPrice(delivery)}\n⏱ Tiempo aprox: ${manualTime}\n\n*TOTAL A PAGAR: ${formatPrice(total)}*\n\n¿Confirmas el pedido?`;
        const phone = info.phone.replace(/\D/g, '');
        window.open(`https://wa.me/57${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const notifyOnWay = () => {
        onUpdateStatus('on-way');
    };

    const confirmToDeliveryCompany = () => {
        onUpdateStatus('kitchen');
    };

    const handleSaveCost = async (autoToKitchen = false) => {
        const cost = parseFloat(manualCost);
        if (isNaN(cost)) {
            addToast('Ingresa un costo válido', 'error');
            return;
        }
        
        onUpdateCost(order.id, cost, manualTime || '30 min');
        
        if (autoToKitchen) {
            onUpdateStatus('kitchen');
            addToast('Enviado a cocina', 'success');
        }
    };

    const handleDirectAccept = () => {
        handleSaveCost(true);
    };

    const handleManualSaveHistory = async () => {
         const cost = parseFloat(manualCost);
         if (isNaN(cost)) return;
         onUpdateCost(order.id, cost, manualTime || '30 min');
         
         if (window.confirm("¿Guardar esta tarifa en historial?")) {
            const normalized = info.normalizedAddress || await normalizeAddressAI(info.address);
            saveDeliveryRate({keywords: [normalized], cost, averageTime: manualTime || '30 min', usageCount: 1});
        }
    }

    return (
        <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-lg flex flex-col gap-3 transition-transform hover:scale-[1.01] relative">
            <div className="flex justify-between items-start border-b border-[var(--card-border)] pb-2">
                <div>
                    <h4 className="font-bold text-white text-lg truncate">{info.name}</h4>
                     <p className="text-gray-400 text-xs truncate">{info.phone}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1 truncate mt-1" title={info.address}>
                        <MapPinIcon className="w-3 h-3 flex-shrink-0"/> 
                        {isAnalyzingAddress ? 'Analizando ubicación...' : (info.normalizedAddress || info.address)}
                    </p>
    
                    {info.googleMapsLink && (
                        <a href={info.googleMapsLink} target="_blank" className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 mt-1">
                            <SparklesIcon className="w-3 h-3"/> Ver en Google Maps
                        </a>
                    )}
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                     <p className="text-xs text-gray-500">#{order.id.slice(-4)}</p>
                </div>
            </div>
            
            <ProgressTracker currentStatus={deliveryStatus} />
            
            <div className="text-xs text-gray-300 bg-black/20 p-2 rounded-md">
                {order.items.map(item => (
                    <div key={item.instanceId}>{item.quantity}x {item.name}</div>
                ))}
            </div>

            {deliveryStatus === 'quoting' && (
                <div className="space-y-3">
                    {suggestedRate && !info.deliveryCost && (
                        <div className="bg-purple-900/20 border border-purple-500/30 p-2 rounded flex justify-between items-center">
                            <div className="text-xs text-purple-200">
                                <p>Sugerencia Histórica:</p>
                                <p className="font-bold">{formatPrice(suggestedRate.cost)} ({suggestedRate.averageTime})</p>
                            </div>
                            <button onClick={applySuggestion} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded">Aplicar</button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={sendToDeliveryCompany} className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 py-2 rounded text-xs border border-blue-600/30 flex items-center justify-center gap-1" title={externalPhone ? `Enviar a ${externalPhone}` : 'Configura el teléfono en Ajustes'}>
                            <WhatsAppIcon className="w-3 h-3"/> Cotizar (Prov.)
                        </button>
                        <button onClick={() => setIsParserOpen(true)} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 rounded text-xs border border-purple-600/30" title="Pegar respuesta IA">
                            <SparklesIcon className="w-3 h-3"/>
                        </button>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        <input type="number" placeholder="Costo" value={manualCost} onChange={e => setManualCost(e.target.value)} className="w-1/2 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm text-white"/>
                        <input type="text" placeholder="Tiempo" value={manualTime} onChange={e => setManualTime(e.target.value)} className="w-1/3 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm text-white"/>
                        <button onClick={handleManualSaveHistory} className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded" title="Guardar valor (Sin enviar a cocina)"><CheckCircleIcon className="w-4 h-4"/></button>
                    </div>
                    {(manualCost || info.deliveryCost) && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--card-border)]">
                            <button onClick={handleDirectAccept} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20">
                                <BurgerIcon className="w-4 h-4"/> Cliente Aceptó (Enviar a Cocina)
                            </button>
                            <button onClick={() => onUpdateStatus('customer_confirmation')} className="w-full text-xs text-gray-400 hover:text-white hover:underline py-1">
                                O gestionar confirmación por WhatsApp...
                            </button>
                        </div>
                    )}
                </div>
            )}

            {deliveryStatus === 'customer_confirmation' && (
                <div className="space-y-3">
                     <div className="text-center text-sm text-gray-300 bg-black/20 p-2 rounded">
                        <p>Confirmar datos con cliente:</p>
                        <div className="flex justify-between px-4 mt-1">
                            <span>Domicilio:</span>
                            <span className="text-emerald-400 font-bold">{formatPrice((info.deliveryCost || 0))}</span>
                        </div>
                        <div className="flex justify-between px-4">
                            <span>Total:</span>
                            <span className="text-white font-bold">{formatPrice((order.items.reduce((acc, i) => acc + i.price * i.quantity, 0)) + (info.deliveryCost || 0))}</span>
                        </div>
                    </div>
                    
                    <button onClick={sendToCustomer} className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 py-2 rounded text-xs border border-emerald-600/30 flex items-center justify-center gap-2">
                         <WhatsAppIcon className="w-4 h-4"/> Enviar Total a Cliente (WhatsApp)
                    </button>

                    <div className="flex gap-2 pt-2">
                        <button onClick={() => onUpdateStatus('quoting')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs">Atrás</button>
                        <button onClick={confirmToDeliveryCompany} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-xs font-bold">
                             ¡Confirmado! (Cocina)
                        </button>
                    </div>
                </div>
            )}
            
            {(deliveryStatus === 'kitchen' || deliveryStatus === 'ready' || deliveryStatus === 'on-way') && (
                 <div className="mt-2 pt-2 border-t border-[var(--card-border)] space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                         <span>Dom: {formatPrice(info.deliveryCost || 0)}</span>
                         <span>{info.estimatedTime}</span>
                     </div>
                    {deliveryStatus === 'kitchen' && (
                        <button onClick={() => onUpdateStatus('ready')} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-semibold text-xs">
                            Marcar Listo (Empacado)
                        </button>
                    )}
                    {deliveryStatus === 'ready' && (
                        <button onClick={notifyOnWay} className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-semibold text-xs flex items-center justify-center gap-2">
                             <WhatsAppIcon className="w-4 h-4"/> Entregar a Domiciliario
                        </button>
                    )}
                    {deliveryStatus === 'on-way' && (
                         <button onClick={() => onUpdateStatus('delivered')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-semibold text-xs flex items-center justify-center gap-2">
                            <CheckCircleIcon /> Confirmar Entrega Final
                        </button>
                    )}
                </div>
            )}

            <CostParserModal isOpen={isParserOpen} onClose={() => setIsParserOpen(false)} onConfirm={(c, t) => { 
                setManualCost(c.toString()); 
                setManualTime(t); 
                setIsParserOpen(false);
            }} />
        </div>
    );
};

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({ orders, updateOrderDeliveryStatus, printerSettings, deliveryRates, saveDeliveryRate, deleteDeliveryRate }) => {
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    
    const handleCostUpdate = async (orderId: string, cost: number, time: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.deliveryInfo) {
            const updatedInfo = { ...order.deliveryInfo, deliveryCost: cost, estimatedTime: time };
             const updatedOrder = { ...order, deliveryInfo: updatedInfo };
             await db.upsert('orders', updatedOrder);
        }
    };

    const handleMetadataUpdate = async (orderId: string, meta: { normalizedAddress: string, googleMapsLink: string }) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.deliveryInfo) {
            const updatedInfo = { ...order.deliveryInfo, ...meta };
            const updatedOrder = { ...order, deliveryInfo: updatedInfo };
            await db.upsert('orders', updatedOrder);
        }
    };

    const externalPhone = printerSettings?.deliveryProviderPhone || '573000000000';

    const activeOrders = orders.filter(o => o.orderType === 'delivery' && o.status !== 'cancelled' && o.status !== 'completed');

    const quotingOrders = activeOrders.filter(o => !o.deliveryInfo?.deliveryStatus || o.deliveryInfo?.deliveryStatus === 'quoting' || o.deliveryInfo?.deliveryStatus === 'customer_confirmation');
    const kitchenOrders = activeOrders.filter(o => o.deliveryInfo?.deliveryStatus === 'kitchen');
    const readyOrders = activeOrders.filter(o => o.deliveryInfo?.deliveryStatus === 'ready' || o.deliveryInfo?.deliveryStatus === 'on-way');

    return (
        <div className="h-full flex flex-col">
            <RateHistoryModal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} rates={deliveryRates} onDelete={deleteDeliveryRate} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <MotorcycleIcon className="w-8 h-8 text-[var(--primary-red)]"/>
                    Gestión de Delivery Pro (IA)
                </h2>
                <button 
                    onClick={() => setIsRateModalOpen(true)}
                    className="flex items-center gap-2 bg-amber-600/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-lg font-bold hover:bg-amber-600/40 transition-colors"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Ver Base de Datos de Rutas
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                <div className="flex flex-col bg-black/20 rounded-xl border border-[var(--card-border)] h-full">
                    <div className="p-4 border-b border-[var(--card-border)] bg-purple-900/20 rounded-t-xl">
                        <h3 className="font-bold text-purple-400 flex items-center gap-2">
                            <span>🟡 Cotización / Cliente</span>
                            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{quotingOrders.length}</span>
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {quotingOrders.map(order => (
                            <DeliveryCard 
                                key={order.id} 
                                order={order} 
                                onUpdateStatus={(s, d) => updateOrderDeliveryStatus(order.id, s, d)}
                                onUpdateCost={handleCostUpdate}
                                onUpdateMetadata={handleMetadataUpdate}
                                externalPhone={externalPhone}
                                deliveryRates={deliveryRates}
                                saveDeliveryRate={saveDeliveryRate}
                            />
                        ))}
                        {quotingOrders.length === 0 && <p className="text-gray-500 text-center text-sm mt-10">Sin pedidos por cotizar.</p>}
                    </div>
                </div>

                <div className="flex flex-col bg-black/20 rounded-xl border border-[var(--card-border)] h-full">
                    <div className="p-4 border-b border-[var(--card-border)] bg-amber-900/20 rounded-t-xl">
                        <h3 className="font-bold text-amber-400 flex items-center gap-2">
                            <span>🔥 En Cocina</span>
                            <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full">{kitchenOrders.length}</span>
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                         {kitchenOrders.map(order => (
                            <DeliveryCard 
                                key={order.id} 
                                order={order} 
                                onUpdateStatus={(s, d) => updateOrderDeliveryStatus(order.id, s, d)}
                                onUpdateCost={handleCostUpdate}
                                onUpdateMetadata={handleMetadataUpdate}
                                externalPhone={externalPhone}
                                deliveryRates={deliveryRates}
                                saveDeliveryRate={saveDeliveryRate}
                            />
                        ))}
                         {kitchenOrders.length === 0 && <p className="text-gray-500 text-center text-sm mt-10">Nada en cocina.</p>}
                    </div>
                </div>

                <div className="flex flex-col bg-black/20 rounded-xl border border-[var(--card-border)] h-full">
                    <div className="p-4 border-b border-[var(--card-border)] bg-emerald-900/20 rounded-t-xl">
                        <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                            <span>🛵 Despacho / Ruta</span>
                            <span className="bg-emerald-500 text-black text-xs px-2 py-0.5 rounded-full">{readyOrders.length}</span>
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                         {readyOrders.map(order => (
                            <DeliveryCard 
                                key={order.id} 
                                order={order} 
                                onUpdateStatus={(s, d) => updateOrderDeliveryStatus(order.id, s, d)}
                                onUpdateCost={handleCostUpdate}
                                onUpdateMetadata={handleMetadataUpdate}
                                externalPhone={externalPhone}
                                deliveryRates={deliveryRates}
                                saveDeliveryRate={saveDeliveryRate}
                            />
                        ))}
                        {readyOrders.length === 0 && <p className="text-gray-500 text-center text-sm mt-10">Sin entregas activas.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};