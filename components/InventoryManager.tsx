import React, { useState, useRef, useEffect } from 'react';
import type { InventoryItem, InventoryUnit, ParsedInventoryCommand } from '../types';
import { PlusIcon, EditIcon, SparklesIcon, MicIcon, WaveIcon, CameraIcon, XIcon, SpinnerIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/formatPrice';
import { analyzeInventoryRisk, parseInventoryVoiceCommand, analyzeInventoryImage } from '../services/geminiService';

interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  adjustStock: (itemId: string, newStock: number) => void;
}

const UNITS: InventoryUnit[] = ['kg', 'g', 'L', 'ml', 'unidad'];

const InventoryItemFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  itemToEdit: InventoryItem | null;
}> = ({ isOpen, onClose, onSave, itemToEdit }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('unidad');
  const [stock, setStock] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');

  React.useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCost(itemToEdit.cost.toString());
      setUnit(itemToEdit.unit);
      setStock(itemToEdit.stock.toString());
      setAlertThreshold(itemToEdit.alertThreshold.toString());
    } else {
      setName('');
      setCost('');
      setUnit('unidad');
      setStock('0');
      setAlertThreshold('0');
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: itemToEdit?.id,
      name,
      cost: parseFloat(cost),
      unit,
      stock: parseFloat(stock) || 0,
      alertThreshold: parseFloat(alertThreshold),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-md border border-[var(--card-border)]">
        <h2 className="text-2xl font-bold mb-6 text-white">{itemToEdit ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nombre del ingrediente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Costo por unidad" value={cost} onChange={e => setCost(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
            <select value={unit} onChange={e => setUnit(e.target.value as InventoryUnit)} className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white">
              {UNITS.map(u => <option key={u} value={u} className="bg-gray-800">{u}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Stock Actual" value={stock} onChange={e => setStock(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
            <input type="number" placeholder="Alerta de Stock Bajo" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} required min="0" step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
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


const StockAdjustModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newStock: number) => void;
    item: InventoryItem;
}> = ({ isOpen, onClose, onSave, item }) => {
    const [adjustment, setAdjustment] = useState('');
    const [action, setAction] = useState<'add' | 'set'>('add');

    const handleSave = () => {
        const value = parseFloat(adjustment);
        if(isNaN(value)) return;
        
        let newStock = item.stock;
        if(action === 'add') {
            newStock += value;
        } else {
            newStock = value;
        }
        onSave(Math.max(0, newStock));
        onClose();
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 w-full max-w-sm border border-[var(--card-border)]">
                <h2 className="text-2xl font-bold mb-2 text-white">Ajustar Stock</h2>
                <p className="text-lg text-[var(--accent-yellow)] mb-6">{item.name}</p>
                <div className="space-y-4">
                    <p className="text-center text-gray-300">Stock Actual: <span className="font-bold text-2xl">{item.stock.toFixed(2)} {item.unit}</span></p>
                    <div className="flex items-center bg-black/20 p-1 rounded-lg border border-[var(--card-border)]">
                        <button onClick={() => setAction('add')} className={`flex-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${action === 'add' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>Añadir / Quitar</button>
                        <button onClick={() => setAction('set')} className={`flex-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${action === 'set' ? 'bg-[var(--primary-red)] text-white' : 'text-gray-300 hover:bg-white/5'}`}>Establecer Total</button>
                    </div>
                    <input type="number" placeholder={action === 'add' ? "Ej: 10 para añadir, -5 para quitar" : "Ej: 50 para establecer a 50"} value={adjustment} onChange={e => setAdjustment(e.target.value)} step="any" className="w-full p-2 border rounded bg-black/20 border-[var(--card-border)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white" />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-white/5 text-gray-200 rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors">Aplicar Ajuste</button>
                </div>
            </div>
        </div>
    );
}

const ScanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    inventoryItems: InventoryItem[];
    adjustStock: (itemId: string, newStock: number) => void;
}> = ({ isOpen, onClose, inventoryItems, adjustStock }) => {
    const [step, setStep] = useState<'setup' | 'capturing' | 'preview' | 'analyzing' | 'results'>('setup');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<Record<string, number> | null>(null);
    const [selectedAdjustments, setSelectedAdjustments] = useState<Record<string, boolean>>({});
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { addToast } = useToast();

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setStep('capturing');
        } catch (err) {
            console.error("Error accessing camera:", err);
            addToast('No se pudo acceder a la cámara. Revisa los permisos.', 'error');
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        if (isOpen && step === 'setup') {
            startCamera();
        }
        if (!isOpen) {
            stopCamera();
            setStep('setup');
            setCapturedImage(null);
            setAnalysisResult(null);
        }
        return () => stopCamera();
    }, [isOpen]);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            setStep('preview');
            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setStep('setup');
    };

    const handleConfirmPhoto = async () => {
        if (!capturedImage) return;
        setStep('analyzing');
        
        // Remove data URL prefix for API
        const base64Data = capturedImage.split(',')[1];

        try {
            const result = await analyzeInventoryImage(base64Data, 'image/jpeg', inventoryItems);
            if(result && Object.keys(result).length > 0) {
                setAnalysisResult(result);
                // Pre-select all found items
                const initialSelections: Record<string, boolean> = {};
                Object.keys(result).forEach(key => { initialSelections[key] = true; });
                setSelectedAdjustments(initialSelections);
                setStep('results');
            } else {
                addToast('La IA no pudo identificar productos. Intenta con una foto más clara.', 'info');
                handleRetake();
            }
        } catch (error) {
            addToast('Error al analizar la imagen.', 'error');
            handleRetake();
        }
    };

    const handleApplyAdjustments = () => {
        if(!analysisResult) return;
        let adjustmentsApplied = 0;
        Object.entries(selectedAdjustments).forEach(([itemId, isSelected]) => {
            if (isSelected) {
                const newStock = analysisResult[itemId];
                if (newStock !== undefined) {
                    adjustStock(itemId, newStock);
                    adjustmentsApplied++;
                }
            }
        });
        addToast(`${adjustmentsApplied} productos actualizados.`, 'success');
        onClose();
    };
    
    const handleToggleSelection = (itemId: string) => {
        setSelectedAdjustments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--card-bg)] rounded-xl p-6 w-full max-w-4xl h-[90vh] flex flex-col border border-teal-500/30">
                <div className="flex justify-between items-center mb-4 flex-none">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CameraIcon /> Escaneo de Inventario IA</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="flex-1 bg-black/20 rounded-lg flex items-center justify-center overflow-hidden">
                    {step === 'capturing' && (
                        <div className="relative w-full h-full">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                            <button onClick={handleTakePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-800 focus:outline-none ring-4 ring-white/30"></button>
                        </div>
                    )}
                    {step === 'preview' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                           <canvas ref={canvasRef} className="max-w-full max-h-[70%] rounded-lg"></canvas>
                           <div className="flex gap-4">
                               <button onClick={handleRetake} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Repetir</button>
                               <button onClick={handleConfirmPhoto} className="px-6 py-2 bg-teal-600 text-white rounded-lg">Confirmar y Analizar</button>
                           </div>
                        </div>
                    )}
                    {step === 'analyzing' && (
                        <div className="text-center">
                            <SpinnerIcon className="w-16 h-16 text-teal-400"/>
                            <p className="mt-4 text-lg text-teal-300">La IA está contando tu inventario...</p>
                        </div>
                    )}
                    {step === 'results' && analysisResult && (
                        <div className="w-full h-full flex flex-col p-4">
                            <h3 className="text-xl font-bold text-white mb-2">Resultados del Análisis</h3>
                            <p className="text-sm text-gray-400 mb-4">Selecciona los productos que deseas actualizar y presiona "Aplicar".</p>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-400 uppercase bg-white/10">
                                        <tr>
                                            <th className="px-4 py-2 w-12"></th>
                                            <th className="px-4 py-2">Producto</th>
                                            <th className="px-4 py-2 text-center">Stock Actual</th>
                                            <th className="px-4 py-2 text-center">Stock Detectado (IA)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white">
                                        {Object.entries(analysisResult).map(([itemId, detectedStock]) => {
                                            const item = inventoryItems.find(i => i.id === itemId);
                                            if (!item) return null;
                                            return (
                                                <tr key={itemId} className="border-b border-gray-700 hover:bg-white/5">
                                                    <td className="px-4 py-3"><input type="checkbox" checked={!!selectedAdjustments[itemId]} onChange={() => handleToggleSelection(itemId)} className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-600"/></td>
                                                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-gray-400">{item.stock.toFixed(2)} {item.unit}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-teal-400 font-bold">{detectedStock} {item.unit}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-gray-700">
                                <button onClick={handleRetake} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Volver a Escanear</button>
                                <button onClick={handleApplyAdjustments} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold">Aplicar Ajustes Seleccionados</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventoryItems, addInventoryItem, updateInventoryItem, adjustStock }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const { addToast } = useToast();
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Scan Modal State
  const [isScanModalOpen, setScanModalOpen] = useState(false);


  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };
  
  const openAdjustModal = (item: InventoryItem) => {
    setItemToAdjust(item);
    setIsAdjustModalOpen(true);
  }

  const handleSave = (item: any) => {
    if (item.id) {
      updateInventoryItem(item);
    } else {
      addInventoryItem(item);
    }
  };

  const handleAnalyzeRisk = async () => {
      setIsAnalyzing(true);
      setAnalysisResult('');
      try {
          const result = await analyzeInventoryRisk(inventoryItems);
          setAnalysisResult(result);
      } catch (e) {
          setAnalysisResult("Error al contactar a la IA.");
      } finally {
          setIsAnalyzing(false);
      }
  }
  
  const handleVoiceCommandResult = (result: ParsedInventoryCommand) => {
      switch (result.intent) {
        case 'adjust': {
            const item = inventoryItems.find(i => i.name.toLowerCase().includes(result.itemName.toLowerCase()));
            if (item && result.adjustStockValue !== undefined) {
                adjustStock(item.id, result.adjustStockValue);
                addToast(`Stock de ${item.name} ajustado a ${result.adjustStockValue}.`, 'success');
            } else {
                addToast(`No encontré el producto "${result.itemName}".`, 'error');
            }
            break;
        }

        case 'create': {
            if (!result.itemData || !result.itemData.name) {
                addToast('Faltan datos para crear el producto.', 'error');
                break;
            }
            const draftItem = {
                id: '', // Empty ID signifies a new item
                name: result.itemData.name,
                cost: result.itemData.cost || 0,
                unit: result.itemData.unit || 'unidad',
                stock: result.itemData.stock || 0,
                alertThreshold: result.itemData.alertThreshold || 0,
            }
            setItemToEdit(draftItem as InventoryItem);
            setIsModalOpen(true);
            addToast(`Revisa los datos para "${result.itemData.name}" y guarda.`, 'info');
            break;
        }
        
        case 'update': {
            const item = inventoryItems.find(i => i.name.toLowerCase().includes(result.itemName.toLowerCase()));
            if (item && result.itemData) {
                const updatedItem = { ...item, ...result.itemData };
                setItemToEdit(updatedItem);
                setIsModalOpen(true);
                addToast(`Revisa la actualización para "${item.name}" y guarda.`, 'info');
            } else {
                 addToast(`No encontré el producto "${result.itemName}" para actualizar.`, 'error');
            }
            break;
        }
    }
  }

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        addToast('Tu navegador no soporta reconocimiento de voz.', 'error');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        addToast(`Error de voz: ${event.error}`, 'error');
        setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        addToast(`Procesando: "${transcript}"`, 'info');
        setIsListening(false);
        
        const result: ParsedInventoryCommand | null = await parseInventoryVoiceCommand(transcript, inventoryItems);
        
        if (result) {
            handleVoiceCommandResult(result);
        } else {
            addToast('No entendí el comando. Intenta de nuevo.', 'error');
        }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div>
        <InventoryItemFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            itemToEdit={itemToEdit}
        />
        {itemToAdjust && (
          <StockAdjustModal
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            onSave={(newStock) => adjustStock(itemToAdjust.id, newStock)}
            item={itemToAdjust}
          />
        )}
        <ScanModal
            isOpen={isScanModalOpen}
            onClose={() => setScanModalOpen(false)}
            inventoryItems={inventoryItems}
            adjustStock={adjustStock}
        />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-white">Gestión de Inventario</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={() => setScanModalOpen(true)} className="flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-700 transition-colors font-semibold">
                <CameraIcon />
                <span className="ml-2 whitespace-nowrap">Escanear con Cámara (IA)</span>
            </button>
            <button onClick={toggleListening} className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors font-semibold ${isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isListening ? <WaveIcon /> : <MicIcon />}
                <span className="ml-2 whitespace-nowrap">{isListening ? 'Escuchando...' : 'Dictar (IA)'}</span>
            </button>
            <button onClick={handleAnalyzeRisk} disabled={isAnalyzing} className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50">
                <SparklesIcon />
                <span className="ml-2 whitespace-nowrap">{isAnalyzing ? '...' : 'Previsión (IA)'}</span>
            </button>
            <button onClick={openAddModal} className="flex items-center justify-center bg-[var(--primary-red)] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[var(--dark-red)] transition-colors font-semibold">
                <PlusIcon />
                <span className="ml-2 whitespace-nowrap">Añadir Ing.</span>
            </button>
        </div>
      </div>
      
      {analysisResult && (
        <div className="bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl mb-6 text-purple-200">
            <h3 className="font-bold mb-1 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Análisis de Riesgo:</h3>
            <p className="whitespace-pre-line">{analysisResult}</p>
        </div>
      )}

      <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--card-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Ingrediente</th>
                <th scope="col" className="px-6 py-3 text-center">Stock Actual</th>
                <th scope="col" className="px-6 py-3 text-center">Unidad</th>
                <th scope="col" className="px-6 py-3">Costo / Unidad</th>
                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => {
                const isLowStock = item.stock <= item.alertThreshold;
                return (
                  <tr key={item.id} className="border-b border-[var(--card-border)] hover:bg-white/5">
                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name}</th>
                    <td className={`px-6 py-4 font-bold text-center ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                        {item.stock.toFixed(2)}
                        {isLowStock && <span className="ml-2 text-xs">(Bajo)</span>}
                    </td>
                    <td className="px-6 py-4 text-center">{item.unit}</td>
                    <td className="px-6 py-4">{formatPrice(item.cost)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openAdjustModal(item)} className="text-amber-400 hover:text-amber-300 mr-4 transition-colors p-2 rounded-full hover:bg-amber-500/10 font-semibold text-xs">AJUSTAR</button>
                      <button onClick={() => openEditModal(item)} className="text-sky-400 hover:text-sky-300 transition-colors p-2 rounded-full hover:bg-sky-500/10"><EditIcon /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};