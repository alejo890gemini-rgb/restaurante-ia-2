
import React, { useState } from 'react';
import type { User, Role } from '../types';
import { PlusIcon, EditIcon, TrashIcon, UserIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface UserManagerProps {
  users: User[];
  roles: Role[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: any) => void;
    roles: Role[];
    userToEdit: User | null;
}> = ({ isOpen, onClose, onSave, roles, userToEdit }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const { addToast } = useToast();

    React.useEffect(() => {
        if(userToEdit) {
            setName(userToEdit.name);
            setUsername(userToEdit.username);
            setPassword(userToEdit.password);
            setRoleId(userToEdit.roleId);
        } else {
            setName('');
            setUsername('');
            setPassword('');
            setRoleId(roles[0]?.id || '');
        }
    }, [userToEdit, isOpen, roles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !roleId) {
            addToast("Todos los campos son obligatorios.", 'error');
            return;
        }
        onSave({
            id: userToEdit?.id,
            name,
            username, 
            password, 
            roleId 
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="text" placeholder="Usuario (Login)" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <select value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
                        {roles.map(role => (
                            <option key={role.id} value={role.id} className="bg-gray-800">{role.name}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const UserManager: React.FC<UserManagerProps> = ({ users, roles, addUser, updateUser, deleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const openAddModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleSave = (user: any) => {
    if(user.id) {
        updateUser(user);
    } else {
        addUser(user);
    }
  };

  const getRoleName = (roleId: string) => {
      return roles.find(r => r.id === roleId)?.name || 'Rol Desconocido';
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Usuarios del Sistema</h3>
        <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-3 py-1.5 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors text-sm font-semibold">
          <PlusIcon />
          <span className="ml-2">Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Usuario</th>
                <th scope="col" className="px-6 py-3">Rol</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300"><UserIcon className="w-4 h-4"/></div>
                      {user.name}
                  </td>
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4">
                      <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30">
                        {getRoleName(user.roleId)}
                      </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(user)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"><TrashIcon className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        roles={roles}
        userToEdit={userToEdit}
      />
    </div>
  );
};
