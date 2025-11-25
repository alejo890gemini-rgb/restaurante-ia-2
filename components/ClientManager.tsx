
import React, { useState, useMemo } from 'react';
import type { Customer, Sale, LoyaltySettings, LoyaltyTier } from '../types';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon, XIcon, SparklesIcon, SpinnerIcon, AwardIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/formatPrice';
import { generateCustomerInsights, suggestLoyaltyReward } from '../services/geminiService';

interface ClientManagerProps {
    customers: Customer[];
    sales: Sale[];
    addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'visitCount' | 'lastVisit'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    loyaltySettings: LoyaltySettings;
}

const CustomerFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: any) => void;
    customerToEdit: Customer | null;
}> = ({ isOpen, onClose, onSave, customerToEdit }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    React.useEffect(() => {
        if (customerToEdit) {
            setName(customerToEdit.name);
            setPhone(customerToEdit.phone);
            setEmail(customerToEdit.email || '');
            setNotes(customerToEdit.notes || '');
        } else {
            setName('');
            setPhone('');
            setEmail('');
            setNotes('');
        }
    }, [customerToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: customerToEdit?.id,
            name, phone, email, notes
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{customerToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="email" placeholder="Email (Opcional)" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <textarea placeholder="Notas Adicionales" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)]">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    customerSales: Sale[];
    onUpdate: (customer: Customer) => void;
    loyaltySettings: LoyaltySettings;
}> = ({ isOpen, onClose, customer, customerSales, onUpdate, loyaltySettings }) => {
    const [insights, setInsights] = useState<{ tags: string[], suggestion: string} | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [activeTab, setActiveTab] = useState('history');
    
    React.useEffect(() => {
        if(isOpen) {
            setInsights(null); // Reset on open
            setActiveTab('history');
        }
    }, [isOpen]);

    const handleGenerateInsights = async () => {
        if (!customer) return;
        setIsLoadingInsights(true);
        
        const history = customerSales.map(s => ({
            date: new Date(s.timestamp).toLocaleDateString(),
            items: s.order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
            total: s.total
        }));
        
        const result = await generateCustomerInsights(customer.name, history);
        if (result) {
            setInsights(result);
            onUpdate({ ...customer, tags: result.tags });
        }
        setIsLoadingInsights(false);
    };

    if (!isOpen || !customer) return null;
    
    const avgTicket = customer.visitCount > 0 ? customer.totalSpent / customer.visitCount : 0;
    const currentTier = loyaltySettings.tiers.find(t => t.id === customer.loyaltyTierId);
    const nextTier = loyaltySettings.tiers.find(t => t.minPoints > (customer.loyaltyPoints || 0));
    const progress = nextTier ? ((customer.loyaltyPoints || 0) / nextTier.minPoints) * 100 : 100;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-6 w-full max-w-3xl h-[90vh] flex flex-col border border-purple-500/30">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{customer.name}</h2>
                        <p className="text-gray-400">{customer.phone}</p>
                    </div>
                    <button onClick={onClose}><XIcon /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-black/20 p-3 rounded-lg"><div className="text-xs text-gray-400">Visitas</div><div className="text-xl font-bold text-white">{customer.visitCount}</div></div>
                    <div className="bg-black/20 p-3 rounded-lg"><div className="text-xs text-gray-400">Total Gastado</div><div className="text-xl font-bold text-emerald-400">{formatPrice(customer.totalSpent)}</div></div>
                    <div className="bg-black/20 p-3 rounded-lg"><div className="text-xs text-gray-400">Ticket Promedio</div><div className="text-xl font-bold text-sky-400">{formatPrice(avgTicket)}</div></div>
                </div>

                <div className="flex space-x-1 border-b border-gray-700 mb-4">
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-semibold rounded-t-md ${activeTab==='history' ? 'bg-black/20 text-white' : 'text-gray-400'}`}>Historial</button>
                    <button onClick={() => setActiveTab('loyalty')} className={`px-4 py-2 text-sm font-semibold rounded-t-md ${activeTab==='loyalty' ? 'bg-black/20 text-white' : 'text-gray-400'}`}>Fidelización</button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'history' && (
                         <div className="space-y-2">
                            {customerSales.length === 0 ? <p className="text-center text-gray-500 py-8">Sin pedidos registrados.</p> : (
                                customerSales.map(sale => (
                                    <div key={sale.id} className="bg-white/5 p-3 rounded-md">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-white">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                            <span className="font-bold text-emerald-400">{formatPrice(sale.total)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">{sale.order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    {activeTab === 'loyalty' && (
                        <div className="space-y-4">
                            <div className="bg-black/20 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-3">Nivel de Lealtad</h3>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full" style={{ background: currentTier?.color || '#A3A3A3' }}>
                                        <AwardIcon className="w-8 h-8 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: currentTier?.color || '#A3A3A3' }}>{currentTier?.name || 'Nivel Básico'}</p>
                                        <p className="text-sm text-gray-300">{currentTier?.perkDescription || 'Acumula puntos para subir de nivel.'}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-300">
                                        <span>Puntos: <span className="font-bold text-white">{(customer.loyaltyPoints || 0).toLocaleString()}</span></span>
                                        {nextTier && <span>Siguiente Nivel: {nextTier.minPoints.toLocaleString()} Pts</span>}
                                    </div>
                                    {nextTier && (
                                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="bg-black/20 p-4 rounded-lg border border-[var(--card-border)]">
                                <h3 className="text-lg font-semibold text-white mb-3">Análisis IA de Cliente</h3>
                                <button onClick={handleGenerateInsights} disabled={isLoadingInsights} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                                    {isLoadingInsights ? <SpinnerIcon /> : <SparklesIcon />}
                                    {isLoadingInsights ? 'Analizando...' : 'Generar Análisis con IA'}
                                </button>
                                {insights && (
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-300">Etiquetas de Comportamiento:</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {insights.tags.map(tag => <span key={tag} className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">{tag}</span>)}
                                            </div>
                                        </div>
                                        <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/50">
                                            <h4 className="text-sm font-bold text-purple-300">Sugerencia de Beneficio:</h4>
                                            <p className="text-sm text-purple-200 mt-1">{insights.suggestion}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ClientManager: React.FC<ClientManagerProps> = ({ customers, sales, addCustomer, updateCustomer, deleteCustomer, loyaltySettings }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.phone.includes(searchTerm)
            )
            .sort((a, b) => b.totalSpent - a.totalSpent); // Show biggest spenders first
    }, [customers, searchTerm]);
    
    const topCustomerThreshold = useMemo(() => {
        if (customers.length < 5) return 0;
        const sorted = [...customers].sort((a,b) => b.totalSpent - a.totalSpent);
        const top20PercentIndex = Math.floor(sorted.length * 0.2);
        return sorted[top20PercentIndex]?.totalSpent || 0;
    }, [customers]);

    const openAddModal = () => {
        setCustomerToEdit(null);
        setFormModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setCustomerToEdit(customer);
        setFormModalOpen(true);
    };
    
    const openDetailModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDetailModalOpen(true);
    };

    const handleSave = (customer: any) => {
        if (customer.id) {
            updateCustomer(customer);
        } else {
            addCustomer(customer);
        }
    };
    
    const handleDelete = (customerId: string) => {
        if(window.confirm("¿Seguro que quieres eliminar este cliente? Su historial de ventas no se borrará.")) {
            deleteCustomer(customerId);
        }
    }
    
    const customerSales = useMemo(() => {
        if (!selectedCustomer) return [];
        return sales.filter(s => {
            const salePhone = s.order.deliveryInfo?.phone || s.order.toGoPhone;
            return salePhone === selectedCustomer.phone;
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [selectedCustomer, sales]);

    const getTier = (tierId?: string): LoyaltyTier | undefined => {
        return loyaltySettings.tiers.find(t => t.id === tierId);
    }

    return (
        <div>
            <CustomerFormModal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} onSave={handleSave} customerToEdit={customerToEdit} />
            <CustomerDetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} customer={selectedCustomer} customerSales={customerSales} onUpdate={updateCustomer} loyaltySettings={loyaltySettings} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><UsersIcon /> Clientes Pro</h2>
                <div className="flex gap-2">
                    <input type="text" placeholder="Buscar por nombre o teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 p-2 border rounded bg-black/20 border-[var(--card-border)] text-white" />
                    <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg hover:bg-[var(--dark-red)] font-semibold">
                        <PlusIcon /> <span className="ml-2 hidden sm:inline">Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCustomers.map(customer => {
                    const isTopCustomer = customer.totalSpent > 0 && customer.totalSpent >= topCustomerThreshold;
                    const tier = getTier(customer.loyaltyTierId);
                    return (
                        <div key={customer.id} className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/50 transition-all group relative">
                            {isTopCustomer && <div className="absolute top-2 right-2 text-amber-400" title="Loco Fan!">⭐</div>}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold">{customer.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-white truncate">{customer.name}</h3>
                                    <p className="text-sm text-gray-400">{customer.phone}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-2 rounded-md">
                                {tier && <p style={{color: tier.color}} className="font-bold flex items-center gap-1"><AwardIcon className="w-3 h-3"/> {tier.name}</p>}
                                <p>Puntos: <span className="font-bold text-white">{(customer.loyaltyPoints || 0).toLocaleString()}</span></p>
                                <p>Total Gastado: <span className="font-bold text-emerald-400">{formatPrice(customer.totalSpent)}</span></p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => openDetailModal(customer)} className="flex-1 text-sm bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg">Ver Detalles</button>
                                <button onClick={() => openEditModal(customer)} className="p-2 bg-white/10 hover:bg-white/20 text-sky-400 rounded-lg"><EditIcon /></button>
                                <button onClick={() => handleDelete(customer.id)} className="p-2 bg-white/10 hover:bg-white/20 text-red-400 rounded-lg"><TrashIcon /></button>
                            </div>
                        </div>
                    );
                })}
                 {filteredCustomers.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-[var(--card-bg)] rounded-xl border-2 border-dashed border-[var(--card-border)]">
                        <UsersIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white">No se encontraron clientes</h3>
                        <p className="text-gray-500 mt-2">Los clientes de delivery y para llevar se añadirán aquí automáticamente.</p>
                        <button onClick={openAddModal} className="mt-4 text-[var(--accent-yellow)] font-semibold">Añadir uno manualmente</button>
                    </div>
                 )}
            </div>
        </div>
    );
};