
import React, { useState, useEffect } from 'react';
import type { PrinterSettings, PurchasingContact } from '../types';
import { SettingsIcon, SparklesIcon, PrinterIcon, CheckCircleIcon, XIcon, MotorcycleIcon, UserIcon, PlusIcon, TrashIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { bluetoothPrinter } from '../services/printerService';

interface PrinterSettingsProps {
    settings: PrinterSettings;
    onSave: (settings: PrinterSettings) => void;
}

export const PrinterSettingsManager: React.FC<PrinterSettingsProps> = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<PrinterSettings>(settings);
    // UI State for connection
    const [isConnected, setIsConnected] = useState(bluetoothPrinter.isConnected());
    const [connectionStatus, setConnectionStatus] = useState(''); // Text status from service
    const [isConnecting, setIsConnecting] = useState(false);
    
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    
    const { addToast } = useToast();

    useEffect(() => {
        setLocalSettings(settings);
        // Initial check
        setIsConnected(bluetoothPrinter.isConnected());

        // Subscribe to service updates (Auto-reconnect listener)
        bluetoothPrinter.setOnStateChange((connected, msg) => {
            setIsConnected(connected);
            if (msg) setConnectionStatus(msg);
            
            if (connected) {
                setConnectionStatus('Conectado');
                // Optional: addToast('Impresora reconectada', 'success'); 
            }
        });

        // Cleanup not strictly necessary for singleton, but good practice to avoid leaks if component unmounts
        return () => {
            bluetoothPrinter.setOnStateChange(() => {}); 
        }
    }, [settings]);

    const handleChange = (field: keyof PrinterSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(localSettings);
        addToast('Configuración de negocio guardada', 'success');
    };

    const handleBluetoothConnect = async () => {
        setIsConnecting(true);
        setConnectionStatus('Buscando...');
        try {
            const deviceName = await bluetoothPrinter.connect();
            setIsConnected(true);
            handleChange('bluetoothDeviceName', deviceName);
            addToast(`Conectado a ${deviceName}`, 'success');
        } catch (error: any) {
            console.error(error);
            addToast(`Error: ${error.message}`, 'error');
            setIsConnected(false);
            setConnectionStatus('Error de conexión');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleBluetoothDisconnect = () => {
        bluetoothPrinter.disconnect();
        setIsConnected(false);
        setConnectionStatus('Desconectado');
        addToast('Impresora desconectada', 'info');
    }

    const testPrint = async () => {
        if (isConnected) {
            try {
                // Simple text print for test
                const encoder = new TextEncoder();
                const data = encoder.encode("\x1B\x40" + "\x1B\x61\x01" + "TEST DE IMPRESION\n" + "LOCO ALITAS\n\n\n\n");
                await bluetoothPrinter.printData(data);
                addToast('Prueba enviada a Bluetooth', 'success');
            } catch (e) {
                addToast('Error al imprimir', 'error');
            }
        } else {
            window.print();
        }
    };
    
    const handleAddContact = () => {
        if (!contactName || !contactPhone) {
            addToast('Nombre y teléfono requeridos.', 'error');
            return;
        }
        
        const currentContacts = localSettings.purchasingContacts || [];
        if (currentContacts.length >= 3) {
            addToast('Máximo 3 encargados.', 'error');
            return;
        }
        
        const newContact: PurchasingContact = { name: contactName, phone: contactPhone };
        const updatedContacts = [...currentContacts, newContact];
        
        setLocalSettings(prev => ({ ...prev, purchasingContacts: updatedContacts }));
        setContactName('');
        setContactPhone('');
    }
    
    const handleRemoveContact = (index: number) => {
        const currentContacts = localSettings.purchasingContacts || [];
        const updatedContacts = currentContacts.filter((_, i) => i !== index);
        setLocalSettings(prev => ({ ...prev, purchasingContacts: updatedContacts }));
    }

    return (
        <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)] p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--card-border)] pb-4">
                <SettingsIcon className="w-6 h-6 text-[var(--primary-red)]"/>
                <h3 className="text-xl font-bold text-white">Configuración de Negocio (Universal)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-300">Datos del Negocio</h4>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Nombre del Negocio</label>
                        <input type="text" value={localSettings.shopName} onChange={e => handleChange('shopName', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Slogan / Frase</label>
                        <input type="text" value={localSettings.shopSlogan} onChange={e => handleChange('shopSlogan', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" placeholder="La Mente Maestra en Tu Cocina" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Dirección</label>
                        <input type="text" value={localSettings.shopAddress} onChange={e => handleChange('shopAddress', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                            <input type="text" value={localSettings.shopPhone} onChange={e => handleChange('shopPhone', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">NIT / RUT</label>
                            <input type="text" value={localSettings.shopNit} onChange={e => handleChange('shopNit', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Redes Sociales (Instagram/FB)</label>
                        <input type="text" value={localSettings.socialMedia} onChange={e => handleChange('socialMedia', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" placeholder="@tu_negocio" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Mensaje Pie de Página (Recibo)</label>
                        <textarea value={localSettings.footerMessage} onChange={e => handleChange('footerMessage', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]" rows={2} />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                        <h5 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                            <MotorcycleIcon className="w-4 h-4" /> Empresa de Domicilios (Provider)
                        </h5>
                        
                        <div className="mb-3">
                            <label className="block text-sm text-gray-400 mb-1">Nombre de la Empresa</label>
                            <input type="text" value={localSettings.deliveryProviderName || ''} onChange={e => handleChange('deliveryProviderName', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-purple-500" placeholder="Ej: Flash Domicilios" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">WhatsApp de la Empresa (Provider)</label>
                            <input type="text" value={localSettings.deliveryProviderPhone || ''} onChange={e => handleChange('deliveryProviderPhone', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-purple-500" placeholder="57300..." />
                            <p className="text-xs text-gray-500 mt-1">El sistema enviará las cotizaciones y ubicaciones a este número.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-[var(--card-border)]">
                        <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> Encargados de Compras
                        </h4>
                        <p className="text-xs text-gray-400 mb-3">
                            Añade hasta 3 personas para enviarles la lista de compras por WhatsApp.
                        </p>
                        
                        <div className="space-y-2 mb-4">
                            {localSettings.purchasingContacts && localSettings.purchasingContacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded">
                                    <div className="text-sm">
                                        <span className="text-white font-bold">{contact.name}</span>
                                        <span className="text-gray-400 ml-2">{contact.phone}</span>
                                    </div>
                                    <button onClick={() => handleRemoveContact(idx)} className="text-red-400 hover:text-red-300 p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!localSettings.purchasingContacts || localSettings.purchasingContacts.length === 0) && (
                                <p className="text-sm text-gray-500 italic">No hay encargados configurados.</p>
                            )}
                        </div>

                        {(!localSettings.purchasingContacts || localSettings.purchasingContacts.length < 3) && (
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full p-1.5 rounded bg-black/40 border border-gray-600 text-white text-sm" placeholder="Ej: Juan" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Teléfono</label>
                                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full p-1.5 rounded bg-black/40 border border-gray-600 text-white text-sm" placeholder="300123..." />
                                </div>
                                <button onClick={handleAddContact} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded h-8 w-8 flex items-center justify-center">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <h4 className="font-semibold text-gray-300 mt-4">Opciones de Hardware / Impresión</h4>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Tamaño de Papel</label>
                        <select value={localSettings.paperSize} onChange={e => handleChange('paperSize', e.target.value)} className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-[var(--primary-red)]">
                            <option value="58mm">58mm (Impresora Móvil Bluetooth)</option>
                            <option value="80mm">80mm (Estándar Mostrador)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            * El sistema se adapta automáticamente. Usa el diálogo de impresión del sistema para seleccionar tu impresora Bluetooth o USB.
                        </p>
                    </div>
                     
                     {/* Bluetooth Direct Connection Logic */}
                     <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                        <h5 className="text-sm font-bold text-blue-300 flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> Impresora Bluetooth (GOOJPRT PT-210)</h5>
                        <p className="text-xs text-blue-200 mt-1 mb-3">
                            Conecta directamente tu impresora portátil sin usar el diálogo de Chrome.
                            <br/>
                            <span className="text-orange-300 text-[10px]">* Si se desconecta, el sistema intentará reconectar 5 veces automáticamente.</span>
                        </p>
                        
                        {isConnected ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                                        <CheckCircleIcon className="w-5 h-5"/>
                                        Conectado
                                    </div>
                                    <button onClick={handleBluetoothDisconnect} className="text-xs bg-red-900/50 hover:bg-red-900 text-red-300 border border-red-500/50 px-3 py-1.5 rounded">
                                        Desconectar
                                    </button>
                                </div>
                                {connectionStatus && <p className="text-[10px] text-gray-400 italic">{connectionStatus}</p>}
                            </div>
                        ) : (
                            <div>
                                <button 
                                    onClick={handleBluetoothConnect} 
                                    disabled={isConnecting}
                                    className={`w-full ${isConnecting ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-bold px-3 py-2 rounded flex justify-center items-center gap-2`}
                                >
                                    {isConnecting ? <SparklesIcon className="animate-spin"/> : <PrinterIcon className="w-4 h-4"/>}
                                    {isConnecting ? 'Conectando...' : 'Conectar Impresora'}
                                </button>
                                {connectionStatus && <p className="text-[10px] text-orange-400 mt-2 text-center animate-pulse">{connectionStatus}</p>}
                            </div>
                        )}
                     </div>

                     <h4 className="font-semibold text-gray-300 mt-4">Automatización</h4>
                     <div className="flex items-center gap-2">
                        <input type="checkbox" checked={localSettings.autoPrintReceipt} onChange={e => handleChange('autoPrintReceipt', e.target.checked)} className="rounded border-gray-600 bg-black/20 text-[var(--primary-red)]" />
                        <label className="text-sm text-gray-400">Imprimir Recibo al cobrar (Automático)</label>
                     </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h5 className="font-semibold text-amber-400 mb-3">Monitor de Cocina</h5>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Tiempo de Alerta (minutos)</label>
                            <input 
                                type="number" 
                                value={localSettings.kitchenTimer || 12} 
                                onChange={e => handleChange('kitchenTimer', parseInt(e.target.value, 10) || 12)} 
                                className="w-full p-2 rounded bg-black/20 border border-[var(--card-border)] text-white focus:border-amber-500" 
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Cuenta regresiva para alertas visuales en el monitor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-6 border-t border-[var(--card-border)] pt-4">
                 <button onClick={testPrint} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold">
                    Prueba de Impresión
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-[var(--primary-red)] hover:bg-[var(--dark-red)] text-white rounded-lg transition-colors font-semibold">
                    Guardar Configuración
                </button>
            </div>
        </div>
    );
};
