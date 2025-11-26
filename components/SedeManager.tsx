import React, { useState } from 'react';
import type { Sede } from '../types';
import { PlusIcon, EditIcon, TrashIcon, MapPinIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface SedeManagerProps {
  sedes: Sede[];
  addSede: (sede: Omit<Sede, 'id'>) => void;
  updateSede: (sede: Sede) => void;
  deleteSede: (sedeId: string) => void;
}

const SedeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (sede: any) => void;
    sedeToEdit: Sede | null;
}> = ({ isOpen, onClose, onSave, sedeToEdit }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    React.useEffect(() => {
        if (sedeToEdit) {
            setName(sedeToEdit.name);
            setAddress(sedeToEdit.address);
        } else {
            setName('');
            setAddress('');
        }
    }, [sedeToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: sedeToEdit?.id,
            name,
            address
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{sedeToEdit ? 'Editar Sede' : 'Nueva Sede'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre de la Sede (ej. Sede Centro)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const SedeManager: React.FC<SedeManagerProps> = ({ sedes, addSede, updateSede, deleteSede }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sedeToEdit, setSedeToEdit] = useState<Sede | null>(null);
  const { addToast } = useToast();

  const openAddModal = () => {
    setSedeToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sede: Sede) => {
    setSedeToEdit(sede);
    setIsModalOpen(true);
  };

  const handleSave = (sede: any) => {
    if (sede.id) {
        updateSede(sede);
        addToast('Sede actualizada', 'success');
    } else {
        addSede(sede);
        addToast('Sede creada con éxito', 'success');
    }
  };

  const handleDelete = (id: string) => {
      if (sedes.length <= 1) {
          addToast('No puedes eliminar la última sede.', 'error');
          return;
      }
      if (window.confirm('¿Estás seguro? Eliminar una sede es irreversible.')) {
        deleteSede(id);
      }
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Sedes / Sucursales</h3>
        <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-3 py-1.5 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors text-sm font-semibold">
          <PlusIcon />
          <span className="ml-2">Nueva Sede</span>
        </button>
      </div>

      <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Dirección</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map(sede => (
                <tr key={sede.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300"><MapPinIcon className="w-4 h-4"/></div>
                      {sede.name}
                  </td>
                  <td className="px-6 py-4">{sede.address}</td>
                  <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(sede)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(sede.id)} className="text-red-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"><TrashIcon className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SedeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        sedeToEdit={sedeToEdit}
      />
    </div>
  );
};
