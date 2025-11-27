
import React, { useState, useMemo, useEffect } from 'react';
import type { MenuItem, Table, Order, OrderItem, MenuItemCategory, Sauce, OrderType, PaymentMethod, PrinterSettings, User, Zone, CategoryConfig, ParsedOrder } from '../types';
import { SALSAS_ALITAS, SALSAS_PAPAS, SUBMENU_CHOICES, GELATO_FLAVORS } from '../constants';
import { EditIcon, TruckIcon, UserIcon, ShoppingBagIcon, SparklesIcon, XIcon, SpinnerIcon, TrashIcon, PlusIcon, CreditCardIcon, DollarSignIcon, ZapIcon, MapPinIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { parseWhatsAppOrder } from '../services/geminiService';
import { formatPrice } from '../utils/formatPrice';
import { CategoryIcon } from './CategoryIcon';

// --- SUB-COMPONENTS DEFINITIONS ---

const ItemOptionsModal: React.FC<{
    item: OrderItem;
    onClose: () => void;
    onSave: (updatedItem: OrderItem) => void;
}> = ({ item, onClose, onSave }) => {
    const [localItem, setLocalItem] = useState<OrderItem>({
        ...item,
        selectedWingSauces: item.selectedWingSauces || [],
        selectedFrySauces: item.selectedFrySauces || [],
        selectedGelatoFlavors: item.selectedGelatoFlavors || [],
    });

    const toggleSauce = (sauce: Sauce, type: 'wing' | 'fry') => {
        if (type === 'wing') {
            const currentSauces = localItem.selectedWingSauces || [];
            const exists = currentSauces.find(s => s.key === sauce.key);
            let newSauces = exists 
                ? currentSauces.filter(s => s.key !== sauce.key)
                : [...currentSauces, sauce];
            setLocalItem({ ...localItem, selectedWingSauces: newSauces });
        } else {
            const currentSauces = localItem.selectedFrySauces || [];
            const exists = currentSauces.find(s => s.key === sauce.key);
            let newSauces = exists 
                ? currentSauces.filter(s => s.key !== sauce.key)
                : [...currentSauces, sauce];
            setLocalItem({ ...localItem, selectedFrySauces: newSauces });
        }
    };

    const toggleGelato = (flavor: string) => {
        const currentFlavors = localItem.selectedGelatoFlavors || [];
        const exists = currentFlavors.includes(flavor);
        const limit = localItem.maxChoices || 3;
        
        if (exists) {
            setLocalItem({ ...localItem, selectedGelatoFlavors: currentFlavors.filter(f => f !== flavor) });
        } else if (currentFlavors.length < limit) {
            setLocalItem({ ...localItem, selectedGelatoFlavors: [...currentFlavors, flavor] });
        }
    };

    const handleSave = () => {
        onSave(localItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl w-full max-w-lg border border-[var(--card-border)] shadow-2xl flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">{localItem.name}</h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {localItem.submenuKey && SUBMENU_CHOICES[localItem.submenuKey] && (
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Elige Opción:</h4>
                            <div className="flex flex-wrap gap-2">
                                {SUBMENU_CHOICES[localItem.submenuKey].map(choice => (
                                    <button 
                                        key={choice} 
                                        onClick={() => setLocalItem({ ...localItem, selectedChoice: choice })}
                                        className={`px-3 py-2 rounded-lg text-sm transition-all ${localItem.selectedChoice === choice ? 'bg-[var(--primary-red)] text-white font-bold shadow-lg transform scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {localItem.hasWings && (
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Salsas Alitas:</h4>
                            <div className="flex flex-wrap gap-2">
                                {SALSAS_ALITAS.map(sauce => (
                                    <button 
                                        key={sauce.key}
                                        onClick={() => toggleSauce(sauce, 'wing')}
                                        className={`px-3 py-2 rounded-lg text-sm transition-all ${(localItem.selectedWingSauces || []).find(s => s.key === sauce.key) ? 'bg-orange-600 text-white font-bold shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                                    >
                                        {sauce.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {localItem.hasFries && (
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Salsa Papas:</h4>
                            <div className="flex flex-wrap gap-2">
                                {SALSAS_PAPAS.map(sauce => (
                                    <button 
                                        key={sauce.key}
                                        onClick={() => toggleSauce(sauce, 'fry')}
                                        className={`px-3 py-2 rounded-lg text-sm transition-all ${(localItem.selectedFrySauces || []).find(s => s.key === sauce.key) ? 'bg-yellow-600 text-white font-bold shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                                    >
                                        {sauce.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {localItem.maxChoices && (
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Sabores Gelato (Máx {localItem.maxChoices}):</h4>
                            <div className="flex flex-wrap gap-2">
                                {GELATO_FLAVORS.map(flavor => (
                                    <button 
                                        key={flavor}
                                        onClick={() => toggleGelato(flavor)}
                                        className={`px-3 py-2 rounded-lg text-sm transition-all ${(localItem.selectedGelatoFlavors || []).includes(flavor) ? 'bg-pink-600 text-white font-bold shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                                        disabled={!(localItem.selectedGelatoFlavors || []).includes(flavor) && (localItem.selectedGelatoFlavors || []).length >= (localItem.maxChoices || 3)}
                                    >
                                        {flavor}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-gray-300 mb-2">Notas:</h4>
                        <textarea 
                            value={localItem.notes || ''} 
                            onChange={(e) => setLocalItem({ ...localItem, notes: e.target.value })}
                            className="w-full bg-black/20 border border-gray-600 rounded-lg p-2 text-white"
                            placeholder="Ej: Sin cebolla, extra picante..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const CustomerInfoModal: React.FC<{
    onClose: () => void;
    onSave: (info: { name: string; phone: string; address?: string }) => void;
    isDelivery: boolean;
}> = ({ onClose, onSave, isDelivery }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, phone, address: isDelivery ? address : undefined });
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] p-6 rounded-xl w-full max-w-md border border-[var(--card-border)] shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">{isDelivery ? 'Datos de Domicilio' : 'Datos Para Llevar'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre Cliente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] outline-none" />
                    <input type="tel" placeholder="Teléfono / WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] outline-none" />
                    {isDelivery && (
                        <textarea placeholder="Dirección Completa" value={address} onChange={e => setAddress(e.target.value)} required rows={3} className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-[var(--primary-red)] outline-none" />
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-bold rounded-lg hover:bg-[var(--dark-red)]">Continuar</button>
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
    const [activeZone, setActiveZone] = useState(zones[0]?.id);

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] p-6 rounded-xl w-full max-w-4xl h-[80vh] border border-[var(--card-border)] shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Seleccionar Mesa</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                </div>
                
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    {zones.map(zone => (
                        <button 
                            key={zone.id} 
                            onClick={() => setActiveZone(zone.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeZone === zone.id ? 'bg-[var(--primary-red)] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {zone.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto p-2">
                    {tables.filter(t => t.zoneId === activeZone).map(table => (
                        <button 
                            key={table.id}
                            onClick={() => onSelect(table.id)}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center h-32 transition-all transform hover:scale-105 ${table.status === 'available' ? 'bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-900/40' : table.status === 'occupied' ? 'bg-red-900/20 border-red-500/50 hover:bg-red-900/40' : 'bg-gray-800 border-gray-600 opacity-50'}`}
                        >
                            <span className="text-lg font-bold text-white">{table.name}</span>
                            <span className={`text-xs mt-1 ${table.status === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{
    order: Order | null;
    onClose: () => void;
    onCompleteSale: (method: PaymentMethod) => void;
}> = ({ order, onClose, onCompleteSale }) => {
    if (!order) return null;
    const items = order.items || [];
    const total = items.reduce((sum, item) => {
        if (!item) return sum;
        return sum + (item.price * item.quantity);
    }, 0) + (order.deliveryInfo?.deliveryCost || 0);

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] p-8 rounded-xl w-full max-w-sm border border-[var(--card-border)] shadow-2xl text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Cobrar Orden</h3>
                <p className="text-4xl font-mono font-bold text-emerald-400 mb-8">{formatPrice(total)}</p>
                
                <div className="space-y-3">
                    <button onClick={() => onCompleteSale('Efectivo')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-transform hover:scale-105">
                        <DollarSignIcon className="w-6 h-6"/> Efectivo
                    </button>
                    <button onClick={() => onCompleteSale('Tarjeta')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-transform hover:scale-105">
                        <CreditCardIcon className="w-6 h-6"/> Tarjeta / Datafono
                    </button>
                    <button onClick={() => onCompleteSale('Transferencia')} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-transform hover:scale-105">
                        <ZapIcon className="w-6 h-6"/> Nequi / Daviplata
                    </button>
                </div>
                <button onClick={onClose} className="mt-6 text-gray-400 hover:text-white underline">Cancelar</button>
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

const MenuItemCard: React.FC<{ item: MenuItem; onClick: () => void; categoryColor: string }> = ({ item, onClick, categoryColor }) => (
    <button 
        onClick={onClick}
        className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 group text-left flex flex-col h-40"
    >
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: categoryColor }}></div>
        {item.imageUrl && (
            <div className="h-20 w-full overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
        )}
        <div className="p-3 flex flex-col flex-1 justify-between relative z-10">
            <div>
                <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{item.name}</h4>
                {(item.hasWings || item.hasFries) && <span className="text-[10px] text-gray-400 block mt-1">+ Opciones</span>}
            </div>
            <p className="font-bold text-[var(--accent-yellow)] text-sm self-end bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {formatPrice(item.price)}
            </p>
        </div>
    </button>
);

const OrderTicket: React.FC<{
    currentOrder: Order | null;
    orderTotal: number;
    removeItem: (id: string) => void;
    incrementItem: (id: string) => void;
    decrementItem: (id: string) => void;
    editItem: (item: OrderItem) => void;
    clearOrder: () => void;
    handleSaveOrder: () => void;
    handleCompleteSale: () => void;
    header: React.ReactNode;
}> = ({ currentOrder, orderTotal, removeItem, incrementItem, decrementItem, editItem, clearOrder, handleSaveOrder, handleCompleteSale, header }) => {
    if (!currentOrder) return <div className="flex items-center justify-center h-full text-gray-500 italic p-8 text-center">Selecciona una mesa o inicia una orden para comenzar.</div>;

    const items = currentOrder.items || [];

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">
            {header}
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {items.map((item, idx) => {
                    if (!item) return null;
                    return (
                        <div key={`${item.instanceId}-${idx}`} className="bg-[var(--card-bg)] p-3 rounded-lg border border-gray-700 shadow-sm relative group animate-slideInUp">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-white text-sm w-2/3">{item.name}</h4>
                                <span className="font-mono text-white text-sm">{formatPrice((item.price || 0) * (item.quantity || 0))}</span>
                            </div>
                            <div className="text-xs text-gray-400 pl-2 border-l-2 border-gray-600 mb-2 space-y-0.5">
                                {item.selectedChoice && <p>• {item.selectedChoice}</p>}
                                {(item.selectedWingSauces || []).length > 0 && <p>• Alitas: {(item.selectedWingSauces || []).map(s => s.name).join(', ')}</p>}
                                {(item.selectedFrySauces || []).length > 0 && <p>• Papas: {(item.selectedFrySauces || []).map(s => s.name).join(', ')}</p>}
                                {(item.selectedGelatoFlavors || []).length > 0 && <p>• Sabores: {(item.selectedGelatoFlavors || []).join(', ')}</p>}
                                {item.notes && <p className="text-amber-400 font-bold">Nota: {item.notes}</p>}
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center bg-black/40 rounded-lg p-1">
                                    <button onClick={() => decrementItem(item.instanceId)} className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded font-bold">-</button>
                                    <span className="w-8 text-center font-bold text-white text-sm">{item.quantity}</span>
                                    <button onClick={() => incrementItem(item.instanceId)} className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded font-bold">+</button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => editItem(item)} className="p-1.5 text-sky-400 hover:bg-sky-900/30 rounded"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => removeItem(item.instanceId)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && <p className="text-center text-gray-500 italic py-10">Orden vacía. Añade productos.</p>}
            </div>

            <div className="p-4 bg-black/30 border-t border-[var(--card-border)] space-y-3">
                <div className="flex justify-between items-center text-xl font-bold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">{formatPrice(orderTotal + (currentOrder.deliveryInfo?.deliveryCost || 0))}</span>
                </div>
                {currentOrder.deliveryInfo?.deliveryCost && (
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>(Incluye domicilio: {formatPrice(currentOrder.deliveryInfo.deliveryCost)})</span>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={clearOrder} className="py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition-colors">Limpiar</button>
                    <button onClick={handleSaveOrder} className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors">Guardar</button>
                    <button onClick={handleCompleteSale} className="col-span-2 py-4 bg-[var(--primary-red)] hover:bg-[var(--dark-red)] text-white rounded-xl font-bold text-lg shadow-lg shadow-red-900/30 transition-transform hover:scale-[1.02]">
                        COBRAR
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const POS: React.FC<{
  menuItems: MenuItem[];
  tables: Table[];
  zones: Zone[];
  orders: Order[];
  createOrder: (order: Order) => void;
  completeSale: (order: Order, paymentMethod: PaymentMethod) => void;
  printerSettings: PrinterSettings;
  currentUser: User;
  initialTableId?: string | null;
  clearInitialTable: () => void;
  categoryConfigs: CategoryConfig[];
  selectedSedeId: string;
}> = (props) => {
    const { menuItems, tables, zones, orders, createOrder, completeSale, printerSettings, currentUser, initialTableId, clearInitialTable, categoryConfigs, selectedSedeId } = props;
    
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [modal, setModal] = useState<'options' | 'customer' | 'table' | 'payment' | 'whatsapp' | null>(null);
    const [modalOrderType, setModalOrderType] = useState<'delivery' | 'to-go' | null>(null);
    const [itemForOptions, setItemForOptions] = useState<OrderItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(categoryConfigs[0]?.name);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
    const { addToast } = useToast();

    // Defensive coding
    const safeOrders = Array.isArray(orders) ? orders.filter(o => o && o.id) : [];
    const activeOrders = useMemo(() => safeOrders.filter(o => o.status === 'open' || o.status === 'pending_confirmation' || o.status === 'ready'), [safeOrders]);
    const openTableOrders = useMemo(() => activeOrders.filter(o => o.orderType === 'dine-in' && o.tableId), [activeOrders]);

    const getCategoryColor = (catName: string) => {
      if (!catName) return '#6B7280';
      const config = categoryConfigs.find(c => c.name === catName);
      return config ? config.color : '#6B7280';
    }
    
    const orderTotal = (currentOrder?.items || []).reduce((acc, item) => {
        if (!item) return acc;
        return acc + (item.price || 0) * (item.quantity || 0);
    }, 0) || 0;
    
    const orderItemCount = (currentOrder?.items || []).reduce((acc, item) => {
        if (!item) return acc;
        return acc + (item.quantity || 0);
    }, 0) || 0;

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

    const handleNewOrderClick = () => setCurrentOrder(null);
    const loadOrder = (order: Order) => setCurrentOrder(order);

    const loadOrderForTable = (tableId: string) => {
        if (selectedSedeId === 'global') {
            addToast('Selecciona una sede específica para operar mesas.', 'error');
            return;
        }
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
                userId: currentUser.id,
                sedeId: selectedSedeId,
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
            setCurrentOrder(prev => prev ? { ...prev, items: [...(prev.items || []), newItem] } : null);
        }
    };

    const updateItemInOrder = (updatedItem: OrderItem) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? {
            ...prev,
            items: (prev.items || []).map(item => item.instanceId === updatedItem.instanceId ? { ...updatedItem, isPrinted: false } : item)
        } : null);
    };
    
    const removeItemFromOrder = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? { ...prev, items: (prev.items || []).filter(item => item.instanceId !== instanceId) } : null);
    };

    const incrementItemQuantity = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => prev ? {
            ...prev,
            items: (prev.items || []).map(item => item.instanceId === instanceId ? { ...item, quantity: item.quantity + 1, isPrinted: false } : item)
        } : null);
    };

    const decrementItemQuantity = (instanceId: string) => {
        if (!currentOrder) return;
        setCurrentOrder(prev => {
            if (!prev) return null;
            const items = prev.items || [];
            const item = items.find(i => i.instanceId === instanceId);
            if (item && item.quantity > 1) {
                return { ...prev, items: items.map(i => i.instanceId === instanceId ? { ...i, quantity: i.quantity - 1, isPrinted: false } : i) };
            }
            return { ...prev, items: items.filter(i => i.instanceId !== instanceId) };
        });
    };

    const handleCustomerInfoSave = (info: { name: string; phone: string; address?: string }) => {
        if (selectedSedeId === 'global') {
            addToast('Selecciona una sede específica para crear una orden.', 'error');
            return;
        }
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
                deliveryInfo: { name: info.name, phone: info.phone, address: info.address || '', deliveryStatus: 'quoting' },
                sedeId: selectedSedeId,
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
                toGoPhone: info.phone,
                sedeId: selectedSedeId,
            };
        }
        setCurrentOrder(newOrder);
        setModal(null);
    };

    const handleSaveOrder = () => {
        if (currentOrder && (currentOrder.items || []).length > 0) {
            createOrder(currentOrder);
        } else {
            addToast('Añade productos para guardar la orden', 'error');
        }
    };

    const handleCompleteSale = () => {
        if (currentOrder && (currentOrder.items || []).length > 0) {
            createOrder(currentOrder);
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
    
    const handleQuickSale = () => {
        if (selectedSedeId === 'global') {
            addToast('Selecciona una sede específica para crear una venta rápida.', 'error');
            return;
        }
        const quickSaleOrder: Order = {
            id: `ord-${Date.now()}`,
            orderType: 'to-go',
            items: [],
            status: 'open',
            createdAt: new Date().toISOString(),
            userId: currentUser.id,
            toGoName: 'Venta Rápida',
            sedeId: selectedSedeId,
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
                const newItem: OrderItem = {
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
                return newItem;
            })
            .filter((item): item is OrderItem => item !== null);
        
        const info = parsedOrder.customer;
        
        setCurrentOrder(prev => {
            if(!prev) return null;
            let updatedOrder = { ...prev, items: [...(prev.items || []), ...newItems] };
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
        if (!Array.isArray(menuItems)) return [];
        let items = menuItems.filter(item => item && item.id && item.category === activeCategory);
        if (searchTerm) {
            items = menuItems.filter(item => item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
        if (selectedSedeId === 'global') {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                    <MapPinIcon className="w-16 h-16 mb-4"/>
                    <h2 className="text-2xl font-bold text-white">Estás en Visión Global</h2>
                    <p className="mt-2 max-w-sm">Para crear o gestionar órdenes, por favor selecciona una sede específica desde el menú lateral.</p>
                </div>
            );
        }

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
                                const orderTotalVal = (order.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
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
    const menuCategories = categoryConfigs.map(c => c.name);

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#0f0f0f]">
            {modal === 'options' && itemForOptions && <ItemOptionsModal item={itemForOptions} onClose={() => setModal(null)} onSave={(item) => {
                const items = currentOrder.items || [];
                const itemExists = items.some(i => i.instanceId === item.instanceId);
                if (itemExists) updateItemInOrder(item);
                else setCurrentOrder(prev => prev ? { ...prev, items: [...items, { ...item, isPrinted: false }] } : null);
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
                        {menuCategories.map(category => {
                            const color = getCategoryColor(category);
                            const isActive = activeCategory === category;
                            return (
                                <button key={category} onClick={() => { setActiveCategory(category); setSearchTerm(''); }} 
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-sm ${isActive ? 'text-white scale-105 shadow-lg' : 'bg-[var(--card-bg)] border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`} 
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
                        {filteredMenu.map(item => (
                            <MenuItemCard key={item.id} item={item} onClick={() => addItemToOrder(item)} categoryColor={getCategoryColor(item.category)} />
                        ))}
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
