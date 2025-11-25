
import React, { useState, useMemo, useEffect } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import { PlusIcon, EditIcon, TrashIcon, DollarSignIcon, SettingsIcon, XIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/formatPrice';

interface ExpensesManagerProps {
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (expenseId: string) => void;
    categories: string[];
    saveCategories: (categories: string[]) => void;
}

const CategoryManageModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onSave: (categories: string[]) => void;
    expenses: Expense[];
}> = ({ isOpen, onClose, categories, onSave, expenses }) => {
    const [newCategory, setNewCategory] = useState('');
    const { addToast } = useToast();

    const handleAdd = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (categories.includes(trimmed)) {
            addToast('Esa categoría ya existe.', 'error');
            return;
        }
        onSave([...categories, trimmed]);
        setNewCategory('');
    };

    const handleDelete = (cat: string) => {
        if (expenses.some(e => e.category === cat)) {
            addToast(`No se puede eliminar "${cat}" porque tiene gastos asociados.`, 'error');
            return;
        }
        if (categories.length <= 1) {
            addToast('Debe haber al menos una categoría.', 'error');
            return;
        }
        onSave(categories.filter(c => c !== cat));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-6 w-full max-w-md border border-[var(--card-border)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Gestionar Categorías</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="Nueva categoría..." 
                        value={newCategory} 
                        onChange={e => setNewCategory(e.target.value)} 
                        className="flex-1 p-2 rounded bg-black/20 border border-gray-600 text-white"
                        onKeyPress={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                    {categories.map(cat => (
                        <div key={cat} className="flex justify-between items-center bg-white/5 p-2 rounded">
                            <span className="text-white">{cat}</span>
                            <button onClick={() => handleDelete(cat)} className="text-red-400 hover:text-red-300 p-1 hover:bg-white/10 rounded">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ExpenseFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: any) => void;
    expenseToEdit: Expense | null;
    categories: string[];
}> = ({ isOpen, onClose, onSave, expenseToEdit, categories }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>('');
    const { addToast } = useToast();

    useEffect(() => {
        if (expenseToEdit) {
            setDescription(expenseToEdit.description);
            setAmount(expenseToEdit.amount.toString());
            setDate(expenseToEdit.date.split('T')[0]);
            setCategory(expenseToEdit.category);
        } else {
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory(categories[0] || '');
        }
    }, [expenseToEdit, isOpen, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) {
            addToast("Descripción y monto son obligatorios.", 'error');
            return;
        }
        onSave({
            id: expenseToEdit?.id,
            description,
            amount: parseFloat(amount),
            date,
            category,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{expenseToEdit ? 'Editar Gasto' : 'Registrar Gasto'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Descripción del Gasto" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} required min="0" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Categoría</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
                            {categories.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const ExpensesManager: React.FC<ExpensesManagerProps> = ({ expenses, addExpense, updateExpense, deleteExpense, categories, saveCategories }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const openAddModal = () => {
        setExpenseToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleSave = (expenseData: any) => {
        const expenseToSave = { ...expenseData, date: new Date(expenseData.date).toISOString() };
        if (expenseData.id) {
            updateExpense(expenseToSave);
            addToast('Gasto actualizado', 'success');
        } else {
            addExpense(expenseToSave);
            addToast('Gasto registrado', 'success');
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
            deleteExpense(id);
            addToast('Gasto eliminado', 'success');
        }
    }

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchTerm]);
    
    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const todayExpenses = expenses.filter(e => e.date.startsWith(today));
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const totalToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const categoryTotals: Record<string, number> = {};
        monthExpenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });
        
        const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];

        return {
            totalToday,
            totalMonth,
            topCategory: topCategory ? topCategory[0] : 'N/A'
        };
    }, [expenses]);

    return (
        <div>
            <ExpenseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} expenseToEdit={expenseToEdit} categories={categories} />
            <CategoryManageModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={categories} onSave={saveCategories} expenses={expenses} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><DollarSignIcon /> Gestión de Gastos</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsCatModalOpen(true)} className="flex items-center bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-semibold">
                        <SettingsIcon className="w-5 h-5" /> <span className="ml-2 hidden sm:inline">Categorías</span>
                    </button>
                    <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg hover:bg-[var(--dark-red)] font-semibold">
                        <PlusIcon /> <span className="ml-2 hidden sm:inline">Registrar Gasto</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]"><div className="text-sm text-gray-400">Gastos Hoy</div><div className="text-2xl font-bold text-red-400">{formatPrice(stats.totalToday)}</div></div>
                <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]"><div className="text-sm text-gray-400">Gastos Mes Actual</div><div className="text-2xl font-bold text-red-400">{formatPrice(stats.totalMonth)}</div></div>
                <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]"><div className="text-sm text-gray-400">Categoría Principal (Mes)</div><div className="text-2xl font-bold text-white">{stats.topCategory}</div></div>
            </div>

            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                 <div className="p-4 border-b border-[var(--card-border)]">
                    <input type="text" placeholder="Buscar gasto por descripción..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 rounded-lg bg-black/20 border border-gray-700 text-white" />
                 </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs uppercase bg-white/5 text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Fecha</th>
                                <th scope="col" className="px-6 py-3">Descripción</th>
                                <th scope="col" className="px-6 py-3">Categoría</th>
                                <th scope="col" className="px-6 py-3 text-right">Monto</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                                    <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-semibold text-white">{expense.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30">{expense.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-red-400">{formatPrice(expense.amount)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openEditModal(expense)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon /></button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredExpenses.length === 0 && <p className="text-center py-8 text-gray-500">No se encontraron gastos.</p>}
                </div>
            </div>
        </div>
    );
};
