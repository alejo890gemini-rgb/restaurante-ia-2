import React from 'react';
import type { Order, PrinterSettings } from '../types';
import { WhatsAppIcon, MotorcycleIcon } from './Icons';

interface WhatsAppManagerProps {
    orders: Order[];
    printerSettings?: PrinterSettings;
}

export const WhatsAppManager: React.FC<WhatsAppManagerProps> = ({ orders, printerSettings }) => {
    
    const openWhatsApp = (phone: string, message: string = '') => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const deliveryProviderPhone = printerSettings?.deliveryProviderPhone;
    const deliveryProviderName = printerSettings?.deliveryProviderName || 'Proveedor de Domicilios';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><WhatsAppIcon className="text-emerald-400"/> Contacto Rápido</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Delivery Provider Card */}
                {deliveryProviderPhone && (
                     <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]">
                        <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                            <MotorcycleIcon /> {deliveryProviderName}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">Contacto para cotizar y gestionar domicilios.</p>
                        <button 
                            onClick={() => openWhatsApp(deliveryProviderPhone)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg"
                        >
                            <WhatsAppIcon /> Enviar Mensaje
                        </button>
                    </div>
                )}
                
                {/* Active Orders */}
                {orders.map(order => {
                    const customerName = order.deliveryInfo?.name || order.toGoName || 'Cliente';
                    const customerPhone = order.deliveryInfo?.phone || order.toGoPhone;
                    if (!customerPhone) return null;

                    return (
                        <div key={order.id} className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{customerName}</h3>
                                    <p className="text-sm text-gray-400">#{order.id.slice(-6)} - {order.orderType === 'delivery' ? 'Delivery' : 'Para Llevar'}</p>
                                </div>
                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">{order.status}</span>
                            </div>
                            <div className="mt-4">
                                 <button 
                                    onClick={() => openWhatsApp(customerPhone)}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600/80 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg"
                                >
                                    <WhatsAppIcon /> Contactar Cliente
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
             {orders.length === 0 && (
                <div className="text-center text-gray-500 py-16 bg-[var(--card-bg)] rounded-xl border-2 border-dashed border-[var(--card-border)]">
                    <p>No hay pedidos activos de Delivery o Para Llevar.</p>
                </div>
            )}
        </div>
    );
};