
import React, { useState, useEffect } from 'react';
import { UserManager } from './UserManager';
import { RoleManager } from './RoleManager';
import { PrinterSettingsManager } from './PrinterSettings';
import type { User, Role, PrinterSettings } from '../types';
import { LockIcon, RefreshIcon, CloudUploadIcon, DownloadIcon, SettingsIcon, UserIcon, ShieldCheckIcon, InventoryIcon, SparklesIcon, CheckCircleIcon, XIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { validateConnection } from '../services/geminiService';

interface AdminSettingsProps {
    users: User[];
    roles: Role[];
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (role: Role) => void;
    deleteRole: (roleId: string) => void;
    printerSettings: PrinterSettings;
    savePrinterSettings: (settings: PrinterSettings) => void;
    onFactoryReset: () => void;
    onImportData: (type: 'menu' | 'inventory', data: any[]) => void;
}

const ApiKeyManagement: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const { addToast } = useToast();

    useEffect(() => {
        const storedKey = localStorage.getItem('GEMINI_API_KEY');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
            addToast('API Key guardada. Reiniciando sistema...', 'success');
            // Force reload to ensure all services pick up the new key
            setTimeout(() => window.location.reload(), 1500);
        } else {
            localStorage.removeItem('GEMINI_API_KEY');
            addToast('API Key eliminada.', 'info');
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    const handleTest = async () => {
        if (!apiKey) {
            addToast('Ingresa una clave para probar.', 'error');
            return;
        }
        setTestStatus('testing');
        // Pass the current apiKey state to validate connection with what is typed
        const isConnected = await validateConnection(apiKey);
        if (isConnected) {
            setTestStatus('success');
            addToast('¡Conexión con IA exitosa!', 'success');
        } else {
            setTestStatus('error');
            addToast('Error de conexión. Verifica la clave.', 'error');
        }
    };

    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)]">
            <div className="border-b border-[var(--card-border)] pb-4 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <SparklesIcon className="text-purple-400"/> Configuración de Inteligencia Artificial
                </h3>
                <p className="text-gray-400 text-sm">Conecta Loco Alitas con Google Gemini para habilitar funciones inteligentes.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Google Gemini API Key</label>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 p-3 rounded bg-black/30 border border-[var(--card-border)] text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-sm"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        La clave se guardará en este dispositivo (Local Storage).
                    </p>
                </div>

                <div className="flex justify-between pt-4 items-center">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleTest}
                            disabled={testStatus === 'testing'}
                            className={`text-sm px-3 py-2 rounded border transition-colors flex items-center gap-2 ${
                                testStatus === 'success' ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20' : 
                                testStatus === 'error' ? 'border-red-500 text-red-400 bg-red-900/20' : 
                                'border-gray-600 text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {testStatus === 'testing' && <SparklesIcon className="w-4 h-4 animate-spin"/>}
                            {testStatus === 'success' && <CheckCircleIcon className="w-4 h-4"/>}
                            {testStatus === 'error' && <XIcon className="w-4 h-4"/>}
                            {testStatus === 'idle' ? 'Probar Conexión' : (testStatus === 'testing' ? 'Verificando...' : (testStatus === 'success' ? 'Conectado' : 'Falló'))}
                        </button>
                    </div>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Guardar y Recargar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DataManagement: React.FC<{
    onFactoryReset: () => void;
    onImportData: (type: 'menu' | 'inventory', data: any[]) => void;
}> = ({ onFactoryReset, onImportData }) => {
    const [confirmReset, setConfirmReset] = useState(false);
    const { addToast } = useToast();

    const downloadTemplate = (type: 'menu' | 'inventory') => {
        let csvContent = "";
        if (type === 'menu') {
            // Added ImagenURL column
            csvContent += "Nombre;Descripcion;Precio;Categoria;ImagenURL\n";
            csvContent += "Hamburguesa Clasica;Deliciosa carne de res con vegetales;25000;Hamburguesas;https://ejemplo.com/foto.jpg\n";
        } else {
            csvContent += "Nombre;Unidad;Costo;Stock;Alerta\n";
            csvContent += "Pan Hamburguesa;unidad;800;50;10\n";
        }
        
        // Use Blob with BOM for Excel UTF-8 compatibility
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `plantilla_${type}_excel.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Improved CSV parser that handles quoted strings and auto-detects delimiter
    const parseCSVLine = (line: string, delimiter: string) => {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (insideQuotes && line[i + 1] === '"') {
                    currentValue += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === delimiter && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        return values;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'menu' | 'inventory') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            if (lines.length < 2) {
                addToast('El archivo parece estar vacío.', 'error');
                return;
            }

            // Auto-detect delimiter (comma or semicolon)
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';

            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const cols = parseCSVLine(line, delimiter);
                
                if (type === 'menu' && cols.length >= 4) {
                     data.push({
                        name: cols[0],
                        description: cols[1],
                        price: parseFloat(cols[2].replace(',', '.')) || 0, // Handle comma decimals if present
                        category: cols[3] || 'General',
                        imageUrl: cols[4] || '', // Map the 5th column to imageUrl
                        hasWings: false,
                        hasFries: false,
                        recipe: []
                    });
                } else if (type === 'inventory' && cols.length >= 5) {
                    data.push({
                        name: cols[0],
                        unit: cols[1],
                        cost: parseFloat(cols[2].replace(',', '.')) || 0,
                        stock: parseFloat(cols[3].replace(',', '.')) || 0,
                        alertThreshold: parseFloat(cols[4].replace(',', '.')) || 0
                    });
                }
            }
            
            if (data.length > 0) {
                onImportData(type, data);
                addToast(`Se han procesado ${data.length} registros.`, 'success');
            } else {
                addToast('No se encontraron datos válidos.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)] space-y-6">
                <div className="border-b border-[var(--card-border)] pb-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CloudUploadIcon className="text-sky-400"/> Importación Masiva
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        Descarga la plantilla, llénala en Excel y súbela. Para imágenes, pega el enlace (URL).
                    </p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg border border-[var(--card-border)]">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-yellow-500"/> Menú
                    </h4>
                    <button onClick={() => downloadTemplate('menu')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-gray-300 flex items-center gap-1 mb-3">
                        <DownloadIcon className="w-3 h-3"/> Plantilla Excel
                    </button>
                    <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'menu')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-sky-900/30 file:text-sky-400 hover:file:bg-sky-900/50 cursor-pointer" />
                </div>
                 <div className="bg-black/20 p-4 rounded-lg border border-[var(--card-border)]">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <InventoryIcon className="w-4 h-4 text-purple-500"/> Inventario
                    </h4>
                    <button onClick={() => downloadTemplate('inventory')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-gray-300 flex items-center gap-1 mb-3">
                        <DownloadIcon className="w-3 h-3"/> Plantilla Excel
                    </button>
                    <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'inventory')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-900/30 file:text-purple-400 hover:file:bg-purple-900/50 cursor-pointer" />
                </div>
            </div>
            <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/30 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-2"><RefreshIcon /> Zona de Peligro</h3>
                    <p className="text-gray-300 text-sm mb-6">Estas acciones son irreversibles.</p>
                </div>
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/20">
                    <h4 className="font-bold text-white mb-2">Reinicio de Fábrica</h4>
                    {!confirmReset ? (
                        <button onClick={() => setConfirmReset(true)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg">Reiniciar Sistema</button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">Cancelar</button>
                            <button onClick={onFactoryReset} className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-500">SÍ, BORRAR</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const AdminSettings: React.FC<AdminSettingsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'printer' | 'data' | 'api'>('users');

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--card-border)]">
                <div className="p-3 bg-[var(--primary-red)] rounded-xl text-white shadow-lg shadow-red-900/20">
                    <LockIcon className="w-8 h-8"/>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-bangers tracking-wide">Panel de Administración</h2>
                    <p className="text-gray-400">Control total sobre usuarios, datos y configuración.</p>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-[var(--card-border)] mb-6 overflow-x-auto pb-1">
                <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 pb-2 px-4 font-semibold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'text-[var(--accent-yellow)] border-b-2 border-[var(--accent-yellow)]' : 'text-gray-400 hover:text-white'}`}><UserIcon className="w-4 h-4"/> Usuarios</button>
                <button onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 pb-2 px-4 font-semibold whitespace-nowrap transition-colors ${activeTab === 'roles' ? 'text-[var(--accent-yellow)] border-b-2 border-[var(--accent-yellow)]' : 'text-gray-400 hover:text-white'}`}><ShieldCheckIcon className="w-4 h-4"/> Roles</button>
                <button onClick={() => setActiveTab('printer')} className={`flex items-center gap-2 pb-2 px-4 font-semibold whitespace-nowrap transition-colors ${activeTab === 'printer' ? 'text-[var(--accent-yellow)] border-b-2 border-[var(--accent-yellow)]' : 'text-gray-400 hover:text-white'}`}><SettingsIcon className="w-4 h-4"/> Negocio</button>
                <button onClick={() => setActiveTab('api')} className={`flex items-center gap-2 pb-2 px-4 font-semibold whitespace-nowrap transition-colors ${activeTab === 'api' ? 'text-[var(--accent-yellow)] border-b-2 border-[var(--accent-yellow)]' : 'text-gray-400 hover:text-white'}`}><SparklesIcon className="w-4 h-4"/> IA & API</button>
                <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 pb-2 px-4 font-semibold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'text-[var(--accent-yellow)] border-b-2 border-[var(--accent-yellow)]' : 'text-gray-400 hover:text-white'}`}><CloudUploadIcon className="w-4 h-4"/> Datos</button>
            </div>
            
            <div className="min-h-[400px]">
                {activeTab === 'users' && <UserManager users={props.users} roles={props.roles} addUser={props.addUser} updateUser={props.updateUser} deleteUser={props.deleteUser} />}
                {activeTab === 'roles' && <RoleManager roles={props.roles} addRole={props.addRole} updateRole={props.updateRole} deleteRole={props.deleteRole} />}
                {activeTab === 'printer' && <PrinterSettingsManager settings={props.printerSettings} onSave={props.savePrinterSettings} />}
                {activeTab === 'api' && <ApiKeyManagement />}
                {activeTab === 'data' && <DataManagement onFactoryReset={props.onFactoryReset} onImportData={props.onImportData} />}
            </div>
        </div>
    );
}
