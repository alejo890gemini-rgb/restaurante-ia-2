
// ... existing imports
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { MenuItem, Table, Order, OrderItem, MenuItemCategory, Sauce, OrderType, PaymentMethod, PrinterSettings, User, Zone, CategoryConfig, ParsedOrder } from '../types';
import { SALSAS_ALITAS, SALSAS_PAPAS, SUBMENU_CHOICES, GELATO_FLAVORS } from '../constants';
import { EditIcon, TruckIcon, UserIcon, CheckCircleIcon, ShoppingBagIcon, SparklesIcon, PrinterIcon, XIcon, SpinnerIcon, TrashIcon, PlusIcon, CreditCardIcon, DollarSignIcon, ZapIcon, MapPinIcon } from './Icons';
// ... rest of imports

// ... existing components (ItemOptionsModal, CustomerInfoModal, TableSelectModal, PaymentModal)

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

// ... existing MenuItemCard, OrderTicket

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
    
    // ... existing state

    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [modal, setModal] = useState<'options' | 'customer' | 'table' | 'payment' | 'whatsapp' | null>(null);
    const [modalOrderType, setModalOrderType] = useState<'delivery' | 'to-go' | null>(null);
    const [itemForOptions, setItemForOptions] = useState<OrderItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(categoryConfigs[0]?.name);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
    const { addToast } = useToast();

    // ... existing useMemo for activeOrders, openTableOrders

    const activeOrders = useMemo(() => orders.filter(o => o.status === 'open' || o.status === 'pending_confirmation' || o.status === 'ready'), [orders]);
    const openTableOrders = useMemo(() => activeOrders.filter(o => o.orderType === 'dine-in' && o.tableId), [activeOrders]);

    const getCategoryColor = (catName: string) => {
      const config = categoryConfigs.find(c => c.name === catName);
      return config ? config.color : '#6B7280';
    }
    
    const orderTotal = currentOrder?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    const orderItemCount = currentOrder?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

    // ... existing useEffect

    useEffect(() => {
        if (initialTableId) {
            loadOrderForTable(initialTableId);
            clearInitialTable();
        }
    }, [initialTableId]);

    // ... existing functions (startNewOrder, handleNewOrderClick, loadOrder, loadOrderForTable, clearOrderItems, addItemToOrder, updateItemInOrder, removeItemFromOrder, incrementItemQuantity, decrementItemQuantity, handleCustomerInfoSave, handleSaveOrder, handleCompleteSale, handlePayment, handleQuickSale)

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
        if (currentOrder && currentOrder.items.length > 0) {
            createOrder(currentOrder);
        } else {
            addToast('Añade productos para guardar la orden', 'error');
        }
    };

    const handleCompleteSale = () => {
        if (currentOrder && currentOrder.items.length > 0) {
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
    
    // ... rest of the component (filteredMenu, renderOrderHeader, render logic)
    
    const filteredMenu = useMemo(() => {
        let items = menuItems.filter(item => item.category === activeCategory);
        if (searchTerm) {
            items = menuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return items;
    }, [menuItems, activeCategory, searchTerm]);
    
    const renderOrderHeader = (isModal = false) => {
        // ... same implementation as before
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
                        {menuCategories.map(category => {
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
