import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { MenuItem, Table, Order, OrderItem, MenuItemCategory, Sauce, OrderType, PaymentMethod, PrinterSettings, User, Zone, CategoryConfig, ParsedOrder } from '../types';
import { MENU_CATEGORIES, SALSAS_ALITAS, SALSAS_PAPAS, SUBMENU_CHOICES, GELATO_FLAVORS } from '../constants';
// FIX: Add ZapIcon to imports for the new Quick Sale button
import { EditIcon, TruckIcon, UserIcon, CheckCircleIcon, ShoppingBagIcon, SparklesIcon, PrinterIcon, XIcon, SpinnerIcon, TrashIcon, PlusIcon, CreditCardIcon, DollarSignIcon, ZapIcon } from './Icons';
import { CategoryIcon } from './CategoryIcon';
import { formatPrice } from '../utils/formatPrice';
import { parseWhatsAppOrder } from '../services/geminiService';
import { useToast } from '../hooks/useToast';

// Voice Icon Component
const MicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-6 h-6"} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);

const ItemOptionsModal: React.FC<{
    item: OrderItem;
    onClose: () => void;
    onSave: (item: OrderItem) => void;
}> = ({ item, onClose, onSave }) => {
    const [selectedWingSauces, setSelectedWingSauces] = useState<Sauce[]>(item.selectedWingSauces);
    const [selectedFrySauces, setSelectedFrySauces] = useState<Sauce[]>(item.selectedFrySauces);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(item.selectedChoice);
    const [selectedGelatoFlavors, setSelectedGelatoFlavors] = useState<string[]>(item.selectedGelatoFlavors);
    const [notes, setNotes] = useState<string>(item.notes || '');

    const handleWingSauceChange = (sauce: Sauce, checked: boolean) => {
        setSelectedWingSauces(prev => checked ? [...prev, sauce] : prev.filter(s => s.key !== sauce.key));
    };

    const handleFrySauceChange = (sauce: Sauce, checked: boolean) => {
        setSelectedFrySauces(prev => checked ? [...prev, sauce] : prev.filter(s => s.key !== sauce.key));
    };

    const handleGelatoFlavorChange = (index: number, flavor: string) => {
        const newFlavors = [...selectedGelatoFlavors];
        newFlavors[index] = flavor;
        setSelectedGelatoFlavors(newFlavors);
    };

    const handleSave = () => {
        onSave({ ...item, selectedWingSauces, selectedFrySauces, selectedChoice, selectedGelatoFlavors, notes });
        onClose();
    };
    
    const choices = item.submenuKey ? SUBMENU_CHOICES[item.submenuKey] : [];

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4 backdrop-blur-md">
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-[var(--card-border)] flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white font-bangers tracking-wide">Personalizar: <span className="text-[var(--accent-yellow)]">{item.name}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon /></button>
                </div>
                
                <div className="space-y-6 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                    {item.maxChoices && item.maxChoices > 0 && (
                        <div className="bg-black/30 p-4 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-blue-300 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Sabores de Gelato ({item.maxChoices})</h3>
                            <div className="space-y-3">
                                {[...Array(item.maxChoices)].map((_, index) => {
                                    const currentSelection = selectedGelatoFlavors[index];
                                    const otherSelectedFlavors = selectedGelatoFlavors.filter((_, i) => i !== index);
                                    const availableFlavors = GELATO_FLAVORS.filter(f => !otherSelectedFlavors.includes(f));
                                    
                                    return (
                                        <select 
                                            key={index}
                                            value={currentSelection || ''}
                                            onChange={(e) => handleGelatoFlavorChange(index, e.target.value)}
                                            className="w-full p-3 rounded-lg bg-[var(--card-bg)] border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="" disabled>Selecciona Sabor {index + 1}</option>
                                            {availableFlavors.map(flavor => <option key={flavor} value={flavor}>{flavor}</option>)}
                                        </select>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {item.hasWings && (
                        <div className="bg-black/30 p-4 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-[var(--primary-red)]">🍗 Salsas para Alitas</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {SALSAS_ALITAS.map(sauce => (
                                    <label key={sauce.key} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-all ${selectedWingSauces.some(s => s.key === sauce.key) ? 'bg-red-900/40 border-red-500' : 'bg-[var(--card-bg)] border-transparent hover:bg-white/5'}`}>
                                        <input type="checkbox"
                                            checked={selectedWingSauces.some(s => s.key === sauce.key)}
                                            onChange={(e) => handleWingSauceChange(sauce, e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-500 bg-gray-800 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"
                                        />
                                        <span className="text-sm font-medium text-gray-200">{sauce.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                     {item.hasFries && (
                        <div className="bg-black/30 p-4 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-[var(--accent-yellow)]">🍟 Salsas para Papas</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {SALSAS_PAPAS.map(sauce => (
                                    <label key={sauce.key} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-all ${selectedFrySauces.some(s => s.key === sauce.key) ? 'bg-yellow-900/40 border-yellow-500' : 'bg-[var(--card-bg)] border-transparent hover:bg-white/5'}`}>
                                        <input type="checkbox"
                                            checked={selectedFrySauces.some(s => s.key === sauce.key)}
                                            onChange={(e) => handleFrySauceChange(sauce, e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-500 bg-gray-800 text-[var(--accent-yellow)] focus:ring-[var(--accent-yellow)]"
                                        />
                                        <span className="text-sm font-medium text-gray-200">{sauce.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {choices.length > 0 && (
                        <div className="bg-black/30 p-4 rounded-xl">
                            <h3 className="font-bold text-lg mb-3 text-white">Elige una Opción</h3>
                            <select value={selectedChoice || ''} onChange={(e) => setSelectedChoice(e.target.value)} className="w-full p-3 rounded-lg bg-[var(--card-bg)] border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-red)] outline-none">
                                <option value="" disabled>Seleccionar...</option>
                                {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg mb-2 text-gray-300">📝 Notas Adicionales</h3>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: sin cebolla, bien cocido..." rows={3} className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-red)] outline-none resize-none"></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 font-semibold transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-3 bg-[var(--primary-red)] text-white font-bold rounded-xl hover:bg-[var(--dark-red)] shadow-lg shadow-red-900/30 transition-colors">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const CustomerInfoModal: React.FC<{
    onClose: () => void;
    onSave: (info: any) => void;
    isDelivery: boolean;
}> = ({ onClose, onSave, isDelivery }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, phone, address });
    };

    return (
         <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-2xl p-8 w-full max-w-md border border-[var(--card-border)] shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[var(--primary-red)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-900/50">
                        {isDelivery ? <TruckIcon className="w-8 h-8 text-white"/> : <ShoppingBagIcon className="w-8 h-8 text-white"/>}
                    </div>
                    <h2 className="text-2xl font-bold text-white font-bangers tracking-wide">{isDelivery ? 'Datos de Entrega' : 'Datos Para Llevar'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Nombre del Cliente</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] focus:ring-1 focus:ring-[var(--primary-red)] outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Teléfono / WhatsApp</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 rounded-xl bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] focus:ring-1 focus:ring-[var(--primary-red)] outline-none" required />
                    </div>
                    {isDelivery && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 ml-1">Dirección Completa</label>
                            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 rounded-xl bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] focus:ring-1 focus:ring-[var(--primary-red)] outline-none" required placeholder="Calle 10 # 5-5..." />
                        </div>
                    )}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-700 rounded-xl text-white font-semibold hover:bg-gray-600 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/30 transition-colors">Continuar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TableSelectModal: React.FC<{
    zones: Zone[];
    tables: Table[];
    onClose: () => void;
    onSelect: (tableId: string) => void;
}> = ({ zones, tables, onClose, onSelect }) => {
    const [activeZoneId, setActiveZoneId] = useState(zones[0]?.id || '');
    const tablesInZone = tables.filter(t => t.zoneId === activeZoneId);

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-3xl border border-[var(--card-border)] shadow-2xl h-[80vh] flex flex-col">
                <h2 className="text-3xl font-bold mb-6 text-white font-bangers tracking-wide text-center">Selecciona una Mesa</h2>
                
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-700">
                    {zones.map(zone => (
                        <button 
                            key={zone.id} 
                            onClick={() => setActiveZoneId(zone.id)} 
                            className={`px-5 py-2 rounded-t-lg font-bold transition-all whitespace-nowrap ${activeZoneId === zone.id ? 'bg-[var(--primary-red)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {zone.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {tablesInZone.map(table => (
                             <button 
                                key={table.id} 
                                onClick={() => onSelect(table.id)} 
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg border-2 ${table.status === 'available' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50' : 'bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50'}`}
                            >
                                <div className="text-2xl font-bold">{table.name}</div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${table.status === 'available' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    {table.status === 'available' ? 'Libre' : 'Ocupada'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                 <button onClick={onClose} className="mt-4 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold transition-colors">Cancelar</button>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{
    order: Order;
    onClose: () => void;
    onCompleteSale: (paymentMethod: PaymentMethod) => void;
}> = ({ order, onClose, onCompleteSale }) => {
    const [paymentStep, setPaymentStep] = useState<'selectMethod' | 'calculateChange'>('selectMethod');
    const [cashReceived, setCashReceived] = useState<string>('');
    
    const total = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0) + (order.deliveryInfo?.deliveryCost || 0);

    const received = parseFloat(cashReceived) || 0;
    const change = received > total ? received - total : 0;

    useEffect(() => {
        setPaymentStep('selectMethod');
        setCashReceived('');
    }, [order]);
    
    const quickCashValues = [20000, 50000, 100000];

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-2xl p-8 w-full max-w-md border border-[var(--card-border)] shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-white text-center font-bangers tracking-wide">Finalizar Venta</h2>
                
                <div className="bg-black/40 p-6 rounded-xl text-center mb-8 border border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-sky-500"></div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Total a Pagar</p>
                    <p className="text-5xl font-bold text-white">{formatPrice(total)}</p>
                </div>

                {paymentStep === 'selectMethod' && (
                    <div className="space-y-3">
                        <button onClick={() => setPaymentStep('calculateChange')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-transform hover:scale-105 shadow-lg shadow-emerald-900/20">
                            <DollarSignIcon className="w-6 h-6"/> Efectivo
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onCompleteSale('Tarjeta')} className="py-4 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-lg text-white flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 shadow-lg shadow-sky-900/20">
                                <CreditCardIcon className="w-6 h-6"/> Tarjeta
                            </button>
                            <button onClick={() => onCompleteSale('Transferencia')} className="py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-lg text-white flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 shadow-lg shadow-purple-900/20">
                                <SparklesIcon className="w-6 h-6"/> Transferencia
                            </button>
                        </div>
                    </div>
                )}

                {paymentStep === 'calculateChange' && (
                    <div className="space-y-5 animate-fadeIn">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 text-center">¿Cuánto entrega el cliente?</label>
                            <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0" className="w-full p-4 text-3xl font-bold text-center rounded-xl bg-black/30 border border-gray-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none" autoFocus />
                            <div className="flex gap-2 mt-3 justify-center">
                                {quickCashValues.map(val => (
                                    <button key={val} onClick={() => setCashReceived(val.toString())} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-full border border-gray-600">{formatPrice(val)}</button>
                                ))}
                                <button onClick={() => setCashReceived(total.toString())} className="px-3 py-1 text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900 rounded-full">Exacto</button>
                            </div>
                        </div>
                        
                        <div className="bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-500/30">
                            <p className="text-emerald-200 text-sm font-bold uppercase">Cambio / Vueltas</p>
                            <p className="text-4xl font-bold text-emerald-400 mt-1">{formatPrice(change)}</p>
                        </div>

                        <button onClick={() => onCompleteSale('Efectivo')} disabled={cashReceived !== '' && received < total} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-lg text-white shadow-lg shadow-emerald-900/30 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all">
                            Confirmar Pago
                        </button>
                         <button onClick={() => setPaymentStep('selectMethod')} className="w-full text-sm text-gray-400 hover:text-white py-2">Volver</button>
                    </div>
                )}
                
                <button onClick={onClose} className="mt-6 w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-semibold transition-colors">Cancelar Operación</button>
            </div>
        </div>
    );
};

const WhatsAppImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsedOrder: ParsedOrder) => void;
  menuItems: MenuItem[];
  orderType: 'delivery' | 'to-go';
}> = ({ isOpen, onClose, onImport, menuItems, orderType }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleParse = async () => {
    if (!text) return;
    setIsLoading(true);
    try {
      const parsed = await parseWhatsAppOrder(text, menuItems, orderType);
      if (parsed) {
        onImport(parsed);
        onClose();
      } else {
        addToast('No se pudo interpretar el pedido. Revisa el texto.', 'error');
      }
    } catch (e) {
      addToast('Error al procesar con IA.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if(!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div className="bg-[var(--card-bg)] p-8 rounded-2xl w-full max-w-lg border border-purple-500/50 shadow-2xl shadow-purple-900/20">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
                <SparklesIcon className="w-8 h-8"/>
                <h3 className="font-bold text-2xl text-white">Importar con IA</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Copia y pega el chat completo de WhatsApp. La Inteligencia Artificial detectará los productos, cantidades, nombre y dirección automáticamente.
            </p>
            <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                rows={6}
                placeholder="Ej: Hola, soy Juan. Quiero 2 hamburguesas locas y una coca cola para la Calle 10 # 5-5..."
                className="w-full p-4 rounded-xl bg-black/30 border border-gray-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none text-sm"
            />
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors">Cancelar</button>
                <button onClick={handleParse} disabled={isLoading} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-70">
                    {isLoading ? <SpinnerIcon className="animate-spin"/> : <SparklesIcon/>}
                    {isLoading ? 'Analizando...' : 'Procesar Texto'}
                </button>
            </div>
        </div>
    </div>
  );
};

const MenuItemCard: React.FC<{ 
    item: MenuItem;
    onClick: () => void;
    categoryColor: string;
}> = ({ item, onClick, categoryColor }) => (
    <div
        onClick={onClick}
        className="group bg-[var(--card-bg)] rounded-xl shadow-lg cursor-pointer flex flex-col justify-between border border-[var(--card-border)] overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl hover:border-opacity-50 relative"
        style={{ borderColor: `${categoryColor}40` }}
    >
        <div className="h-3 w-full" style={{ backgroundColor: categoryColor }}></div>
        <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-2 relative z-10">
            <div className="bg-black/20 p-3 rounded-full mb-1 group-hover:bg-black/40 transition-colors">
                <CategoryIcon category={item.category} className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors"/>
            </div>
            <h4 className="font-bold text-base text-white leading-tight group-hover:text-[var(--accent-yellow)] transition-colors line-clamp-2">{item.name}</h4>
        </div>
        <div className="bg-black/30 p-2 text-center border-t border-white/5">
            <span className="text-sm font-bold text-[var(--accent-yellow)] font-mono bg-black/40 px-3 py-1 rounded-full">{formatPrice(item.price)}</span>
        </div>
    </div>
);

const OrderTicket: React.FC<{
    currentOrder: Order;
    orderTotal: number;
    removeItem: (instanceId: string) => void;
    incrementItem: (instanceId: string) => void;
    decrementItem: (instanceId: string) => void;
    editItem: (item: OrderItem) => void;
    clearOrder: () => void;
    handleSaveOrder: () => void;
    handleCompleteSale: () => void;
    header: React.ReactNode;
}> = ({ currentOrder, orderTotal, removeItem, incrementItem, decrementItem, editItem, clearOrder, handleSaveOrder, handleCompleteSale, header }) => {
    return (
        <div className="bg-[var(--card-bg)] flex flex-col h-full border-l border-[var(--card-border)] shadow-2xl">
            {header}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {currentOrder.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                        <ShoppingBagIcon className="w-16 h-16 mb-4"/>
                        <p className="text-lg font-medium">Orden Vacía</p>
                        <p className="text-sm">Selecciona productos del menú</p>
                    </div>
                ) : (
                    currentOrder.items.map(item => (
                        <div key={item.instanceId} className="bg-black/30 p-3 rounded-xl flex gap-3 relative group border border-transparent hover:border-gray-700 transition-colors">
                            <div className="flex flex-col items-center justify-center gap-1 min-w-[2rem]">
                                <button onClick={() => incrementItem(item.instanceId)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-xs transition-colors">+</button>
                                <span className="font-bold text-white text-sm">{item.quantity}</span>
                                <button onClick={() => decrementItem(item.instanceId)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-xs transition-colors">-</button>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                                <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                                    {item.selectedChoice && <p>• {item.selectedChoice}</p>}
                                    {item.selectedWingSauces.length > 0 && <p>• Salsas: {item.selectedWingSauces.map(s=>s.name).join(', ')}</p>}
                                    {item.selectedFrySauces.length > 0 && <p>• Papas: {item.selectedFrySauces.map(s=>s.name).join(', ')}</p>}
                                    {item.selectedGelatoFlavors.length > 0 && <p>• Gelato: {item.selectedGelatoFlavors.join(', ')}</p>}
                                    {item.notes && <p className="text-amber-400 italic">"{item.notes}"</p>}
                                </div>
                            </div>
                            <div className="flex flex-col justify-between items-end">
                                <p className="font-bold text-white text-sm">{formatPrice(item.price * item.quantity)}</p>
                                <button onClick={() => editItem(item)} className="text-xs bg-sky-900/30 text-sky-400 px-2 py-1 rounded hover:bg-sky-900/50 transition-colors">Editar</button>
                            </div>
                            <button onClick={() => removeItem(item.instanceId)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"><XIcon className="w-3 h-3"/></button>
                        </div>
                    ))
                )}
            </div>
            
            {currentOrder.items.length > 0 && (
                <div className="p-5 bg-black/20 border-t border-[var(--card-border)] space-y-4 backdrop-blur-sm">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Total a Pagar</span>
                        <span className="text-3xl font-bold text-white font-mono">{formatPrice(orderTotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={clearOrder} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold py-3 rounded-xl text-sm border border-red-900/50 transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleSaveOrder} className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 font-bold py-3 rounded-xl text-sm border border-blue-900/50 transition-all">
                            Guardar (Cocina)
                        </button>
                    </div>
                    <button onClick={handleCompleteSale} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg shadow-emerald-900/40 transform transition-all hover:-translate-y-1">
                        COBRAR
                    </button>
                </div>
            )}
        </div>
    );
};

export const POS: React.FC<{
  menuItems: MenuItem[];
  tables: Table[];
  zones: Zone[];
  orders: Order[];
  createOrder: (order: Order, showTicket?: boolean) => void;
  completeSale: (order: Order, paymentMethod: PaymentMethod) => void;
  printerSettings: PrinterSettings;
  currentUser: User;
  initialTableId?: string | null;
  clearInitialTable: () => void;
  categoryConfigs: CategoryConfig[];
}> = (props) => {
    const { menuItems, tables, zones, orders, createOrder, completeSale, printerSettings, currentUser, initialTableId, clearInitialTable, categoryConfigs } = props;
    
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [modal, setModal] = useState<'options' | 'customer' | 'table' | 'payment' | 'whatsapp' | null>(null);
    const [modalOrderType, setModalOrderType] = useState<'delivery' | 'to-go' | null>(null);
    const [itemForOptions, setItemForOptions] = useState<OrderItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(MENU_CATEGORIES[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
    const { addToast } = useToast();

    const activeOrders = useMemo(() => orders.filter(o => o.status === 'open' || o.status === 'pending_confirmation'), [orders]);
    const openTableOrders = useMemo(() => activeOrders.filter(o => o.orderType === 'dine-in' && o.tableId), [activeOrders]);

    const getCategoryColor = (catName: string) => {
      const config = categoryConfigs.find(c => c.name === catName);
      return config ? config.color : '#6B7280';
    }
    
    const orderTotal = currentOrder?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    const orderItemCount = currentOrder?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

    useEffect(() => {
        if (initialTableId) {
            loadOrderForTable(initialTableId);
            clearInitialTable();
        }
    }, [initialTableId]);

    const startNewOrder = (type: OrderType) => {
        setModalOrderType(type === 'dine-in' ? null : type);
        if (type === 'delivery' || type === 'to-go') {
            setModal('customer');
        } else if (type === 'dine-in') {
            setModal('table');
        }
    };

    const handleNewOrderClick = () => {
        setCurrentOrder(null);
    }

    const loadOrder = (order: Order) => {
        setCurrentOrder(order);
    };

    const loadOrderForTable = (tableId: string) => {
        const existingOrder = openTableOrders.find(o => o.tableId === tableId);
        if (existingOrder) {
            loadOrder(existingOrder);
        } else {
            setCurrentOrder({
                id: `ord-${Date.now()}`,
                orderType: 'dine-in',
                tableId: tableId,
                items: [],
                status: 'open',
                createdAt: new Date().toISOString(),
                userId: currentUser.id
            });
        }
        setModal(null);
    };

    const clearOrderItems = () => {
        if (!currentOrder) return;
        setCurrentOrder({ ...currentOrder, items: [] });
    };

    const addItemToOrder = (item: MenuItem) => {
        if (!currentOrder) return;
        const newItem: OrderItem = {
            ...item,
            instanceId: `${item.id}-${Date.now()}`,
            quantity: 1,
            selectedWingSauces: [],
            selectedFrySauces: [],
            selectedChoice: null,
            selectedGelatoFlavors: [],
            isPrinted: false
        };

        if (item.hasWings || item.hasFries || item.submenuKey || item.maxChoices) {
            setItemForOptions(newItem);
            setModal('options');
        } else {
            setCurrentOrder(prev => prev ? { ...prev, items: [...prev.items, newItem] } : null);
        }
    };

    const updateItemInOrder = (updatedItem: OrderItem) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? {
            ...prev,
            items: prev.items.map(item => item.instanceId === updatedItem.instanceId ? { ...updatedItem, isPrinted: false } : item)
        } : null);
    };
    
    const removeItemFromOrder = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? { ...prev, items: prev.items.filter(item => item.instanceId !== instanceId) } : null);
    };

    const incrementItemQuantity = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? {
            ...prev,
            items: prev.items.map(item => item.instanceId === instanceId ? { ...item, quantity: item.quantity + 1, isPrinted: false } : item)
        } : null);
    };

    const decrementItemQuantity = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => {
            if (!prev) return null;
            const item = prev.items.find(i => i.instanceId === instanceId);
            if (item && item.quantity > 1) {
                return { ...prev, items: prev.items.map(i => i.instanceId === instanceId ? { ...i, quantity: i.quantity - 1, isPrinted: false } : i) };
            }
            return { ...prev, items: prev.items.filter(i => i.instanceId !== instanceId) };
        });
    };

    const handleCustomerInfoSave = (info: { name: string; phone: string; address?: string }) => {
        let newOrder: Order;
        const orderType = info.address ? 'delivery' : 'to-go';
        
        if (orderType === 'delivery') {
            newOrder = {
                id: `ord-${Date.now()}`,
                orderType: 'delivery',
                items: [],
                status: 'pending_confirmation',
                createdAt: new Date().toISOString(),
                userId: currentUser.id,
                deliveryInfo: { name: info.name, phone: info.phone, address: info.address || '', deliveryStatus: 'quoting' }
            };
        } else { // to-go
            newOrder = {
                id: `ord-${Date.now()}`,
                orderType: 'to-go',
                items: [],
                status: 'open',
                createdAt: new Date().toISOString(),
                userId: currentUser.id,
                toGoName: info.name,
                toGoPhone: info.phone
            };
        }
        setCurrentOrder(newOrder);
        setModal(null);
    };

    const handleSaveOrder = () => {
        if (currentOrder && currentOrder.items.length > 0) {
            createOrder(currentOrder);
        } else {
            addToast('Añade productos para guardar la orden', 'error');
        }
    };

    const handleCompleteSale = () => {
        if (currentOrder && currentOrder.items.length > 0) {
            createOrder(currentOrder, false);
            setModal('payment');
        } else {
            addToast('Añade productos para cobrar la orden', 'error');
        }
    };
    
    const handlePayment = (paymentMethod: PaymentMethod) => {
        if (currentOrder) {
            completeSale(currentOrder, paymentMethod);
            setModal(null);
            setCurrentOrder(null);
        }
    };
    
    // FIX: Add function to handle Quick Sale button click
    const handleQuickSale = () => {
        const quickSaleOrder: Order = {
            id: `ord-${Date.now()}`,
            orderType: 'to-go',
            items: [],
            status: 'open',
            createdAt: new Date().toISOString(),
            userId: currentUser.id,
            toGoName: 'Venta Rápida',
        };
        setCurrentOrder(quickSaleOrder);
        addToast('Iniciada venta rápida.', 'info');
    };

    const handleWhatsAppImport = (parsedOrder: ParsedOrder) => {
        if (!currentOrder) return;
        
        const newItems: OrderItem[] = parsedOrder.items
            .map(parsedItem => {
                const menuItem = menuItems.find(mi => mi.id === parsedItem.menuItemId);
                if (!menuItem) return null;
                return {
                    ...menuItem,
                    instanceId: `${menuItem.id}-${Date.now()}`,
                    quantity: parsedItem.quantity,
                    notes: parsedItem.notes,
                    selectedWingSauces: [],
                    selectedFrySauces: [],
                    selectedChoice: null,
                    selectedGelatoFlavors: [],
                    isPrinted: false
                };
            })
            .filter((item): item is OrderItem => item !== null);
        
        const info = parsedOrder.customer;
        
        setCurrentOrder(prev => {
            if(!prev) return null;
            let updatedOrder = { ...prev, items: [...prev.items, ...newItems] };
            if (prev.orderType === 'delivery' && info.address) {
                updatedOrder.deliveryInfo = { name: info.name, phone: info.phone, address: info.address, deliveryStatus: 'quoting' };
            } else {
                updatedOrder.toGoName = info.name;
                updatedOrder.toGoPhone = info.phone;
            }
            return updatedOrder;
        });
    };
    
    const filteredMenu = useMemo(() => {
        let items = menuItems.filter(item => item.category === activeCategory);
        if (searchTerm) {
            items = menuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return items;
    }, [menuItems, activeCategory, searchTerm]);
    
    const renderOrderHeader = (isModal = false) => {
        let title = "Nueva Orden";
        let icon = <PlusIcon />;
        let subtitle = "";
        
        if (currentOrder) {
            if (currentOrder.orderType === 'dine-in') {
                const tableName = tables.find(t => t.id === currentOrder.tableId)?.name;
                title = tableName || "Seleccionar Mesa";
                subtitle = "En Restaurante";
                icon = <UserIcon />;
            } else if (currentOrder.orderType === 'delivery') {
                title = currentOrder.deliveryInfo?.name || "Datos de Delivery";
                subtitle = "Domicilio";
                icon = <TruckIcon />;
            } else {
                title = currentOrder.toGoName || "Datos Para Llevar";
                subtitle = "Para Llevar";
                icon = <ShoppingBagIcon />;
            }
        }
        
        const isOccupied = currentOrder?.orderType === 'dine-in' && openTableOrders.some(o => o.id === currentOrder.id);
        const canImport = currentOrder?.orderType === 'delivery' || currentOrder?.orderType === 'to-go';

        return (
            <div className="bg-black/20">
                <div className={`p-4 flex items-center justify-between border-b border-[var(--card-border)] ${isOccupied ? 'bg-red-900/20' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-2.5 rounded-xl text-[var(--accent-yellow)] shadow-inner">{icon}</div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-none">{title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{subtitle}</span>
                                <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 rounded">#{currentOrder?.id.slice(-4)}</span>
                            </div>
                        </div>
                    </div>
                    {isModal && <button onClick={() => setIsMobileOrderOpen(false)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><XIcon/></button>}
                </div>
                 {/* Mobile Import Button Logic Updated */}
                 {canImport && (
                     <div className="px-4 py-2 bg-purple-900/10 border-b border-purple-500/20 md:hidden">
                        <button
                            onClick={() => setModal('whatsapp')}
                            className="w-full flex items-center justify-center gap-2 text-purple-300 py-2 rounded-lg text-xs font-bold hover:text-white transition-colors group border border-purple-500/30 bg-purple-900/20"
                        >
                            <SparklesIcon className="w-4 h-4 group-hover:animate-pulse" /> Importar Pedido de WhatsApp (IA)
                        </button>
                     </div>
                )}
                 {canImport && !isModal && (
                     <div className="px-4 py-2 bg-purple-900/10 border-b border-purple-500/20 hidden md:block">
                        <button
                            onClick={() => setModal('whatsapp')}
                            className="w-full flex items-center justify-center gap-2 text-purple-300 py-1.5 rounded-lg text-xs font-bold hover:text-white transition-colors group"
                        >
                            <SparklesIcon className="w-4 h-4 group-hover:animate-pulse" /> Importar Pedido de WhatsApp (IA)
                        </button>
                     </div>
                )}
            </div>
        );
    };

    if (!currentOrder) {
        return (
            <div className="h-full flex flex-col p-4 md:p-8 animate-fadeIn overflow-y-auto">
                {modal === 'table' && <TableSelectModal zones={zones} tables={tables} onClose={() => setModal(null)} onSelect={loadOrderForTable} />}
                {modal === 'customer' && <CustomerInfoModal onClose={() => setModal(null)} onSave={handleCustomerInfoSave} isDelivery={modalOrderType === 'delivery'} />}

                <h2 className="text-4xl font-bold text-white mb-8 text-center font-bangers tracking-widest">PUNTO DE VENTA</h2>
                
                {activeOrders.length > 0 && (
                    <div className="mb-8 w-full max-w-5xl mx-auto">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Órdenes en Curso</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {activeOrders.map(order => {
                                let displayName = '';
                                let icon = null;
                                if (order.orderType === 'dine-in') {
                                    const table = tables.find(t => t.id === order.tableId);
                                    displayName = table?.name || 'Mesa ?';
                                    icon = <UserIcon className="w-4 h-4"/>;
                                } else if (order.orderType === 'delivery') {
                                    displayName = `${order.deliveryInfo?.name || '...'}`;
                                    icon = <TruckIcon className="w-4 h-4"/>;
                                } else {
                                    displayName = `${order.toGoName || '...'}`;
                                    icon = <ShoppingBagIcon className="w-4 h-4"/>;
                                }
                                const orderTotalVal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                                return (
                                    <button 
                                        key={order.id} 
                                        onClick={() => loadOrder(order)}
                                        className="flex-shrink-0 w-40 p-3 rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] hover:border-gray-500 hover:bg-white/5 transition-all group relative overflow-hidden shadow-lg"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[var(--accent-yellow)] bg-black/30 p-1.5 rounded-lg">{icon}</span>
                                            <span className="text-xs font-mono text-gray-500">#{order.id.slice(-4)}</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-white text-sm truncate">{displayName}</p>
                                            <p className="text-emerald-400 font-bold text-sm mt-1">{formatPrice(orderTotalVal)}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl mx-auto pb-20">
                    <h3 className="text-xl font-semibold text-gray-300 mb-8">¿Qué deseas hacer?</h3>
                    {/* FIX: Adjust grid for 4 items and resize buttons for better visibility on mobile */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <button onClick={() => startNewOrder('dine-in')} className="group bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-[var(--primary-red)] hover:bg-red-900/10 transition-all text-center shadow-2xl hover:-translate-y-1">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                                <UserIcon className="w-8 h-8 text-[var(--primary-red)]"/>
                            </div>
                            <span className="block text-xl font-bold text-white mb-1">Restaurante</span>
                            <span className="text-xs text-gray-400">Orden para mesa</span>
                        </button>
                        <button onClick={() => startNewOrder('delivery')} className="group bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-sky-500 hover:bg-sky-900/10 transition-all text-center shadow-2xl hover:-translate-y-1">
                            <div className="w-16 h-16 mx-auto mb-4 bg-sky-900/20 rounded-full flex items-center justify-center group-hover:bg-sky-600/20 transition-colors">
                                <TruckIcon className="w-8 h-8 text-sky-400"/>
                            </div>
                            <span className="block text-xl font-bold text-white mb-1">Delivery</span>
                            <span className="text-xs text-gray-400">Domicilio a casa</span>
                        </button>
                        <button onClick={() => startNewOrder('to-go')} className="group bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-amber-500 hover:bg-amber-900/10 transition-all text-center shadow-2xl hover:-translate-y-1">
                            <div className="w-16 h-16 mx-auto mb-4 bg-amber-900/20 rounded-full flex items-center justify-center group-hover:bg-amber-600/20 transition-colors">
                                <ShoppingBagIcon className="w-8 h-8 text-amber-400"/>
                            </div>
                            <span className="block text-xl font-bold text-white mb-1">Para Llevar</span>
                            <span className="text-xs text-gray-400">Recoger en local</span>
                        </button>
                        <button onClick={handleQuickSale} className="group bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-yellow-500 hover:bg-yellow-900/10 transition-all text-center shadow-2xl hover:-translate-y-1">
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-900/20 rounded-full flex items-center justify-center group-hover:bg-yellow-600/20 transition-colors">
                                <ZapIcon className="w-8 h-8 text-yellow-400"/>
                            </div>
                            <span className="block text-xl font-bold text-white mb-1">Venta Rápida</span>
                            <span className="text-xs text-gray-400">Sin mesa ni cliente</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const canImport = currentOrder?.orderType === 'delivery' || currentOrder?.orderType === 'to-go';

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#0f0f0f]">
            {modal === 'options' && itemForOptions && <ItemOptionsModal item={itemForOptions} onClose={() => setModal(null)} onSave={(item) => {
                const itemExists = currentOrder.items.some(i => i.instanceId === item.instanceId);
                if (itemExists) updateItemInOrder(item);
                else setCurrentOrder(prev => prev ? { ...prev, items: [...prev.items, { ...item, isPrinted: false }] } : null);
                setModal(null);
            }} />}
            {modal === 'payment' && <PaymentModal order={currentOrder} onClose={() => setModal(null)} onCompleteSale={handlePayment} />}
            {modal === 'whatsapp' && <WhatsAppImportModal isOpen={true} onClose={() => setModal(null)} onImport={handleWhatsAppImport} menuItems={menuItems} orderType={currentOrder.orderType as 'delivery' | 'to-go'} />}
            
            <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0 relative">
                <div className="p-4 md:p-6 border-b border-[var(--card-border)] bg-[var(--card-bg)] z-10 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white font-bangers tracking-wide">MENÚ</h2>
                        <button onClick={handleNewOrderClick} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors border border-white/10">
                            ← Salir
                        </button>
                    </div>
                    
                    <div className="relative">
                        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setActiveCategory(''); }} className="w-full p-3 pl-10 rounded-xl bg-black/30 border border-[var(--card-border)] text-white focus:ring-2 focus:ring-[var(--primary-red)] outline-none transition-all" />
                        <SparklesIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500"/>
                    </div>

                    {/* Mobile Only Import Button */}
                    {canImport && (
                        <div className="mt-4 md:hidden">
                           <button
                               onClick={() => setModal('whatsapp')}
                               className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 text-white py-3 rounded-xl text-sm font-bold shadow-lg"
                           >
                               <SparklesIcon className="w-4 h-4 text-purple-300" /> Importar WhatsApp (IA)
                           </button>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-b border-[var(--card-border)] bg-black/20 overflow-x-auto custom-scrollbar">
                    <div className="flex space-x-3">
                        {MENU_CATEGORIES.map(category => {
                            const color = getCategoryColor(category);
                            const isActive = activeCategory === category;
                            return (
                                <button key={category} onClick={() => { setActiveCategory(category); setSearchTerm(''); }} 
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-sm ${isActive ? 'text-white scale-105 shadow-lg' : 'bg-[var(--card-bg)] border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`} 
                                    style={isActive ? { backgroundColor: color, borderColor: color, boxShadow: `0 4px 12px ${color}40` } : {}}
                                >
                                    <CategoryIcon category={category} className="w-5 h-5" />
                                    {category.split('(')[0].split('/')[0].trim()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredMenu.map(item => <MenuItemCard key={item.id} item={item} onClick={() => addItemToOrder(item)} categoryColor={getCategoryColor(item.category)} />)}
                    </div>
                </div>
            </div>

            <div className="hidden md:flex w-full max-w-sm lg:max-w-[400px] border-l border-[var(--card-border)] z-20 shadow-2xl">
                 <OrderTicket
                    currentOrder={currentOrder}
                    orderTotal={orderTotal}
                    removeItem={removeItemFromOrder}
                    incrementItem={incrementItemQuantity}
                    decrementItem={decrementItemQuantity}
                    editItem={(item) => { setItemForOptions(item); setModal('options'); }}
                    clearOrder={clearOrderItems}
                    handleSaveOrder={handleSaveOrder}
                    handleCompleteSale={handleCompleteSale}
                    header={renderOrderHeader()}
                />
            </div>
            
            {orderItemCount > 0 && (
                <div className="md:hidden z-50">
                    <div onClick={() => setIsMobileOrderOpen(true)} className="fixed bottom-4 left-4 right-4 bg-[var(--primary-red)] text-white rounded-2xl flex justify-between items-center p-4 shadow-2xl cursor-pointer border border-red-400 animate-bounce-subtle">
                         <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full font-bold min-w-[2.5rem] text-center">{orderItemCount}</div>
                            <span className="font-bold text-sm uppercase tracking-wide">Ver Orden</span>
                         </div>
                        <div className="text-xl font-bold font-mono">{formatPrice(orderTotal)}</div>
                    </div>
                    {isMobileOrderOpen && (
                         <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex justify-end">
                             <div className="w-full max-w-md h-full bg-[var(--card-bg)] shadow-2xl animate-slideInRight flex flex-col">
                                 <OrderTicket
                                    currentOrder={currentOrder}
                                    orderTotal={orderTotal}
                                    removeItem={removeItemFromOrder}
                                    incrementItem={incrementItemQuantity}
                                    decrementItem={decrementItemQuantity}
                                    editItem={(item) => { setItemForOptions(item); setModal('options'); }}
                                    clearOrder={clearOrderItems}
                                    handleSaveOrder={handleSaveOrder}
                                    handleCompleteSale={handleCompleteSale}
                                    header={renderOrderHeader(true)}
                                />
                             </div>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};