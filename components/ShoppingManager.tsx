import React, { useState, useRef, useMemo } from 'react';
import type { InventoryItem, Sale, MenuItem, ShoppingListItem, ShoppingList } from '../types';
import { useToast } from '../hooks/useToast';
import { XIcon, MicIcon, WaveIcon, ShoppingCartIcon, SpinnerIcon, WhatsAppIcon, PrinterIcon, SparklesIcon, PlusIcon, TrashIcon, EditIcon, UserIcon } from './Icons';
import { generateShoppingList, parseShoppingItemFromVoice } from '../services/geminiService';

interface ShoppingManagerProps {
    inventoryItems: InventoryItem[];
    sales: Sale[];
    menuItems: MenuItem[];
}

const ItemFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<ShoppingListItem, 'id' | 'checked'>) => void;
    itemToEdit: Omit<ShoppingListItem, 'id' | 'checked'> | null;
}> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');

    React.useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setQuantity(itemToEdit.quantity);
            setCategory(itemToEdit.category);
        } else {
            setName('');
            setQuantity('');
            setCategory('Varios');
        }
    }, [itemToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, quantity, category, checked: false });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-xl p-6 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-xl font-bold mb-4 text-white">{itemToEdit ? 'Editar Ítem' : 'Añadir Ítem Manualmente'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" required className="w-full p-2 rounded bg-black/20 border-[var(--card-border)] text-white" />
                    <div className="relative">
                        <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Cantidad" className="w-full p-2 rounded bg-black/20 border-[var(--card-border)] text-white" />
                        <span className="absolute right-2 top-2 text-xs text-gray-500">(Opcional)</span>
                    </div>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoría (ej. Carnes)" required className="w-full p-2 rounded bg-black/20 border-[var(--card-border)] text-white" />
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded text-white">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ShoppingManager: React.FC<ShoppingManagerProps> = ({ inventoryItems, sales, menuItems }) => {
    const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<ShoppingListItem | null>(null);
    const recognitionRef = useRef<any>(null);
    const { addToast } = useToast();

    const handleGenerateList = async () => {
        setIsLoading(true);
        try {
            const result = await generateShoppingList(inventoryItems, sales, menuItems);
            if (result && Object.keys(result).length > 0) {
                const newList: ShoppingListItem[] = [];
                Object.entries(result).forEach(([category, items]) => {
                    items.forEach(item => {
                        newList.push({
                            id: `${category}-${item.name}-${Math.random()}`,
                            name: item.name,
                            quantity: item.suggestedQuantity,
                            justification: item.justification,
                            category: category,
                            checked: false,
                        });
                    });
                });
                setListItems(newList);
                addToast('Lista de compras generada con IA', 'success');
            } else {
                addToast('El inventario parece estar saludable. ¡No se generó una lista!', 'info');
                setListItems([]);
            }
        } catch (error) {
            addToast('Error al generar la lista con IA.', 'error');
        } finally {
            setIsLoading(false);
        }
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
            setIsLoading(true);
            const item = await parseShoppingItemFromVoice(transcript);
            if (item) {
                addManualItem(item);
                addToast(`Añadido: ${item.name}`, 'success');
            } else {
                addToast(`No entendí "${transcript}". Intenta de nuevo.`, 'error');
            }
            setIsLoading(false);
        };
        recognition.start();
    };

    const groupedItems = useMemo(() => {
        return listItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, ShoppingListItem[]>);
    }, [listItems]);

    const handleToggleChecked = (id: string) => {
        setListItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    const addManualItem = (item: Omit<ShoppingListItem, 'id' | 'checked'>) => {
        const newItem: ShoppingListItem = {
            id: `manual-${Date.now()}`,
            ...item,
            checked: false,
        };
        setListItems(prev => [newItem, ...prev]);
    };
    
    const updateItem = (updatedItem: ShoppingListItem) => {
        setListItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }
    
    const handleSaveItem = (itemData: Omit<ShoppingListItem, 'id' | 'checked'>) => {
        if (itemToEdit) {
            updateItem({ ...itemToEdit, ...itemData });
            addToast('Ítem actualizado', 'success');
        } else {
            addManualItem(itemData);
            addToast('Ítem añadido', 'success');
        }
    };
    
    const openEditModal = (item: ShoppingListItem) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setItemToEdit(null);
        setIsModalOpen(true);
    };
    
    const deleteItem = (id: string) => {
        setListItems(prev => prev.filter(item => item.id !== id));
    };
    
    const formatListForSharing = () => {
        if (listItems.length === 0) return 'La lista de compras está vacía.';
        let text = `🛒 *LISTA DE COMPRAS - LOCO ALITAS*\n_${new Date().toLocaleDateString()}_\n\n`;
        Object.entries(groupedItems).forEach(([category, items]: [string, ShoppingListItem[]]) => {
            text += `*${category.toUpperCase()}*\n`;
            items.forEach(item => {
                const qty = item.quantity ? ` (${item.quantity})` : '';
                text += ` - ${item.name}${qty}\n`;
            });
            text += '\n';
        });
        return text;
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(formatListForSharing());
        addToast('Lista copiada', 'success');
    };

    return (
        <div className="h-full flex flex-col">
            <ItemFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} itemToEdit={itemToEdit} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><ShoppingCartIcon /> Lista de Compras</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4 p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                 <button onClick={handleGenerateList} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors">
                    {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
                    {isLoading ? 'Generando...' : 'Generar con IA (Análisis Completo)'}
                </button>
                 <button onClick={toggleListening} disabled={isLoading} className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isListening ? <WaveIcon /> : <MicIcon />}
                    {isListening ? 'Escuchando...' : 'Dictar Ítem (IA)'}
                </button>
                 <button onClick={openAddModal} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors">
                    <PlusIcon /> Añadir Manualmente
                </button>
            </div>
            
            <div className="flex-1 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 overflow-y-auto">
                {listItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <p>La lista de compras está vacía.</p>
                        <p className="text-sm">Usa los botones de arriba para empezar.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedItems).map(([category, items]: [string, ShoppingListItem[]]) => (
                            <div key={category}>
                                <h3 className="font-bold text-lg text-blue-400 border-b border-gray-700 pb-1 mb-2">{category}</h3>
                                <ul className="space-y-2">
                                    {items.map(item => (
                                        <li key={item.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${item.checked ? 'bg-emerald-900/30' : 'bg-white/5'}`}>
                                            <input type="checkbox" checked={item.checked} onChange={() => handleToggleChecked(item.id)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600"/>
                                            <div className="flex-1">
                                                <p className={`font-semibold ${item.checked ? 'line-through text-gray-500' : 'text-white'}`}>
                                                    {item.name} 
                                                    {item.quantity && <span className="font-normal text-amber-400"> ({item.quantity})</span>}
                                                </p>
                                                {item.justification && <p className="text-xs text-gray-400 italic">↳ {item.justification}</p>}
                                            </div>
                                            {!item.checked && (
                                                <>
                                                    <button onClick={() => openEditModal(item)} className="p-1 text-sky-400 hover:bg-sky-900/50 rounded"><EditIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => deleteItem(item.id)} className="p-1 text-red-400 hover:bg-red-900/50 rounded"><TrashIcon className="w-4 h-4"/></button>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-none pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                <button onClick={() => setListItems([])} disabled={listItems.length === 0} className="flex-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 font-semibold py-2 rounded-lg disabled:opacity-50">Limpiar Lista</button>
                <button onClick={handleCopy} disabled={listItems.length === 0} className="flex-1 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg disabled:opacity-50">Copiar</button>
                <button onClick={() => addToast('Función no implementada.', 'info')} disabled={listItems.length === 0} className="flex-1 text-sm bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><PrinterIcon className="w-4 h-4"/> Imprimir</button>
            </div>
        </div>
    );
};