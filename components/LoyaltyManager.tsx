
import React, { useState, useEffect } from 'react';
import type { LoyaltySettings, LoyaltyTier, LoyaltyReward, MenuItem } from '../types';
import { AwardIcon, PlusIcon, EditIcon, TrashIcon, XIcon, SparklesIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface LoyaltyManagerProps {
    settings: LoyaltySettings;
    onSave: (settings: LoyaltySettings) => void;
    menuItems: MenuItem[];
}

// Tier Form Modal
const TierFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (tier: Omit<LoyaltyTier, 'id'> | LoyaltyTier) => void;
    tierToEdit: LoyaltyTier | null;
}> = ({ isOpen, onClose, onSave, tierToEdit }) => {
    const [name, setName] = useState('');
    const [minPoints, setMinPoints] = useState('');
    const [perkDescription, setPerkDescription] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [color, setColor] = useState('#A3A3A3');

    useEffect(() => {
        if (tierToEdit) {
            setName(tierToEdit.name);
            setMinPoints(tierToEdit.minPoints.toString());
            setPerkDescription(tierToEdit.perkDescription);
            setDiscountPercentage(tierToEdit.discountPercentage.toString());
            setColor(tierToEdit.color);
        } else {
            setName('');
            setMinPoints('');
            setPerkDescription('');
            setDiscountPercentage('0');
            setColor('#A3A3A3');
        }
    }, [tierToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: tierToEdit?.id || '',
            name,
            minPoints: parseInt(minPoints, 10),
            perkDescription,
            discountPercentage: parseInt(discountPercentage, 10) || 0,
            color,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] p-6 rounded-lg w-full max-w-md border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">{tierToEdit ? 'Editar Nivel' : 'Nuevo Nivel'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Nivel (ej. Super Loco)" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <input type="number" value={minPoints} onChange={e => setMinPoints(e.target.value)} placeholder="Puntos Mínimos para Alcanzarlo" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <input type="text" value={perkDescription} onChange={e => setPerkDescription(e.target.value)} placeholder="Descripción del Beneficio" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <input type="number" value={discountPercentage} onChange={e => setDiscountPercentage(e.target.value)} placeholder="% de Descuento (ej. 5)" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 rounded bg-black/20 border-gray-600" />
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Reward Form Modal
const RewardFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (reward: Omit<LoyaltyReward, 'id'> | LoyaltyReward) => void;
    rewardToEdit: LoyaltyReward | null;
    menuItems: MenuItem[];
}> = ({ isOpen, onClose, onSave, rewardToEdit, menuItems }) => {
    const [name, setName] = useState('');
    const [pointCost, setPointCost] = useState('');
    const [type, setType] = useState<'free_item' | 'discount_percentage'>('free_item');
    const [value, setValue] = useState('');
    const [menuItemId, setMenuItemId] = useState('');

    useEffect(() => {
        if (rewardToEdit) {
            setName(rewardToEdit.name);
            setPointCost(rewardToEdit.pointCost.toString());
            setType(rewardToEdit.type);
            setValue(rewardToEdit.value.toString());
            setMenuItemId(rewardToEdit.menuItemId || '');
        } else {
            setName('');
            setPointCost('');
            setType('free_item');
            setValue('');
            setMenuItemId('');
        }
    }, [rewardToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: rewardToEdit?.id || '',
            name,
            pointCost: parseInt(pointCost, 10),
            type,
            value: parseInt(value, 10),
            menuItemId: type === 'free_item' ? menuItemId : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] p-6 rounded-lg w-full max-w-md border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">{rewardToEdit ? 'Editar Recompensa' : 'Nueva Recompensa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Premio" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <input type="number" value={pointCost} onChange={e => setPointCost(e.target.value)} placeholder="Costo en Puntos" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 rounded bg-black/20 border-gray-600 text-white">
                        <option value="free_item">Producto Gratis</option>
                        <option value="discount_percentage">Descuento (%)</option>
                    </select>
                    {type === 'free_item' ? (
                        <select value={menuItemId} onChange={e => setMenuItemId(e.target.value)} required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white">
                            <option value="" disabled>Selecciona un producto del menú</option>
                            {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    ) : (
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Valor del descuento (ej. 10 para 10%)" required className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({ settings, onSave, menuItems }) => {
    const [localSettings, setLocalSettings] = useState<LoyaltySettings>(settings);
    const [isTierModalOpen, setTierModalOpen] = useState(false);
    const [isRewardModalOpen, setRewardModalOpen] = useState(false);
    const [tierToEdit, setTierToEdit] = useState<LoyaltyTier | null>(null);
    const [rewardToEdit, setRewardToEdit] = useState<LoyaltyReward | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSettingChange = (field: keyof LoyaltySettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    // Tier handlers
    const handleSaveTier = (tier: LoyaltyTier) => {
        const tiers = [...localSettings.tiers];
        if (tierToEdit) {
            const index = tiers.findIndex(t => t.id === tier.id);
            tiers[index] = tier;
        } else {
            tiers.push({ ...tier, id: `tier-${Date.now()}` });
        }
        handleSettingChange('tiers', tiers.sort((a, b) => a.minPoints - b.minPoints));
    };
    const handleDeleteTier = (id: string) => {
        if (localSettings.tiers.length <= 1) {
            addToast('Debe existir al menos un nivel.', 'error');
            return;
        }
        handleSettingChange('tiers', localSettings.tiers.filter(t => t.id !== id));
    };

    // Reward handlers
    const handleSaveReward = (reward: LoyaltyReward) => {
        const rewards = [...localSettings.rewards];
        if (rewardToEdit) {
            const index = rewards.findIndex(r => r.id === reward.id);
            rewards[index] = reward;
        } else {
            rewards.push({ ...reward, id: `reward-${Date.now()}` });
        }
        handleSettingChange('rewards', rewards.sort((a,b) => a.pointCost - b.pointCost));
    };
    const handleDeleteReward = (id: string) => {
        handleSettingChange('rewards', localSettings.rewards.filter(r => r.id !== id));
    };
    
    return (
        <div>
            <TierFormModal isOpen={isTierModalOpen} onClose={() => setTierModalOpen(false)} onSave={handleSaveTier} tierToEdit={tierToEdit} />
            <RewardFormModal isOpen={isRewardModalOpen} onClose={() => setRewardModalOpen(false)} onSave={handleSaveReward} rewardToEdit={rewardToEdit} menuItems={menuItems} />

            <div className="flex items-center gap-4 pb-4 border-b border-[var(--card-border)] mb-6">
                 <div className="p-3 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-900/20">
                    <AwardIcon className="w-8 h-8"/>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-bangers tracking-wide">Sistema de Fidelización</h2>
                    <p className="text-gray-400">Configura los premios y niveles para tus clientes frecuentes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GENERAL SETTINGS */}
                <div className="space-y-6">
                    <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)]">
                        <h3 className="text-xl font-bold text-white mb-4">Configuración General</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                                <span className="font-semibold text-white">Activar Sistema de Puntos</span>
                                <input type="checkbox" checked={localSettings.isEnabled} onChange={e => handleSettingChange('isEnabled', e.target.checked)} className="h-6 w-10 rounded-full bg-gray-600 checked:bg-emerald-500 transition-colors appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:left-1 before:top-1 checked:before:translate-x-4 before:transition-transform" />
                            </label>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Puntos por cada $1 COP</label>
                                <input type="number" value={localSettings.pointsPerPeso} onChange={e => handleSettingChange('pointsPerPeso', parseFloat(e.target.value))} step="0.001" className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                                <p className="text-xs text-gray-500 mt-1">Ej: 0.001 equivale a 1 punto por cada $1,000 COP.</p>
                            </div>
                        </div>
                    </div>

                    {/* TIERS */}
                    <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Niveles de Lealtad</h3>
                            <button onClick={() => { setTierToEdit(null); setTierModalOpen(true); }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg"><PlusIcon className="w-4 h-4" /> Añadir</button>
                        </div>
                        <div className="space-y-2">
                            {localSettings.tiers.map(tier => (
                                <div key={tier.id} className="p-3 rounded-lg flex items-center justify-between" style={{ border: `2px solid ${tier.color}`, background: `${tier.color}1A` }}>
                                    <div>
                                        <p className="font-bold" style={{ color: tier.color }}>{tier.name}</p>
                                        <p className="text-xs text-gray-300">{tier.minPoints.toLocaleString()} Puntos | {tier.perkDescription}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setTierToEdit(tier); setTierModalOpen(true); }} className="text-sky-400"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteTier(tier.id)} className="text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* REWARDS */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Catálogo de Recompensas</h3>
                        <button onClick={() => { setRewardToEdit(null); setRewardModalOpen(true); }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg"><PlusIcon className="w-4 h-4" /> Añadir</button>
                    </div>
                     <div className="space-y-2">
                        {localSettings.rewards.map(reward => (
                            <div key={reward.id} className="p-3 bg-black/20 rounded-lg flex items-center justify-between border-l-4 border-amber-500">
                                <div>
                                    <p className="font-bold text-white">{reward.name}</p>
                                    <p className="text-xs text-amber-300 font-semibold">{reward.pointCost.toLocaleString()} Puntos</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setRewardToEdit(reward); setRewardModalOpen(true); }} className="text-sky-400"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteReward(reward.id)} className="text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={() => onSave(localSettings)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors">Guardar Cambios</button>
            </div>
        </div>
    );
};
