import React, { useState, useEffect } from 'react';
import type { Table, TableStatus, Zone } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface TableManagerProps {
  tables: Table[];
  zones: Zone[];
  addTable: (table: Omit<Table, 'id' | 'status'>) => void;
  updateTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (zone: Zone) => void;
  deleteZone: (zoneId: string) => Promise<boolean>;
  onOpenTableInPOS: (tableId: string) => void;
  selectedSedeId: string;
}

const statusStyles: { [key in TableStatus]: { dot: string; text: string; bg: string; border: string } } = {
  available: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50' },
  occupied: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-900/50', border: 'border-red-500/80' },
  reserved: { dot: 'bg-sky-400', text: 'text-sky-300', bg: 'bg-sky-900/40', border: 'border-sky-500/50' },
  cleaning: { dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-900/40', border: 'border-amber-500/50' },
};

const statusText: { [key in TableStatus]: string } = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpieza',
};

const TableFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (table: Omit<Table, 'status'>) => void;
    tableToEdit: Omit<Table, 'status'> | null;
    currentZoneId: string;
    selectedSedeId: string;
}> = ({ isOpen, onClose, onSave, tableToEdit, currentZoneId, selectedSedeId }) => {
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');

    useEffect(() => {
        if (tableToEdit) {
            setName(tableToEdit.name);
            setCapacity(tableToEdit.capacity.toString());
        } else {
            setName('');
            setCapacity('');
        }
    }, [tableToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: tableToEdit?.id || '', // id will be replaced for new items
            name,
            capacity: parseInt(capacity, 10) || 0,
            zoneId: tableToEdit ? tableToEdit.zoneId : currentZoneId,
            sedeId: tableToEdit ? tableToEdit.sedeId : selectedSedeId, // Fix: Use selectedSedeId for new tables
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{tableToEdit ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre de la mesa (ej. Mesa 5, Barra 2)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <input type="number" placeholder="Capacidad (asientos)" value={capacity} onChange={e => setCapacity(e.target.value)} required min="1" className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ZoneFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (zone: any) => void;
    zoneToEdit: Zone | null;
    selectedSedeId: string;
}> = ({ isOpen, onClose, onSave, zoneToEdit, selectedSedeId }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if(zoneToEdit) setName(zoneToEdit.name);
        else setName('');
    }, [zoneToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: zoneToEdit?.id,
            name,
            sedeId: zoneToEdit?.sedeId || selectedSedeId // Fix: Use selectedSedeId for new zones
        });
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm">
             <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-6 text-white">{zoneToEdit ? 'Renombrar Salón' : 'Nuevo Salón'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre del Salón (ej. Terraza)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                     <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-[var(--primary-red)] text-white font-semibold rounded-lg hover:bg-[var(--dark-red)] transition-colors">Guardar</button>
                    </div>
                </form>
             </div>
        </div>
    );
}

