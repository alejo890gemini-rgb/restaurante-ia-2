import React, { useState, useMemo } from 'react';
import type { MenuItem, MenuItemCategory, Ingredient, InventoryItem, CategoryConfig } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SparklesIcon, XIcon, SpinnerIcon, SettingsIcon } from './Icons';
import { generateMenuDescription, generateImageForDish, analyzeDishPricing } from '../services/geminiService';
import { MENU_CATEGORIES, CATEGORY_PALETTE } from '../constants';
import { CategoryIcon } from './CategoryIcon';
import { formatPrice } from '../utils/formatPrice';
import { useToast } from '../hooks/useToast';

interface MenuManagerProps {
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  inventoryItems: InventoryItem[];
  categoryConfigs: CategoryConfig[];
  updateCategoryConfigs: (configs: CategoryConfig[]) => void;
}

const CategoryColorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    configs: CategoryConfig[];
    onSave: (configs: CategoryConfig[]) => void;
    existingCategories: string[];
}> = ({ isOpen, onClose, configs, onSave, existingCategories }) => {
    const [localConfigs, setLocalConfigs] = useState<CategoryConfig[]>(configs);
    
    // Ensure all existing categories are in localConfigs
    React.useEffect(() => {
        const merged = [...configs];
        existingCategories.forEach(cat => {
            if (!merged.find(c => c.name === cat)) {
                merged.push({ name: cat, color: '#6B7280' }); // Default gray
            }
        });
        setLocalConfigs(merged);
    }, [existingCategories, configs, isOpen]);

    const updateColor = (categoryName: string, color: string) => {
        setLocalConfigs(prev => prev.map(c => c.name === categoryName ? { ...c, color } : c));
    };

    const handleSave = () => {
        onSave(localConfigs);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-[var(--card-border)] max-h-[80vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-white">🎨 Colores de Categoría</h2>
                <p className="text-gray-400 text-sm mb-4">Selecciona un color para cada categoría para identificarlos rápidamente en el POS.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {localConfigs.map((config, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-[var(--card-border)]">
                            <span className="text-white font-medium text-sm w-1/3">{config.name}</span>
                            <div className="flex flex-wrap gap-2 justify-end">
                                {CATEGORY_PALETTE.map(p => (
                                    <button
                                        key={p.color}
                                        onClick={() => updateColor(config.name, p.color)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${config.color === p.color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: p.color }}
                                        title={p.name}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-[var(--card-border)]">
                    <button onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar Cambios</button>
                </div>
             </div>
        </div>
    )
}

const MenuItemFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: any) => void;
    itemToEdit: MenuItem | null;
    inventoryItems: InventoryItem[];
}> = ({ isOpen, onClose, onSave, itemToEdit, inventoryItems }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<MenuItemCategory>('Main Course');
    const [hasWings, setHasWings] = useState(false);
    const [hasFries, setHasFries] = useState(false);
    const [submenuKey, setSubmenuKey] = useState('');
    const [maxChoices, setMaxChoices] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>('');
    const [recipe, setRecipe] = useState<Ingredient[]>([]);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
    const [pricingAdvice, setPricingAdvice] = useState('');
    const { addToast } = useToast();

    // Recipe state
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [ingredientQuantity, setIngredientQuantity] = useState('');

    React.useEffect(() => {
        setPricingAdvice('');
        if (itemToEdit) {
            setName(itemToEdit.name);
            setDescription(itemToEdit.description);
            setPrice(itemToEdit.price.toString());
            setCategory(itemToEdit.category);
            setHasWings(itemToEdit.hasWings || false);
            setHasFries(itemToEdit.hasFries || false);
            setSubmenuKey(itemToEdit.submenuKey || '');
            setMaxChoices(itemToEdit.maxChoices?.toString() || '');
            setImageUrl(itemToEdit.imageUrl || '');
            setRecipe(itemToEdit.recipe || []);
        } else {
            setName('');
            setDescription('');
            setPrice('');
            setCategory(MENU_CATEGORIES[0] || 'Other');
            setHasWings(false);
            setHasFries(false);
            setSubmenuKey('');
            setMaxChoices('');
            setImageUrl('');
            setRecipe([]);
        }
    }, [itemToEdit, isOpen]);
    
    const handleAddIngredientToRecipe = () => {
        if (!selectedIngredient || !ingredientQuantity) {
            addToast('Selecciona un ingrediente y define una cantidad.', 'error');
            return;
        }
        if (recipe.some(ing => ing.inventoryItemId === selectedIngredient)) {
            addToast('Ese ingrediente ya está en la receta.', 'info');
            return;
        }
        const newIngredient: Ingredient = {
            inventoryItemId: selectedIngredient,
            quantity: parseFloat(ingredientQuantity),
        };
        setRecipe(prev => [...prev, newIngredient]);
        setSelectedIngredient('');
        setIngredientQuantity('');
    };
    
    const handleRemoveIngredient = (inventoryItemId: string) => {
        setRecipe(prev => prev.filter(ing => ing.inventoryItemId !== inventoryItemId));
    };

    const handleGenerateDescription = async () => {
        if (!name) return;
        setIsGeneratingDesc(true);
        try {
            const desc = await generateMenuDescription(name);
            setDescription(desc);
        } catch (error) {
            console.error("Failed to generate description", error);
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!name || !description) {
            addToast('El nombre y la descripción son necesarios para generar la imagen.', 'error');
            return;
        };
        setIsGeneratingImg(true);
        try {
            const generatedUrl = await generateImageForDish(name, description);
            setImageUrl(generatedUrl);
        } catch (error) {
            addToast('Error al generar la imagen.', 'error');
            console.error("Failed to generate image", error);
        } finally {
            setIsGeneratingImg(false);
        }
    };
    
    // Profit Calculation
    const totalCost = recipe.reduce((sum, ingredient) => {
        const invItem = inventoryItems.find(i => i.id === ingredient.inventoryItemId);
        if (!invItem) return sum;
        // Determine cost per unit based on ingredient quantity vs inventory unit is simplified here
        // Assuming recipe quantity matches inventory unit for simplicity or user conversion
        return sum + (invItem.cost * ingredient.quantity);
    }, 0);

    const currentPrice = parseFloat(price) || 0;
    const margin = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) * 100 : 0;
    
    const handleAnalyzePrice = async () => {
        if (!name || currentPrice <= 0) {
            addToast('Ingresa un nombre y precio válido.', 'error');
            return;
        }
        setIsAnalyzingPrice(true);
        const ingredientNames = recipe.map(r => {
            const i = inventoryItems.find(inv => inv.id === r.inventoryItemId);
            return i ? i.name : 'Unknown';
        });

        try {
            const advice = await analyzeDishPricing(name, currentPrice, totalCost, ingredientNames);
            setPricingAdvice(advice);
        } catch (e) {
            setPricingAdvice("Error al analizar.");
        } finally {
            setIsAnalyzingPrice(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            id: itemToEdit?.id,
            name, 
            description, 
            price: parseFloat(price), 
            category,
            hasWings,
            hasFries,
            submenuKey: submenuKey || undefined,
            maxChoices: maxChoices ? parseInt(maxChoices, 10) : undefined,
            imageUrl,
            recipe,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-[var(--card-border)] max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-white flex-none">{itemToEdit ? 'Editar Platillo' : 'Nuevo Platillo'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Dish Info */}
                        <div className="space-y-4">
                            {imageUrl || isGeneratingImg ? (
                                <div className="w-full h-40 bg-black/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                                    {isGeneratingImg ? <span className="text-gray-400">Generando imagen...</span> : <img src={imageUrl} alt={name} className="w-full h-full object-cover" />}
                                </div>
                            ) : null}

                            <input type="text" placeholder="Nombre del platillo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            <div className="relative">
                                <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white"></textarea>
                                <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !name} className="absolute bottom-2 right-2 flex items-center bg-purple-600 text-white px-2 py-1 rounded-md text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                  <SparklesIcon className="w-4 h-4" />
                                  <span className="ml-1">{isGeneratingDesc ? '...' : 'AI'}</span>
                                </button>
                            </div>
                            <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImg || !name || !description} className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <SparklesIcon />
                                <span>{isGeneratingImg ? 'Generando Imagen...' : 'Generar Imagen con IA'}</span>
                            </button>
                            
                            {/* Price Analysis Section */}
                            <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-[var(--card-border)]">
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="flex-1 p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                                    <button type="button" onClick={handleAnalyzePrice} disabled={isAnalyzingPrice} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg disabled:opacity-50" title="Analizar Precio con IA">
                                        <SparklesIcon />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="text-gray-400">Costo: <span className="text-white font-mono">{formatPrice(totalCost)}</span></div>
                                    <div className="text-gray-400">Margen: <span className={`font-mono font-bold ${margin < 50 ? 'text-red-500' : 'text-emerald-500'}`}>{margin.toFixed(1)}%</span></div>
                                </div>
                                {pricingAdvice && (
                                    <div className="text-xs text-emerald-200 bg-emerald-900/30 p-2 rounded border border-emerald-500/30 mt-2">
                                        <strong>LocoBot:</strong> {pricingAdvice}
                                    </div>
                                )}
                            </div>

                            <input type="text" placeholder="Categoría" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            
                            {category === '🍨 LOCOGELATOS ARTESANALES' && (
                                <input type="number" placeholder="Máx. Opciones (Gelato)" value={maxChoices} onChange={e => setMaxChoices(e.target.value)} min="0" step="1" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                            )}
                            
                            <input type="text" placeholder="Clave de Submenú (ej. jugos_naturales)" value={submenuKey} onChange={e => setSubmenuKey(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />

                            <div className="flex space-x-6 pt-2">
                                <label className="flex items-center"><input type="checkbox" checked={hasWings} onChange={e => setHasWings(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"/><span className="ml-2 text-sm text-gray-300">Incluye Alitas</span></label>
                                <label className="flex items-center"><input type="checkbox" checked={hasFries} onChange={e => setHasFries(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"/><span className="ml-2 text-sm text-gray-300">Incluye Papas</span></label>
                            </div>
                        </div>

                        {/* Right Column: Recipe Manager */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b-2 border-[var(--accent-yellow)] pb-1">
                                <h3 className="text-xl font-semibold text-white">Receta / Costos</h3>
                                <span className="text-sm text-gray-400">Total Costo: {formatPrice(totalCost)}</span>
                            </div>
                            <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-[var(--card-border)]">
                                <div className="flex gap-2">
                                    <select value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
                                        <option value="" disabled>Seleccionar ingrediente...</option>
                                        {inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name} ({formatPrice(item.cost)}/{item.unit})</option>)}
                                    </select>
                                    <input type="number" placeholder="Cant." value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} min="0" step="any" className="w-24 p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                                </div>
                                <button type="button" onClick={handleAddIngredientToRecipe} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors text-sm">Añadir Ingrediente</button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {recipe.length > 0 ? recipe.map(ing => {
                                    const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);
                                    const itemCost = invItem ? invItem.cost * ing.quantity : 0;
                                    return (
                                        <div key={ing.inventoryItemId} className="flex justify-between items-center p-2 rounded-md bg-white/5">
                                            <div>
                                                <div className="font-semibold text-white text-sm">{invItem?.name || 'Desconocido'}</div>
                                                <div className="text-gray-400 text-xs">{ing.quantity} {invItem?.unit} • {formatPrice(itemCost)}</div>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveIngredient(ing.inventoryItemId)} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    );
                                }) : <p className="text-center text-gray-500 text-sm py-4">Aún no hay ingredientes en la receta.</p>}
                            </div>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-[var(--card-border)] flex-none">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                </div>
            </div>
        </div>
    );
};


export const MenuManager: React.FC<MenuManagerProps> = ({ menuItems, addMenuItem, updateMenuItem, deleteMenuItem, inventoryItems, categoryConfigs, updateCategoryConfigs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const [generatingDescId, setGeneratingDescId] = useState<string | null>(null);
  const { addToast } = useToast();

  const itemsByCategory = useMemo(() => {
    return menuItems.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: MenuItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };
  
  const handleSave = (item: any) => {
    if(item.id) {
        updateMenuItem(item);
        addToast('Platillo actualizado con éxito', 'success');
    } else {
        addMenuItem(item);
        addToast('Platillo añadido con éxito', 'success');
    }
  };

  const handleGenerateDescriptionForRow = async (item: MenuItem) => {
    if (!item.name) {
        addToast('El platillo necesita un nombre para generar una descripción.', 'error');
        return;
    }
    setGeneratingDescId(item.id);
    try {
        const newDescription = await generateMenuDescription(item.name);
        updateMenuItem({ ...item, description: newDescription });
        addToast(`Descripción generada para ${item.name}`, 'success');
    } catch (error) {
        console.error("Failed to generate description for row", error);
        addToast('Error al generar la descripción.', 'error');
    } finally {
        setGeneratingDescId(null);
    }
  };
  
  const getCategoryColor = (catName: string) => {
      const config = categoryConfigs.find(c => c.name === catName);
      return config ? config.color : '#6B7280';
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Gestión de Menú (Pro)</h2>
        <div className="flex gap-2">
             <button onClick={() => setIsColorModalOpen(true)} className="flex items-center bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-800 transition-colors font-semibold">
                <SettingsIcon className="w-5 h-5" />
                <span className="ml-2">Colores</span>
            </button>
            <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[var(--dark-red)] transition-colors font-semibold">
              <PlusIcon />
              <span className="ml-2">Añadir Platillo</span>
            </button>
        </div>
      </div>
      
      <div className="space-y-8">
        {Object.keys(itemsByCategory).map(category => {
            const color = getCategoryColor(category);
            return (
            <div key={category}>
                <h3 className="text-2xl font-semibold mb-4 text-white flex items-center gap-3">
                  <span className="p-2 rounded-full shadow-md" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}>
                       <CategoryIcon category={category} className="w-5 h-5 text-white"/>
                  </span>
                  <span className="border-b-2 pb-1" style={{ borderColor: color }}>{category}</span>
                </h3>
                <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs uppercase bg-white/5 text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-3/5">Platillo</th>
                                    <th scope="col" className="px-6 py-3">Precio</th>
                                    <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsByCategory[category].map(item => (
                                    <tr key={item.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 rounded-md mr-4 flex items-center justify-center bg-black/20 flex-shrink-0 overflow-hidden border border-[var(--card-border)]">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <CategoryIcon category={item.category} className="w-7 h-7 text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-base font-semibold">{item.name}</div>
                                                    {item.description ? (
                                                      <div className="font-normal text-gray-500 text-xs max-w-xs truncate hidden sm:block">{item.description}</div>
                                                    ) : (
                                                      <div className="hidden sm:block mt-1">
                                                          {generatingDescId === item.id ? (
                                                              <div className="flex items-center gap-2 text-xs text-purple-400">
                                                                  <SpinnerIcon className="w-4 h-4 animate-spin"/>
                                                                  <span>Generando...</span>
                                                              </div>
                                                          ) : (
                                                              <button 
                                                                  onClick={() => handleGenerateDescriptionForRow(item)}
                                                                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                                              >
                                                                  <SparklesIcon className="w-4 h-4" />
                                                                  <span>Generar con IA</span>
                                                              </button>
                                                          )}
                                                      </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 font-semibold text-white">{formatPrice(item.price)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditModal(item)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon /></button>
                                            <button onClick={() => deleteMenuItem(item.id)} className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )
        })}
      </div>
      
      <MenuItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        itemToEdit={itemToEdit}
        inventoryItems={inventoryItems}
      />
      
      <CategoryColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        configs={categoryConfigs}
        onSave={updateCategoryConfigs}
        existingCategories={Object.keys(itemsByCategory)}
      />
    </div>
  );
};