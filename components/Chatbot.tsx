import React, { useState, useEffect, useRef } from 'react';
import { getProfeLocoActionOrResponse } from '../services/geminiService';
import { XIcon, SendIcon, BrainCircuitIcon, MicIcon, WaveIcon } from './Icons';
import type { ProfeLocoAction } from '../types';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onExecuteAction: (action: ProfeLocoAction) => Promise<string>;
}

interface Message {
    role: 'user' | 'bot';
    text: string;
}

const PROMPT_STARTERS = [
    "Añade un gasto de 50.000 para proveedores por papas",
    "¿Cuánto vendimos hoy?",
    "Llévame al inventario",
    "¿Cómo creo un nuevo rol de usuario?",
];

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onExecuteAction }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ role: 'bot', text: "¡Hola, soy el Profe Loco! 👨‍🏫 Dime qué necesitas. Puedes pedirme que añada gastos, te de estadísticas o que te lleve a una sección. ¡Pruébame!" }]);
        }
    }, [isOpen, messages.length]);

    const handleSend = async (predefinedQuery?: string) => {
        const query = predefinedQuery || input;
        if (query.trim() === '' || isLoading) return;

        const userMessage: Message = { role: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatHistory = messages.map(m => ({
                role: m.role === 'bot' ? 'model' : 'user',
                parts: [{ text: m.text }]
            })).slice(1); // Exclude initial greeting

            const response = await getProfeLocoActionOrResponse(query, chatHistory);
            
            let botMessage: Message;

            if (response.type === 'function_call' && response.functionCall) {
                const resultText = await onExecuteAction(response.functionCall);
                botMessage = { role: 'bot', text: resultText };
            } else if (response.text) {
                botMessage = { role: 'bot', text: response.text };
            } else {
                botMessage = { role: 'bot', text: response.clarification || 'No entendí muy bien. ¿Puedes repetirlo de otra forma? 🤔' };
            }
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'bot', text: '¡Uy! Mi cerebro de IA tuvo un corto circuito. Inténtalo de nuevo.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Tu navegador no soporta reconocimiento de voz.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CO';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSend(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-full max-h-[600px] z-50 flex flex-col animate-slideInUp">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl flex flex-col h-full border border-purple-500/30">
                <header className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-800 to-blue-800 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <BrainCircuitIcon className="w-7 h-7 text-white"/>
                        <h2 className="text-lg font-bold text-white">Profe Loco - Asistente IA</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-300 hover:bg-white/20">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white/10 text-gray-200 rounded-bl-none">
                                <p className="text-sm animate-pulse">Pensando...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                     <div className="p-4 border-t border-purple-500/20">
                        <p className="text-xs text-gray-400 mb-2 font-semibold">O intenta con esto:</p>
                        <div className="flex flex-wrap gap-2">
                            {PROMPT_STARTERS.map(prompt => (
                                <button key={prompt} onClick={() => handleSend(prompt)} className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-500/40">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="p-4 border-t border-purple-500/20">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleListening}
                            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 text-gray-300 hover:text-purple-400'}`}
                            title="Hablar"
                        >
                            {isListening ? <WaveIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        </button>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Habla con el Profe Loco..."
                                className="w-full p-3 pr-12 rounded-lg bg-black/20 border-gray-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-500"
                                disabled={isLoading}
                            />
                            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-400 hover:text-purple-400 disabled:opacity-50">
                               <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};