const TableCard: React.FC<{ 
    table: Table;
    onStatusChange: (status: TableStatus) => void;
    onEdit: () => void;
    onDelete: () => void;
    onOpenPOS: () => void;
}> = ({ table, onStatusChange, onEdit, onDelete, onOpenPOS }) => {
    const styles = statusStyles[table.status];
    return (
        <div className={`bg-[var(--card-bg)] p-4 rounded-xl shadow-md flex flex-col justify-between border ${styles.border} transition-transform hover:scale-105 hover:shadow-2xl`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">{table.name}</h3>
                    <div className="flex gap-1">
                        <button onClick={onEdit} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/10 transition-colors"><EditIcon /></button>
                        <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
                    </div>
                </div>
                <p className="text-sm text-gray-400">{table.capacity} asientos</p>
            </div>
            <div className="mt-4 space-y-2">
                 <div className="flex items-center justify-between w-full p-2 border rounded-md text-sm bg-black/20 border-gray-600/50">
                    <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-2 ${styles.dot}`}></span>
                        <span className={styles.text}>{statusText[table.status]}</span>
                    </div>
                    <select 
                        value={table.status} 
                        onChange={(e) => onStatusChange(e.target.value as TableStatus)}
                        className="bg-transparent border-none focus:ring-0 text-white"
                    >
                        {Object.keys(statusText).map(status => (
                            <option key={status} value={status} className="bg-gray-800">{statusText[status as TableStatus]}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={onOpenPOS} 
                    className="w-full py-2 rounded-md bg-[var(--primary-red)] hover:bg-[var(--dark-red)] text-white text-sm font-bold transition-colors"
                >
                    {table.status === 'occupied' ? 'Editar Orden' : 'Abrir Mesa'}
                </button>
            </div>
        </div>
    );
};

export const TableManager: React.FC<TableManagerProps> = ({ tables, zones, addTable, updateTable, deleteTable, updateTableStatus, addZone, updateZone, deleteZone, onOpenTableInPOS, selectedSedeId }) => {
  const [activeZoneId, setActiveZoneId] = useState<string>(zones[0]?.id || '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<Zone | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
      if (!zones.find(z => z.id === activeZoneId) && zones.length > 0) {
          setActiveZoneId(zones[0].id);
      }
  }, [zones, activeZoneId]);

  const openAddModal = () => {
    if (selectedSedeId === 'global') {
        addToast('Selecciona una sede para añadir mesas.', 'error');
        return;
    }
    setTableToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setTableToEdit(table);
    setIsModalOpen(true);
  };

  const handleSaveTable = (table: Omit<Table, 'status'>) => {
    if (tableToEdit) {
      updateTable({ ...tableToEdit, name: table.name, capacity: table.capacity });
      addToast('Mesa actualizada', 'success');
    } else {
      addTable(table);
      addToast('Mesa añadida', 'success');
    }
  };

  const handleDeleteTable = (tableId: string) => { if (window.confirm("¿Eliminar esta mesa?")) deleteTable(tableId); };
  
  const openAddZoneModal = () => {
      if (selectedSedeId === 'global') {
        addToast('Selecciona una sede para añadir salones.', 'error');
        return;
      }
      setZoneToEdit(null);
      setIsZoneModalOpen(true);
  }

  const openEditZoneModal = (e: React.MouseEvent, zone: Zone) => {
      e.stopPropagation();
      setZoneToEdit(zone);
      setIsZoneModalOpen(true);
  }

  const handleDeleteZone = async (e: React.MouseEvent, zoneId: string) => {
      e.stopPropagation();
      if(window.confirm("¿Seguro? Si hay mesas en este salón, no se podrá eliminar.")) {
          if(await deleteZone(zoneId)) addToast('Salón eliminado', 'success');
      }
  }

  const handleSaveZone = (zone: any) => {
      if (zone.id) {
        updateZone(zone);
        addToast('Salón renombrado', 'success');
      } else {
        addZone(zone);
        addToast('Salón creado', 'success');
      }
  }

  return (
    <div>
      <TableFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTable} 
        tableToEdit={tableToEdit} 
        currentZoneId={activeZoneId} 
        selectedSedeId={selectedSedeId}
      />
      <ZoneFormModal 
        isOpen={isZoneModalOpen} 
        onClose={() => setIsZoneModalOpen(false)} 
        onSave={handleSaveZone} 
        zoneToEdit={zoneToEdit} 
        selectedSedeId={selectedSedeId}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Gestión de Mesas</h2>
        <div className="flex items-center gap-4">
            <button onClick={openAddModal} className="flex items-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow hover:bg-[var(--dark-red)] transition-colors font-semibold">
              <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Mesa</span>
            </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 border-b border-[var(--card-border)]">
          {zones.map(zone => (
              <div key={zone.id} onClick={() => setActiveZoneId(zone.id)} className={`group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer ${activeZoneId === zone.id ? 'bg-[var(--card-bg)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <span>{zone.name}</span>
                  {activeZoneId === zone.id && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => openEditZoneModal(e, zone)} className="text-sky-400"><EditIcon className="w-3 h-3"/></button>
                          <button onClick={(e) => handleDeleteZone(e, zone.id)} className="text-red-400"><TrashIcon className="w-3 h-3"/></button>
                      </div>
                  )}
                  {activeZoneId === zone.id && <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[var(--card-bg)] z-10"></div>}
              </div>
          ))}
          <button onClick={openAddZoneModal} className="flex-shrink-0 flex items-center gap-1 text-sm bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <PlusIcon className="w-4 h-4"/> Nuevo Salón
          </button>
      </div>
      
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map(table => (
            <TableCard key={table.id} table={table} onStatusChange={(s) => updateTableStatus(table.id, s)} onEdit={() => openEditModal(table)} onDelete={() => handleDeleteTable(table.id)} onOpenPOS={() => onOpenTableInPOS(table.id)} />
          ))}
        </div>

      {tables.length === 0 && <p className="text-center py-10 text-gray-500">No hay mesas en esta sede.</p>}

    </div>
  );
};