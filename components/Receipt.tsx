
import React from 'react';
import type { Order, PrinterSettings, Table, OrderItem } from '../types';
import { formatPrice } from '../utils/formatPrice';

interface ReceiptProps {
    order: Order;
    settings: PrinterSettings;
    type: 'customer' | 'kitchen';
    tables: Table[];
    specificItems?: OrderItem[]; // Add ability to filter items
}

export const Receipt: React.FC<ReceiptProps> = ({ order, settings, type, tables, specificItems }) => {
    
    const getDestination = () => {
        if (order.orderType === 'delivery') return `DELIVERY - ${order.deliveryInfo?.name}`;
        if (order.orderType === 'to-go') return `PARA LLEVAR - ${order.toGoName}`;
        const tableName = tables.find(t => t.id === order.tableId)?.name;
        return `MESA: ${tableName || 'N/A'}`;
    }

    // Determine width based on settings (58mm approx 200px, 80mm approx 300px in standard thermal printers)
    // However, standard is to let CSS 'auto' width handle it or constrain container to 100%
    // We use specific styles for legibility
    
    const itemsToRender = specificItems || order.items;
    const isPartial = specificItems && specificItems.length < order.items.length;

    // Calculate total of only rendered items if customer, or all if null (though customer receipt usually implies full)
    // Usually kitchen partial doesn't show prices, so this is fine.
    const total = itemsToRender.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="p-2 font-mono text-black w-full max-w-[80mm] mx-auto">
            {/* HEADER */}
            <div className="text-center mb-2">
                {type === 'customer' && (
                    <>
                        <h1 className="text-xl font-bold uppercase">{settings.shopName}</h1>
                        <p className="text-xs">{settings.shopAddress}</p>
                        <p className="text-xs">NIT: {settings.shopNit}</p>
                        <p className="text-xs">Tel: {settings.shopPhone}</p>
                    </>
                )}
                {type === 'kitchen' && (
                    <>
                        <h1 className="text-xl font-bold uppercase">COCINA</h1>
                        {isPartial && <h2 className="text-sm font-bold uppercase border-2 border-black inline-block px-2 mt-1">** ADICION **</h2>}
                    </>
                )}
                
                <div className="border-b border-black border-dashed my-2"></div>
                
                <p className="font-bold text-lg">{getDestination()}</p>
                <p className="text-xs mt-1">Orden: #{order.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
            </div>

            {/* ITEMS */}
            <div className="mb-2">
                <div className="border-b border-black border-dashed mb-1"></div>
                {itemsToRender.map((item, idx) => (
                    <div key={`${item.instanceId}-${idx}`} className="mb-2 text-sm">
                        <div className="flex justify-between font-bold">
                            <span className={type === 'kitchen' ? 'text-base' : ''}>{item.quantity} x {item.name}</span>
                            {type === 'customer' && <span>{formatPrice(item.price * item.quantity)}</span>}
                        </div>
                        
                        {/* Modifiers / Notes */}
                        <div className="pl-2 text-xs">
                            {item.selectedChoice && <div>- {item.selectedChoice}</div>}
                            {item.selectedWingSauces.length > 0 && <div>- Salsas: {item.selectedWingSauces.map(s => s.name).join(', ')}</div>}
                            {item.selectedFrySauces.length > 0 && <div>- Papas: {item.selectedFrySauces.map(s => s.name).join(', ')}</div>}
                             {item.selectedGelatoFlavors.length > 0 && <div>- Gelato: {item.selectedGelatoFlavors.filter(Boolean).join(', ')}</div>}
                            {item.notes && <div className="font-bold uppercase">** NOTA: {item.notes} **</div>}
                        </div>
                    </div>
                ))}
                 <div className="border-b border-black border-dashed mt-1"></div>
            </div>

            {/* TOTALS (Customer Only) */}
            {type === 'customer' && (
                <div className="text-right mb-4">
                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <p className="text-xs mt-2 text-center">{settings.footerMessage}</p>
                </div>
            )}
            
            {type === 'kitchen' && (
                <div className="text-center font-bold text-xs mt-4">
                    --- FIN COMANDA ---
                </div>
            )}
        </div>
    );
}