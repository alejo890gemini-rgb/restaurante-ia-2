
import React, { useState } from 'react';
import type { Role, Permission } from '../types';
import { AVAILABLE_PERMISSIONS } from '../constants';
import { PlusIcon, EditIcon, TrashIcon, ShieldCheckIcon } from './Icons';

interface RoleManagerProps {
    roles: Role[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (role: Role) => void;
    deleteRole: (roleId: string) => void;
}

const RoleFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: any) => void;
    roleToEdit: Role | null;
}> = ({ isOpen, onClose, onSave, roleToEdit }) => {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);

    React.useEffect(() => {
        if (roleToEdit) {
            setName(roleToEdit.name);
            setPermissions(roleToEdit.permissions);
        } else {
            setName('');
            setPermissions([]);
        }
    }, [roleToEdit, isOpen]);

    const handleTogglePermission = (perm: Permission) => {
        setPermissions(prev => 
            prev.includes(perm) 
                ? prev.filter(p => p !== perm) 
                : [...prev, perm]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: roleToEdit?.id,
            name,
            permissions,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-[var(--card-border)] flex flex-col max-h-[90vh]">
                <h2 className="text-2xl font-bold mb-6 text-white">{roleToEdit ? 'Editar Rol' : 'Nuevo Rol'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="mb-6">
                         <input type="text" placeholder="Nombre del Rol (ej. Gerente)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                        <h3 className="text-lg font-semibold text-gray-300 mb-3">Permisos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AVAILABLE_PERMISSIONS.map(perm => (
                                <label key={perm.key} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={permissions.includes(perm.key)}
                                        onChange={() => handleTogglePermission(perm.key)}
                                        className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-800 text-[var(--primary-red)] focus:ring-[var(--primary-red)]"
                                    />
                                    <span className="text-sm text-gray-200">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-[var(--card-border)]">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const RoleManager: React.FC<RoleManagerProps> = ({ roles, addRole, updateRole, deleteRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

    const openAddModal = () => {
        setRoleToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (role: Role) => {
        setRoleToEdit(role);
        setIsModalOpen(true);
    };

    const handleSave = (role: any) => {
        if (role.id) {
            updateRole(role);
        } else {
            addRole(role);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Roles y Permisos</h3>
                <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-3 py-1.5 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors text-sm font-semibold">
                    <PlusIcon />
                    <span className="ml-2">Nuevo Rol</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                    <div key={role.id} className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)] shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                <ShieldCheckIcon className="text-[var(--accent-yellow)]"/>
                                {role.name}
                            </h4>
                            <div className="flex gap-1">
                                <button onClick={() => openEditModal(role)} className="text-sky-400 hover:text-sky-300 p-1 rounded hover:bg-white/5"><EditIcon className="w-4 h-4"/></button>
                                {!role.isSystem && (
                                    <button onClick={() => deleteRole(role.id)} className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-white/5"><TrashIcon className="w-4 h-4"/></button>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 bg-black/20 p-2 rounded h-32 overflow-y-auto">
                            {role.permissions.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-1">
                                    {role.permissions.map(p => (
                                        <li key={p}>{AVAILABLE_PERMISSIONS.find(ap => ap.key === p)?.label || p}</li>
                                    ))}
                                </ul>
                            ) : <span className="italic text-gray-600">Sin permisos asignados</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            <RoleFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} roleToEdit={roleToEdit} />
        </div>
    );
};
